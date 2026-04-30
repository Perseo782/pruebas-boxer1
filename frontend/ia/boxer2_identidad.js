(function initBoxer2IdentidadModule(globalScope) {
  "use strict";

  var contratos = null;
  var errores = null;

  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./boxer2_contratos.js");
      errores = require("./boxer2_errores.js");
    } catch (errRequire) {
      contratos = null;
      errores = null;
    }
  }

  if (!contratos && globalScope && globalScope.Boxer2Contratos) contratos = globalScope.Boxer2Contratos;
  if (!errores && globalScope && globalScope.Boxer2Errores) errores = globalScope.Boxer2Errores;

  var MODULE_NAME = contratos.MODULE_NAME;
  var PASSPORTS = contratos.PASSPORTS;
  var CONFIDENCE = contratos.CONFIDENCE;
  var IA_STATES = contratos.IA_STATES;
  var TASK_DEFINITIONS = contratos.TASK_DEFINITIONS;
  var ACTIONS = contratos.ACTIONS;
  var SUGGESTED_ACTIONS = contratos.SUGGESTED_ACTIONS;
  var ERROR_CODES = errores.ERROR_CODES;

  var SCORE_RULES = Object.freeze({
    COMMERCIAL_BLOCK: 48,
    UNKNOWN_BLOCK: 24,
    CLAIM_BLOCK: 8,
    EARLY_ZONE: 18,
    NEAR_TOP_ZONE: 10,
    IDEAL_WORDS: 16,
    ACCEPTABLE_WORDS: 8,
    NO_DIGITS: 10,
    NO_WEIGHT: 8,
    TITLE_SHAPE: 8,
    NATURAL_FUSION: 6,
    BRAND_HINT: 6,
    INGREDIENTS_PENALTY: -70,
    NUTRITION_PENALTY: -70,
    LEGAL_PENALTY: -55,
    STORAGE_PENALTY: -45,
    CLAIM_PENALTY: -18,
    WEIGHT_PENALTY: -25,
    DIGIT_PENALTY: -10,
    LONG_PENALTY: -16,
    COMMA_PENALTY: -18,
    TECHNICAL_STEP: -8,
    BAD_ORIGIN_PENALTY: -15
  });

  var KNOWN_LANGS = ["es", "fr", "en", "it", "pt"];
  var LANGUAGE_HINTS = Object.freeze({
    es: ["ingredientes", "contiene", "mostaza", "aceitunas", "queso", "sabor", "conservar"],
    fr: ["ingredients", "moutarde", "ancienne", "fromage", "olive", "conserver"],
    en: ["ingredients", "mustard", "cheese", "olive", "contains", "keep"],
    it: ["ingredienti", "senape", "antica", "formaggio", "olive", "conservare"],
    pt: ["ingredientes", "mostarda", "antiga", "queijo", "azeitonas", "conservar"]
  });

  var PHRASE_TRANSLATIONS = Object.freeze({
    fr: {
      "moutarde ancienne": "mostaza antigua",
      "olives vertes": "aceitunas verdes",
      "fromage affine": "queso curado",
      "fromage affinee": "queso curado"
    },
    en: {
      "old fashioned mustard": "mostaza antigua",
      "traditional mustard": "mostaza tradicional",
      "green olives": "aceitunas verdes",
      "cured cheese": "queso curado"
    },
    it: {
      "senape antica": "mostaza antigua",
      "olive verdi": "aceitunas verdes",
      "formaggio stagionato": "queso curado"
    },
    pt: {
      "mostarda antiga": "mostaza antigua",
      "azeitonas verdes": "aceitunas verdes",
      "queijo curado": "queso curado"
    }
  });

  var TOKEN_TRANSLATIONS = Object.freeze({
    fr: {
      moutarde: "mostaza",
      ancienne: "antigua",
      traditionnelle: "tradicional",
      olives: "aceitunas",
      olive: "aceituna",
      vertes: "verdes",
      verte: "verde",
      fromage: "queso",
      affine: "curado",
      affinee: "curado"
    },
    en: {
      mustard: "mostaza",
      old: "antigua",
      fashioned: "antigua",
      traditional: "tradicional",
      green: "verdes",
      olives: "aceitunas",
      olive: "aceituna",
      cured: "curado",
      cheese: "queso"
    },
    it: {
      senape: "mostaza",
      antica: "antigua",
      tradizionale: "tradicional",
      olive: "aceitunas",
      verdi: "verdes",
      formaggio: "queso",
      stagionato: "curado"
    },
    pt: {
      mostarda: "mostaza",
      antiga: "antigua",
      tradicional: "tradicional",
      azeitonas: "aceitunas",
      verdes: "verdes",
      queijo: "queso",
      curado: "curado"
    }
  });

  var ACCENT_FIXES = Object.freeze({
    bunuelos: "buñuelos",
    pate: "paté",
    iberico: "ibérico",
    clasico: "clásico",
    clasica: "clásica",
    organico: "orgánico",
    alinadas: "aliñadas",
    aliniadas: "aliñadas"
  });

  var SPANISH_LOWERCASE_WORDS = Object.freeze({
    a: true,
    al: true,
    con: true,
    de: true,
    del: true,
    e: true,
    el: true,
    en: true,
    la: true,
    las: true,
    los: true,
    para: true,
    por: true,
    sin: true,
    y: true
  });

  var SPANISH_UPPERCASE_TOKENS = Object.freeze({
    aove: true,
    brc: true,
    ce: true,
    dop: true,
    ifs: true,
    igp: true,
    msc: true,
    ue: true
  });

  var WEIGHT_PATTERN = /\b\d{1,4}(?:[.,]\d{1,2})?\s?(?:kg|g|mg|l|ml|cl|ud|uds|unidades|capsulas|capsules|pack|x)\b/i;
  var INGREDIENTS_PATTERN = /^(ingredientes?|ingredients?|ingredienti|ingr[eé]dients?)\b|\b(contiene|contains|puede contener|may contain|trazas?|traces?)\b/i;
  var NUTRITION_PATTERN = /^(informacion nutricional|informaci[oó]n nutricional|declaracion nutricional|declaraci[oó]n nutricional|nutrition facts|nutrition|valor energ[eé]tico|energia|grasas|lipidos|hidratos|proteinas|proteins|salt|sal)\b/i;
  var LEGAL_PATTERN = /^(fabricado por|producido por|producido para|distribuido por|distributed by|importado por|direcci[oó]n|address|registro sanitario|registro|lote)\b/i;
  var STORAGE_PATTERN = /\b(preferentemente antes|best before|consumir preferentemente|conservar|mantener|frigorifico|frigor[ií]fico|keep refrigerated|store in)\b/i;
  var CLAIM_PATTERN = /^(sin gluten|gluten free|bio|eco|vegan|vegano|vegana|alto en|rich in|fuente de)\b/i;

  function nowMs() {
    return Date.now();
  }

  function generateId(prefix) {
    return String(prefix || "b2") + "_" + Math.random().toString(36).slice(2, 10);
  }

  function startOperation(meta) {
    var safeMeta = meta || {};
    return {
      analysisId: safeMeta.analysisId || "",
      traceId: safeMeta.traceId || "",
      startedAt: nowMs(),
      eventos: []
    };
  }

  function elapsedSince(startedAt) {
    return Math.max(0, nowMs() - Number(startedAt || nowMs()));
  }

  function pushEvent(metricCtx, level, code, message, detail) {
    if (!metricCtx) return;
    metricCtx.eventos.push({
      level: level,
      code: code,
      message: message,
      detail: detail || null,
      elapsedMs: elapsedSince(metricCtx.startedAt),
      traceId: metricCtx.traceId
    });
  }

  function finalizeMetricas(metricCtx, extra) {
    var safe = metricCtx || {};
    var addon = extra || {};
    return {
      traceId: safe.traceId || null,
      analysisId: safe.analysisId || null,
      elapsedMs: elapsedSince(safe.startedAt),
      totalEventos: Array.isArray(safe.eventos) ? safe.eventos.length : 0,
      totalCandidatos: addon.totalCandidatos || 0,
      modoResolucion: addon.modoResolucion || "ninguno_claro",
      iaUsada: !!addon.iaUsada,
      eventos: Array.isArray(safe.eventos) ? safe.eventos : []
    };
  }

  function stripMarks(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function collapseText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeCompareText(value) {
    return stripMarks(value).replace(/[^a-z0-9]+/g, " ").trim();
  }

  function splitWords(value) {
    return collapseText(value).split(/\s+/).filter(Boolean);
  }

  function splitTextLines(text) {
    var raw = String(text || "").replace(/\r/g, "").split(/\n+/);
    if (raw.length <= 1) {
      raw = String(text || "").split(/[.;]+/);
    }
    return raw.map(function each(item) {
      return collapseText(item);
    }).filter(Boolean);
  }

  function cleanupCandidateText(text) {
    var cleaned = String(text || "")
      .replace(/^[\-•·*\s]+/, "")
      .replace(/[|]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[,:;]+$/g, "")
      .trim();

    cleaned = cleaned.replace(/\b(?:\d{1,4}(?:[.,]\d{1,2})?\s?(?:kg|g|mg|l|ml|cl|ud|uds|x))\b/gi, " ");
    cleaned = cleaned.replace(/\b(?:sin gluten|gluten free|bio|eco|vegan|vegano|vegana)\b/gi, " ");
    cleaned = collapseText(cleaned);

    if (/^[^a-zA-ZÀ-ÿ]*$/.test(cleaned)) return "";
    return cleaned;
  }

  function inferLanguage(structure, metadata) {
    var hint = metadata && metadata.idiomaProbable ? String(metadata.idiomaProbable).toLowerCase() : "";
    if (KNOWN_LANGS.indexOf(hint) >= 0) return hint;

    var base = normalizeCompareText((structure.textoAuditado || "") + " " + (structure.textoBaseVision || ""));
    if (!base) return "desconocido";

    var bestLang = "desconocido";
    var bestScore = 0;
    var lang;
    var i;
    for (lang in LANGUAGE_HINTS) {
      if (!Object.prototype.hasOwnProperty.call(LANGUAGE_HINTS, lang)) continue;
      var score = 0;
      for (i = 0; i < LANGUAGE_HINTS[lang].length; i += 1) {
        if (base.indexOf(normalizeCompareText(LANGUAGE_HINTS[lang][i])) >= 0) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestLang = lang;
      }
    }
    return bestScore > 0 ? bestLang : "desconocido";
  }

  function reconstructStructure(normalizedInput) {
    var datos = normalizedInput.datos || {};
    var lineas = Array.isArray(datos.lineasOCR) ? datos.lineasOCR.slice() : [];
    if (!lineas.length) {
      lineas = splitTextLines(datos.textoAuditado || datos.textoBaseVision || "");
    }

    var bloques = Array.isArray(datos.bloquesOCR) ? datos.bloquesOCR.slice() : [];
    if (!bloques.length) {
      bloques = lineas.map(function each(linea, index) {
        return {
          texto: linea,
          orden: index,
          tipoBloqueSugerido: null,
          origenBloque: lineas.length ? "reconstruido_desde_linea" : "reconstruido_desde_texto"
        };
      });
    }

    return {
      textoAuditado: String(datos.textoAuditado || "").trim(),
      textoBaseVision: String(datos.textoBaseVision || "").trim(),
      lineasOCR: lineas,
      bloquesOCR: bloques,
      metadatosOpcionales: datos.metadatosOpcionales || {}
    };
  }

  function classifyEntry(text, order) {
    var safeText = collapseText(text);
    var lower = stripMarks(safeText);
    var wordCount = splitWords(safeText).length;
    var commaCount = (safeText.match(/,/g) || []).length;
    var kind = "desconocido";
    var discard = false;
    var badOrigin = false;
    var contamination = 0;

    if (!safeText) {
      return null;
    }

    if (INGREDIENTS_PATTERN.test(lower) || (commaCount >= 2 && /:/.test(safeText))) {
      kind = "ingredientes";
      discard = true;
      badOrigin = true;
      contamination = 4;
    } else if (NUTRITION_PATTERN.test(lower)) {
      kind = "nutricional";
      discard = true;
      badOrigin = true;
      contamination = 4;
    } else if (LEGAL_PATTERN.test(lower)) {
      kind = "legal";
      discard = true;
      badOrigin = true;
      contamination = 3;
    } else if (STORAGE_PATTERN.test(lower)) {
      kind = "conservacion";
      discard = true;
      badOrigin = true;
      contamination = 3;
    } else if (WEIGHT_PATTERN.test(safeText) && wordCount <= 3) {
      kind = "peso";
      discard = true;
      badOrigin = true;
      contamination = 3;
    } else if (CLAIM_PATTERN.test(lower)) {
      kind = "claim";
      discard = false;
      badOrigin = false;
      contamination = 2;
    } else if (Number(order) <= 2 && wordCount >= 1 && wordCount <= 8 && !/[,:]/.test(safeText)) {
      kind = "comercial";
    }

    return {
      text: safeText,
      normalized: normalizeCompareText(safeText),
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
      kind: kind,
      discard: discard,
      badOrigin: badOrigin,
      technicalContamination: contamination,
      commaCount: commaCount,
      wordCount: wordCount
    };
  }

  function buildEntries(structure) {
    var rawEntries = [];
    var bloques = Array.isArray(structure.bloquesOCR) ? structure.bloquesOCR : [];
    var i;
    if (bloques.length) {
      for (i = 0; i < bloques.length; i += 1) {
        var bloque = bloques[i] || {};
        var entry = classifyEntry(bloque.texto, bloque.orden);
        if (entry) rawEntries.push(entry);
      }
      return rawEntries;
    }

    var lines = Array.isArray(structure.lineasOCR) ? structure.lineasOCR : [];
    for (i = 0; i < lines.length; i += 1) {
      var lineEntry = classifyEntry(lines[i], i);
      if (lineEntry) rawEntries.push(lineEntry);
    }
    return rawEntries;
  }

  function makeCandidate(text, baseEntry, metadata, isFusion) {
    var literal = cleanupCandidateText(text);
    if (!literal) return null;

    var normalized = normalizeCompareText(literal);
    var words = splitWords(literal);
    if (!normalized || !words.length || words.length > 9) return null;

    var brandNormalized = metadata && metadata.marcaDetectada ? normalizeCompareText(metadata.marcaDetectada) : "";
    return {
      id: generateId("cand"),
      literal: literal,
      normalized: normalized,
      order: baseEntry.order,
      sourceKind: baseEntry.kind,
      badOrigin: !!baseEntry.badOrigin,
      fromIngredients: baseEntry.kind === "ingredientes",
      fromNutrition: baseEntry.kind === "nutricional",
      technicalContamination: baseEntry.technicalContamination,
      containsWeight: WEIGHT_PATTERN.test(literal),
      containsDigits: /\d/.test(literal),
      commaCount: (literal.match(/,/g) || []).length,
      wordCount: words.length,
      usefulLength: words.join("").length,
      isFusion: !!isFusion,
      metadataBrandMatch: !!(brandNormalized && normalized.indexOf(brandNormalized) >= 0),
      score: 0,
      scoreBreakdown: [],
      tieBreakReason: null
    };
  }

  function buildCandidates(entries, metadata) {
    var candidates = [];
    var seen = Object.create(null);
    var i;

    for (i = 0; i < entries.length; i += 1) {
      var entry = entries[i];
      if (!entry || entry.discard) continue;
      var candidate = makeCandidate(entry.text, entry, metadata, false);
      if (!candidate || seen[candidate.normalized]) continue;
      seen[candidate.normalized] = true;
      candidates.push(candidate);
    }

    for (i = 0; i < entries.length - 1; i += 1) {
      var current = entries[i];
      var next = entries[i + 1];
      if (!current || !next || current.discard || next.discard) continue;
      if (next.order !== current.order + 1) continue;
      if (current.technicalContamination > 1 || next.technicalContamination > 1) continue;
      var fusionText = cleanupCandidateText(current.text + " " + next.text);
      var fusionWords = splitWords(fusionText);
      if (!fusionText || fusionWords.length < 2 || fusionWords.length > 8) continue;
      var fusionBase = {
        order: current.order,
        kind: current.kind === "comercial" ? current.kind : next.kind,
        badOrigin: current.badOrigin || next.badOrigin,
        technicalContamination: current.technicalContamination + next.technicalContamination
      };
      var fusion = makeCandidate(fusionText, fusionBase, metadata, true);
      if (!fusion || seen[fusion.normalized]) continue;
      seen[fusion.normalized] = true;
      candidates.push(fusion);
    }

    return candidates;
  }

  function addScore(candidate, label, value) {
    candidate.score += value;
    candidate.scoreBreakdown.push({ factor: label, value: value });
  }

  function scoreCandidate(candidate) {
    candidate.score = 0;
    candidate.scoreBreakdown = [];

    if (candidate.sourceKind === "comercial") addScore(candidate, "bloque_comercial", SCORE_RULES.COMMERCIAL_BLOCK);
    else if (candidate.sourceKind === "claim") addScore(candidate, "bloque_claim", SCORE_RULES.CLAIM_BLOCK);
    else addScore(candidate, "bloque_neutro", SCORE_RULES.UNKNOWN_BLOCK);

    if (candidate.order <= 1) addScore(candidate, "zona_cabecera", SCORE_RULES.EARLY_ZONE);
    else if (candidate.order <= 3) addScore(candidate, "zona_superior", SCORE_RULES.NEAR_TOP_ZONE);

    if (candidate.wordCount >= 2 && candidate.wordCount <= 6) addScore(candidate, "longitud_ideal", SCORE_RULES.IDEAL_WORDS);
    else if (candidate.wordCount <= 8) addScore(candidate, "longitud_aceptable", SCORE_RULES.ACCEPTABLE_WORDS);
    else addScore(candidate, "demasiado_largo", SCORE_RULES.LONG_PENALTY);

    if (!candidate.containsDigits) addScore(candidate, "sin_digitos", SCORE_RULES.NO_DIGITS);
    else addScore(candidate, "con_digitos", SCORE_RULES.DIGIT_PENALTY);

    if (!candidate.containsWeight) addScore(candidate, "sin_peso", SCORE_RULES.NO_WEIGHT);
    else addScore(candidate, "con_peso", SCORE_RULES.WEIGHT_PENALTY);

    if (/^[A-Za-zÀ-ÿ\s]+$/.test(candidate.literal)) addScore(candidate, "forma_titulo", SCORE_RULES.TITLE_SHAPE);
    if (candidate.isFusion) addScore(candidate, "fusion_natural", SCORE_RULES.NATURAL_FUSION);
    if (candidate.metadataBrandMatch) addScore(candidate, "marca_detectada", SCORE_RULES.BRAND_HINT);

    if (candidate.sourceKind === "ingredientes") addScore(candidate, "penaliza_ingredientes", SCORE_RULES.INGREDIENTS_PENALTY);
    if (candidate.sourceKind === "nutricional") addScore(candidate, "penaliza_nutricional", SCORE_RULES.NUTRITION_PENALTY);
    if (candidate.sourceKind === "legal") addScore(candidate, "penaliza_legal", SCORE_RULES.LEGAL_PENALTY);
    if (candidate.sourceKind === "conservacion") addScore(candidate, "penaliza_conservacion", SCORE_RULES.STORAGE_PENALTY);
    if (candidate.sourceKind === "claim") addScore(candidate, "penaliza_claim", SCORE_RULES.CLAIM_PENALTY);
    if (candidate.badOrigin) addScore(candidate, "origen_malo", SCORE_RULES.BAD_ORIGIN_PENALTY);
    if (candidate.commaCount >= 2) addScore(candidate, "muchas_comas", SCORE_RULES.COMMA_PENALTY);
    if (candidate.technicalContamination > 0) addScore(candidate, "contaminacion_tecnica", SCORE_RULES.TECHNICAL_STEP * candidate.technicalContamination);

    return candidate;
  }

  function compareTieBreakDetailed(a, b) {
    if (!!a.fromIngredients !== !!b.fromIngredients) {
      return { value: a.fromIngredients ? 1 : -1, reason: "no_ingredientes" };
    }
    if (!!a.fromNutrition !== !!b.fromNutrition) {
      return { value: a.fromNutrition ? 1 : -1, reason: "no_nutricional" };
    }
    if (a.order !== b.order) {
      return { value: a.order < b.order ? -1 : 1, reason: "arriba_lectura" };
    }
    if (a.usefulLength !== b.usefulLength) {
      return { value: a.usefulLength > b.usefulLength ? -1 : 1, reason: "mayor_longitud_util" };
    }
    if (a.technicalContamination !== b.technicalContamination) {
      return { value: a.technicalContamination < b.technicalContamination ? -1 : 1, reason: "menor_contaminacion" };
    }
    return { value: 0, reason: "orden_lectura_estable" };
  }

  function sortCandidates(candidates) {
    return candidates.slice().sort(function sort(a, b) {
      if (b.score !== a.score) return b.score - a.score;
      var tie = compareTieBreakDetailed(a, b);
      return tie.value;
    });
  }

  function confidenceFromScore(score) {
    if (score >= 90) return CONFIDENCE.ALTA;
    if (score >= 70) return CONFIDENCE.MEDIA;
    return CONFIDENCE.BAJA;
  }

  function resolveLocally(ranked) {
    var top = ranked[0] || null;
    var second = ranked[1] || null;
    if (!top) {
      return { resolved: false, reason: ERROR_CODES.NOMBRE_NO_DETECTADO };
    }

    if (!second) {
      if (top.score >= 70 && !top.badOrigin) {
        return {
          resolved: true,
          candidate: top,
          mode: "local",
          reason: "ganador_unico",
          confidence: confidenceFromScore(top.score)
        };
      }
      return { resolved: false, reason: ERROR_CODES.NO_SEGURO };
    }

    var margin = top.score - second.score;
    if (top.score >= 70 && margin >= 15 && !top.badOrigin) {
      return {
        resolved: true,
        candidate: top,
        mode: "local",
        reason: "ganador_claro",
        confidence: confidenceFromScore(top.score)
      };
    }

    if (top.score === second.score && top.score >= 70 && !top.badOrigin) {
      var tie = compareTieBreakDetailed(top, second);
      top.tieBreakReason = tie.reason;
      if (tie.reason !== "orden_lectura_estable") {
        return {
          resolved: true,
          candidate: top,
          mode: "local",
          reason: "desempate_" + tie.reason,
          confidence: CONFIDENCE.MEDIA
        };
      }
    }

    return {
      resolved: false,
      reason: ERROR_CODES.NO_SEGURO,
      margin: margin,
      top: top,
      second: second
    };
  }

  function buildShortlist(ranked) {
    return ranked.slice(0, 3).map(function each(candidate, index) {
      return {
        id: "candidato_" + (index + 1),
        literal: candidate.literal,
        candidate: candidate
      };
    });
  }

  function applyPhraseTranslation(text, lang) {
    var map = PHRASE_TRANSLATIONS[lang] || {};
    var normalized = normalizeCompareText(text);
    return map[normalized] || null;
  }

  function fixSpanishToken(token) {
    var normalized = stripMarks(token);
    if (Object.prototype.hasOwnProperty.call(ACCENT_FIXES, normalized)) {
      return ACCENT_FIXES[normalized];
    }
    return token;
  }

  function translateToSpanish(text, lang, metadata) {
    var original = collapseText(text);
    if (!original) return "";
    if (!lang || lang === "es" || lang === "desconocido") return original;

    var phrase = applyPhraseTranslation(original, lang);
    if (phrase) return phrase;

    var brandName = metadata && metadata.marcaDetectada ? collapseText(metadata.marcaDetectada) : "";
    var brandCompare = normalizeCompareText(brandName);
    var tokenMap = TOKEN_TRANSLATIONS[lang] || {};
    var tokens = splitWords(original);
    var out = [];
    var i;

    for (i = 0; i < tokens.length; i += 1) {
      var token = tokens[i];
      var compare = normalizeCompareText(token);
      if (brandCompare && compare === brandCompare) {
        out.push(brandName);
      } else if (tokenMap[compare]) {
        out.push(tokenMap[compare]);
      } else {
        out.push(stripMarks(token));
      }
    }

    return collapseText(out.join(" "));
  }

  function normalizeFinalName(text, lang, metadata) {
    var translated = translateToSpanish(text, lang, metadata);
    var cleaned = cleanupCandidateText(translated || text);
    cleaned = cleaned.replace(/\b(?:fabricado|producido|ingredientes|nutrition|contains|contiene)\b.*$/i, "");
    cleaned = collapseText(cleaned);
    if (!cleaned) return "";

    var brandName = metadata && metadata.marcaDetectada ? collapseText(metadata.marcaDetectada) : "";
    var brandCompare = normalizeCompareText(brandName);
    var words = splitWords(cleaned);
    var out = [];
    var i;

    for (i = 0; i < words.length; i += 1) {
      var originalWord = words[i];
      var word = fixSpanishToken(originalWord);
      var compare = normalizeCompareText(word);
      if (brandCompare && compare === brandCompare) {
        out.push(brandName);
      } else if (i > 0 && SPANISH_LOWERCASE_WORDS[compare]) {
        out.push(word.toLowerCase());
      } else if (shouldKeepUppercaseToken(originalWord, compare)) {
        out.push(originalWord);
      } else {
        var lower = word.toLowerCase();
        if (i === 0) out.push(lower.charAt(0).toUpperCase() + lower.slice(1));
        else out.push(lower);
      }
    }

    return collapseText(out.join(" "));
  }

  function shouldKeepUppercaseToken(originalWord, compare) {
    if (!/^[A-Z0-9]{2,6}$/.test(originalWord)) return false;
    if (Object.prototype.hasOwnProperty.call(ACCENT_FIXES, normalizeCompareText(originalWord))) return false;
    if (SPANISH_LOWERCASE_WORDS[compare]) return false;
    if (SPANISH_UPPERCASE_TOKENS[compare]) return true;
    if (/\d/.test(originalWord)) return true;
    return !/[aeiou]/.test(compare);
  }

  function buildCandidateView(candidate) {
    return {
      literal: candidate.literal,
      score: candidate.score,
      origen: candidate.sourceKind,
      banderaRoja: !!candidate.badOrigin,
      detalleScore: candidate.scoreBreakdown
    };
  }

  function normalizeIaResponse(raw) {
    var safeRaw = raw || {};
    var payload = safeRaw && safeRaw.data ? safeRaw.data : safeRaw;
    if (payload && payload.resultado) payload = payload.resultado;
    if (payload && payload.data) payload = payload.data;
    if (payload && payload.respuesta) payload = payload.respuesta;
    if (!contratos.asPlainObject(payload)) {
      return { ok: false, code: ERROR_CODES.SALIDA_IA_INVALIDA, message: "IA Boxer2 no devolvio JSON util." };
    }

    var decision = collapseText(payload.decision || "");
    var nombre = collapseText(payload.nombre_comercial_es || payload.nombreComercialEs || "");
    var literal = collapseText(payload.literal_origen || payload.literalOrigen || "");
    var confidence = contratos.normalizeConfidence(payload.confidence || CONFIDENCE.MEDIA);
    var motivo = collapseText(payload.motivo_duda || payload.motivoDuda || "");

    if (!decision) {
      return { ok: false, code: ERROR_CODES.SALIDA_IA_INVALIDA, message: "IA Boxer2 no devolvio decision." };
    }

    return {
      ok: true,
      taskId: collapseText(safeRaw.taskId || payload.taskId || ""),
      analysisId: collapseText(safeRaw.analysisId || payload.analysisId || ""),
      traceId: collapseText(safeRaw.traceId || payload.traceId || ""),
      tipoTarea: collapseText(safeRaw.tipoTarea || payload.tipoTarea || ""),
      schemaId: collapseText(safeRaw.schemaId || payload.schemaId || ""),
      decision: decision,
      nombre: nombre,
      literal: literal,
      confidence: confidence,
      motivo: motivo
    };
  }

  function serializeShortlist(shortlist) {
    return shortlist.map(function each(item) {
      return {
        id: item.id,
        literal: item.literal
      };
    });
  }

  function buildPromptFuncional(shortlist) {
    var resumen = serializeShortlist(shortlist).map(function each(item) {
      return item.id + ": " + item.literal;
    }).join("; ");
    return "Elige solo un candidato de la shortlist o responde ninguno_claro. Devuelve JSON con decision, nombre_comercial_es, literal_origen, confidence y motivo_duda. Shortlist: " + resumen;
  }

  function buildIaTask(shortlist, structure, idioma, context) {
    return {
      analysisId: context.analysisId,
      traceId: context.traceId,
      taskId: TASK_DEFINITIONS.IDENTIDAD.TASK_ID,
      moduloSolicitante: MODULE_NAME,
      tipoTarea: TASK_DEFINITIONS.IDENTIDAD.TIPO_TAREA,
      schemaId: TASK_DEFINITIONS.IDENTIDAD.SCHEMA_ID,
      payload: {
        textoAuditado: structure.textoAuditado || structure.textoBaseVision || "",
        idiomaProbable: idioma,
        shortlist: serializeShortlist(shortlist),
        promptFuncional: buildPromptFuncional(shortlist)
      },
      respuestaEsperada: {
        formato: "json",
        campos: ["decision", "nombre_comercial_es", "literal_origen", "confidence", "motivo_duda"]
      }
    };
  }

  function buildMetricasForEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    if (safeContext.metricCtx) {
      return finalizeMetricas(safeContext.metricCtx, {
        totalCandidatos: safeOptions.totalCandidatos || 0,
        modoResolucion: safeOptions.datos ? safeOptions.datos.modoResolucion : "ninguno_claro",
        iaUsada: !!safeOptions.iaUsada
      });
    }
    return safeContext.metricas || null;
  }

  function buildEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    var elapsedMs = safeContext.metricCtx
      ? elapsedSince(safeContext.metricCtx.startedAt)
      : Math.max(0, Number(safeContext.elapsedMs) || 0);
    var metricas = buildMetricasForEnvelope(safeContext, safeOptions);
    return {
      modulo: MODULE_NAME,
      estadoIA: contratos.normalizeIaState(safeOptions.estadoIA || IA_STATES.NO_NECESITA_LLAMADA),
      tareasIA: Array.isArray(safeOptions.tareasIA) ? safeOptions.tareasIA : [],
      resultadoLocal: {
        analysisId: safeContext.analysisId || null,
        traceId: safeContext.traceId || null,
        modulo: MODULE_NAME,
        elapsedMs: elapsedMs,
        estadoPasaporteModulo: safeOptions.passport || PASSPORTS.VERDE,
        accionSugeridaParaCerebro: safeOptions.suggestedAction || SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO,
        confidence: safeOptions.confidence || CONFIDENCE.MEDIA,
        requiereRevision: !!safeOptions.requiresRevision,
        datos: safeOptions.datos || {},
        error: safeOptions.error || null,
        metricas: metricas
      },
      elapsedMs: elapsedMs,
      traceId: safeContext.traceId
    };
  }

  function buildSuccessEnvelope(context, options) {
    return buildEnvelope(context, options || {});
  }

  function buildPendingIaEnvelope(context, options) {
    var safeOptions = options || {};
    return buildEnvelope(context, {
      estadoIA: IA_STATES.NECESITA_LLAMADA,
      tareasIA: safeOptions.tareasIA || [],
      passport: safeOptions.passport || PASSPORTS.NARANJA,
      suggestedAction: safeOptions.suggestedAction || SUGGESTED_ACTIONS.CONTINUAR_Y_MARCAR_REVISION,
      confidence: safeOptions.confidence || CONFIDENCE.MEDIA,
      requiresRevision: true,
      totalCandidatos: safeOptions.totalCandidatos || 0,
      datos: safeOptions.datos || {}
    });
  }

  function buildCloseContext(resultadoLocal) {
    var safeLocal = contratos.asPlainObject(resultadoLocal) ? resultadoLocal : {};
    return {
      moduleName: MODULE_NAME,
      analysisId: safeLocal.analysisId || null,
      traceId: safeLocal.traceId || null,
      elapsedMs: Math.max(0, Number(safeLocal.elapsedMs) || 0),
      metricas: safeLocal.metricas || null
    };
  }

  function B2_cerrarConSubrespuestaIA(subrespuesta, resultadoLocal) {
    var safeLocal = contratos.asPlainObject(resultadoLocal) ? resultadoLocal : {};
    var context = buildCloseContext(safeLocal);
    var datos = contratos.asPlainObject(safeLocal.datos) ? safeLocal.datos : {};
    var contextoIA = contratos.asPlainObject(datos.contextoIA) ? datos.contextoIA : {};
    var shortlist = Array.isArray(contextoIA.shortlist) ? contextoIA.shortlist : [];
    var idioma = contextoIA.idiomaOrigen || datos.idiomaOrigen || "desconocido";
    var metadata = {
      marcaDetectada: contextoIA.marcaDetectada || null
    };
    var normalized = normalizeIaResponse(subrespuesta);

    if (!normalized.ok) {
      return errores.buildFailureEnvelope(context, {
        code: normalized.code,
        message: normalized.message,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }

    if (normalized.taskId && normalized.taskId !== TASK_DEFINITIONS.IDENTIDAD.TASK_ID) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "taskId invalido en cierre IA Boxer2.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.analysisId && context.analysisId && normalized.analysisId !== context.analysisId) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "analysisId invalido en cierre IA Boxer2.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.traceId && context.traceId && normalized.traceId !== context.traceId) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "traceId invalido en cierre IA Boxer2.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.tipoTarea && normalized.tipoTarea !== TASK_DEFINITIONS.IDENTIDAD.TIPO_TAREA) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "tipoTarea invalido en cierre IA Boxer2.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.schemaId && normalized.schemaId !== TASK_DEFINITIONS.IDENTIDAD.SCHEMA_ID) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "schemaId invalido en cierre IA Boxer2.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (!shortlist.length) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "No hay shortlist local para cerrar IA Boxer2.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }

    if (normalized.decision === "ninguno_claro") {
      return buildSuccessEnvelope(context, {
        estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
        passport: PASSPORTS.NARANJA,
        suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
        confidence: normalized.confidence || CONFIDENCE.BAJA,
        requiresRevision: true,
        iaUsada: true,
        datos: {
          nombrePropuesto: datos.nombrePropuesto || "",
          nombre: datos.nombre || "",
          literalDetectado: datos.literalDetectado || "",
          idiomaOrigen: idioma,
          candidatosEvaluados: Array.isArray(datos.candidatosEvaluados) ? datos.candidatosEvaluados : [],
          modoResolucion: "ninguno_claro",
          confidence: normalized.confidence || CONFIDENCE.BAJA,
          requiereRevision: true,
          motivoDuda: normalized.motivo || ERROR_CODES.NO_SEGURO,
          conflictoIdentidad: true,
          dudas: [normalized.motivo || ERROR_CODES.NO_SEGURO],
          alertas: [ERROR_CODES.NO_SEGURO]
        }
      });
    }

    var chosen = null;
    for (var i = 0; i < shortlist.length; i += 1) {
      if (shortlist[i].id === normalized.decision) {
        chosen = shortlist[i];
        break;
      }
    }
    if (!chosen) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "IA Boxer2 eligio un candidato fuera de la shortlist.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }

    var literal = normalized.literal || chosen.literal;
    var nombre = normalizeFinalName(normalized.nombre || literal, idioma, metadata) || normalizeFinalName(literal, idioma, metadata) || literal;
    var confidence = normalized.confidence || CONFIDENCE.MEDIA;

    return buildSuccessEnvelope(context, {
      estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
      passport: confidence === CONFIDENCE.BAJA ? PASSPORTS.NARANJA : PASSPORTS.VERDE,
      suggestedAction: confidence === CONFIDENCE.BAJA ? SUGGESTED_ACTIONS.ABRIR_REVISION : SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO,
      confidence: confidence,
      requiresRevision: confidence === CONFIDENCE.BAJA,
      iaUsada: true,
      datos: {
        nombrePropuesto: nombre,
        nombre: nombre,
        literalDetectado: literal,
        idiomaOrigen: idioma,
        candidatosEvaluados: Array.isArray(datos.candidatosEvaluados) ? datos.candidatosEvaluados : [],
        modoResolucion: "ia",
        confidence: confidence,
        requiereRevision: confidence === CONFIDENCE.BAJA,
        motivoDuda: confidence === CONFIDENCE.BAJA ? (normalized.motivo || ERROR_CODES.NO_SEGURO) : "",
        conflictoIdentidad: confidence === CONFIDENCE.BAJA,
        dudas: confidence === CONFIDENCE.BAJA ? [normalized.motivo || ERROR_CODES.NO_SEGURO] : [],
        alertas: confidence === CONFIDENCE.BAJA ? [ERROR_CODES.NO_SEGURO] : []
      }
    });
  }

  async function procesarAccionContrato(request, deps) {
    var validation = contratos.validateIncomingRequest(request);
    var invalidMetricCtx;

    if (!validation.ok) {
      invalidMetricCtx = startOperation(contratos.normalizeIncomingRequest(request).meta);
      pushEvent(invalidMetricCtx, "error", validation.code, validation.message, validation.detail || null);
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        analysisId: invalidMetricCtx.analysisId || null,
        traceId: invalidMetricCtx.traceId,
        elapsedMs: elapsedSince(invalidMetricCtx.startedAt),
        metricas: finalizeMetricas(invalidMetricCtx, {})
      }, {
        code: validation.code === ERROR_CODES.IDENTIDAD_VACIA ? ERROR_CODES.IDENTIDAD_VACIA : ERROR_CODES.CONTRATO_ENTRADA_INVALIDO,
        message: validation.message,
        suggestedAction: validation.code === ERROR_CODES.IDENTIDAD_VACIA ? SUGGESTED_ACTIONS.ABORTAR_FLUJO : SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        datos: {
          nombrePropuesto: "",
          nombre: "",
          literalDetectado: "",
          idiomaOrigen: "desconocido",
          candidatosEvaluados: [],
          modoResolucion: "ninguno_claro",
          confidence: CONFIDENCE.BAJA,
          requiereRevision: true,
          motivoDuda: validation.code,
          conflictoIdentidad: true,
          dudas: [validation.code],
          alertas: [validation.code]
        }
      });
    }

    var normalizedRequest = validation.normalized;
    var metricCtx = startOperation(normalizedRequest.meta);
    var context = {
      moduleName: MODULE_NAME,
      analysisId: metricCtx.analysisId,
      traceId: metricCtx.traceId,
      metricCtx: metricCtx
    };
    var structure = reconstructStructure(normalizedRequest);
    var metadata = structure.metadatosOpcionales || {};

    pushEvent(metricCtx, "info", "B2_INICIO", "Boxer2 inicia resolucion de identidad.", null);

    if (!structure.textoAuditado && !structure.textoBaseVision && !structure.lineasOCR.length) {
      pushEvent(metricCtx, "error", ERROR_CODES.IDENTIDAD_VACIA, "Boxer2 no tiene texto utilizable.", null);
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        analysisId: metricCtx.analysisId,
        traceId: metricCtx.traceId,
        elapsedMs: elapsedSince(metricCtx.startedAt),
        metricas: finalizeMetricas(metricCtx, {})
      }, {
        code: ERROR_CODES.IDENTIDAD_VACIA,
        message: "Boxer2 recibio identidad vacia.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: {
          nombrePropuesto: "",
          nombre: "",
          literalDetectado: "",
          idiomaOrigen: "desconocido",
          candidatosEvaluados: [],
          modoResolucion: "ninguno_claro",
          confidence: CONFIDENCE.BAJA,
          requiereRevision: true,
          motivoDuda: ERROR_CODES.IDENTIDAD_VACIA,
          conflictoIdentidad: true,
          dudas: [ERROR_CODES.IDENTIDAD_VACIA],
          alertas: [ERROR_CODES.IDENTIDAD_VACIA]
        }
      });
    }

    var idioma = inferLanguage(structure, metadata);
    var entries = buildEntries(structure);
    var candidates = buildCandidates(entries, metadata).map(scoreCandidate);
    var ranked = sortCandidates(candidates).slice(0, 5);

    pushEvent(metricCtx, "info", "B2_CANDIDATOS", "Boxer2 construye candidatos locales.", {
      total: ranked.length,
      idioma: idioma
    });

    if (!ranked.length) {
      pushEvent(metricCtx, "warn", ERROR_CODES.SHORTLIST_VACIA, "No hay candidatos comerciales tras el filtro.", null);
      return buildSuccessEnvelope(context, {
        passport: PASSPORTS.NARANJA,
        suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
        confidence: CONFIDENCE.BAJA,
        requiresRevision: true,
        totalCandidatos: 0,
        datos: {
          nombrePropuesto: "",
          nombre: "",
          literalDetectado: "",
          idiomaOrigen: idioma,
          candidatosEvaluados: [],
          modoResolucion: "ninguno_claro",
          confidence: CONFIDENCE.BAJA,
          requiereRevision: true,
          motivoDuda: ERROR_CODES.SHORTLIST_VACIA,
          conflictoIdentidad: true,
          dudas: [ERROR_CODES.SHORTLIST_VACIA],
          alertas: [ERROR_CODES.SHORTLIST_VACIA]
        }
      });
    }

    var localResolution = resolveLocally(ranked);
    if (localResolution.resolved) {
      var nombreLocal = normalizeFinalName(localResolution.candidate.literal, idioma, metadata);
      if (!nombreLocal) {
        pushEvent(metricCtx, "warn", ERROR_CODES.IDIOMA_NO_RESUELTO, "Boxer2 no pudo normalizar el nombre final.", null);
        return buildSuccessEnvelope(context, {
          passport: PASSPORTS.NARANJA,
          suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
          confidence: CONFIDENCE.BAJA,
          requiresRevision: true,
          totalCandidatos: ranked.length,
          datos: {
            nombrePropuesto: localResolution.candidate.literal,
            nombre: localResolution.candidate.literal,
            literalDetectado: localResolution.candidate.literal,
            idiomaOrigen: idioma,
            candidatosEvaluados: ranked.map(buildCandidateView),
            modoResolucion: "ninguno_claro",
            confidence: CONFIDENCE.BAJA,
            requiereRevision: true,
            motivoDuda: ERROR_CODES.IDIOMA_NO_RESUELTO,
            conflictoIdentidad: true,
            dudas: [ERROR_CODES.IDIOMA_NO_RESUELTO],
            alertas: [ERROR_CODES.IDIOMA_NO_RESUELTO]
          }
        });
      }

      pushEvent(metricCtx, "info", "B2_LOCAL_OK", "Boxer2 resuelve identidad por programacion local.", {
        nombre: nombreLocal,
        motivo: localResolution.reason
      });
      return buildSuccessEnvelope(context, {
        passport: PASSPORTS.VERDE,
        suggestedAction: SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO,
        confidence: localResolution.confidence,
        requiresRevision: false,
        totalCandidatos: ranked.length,
        datos: {
          nombrePropuesto: nombreLocal,
          nombre: nombreLocal,
          literalDetectado: localResolution.candidate.literal,
          idiomaOrigen: idioma,
          candidatosEvaluados: ranked.map(buildCandidateView),
          modoResolucion: "local",
          confidence: localResolution.confidence,
          requiereRevision: false,
          motivoDuda: "",
          conflictoIdentidad: false,
          dudas: [],
          alertas: []
        }
      });
    }

    var shortlist = buildShortlist(ranked);
    var fallbackCandidate = ranked[0];
    var fallbackName = normalizeFinalName(fallbackCandidate.literal, idioma, metadata) || fallbackCandidate.literal;
    var tareaIA = buildIaTask(shortlist, structure, idioma, context);

    pushEvent(metricCtx, "info", "B2_IA_DECLARADA", "Boxer2 deja tarea IA preparada para Cerebro.", {
      taskId: tareaIA.taskId,
      totalShortlist: shortlist.length
    });

    return buildPendingIaEnvelope(context, {
      passport: PASSPORTS.NARANJA,
      suggestedAction: SUGGESTED_ACTIONS.CONTINUAR_Y_MARCAR_REVISION,
      confidence: CONFIDENCE.MEDIA,
      totalCandidatos: ranked.length,
      tareasIA: [tareaIA],
      datos: {
        nombrePropuesto: fallbackName,
        nombre: fallbackName,
        literalDetectado: fallbackCandidate.literal,
        idiomaOrigen: idioma,
        candidatosEvaluados: ranked.map(buildCandidateView),
        modoResolucion: "ia_pendiente",
        confidence: CONFIDENCE.MEDIA,
        requiereRevision: true,
        motivoDuda: localResolution.reason || ERROR_CODES.NO_SEGURO,
        conflictoIdentidad: true,
        dudas: [localResolution.reason || ERROR_CODES.NO_SEGURO],
        alertas: [ERROR_CODES.NO_SEGURO],
        contextoIA: {
          idiomaOrigen: idioma,
          marcaDetectada: metadata.marcaDetectada || null,
          shortlist: serializeShortlist(shortlist)
        }
      }
    });
  }

  var api = {
    MODULE_NAME: MODULE_NAME,
    ACTION_RESOLVER_IDENTIDAD: ACTIONS.RESOLVER_IDENTIDAD,
    procesarAccionContrato: procesarAccionContrato,
    B2_cerrarConSubrespuestaIA: B2_cerrarConSubrespuestaIA
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer2Identidad = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
