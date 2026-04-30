(function initOcrSettings(globalScope) {
  "use strict";

  var SETTINGS_KEY = "appv2_ocr_settings_v1";
  var DETAIL_KEY = "appv2_last_ocr_detail_v1";
  var DEFAULT_SETTINGS = { ocrMode: "vision", updatedAt: "" };

  function storage() {
    try {
      return globalScope && globalScope.localStorage ? globalScope.localStorage : null;
    } catch (err) {
      return null;
    }
  }

  function normalizeMode(mode) {
    var value = String(mode || "").trim().toLowerCase();
    if (value === "deepseek" || value === "both" || value === "vision") return value;
    return "vision";
  }

  function readJson(key) {
    var ls = storage();
    if (!ls) return null;
    try {
      return JSON.parse(ls.getItem(key) || "null");
    } catch (err) {
      return null;
    }
  }

  function writeJson(key, value) {
    var ls = storage();
    if (!ls) return false;
    try {
      ls.setItem(key, JSON.stringify(value || null));
      return true;
    } catch (err) {
      return false;
    }
  }

  function removeKey(key) {
    var ls = storage();
    if (!ls) return false;
    try {
      ls.removeItem(key);
      return true;
    } catch (err) {
      return false;
    }
  }

  function getSettings() {
    var saved = readJson(SETTINGS_KEY) || {};
    return {
      ocrMode: normalizeMode(saved.ocrMode),
      updatedAt: String(saved.updatedAt || "")
    };
  }

  function saveSettings(next) {
    var saved = {
      ocrMode: normalizeMode(next && next.ocrMode),
      updatedAt: new Date().toISOString()
    };
    writeJson(SETTINGS_KEY, saved);
    return saved;
  }

  function modeLabel(mode) {
    var value = normalizeMode(mode);
    if (value === "deepseek") return "DeepSeek-OCR";
    if (value === "both") return "Vision + DeepSeek";
    return "Vision";
  }

  function saveLastOcrDetail(detail) {
    var safe = detail && typeof detail === "object" ? detail : {};
    var out = {
      createdAt: new Date().toISOString(),
      modo: normalizeMode(safe.modo || safe.ocrMode),
      motorSeleccionado: String(safe.motorSeleccionado || safe.modo || safe.ocrMode || ""),
      ok: safe.ok === true,
      vision: safe.vision || null,
      deepseek: safe.deepseek || null,
      fusion: safe.fusion || null,
      message: String(safe.message || "")
    };
    writeJson(DETAIL_KEY, out);
    return out;
  }

  function readLastOcrDetail() {
    return readJson(DETAIL_KEY);
  }

  function clearLastOcrDetail() {
    return removeKey(DETAIL_KEY);
  }

  function safeText(value) {
    return String(value == null ? "" : value).trim();
  }

  function secondsLabel(ms) {
    var n = Number(ms);
    if (!Number.isFinite(n) || n < 0) return "no disponible";
    if (n < 1000) return "menos de 1 segundo";
    var seconds = Math.max(1, Math.round(n / 1000));
    return seconds === 1 ? "1 segundo" : seconds + " segundos";
  }

  function engineSignature(engine, info) {
    var source = safeText(info && (info.firma || info.motor || info.source));
    if (source) return source;
    if (engine === "vision") return "FUENTE_REAL: GOOGLE_VISION_OCR";
    if (engine === "deepseek") return "FUENTE_REAL: DEEPSEEK_OCR_VERTEX_AI";
    return "FUENTE_REAL: OCR_NO_IDENTIFICADO";
  }

  function engineBlock(title, engine, info) {
    var safe = info && typeof info === "object" ? info : {};
    var lines = [];
    lines.push("[" + title + "]");
    lines.push("Firma: " + engineSignature(engine, safe));
    lines.push("Tiempo: " + secondsLabel(safe.elapsedMs));
    lines.push("Estado: " + (safe.ok === false ? "AVISO" : "OK"));
    if (safe.message) lines.push("Mensaje: " + safeText(safe.message));
    lines.push("Texto devuelto:");
    lines.push(safeText(safe.texto || safe.text || safe.ocrTexto || safe.message) || "(sin texto)");
    if (safe.rawJson || safe.raw) {
      lines.push("");
      lines.push("Respuesta completa del motor:");
      lines.push(safeText(safe.rawJson || safe.raw));
    }
    return lines;
  }

  function formatOcrDetailForCopy(detail) {
    var d = detail || readLastOcrDetail();
    if (!d) return "";
    var modo = normalizeMode(d.modo);
    var lines = [];
    lines.push("DETALLE OCR - ULTIMO ANALISIS REAL");
    lines.push("Fecha: " + safeText(d.createdAt));
    lines.push("Motor seleccionado en Ajustes: " + modeLabel(modo));
    lines.push("Estado: " + (d.ok ? "OK" : "AVISO"));
    if (d.message) lines.push("Mensaje: " + safeText(d.message));
    lines.push("");
    if (modo === "vision") {
      lines = lines.concat(engineBlock("MOTOR USADO", "vision", d.vision));
    } else if (modo === "deepseek") {
      lines = lines.concat(engineBlock("MOTOR USADO", "deepseek", d.deepseek));
    } else {
      lines = lines.concat(engineBlock("MOTOR 1", "vision", d.vision));
      lines.push("");
      lines = lines.concat(engineBlock("MOTOR 2", "deepseek", d.deepseek));
      lines.push("");
      lines.push("[TEXTO FINAL FUSIONADO QUE RECIBE BOXER1]");
      lines.push("Firma: FUENTE_REAL: FUSION_LOCAL_VISION_DEEPSEEK");
      lines.push("Tiempo fusion: " + secondsLabel(d.fusion && d.fusion.elapsedMs));
      lines.push(safeText(d.fusion && (d.fusion.textoOCRFinal || d.fusion.message)) || "(sin fusion)");
    }
    return lines.join("\n");
  }

  var api = {
    SETTINGS_KEY: SETTINGS_KEY,
    DETAIL_KEY: DETAIL_KEY,
    getSettings: getSettings,
    saveSettings: saveSettings,
    normalizeMode: normalizeMode,
    modeLabel: modeLabel,
    saveLastOcrDetail: saveLastOcrDetail,
    readLastOcrDetail: readLastOcrDetail,
    clearLastOcrDetail: clearLastOcrDetail,
    formatOcrDetailForCopy: formatOcrDetailForCopy
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (globalScope) globalScope.AppV2OcrSettings = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
