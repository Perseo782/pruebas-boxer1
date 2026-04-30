"use strict";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BOXER 3 v3 â€” MOTOR DETECCIÃ“N PESO/FORMATO
//
// Pipeline:
//   0a â€” NormalizaciÃ³n OCR (Oâ†’0, mIâ†’ml, Ã—â†’x, slash multipack, espacio miles)
//   0b â€” NormalizaciÃ³n lingÃ¼Ã­stica (quitar acentos, lowercase) â€” solo comparaciÃ³n
//   0c â€” Parser numÃ©rico (miles europeo: 1.000â†’1000, 1.500,00â†’1500)
//   1  â€” Filtro basura
//   2a â€” FusiÃ³n de lÃ­neas partidas (etiqueta en lÃ­nea i, valor en i+1)
//   2b â€” ExtracciÃ³n + clasificaciÃ³n A1/A2/B/C/D
//   3  â€” Colapso de duplicados (mismo valorNorm+unidadNorm+clase)
//   4  â€” DecisiÃ³n: A1 > A2 > inferencia(B+C) > scoring(C) > vacÃ­o
//          Nunca "ENVIAR A IA" por diseÃ±o: ambigÃ¼edad real â†’ campo vacÃ­o + diagnÃ³stico
//
// Regla de negocio: escurrido > neto > bruto
// Multipack: texto original ("4x250g")
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€â”€ CAPA 0A: NORMALIZACIÃ“N OCR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function corregirNumeros(texto) {
  var r = texto;
  r = r.replace(/(\d)O(\d)/g, "$10$2");
  r = r.replace(/(\d)OO\b/g, "$100");
  var up = "(?=\\s*(?:kg|g|gr|grs|ml|mI|m1|cl|cI|c1|dl|dI|d1|lt|l|L|oz|litros?|Iitros?|1itros?)\\b)";
  r = r.replace(new RegExp("(\\d)O\\b" + up, "gi"), "$10");
  r = r.replace(new RegExp("\\bO(\\d+)\\b" + up, "gi"), "0$1");
  return r;
}

function corregirUnidades(texto) {
  var reglas = [
    { regex: /(\d+[,.]?\d*)\s*[I1]itros\b/g,    fix: "$1 litros" },
    { regex: /(\d+[,.]?\d*)\s*[I1]itro\b/g,     fix: "$1 litro"  },
    { regex: /(\d+[,.]?\d*)\s*mI\b/g,            fix: "$1 ml"     },
    { regex: /(\d+[,.]?\d*)\s*m1\b/g,            fix: "$1 ml"     },
    { regex: /(\d+[,.]?\d*)\s*ML\b/g,            fix: "$1 ml"     },
    { regex: /(\d+[,.]?\d*)\s*cI\b/g,            fix: "$1 cl"     },
    { regex: /(\d+[,.]?\d*)\s*c1\b/g,            fix: "$1 cl"     },
    { regex: /(\d+[,.]?\d*)\s*dI\b/g,            fix: "$1 dl"     },
    { regex: /(\d+[,.]?\d*)\s*d1\b/g,            fix: "$1 dl"     },
    { regex: /(\d+[,.]?\d*)\s*[kK]9\b/g,         fix: "$1 kg"     },
    { regex: /(\d+[,.]?\d*)\s*KG\b/g,            fix: "$1 kg"     },
    { regex: /(\d+[,.]?\d*)\s*[kK][gG][sS]\b/g,  fix: "$1 kg"     },
    { regex: /(\d+[,.]?\d*)\s*9[rR][sS]\b/g,     fix: "$1 grs"    },
    { regex: /(\d+[,.]?\d*)\s*9[rR]\b/g,         fix: "$1 gr"     },
    { regex: /(\d+[,.]?\d*)\s*GRS\b/g,           fix: "$1 grs"    },
    { regex: /(\d+[,.]?\d*)\s*[0O]z\b/gi,        fix: "$1 oz"     },
    { regex: /(\d+[,.]?\d*)\s*[Kk]ilos?\b/g,    fix: "$1 kg"     },
    { regex: /(\d)\s*\u00d7\s*(\d)/g,            fix: "$1x$2"     }
  ];
  var res = texto;
  for (var i = 0; i < reglas.length; i++) {
    res = res.replace(reglas[i].regex, reglas[i].fix);
  }
  // El sÃ­mbolo de envasado "â„®" suele salir del OCR como una "e" pegada a la unidad:
  // "1000 ge" / "500 mle". Lo limpiamos solo en tokens numÃ©ricos de peso/volumen.
  res = res.replace(
    /(\d+(?:[.,]\d+)?)\s*(kg|g|gr|grs|ml|cl|dl|lt|l|oz|lb)\s*[eE\u212e]\b/gi,
    "$1 $2"
  );
  return res;
}

// "4/250g" â†’ "4x250g" cuando el primer nÃºmero es entero 2-24 (cantidad pack)
// y el segundo va pegado a unidad vÃ¡lida. Descarta "08/2024" (fechas).
function normalizarSlashMultipack(texto) {
  return texto.replace(
    /\b([2-9]|1[0-9]|2[0-4])\/(\d+[,.]?\d*\s*(?:kg|g|gr|grs|ml|cl|dl|lt|l|oz|lb|litros?))\b/gi,
    "$1x$2"
  );
}

// "1 000 g" â†’ "1000 g": espacio como separador de miles antes de unidad
function normalizarEspaciosMiles(texto) {
  return texto.replace(
    /(\d{1,3})\s(\d{3})\b(?=\s*(?:kg|g|gr|grs|ml|cl|dl|lt|l|oz|lb|litros?)\b)/gi,
    "$1$2"
  );
}

// "TARA: 50g," â†’ eliminado antes de que UNIDADES_REGEX lo vea.
// "tara" es semÃ¡nticamente unÃ­voco en etiquetado; nunca es el peso del producto.
function eliminarTara(texto) {
  return texto.replace(
    /\btara\s*:\s*(?:\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+[.,]\d+|\d+)\s*(?:kg|g|gr|grs|ml|cl|dl|lt|l|oz|lb)\b[\s,;]*/gi,
    ""
  );
}

