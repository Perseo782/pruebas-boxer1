"use strict";

require("../../frontend/ia/boxer3_motor.js");
const boxer3 = require("../../frontend/ia/boxer3_peso_formato.js");
const contratos = require("../../frontend/ia/boxer3_contratos.js");

function buildRequest(text, ids) {
  const safeIds = ids || {};
  return {
    moduloOrigen: contratos.MODULES.CEREBRO,
    moduloDestino: contratos.MODULES.BOXER3,
    accion: contratos.ACTIONS.RESOLVER_FORMATO,
    sessionToken: "token_test",
    meta: {
      versionContrato: contratos.CONTRACT_VERSION,
      analysisId: safeIds.analysisId || "A_TEST",
      traceId: safeIds.traceId || "T_TEST"
    },
    datos: {
      textoBaseVision: String(text || ""),
      controlesUsuario: { agentEnabled: true }
    }
  };
}

function extractOutput(out) {
  const local = out && out.resultadoLocal ? out.resultadoLocal : {};
  const datos = local && local.datos ? local.datos : {};
  return {
    formato: String(datos.formato || "").trim(),
    motivo: String(datos.motivo_duda || "").trim(),
    estadoIA: String(out && out.estadoIA || "").trim(),
    tareasIA: Array.isArray(out && out.tareasIA) ? out.tareasIA.length : 0
  };
}

async function runCase(def) {
  const out = await boxer3.procesarAccionContrato(buildRequest(def.text, {
    analysisId: "A_" + def.id,
    traceId: "T_" + def.id
  }));
  const parsed = extractOutput(out);
  const ok = def.check(parsed);
  return {
    id: def.id,
    ok: !!ok,
    parsed: parsed,
    expected: def.expected
  };
}

function printRow(row) {
  const status = row.ok ? "OK" : "FAIL";
  console.log(
    [
      row.id,
      status,
      row.parsed.formato || "(vacio)",
      row.parsed.motivo || "(sin motivo)",
      row.parsed.estadoIA || "(sin estadoIA)",
      String(row.parsed.tareasIA),
      row.expected
    ].join(" | ")
  );
}

async function main() {
  const cases = [
    {
      id: "C1_PESO_3_5K",
      text: "ENSALADILLA\nPeso: 3,5k\nIngredientes: patata",
      expected: "formato 3.5 kg y sin IA",
      check: (o) => o.formato === "3.5 kg" && o.tareasIA === 0
    },
    {
      id: "C2_PESO_NETO_2K",
      text: "Producto X\nPeso neto 2k\n",
      expected: "formato 2 kg y sin IA",
      check: (o) => o.formato === "2 kg" && o.tareasIA === 0
    },
    {
      id: "C3_NUTRICIONAL_100G",
      text: "VALOR ENERGETICO POR 100 g\nkcal 120",
      expected: "sin candidato comercial",
      check: (o) => o.formato === ""
    },
    {
      id: "C4_HIDRATOS_12G",
      text: "HIDRATOS DE CARBONO 12 g",
      expected: "sin candidato comercial",
      check: (o) => o.formato === ""
    },
    {
      id: "C5_PESO_3_5_KG",
      text: "Peso: 3,5 kg",
      expected: "sigue detectando 3.5 kg",
      check: (o) => o.formato === "3.5 kg"
    },
    {
      id: "C6_3_5K_SIN_ETIQUETA",
      text: "Producto X\n3,5k\n",
      expected: "no aceptar sin etiqueta comercial",
      check: (o) => o.formato === ""
    }
  ];

  console.log("Caso | Resultado | Formato | Motivo | EstadoIA | TareasIA | Esperado");
  let failures = 0;
  for (const c of cases) {
    const row = await runCase(c);
    printRow(row);
    if (!row.ok) failures += 1;
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fallo test_boxer3_peso_k:", err && err.message ? err.message : err);
  process.exitCode = 1;
});

