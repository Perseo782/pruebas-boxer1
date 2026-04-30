(function initOcrFusionEngine(globalScope) {
  "use strict";

  var MAX_SOURCE_CHARS = 9000;
  var MAX_LINES = 140;
  var MAX_WORDS_PER_LINE = 80;
  var MIN_TOKEN_LEN = 2;

  function now() {
    return Date.now ? Date.now() : new Date().getTime();
  }

  function stripAccents(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function normalizeToken(value) {
    return stripAccents(value).toLowerCase().replace(/[^a-z0-9%]+/g, "");
  }

  function normalizeLine(value) {
    return stripAccents(value)
      .toLowerCase()
      .replace(/[^a-z0-9%]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, MAX_SOURCE_CHARS);
  }

  function splitLines(value) {
    var text = cleanText(value);
    if (!text) return [];
    var seen = Object.create(null);
    return text.split(/\n+/).map(function trim(line) {
      return String(line || "").trim();
    }).filter(function valid(line) {
      if (!line) return false;
      var key = normalizeLine(line);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    }).slice(0, MAX_LINES);
  }

  function tokenize(line) {
    return String(line || "").split(/\s+/).filter(Boolean).slice(0, MAX_WORDS_PER_LINE);
  }

  function levenshtein(a, b) {
    var left = normalizeToken(a);
    var right = normalizeToken(b);
    if (left === right) return 0;
    if (!left) return right.length;
    if (!right) return left.length;
    var prev = [];
    var curr = [];
    var i;
    var j;
    for (j = 0; j <= right.length; j += 1) prev[j] = j;
    for (i = 1; i <= left.length; i += 1) {
      curr[0] = i;
      for (j = 1; j <= right.length; j += 1) {
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + (left.charAt(i - 1) === right.charAt(j - 1) ? 0 : 1)
        );
      }
      var tmp = prev;
      prev = curr;
      curr = tmp;
    }
    return prev[right.length];
  }

  function looksBroken(token) {
    var raw = String(token || "");
    var norm = normalizeToken(raw);
    if (norm.length < MIN_TOKEN_LEN) return true;
    if (/\d/.test(norm)) return false;
    if (norm.length <= 3 && raw.length <= 3) return true;
    if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(norm)) return true;
    return false;
  }

  function scoreToken(token) {
    var norm = normalizeToken(token);
    var score = norm.length;
    if (!norm) return -100;
    if (looksBroken(token)) score -= 3;
    if (/^[a-z]+$/i.test(norm) && /[aeiou]/i.test(norm)) score += 2;
    if (/\d/.test(norm)) score += 2;
    return score;
  }

  function chooseToken(visionToken, deepseekToken, stats) {
    var leftNorm = normalizeToken(visionToken);
    var rightNorm = normalizeToken(deepseekToken);
    if (!leftNorm) return deepseekToken;
    if (!rightNorm) return visionToken;
    if (leftNorm === rightNorm) return visionToken.length >= deepseekToken.length ? visionToken : deepseekToken;

    var distance = levenshtein(leftNorm, rightNorm);
    var maxLen = Math.max(leftNorm.length, rightNorm.length);
    var near = maxLen >= 4 && distance <= Math.max(1, Math.ceil(maxLen * 0.4));
    if (near) {
      var leftScore = scoreToken(visionToken);
      var rightScore = scoreToken(deepseekToken);
      if (Math.abs(leftScore - rightScore) >= 2) {
        stats.mejorasAplicadas += 1;
        return rightScore > leftScore ? deepseekToken : visionToken;
      }
    }

    stats.fragmentosConservadosPorDuda += 1;
    return visionToken + " / " + deepseekToken;
  }

  function similarityLine(a, b) {
    var aTokens = tokenize(normalizeLine(a));
    var bTokens = tokenize(normalizeLine(b));
    var total = Math.max(aTokens.length, bTokens.length);
    var matches = 0;
    var used = Object.create(null);
    var i;
    var j;
    if (!total) return 0;
    for (i = 0; i < aTokens.length; i += 1) {
      for (j = 0; j < bTokens.length; j += 1) {
        if (used[j]) continue;
        if (aTokens[i] === bTokens[j] || levenshtein(aTokens[i], bTokens[j]) <= 1) {
          used[j] = true;
          matches += 1;
          break;
        }
      }
    }
    return matches / total;
  }

  function mergeLine(visionLine, deepseekLine, stats) {
    var v = tokenize(visionLine);
    var d = tokenize(deepseekLine);
    var total = Math.max(v.length, d.length);
    var out = [];
    var i;
    for (i = 0; i < total; i += 1) {
      if (v[i] && d[i]) {
        out.push(chooseToken(v[i], d[i], stats));
      } else if (v[i]) {
        out.push(v[i]);
      } else if (d[i]) {
        out.push(d[i]);
      }
    }
    return out.join(" ").replace(/\s+\/\s+/g, " / ").trim();
  }

  function fusionarOCR(input) {
    var started = now();
    var safe = input && typeof input === "object" ? input : {};
    var visionLines = splitLines(safe.textoVision || safe.vision || "");
    var deepseekLines = splitLines(safe.textoDeepSeek || safe.deepseek || "");
    var usedDeepseek = Object.create(null);
    var stats = {
      mejorasAplicadas: 0,
      fragmentosConservadosPorDuda: 0,
      lineasAnadidas: 0,
      avisos: []
    };
    var output = [];

    visionLines.forEach(function eachVision(line) {
      var bestIndex = -1;
      var bestScore = 0;
      deepseekLines.forEach(function eachDeepseek(candidate, index) {
        var score;
        if (usedDeepseek[index]) return;
        score = similarityLine(line, candidate);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });
      if (bestIndex >= 0 && bestScore >= 0.45) {
        usedDeepseek[bestIndex] = true;
        output.push(mergeLine(line, deepseekLines[bestIndex], stats));
        return;
      }
      output.push(line);
    });

    deepseekLines.forEach(function addUnused(line, index) {
      if (usedDeepseek[index]) return;
      output.push(line);
      stats.lineasAnadidas += 1;
    });

    var seen = Object.create(null);
    var finalLines = output.filter(function unique(line) {
      var key = normalizeLine(line);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
    var textoOCRFinal = finalLines.join("\n").trim();
    var longest = Math.max(cleanText(safe.textoVision || "").length, cleanText(safe.textoDeepSeek || "").length);
    var maxFinal = Math.max(longest + 1500, Math.floor(longest * 1.25), 2500);
    if (textoOCRFinal.length > maxFinal) {
      textoOCRFinal = textoOCRFinal.slice(0, maxFinal).trim();
      stats.avisos.push("fusion_recortada_para_evitar_texto_excesivo");
    }

    return {
      ok: true,
      textoOCRFinal: textoOCRFinal,
      metricas: {
        visionLineas: visionLines.length,
        deepseekLineas: deepseekLines.length,
        lineasFinales: finalLines.length,
        mejorasAplicadas: stats.mejorasAplicadas,
        fragmentosConservadosPorDuda: stats.fragmentosConservadosPorDuda,
        lineasAnadidas: stats.lineasAnadidas,
        elapsedMs: now() - started
      },
      avisos: stats.avisos
    };
  }

  var api = {
    fusionarOCR: fusionarOCR,
    normalizeToken: normalizeToken,
    similarityLine: similarityLine
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (globalScope) globalScope.AppV2OcrFusionEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