// "Peso: 3,5k" -> "Peso: 3,5 kg" solo en contexto comercial.
// Nunca aplica en lineas nutricionales.
function normalizarPesoKComercial(texto) {
  var lineas = String(texto || "").split("\n");
  var out = [];
  var hasLabel = /\b(?:peso(?:\s+neto)?|contenido\s+neto)\b/i;
  var isNutritional = /\b(?:por\s*100|valor\s*energetico|grasas?|hidratos?|proteinas?|sal|kcal|kj)\b/i;
  var kiloShorthand = /\b(\d+(?:[.,]\d+)?)\s*k\b/ig;

  for (var i = 0; i < lineas.length; i += 1) {
    var linea = String(lineas[i] || "");
    var lineaNorm = normalizarUnicode(linea);
    if (!hasLabel.test(lineaNorm) || isNutritional.test(lineaNorm)) {
      out.push(linea);
      continue;
    }
    out.push(linea.replace(kiloShorthand, "$1 kg"));
  }
  return out.join("\n");
}

function normalizarOCR(texto) {
  var r = corregirNumeros(texto);
  r = corregirUnidades(r);
  r = normalizarSlashMultipack(r);
  r = normalizarEspaciosMiles(r);
  r = eliminarTara(r);
  r = normalizarPesoKComercial(r);
  return r;
}

// â”€â”€â”€ CAPA 0B: REPARACIÃ“N LÃ‰XICA DIRIGIDA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// No corrige todo el OCR. Solo actÃºa en lÃ­neas con candidatos de peso.
// Principio: lÃ©xico cerrado + confusiones OCR ponderadas + umbral de seguridad.

// LÃ©xico objetivo estructurado por familia semÃ¡ntica.
// Solo se intenta reparar contra estas palabras conocidas.
var LEXICO_OBJETIVO = {
  NETO:        ["neto", "net"],
  BRUTO:       ["bruto", "gross"],
  ESCURRIDO:   ["escurrido", "drenado", "drained"],
  NUTRICIONAL: ["kcal", "kj", "grasas", "proteinas", "fibra",
                "sodio", "hidratos", "azucares",
                "glucides", "lipides", "proteines"]
};

// Tabla de costes de sustituciÃ³n para confusiones tÃ­picas de OCR.
// Parejas conocidas tienen coste bajo; sustituciÃ³n arbitraria: coste 1.0.
var CONFUSIONES = (function() {
  var tabla = {};
  var pares = [
    ["0","o",0.2], ["o","0",0.2],
    ["1","l",0.2], ["l","1",0.2],
    ["1","i",0.2], ["i","1",0.2],
    ["l","i",0.15],["i","l",0.15],
    ["5","s",0.3], ["s","5",0.3],
    ["8","b",0.35],["b","8",0.35],
    ["9","g",0.25],["g","9",0.25],
    ["q","g",0.3], ["g","q",0.3],
    ["4","a",0.35],["a","4",0.35]
  ];
  for (var p = 0; p < pares.length; p++) {
    tabla[pares[p][0] + pares[p][1]] = pares[p][2];
  }
  return tabla;
}());

// Distancia de ediciÃ³n ponderada por confusiones OCR.
// Inserciones/eliminaciones cuestan 0.8 (frecuentes en cortes de palabra).
function distanciaOCR(s, t) {
  var m = s.length, n = t.length;
  var d = [];
  for (var i = 0; i <= m; i++) { d[i] = [i * 0.8]; }
  for (var j = 1; j <= n; j++) { d[0][j] = j * 0.8; }
  for (var j = 1; j <= n; j++) {
    for (var i = 1; i <= m; i++) {
      var sc = (s[i-1] === t[j-1]) ? 0 : (CONFUSIONES[s[i-1] + t[j-1]] || 1.0);
      d[i][j] = Math.min(d[i-1][j] + 0.8, d[i][j-1] + 0.8, d[i-1][j-1] + sc);
    }
  }
  return d[m][n];
}

// Busca la palabra mÃ¡s cercana en todo el lÃ©xico.
// Devuelve la palabra reparada si la distancia normalizada < umbral, o null.
var UMBRAL_REPARACION = 0.28; // 0.35 permitía "ascorbido"→"escurrido" (0.33) — bajado a 0.28

// repararToken: busca en todas las familias del lÃ©xico
function repararToken(tokenNorm) {
  if (tokenNorm.length < 3) return null;
  var mejor = null, mejorDist = Infinity;
  var familias = Object.keys(LEXICO_OBJETIVO);
  for (var f = 0; f < familias.length; f++) {
    var palabras = LEXICO_OBJETIVO[familias[f]];
    for (var p = 0; p < palabras.length; p++) {
      var obj = palabras[p];
      if (Math.abs(tokenNorm.length - obj.length) > 2) continue;
      var dist = distanciaOCR(tokenNorm, obj);
      var distNorm = dist / obj.length;
      if (distNorm < mejorDist) { mejorDist = distNorm; mejor = obj; }
    }
  }
  if (mejor && mejorDist < UMBRAL_REPARACION && tokenNorm !== mejor) return mejor;
  return null;
}

// repararTokenEtiqueta: solo busca en NETO/BRUTO/ESCURRIDO â€” para lÃ­neas vecinas sin nÃºmero
// Evita reparar palabras de marketing ("azucar"â†’"azucares") que son falsas alarmas
function repararTokenEtiqueta(tokenNorm) {
  if (tokenNorm.length < 3) return null;
  var familias = ["NETO", "BRUTO", "ESCURRIDO"];
  var mejor = null, mejorDist = Infinity;
  for (var f = 0; f < familias.length; f++) {
    var palabras = LEXICO_OBJETIVO[familias[f]];
    for (var p = 0; p < palabras.length; p++) {
      var obj = palabras[p];
      if (Math.abs(tokenNorm.length - obj.length) > 2) continue;
      var dist = distanciaOCR(tokenNorm, obj);
      var distNorm = dist / obj.length;
      if (distNorm < mejorDist) { mejorDist = distNorm; mejor = obj; }
    }
  }
  if (mejor && mejorDist < UMBRAL_REPARACION && tokenNorm !== mejor) return mejor;
  return null;
}

// Repara tokens en lÃ­neas que contienen candidatos de peso (nÃºmero + unidad).
// No toca el resto del documento para no introducir alucinaciones.
var UNIDADES_PATRON = /(?:\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+[.,]\d+|\d+)\s*(?:kg|g|gr|grs|ml|cl|dl|lt|l|oz|lb|litros?)\b/i;

