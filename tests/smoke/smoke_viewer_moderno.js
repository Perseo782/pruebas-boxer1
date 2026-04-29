"use strict";

const assert = require("assert");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "../..");
const PORT = 8127;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DATA_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='600'%3E%3Crect width='900' height='600' fill='%23eee'/%3E%3Ctext x='60' y='120' font-size='48'%3Etest%3C/text%3E%3C/svg%3E";

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
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      res.end(body);
    });
  });
  return new Promise((resolve) => {
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

async function assertCleanViewer(page) {
  assert.strictEqual(await page.locator("#viewer-title").count(), 0);
  assert.strictEqual(await page.locator("#viewer-meta").count(), 0);
  assert.strictEqual(await page.locator("#viewer-zoom-out").count(), 0);
  assert.strictEqual(await page.locator("#viewer-zoom-in").count(), 0);
  assert.strictEqual(await page.locator("#viewer-zoom-reset").count(), 0);
  await page.locator("#viewer-close").waitFor({ state: "attached", timeout: 5000 });
}

async function getTransform(page) {
  return page.locator("#viewer-image").evaluate((img) => getComputedStyle(img).transform);
}

async function dispatchPointer(page, type, id, x, y) {
  await page.evaluate((payload) => {
    const { eventType, pointerId, clientX, clientY } = payload;
    const stage = document.querySelector("#viewer-stage");
    if (!stage) throw new Error("No existe viewer-stage");
    const event = new PointerEvent(eventType, {
      bubbles: true,
      cancelable: true,
      pointerId,
      pointerType: "touch",
      clientX,
      clientY
    });
    stage.dispatchEvent(event);
  }, { eventType: type, pointerId: id, clientX: x, clientY: y });
}

async function verifyGestures(page) {
  const initial = await getTransform(page);
  await page.locator("#viewer-stage").dispatchEvent("wheel", { deltaY: -320 });
  const afterWheel = await getTransform(page);
  assert.notStrictEqual(afterWheel, initial, "La rueda debe ampliar la imagen.");

  await dispatchPointer(page, "pointerdown", 7, 450, 360);
  await dispatchPointer(page, "pointermove", 7, 520, 410);
  await dispatchPointer(page, "pointerup", 7, 520, 410);
  const afterDrag = await getTransform(page);
  assert.notStrictEqual(afterDrag, afterWheel, "El arrastre debe mover la imagen ampliada.");

  await dispatchPointer(page, "pointerdown", 1, 330, 330);
  await dispatchPointer(page, "pointerdown", 2, 430, 330);
  await dispatchPointer(page, "pointermove", 1, 280, 330);
  await dispatchPointer(page, "pointermove", 2, 480, 330);
  await dispatchPointer(page, "pointerup", 1, 280, 330);
  await dispatchPointer(page, "pointerup", 2, 480, 330);
  const afterPinch = await getTransform(page);
  assert.notStrictEqual(afterPinch, afterDrag, "El gesto con dos dedos debe cambiar el zoom.");
}

function verifyGestionMarkup() {
  const html = fs.readFileSync(path.join(ROOT, "frontend", "pantallas", "gestion_registros.html"), "utf8");
  const js = fs.readFileSync(path.join(ROOT, "frontend", "estado", "gestion_registros_app.js"), "utf8");
  assert(!html.includes("viewer-title"), "Gestion no debe pintar titulo en el visor.");
  assert(!html.includes("viewer-meta"), "Gestion no debe pintar meta de zoom en el visor.");
  assert(!html.includes("viewer-zoom-out"), "Gestion no debe pintar Zoom -.");
  assert(!html.includes("viewer-zoom-in"), "Gestion no debe pintar Zoom +.");
  assert(!html.includes("viewer-zoom-reset"), "Gestion no debe pintar Centrar.");
  assert(!html.includes("Zoom x1.00"), "Gestion no debe pintar texto de zoom.");
  assert(!js.includes("viewerMeta"), "Gestion no debe actualizar texto de zoom.");
  assert(!js.includes("viewerZoom"), "Gestion no debe depender de botones de zoom.");
  assert(js.includes("pointerdown"), "Gestion debe mantener gesto tactil.");
  assert(js.includes("wheel"), "Gestion debe mantener zoom con rueda.");
}

async function verifyRevision(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/frontend/pantallas/revision.html`);
  await page.waitForLoadState("load");
  await page.locator("#viewer-modal").waitFor({ state: "attached", timeout: 5000 });
  await assertCleanViewer(page);
  await page.evaluate((src) => {
    const modal = document.querySelector("#viewer-modal");
    const img = document.querySelector("#viewer-image");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    img.src = src;
    img.style.transform = "translate(-50%, -50%) translate(0px, 0px) scale(1)";
  }, DATA_IMAGE);
  await verifyGestures(page);
  await page.locator("#viewer-close").click();
  await page.close();
}

async function run() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    verifyGestionMarkup();
    await verifyRevision(browser);
    console.log("OK smoke_viewer_moderno");
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
