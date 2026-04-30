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

  function formatOcrDetailForCopy(detail) {
    var d = detail || readLastOcrDetail();
    if (!d) return "";
    var lines = [];
    lines.push("Detalle OCR");
    lines.push("Fecha: " + safeText(d.createdAt));
    lines.push("Modo: " + modeLabel(d.modo));
    lines.push("Estado: " + (d.ok ? "OK" : "AVISO"));
    if (d.message) lines.push("Mensaje: " + safeText(d.message));
    lines.push("");
    lines.push("[Vision]");
    lines.push(safeText(d.vision && (d.vision.texto || d.vision.message)) || "(sin texto)");
    lines.push("");
    lines.push("[DeepSeek-OCR]");
    lines.push(safeText(d.deepseek && (d.deepseek.texto || d.deepseek.message)) || "(sin texto)");
    lines.push("");
    lines.push("[Fusion final]");
    lines.push(safeText(d.fusion && (d.fusion.textoOCRFinal || d.fusion.message)) || "(sin fusion)");
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