var EXCLUIR_UNIDADES_REP = /^(?:kg|g|gr|grs|ml|cl|dl|lt|oz|lb|mg|kcal|kj)$/i;

function repararTokensDeLinea(linea, soloEtiquetas) {
  return linea.replace(/\b[A-Za-z][A-Za-z0-9]{2,}\b/g, function(token) {
    if (EXCLUIR_UNIDADES_REP.test(token)) return token;
    var norm = token.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var reparado = soloEtiquetas ? repararTokenEtiqueta(norm) : repararToken(norm);
    return reparado ? reparado : token;
  });
}

function repararLineasCriticas(texto) {
  var lineas = texto.split("\n");
  var resultado = [];
  for (var i = 0; i < lineas.length; i++) {
    var linea = lineas[i];
    var tieneNumUnidad   = UNIDADES_PATRON.test(linea);
    // LÃ­nea de etiqueta sola: vecina a la siguiente que sÃ­ tiene nÃºmero+unidad
    // Solo repara contra vocabulario de etiquetas (neto/bruto/escurrido), no nutricional
    var esEtiquetaVecina = !tieneNumUnidad &&
                           i + 1 < lineas.length &&
                           UNIDADES_PATRON.test(lineas[i + 1]);

    if (tieneNumUnidad) {
      resultado.push(repararTokensDeLinea(linea, false)); // léxico completo
    } else if (esEtiquetaVecina) {
      resultado.push(repararTokensDeLinea(linea, true));  // solo etiquetas
    } else {
      resultado.push(linea);
    }
  }
  return resultado.join("\n");
}

// â”€â”€â”€ CAPA 0C: NORMALIZACIÃ“N LINGÃœÃSTICA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Solo para comparaciÃ³n semÃ¡ntica. El texto original nunca se modifica.

