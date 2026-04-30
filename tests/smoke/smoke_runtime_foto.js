"use strict";

const assert = require("assert");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "../..");
const PORT = 8128;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const BUNDLE_PATH = "/frontend/estado/photo_analysis_runtime_bundle.js";
const LEGACY_RUNTIME_PARTS = [
  "/backend/boxer1/backend/operativa/B1_enums.js",
  "/backend/boxer1/backend/operativa/B1_core.js",
  "/frontend/ia/boxer2_identidad.js",
  "/frontend/ia/boxer3_peso_formato.js",
  "/frontend/ia/boxer4_alergenos.js",
  "/frontend/ia/cerebro_orquestador.js"
];

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".ttf")) return "font/ttf";
  return "application/octet-stream";
}

function startServer() {
  const server = http.createServer((req, res) => {
    const requestPath = decodeURIComponent(new URL(req.url, BASE_URL).pathname);
    const filePath = path.normalize(path.join(ROOT, requestPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (error, body) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      if (filePath.endsWith(path.normalize("frontend/estado/app_state_guard.js"))) {
        body = Buffer.from(
          String(body).replace("scope.location.href = target;", "scope.__runtimeSmokeRedirectTarget = target;"),
          "utf8"
        );
      }
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      res.end(body);
    });
  });
  return new Promise((resolve) => {
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

function greenResponse() {
  return {
    ok: true,
    resultado: {
      estadoPasaporteModulo: "VERDE",
      elapsedMs: 12,
      datos: {
        analysisId: `analysis_${Date.now()}`,
        traceId: `trace_${Date.now()}`,
        decision: {
          pasaporte: "VERDE",
          decisionFlujo: "guardar",
          mensajePasaporteCorto: ""
        },
        propuestaFinal: {
          nombre: "Buñuelos de bacalao",
          formato: "1 kg",
          formatoNormalizado: "1 kg",
          tipoFormato: "peso",
          alergenos: []
        },
        ia: { huboLlamada: false },
        modulos: {}
      }
    },
    metricas: { eventos: [] }
  };
}

async function preparePage(page) {
  await page.addInitScript(() => {
    localStorage.setItem("fase5_visible_session_token", "test_token");
    sessionStorage.setItem("alergenos_session_token", "test_token");
    sessionStorage.setItem("alergenos_access_ok", "1");
  });
  await page.goto(`${BASE_URL}/frontend/pantallas/gestion_registros.html`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("domcontentloaded");
  await page.locator("#analyze-photo-product").waitFor({ state: "attached", timeout: 5000 });
}

async function installFakeAnalysis(page) {
  await page.evaluate((response) => {
    window.Fase3AltaFotoVisibleApp.ejecutarAnalisisVisible = async () => response;
  }, greenResponse());
}

async function attachTinyPhoto(page) {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64"
  );
  await page.setInputFiles("#add-photo-file-1", {
    name: "bunuelos.png",
    mimeType: "image/png",
    buffer: png
  });
}

async function clickAnalyze(page) {
  await attachTinyPhoto(page);
  await page.evaluate(() => document.querySelector("#analyze-photo-product").click());
  await page.waitForFunction(() => {
    const snapshot = window.AnalysisExclusiveRuntime && window.AnalysisExclusiveRuntime.snapshot();
    const session = snapshot && (snapshot.currentSession || snapshot.completedSessions[0]);
    return !!(session && session.events && session.events.some((event) => event.trace === "cerebro_call_start"));
  }, null, { timeout: 10000 });
}

async function getRuntimeTrace(page) {
  return page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem("appv2_photo_runtime_trace_v1") || "[]");
    } catch (error) {
      return [];
    }
  });
}

async function getLatestAnalysisEvents(page) {
  return page.evaluate(() => {
    const snapshot = window.AnalysisExclusiveRuntime.snapshot();
    const session = snapshot.currentSession || snapshot.completedSessions[0];
    return session ? session.events : [];
  });
}

function elapsedBetween(events, startName, endName) {
  const start = events.find((event) => event.trace === startName);
  const end = events.find((event) => event.trace === endName);
  assert(start, `Falta traza ${startName}`);
  assert(end, `Falta traza ${endName}`);
  return end.atMs - start.atMs;
}

async function verifyReadyFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const requests = [];
  page.on("request", (request) => requests.push(new URL(request.url()).pathname));
  await preparePage(page);
  await page.waitForFunction(() => !!window.CerebroOrquestador, null, { timeout: 8000 });
  await installFakeAnalysis(page);
  await clickAnalyze(page);

  const trace = await getRuntimeTrace(page);
  assert(trace.some((event) => event.trace === "runtime_preload_start"), "No se registro runtime_preload_start");
  assert(trace.some((event) => event.trace === "runtime_preload_done" && event.data && event.data.ready === true), "No se registro runtime_preload_done listo");
  assert.strictEqual(requests.filter((item) => item === BUNDLE_PATH).length, 1, "El bundle no debe cargarse mas de una vez");
  assert.strictEqual(requests.filter((item) => LEGACY_RUNTIME_PARTS.includes(item)).length, 0, "No debe cargar scripts legacy si carga el bundle");

  const events = await getLatestAnalysisEvents(page);
  assert(events.some((event) => event.trace === "runtime_already_ready"), "El analisis listo debe marcar runtime_already_ready");
  const gap = elapsedBetween(events, "photo_read_done", "cerebro_call_start");
  assert(gap < 500, `photo_read_done -> cerebro_call_start debe ser menor de 0,5 s, fue ${gap} ms`);
  await page.close();
  return gap;
}

async function verifyWaitsExistingPromise(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const requests = [];
  await page.route(`**${BUNDLE_PATH}*`, async (route) => {
    requests.push(new URL(route.request().url()).pathname);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    route.continue();
  });
  const preloadRequest = page.waitForRequest((request) => new URL(request.url()).pathname === BUNDLE_PATH, { timeout: 5000 });
  await preparePage(page);
  await preloadRequest;
  await installFakeAnalysis(page);
  await clickAnalyze(page);
  const events = await getLatestAnalysisEvents(page);
  assert(events.some((event) => event.trace === "runtime_late_wait_start"), "Debe esperar la promesa de precarga ya iniciada");
  assert(events.some((event) => event.trace === "runtime_late_wait_done"), "Debe cerrar la espera tardia");
  assert.strictEqual(requests.length, 1, "No debe duplicar el bundle durante la espera");
  await page.close();
}

async function verifyMobileEntry(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await preparePage(page);
  await page.locator("#open-add-product").waitFor({ state: "attached", timeout: 5000 });
  const canOpen = await page.evaluate(() => {
    const button = document.querySelector("#open-add-product");
    button.click();
    return !document.querySelector("#add-product-modal").hidden;
  });
  assert.strictEqual(canOpen, true, "En movil la UI debe seguir respondiendo mientras se precarga");
  await page.close();
}

async function run() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const readyGap = await verifyReadyFlow(browser);
    await verifyWaitsExistingPromise(browser);
    await verifyMobileEntry(browser);
    console.log(`OK smoke_runtime_foto ready_gap_ms=${readyGap}`);
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
