(function initFirestoreActivosIndexRemoteModule(globalScope) {
  "use strict";

  function sanitizeId(value) {
    return String(value || "")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 200);
  }

  function normalizeMime(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeUrl(value) {
    return String(value || "").trim() || null;
  }

  function toNumberOrNull(value) {
    var n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function normalizeIso(value) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value && typeof value.toDate === "function") {
      try {
        return value.toDate().toISOString();
      } catch (err) {
        return null;
      }
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString();
    }
    return null;
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

  function chunkArray(items, size) {
    var out = [];
    var safeItems = Array.isArray(items) ? items : [];
    var safeSize = Math.max(1, Number(size) || 1);
    for (var i = 0; i < safeItems.length; i += safeSize) {
      out.push(safeItems.slice(i, i + safeSize));
    }
    return out;
  }

  function createFirestoreActivosIndexRemote(options) {
    var safeOptions = options || {};
    var firestoreModule = safeOptions.firestoreModule || null;
    if (!firestoreModule) {
      return {
        ok: false,
        errorCode: "FIRESTORE_INDEX_SDK_NO_CONFIGURADO",
        message: "Falta modulo de Firestore."
      };
    }

    var getFirestore = firestoreModule.getFirestore;
    var docFn = firestoreModule.doc;
    var setDoc = firestoreModule.setDoc;
    var collectionFn = firestoreModule.collection;
    var getDocs = firestoreModule.getDocs;
    var serverTimestamp = firestoreModule.serverTimestamp;
    var queryFn = firestoreModule.query;
    var whereFn = firestoreModule.where;
    if (
      typeof getFirestore !== "function" ||
      typeof docFn !== "function" ||
      typeof setDoc !== "function"
    ) {
      return {
        ok: false,
        errorCode: "FIRESTORE_INDEX_SDK_INCOMPLETO",
        message: "El modulo de Firestore no expone getFirestore/doc/setDoc."
      };
    }

    var firebaseApp = safeOptions.firebaseApp || null;
    var waitForAuth = typeof safeOptions.waitForAuth === "function"
      ? safeOptions.waitForAuth
      : async function defaultWaitForAuth() {
          return { ok: true };
        };
    var tokenValidator = typeof safeOptions.tokenValidator === "function"
      ? safeOptions.tokenValidator
      : function defaultTokenValidator(token) {
          return String(token || "").trim().length > 0;
        };
    var collectionName = sanitizeId(safeOptions.collectionName || "fase4_activos");
    if (!collectionName) collectionName = "fase4_activos";
    var db = getFirestore(firebaseApp || undefined);

    function ensureToken(sessionToken) {
      if (sessionToken == null) {
        return { ok: true };
      }
      if (!tokenValidator(sessionToken)) {
        return {
          ok: false,
          errorCode: "FIRESTORE_INDEX_SESSION_TOKEN_INVALIDO",
          message: "SessionToken invalido para leer activos."
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
            message: authOut.message || "Firebase Auth no esta listo para leer activos."
          };
        }
        return { ok: true };
      } catch (errAuth) {
        return {
          ok: false,
          errorCode: safeCode(errAuth, "FIREBASE_AUTH_NO_LISTA"),
          message: safeMessage(errAuth, "No se pudo validar Firebase Auth antes de leer activos.")
        };
      }
    }

    async function upsertAssetRecord(input) {
      var safeInput = input || {};
      var asset = safeInput.asset || null;
      if (!asset || !asset.assetId) {
        return {
          ok: false,
          errorCode: "FIRESTORE_INDEX_ASSET_INVALIDO",
          message: "Falta asset para indexar."
        };
      }

      var assetId = sanitizeId(asset.assetId);
      if (!assetId) {
        return {
          ok: false,
          errorCode: "FIRESTORE_INDEX_ASSET_ID_INVALIDO",
          message: "assetId invalido para indexacion."
        };
      }

      var payload = {
        assetId: assetId,
        schemaVersion: toNumberOrNull(asset.schemaVersion) || 1,
        productId: String(asset.productId || "").trim() || null,
        origen: String(asset.origen || "").trim() || null,
        contenedor: String(asset.contenedor || "").trim() || null,
        archivo: {
          fileName: asset.archivo ? String(asset.archivo.fileName || "") : "",
          mimeType: normalizeMime(asset.archivo ? asset.archivo.mimeType : ""),
          bytes: toNumberOrNull(asset.archivo ? asset.archivo.bytes : null),
          width: toNumberOrNull(asset.archivo ? asset.archivo.width : null),
          height: toNumberOrNull(asset.archivo ? asset.archivo.height : null),
          sha256: asset.archivo ? String(asset.archivo.sha256 || "").trim() || null : null
        },
        derivados: {
          thumbnailPath: asset.derivados ? String(asset.derivados.thumbnailPath || "").trim() || null : null,
          compressedPath: asset.derivados ? String(asset.derivados.compressedPath || "").trim() || null : null,
          miniaturaTarjeta: asset.derivados && asset.derivados.miniaturaTarjeta ? {
            mimeType: normalizeMime(asset.derivados.miniaturaTarjeta.mimeType),
            width: toNumberOrNull(asset.derivados.miniaturaTarjeta.width),
            height: toNumberOrNull(asset.derivados.miniaturaTarjeta.height),
            bytes: toNumberOrNull(asset.derivados.miniaturaTarjeta.bytes),
            qualityPct: toNumberOrNull(asset.derivados.miniaturaTarjeta.qualityPct),
            maxSidePx: toNumberOrNull(asset.derivados.miniaturaTarjeta.maxSidePx),
            downloadURL: normalizeUrl(asset.derivados.miniaturaTarjeta.downloadURL)
          } : null,
          imagenVisor: asset.derivados && asset.derivados.imagenVisor ? {
            mimeType: normalizeMime(asset.derivados.imagenVisor.mimeType),
            width: toNumberOrNull(asset.derivados.imagenVisor.width),
            height: toNumberOrNull(asset.derivados.imagenVisor.height),
            bytes: toNumberOrNull(asset.derivados.imagenVisor.bytes),
            qualityPct: toNumberOrNull(asset.derivados.imagenVisor.qualityPct),
            maxSidePx: toNumberOrNull(asset.derivados.imagenVisor.maxSidePx),
            compressionProfile: String(asset.derivados.imagenVisor.compressionProfile || "").trim() || null,
            compressionProfileLabel: String(asset.derivados.imagenVisor.compressionProfileLabel || "").trim() || null,
            downloadURL: normalizeUrl(asset.derivados.imagenVisor.downloadURL)
          } : null
        },
        sistema: {
          estadoRegistro: asset.sistema ? String(asset.sistema.estadoRegistro || "") : "",
          syncState: asset.sistema ? String(asset.sistema.syncState || "") : "",
          rowVersion: toNumberOrNull(asset.sistema ? asset.sistema.rowVersion : null),
          dirty: !!(asset.sistema && asset.sistema.dirty),
          createdAtLocal: asset.sistema ? String(asset.sistema.createdAt || "").trim() || null : null,
          updatedAtLocal: asset.sistema ? String(asset.sistema.updatedAt || "").trim() || null : null,
          deletedAtLocal: asset.sistema ? String(asset.sistema.deletedAt || "").trim() || null : null
        },
        updatedAtServer: typeof serverTimestamp === "function" ? serverTimestamp() : new Date().toISOString()
      };

      try {
        var docRef = docFn(db, collectionName, assetId);
        await setDoc(docRef, payload, { merge: true });
        return {
          ok: true,
          docPath: collectionName + "/" + assetId
        };
      } catch (err) {
        return {
          ok: false,
          errorCode: safeCode(err, "FIRESTORE_INDEX_WRITE_FAILED"),
          message: safeMessage(err, "No se pudo escribir metadata de activo en Firestore.")
        };
      }
    }

    function mapDocToAssetRecord(docSnap) {
      var raw = docSnap && typeof docSnap.data === "function" ? docSnap.data() : null;
      if (!raw) return null;

      return {
        assetId: sanitizeId(raw.assetId || (docSnap && docSnap.id) || ""),
        schemaVersion: toNumberOrNull(raw.schemaVersion) || 1,
        productId: String(raw.productId || "").trim() || null,
        origen: String(raw.origen || "").trim() || null,
        contenedor: String(raw.contenedor || "").trim() || null,
        archivo: {
          fileName: raw.archivo ? String(raw.archivo.fileName || "").trim() : "",
          mimeType: normalizeMime(raw.archivo ? raw.archivo.mimeType : ""),
          bytes: toNumberOrNull(raw.archivo ? raw.archivo.bytes : null),
          width: toNumberOrNull(raw.archivo ? raw.archivo.width : null),
          height: toNumberOrNull(raw.archivo ? raw.archivo.height : null),
          sha256: raw.archivo ? String(raw.archivo.sha256 || "").trim() || null : null
        },
        derivados: {
          thumbnailPath: raw.derivados ? String(raw.derivados.thumbnailPath || "").trim() || null : null,
          compressedPath: raw.derivados ? String(raw.derivados.compressedPath || "").trim() || null : null,
          miniaturaTarjeta: raw.derivados && raw.derivados.miniaturaTarjeta ? {
            mimeType: normalizeMime(raw.derivados.miniaturaTarjeta.mimeType),
            width: toNumberOrNull(raw.derivados.miniaturaTarjeta.width),
            height: toNumberOrNull(raw.derivados.miniaturaTarjeta.height),
            qualityPct: toNumberOrNull(raw.derivados.miniaturaTarjeta.qualityPct),
            maxSidePx: toNumberOrNull(raw.derivados.miniaturaTarjeta.maxSidePx),
            bytes: toNumberOrNull(raw.derivados.miniaturaTarjeta.bytes),
            downloadURL: normalizeUrl(raw.derivados.miniaturaTarjeta.downloadURL)
          } : null,
          imagenVisor: raw.derivados && raw.derivados.imagenVisor ? {
            mimeType: normalizeMime(raw.derivados.imagenVisor.mimeType),
            width: toNumberOrNull(raw.derivados.imagenVisor.width),
            height: toNumberOrNull(raw.derivados.imagenVisor.height),
            qualityPct: toNumberOrNull(raw.derivados.imagenVisor.qualityPct),
            maxSidePx: toNumberOrNull(raw.derivados.imagenVisor.maxSidePx),
            compressionProfile: String(raw.derivados.imagenVisor.compressionProfile || "").trim() || null,
            compressionProfileLabel: String(raw.derivados.imagenVisor.compressionProfileLabel || "").trim() || null,
            bytes: toNumberOrNull(raw.derivados.imagenVisor.bytes),
            downloadURL: normalizeUrl(raw.derivados.imagenVisor.downloadURL)
          } : null
        },
        sistema: {
          estadoRegistro: raw.sistema ? String(raw.sistema.estadoRegistro || "").trim() || "ACTIVO" : "ACTIVO",
          syncState: raw.sistema ? String(raw.sistema.syncState || "").trim() || "SYNCED" : "SYNCED",
          rowVersion: toNumberOrNull(raw.sistema ? raw.sistema.rowVersion : null) || 1,
          dirty: !!(raw.sistema && raw.sistema.dirty),
          createdAtLocal: normalizeIso(raw.sistema ? raw.sistema.createdAtLocal : null),
          updatedAtLocal: normalizeIso(raw.sistema ? raw.sistema.updatedAtLocal : null),
          deletedAtLocal: normalizeIso(raw.sistema ? raw.sistema.deletedAtLocal : null)
        }
      };
    }

    async function listAssetRecords(options) {
      if (typeof collectionFn !== "function" || typeof getDocs !== "function") {
        return {
          ok: false,
          errorCode: "FIRESTORE_INDEX_LIST_NOT_AVAILABLE",
          message: "El modulo de Firestore no expone collection/getDocs."
        };
      }

      var safeOptions = options || {};
      var readiness = await ensureRemoteReady(safeOptions.sessionToken);
      if (!readiness.ok) return readiness;
      var onlyActive = safeOptions.onlyActive !== false;
      var productIds = Array.isArray(safeOptions.productIds)
        ? safeOptions.productIds
            .map(function mapId(id) { return String(id || "").trim(); })
            .filter(Boolean)
        : [];
      try {
        var colRef = collectionFn(db, collectionName);
        var items = [];
        var seen = Object.create(null);
        var queries = [];

        if (productIds.length && typeof queryFn === "function" && typeof whereFn === "function") {
          var chunks = chunkArray(productIds, 10);
          for (var i = 0; i < chunks.length; i += 1) {
            queries.push(queryFn(colRef, whereFn("productId", "in", chunks[i])));
          }
        } else {
          queries.push(colRef);
        }

        for (var q = 0; q < queries.length; q += 1) {
          var snap = await getDocs(queries[q]);
          if (!(snap && typeof snap.forEach === "function")) continue;
          snap.forEach(function eachDoc(docSnap) {
            var mapped = mapDocToAssetRecord(docSnap);
            if (!mapped || !mapped.assetId || seen[mapped.assetId]) return;
            if (onlyActive && mapped.sistema && mapped.sistema.estadoRegistro !== "ACTIVO") return;
            seen[mapped.assetId] = true;
            items.push(mapped);
          });
        }

        items.sort(function sortByUpdated(a, b) {
          var aTs = String(a && a.sistema && a.sistema.updatedAtLocal || "");
          var bTs = String(b && b.sistema && b.sistema.updatedAtLocal || "");
          if (aTs === bTs) return String(a.assetId || "").localeCompare(String(b.assetId || ""));
          return aTs < bTs ? 1 : -1;
        });

        return {
          ok: true,
          total: items.length,
          items: items
        };
      } catch (err) {
        return {
          ok: false,
          errorCode: safeCode(err, "FIRESTORE_INDEX_READ_FAILED"),
          message: safeMessage(err, "No se pudo leer metadata de activos desde Firestore.")
        };
      }
    }

    return {
      ok: true,
      provider: "firestore_web_sdk",
      collectionName: collectionName,
      upsertAssetRecord: upsertAssetRecord,
      listAssetRecords: listAssetRecords
    };
  }

  var api = {
    createFirestoreActivosIndexRemote: createFirestoreActivosIndexRemote
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase4FirestoreActivosIndexRemote = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