function normalizarUnicode(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// â”€â”€â”€ CAPA 0C: PARSER NUMÃ‰RICO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Casos:
//   1.500,00 o 1,500.00  (ambos separadores) â†’ 1500
//   1.000 o 1,000        (exactamente 3 decimales) â†’ 1000 (miles europeo/inglÃ©s)
//   1,5 o 1.5            (1-2 decimales) â†’ 1.5  (decimal normal)

function parsearNumero(texto) {
  var t = texto.trim();
  // Ambos separadores: "1.500,00" o "1,500.00"
  var ambos = t.match(/^(\d{1,3})[.,](\d{3})[.,](\d+)$/);
  if (ambos) {
    return parseFloat(ambos[1] + ambos[2] + "." + ambos[3]);
  }
  // Un solo separador con exactamente 3 decimales â†’ miles
  if (/^\d{1,3}[.,]\d{3}$/.test(t)) {
    return parseFloat(t.replace(/[.,]/, ""));
  }
  // Decimal normal
  return parseFloat(t.replace(",", "."));
}

// â”€â”€â”€ FILTRO 1: BASURA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function filtroBasura(texto) {
  var lineas = texto.split("\n");
  var limpias = [];
  for (var i = 0; i < lineas.length; i++) {
    var l = lineas[i];
    l = l.replace(/[&*#@!\u00a9\u00ae\u2122\u00a2|\\~^<>]/g, " ");
    l = l.replace(/[(){}\[\]]/g, " ");
    l = l.replace(/\b[A-Z]{1,3}[\-]?\d{3,}[A-Z0-9]*\b/g, " ");
    l = l.replace(/\b[A-Z]\d+[A-Z]+\d*\b/g, " ");
    l = l.replace(/(\d)\s+([gGlL])\b/g, "$1$2");
    l = l.replace(/(?<!\d\s?)\b[A-Za-z]\b(?!\s?\d)/g, " ");
    l = l.replace(/^[\s\-\._]+$/, "");
    l = l.replace(/\s+/g, " ").trim();
    if (l.length > 1) limpias.push(l);
  }
  return limpias.join("\n");
}

// â”€â”€â”€ DICCIONARIOS SEMÃNTICOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Todos en minÃºsculas sin acentos. Se comparan contra normalizarUnicode().
// JerarquÃ­a: A1(escurrido) > A2(neto) > B(bruto) > D(descarte) > C(neutro)

var TOKENS_ESCURRIDO = [
  "peso escurrido", "neto escurrido", "contenido escurrido", "escurrido",
  "peso drenado", "scurrido", "currido", "rrido",
  "drained weight", "drained wt",
  "poids egoutte", "oids egoutte", "poids net egoutte"
];

var TOKENS_NETO = [
  // EspaÃ±ol
  "peso neto", "contenido neto", "cont. neto", "cont neto",
  "peso liquido", "peso neto liquido",
  // Abreviaciones (con frontera)
  "cn:", "p.net", "p.n.", "p. n.", "p net", ".net ",
  // "neto:" directo â€” sin frontera, suficientemente especÃ­fico
  "neto:", "neto :",
  // Fragmentos rotos mÃ¡s cortos (con frontera, para evitar "producto:")
  "eto :",
  // InglÃ©s
  "net weight", "et weight", "net wt", "et wt", "net:",
  // FrancÃ©s
  "poids net", "oids net", "ids net", "contenu net",
  // Italiano
  "peso netto", "contenuto netto",
  // AlemÃ¡n (con frontera)
  "nettogewicht", "netto-gewicht", "netto:", "netto ",
  // PortuguÃ©s
  "conteudo liquido"
];

var TOKENS_BRUTO = [
  "peso bruto", "bruto",
  "gross weight", "gross wt", "ross weight", "ross wt",
  // AlemÃ¡n
  "grossgewicht", "bruttogewicht", "brutto",
  // Fragmentos rotos (con frontera obligatoria)
  "ruto:", "ruto :"
  // "uto:" eliminado â€” captura falsamente "producto:", "instrucciones:"
];

// Fragmentos cortos: requieren que el carÃ¡cter anterior NO sea letra
var REQUIEREN_FRONTERA = [
  "ruto:", "ruto :", "eto :", ".net ", "net:", "netto:", "netto ", "cn:"
];

// â”€â”€â”€ BLOQUEO NUTRICIONAL DURO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Estas seÃ±ales convierten la lÃ­nea en D ANTES que cualquier A1/A2/B.
// Son indicadores inequÃ­vocos de tabla nutricional que no pueden coexistir
// con una declaraciÃ³n de peso de producto (ej: "por 100 g de peso escurrido").

var BLOQUEO_NUTRICIONAL = [
  "por 100", "en 100", "per 100", "pour 100",
  "nutricional", "nutritional", "nutritive",
  "kcal", "kj"
];

// SeÃ±ales nutricionales estÃ¡ndar â€” se evalÃºan DESPUÃ‰S de A1/A2/B
var TOKENS_NUTRICIONAL = [
  "kilocalor", "calorias", "valor energetico",
  "valeur energetique", "valore energetico", "energiewert",
  "por porci",
  "hidratos de carbono", "hidratos", "carbohidratos",
  "proteinas", "proteina", "grasas", "azucares", "azucar",
  "fibra", "sodio",
  "glucides", "proteines", "lipides", "fibres", "sel:",
  "carboidrati", "lipidi", "fibre",
  "kohlenhydrate", "eiweiss", "ballaststoffe", "fett", "salz",
  "vitamina", "vitamin", "calcio", "calcium", "hierro",
  "%vrn", "%nrv", "%vd"
];

var TOKENS_RACION = [
  "tara", "racion", "porcion", "serving", "portion",
  "por unidad", "por servir", "cucharada", "cucharilla", "per serve"
];

// â”€â”€â”€ DETECCIÃ“N DE FRAGMENTOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function detectarFragmento(textoNorm, lista) {
  for (var i = 0; i < lista.length; i++) {
    var frag = lista[i];
    var idx = textoNorm.indexOf(frag);
    if (idx === -1) continue;
    if (REQUIEREN_FRONTERA.indexOf(frag) !== -1) {
      if (idx > 0 && /[a-z]/.test(textoNorm[idx - 1])) continue;
    }
    return frag;
  }
  return null;
}

// â”€â”€â”€ CLASIFICACIÃ“N DE LÃNEA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Orden: bloqueo nutricional duro â†’ A1 â†’ A2 â†’ B â†’ D â†’ C

function clasificarLinea(lineaNorm) {
  // BLOQUEO DURO: tabla nutricional inequÃ­voca â†’ D aunque lleve "escurrido/neto"
  for (var b = 0; b < BLOQUEO_NUTRICIONAL.length; b++) {
    if (lineaNorm.indexOf(BLOQUEO_NUTRICIONAL[b]) !== -1) return "D";
  }

  // Etiquetas positivas explÃ­citas
  if (detectarFragmento(lineaNorm, TOKENS_ESCURRIDO)) return "A1";
  if (detectarFragmento(lineaNorm, TOKENS_NETO))      return "A2";
  if (detectarFragmento(lineaNorm, TOKENS_BRUTO))     return "B";

  // Descarte secundario â€” solo si no hay etiqueta positiva
  if (/ingredientes?:|ingredients?:|contiene:|inhaltsstoffe:/.test(lineaNorm)) return "D";
  if (/%/.test(lineaNorm))             return "D";
  if (/[€$£]/.test(lineaNorm))         return "D";
  if (/grados|°[cf]/.test(lineaNorm))  return "D";
  // Slash solo es descarte si NO fue normalizado a multipack (x) por normalizarSlashMultipack
  if (/\d+\/\d+/.test(lineaNorm))      return "D";

  for (var n = 0; n < TOKENS_NUTRICIONAL.length; n++) {
    if (lineaNorm.indexOf(TOKENS_NUTRICIONAL[n]) !== -1) return "D";
  }
  for (var r = 0; r < TOKENS_RACION.length; r++) {
    if (lineaNorm.indexOf(TOKENS_RACION[r]) !== -1) return "D";
  }

  return "C";
}

// â”€â”€â”€ FUSIÃ“N DE LÃNEAS PARTIDAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Si lÃ­nea i tiene etiqueta semÃ¡ntica pero no peso, y lÃ­nea i+1 tiene peso pero
// no etiqueta â†’ se fusionan en una sola lÃ­nea.

var UNIDADES = ["kg", "g", "gr", "grs", "mg", "l", "lt", "ltr", "litro", "litros", "ml", "cl", "dl", "oz", "lb"];

// PatrÃ³n numÃ©rico completo: miles+decimal Â· decimal simple Â· entero
// Cubre: 1.500,00 | 1,500.00 | 1.000 | 1,5 | 500
var NUM_PAT = "(?:\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d+)?|\\d+[.,]\\d+|\\d+)";

// (?<![/\d-]) evita capturar "2" de "1/2 kg" o "500" de "450-500 g"
var UNIDADES_REGEX = new RegExp(
  "(?<![/\\d-])(" + NUM_PAT + ")\\s*x?\\s*(" + NUM_PAT + ")?\\s*(" + UNIDADES.join("|") + ")\\b",
  "gi"
);

function tieneEtiqueta(lineaNorm) {
  return detectarFragmento(lineaNorm, TOKENS_ESCURRIDO) ||
         detectarFragmento(lineaNorm, TOKENS_NETO)      ||
         detectarFragmento(lineaNorm, TOKENS_BRUTO);
}

function tienePeso(linea) {
  UNIDADES_REGEX.lastIndex = 0;
  return UNIDADES_REGEX.test(linea);
}

function fusionarLineasPartidas(textoLimpio) {
  var lineas = textoLimpio.split("\n");
  var resultado = [];
  var i = 0;
  while (i < lineas.length) {
    var lineaNorm = normalizarUnicode(lineas[i]);
    if (tieneEtiqueta(lineaNorm) && !tienePeso(lineas[i]) && i + 1 < lineas.length) {
      var sigNorm = normalizarUnicode(lineas[i + 1]);
      if (tienePeso(lineas[i + 1]) && !tieneEtiqueta(sigNorm)) {
        resultado.push(lineas[i] + " " + lineas[i + 1]);
        i += 2;
        continue;
      }
    }
    resultado.push(lineas[i]);
    i++;
  }
  return resultado.join("\n");
}

// â”€â”€â”€ UNIDADES â€” NORMALIZACIÃ“N â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function normalizarUnidad(u) {
  u = u.toLowerCase();
  if (u === "gr" || u === "grs")                                    return "g";
  if (u === "lt" || u === "ltr" || u === "litro" || u === "litros") return "l";
  return u;
}

