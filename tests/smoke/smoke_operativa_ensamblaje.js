"use strict";

var assert = require("assert");
var path = require("path");

var base = path.resolve(__dirname, "..", "..");
var storeApi = require(path.join(base, "backend", "persistencia", "data_store_local.js"));
var altaManual = require(path.join(base, "backend", "operativa", "alta_manual.js"));
var gestion = require(path.join(base, "backend", "operativa", "gestion_registros.js"));
var altaFoto = require(path.join(base, "backend", "operativa", "alta_foto.js"));
var loteFoto = require(path.join(base, "backend", "operativa", "lote_foto.js"));
var revision = require(path.join(base, "backend", "operativa", "revision.js"));
var boxerAdapter = require(path.join(base, "backend", "adaptadores", "boxer1_adapter.js"));
var historialCampos = require(path.join(base, "backend", "historial", "historial_campos.js"));
var historialCore = require(path.join(base, "backend", "historial", "historial_core.js"));
var diagnosticoStore = require(path.join(base, "backend", "diagnostico", "diagnostico_store.js"));
var exportacionExcel = require(path.join(base, "backend", "excel", "exportacion_excel.js"));
var importacionExcel = require(path.join(base, "backend", "excel", "importacion_excel.js"));

function testAltaGestion() {
  var store = storeApi.createMemoryProductStore();

  var invalid = altaManual.ejecutarAltaManual({ nombre: "ab" }, { store: store });
  assert.equal(invalid.ok, false, "Nombre demasiado corto debe bloquearse");

  var alta1 = altaManual.ejecutarAltaManual(
    { nombre: "Mostaza Antigua", alergenos: ["mostaza"] },
    { store: store }
  );
  assert.equal(alta1.ok, true, "Alta manual valida debe guardar");

  var alta2 = altaManual.ejecutarAltaManual(
    { nombre: " mostaza  antigua ", alergenos: ["sulfitos"] },
    { store: store }
  );
  assert.equal(alta2.ok, true, "Mismo producto debe fusionar");
  assert.equal(alta2.resultado.datos.fusionExacta, true);
  assert.deepEqual(alta2.resultado.datos.producto.alergenos, ["mostaza", "sulfitos"]);

  var listado = gestion.listarProductos({ soloPendientes: false }, { store: store });
  assert.equal(listado.ok, true);
  assert.equal(listado.resultado.datos.total, 1, "La fusion debe dejar un producto activo");

  var edit = gestion.editarProducto(
    {
      productId: alta2.resultado.datos.producto.id,
      nombre: "Mostaza Clasica",
      alergenos: ["mostaza"]
    },
    { store: store }
  );
  assert.equal(edit.ok, true, "Edicion debe funcionar");

  var altaFotoConfirmada = altaManual.ejecutarAltaManual(
    {
      nombre: "Producto con miniatura",
      alergenos: ["soja"],
      origenAlta: "foto",
      fotoRefs: ["alta_foto_normal_1"],
      visuales: [{
        ref: "alta_foto_normal_1",
        thumbSrc: "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
        viewerSrc: "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
        profileKey: "EQUILIBRADO_WEBP",
        qualityPct: 80,
        resolutionMaxPx: 800
      }]
    },
    { store: store }
  );
  assert.equal(altaFotoConfirmada.ok, true, "Alta confirmada desde foto debe guardar");
  assert.equal(altaFotoConfirmada.resultado.datos.producto.analisis.origenAlta, "foto");
  assert.ok(altaFotoConfirmada.resultado.datos.producto.visual, "Producto desde foto debe conservar visual");
  assert.ok(
    JSON.stringify(altaFotoConfirmada.resultado.datos.producto).indexOf("data:image") < 0,
    "Producto desde foto no debe guardar base64 pesado"
  );
  assert.ok(
    altaFotoConfirmada.resultado.datos.producto.visual.fotoRefs[0].indexOf("alta_foto_normal_1") === 0,
    "Producto desde foto debe conservar referencia visual ligera"
  );
  var modeloPendiente = gestion.crearModeloTarjetaProductoFase9({
    producto: altaFotoConfirmada.resultado.datos.producto
  });
  assert.equal(modeloPendiente.tieneImagen, false, "Referencia ligera sin URL debe quedar como foto pendiente");
  var modeloFoto = gestion.crearModeloTarjetaProductoFase9({
    producto: altaFotoConfirmada.resultado.datos.producto,
    visual: {
      thumbUrl: "https://example.test/miniatura.webp",
      viewerUrl: "https://example.test/visor.webp"
    }
  });
  assert.equal(modeloFoto.tieneImagen, true, "Tarjeta debe quedar con miniatura clicable");

  var productIdFoto = String(altaFotoConfirmada.resultado.datos.producto.id || "");
  var localVisualRef = "photo_asset:test_miniatura:1";
  var localThumb = "https://local.example/miniatura.webp";
  var localViewer = "https://local.example/visor.webp";
  var updateVisual = store.updateProductById({
    productId: productIdFoto,
    visual: {
      fotoRefs: [localVisualRef],
      visuales: [{
        ref: localVisualRef,
        thumbSrc: localThumb,
        viewerSrc: localViewer
      }]
    }
  });
  assert.equal(updateVisual.ok, true, "Debe permitir actualizar visual local");
  store.markProductAsSynced({ productId: productIdFoto, syncedAt: "2026-04-28T10:00:00.000Z" });

  var localBeforeMerge = store.getProductById(productIdFoto);
  var localVisualMatch = (localBeforeMerge.visual.visuales || []).find(function findLocalVisual(item) {
    return String(item && item.thumbSrc || "") === localThumb;
  });
  assert.ok(localVisualMatch, "Visual local debe quedar disponible");

  var incomingWithoutVisual = JSON.parse(JSON.stringify(localBeforeMerge));
  delete incomingWithoutVisual.visual;
  incomingWithoutVisual.sistema.dirty = false;
  incomingWithoutVisual.sistema.syncState = "SYNCED";
  incomingWithoutVisual.sistema.updatedAt = "2026-04-28T10:01:00.000Z";
  var mergeOut = store.fusionarRemotoCambios([incomingWithoutVisual], {});
  assert.equal(mergeOut.ok, true, "Merge remoto debe ejecutarse");

  var afterMerge = store.getProductById(productIdFoto);
  assert.ok(afterMerge && afterMerge.visual, "Merge remoto no debe borrar visual local");
  var afterMergeVisualMatch = (afterMerge.visual.visuales || []).find(function findMergedVisual(item) {
    return String(item && item.thumbSrc || "") === localThumb;
  });
  assert.ok(afterMergeVisualMatch, "Remoto sin foto no debe pisar miniatura local");
}

