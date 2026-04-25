const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "../..");
const PORT = 8124;
const ACCESS_URL = `http://127.0.0.1:${PORT}/frontend/pantallas/acceso.html`;

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
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  let failedBackendAttempts = 0;

  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.route("https://europe-west1-project-a6f6b968-a591-4b1f-823.cloudfunctions.net/api", async (route) => {
    const request = route.request();
    const body = JSON.parse(request.postData() || "{}");
    const payload = body.payload || {};
    const okLogin = payload.usuario === "usuario_prueba_fase12" && payload.password === "clave_prueba_fase12";

    if (okLogin) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          modulo: "Seguridad",
          accion: "login",
          token: "token_prueba_fase12",
          usuario: payload.usuario,
          caducidad: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      return;
    }

    failedBackendAttempts += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        modulo: "Seguridad",
        accion: "login",
        error: failedBackendAttempts >= 3 ? "Acceso bloqueado temporalmente" : "Credenciales incorrectas",
      }),
    });
  });

  try {
    await page.goto(ACCESS_URL);
    await page.waitForLoadState("load");
    await page.evaluate(() => localStorage.clear());

    const logoWidth = Math.round((await page.locator(".brand-logo").boundingBox()).width);
    const passwordType = await page.locator("#access-password").getAttribute("type");
    const disabledInitial = await page.locator("#access-submit").isDisabled();

    if (logoWidth < 290) throw new Error(`Logo demasiado pequeno: ${logoWidth}`);
    if (passwordType !== "password") throw new Error("La contrasena no arranca oculta.");
    if (!disabledInitial) throw new Error("El boton Entrar debe estar bloqueado sin credenciales.");

    await page.locator("#access-user").fill("usuario_prueba_fase12");
    await page.locator("#access-password").fill("clave-mala");
    await page.locator("#access-submit").click();
    await page.waitForFunction(() => document.querySelector("#form-message").textContent.includes("Quedan 2 intentos"));
    const badMessage = await page.locator("#form-message").textContent();
    const firstToast = await page.locator("#access-toast").textContent();
    if (!badMessage.includes("Quedan 2 intentos")) throw new Error("No avisa de los intentos restantes.");
    if (!firstToast.includes("Quedan 2 intentos")) throw new Error("No muestra mensaje emergente con intentos restantes.");
    if (!page.url().includes("acceso.html")) throw new Error("Credenciales incorrectas no deben entrar.");

    await page.locator("#access-password").fill("clave-mala-2");
    await page.locator("#access-submit").click();
    await page.waitForFunction(() => document.querySelector("#form-message").textContent.includes("Quedan 1 intento"));
    const secondMessage = await page.locator("#form-message").textContent();
    if (!secondMessage.includes("Quedan 1 intento")) throw new Error("No avisa del ultimo intento.");

    await page.locator("#access-password").fill("clave-mala-3");
    await page.locator("#access-submit").click();
    await page.waitForFunction(() => document.querySelector("#form-message").textContent.includes("Acceso bloqueado"));
    const lockedMessage = await page.locator("#form-message").textContent();
    const lockedToast = await page.locator("#access-toast").textContent();
    const userDisabled = await page.locator("#access-user").isDisabled();
    if (!lockedMessage.includes("Acceso bloqueado")) throw new Error("No muestra bloqueo temporal.");
    if (!lockedToast.includes("5 minutos")) throw new Error("No muestra mensaje emergente de bloqueo.");
    if (!userDisabled) throw new Error("Los campos deben quedar bloqueados temporalmente.");

    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("load");

    await page.locator("#access-password").fill("clave_prueba_fase12");
    await page.locator("#access-user").fill("usuario_prueba_fase12");
    await page.locator("#access-submit").click();
    await page.waitForLoadState("load");
    await page.waitForTimeout(1000);

    const finalUrl = page.url();
    const title = await page.title();
    const h1 = await page.locator("h1").first().textContent();
    const ajustesVisible = await page.locator("#abrir-ajustes").count();
    const sessionOk = await page.evaluate(() => sessionStorage.getItem("alergenos_access_ok"));

    if (!finalUrl.includes("/frontend/pantallas/gestion_registros.html")) throw new Error("No entra en la app principal del ensamblaje.");
    if (!String(title).startsWith("Al") || !String(title).endsWith("rgenos")) throw new Error(`Titulo inesperado: ${title}`);
    if (!String(h1).startsWith("Al") || !String(h1).endsWith("rgenos")) throw new Error(`Pantalla principal inesperada: ${h1}`);
    if (ajustesVisible !== 1) throw new Error("No se encuentra Ajustes en la app principal.");
    if (sessionOk !== "1") throw new Error("No queda sesion local marcada.");
    if (errors.length) throw new Error(`Errores de navegador: ${errors.join(" | ")}`);

    console.log("OK smoke_entrada_ensamblaje");
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