function normalizarValor(valor, unidad) {
  var u = normalizarUnidad(unidad);
  if (u === "kg") return valor * 1000;
  if (u === "g")  return valor;
  if (u === "l")  return valor * 1000;
  if (u === "ml") return valor;
  if (u === "cl") return valor * 10;
  if (u === "dl") return valor * 100;
  if (u === "oz") return Math.round(valor * 28.35);
  if (u === "lb") return Math.round(valor * 453.59);
  return valor;
}

// â”€â”€â”€ EXTRACCIÃ“N DE CANDIDATOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function extraerCandidatos(textoLimpio) {
  var candidatos  = [];
  var descartados = [];
  var lineas      = textoLimpio.split("\n");

  for (var i = 0; i < lineas.length; i++) {
    var lineaOrig = lineas[i];
    var lineaNorm = normalizarUnicode(lineaOrig);
    var clase     = clasificarLinea(lineaNorm);

    var ctxIngredientes = false;
    if (clase === "C") {
      var ventana = lineas.slice(Math.max(0, i - 5), Math.min(lineas.length, i + 6));
      if (/ingredientes:|ingrediente:|ingredients:|contiene:/.test(
            normalizarUnicode(ventana.join(" ")))) {
        ctxIngredientes = true;
      }
    }

    var match;
    UNIDADES_REGEX.lastIndex = 0;

    while ((match = UNIDADES_REGEX.exec(lineaOrig)) !== null) {
      var tokenOrig  = match[0].trim();
      var val1txt    = match[1];
      var val2txt    = match[2] || null;
      var unidad     = match[3].toLowerCase();
      var valor1     = parsearNumero(val1txt);
      var valor2     = val2txt ? parsearNumero(val2txt) : null;
      var esMulti    = valor2 !== null;
      var valorTotal = esMulti ? valor1 * valor2 : valor1;

      // Detectar segundo extremo de rango "X - N unit" o "X-N unit" con espacio antes del guiÃ³n
      // El lookbehind ya bloquea "X-N" (sin espacios). Esto cubre "X - N" (con espacios).
      var matchStart = match.index;
      var lookback = lineaOrig.substring(Math.max(0, matchStart - 5), matchStart);
      if (/\d\s*-\s*$/.test(lookback)) {
        descartados.push({ token: tokenOrig, linea: lineaOrig, motivo: "segundo extremo de rango numérico", clase: "D" });
        continue;
      }

      // Valor cero o negativo â€” absurdo fÃ­sicamente
      if (valorTotal <= 0) {
        descartados.push({ token: tokenOrig, linea: lineaOrig, motivo: "valor cero o negativo", clase: "D" });
        continue;
      }

      if (unidad === "mg") {
        descartados.push({ token: tokenOrig, linea: lineaOrig, motivo: "mg siempre nutricional", clase: "D" });
        continue;
      }
      if (clase === "D") {
        descartados.push({ token: tokenOrig, linea: lineaOrig, motivo: "clase D", clase: "D" });
        continue;
      }
      // g < 10 sin multipack: descarte salvo etiqueta neto/escurrido explÃ­cita
      if ((unidad === "g" || unidad === "gr" || unidad === "grs") && !esMulti && valor1 < 10) {
        if (clase !== "A1" && clase !== "A2") {
          descartados.push({ token: tokenOrig, linea: lineaOrig, motivo: "g < 10 sin neto explícito", clase: "D" });
          continue;
        }
      }

      candidatos.push({
        tokenOriginal:   tokenOrig,
        valor1:          valor1,
        valor2:          valor2,
        valorTotal:      valorTotal,
        unidad:          unidad,
        unidadNorm:      normalizarUnidad(unidad),
        valorNorm:       normalizarValor(valorTotal, unidad),
        esMultipack:     esMulti,
        lineaOrigen:     lineaOrig.trim(),
        lineaIndex:      i,
        clase:           clase,
        ctxIngredientes: ctxIngredientes
      });
    }
  }

  return { candidatos: candidatos, descartados: descartados };
}

// â”€â”€â”€ COLAPSO DE DUPLICADOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Elimina candidatos equivalentes (mismo valor normalizado + unidad + clase).
// Maneja el caso bilingÃ¼e: "Net weight: 500g" y "Peso neto: 500g" â†’ uno solo.

// â”€â”€â”€ CONSOLIDAR CANDIDATOS EQUIVALENTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Dos candidatos son equivalentes solo si coinciden en:
//   1. misma clase (A1, A2, B, C)
//   2. mismo tipo fÃ­sico (masa vs volumen)
//   3. mismo valorNorm
//   4. misma estructura (simple vs multipack)
// Nunca fusionar: multipack+simple, A1+A2, A2+B.

var MASAS   = ["g", "kg", "oz", "lb"];
var VOLUMEN = ["ml", "l", "cl", "dl", "lt", "litro", "litros"];

function tipoFisico(unidadNorm) {
  if (MASAS.indexOf(unidadNorm) !== -1)   return "masa";
  if (VOLUMEN.indexOf(unidadNorm) !== -1) return "volumen";
  return "otro_" + unidadNorm; // desconocida -> nunca fusiona con nada
}

function colapsarDuplicados(candidatos) {
  var grupos = [];  // cada grupo = { clave, representante, evidencias }
  var mapa   = {};

  for (var i = 0; i < candidatos.length; i++) {
    var c = candidatos[i];
    var tf = tipoFisico(c.unidadNorm);
    var esM = c.esMultipack ? "multi" : "simple";
    // Clave exacta: clase + tipo fÃ­sico + valor canÃ³nico + estructura
    var clave = c.clase + "|" + tf + "|" + c.valorNorm + "|" + esM;

    if (mapa[clave] === undefined) {
      mapa[clave] = grupos.length;
      var rep = {};
      for (var k in c) { if (c.hasOwnProperty(k)) rep[k] = c[k]; }
      rep.evidencias  = 1;
      rep.lineasExtra = [];
      grupos.push(rep);
    } else {
      var idx = mapa[clave];
      grupos[idx].evidencias++;
      grupos[idx].lineasExtra.push(c.lineaOrigen);
    }
  }

  return grupos;
}

