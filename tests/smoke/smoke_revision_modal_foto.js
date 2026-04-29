"use strict";

const assert = require("assert");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "../..");
const PORT = 8126;
const BASE_URL = `http://127.0.0.1:${PORT}`;

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

function makeGreenResponse() {
  return {
    ok: true,
    resultado: {
      datos: {
        analysisId: "analysis_test",
        traceId: "trace_test",
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
        }
      }
    }
  };
}

function verifyDataFlow() {
  const api = require("../../frontend/estado/gestion_registros_app.js");
  const arbitraje = require("../../frontend/estado/cerebro_arbitraje.js");
  const state = {
    ui: {
      add: {
        nombre: "",
        formato: "",
        formatoNormalizado: "",
        tipoFormato: "desconocido",
        selectedAllergenIds: []
      }
    }
  };

  api.applyPhotoAnalysisToAddModal(state, makeGreenResponse(), "guardado", {
    fotoRefs: [],
    visuales: []
  });

  assert.strictEqual(state.ui.add.nombre, "Buñuelos de bacalao");
  assert.strictEqual(state.ui.add.formato, "1 kg");
  assert.strictEqual(state.ui.add.formatoNormalizado, "1 kg");

  const message = api.buildPhotoAnalysisStatus(makeGreenResponse(), "guardado");
  assert.strictEqual(message, "Pasaporte VERDE.");
  assert(!message.includes("Buñuelos"));
  assert(!message.includes("1 kg"));

  assert.strictEqual(
    arbitraje.buildShortPassportMessage({ passport: "NARANJA" }, {}, { boxer2: { passport: "NARANJA" } }),
    "Revisa nombre"
  );
  assert.strictEqual(
    arbitraje.buildShortPassportMessage({ passport: "NARANJA" }, {}, { boxer3: { passport: "ROJO" } }),
    "Revisa formato"
  );
  assert.strictEqual(
    arbitraje.buildShortPassportMessage({ passport: "ROJO" }, {}, { boxer4: { passport: "NARANJA" } }),
    "Revisa alergenos"
  );
  assert.strictEqual(
    api.buildPhotoAnalysisStatus({
      resultado: { datos: { decision: { pasaporte: "NARANJA", mensajePasaporteCorto: "Revisa formato" } } }
    }, "revision"),
    "Pasaporte NARANJA. Revisa formato antes de guardar."
  );
  assert.strictEqual(
    api.buildPhotoAnalysisStatus({
      resultado: { datos: { decision: { pasaporte: "NARANJA", mensajePasaporteCorto: "Revisa nombre" } } }
    }, "revision"),
    "Pasaporte NARANJA. Revisa nombre antes de guardar."
  );
  assert.strictEqual(
    api.buildPhotoAnalysisStatus({
      resultado: { datos: { decision: { pasaporte: "ROJO", mensajePasaporteCorto: "Revisa alergenos" } } }
    }, "bloqueado"),
    "Pasaporte ROJO. Revisa alergenos antes de guardar."
  );
  assert.strictEqual(
    api.buildPhotoAnalysisStatus({
      resultado: { datos: { decision: { pasaporte: "NARANJA", mensajePasaporteCorto: "Revisa nombre, formato y alergenos" } } }
    }, "revision"),
    "Pasaporte NARANJA. Revisa nombre, formato y alergenos antes de guardar."
  );
}

async function verifyLayout(viewport, expectedAlign) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  await page.addInitScript(() => {
    localStorage.setItem("fase5_visible_session_token", "test_token");
    sessionStorage.setItem("alergenos_access_ok", "1");
  });
  try {
    await page.goto(`${BASE_URL}/frontend/pantallas/gestion_registros.html`);
    await page.waitForLoadState("load");
    await page.locator("#add-product-modal").waitFor({ state: "attached", timeout: 5000 });
    await page.evaluate(() => {
      const modal = document.querySelector("#add-product-modal");
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.querySelector("#add-modal-title").textContent = "Confirmar producto analizado";
      document.querySelector("#add-manual-title").textContent = "Resultado del análisis de foto";
      const status = document.querySelector("#add-photo-status");
      status.hidden = false;
      status.textContent = "Pasaporte VERDE.";
      status.classList.add("is-passport-green");
      document.querySelector("#add-product-name").value = "Buñuelos de bacalao";
      document.querySelector("#add-product-format").value = "1 kg";
      document.querySelector("#add-photo-pane").hidden = true;
    });

    const info = await page.evaluate((expected) => {
      const viewportHeight = window.innerHeight;
      const modal = document.querySelector("#add-product-modal");
      const panel = document.querySelector("#add-product-modal .sheet-panel");
      const name = document.querySelector("#add-product-name");
      const format = document.querySelector("#add-product-format");
      const status = document.querySelector("#add-photo-status");
      const save = document.querySelector("#save-add-product");
      const cancel = document.querySelector("#cancel-add-product");
      const modalStyle = getComputedStyle(modal);
      const panelBox = panel.getBoundingClientRect();
      const saveBox = save.getBoundingClientRect();
      panel.scrollTop = panel.scrollHeight;
      const cancelBox = cancel.getBoundingClientRect();
      return {
        alignItems: modalStyle.alignItems,
        expected,
        panelTop: panelBox.top,
        panelBottom: panelBox.bottom,
        viewportHeight,
        panelHasInternalScroll: panel.scrollHeight > panel.clientHeight,
        name: name.value,
        format: format.value,
        status: status.textContent,
        saveVisible: saveBox.top >= 0 && saveBox.bottom <= viewportHeight,
        cancelReachable: cancelBox.top >= 0 && cancelBox.bottom <= viewportHeight
      };
    }, expectedAlign);

    assert.strictEqual(info.name, "Buñuelos de bacalao");
    assert.strictEqual(info.format, "1 kg");
    assert.strictEqual(info.status, "Pasaporte VERDE.");
    assert(!info.status.includes("Buñuelos"));
    assert(!info.status.includes("1 kg"));
    assert(info.panelTop >= 0, `Panel sale por arriba: ${JSON.stringify(info)}`);
    assert(info.panelBottom <= info.viewportHeight, `Panel sale por abajo: ${JSON.stringify(info)}`);
    assert(info.saveVisible, `Guardar no queda visible: ${JSON.stringify(info)}`);
    assert(info.cancelReachable, `Cancelar no queda accesible: ${JSON.stringify(info)}`);
    assert.strictEqual(info.alignItems, expectedAlign);
  } finally {
    await browser.close();
  }
}

async function run() {
  verifyDataFlow();
  const server = await startServer();
  try {
    await verifyLayout({ width: 1280, height: 720 }, "center");
    await verifyLayout({ width: 390, height: 844 }, "end");
    console.log("OK smoke_revision_modal_foto");
  } finally {
    server.close();
  }
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
