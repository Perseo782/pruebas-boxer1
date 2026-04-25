"use strict";

const assert = require("assert");
const path = require("path");

const base = path.resolve(__dirname, "..", "..");
const diagnosticoStore = require(path.join(base, "backend", "diagnostico", "diagnostico_store.js"));
const diagnosticoPruebas = require(path.join(base, "backend", "diagnostico", "diagnostico_pruebas.js"));

const BACKEND_URL = "https://europe-west1-project-a6f6b968-a591-4b1f-823.cloudfunctions.net/api";
const TIMEOUT_MS = 20000;

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`Falta variable privada: ${name}`);
  return value;
}

async function postApi(body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const text = await response.text();
    let payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch (error) {
      payload = { ok: false, error: text || "Respuesta no JSON" };
    }
    return { httpOk: response.ok, status: response.status, payload };
  } finally {
    clearTimeout(timer);
  }
}

function assertOkResponse(label, out) {
  assert.equal(out.httpOk, true, `${label}: HTTP no valido ${out.status}`);
  assert.equal(out.payload && out.payload.ok, true, `${label}: respuesta no valida`);
}

async function runDiagnostic(name, fn, deps) {
  const result = await fn(deps);
  const ok = !!(result && result.ok === true);
  const line = ok ? `OK real_${name}` : `WARN real_${name}: ${result && result.detail ? result.detail : "sin detalle"}`;
  console.log(line);
  return { name, ok, result };
}

async function run() {
  const usuario = requiredEnv("ALERGENOS_REAL_USER");
  const password = requiredEnv("ALERGENOS_REAL_PASSWORD");
  const providedToken = String(process.env.ALERGENOS_SESSION_TOKEN || "").trim();

  const login = await postApi({
    moduloOrigen: "Fase12_Ensamblaje",
    moduloDestino: "Seguridad",
    accion: "login",
    payload: { usuario, password }
  });
  assertOkResponse("login real", login);

  const sessionToken = String(login.payload.token || providedToken || "").trim();
  assert.ok(sessionToken, "login real: no devuelve token");
  assert.equal(String(login.payload.usuario || ""), usuario, "login real: usuario inesperado");
  console.log("OK real_login_firebase");

  const validar = await postApi({
    moduloOrigen: "Fase12_Ensamblaje",
    moduloDestino: "Seguridad",
    accion: "validarSesion",
    payload: { token: providedToken || sessionToken }
  });
  assertOkResponse("validarSesion real", validar);
  console.log("OK real_validar_sesion");

  const emitir = await postApi({
    moduloOrigen: "Fase12_Ensamblaje",
    moduloDestino: "Seguridad",
    accion: "emitirTokenFirebase",
    payload: { sessionToken }
  });
  assertOkResponse("emitirTokenFirebase real", emitir);
  assert.ok(String(emitir.payload.firebaseCustomToken || "").length > 20, "emitirTokenFirebase real: token Firebase vacio");
  console.log("OK real_emitir_token_firebase");

  const store = diagnosticoStore.createDiagnosticoStore({ maxEvents: 20, ttlMs: 60000 });
  const deps = {
    store,
    sessionToken,
    backendUrl: BACKEND_URL,
    timeoutMs: TIMEOUT_MS
  };

  const diagnosticResults = [
    await runDiagnostic("diagnostico_backend", diagnosticoPruebas.probarBackend, deps),
    await runDiagnostic("diagnostico_ia", diagnosticoPruebas.probarIa, deps),
    await runDiagnostic("diagnostico_vision", diagnosticoPruebas.probarVision, deps)
  ];

  assert.equal(diagnosticResults.length, 3, "diagnostico real: faltan pruebas");
  assert.equal(diagnosticResults[0].ok, true, "diagnostico real: backend no operativo");

  console.log("OK smoke_servicios_reales_ensamblaje");
}

run().catch((error) => {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
});