// â”€â”€â”€ INFERENCIA BRUTO â†’ NETO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function inferenciaBrutoNeto(cBruto, cNeutro) {
  var masas = ["g", "kg", "oz", "lb"];
  var vols  = ["ml", "l", "cl", "dl"];
  var bM = masas.indexOf(cBruto.unidadNorm)  !== -1;
  var nM = masas.indexOf(cNeutro.unidadNorm) !== -1;
  var bV = vols.indexOf(cBruto.unidadNorm)   !== -1;
  var nV = vols.indexOf(cNeutro.unidadNorm)  !== -1;

  if (!((bM && nM) || (bV && nV))) {
    return { aplicable: false, motivo: "unidades incomparables: " + cBruto.unidadNorm + " vs " + cNeutro.unidadNorm };
  }
  if (cBruto.esMultipack || cNeutro.esMultipack) {
    return { aplicable: false, motivo: "uno o ambos son multipack" };
  }
  if (cNeutro.valorNorm >= cBruto.valorNorm) {
    return { aplicable: false, motivo: "neutro no es menor que bruto" };
  }
  if (cNeutro.valorNorm < 50) {
    return { aplicable: false, motivo: "neutro (" + cNeutro.valorNorm + ") < 50 — posible porción" };
  }
  return {
    aplicable: true,
    resultado: cNeutro.tokenOriginal,
      motivo:    "inferencia: " + cNeutro.tokenOriginal + " (neutro<bruto) -> neto"
  };
}

// â”€â”€â”€ SCORING PARA CANDIDATOS NEUTROS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// totalLineas: nÃºmero total de lÃ­neas del texto limpio (para saber si es primera mitad)
function scoringNeutros(candidatos, totalLineas) {
  // Frecuencia de cada valorNorm entre los candidatos C â€” para detectar corroboraciÃ³n
  var cuentaValor = {};
  candidatos.forEach(function(c) {
    cuentaValor[c.valorNorm] = (cuentaValor[c.valorNorm] || 0) + 1;
  });

  return candidatos.map(function(c) {
    var pts = [], score = 0;
    var palabras = c.lineaOrigen.split(/\s+/).length;

    // â”€â”€ Criterios originales â”€â”€
    if (["kg","g","gr","grs","ml","l","cl","lt","litro","litros","oz","lb"].indexOf(c.unidad) !== -1) {
      pts.push({ r: "unidad_estandar", p: 25 }); score += 25;
    }
    if (c.esMultipack)                              { pts.push({ r: "multipack",        p: 20 }); score += 20; }
    if (palabras <= 4)                              { pts.push({ r: "token_aislado",    p: 15 }); score += 15; }
    if (c.ctxIngredientes)                          { pts.push({ r: "ctx_ingredientes", p:-20 }); score -= 20; }
    if (c.valorNorm >= 100 && c.valorNorm <= 10000) { pts.push({ r: "rango_tipico",     p: 20 }); score += 20; }

    // â”€â”€ Criterios nuevos de desempate â”€â”€

    // LÃ­nea completamente aislada: solo nÃºmero + unidad (â‰¤2 tokens)
    if (palabras <= 2)                              { pts.push({ r: "linea_aislada",    p: 15 }); score += 15; }

    // Primera mitad del documento: los pesos declarados van antes de ingredientes/nutriciÃ³n
    if (totalLineas > 0 && c.lineaIndex < totalLineas / 2) {
      pts.push({ r: "primera_mitad", p: 10 }); score += 10;
    }

    // Valor corroborado: el mismo valorNorm aparece en otro candidato C (repeticiÃ³n fiable)
    if ((cuentaValor[c.valorNorm] || 0) > 1)        { pts.push({ r: "valor_corroborado", p: 10 }); score += 10; }

    // Sin contexto sospechoso: la lÃ­nea no contiene aÃ±o 4 dÃ­gitos, temperatura negativa ni "lote"
    var lineaNorm = c.lineaOrigen;
    if (!/\b(?:20\d{2}|19\d{2})\b/.test(lineaNorm) &&
        !/[-\u2212]\s*\d+\s*[°cCfF]/.test(lineaNorm) &&
        !/\blote\b/i.test(lineaNorm)) {
      pts.push({ r: "sin_ctx_sospechoso", p: 10 }); score += 10;
    }

    return { token: c.tokenOriginal, lineaOrigen: c.lineaOrigen, score: score, detalle: pts };
  });
}

// â”€â”€â”€ NORMALIZACIÃ“N DE SALIDA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Formato uniforme: "920 g" Â· "1.5 kg" Â· "500 ml" Â· "4x2.5 kg"
// NÃºmero: separador decimal = punto, sin separador de miles, sin ceros finales.
// Unidad: forma corta normalizada y subida cuando corresponde (1000 g -> 1 kg).

function formatearNumero(n) {
  var r = Math.round(n * 10000) / 10000; // evita ruido flotante
  var s = r.toString();
  if (s.indexOf(".") !== -1) {
  s = s.replace(/\.?0+$/, ""); // elimina ceros finales: "1.50" -> "1.5", "1500.0" -> "1500"
  }
  return s;
}

function subirUnidadSalida(valor, unidad) {
  var u = normalizarUnidad(unidad);
  var valorNorm = normalizarValor(valor, u);
  if ((u === "g" || u === "kg") && valorNorm >= 1000) {
    return { valor: valorNorm / 1000, unidad: "kg" };
  }
  if ((u === "ml" || u === "cl" || u === "dl" || u === "l") && valorNorm >= 1000) {
    return { valor: valorNorm / 1000, unidad: "l" };
  }
  return { valor: valor, unidad: u };
}

function formatearSalida(candidato) {
  var u = candidato.unidadNorm;
  if (candidato.esMultipack) {
    // Multipack: "4x2.5 kg"
    var n1 = formatearNumero(candidato.valor1);
    var unidadPack = subirUnidadSalida(candidato.valor2, u);
    return n1 + "x" + formatearNumero(unidadPack.valor) + " " + unidadPack.unidad;
  }
  var unidadSalida = subirUnidadSalida(candidato.valorTotal, u);
  return formatearNumero(unidadSalida.valor) + " " + unidadSalida.unidad;
}

