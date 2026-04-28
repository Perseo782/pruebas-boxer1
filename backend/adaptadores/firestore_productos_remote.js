(function initFirestoreProductosRemoteModule(globalScope) {
  "use strict";

  var historialCore = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      historialCore = require("../../backend/historial/historial_core.js");
    } catch (errRequire) {
      historialCore = null;
    }
  }
  if (!historialCore && globalScope && globalScope.Fase7HistorialCore) {
    historialCore = globalScope.Fase7HistorialCore;
  }

  function resolveHistorialCore() {
    if (historialCore) return historialCore;
    if (typeof module !== "undefined" && module.exports) {
      try {
        historialCore = require("../../backend/historial/historial_core.js");
      } catch (errRequireLate) {
        historialCore = null;
      }
    }
    if (!historialCore && globalScope && globalScope.Fase7HistorialCore) {
      historialCore = globalScope.Fase7HistorialCore;
    }
    return historialCore;
  }

  function sanitizeId(value) {
    return String(value || "")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 200);
  }

  function safeCode(err, fallback) {
    if (err && typeof err.code === "string" && err.code.trim()) return err.code.trim();
    if (err && typeof err.errorCode === "string" && err.errorCode.trim()) return err.errorCode.trim();
    return fallback;
  }

  function safeMessage(err, fallback) {
    if (err && typeof err.message === "string" && err.message.trim()) return err.message.trim();
    return fallback;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isIgnorableHistoryError(err) {
    var code = safeCode(err, "");
    return code === "HIST_LIMITE_COMPROBACION_FALLIDA" ||
      code === "FIRESTORE_HISTORIAL_NO_CONFIGURADO";
  }

  function isRemoteUrl(value) {
    return /^https?:\/\//i.test(String(value || "").trim());
  }

  function isInlineDataUrl(value) {
    return /^data:image\//i.test(String(value || "").trim());
  }

  function sanitizeVisualPath(value) {
    var safe = String(value || "").trim();
    if (!safe) return null;
    if (isInlineDataUrl(safe) || /^blob:/i.test(safe)) return null;
    return safe.slice(0, 420) || null;
  }

  function sanitizeVisualStateName(value, fallback) {
    var safe = String(value || "").trim().toLowerCase();
    if (!safe) return fallback || null;
    if (safe === "pending" || safe === "uploading" || safe === "failed" || safe === "synced" || safe === "ok") {
      return safe;
    }
    if (safe === "permission_denied" || safe === "not_found") return safe;
    return fallback || null;
  }

  function sanitizeVisualEntryForRemote(input) {
    var safeInput = input || {};
    var ref = String(safeInput.ref || "").trim();
    if (isInlineDataUrl(ref)) return null;
    if (!ref) return null;
    var out = {
      ref: ref,
      profileKey: String(safeInput.profileKey || "").trim() || null,
      qualityPct: toPositiveInt(safeInput.qualityPct, null),
      resolutionMaxPx: toPositiveInt(safeInput.resolutionMaxPx, null),
      generatedAt: toIso(safeInput.generatedAt)
    };
    var thumbSrc = String(safeInput.thumbSrc || "").trim();
    var viewerSrc = String(safeInput.viewerSrc || "").trim();
    if (isRemoteUrl(thumbSrc)) out.thumbSrc = thumbSrc;
    if (isRemoteUrl(viewerSrc)) out.viewerSrc = viewerSrc;
    return out;
  }

  function sanitizeProductVisualForRemote(input) {
    var safeInput = input || {};
    var fotoRefs = Array.isArray(safeInput.fotoRefs)
      ? safeInput.fotoRefs
          .map(function mapRef(ref) { return String(ref || "").trim(); })
          .filter(function onlySafeRefs(ref) { return !!ref && !isInlineDataUrl(ref); })
          .slice(0, 2)
      : [];
    var visuales = Array.isArray(safeInput.visuales)
      ? safeInput.visuales
          .map(sanitizeVisualEntryForRemote)
          .filter(Boolean)
          .slice(0, 2)
      : [];
    var photoAssetId = String(safeInput.photoAssetId || "").trim();
    if (isInlineDataUrl(photoAssetId) || /^blob:/i.test(photoAssetId)) {
      photoAssetId = "";
    }
    var thumbPath = sanitizeVisualPath(safeInput.thumbPath);
    var viewerPath = sanitizeVisualPath(safeInput.viewerPath);
    var visualUploadState = sanitizeVisualStateName(safeInput.visualUploadState, null);
    var visualReadState = sanitizeVisualStateName(safeInput.visualReadState, null);
    var lastVisualError = String(safeInput.lastVisualError || "").trim().slice(0, 300) || null;

    if (!fotoRefs.length && !visuales.length && !photoAssetId && !thumbPath && !viewerPath && !visualUploadState && !visualReadState && !lastVisualError) {
      return null;
    }
    if (!fotoRefs.length && visuales.length) {
      fotoRefs = visuales
        .map(function mapVisual(item) { return String(item.ref || "").trim(); })
        .filter(function onlySafeRefs(ref) { return !!ref && !isInlineDataUrl(ref); })
        .slice(0, 2);
    }
    var out = {
      fotoRefs: fotoRefs,
      visuales: visuales,
      updatedAt: toIso(safeInput.updatedAt)
    };
    if (photoAssetId) out.photoAssetId = photoAssetId;
    if (thumbPath) out.thumbPath = thumbPath;
    if (viewerPath) out.viewerPath = viewerPath;
    if (visualUploadState) out.visualUploadState = visualUploadState;
    if (visualReadState) out.visualReadState = visualReadState;
    if (lastVisualError) out.lastVisualError = lastVisualError;
    return out;
  }

  function buildProductPayload(product, serverTimestamp) {
    var safeProduct = product || {};
    var payload = {
      id: sanitizeId(safeProduct.id),
      identidad: clone(safeProduct.identidad || {}),
      comercial: clone(safeProduct.comercial || {}),
      alergenos: Array.isArray(safeProduct.alergenos) ? safeProduct.alergenos.slice(0) : [],
      trazas: Array.isArray(safeProduct.trazas) ? safeProduct.trazas.slice(0) : [],
      analisis: clone(safeProduct.analisis || {}),
      legacy: clone(safeProduct.legacy || null),
      sistema: clone(safeProduct.sistema || {}),
      updatedAtServer: typeof serverTimestamp === "function" ? serverTimestamp() : new Date().toISOString()
    };
    var visual = sanitizeProductVisualForRemote(safeProduct.visual || null);
    if (visual) {
      payload.visual = visual;
    }
    return payload;
  }

  function toPositiveInt(value, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.floor(n);
  }

  function toIso(value) {
    var safe = String(value || "").trim();
    return safe || null;
  }

  function createFirestoreProductosRemote(options) {
    var safeOptions = options || {};
    var firestoreModule = safeOptions.firestoreModule || null;
    if (!firestoreModule) {
      return {
        ok: false,
        errorCode: "FIRESTORE_PRODUCTOS_SDK_NO_CONFIGURADO",
        message: "Falta modulo de Firestore."
      };
    }

    var getFirestore = firestoreModule.getFirestore;
    var docFn = firestoreModule.doc;
    var deleteDoc = firestoreModule.deleteDoc;
    var setDoc = firestoreModule.setDoc;
    var serverTimestamp = firestoreModule.serverTimestamp;
    var collectionFn = firestoreModule.collection;
    var getDocs = firestoreModule.getDocs;
    var queryFn = firestoreModule.query;
    var orderByFn = firestoreModule.orderBy;
    var limitFn = firestoreModule.limit;
    var whereFn = firestoreModule.where;
    var writeBatchFn = firestoreModule.writeBatch;
    var getDocFn = firestoreModule.getDoc;
    var onSnapshotFn = firestoreModule.onSnapshot;

    if (
      typeof getFirestore !== "function" ||
      typeof docFn !== "function" ||
      typeof setDoc !== "function"
    ) {
      return {
        ok: false,
        errorCode: "FIRESTORE_PRODUCTOS_SDK_INCOMPLETO",
        message: "El modulo de Firestore no expone getFirestore/doc/setDoc."
      };
    }

    var tokenValidator = typeof safeOptions.tokenValidator === "function"
      ? safeOptions.tokenValidator
      : function defaultTokenValidator(token) {
          return String(token || "").trim().length > 0;
        };

    var listenerUnsubscribe = null;
    var firebaseApp = safeOptions.firebaseApp || null;
    var waitForAuth = typeof safeOptions.waitForAuth === "function"
      ? safeOptions.waitForAuth
      : async function defaultWaitForAuth() {
          return { ok: true };
        };
    var collectionName = sanitizeId(safeOptions.collectionName || "fase3_productos");
    if (!collectionName) collectionName = "fase3_productos";
    var db = getFirestore(firebaseApp || undefined);

    function ensureToken(sessionToken) {
      if (sessionToken == null) {
        return { ok: true };
      }
      if (!tokenValidator(sessionToken)) {
        return {
          ok: false,
          errorCode: "FIRESTORE_SESSION_TOKEN_INVALIDO",
          message: "SessionToken invalido para operar con Firebase."
        };
      }
      return { ok: true };
    }

    async function ensureRemoteReady(sessionToken) {
      var tokenCheck = ensureToken(sessionToken);
      if (!tokenCheck.ok) return tokenCheck;
      try {
        var authOut = await waitForAuth(sessionToken);
        if (authOut && authOut.ok === false) {
          return {
            ok: false,
            errorCode: authOut.errorCode || "FIREBASE_AUTH_NO_LISTA",
            message: authOut.message || "Firebase Auth no esta listo para Firestore."
          };
        }
        return { ok: true };
      } catch (errAuth) {
        return {
          ok: false,
          errorCode: safeCode(errAuth, "FIREBASE_AUTH_NO_LISTA"),
          message: safeMessage(errAuth, "No se pudo validar Firebase Auth antes de Firestore.")
        };
      }
    }

    async function upsertProductRecord(input) {
      var safeInput = input || {};
      var readiness = await ensureRemoteReady(safeInput.sessionToken);
      if (!readiness.ok) return readiness;
      var product = safeInput.product || null;
      var historyEvent = safeInput.historyEvent || null;
      if (!product || !product.id) {
        return {
          ok: false,
          errorCode: "FIRESTORE_PRODUCTO_INVALIDO",
          message: "Falta producto para indexar."
        };
      }

      var productId = sanitizeId(product.id);
      if (!productId) {
        return {
          ok: false,
          errorCode: "FIRESTORE_PRODUCTO_ID_INVALIDO",
          message: "productId invalido para indexacion."
        };
      }

      var payload = buildProductPayload(product, serverTimestamp);
      payload.id = productId;

      try {
        var docRef = docFn(db, collectionName, productId);
        if (historyEvent && typeof writeBatchFn === "function") {
          var activeHistorialCore = resolveHistorialCore();
          if (activeHistorialCore) {
            try {
              var batch = writeBatchFn(db);
              batch.set(docRef, payload, { merge: true });
              await activeHistorialCore.escribirEvento(batch, historyEvent, {
                db: db,
                firestoreModule: firestoreModule
              });
              await batch.commit();
              return {
                ok: true,
                docPath: collectionName + "/" + productId,
                historyEventId: historyEvent.eventId || null
              };
            } catch (historyErr) {
              if (!isIgnorableHistoryError(historyErr)) {
                throw historyErr;
              }
            }
          }
        }
        await setDoc(docRef, payload, { merge: true });
        return {
          ok: true,
          docPath: collectionName + "/" + productId,
          historyEventId: null,
          historySkipped: !!historyEvent
        };
      } catch (err) {
        return {
          ok: false,
          errorCode: safeCode(err, "FIRESTORE_PRODUCTO_WRITE_FAILED"),
          message: safeMessage(err, "No se pudo escribir producto en Firestore.")
        };
      }
    }

    async function deleteProductRecord(input) {
      var safeInput = input || {};
      var readiness = await ensureRemoteReady(safeInput.sessionToken);
      if (!readiness.ok) return readiness;
      var productId = sanitizeId(safeInput.productId);
      var historyEvent = safeInput.historyEvent || null;
      if (!productId) {
        return {
          ok: false,
          errorCode: "FIRESTORE_PRODUCTO_ID_INVALIDO",
          message: "productId invalido para borrado."
        };
      }

      try {
        var docRef = docFn(db, collectionName, productId);
        if (historyEvent && typeof writeBatchFn === "function") {
          var activeHistorialCore = resolveHistorialCore();
          if (activeHistorialCore) {
            try {
              var batch = writeBatchFn(db);
              batch.delete(docRef);
              await activeHistorialCore.escribirEvento(batch, historyEvent, {
                db: db,
                firestoreModule: firestoreModule
              });
              await batch.commit();
              return {
                ok: true,
                docPath: collectionName + "/" + productId,
                historyEventId: historyEvent.eventId || null,
                deleted: true
              };
            } catch (historyErr) {
              if (!isIgnorableHistoryError(historyErr)) {
                throw historyErr;
              }
            }
          }
        }

        if (typeof deleteDoc !== "function") {
          return {
            ok: false,
            errorCode: "FIRESTORE_PRODUCTOS_DELETE_NO_DISPONIBLE",
            message: "El modulo de Firestore no expone deleteDoc."
          };
        }

        await deleteDoc(docRef);
        return {
          ok: true,
          docPath: collectionName + "/" + productId,
          historyEventId: null,
          historySkipped: !!historyEvent,
          deleted: true
        };
      } catch (err) {
        return {
          ok: false,
          errorCode: safeCode(err, "FIRESTORE_PRODUCTO_DELETE_FAILED"),
          message: safeMessage(err, "No se pudo borrar producto en Firestore.")
        };
      }
    }

    async function listProductRecords(options) {
      var safeOptions = options || {};
      var readiness = await ensureRemoteReady(safeOptions.sessionToken);
      if (!readiness.ok) return readiness;
      if (
        typeof collectionFn !== "function" ||
        typeof getDocs !== "function"
      ) {
        return {
          ok: false,
          errorCode: "FIRESTORE_PRODUCTOS_LECTURA_NO_DISPONIBLE",
          message: "El modulo de Firestore no expone lectura de coleccion."
        };
      }

      try {
        var q = collectionFn(db, collectionName);
        var maxItems = toPositiveInt(safeOptions.maxItems, 2000);
        if (typeof queryFn === "function" && typeof orderByFn === "function") {
          q = typeof limitFn === "function"
            ? queryFn(q, orderByFn("identidad.nombreNormalizado"), limitFn(maxItems))
            : queryFn(q, orderByFn("identidad.nombreNormalizado"));
        }

        var snapshot = await getDocs(q);
        var items = [];
        snapshot.forEach(function eachDoc(docSnap) {
          var data = docSnap.data ? docSnap.data() : null;
          if (!data) return;
          if (!data.id) data.id = docSnap.id;
          items.push(data);
        });

        return {
          ok: true,
          items: items
        };
      } catch (err) {
        return {
          ok: false,
          errorCode: safeCode(err, "FIRESTORE_PRODUCTOS_READ_FAILED"),
          message: safeMessage(err, "No se pudo leer productos desde Firestore.")
        };
      }
    }

    async function getProductRecordById(input) {
      var safeId = sanitizeId(input && typeof input === "object" ? input.productId : input);
      var sessionToken = input && typeof input === "object" ? input.sessionToken : null;
      var readiness = await ensureRemoteReady(sessionToken);
      if (!readiness.ok) return readiness;
      if (!safeId) {
        return {
          ok: false,
          errorCode: "FIRESTORE_PRODUCTO_ID_INVALIDO",
          message: "productId invalido para lectura."
        };
      }

      if (typeof getDocFn === "function") {
        try {
          var docRef = docFn(db, collectionName, safeId);
          var snap = await getDocFn(docRef);
          if (!snap || !snap.exists || !snap.exists()) {
            return { ok: true, item: null };
          }
          var data = snap.data ? snap.data() : null;
          if (data && !data.id) data.id = snap.id;
          return {
            ok: true,
            item: data ? clone(data) : null
          };
        } catch (errDoc) {
          return {
            ok: false,
            errorCode: safeCode(errDoc, "FIRESTORE_PRODUCTO_GET_FAILED"),
            message: safeMessage(errDoc, "No se pudo leer producto por id en Firestore.")
          };
        }
      }

      var listed = await listProductRecords({ maxItems: 5000, sessionToken: sessionToken });
      if (!listed || listed.ok !== true) return listed;
      var found = (Array.isArray(listed.items) ? listed.items : []).find(function each(item) {
        return String(item && item.id || "").trim() === safeId;
      });
      return {
        ok: true,
        item: found ? clone(found) : null
      };
    }

    async function upsertProductRecordsBatch(input) {
      var safeInput = input || {};
      var readiness = await ensureRemoteReady(safeInput.sessionToken);
      if (!readiness.ok) return readiness;
      var products = Array.isArray(safeInput.products) ? safeInput.products : [];
      var chunkSize = Math.max(1, Math.min(450, toPositiveInt(safeInput.chunkSize, 400)));
      if (!products.length) {
        return {
          ok: true,
          totalWritten: 0,
          totalChunks: 0
        };
      }

      if (typeof writeBatchFn === "function") {
        try {
          var totalWritten = 0;
          var totalChunks = 0;
          for (var start = 0; start < products.length; start += chunkSize) {
            var batch = writeBatchFn(db);
            var chunk = products.slice(start, start + chunkSize);
            for (var i = 0; i < chunk.length; i += 1) {
              var product = chunk[i] || {};
              if (!product.id) continue;
              var docRef = docFn(db, collectionName, sanitizeId(product.id));
              batch.set(docRef, buildProductPayload(product, serverTimestamp), { merge: true });
              totalWritten += 1;
            }
            await batch.commit();
            totalChunks += 1;
          }
          return {
            ok: true,
            totalWritten: totalWritten,
            totalChunks: totalChunks
          };
        } catch (err) {
          return {
            ok: false,
            errorCode: safeCode(err, "FIRESTORE_PRODUCTOS_BATCH_FAILED"),
            message: safeMessage(err, "No se pudo importar el lote de productos.")
          };
        }
      }

      var written = 0;
      for (var j = 0; j < products.length; j += 1) {
        var out = await upsertProductRecord({ product: products[j], sessionToken: safeInput.sessionToken });
        if (!out || out.ok !== true) {
          return {
            ok: false,
            errorCode: (out && out.errorCode) || "FIRESTORE_PRODUCTOS_BATCH_FAILED",
            message: (out && out.message) || "No se pudo importar el lote de productos."
          };
        }
        written += 1;
      }
      return {
        ok: true,
        totalWritten: written,
        totalChunks: 1
      };
    }

    async function findProductRecordsByIdentity(options) {
      var safeOptions = options || {};
      var readiness = await ensureRemoteReady(safeOptions.sessionToken);
      if (!readiness.ok) return readiness;
      var normalizedName = String(safeOptions.normalizedName || "").trim();
      var normalizedFormat = String(safeOptions.normalizedFormat || "").trim();
      var maxItems = toPositiveInt(safeOptions.maxItems, 20);

      if (!normalizedName) {
        return {
          ok: true,
          items: []
        };
      }

      if (
        typeof collectionFn !== "function" ||
        typeof getDocs !== "function"
      ) {
        return {
          ok: false,
          errorCode: "FIRESTORE_PRODUCTOS_LECTURA_NO_DISPONIBLE",
          message: "El modulo de Firestore no expone lectura de coleccion."
        };
      }

      if (typeof queryFn === "function" && typeof whereFn === "function") {
        try {
          var constraints = [
            whereFn("identidad.nombreNormalizado", "==", normalizedName)
          ];
          if (normalizedFormat) {
            constraints.push(whereFn("comercial.formatoNormalizado", "==", normalizedFormat));
          }
          if (typeof limitFn === "function") {
            constraints.push(limitFn(maxItems));
          }
          var q = queryFn.apply(null, [collectionFn(db, collectionName)].concat(constraints));
          var snapshot = await getDocs(q);
          var items = [];
          snapshot.forEach(function eachDoc(docSnap) {
            var data = docSnap.data ? docSnap.data() : null;
            if (!data) return;
            if (!data.id) data.id = docSnap.id;
            items.push(data);
          });
          return {
            ok: true,
            items: items
          };
        } catch (err) {
          return {
            ok: false,
            errorCode: safeCode(err, "FIRESTORE_PRODUCTOS_QUERY_FAILED"),
            message: safeMessage(err, "No se pudo consultar productos por identidad.")
          };
        }
      }

      var all = await listProductRecords({ maxItems: maxItems * 20, sessionToken: safeOptions.sessionToken });
      if (!all || all.ok !== true) return all;
      return {
        ok: true,
        items: (Array.isArray(all.items) ? all.items : []).filter(function each(item) {
          if (!item || !item.identidad) return false;
          var itemName = String(item.identidad.nombreNormalizado || "").trim();
          var itemFormat = String(item.comercial && item.comercial.formatoNormalizado || "").trim();
          if (itemName !== normalizedName) return false;
          if (normalizedFormat && itemFormat !== normalizedFormat) return false;
          return true;
        }).slice(0, maxItems)
      };
    }

    async function listHistoryEvents(options) {
      var safeOptions = options || {};
      var readiness = await ensureRemoteReady(safeOptions.sessionToken);
      if (!readiness.ok) return readiness;
      var activeHistorialCore = resolveHistorialCore();
      if (!activeHistorialCore) {
        return {
          ok: false,
          errorCode: "FIRESTORE_HISTORIAL_NO_CONFIGURADO",
          message: "Falta el modulo de historial para leer eventos."
        };
      }

      try {
        var items = await activeHistorialCore.leerUltimos30({
          db: db,
          firestoreModule: firestoreModule
        });
        return {
          ok: true,
          items: Array.isArray(items) ? items : []
        };
      } catch (err) {
        return {
          ok: false,
          errorCode: safeCode(err, "FIRESTORE_HISTORIAL_READ_FAILED"),
          message: safeMessage(err, "No se pudo leer historial desde Firestore.")
        };
      }
    }

    async function appendHistoryEvent(input) {
      var safeInput = input || {};
      var readiness = await ensureRemoteReady(safeInput.sessionToken);
      if (!readiness.ok) return readiness;
      if (typeof writeBatchFn !== "function") {
        return {
          ok: false,
          errorCode: "FIRESTORE_HISTORIAL_WRITE_NO_DISPONIBLE",
          message: "Firestore no expone escritura por lote para historial."
        };
      }
      var activeHistorialCore = resolveHistorialCore();
      if (!activeHistorialCore) {
        return {
          ok: false,
          errorCode: "FIRESTORE_HISTORIAL_NO_CONFIGURADO",
          message: "Falta el modulo de historial para guardar eventos."
        };
      }
      var historyEvent = safeInput.historyEvent || safeInput.event || null;
      if (!historyEvent || !historyEvent.eventType) {
        return {
          ok: false,
          errorCode: "FIRESTORE_HISTORIAL_EVENTO_INVALIDO",
          message: "Falta evento de historial valido."
        };
      }

      try {
        var batch = writeBatchFn(db);
        var written = await activeHistorialCore.escribirEvento(batch, historyEvent, {
          db: db,
          firestoreModule: firestoreModule
        });
        await batch.commit();
        return {
          ok: true,
          historyEventId: written && written.registro && written.registro.eventId
            ? written.registro.eventId
            : String(historyEvent.eventId || "").trim() || null
        };
      } catch (err) {
        return {
          ok: false,
          errorCode: safeCode(err, "FIRESTORE_HISTORIAL_WRITE_FAILED"),
          message: safeMessage(err, "No se pudo guardar historial en Firestore.")
        };
      }
    }

    async function leerCambiosDesde(cursor, options) {
      var safeOptions = options || {};
      var readiness = await ensureRemoteReady(safeOptions.sessionToken);
      if (!readiness.ok) return readiness;
      if (
        typeof collectionFn !== "function" ||
        typeof getDocs !== "function" ||
        typeof queryFn !== "function" ||
        typeof orderByFn !== "function"
      ) {
        return {
          ok: false,
          errorCode: "FIRESTORE_CAMBIOS_NO_DISPONIBLE",
          message: "Firestore no expone cursor de cambios."
        };
      }

      try {
        var maxItems = toPositiveInt(safeOptions.maxItems, 500);
        var q = collectionFn(db, collectionName);
        var constraints = [orderByFn("sistema.updatedAt", "asc")];
        if (cursor && typeof whereFn === "function") {
          constraints.push(whereFn("sistema.updatedAt", ">", String(cursor)));
        }
        if (typeof limitFn === "function") constraints.push(limitFn(maxItems));
        q = queryFn.apply(null, [q].concat(constraints));

        var snapshot = await getDocs(q);
        var items = [];
        var maxUpdatedAt = toIso(cursor);
        snapshot.forEach(function eachDoc(docSnap) {
          var data = docSnap.data ? docSnap.data() : null;
          if (!data) return;
          if (!data.id) data.id = docSnap.id;
          items.push(data);
          var updatedAt = toIso(data && data.sistema && data.sistema.updatedAt);
          if (updatedAt && (!maxUpdatedAt || Date.parse(updatedAt) > Date.parse(maxUpdatedAt))) {
            maxUpdatedAt = updatedAt;
          }
        });

        return {
          ok: true,
          items: items,
          maxUpdatedAt: maxUpdatedAt || null
        };
      } catch (err) {
        return {
          ok: false,
          errorCode: safeCode(err, "FIRESTORE_CAMBIOS_READ_FAILED"),
          message: safeMessage(err, "No se pudo leer cambios por cursor.")
        };
      }
    }

    async function marcarBorradoEnNube(productId, options) {
      var safeId = sanitizeId(productId);
      var safeOptions = options || {};
      var readiness = await ensureRemoteReady(safeOptions.sessionToken);
      if (!readiness.ok) return readiness;
      if (!safeId) {
        return {
          ok: false,
          errorCode: "FIRESTORE_PRODUCTO_ID_INVALIDO",
          message: "productId invalido para marcado de borrado."
        };
      }

      try {
        var now = new Date().toISOString();
        var docRef = docFn(db, collectionName, safeId);
        await setDoc(docRef, {
          id: safeId,
          deleted: true,
          deletedAt: now,
          sistema: {
            estadoRegistro: "BORRADO_REMOTO",
            updatedAt: now,
            dirty: false,
            syncState: "SYNCED"
          },
          updatedAtServer: typeof serverTimestamp === "function" ? serverTimestamp() : now
        }, { merge: true });
        return {
          ok: true,
          productId: safeId,
          deleted: true
        };
      } catch (err) {
        return {
          ok: false,
          errorCode: safeCode(err, "FIRESTORE_BORRADO_MARCA_FAILED"),
          message: safeMessage(err, "No se pudo marcar borrado en nube.")
        };
      }
    }

    function detenerListenerCambios() {
      if (listenerUnsubscribe && typeof listenerUnsubscribe === "function") {
        listenerUnsubscribe();
      }
      listenerUnsubscribe = null;
      return { ok: true };
    }

    function iniciarListenerCambios(cursor, options) {
      var safeOptions = options || {};
      var tokenCheck = ensureToken(safeOptions.sessionToken);
      if (!tokenCheck.ok) return tokenCheck;
      if (
        typeof onSnapshotFn !== "function" ||
        typeof queryFn !== "function" ||
        typeof collectionFn !== "function" ||
        typeof orderByFn !== "function"
      ) {
        return {
          ok: false,
          errorCode: "FIRESTORE_LISTENER_NO_DISPONIBLE",
          message: "Firestore no expone listener en este runtime."
        };
      }

      detenerListenerCambios();

      try {
        var constraints = [orderByFn("sistema.updatedAt", "asc")];
        if (cursor && typeof whereFn === "function") {
          constraints.push(whereFn("sistema.updatedAt", ">", String(cursor)));
        }
        var q = queryFn.apply(null, [collectionFn(db, collectionName)].concat(constraints));
        listenerUnsubscribe = onSnapshotFn(q, function onNext(snapshot) {
          var items = [];
          var maxUpdatedAt = toIso(cursor);
          var hadDocChanges = !!(snapshot && typeof snapshot.docChanges === "function");
          if (hadDocChanges) {
            snapshot.docChanges().forEach(function eachChange(change) {
              if (!change || !change.doc) return;
              var data = change.doc.data ? change.doc.data() : null;
              if (!data) data = {};
              if (!data.id) data.id = change.doc.id;
              if (change.type === "removed") {
                var removedTs = new Date().toISOString();
                data.deleted = true;
                data.sistema = Object.assign({}, data.sistema || {}, {
                  estadoRegistro: "BORRADO_REMOTO",
                  updatedAt: removedTs
                });
              }
              items.push(data);
              var updatedAt = toIso(data && data.sistema && data.sistema.updatedAt);
              if (updatedAt && (!maxUpdatedAt || Date.parse(updatedAt) > Date.parse(maxUpdatedAt))) {
                maxUpdatedAt = updatedAt;
              }
            });
          } else {
            snapshot.forEach(function eachDoc(docSnap) {
              var data = docSnap.data ? docSnap.data() : null;
              if (!data) return;
              if (!data.id) data.id = docSnap.id;
              items.push(data);
              var updatedAt = toIso(data && data.sistema && data.sistema.updatedAt);
              if (updatedAt && (!maxUpdatedAt || Date.parse(updatedAt) > Date.parse(maxUpdatedAt))) {
                maxUpdatedAt = updatedAt;
              }
            });
          }
          if (typeof safeOptions.onRemoteChange === "function") {
            safeOptions.onRemoteChange({
              ok: true,
              items: items,
              maxUpdatedAt: maxUpdatedAt || null
            });
          }
        }, function onErr(err) {
          if (typeof safeOptions.onRemoteError === "function") {
            safeOptions.onRemoteError({
              ok: false,
              errorCode: safeCode(err, "FIRESTORE_LISTENER_FAILED"),
              message: safeMessage(err, "Listener remoto fallo.")
            });
          }
        });

        return { ok: true };
      } catch (errStart) {
        return {
          ok: false,
          errorCode: safeCode(errStart, "FIRESTORE_LISTENER_START_FAILED"),
          message: safeMessage(errStart, "No se pudo iniciar listener remoto.")
        };
      }
    }

    return {
      ok: true,
      provider: "firestore_web_sdk",
      _firebaseApp: firebaseApp,
      _firestoreModule: firestoreModule,
      collectionName: collectionName,
      upsertProductRecord: upsertProductRecord,
      deleteProductRecord: deleteProductRecord,
      upsertProductRecordsBatch: upsertProductRecordsBatch,
      getProductRecordById: getProductRecordById,
      leerPorId: getProductRecordById,
      listProductRecords: listProductRecords,
      findProductRecordsByIdentity: findProductRecordsByIdentity,
      listHistoryEvents: listHistoryEvents,
      appendHistoryEvent: appendHistoryEvent,
      leerCambiosDesde: leerCambiosDesde,
      marcarBorradoEnNube: marcarBorradoEnNube,
      iniciarListenerCambios: iniciarListenerCambios,
      detenerListenerCambios: detenerListenerCambios
    };
  }

  var api = {
    createFirestoreProductosRemote: createFirestoreProductosRemote
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase3FirestoreProductosRemote = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