async function testRevisionYLote() {
  var store = storeApi.createMemoryProductStore();

  var alta = await altaFoto.ejecutarAltaFoto(
    { fotoRefs: ["C:\\fotos\\revision.jpg"] },
    {
      store: store,
      boxerAdapter: boxerAdapter,
      simulatedBoxerResult: {
        nombrePropuesto: "Producto Foto",
        alergenosPropuestos: ["huevos"]
      }
    }
  );
  assert.equal(alta.ok, true, "Alta por foto simulada debe crear revision");

  var confirm = revision.confirmarRevision(
    {
      draftId: alta.resultado.datos.borrador.draftId,
      nombreFinal: "Producto Foto",
      alergenosFinales: ["huevos", "gluten"]
    },
    { store: store }
  );
  assert.equal(confirm.ok, true, "Revision confirmada debe guardar");
  assert.equal(store.listActiveProducts().length, 1);

  var lote = await loteFoto.ejecutarLoteFoto(
    {
      fotoRefs: [
        "C:\\fotos\\lote_01.jpg",
        "C:\\fotos\\lote_02.jpg"
      ]
    },
    {
      store: store,
      boxerAdapter: boxerAdapter,
      altaFotoOperativa: altaFoto,
      boxerAnalyzer: function simulatedAnalyzer(payload) {
        var firstRef = String(payload && payload.fotoRefs && payload.fotoRefs[0] || "");
        return {
          ok: true,
          resultado: {
            nombrePropuesto: "Producto " + (firstRef.split(/[\\/]/).pop() || "Lote"),
            alergenosPropuestos: ["mostaza"]
          }
        };
      }
    }
  );
  assert.equal(lote.ok, true, "Lote simulado debe funcionar");
  assert.equal(lote.resultado.datos.totalProcesadas, 2);
  assert.equal(store.listPendingRevisionDrafts().length, 2);
}

function testHistorialDiagnostico() {
  var record = historialCore.construirRegistro(
    historialCampos.EVENT_TYPES.PRODUCT_CREATED,
    "prd_001",
    "Mostaza antigua",
    "fase12",
    null,
    null,
    { eventId: "hist_fase12_001", occurredAt: "2026-04-25T10:00:00.000Z" }
  );
  assert.equal(record.eventType, "PRODUCT_CREATED");

  var diagnostico = diagnosticoStore.createDiagnosticoStore({ maxEvents: 5, ttlMs: 60000 });
  diagnostico.openCase({ caseId: "fase12_smoke", module: "Fase12", action: "smoke", message: "Caso abierto." });
  diagnostico.addEvent({
    level: "WARN",
    module: "IA",
    action: "probar IA",
    message: "Gemini API respondio 503",
    rawDetail: "HTTP=200 | CODE=GEMINI_API_ERROR | RAW={\"ok\":false}"
  });
  assert.ok(diagnostico.buildCopyText().indexOf("GEMINI_API_ERROR") >= 0);
}

async function testExcel() {
  var bytes = exportacionExcel.buildWorkbookBytes({
    createdAt: new Date("2026-04-25T10:00:00Z"),
    products: [
      { id: "prd_1", identidad: { nombre: "Aceite de sesamo" }, alergenos: ["sesamo"] },
      { id: "prd_2", identidad: { nombre: "Tomate frito" }, alergenos: [] }
    ]
  });
  assert.ok(bytes instanceof Uint8Array, "Exportacion debe devolver archivo");
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);

  var parsed = await importacionExcel.validateAndParseExcel({
    file: { name: "importacion.xlsx", size: bytes.length },
    bytes: bytes,
    traceId: "fase12_excel"
  });
  assert.equal(parsed.ok, true, "Importacion debe leer el Excel exportado");
  assert.equal(parsed.resultado.datos.rows.length, 2);
}

async function run() {
  testAltaGestion();
  await testRevisionYLote();
  testHistorialDiagnostico();
  await testExcel();
  console.log("OK smoke_operativa_ensamblaje");
}

run().catch(function onError(error) {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