// â”€â”€â”€ DECISIÃ“N FINAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Elige el representante de un cluster cercano (evidencias DESC, distancia a mediana ASC, limpieza ASC)
function elegirRepresentante(lista) {
  var vals = lista.map(function(c) { return c.valorNorm; }).sort(function(a, b) { return a - b; });
  var mediana = vals.length % 2 === 0
    ? (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2
    : vals[Math.floor(vals.length / 2)];
  var copia = lista.slice().sort(function(x, y) {
    if (y.evidencias !== x.evidencias) return y.evidencias - x.evidencias;
    var dx = Math.abs(x.valorNorm - mediana);
    var dy = Math.abs(y.valorNorm - mediana);
    if (Math.abs(dx - dy) > 0.01) return dx - dy;
    // "mÃ¡s limpio": valorTotal entero prefiere al decimal
    var xL = (x.valorTotal === Math.floor(x.valorTotal)) ? 0 : 1;
    var yL = (y.valorTotal === Math.floor(y.valorTotal)) ? 0 : 1;
    return xL - yL;
  });
  return copia[0];
}

function clusterCercano(lista, umbral) {
  if (lista.length < 2) return false;
  var vals = lista.map(function(c) { return c.valorNorm; });
  var minV  = Math.min.apply(null, vals);
  var maxV  = Math.max.apply(null, vals);
  return minV > 0 && (maxV - minV) / minV <= umbral;
}

function decidir(candidatos, textoLimpio) {
  if (candidatos.length === 0) {
    return { resultado: null, motivo: "ningún candidato", via: "sin_candidatos" };
  }

  // Colapsar duplicados equivalentes (bilingÃ¼e, misma cantidad expresada dos veces)
  var colapsados = colapsarDuplicados(candidatos);

  var a1 = colapsados.filter(function(c) { return c.clase === "A1"; });
  var a2 = colapsados.filter(function(c) { return c.clase === "A2"; });
  var b  = colapsados.filter(function(c) { return c.clase === "B";  });
  var cn = colapsados.filter(function(c) { return c.clase === "C";  });

  // â”€â”€â”€ VÃA A1 â€” escurrido explÃ­cito â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (a1.length === 1) {
    return { resultado: formatearSalida(a1[0]), motivo: "escurrido explícito", via: "clase_A1", candidatos: colapsados };
  }
  if (a1.length > 1) {
    var a1m = a1.filter(function(c) { return  c.esMultipack; });
    var a1s = a1.filter(function(c) { return !c.esMultipack; });

    // Multipack A1 confirmado por total equivalente (simÃ©trico a A2)
    if (a1m.length === 1 && a1s.length >= 1) {
      var totalMultiA1 = a1m[0].valorNorm;
      var confirmaA1   = a1s.some(function(c) { return Math.abs(c.valorNorm - totalMultiA1) < 2; });
      if (confirmaA1) {
        return { resultado: formatearSalida(a1m[0]), motivo: "multipack A1 confirmado por total equivalente", via: "clase_A1_multi", candidatos: colapsados };
      }
    }

    // Cluster A1 simples â‰¤5% â†’ mismo escurrido deformado por OCR/idioma
    if (a1s.length > 1 && clusterCercano(a1s, 0.05)) {
      var repA1 = elegirRepresentante(a1s);
    return { resultado: formatearSalida(repA1), motivo: "cluster A1 <=5%: representante por evidencia/mediana", via: "clase_A1", candidatos: colapsados };
    }

    // Spread >5% y sin multipack confirmado â†’ ambigÃ¼edad real â†’ campo vacÃ­o
    return { resultado: null, motivo: "varios A1 con valores muy distintos", via: "campo_vacio", candidatos: colapsados };
  }

  // â”€â”€â”€ VÃA A2 â€” neto explÃ­cito â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (a2.length === 1) {
    return { resultado: formatearSalida(a2[0]), motivo: "neto explícito", via: "clase_A2", candidatos: colapsados };
  }
  if (a2.length > 1) {
    var a2m = a2.filter(function(c) { return  c.esMultipack; });
    var a2s = a2.filter(function(c) { return !c.esMultipack; });

    // Multipack A2 confirmado por total equivalente
    if (a2m.length === 1 && a2s.length >= 1) {
      var totalMulti = a2m[0].valorNorm;
      var confirma   = a2s.some(function(c) { return Math.abs(c.valorNorm - totalMulti) < 2; });
      if (confirma) {
        return { resultado: formatearSalida(a2m[0]), motivo: "multipack A2 confirmado por total equivalente", via: "clase_A2_multi", candidatos: colapsados };
      }
    }

    // Cluster A2 simples â‰¤5% â†’ mismo neto deformado por OCR/idioma
    if (a2s.length > 1 && clusterCercano(a2s, 0.05)) {
      var repA2 = elegirRepresentante(a2s);
    return { resultado: formatearSalida(repA2), motivo: "cluster A2 <=5%: representante por evidencia/mediana", via: "clase_A2", candidatos: colapsados };
    }

    // Valores muy distintos â†’ ambigÃ¼edad real â†’ campo vacÃ­o
    return { resultado: null, motivo: "varios A2 con valores muy distintos", via: "campo_vacio", candidatos: colapsados };
  }

  // VÃA INFERENCIA â€” bruto(s) + neutro(s)
  // Regla: usar el B mÃ¡s pequeÃ±o (mÃ¡s prÃ³ximo al neto real)
  //        y el C mÃ¡s grande vÃ¡lido (< B, >= 50)
  if (b.length >= 1 && cn.length >= 1) {
    var bOrdenados = b.slice().sort(function(x, y) { return x.valorNorm - y.valorNorm; });
    var cOrdenados = cn.slice().sort(function(x, y) { return y.valorNorm - x.valorNorm; }); // desc

    var infResuelta = null;
    var cGanador    = null;
    for (var bi = 0; bi < bOrdenados.length && !infResuelta; bi++) {
      for (var ci = 0; ci < cOrdenados.length && !infResuelta; ci++) {
        var intento = inferenciaBrutoNeto(bOrdenados[bi], cOrdenados[ci]);
        if (intento.aplicable) { infResuelta = intento; cGanador = cOrdenados[ci]; }
      }
    }
    if (infResuelta && cGanador) {
      return { resultado: formatearSalida(cGanador), motivo: infResuelta.motivo, via: "inferencia_B_C", candidatos: colapsados };
    }
  }

  // â”€â”€â”€ VÃA SCORING â€” candidatos neutros sin resoluciÃ³n directa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (cn.length > 0) {
    var totalLineas = textoLimpio.split("\n").length;
    var scored = scoringNeutros(cn, totalLineas);
    scored.sort(function(a, b) { return b.score - a.score; });
    var g = scored[0], s = scored[1];
    if (g.score >= 30 && (!s || (g.score - s.score) >= 20)) {
      var cScoring = cn.filter(function(c) { return c.tokenOriginal === g.token; })[0] || cn[0];
      return { resultado: formatearSalida(cScoring), motivo: "scoring neutro: " + g.score + " pts", via: "scoring_C", candidatos: colapsados };
    }
    // Empate real entre neutros â†’ campo vacÃ­o. Los candidatos C son los mÃ¡s dÃ©biles;
    // si no hay desempate claro, no hay certeza suficiente.
    return { resultado: null, motivo: "empate entre neutros sin desempate claro", via: "campo_vacio", candidatos: colapsados };
  }

  // Solo bruto sin neto inferible â†’ campo vacÃ­o en resultado final.
  // El peso bruto no es el peso del producto; guardamos diagnÃ³stico para no perder el dato.
  if (b.length >= 1) {
    return {
      resultado:            null,
      motivo:               "solo bruto sin neto inferible",
      via:                  "campo_vacio",
      pesoBrutoDetectado:   formatearSalida(b[0]),
      candidatos:           colapsados
    };
  }

  return { resultado: null, motivo: "sin candidatos resolvibles", via: "campo_vacio", candidatos: colapsados };
}

