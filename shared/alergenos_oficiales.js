(function initAppV2AlergenosOficialesModule(globalScope) {
  "use strict";

  var NOMBRES_OFICIALES = Object.freeze([
    "altramuces",
    "apio",
    "cacahuetes",
    "crustaceos",
    "frutos_secos",
    "gluten",
    "huevos",
    "lacteos",
    "moluscos",
    "mostaza",
    "pescado",
    "sesamo",
    "soja",
    "sulfitos"
  ]);

  var ALIAS_POR_FAMILIA = Object.freeze({
    altramuces: ["altramuces", "altramuz", "lupin", "lupins", "lupino", "lupinos"],
    apio: ["apio", "celery", "celeri", "sellerie", "sedano", "aipo"],
    cacahuetes: ["cacahuetes", "cacahuete", "mani", "cacahuate", "cacahuates", "peanut", "peanuts", "groundnut", "groundnuts"],
    crustaceos: ["crustaceos", "crustaceo", "crustaceans", "crustacean", "crustaceos"],
    frutos_secos: [
      "frutos_secos",
      "frutos secos",
      "frutos de cascara",
      "fruto de cascara",
      "frutos secos de cascara",
      "frutos_cascara",
      "fruto_cascara",
      "tree nuts",
      "tree nut",
      "nuts",
      "nut",
      "fruits a coque",
      "frutta a guscio",
      "schalenfruchte",
      "frutos de casca"
    ],
    gluten: ["gluten"],
    huevos: ["huevos", "huevo", "egg", "eggs", "ovo", "ovos", "uovo", "uova", "oeuf", "oeufs"],
    lacteos: ["lacteos", "lacteo", "leche", "milk", "dairy", "latte", "lait", "milch"],
    moluscos: ["moluscos", "molusco", "mollusc", "molluscs", "mollusk", "mollusks", "molluschi", "mollusque", "mollusques"],
    mostaza: ["mostaza", "mustard", "moutarde", "senf", "senape", "mostarda"],
    pescado: ["pescado", "fish", "poisson", "fisch", "pesce", "peixe"],
    sesamo: ["sesamo", "sesame", "sesam", "sesamo", "ajonjoli", "gergelim"],
    soja: ["soja", "soya", "soy", "soybean", "soybeans", "soia"],
    sulfitos: ["sulfitos", "sulfito", "sulphites", "sulphite", "sulfites", "sulfite", "solfiti", "solfito"]
  });

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[_]+/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildIndexMap(list) {
    var map = Object.create(null);
    for (var i = 0; i < list.length; i += 1) {
      map[list[i]] = i;
    }
    return Object.freeze(map);
  }

  function buildAliasMap() {
    var map = Object.create(null);
    for (var i = 0; i < NOMBRES_OFICIALES.length; i += 1) {
      var familia = NOMBRES_OFICIALES[i];
      var aliases = ALIAS_POR_FAMILIA[familia] || [];
      map[normalizeText(familia)] = familia;
      map[normalizeText(familia.replace(/_/g, " "))] = familia;
      for (var j = 0; j < aliases.length; j += 1) {
        map[normalizeText(aliases[j])] = familia;
      }
    }
    return Object.freeze(map);
  }

  var INDICE_POR_NOMBRE = buildIndexMap(NOMBRES_OFICIALES);
  var ALIAS_A_OFICIAL = buildAliasMap();
  var NOMBRE_POR_INDICE = Object.freeze(NOMBRES_OFICIALES.slice());

  function canonicalizeAllergen(value) {
    var normalized = normalizeText(value);
    if (!normalized) return null;
    return ALIAS_A_OFICIAL[normalized] || null;
  }

  function compareByOfficialIndex(a, b) {
    var indexA = Object.prototype.hasOwnProperty.call(INDICE_POR_NOMBRE, a)
      ? INDICE_POR_NOMBRE[a]
      : Number.MAX_SAFE_INTEGER;
    var indexB = Object.prototype.hasOwnProperty.call(INDICE_POR_NOMBRE, b)
      ? INDICE_POR_NOMBRE[b]
      : Number.MAX_SAFE_INTEGER;
    if (indexA !== indexB) return indexA - indexB;
    return String(a || "").localeCompare(String(b || ""));
  }

  function normalizeAllergenList(input) {
    var safeInput = Array.isArray(input) ? input : [];
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < safeInput.length; i += 1) {
      var canonical = canonicalizeAllergen(safeInput[i]);
      if (!canonical || seen[canonical]) continue;
      seen[canonical] = true;
      out.push(canonical);
    }
    return out.sort(compareByOfficialIndex);
  }

  function parseAllergenCsv(value) {
    if (!value) return [];
    return normalizeAllergenList(
      String(value)
        .split(",")
        .map(function each(item) { return item.trim(); })
        .filter(Boolean)
    );
  }

  function activeFromProfile(map) {
    var safeMap = map && typeof map === "object" ? map : {};
    var out = [];
    for (var i = 0; i < NOMBRES_OFICIALES.length; i += 1) {
      var familia = NOMBRES_OFICIALES[i];
      if (Number(safeMap[familia]) === 1) out.push(familia);
    }
    return out;
  }

  function buildProfileMap(input) {
    var active = normalizeAllergenList(input);
    var enabled = Object.create(null);
    var profile = {};
    for (var i = 0; i < active.length; i += 1) {
      enabled[active[i]] = true;
    }
    for (var j = 0; j < NOMBRES_OFICIALES.length; j += 1) {
      var familia = NOMBRES_OFICIALES[j];
      profile[familia] = enabled[familia] ? 1 : 0;
    }
    return profile;
  }

  function isOfficialAllergen(value) {
    return canonicalizeAllergen(value) === String(value || "");
  }

  var api = {
    NOMBRES_OFICIALES: NOMBRES_OFICIALES,
    NOMBRE_POR_INDICE: NOMBRE_POR_INDICE,
    INDICE_POR_NOMBRE: INDICE_POR_NOMBRE,
    normalizeText: normalizeText,
    canonicalizeAllergen: canonicalizeAllergen,
    normalizeAllergenList: normalizeAllergenList,
    parseAllergenCsv: parseAllergenCsv,
    activeFromProfile: activeFromProfile,
    buildProfileMap: buildProfileMap,
    compareByOfficialIndex: compareByOfficialIndex,
    isOfficialAllergen: isOfficialAllergen
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.AppV2AlergenosOficiales = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
