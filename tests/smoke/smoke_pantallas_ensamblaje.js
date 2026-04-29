"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "../..");
const PORT = 8125;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const PAGES = [
  { path: "/index.html", expectUrl: "acceso.html", selector: "#access-form" },
  { path: "/frontend/pantallas/acceso.html", selector: "#access-form" },
  { path: "/frontend/pantallas/gestion_registros.html", expectUrl: "acceso.html", selector: "#access-form" },
  { path: "/frontend/pantallas/ajustes.html", selector: "#fase11-copy" },
  { path: "/frontend/pantallas/alta_manual.html", selector: "#alta-manual-form" },
  { path: "/frontend/pantallas/alta_foto.html", selector: "body" },
  { path: "/frontend/pantallas/revision.html", selector: "body" },
  { path: "/frontend/pantallas/lote.html", selector: "body" },
  { path: "/frontend/pantallas/importar_excel.html", selector: "#import-file" },
  { path: "/frontend/pantallas/exportar_excel.html", selector: "#export-run" }
];

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".ttf")) return "font/ttf";
  if (filePath.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return "application/octet-stream";
}

function startServer() {
  const server = http.createServer((req, res) => {
    const requestPath = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${PORT}`).pathname);
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

async function run() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  const failedLocalRequests = [];

  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.startsWith(`http://127.0.0.1:${PORT}/`)) {
      failedLocalRequests.push(url);
    }
  });

  try {
    for (const item of PAGES) {
      await page.goto(BASE_URL + item.path);
      await page.waitForLoadState("load");
      await page.locator(item.selector).first().waitFor({ state: "attached", timeout: 5000 });
      if (item.expectUrl && !page.url().includes(item.expectUrl)) {
        throw new Error(`Redireccion inesperada en ${item.path}: ${page.url()}`);
      }
    }

    if (failedLocalRequests.length) {
      throw new Error(`Archivos locales no cargados: ${failedLocalRequests.join(" | ")}`);
    }
    if (errors.length) {
      throw new Error(`Errores de navegador: ${errors.join(" | ")}`);
    }

    console.log("OK smoke_pantallas_ensamblaje");
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