// â”€â”€â”€ MOTOR PRINCIPAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function analizarMotorBoxer3(textoVision) {
  var textoEntrada = String(textoVision || "");
  var textoOCR = normalizarOCR(textoEntrada);
  var textoReparado = repararLineasCriticas(textoOCR);
  var textoFiltrado = filtroBasura(textoReparado);
  var textoLimpio = fusionarLineasPartidas(textoFiltrado);
  var extraccion = extraerCandidatos(textoLimpio);
  var consolidados = colapsarDuplicados(extraccion.candidatos);
  var decision = decidir(extraccion.candidatos, textoLimpio);
  var neutros = consolidados.filter(function(c) { return c.clase === "C"; });
  var totalLineas = textoLimpio ? textoLimpio.split("\n").length : 0;

  return {
    textoEntrada: textoEntrada,
    textoOCR: textoOCR,
    textoReparado: textoReparado,
    textoFiltrado: textoFiltrado,
    textoLimpio: textoLimpio,
    extraccion: extraccion,
    consolidados: consolidados,
    scoringNeutros: scoringNeutros(neutros, totalLineas),
    decision: decision
  };
}

function boxer3(textoVision) {
  console.log("===========================================");
  console.log("BOXER 3 v3");
  console.log("===========================================\n");

  var textoOCR = normalizarOCR(textoVision);
  if (textoOCR !== textoVision) {
    console.log("-- CAPA 0A: OCR --");
    var lo = textoVision.split("\n"), ln = textoOCR.split("\n");
    for (var z = 0; z < lo.length; z++) {
      if (lo[z] !== ln[z]) {
        console.log("  ANTES : \"" + lo[z].trim() + "\"");
        console.log("  AHORA : \"" + ln[z].trim() + "\"");
      }
    }
    console.log("");
  }

  var textoReparado = repararLineasCriticas(textoOCR);
  if (textoReparado !== textoOCR) {
    console.log("-- CAPA 0B: REPARACIÓN LÉXICA --");
    var lr0 = textoOCR.split("\n"), lr1 = textoReparado.split("\n");
    for (var zr = 0; zr < lr0.length; zr++) {
      if (lr0[zr] !== lr1[zr]) {
        console.log("  ANTES : \"" + lr0[zr].trim() + "\"");
        console.log("  AHORA : \"" + lr1[zr].trim() + "\"");
      }
    }
    console.log("");
  }

  var textoBruto   = filtroBasura(textoReparado);
  var textoLimpio  = fusionarLineasPartidas(textoBruto);

  console.log("-- FILTRO 1+2a: BASURA + FUSIÓN --");
  console.log(textoLimpio);
  console.log("");

  console.log("-- FILTRO 2b: CANDIDATOS --");
  var ext = extraerCandidatos(textoLimpio);
  ext.descartados.forEach(function(d) {
    console.log("  [D] \"" + d.token + "\" — " + d.motivo);
  });
  ext.candidatos.forEach(function(c) {
    console.log("  [" + c.clase + "] \"" + c.tokenOriginal + "\" (norm:" + c.valorNorm + " " + c.unidadNorm + ") | " + c.lineaOrigen);
  });
  console.log("");

  // Log consolidados
  var consolidados = colapsarDuplicados(ext.candidatos);
  if (consolidados.length !== ext.candidatos.length) {
  console.log("-- CONSOLIDADOS (" + ext.candidatos.length + " -> " + consolidados.length + ") --");
    consolidados.forEach(function(c) {
      console.log("  [" + c.clase + "] \"" + c.tokenOriginal + "\" ×" + c.evidencias + (c.evidencias > 1 ? " evidencias" : " evidencia") + " | " + c.lineaOrigen);
    });
    console.log("");
  }

  var dec = decidir(ext.candidatos, textoLimpio);
  console.log("-- DECISIÓN --");
  console.log("  Via       : " + dec.via);
  console.log("  Resultado : " + (dec.resultado || "campo vacío"));
  if (dec.pesoBrutoDetectado) {
    console.log("  Bruto     : " + dec.pesoBrutoDetectado + "  (solo bruto disponible, no es neto)");
  }
  console.log("  Motivo    : " + dec.motivo);
  console.log("===========================================\n");
}

// API publica del motor

var Boxer3MotorApi = {
  analizarMotorBoxer3: analizarMotorBoxer3,
  boxer3: boxer3,
  normalizarOCR: normalizarOCR,
  repararLineasCriticas: repararLineasCriticas,
  filtroBasura: filtroBasura,
  fusionarLineasPartidas: fusionarLineasPartidas,
  extraerCandidatos: extraerCandidatos,
  colapsarDuplicados: colapsarDuplicados,
  inferenciaBrutoNeto: inferenciaBrutoNeto,
  scoringNeutros: scoringNeutros,
  formatearSalida: formatearSalida,
  decidir: decidir
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = Boxer3MotorApi;
}
if (typeof globalThis !== "undefined") {
  globalThis.Boxer3Motor = Boxer3MotorApi;
}
// Pruebas de laboratorio separadas de la app final.


