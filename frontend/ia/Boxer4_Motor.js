'use strict';

let catalogoAlergenos = null;
try {
  catalogoAlergenos = require("../shared/alergenos_oficiales.js");
} catch (errRequire) {
  if (typeof globalThis !== "undefined" && globalThis.AppV2AlergenosOficiales) {
    catalogoAlergenos = globalThis.AppV2AlergenosOficiales;
  }
}

/**
 * Boxer4_Alergenos · v2.2
 * Motor de reconocimiento de alérgenos — código dominante, sin IA operativa.
 *
 * Entrada:  paquete con textoAuditado (string) desde Cerebro_Orquestador
 * Salida:   JSON estructurado contrato 00B v4.1
 *
 * Doctrina: el código cierra siempre. Ante duda, activa y degrada. Nunca se bloquea.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1A. BLOQUEOS GLOBALES DE PRODUCTO
//     Si cualquiera de estas frases aparece en el texto, el alérgeno queda
//     bloqueado en TODO el producto. No puede activarse en ninguna otra parte.
// ─────────────────────────────────────────────────────────────────────────────

const BLOQUEOS_GLOBALES = {
  altramuces: [
    'sin altramuces','libre de altramuces','no contiene altramuz',
    'lupin free','free from lupin','contains no lupin',
  ],
  apio: [
    'sin apio','libre de apio','no contiene apio',
    'celery free','free from celery','contains no celery',
  ],
  cacahuetes: [
    'sin cacahuetes','sin mani','libre de cacahuetes','no contiene cacahuetes',
    'peanut free','free from peanuts','contains no peanuts','groundnut free',
  ],
  crustaceos: [
    'sin crustaceos','libre de crustaceos','no contiene crustaceos',
    'crustacean free','free from crustaceans','contains no crustaceans',
  ],
  frutos_secos: [
    'sin frutos secos','libre de frutos secos','no contiene frutos secos',
    'nut free','tree nut free','free from nuts','contains no nuts',
  ],
  gluten: [
    'sin gluten','libre de gluten','no contiene gluten',
    'apto celiacos','apto para celiacos','certificado sin gluten','producto sin gluten',
    'gluten free','free from gluten','no gluten','contains no gluten',
    'suitable for coeliacs','suitable for celiacs',
    'glutenfrei','senza glutine','sem gluten','isento de gluten',
    'sans gluten',
  ],
  huevos: [
    'sin huevo','sin huevos','libre de huevo','no contiene huevo',
    'egg free','free from eggs','no eggs','contains no egg',
    'eierfrei','senza uova','sem ovos','sans oeufs',
  ],
  lacteos: [
    'sin lacteos','libre de lacteos','no contiene lacteos',
    'sin leche','libre de leche','no contiene leche',
    'dairy free','milk free','free from dairy','free from milk','contains no milk',
    'milchfrei','senza latte','sem leite','sans lait',
  ],
  moluscos: [
    'sin moluscos','libre de moluscos','no contiene moluscos',
    'mollusc free','mollusk free','free from molluscs','free from mollusks',
    'senza molluschi','sem moluscos','sans mollusques',
  ],
  mostaza: [
    'sin mostaza','libre de mostaza','no contiene mostaza',
    'mustard free','free from mustard','contains no mustard',
    'senfrei','senza senape','sem mostarda','sans moutarde',
  ],
  pescado: [
    'sin pescado','libre de pescado','no contiene pescado',
    'fish free','free from fish','contains no fish',
    'fischfrei','senza pesce','sem peixe','sans poisson',
  ],
  sesamo: [
    'sin sesamo','libre de sesamo','no contiene sesamo',
    'sesame free','free from sesame','contains no sesame',
    'sesamfrei','senza sesamo','sem sesamo','sans sesame',
  ],
  soja: [
    'sin soja','sin soya','libre de soja','no contiene soja',
    'soy free','soya free','free from soy','free from soya','contains no soy',
    'sojafrei','senza soia','sem soja','sans soja',
  ],
  sulfitos: [
    'sin sulfitos','libre de sulfitos','no contiene sulfitos',
    'sulphite free','sulfite free','free from sulphites','free from sulfites',
    'sulfitfrei','senza solfiti','sem sulfitos','sans sulfites',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 1B. EXCLUSIONES LOCALES (subclaims)
//     Estas frases NO bloquean toda la familia. Solo excluyen su zona concreta.
//     Ejemplo: "sin lactosa" no apaga toda la familia lacteos.
//     Ejemplo: "sin trigo" no apaga toda la familia gluten.
// ─────────────────────────────────────────────────────────────────────────────

const EXCLUSIONES_LOCALES = {
  lacteos: [
    'sin lactosa','libre de lactosa','no contiene lactosa',
    'apto intolerantes a la lactosa',
    'sin caseina','libre de caseina',
    'sin suero de leche',
    'lactose free','free from lactose',
    'laktosefrei','senza lattosio','sem lactose','sans lactose',
  ],
  gluten: [
    'sin trigo','libre de trigo','no contiene trigo',
    'sin cebada','libre de cebada',
    'sin avena','libre de avena',
    'wheat free','barley free','oat free',
    'weizenfrei','sem trigo',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. DICCIONARIO DE FAMILIAS (singular y plural explícitos)
// ─────────────────────────────────────────────────────────────────────────────

const FAMILIAS = {
  altramuces: [
    'altramuz','altramuces','lupino','lupinos',
    'harina de altramuz','semilla de altramuz','semillas de altramuz',
    'lupin','lupins','lupin seed','lupin seeds','lupin flour','lupin bean','lupin beans',
    'graines de lupin','farine de lupin',
    'lupine','lupinen','lupinenmehl','lupinensamen',
    'semi di lupino','farina di lupino',
    'tremoco','tremocos','farinha de tremoco',
  ],
  apio: [
    'apio','semilla de apio','semillas de apio','sal de apio','raiz de apio','apio silvestre',
    'celery','celeriac','celery seed','celery seeds','celery salt','celery root',
    'celeri','graines de celeri','sel de celeri','celeri-rave',
    'sellerie','selleriesamen','selleriesalz','knollensellerie',
    'sedano','semi di sedano','sale di sedano','sedano rapa',
    'aipo','sal de aipo','raiz de aipo',
  ],
  cacahuetes: [
    'cacahuete','cacahuetes','mani','cacahuate','cacahuates',
    'mantequilla de cacahuete','aceite de cacahuete',
    'peanut','peanuts','groundnut','groundnuts','monkey nut','monkey nuts',
    'peanut butter','peanut oil',
    'arachide','arachides','beurre d arachide','huile d arachide',
    'erdnuss','erdnusse','erdnussbutter','erdnussol',
    'arachidi','burro di arachidi','olio di arachidi',
    'amendoim','amendoins','manteiga de amendoim',
  ],
  crustaceos: [
    'crustaceo','crustaceos',
    'cangrejo','cangrejos','gamba','gambas','langosta','langostas',
    'langostino','langostinos','bogavante','bogavantes',
    'percebe','percebes','necora','necoras','buey de mar',
    'cigala','cigalas','camaron','camarones','centollo','centollos',
    'crab','crabs','prawn','prawns','shrimp','shrimps',
    'lobster','lobsters','crayfish','barnacle','barnacles','scampi',
    'crabe','crabes','crevette','crevettes','homard','homards',
    'langouste','langoustes','langoustine','langoustines',
    'krabbe','krabben','garnele','garnelen','hummer','flusskrebs',
    'granchio','granchi','gambero','gamberi','aragosta','aragoste',
    'camarao','camaroes','lagosta','lagostas','lagostim','lagostins',
  ],
  frutos_secos: [
    'almendra','almendras','avellana','avellanas','nuez','nueces',
    'anacardo','anacardos','pistacho','pistachos',
    'nuez de macadamia','nuez de brasil','nuez pecana','nueces pecanas','nuez de caju',
    'almond','almonds','hazelnut','hazelnuts','walnut','walnuts',
    'cashew','cashews','pistachio','pistachios','macadamia','macadamias',
    'brazil nut','brazil nuts','pecan','pecan nut','pecan nuts','queensland nut',
    'amande','amandes','noisette','noisettes','noix','noix de cajou',
    'pistache','pistaches',
    'mandel','mandeln','haselnuss','haselnusse','walnuss','walnusse',
    'pistazie','pistazien',
    'mandorla','mandorle','nocciola','nocciole','noce','noci',
    'anacardio','anacardi','pistacchio','pistacchi',
    'amendoa','amendoas','avela','noz','castanha de caju',
    'frutos secos','tree nuts','fruits a coque','frutta a guscio',
    'schalenfruchte','frutos de casca rija',
  ],
  gluten: [
    'gluten','trigo','espelta','kamut','cebada','centeno','avena','triticale',
    'harina de trigo','harina de cebada','harina de centeno','harina de espelta',
    'semola','malta','almidon de trigo','salvado de trigo','germen de trigo',
    'proteina de trigo',
    'wheat','spelt','barley','rye','oats','malt',
    'wheat flour','wheat starch','wheat bran','wheat germ','wheat protein',
    'barley malt','rye flour','oat flour',
    'ble','epeautre','orge','seigle','avoine','farine de ble','amidon de ble',
    'weizen','dinkel','gerste','roggen','hafer',
    'weizenmehl','weizenstarke','malz','gerstenmalz',
    'frumento','farro','orzo','segale','farina di frumento','amido di frumento','malto',
    'cevada','centeio','farinha de trigo','amido de trigo','malte',
  ],
  huevos: [
    'huevo','huevos','yema','yemas','clara','claras de huevo',
    'albumina','ovoalbumina','lisozima','lecitina de huevo',
    'egg','eggs','yolk','yolks','egg white','egg whites',
    'albumin','ovalbumin','lysozyme','egg lecithin',
    'oeuf','oeufs','jaune d oeuf','blanc d oeuf','albumine',
    'ei','eier','eigelb','eiweiss','albumin','lysozym',
    'uovo','uova','tuorlo','tuorli','albume','albumina',
    'ovo','ovos','gema','gemas','clara de ovo',
  ],
  lacteos: [
    'leche','lactosa','caseina','suero de leche','mantequilla','nata',
    'queso','yogur','yogures','lactosuero','lactoalbumina',
    'lactoglobulina','leche desnatada','leche en polvo',
    'proteina de leche','grasa lactea','leche entera','leche semidesnatada',
    'milk','lactose','casein','whey','butter','cream','cheese','yoghurt','yogurt',
    'skimmed milk','milk powder','lactalbumin','lactoglobulin','milk protein','dairy',
    'whole milk','semi skimmed milk','buttermilk',
    'lait','caseine','petit-lait','beurre','creme','fromage','lait ecreme',
    'milch','laktose','kasein','molke','sahne','kase','milchpulver',
    'vollmilch','magermilch','buttermilch',
    'latte','lattosio','siero di latte','burro','panna','formaggio','latte scremato',
    'leite','soro de leite','manteiga','natas','queijo','leite em po',
  ],
  moluscos: [
    'molusco','moluscos',
    'almeja','almejas','mejillon','mejillones','ostra','ostras',
    'calamar','calamares','pulpo','pulpos','caracol','caracoles',
    'berberecho','berberechos','navaja','navajas','vieira','vieiras',
    'clam','clams','mussel','mussels','oyster','oysters',
    'squid','octopus','snail','snails','cockle','cockles',
    'razor clam','razor clams','scallop','scallops',
    'palourde','palourdes','moule','moules','huitre','huitres',
    'calmar','calmars','poulpe','escargot','escargots',
    'muschel','muscheln','auster','austern','tintenfisch','oktopus','schnecke','schnecken',
    'vongola','vongole','cozza','cozze','ostrica','ostriche',
    'calamaro','calamari','polpo','polpi','lumaca','lumache','capesante',
    'ameijoa','mexilhao','lula','polvo de mar',
  ],
  mostaza: [
    'mostaza','semilla de mostaza','semillas de mostaza',
    'harina de mostaza','aceite de mostaza',
    'mustard','mustard seed','mustard seeds','mustard flour','mustard powder','mustard oil',
    'moutarde','graine de moutarde','graines de moutarde','farine de moutarde',
    'senf','senfkorner','senfmehl','senfpulver','senfol',
    'senape','seme di senape','semi di senape','farina di senape','olio di senape',
    'mostarda','semente de mostarda','sementes de mostarda',
  ],
  pescado: [
    'pescado','pescados',
    'anchoa','anchoas','salmon','bacalao','atun','merluza',
    'boqueron','boquerones','sardina','sardinas','arenque','arenques',
    'colin','trucha','truchas','lenguado','lubina','dorada','rodaballo',
    'fish','anchovy','anchovies','salmon','cod','tuna','hake',
    'sardine','sardines','herring','herrings','pollock','trout',
    'sole','sea bass','sea bream','turbot',
    'poisson','anchois','saumon','morue','thon','merlan','hareng',
    'fisch','sardelle','lachs','kabeljau','thunfisch','hering','scholle','forelle',
    'pesce','acciuga','acciughe','salmone','merluzzo','tonno','aringa',
    'peixe','anchova','anchovas','salmao','bacalhau','atum','sardinhas',
  ],
  sesamo: [
    'sesamo','semilla de sesamo','semillas de sesamo',
    'tahini','tahina','pasta de sesamo','aceite de sesamo',
    'sesame','sesame seed','sesame seeds','sesame oil',
    'graines de sesame','huile de sesame',
    'sesam','sesamsamen','sesamol','sesampaste',
    'semi di sesamo','olio di sesamo',
    'sementes de sesamo','oleo de sesamo',
  ],
  soja: [
    'soja','soya','tofu','tempeh','miso',
    'proteina de soja','lecitina de soja','edamame',
    'harina de soja','aceite de soja','salsa de soja',
    'soy','soybean','soybeans','soy protein','soy lecithin',
    'soy flour','soy sauce','tamari',
    'lecithine de soja','sauce soja',
    'sojaprotein','sojalecithin','sojasauce','sojaol','sojamehl',
    'proteina di soia','lecitina di soia','salsa di soia',
    'proteina de soja','molho de soja',
  ],
  sulfitos: [
    'sulfito','sulfitos','dioxido de azufre','metabisulfito','bisulfito',
    'e220','e221','e222','e223','e224','e225','e226','e227','e228',
    'sulphite','sulphites','sulfite','sulfites',
    'sulfur dioxide','sulphur dioxide','metabisulphite','bisulphite','so2',
    'dioxyde de soufre','metabisulfite',
    'schwefeldioxid','metabisulfit',
    'anidride solforosa','metabisolfito','solfito','solfiti',
    'dioxido de enxofre','metabissulfito',
  ],
};

const ORDEN_ALFABETICO = (
  catalogoAlergenos &&
  Array.isArray(catalogoAlergenos.NOMBRES_OFICIALES)
)
  ? catalogoAlergenos.NOMBRES_OFICIALES.slice()
  : [
      'altramuces','apio','cacahuetes','crustaceos',
      'frutos_secos','gluten','huevos','lacteos',
      'moluscos','mostaza','pescado','sesamo','soja','sulfitos',
    ];

// ─────────────────────────────────────────────────────────────────────────────
// 3. UTILIDADES
// ─────────────────────────────────────────────────────────────────────────────

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function escaparRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Detecta texto degradado: >35% de palabras rotas (< 3 letras, no conectores) */
const CONECTORES = new Set([
  'de','la','el','en','y','a','o','con','sin','por','para','del','al',
  'su','un','una','los','las','of','the','and','in','or','with','le',
  'et','du','au','di','da','e','i',
]);

function textoPareceDegradado(textoNorm) {
  const palabras = textoNorm.split(/\s+/).filter(w => w.length > 0);
  if (palabras.length < 5) return false;
  const rotas = palabras.filter(w => w.length < 3 && !CONECTORES.has(w));
  return (rotas.length / palabras.length) > 0.35;
}

/** Elimina únicamente duplicados idénticos. Conserva todas las evidencias válidas. */
function compactarEvidencias(lista) {
  // Solo elimina cadenas exactamente iguales (case-insensitive).
  // No elimina evidencias más cortas aunque sean subcadena de otra más larga:
  // "trigo" e "harina de trigo" son dos evidencias distintas y ambas son válidas.
  const vistas = new Set();
  return lista.filter(e => {
    const n = normalizar(e);
    if (vistas.has(n)) return false;
    vistas.add(n);
    return true;
  });
}

function buscarCoincidencias(textoOriginal, textoFiltrado, terminoNorm) {
  const escapado = escaparRegex(terminoNorm);
  const regex = new RegExp(`(?<![a-z0-9])${escapado}(?![a-z0-9])`, 'g');
  const resultados = [];
  let match;
  while ((match = regex.exec(textoFiltrado)) !== null) {
    const fragmento = textoOriginal.substring(match.index, match.index + match[0].length);
    resultados.push(fragmento);
  }
  return resultados;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FILTRO DE EXCLUSIÓN — dos capas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Capa A: detecta claims globales de producto.
 * Devuelve un Set con los alérgenos bloqueados en todo el texto.
 */
function detectarBloqueosGlobales(textoNorm) {
  const bloqueados = new Set();
  const bloqueosDetectados = {}; // { alergeno: 'frase que lo bloqueó' }
  for (const [alergeno, frases] of Object.entries(BLOQUEOS_GLOBALES)) {
    for (const frase of frases) {
      const fraseNorm = normalizar(frase);
      const escapado = escaparRegex(fraseNorm);
      const regex = new RegExp(`(?<![a-z0-9])${escapado}(?![a-z0-9])`);
      if (regex.test(textoNorm)) {
        bloqueados.add(alergeno);
        bloqueosDetectados[alergeno] = frase;
        break;
      }
    }
  }
  return { bloqueados, bloqueosDetectados };
}

/**
 * Capa B: exclusiones locales (subclaims).
 * Sustituye la frase concreta por espacios para que el reconocedor no la vea.
 * No bloquea el alérgeno completo.
 */
function aplicarExclusionesLocales(textoNorm) {
  let textoFiltrado = textoNorm;
  const zonasExcluidas = [];

  for (const [alergeno, frases] of Object.entries(EXCLUSIONES_LOCALES)) {
    for (const frase of frases) {
      const fraseNorm = normalizar(frase);
      const escapado = escaparRegex(fraseNorm);
      const regex = new RegExp(`(?<![a-z0-9])${escapado}(?![a-z0-9])`, 'g');
      let match;
      while ((match = regex.exec(textoFiltrado)) !== null) {
        zonasExcluidas.push({ alergeno, frase, posicion: match.index });
        textoFiltrado =
          textoFiltrado.substring(0, match.index) +
          ' '.repeat(match[0].length) +
          textoFiltrado.substring(match.index + match[0].length);
      }
    }
  }

  return { textoFiltrado, zonasExcluidas };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. RECONOCEDOR
// ─────────────────────────────────────────────────────────────────────────────

// Índice de colisión: términos presentes en más de una familia.
// Construido una sola vez al cargar el módulo.
const INDICE_COLISION = (() => {
  const mapa = {};
  for (const [alergeno, terminos] of Object.entries(FAMILIAS)) {
    for (const t of terminos) {
      const tn = normalizar(t);
      if (!mapa[tn]) mapa[tn] = [];
      mapa[tn].push(alergeno);
    }
  }
  const colisiones = new Set();
  for (const [tn, familias] of Object.entries(mapa)) {
    if (familias.length > 1) colisiones.add(tn);
  }
  return colisiones;
})();

function reconocerAlergenos(textoOriginal, textoFiltrado) {
  const resultado = {};
  let colisionDetectada = false;

  for (const alergeno of ORDEN_ALFABETICO) {
    const terminos = [...FAMILIAS[alergeno]].sort((a, b) => b.length - a.length);
    const evidenciasRaw = [];

    for (const termino of terminos) {
      const terminoNorm = normalizar(termino);
      const encontradas = buscarCoincidencias(textoOriginal, textoFiltrado, terminoNorm);
      if (encontradas.length > 0 && INDICE_COLISION.has(terminoNorm)) {
        colisionDetectada = true;
      }
      evidenciasRaw.push(...encontradas);
    }

    const sinDuplicados = [...new Set(evidenciasRaw)];
    const evidencias = compactarEvidencias(sinDuplicados);
    resultado[alergeno] = { valor: evidencias.length > 0 ? 1 : 0, evidencias };
  }

  return { resultado, colisionDetectada };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. MOTOR PRINCIPAL — exportable como módulo
// ─────────────────────────────────────────────────────────────────────────────

function Boxer4_Alergenos(paqueteEntrada) {
  const { textoAuditado, analysisId, traceId } = paqueteEntrada;
  const tInicio = Date.now();

  // Validación — contrato 00B v4.1: error con tipoFallo y retryable
  if (!textoAuditado || textoAuditado.trim() === '') {
    return {
      ok: false,
      resultado: {
        estadoPasaporteModulo: 'ROJO',
        modulo: 'Boxer4_Alergenos',
        accionSugeridaParaCerebro: 'abortar_flujo',
        elapsedMs: Date.now() - tInicio,
        traceId: traceId || null,
        datos: {},
      },
      error: {
        code: 'B4_SIN_TEXTO',
        origin: 'Boxer4_Alergenos',
        passport: 'ROJO',
        message: 'textoAuditado llegó vacío o nulo.',
        tipoFallo: 'irrecuperable_por_diseño',
        retryable: false,
        motivo: 'Sin texto no hay análisis posible.',
      },
    };
  }

  // PASO 1 — Normalizar
  const textoNorm = normalizar(textoAuditado);

  // PASO 2 — Detectar texto degradado
  const textoDegradado = textoPareceDegradado(textoNorm);

  // PASO 3A — Detectar bloqueos globales de producto
  const { bloqueados: bloqueadosGlobales, bloqueosDetectados } = detectarBloqueosGlobales(textoNorm);

  // PASO 3B — Aplicar exclusiones locales (subclaims)
  const { textoFiltrado, zonasExcluidas } = aplicarExclusionesLocales(textoNorm);

  // PASO 4 — Reconocimiento sobre texto con exclusiones locales aplicadas
  const { resultado: reconocido, colisionDetectada } = reconocerAlergenos(textoAuditado, textoFiltrado);

  // PASO 5 — Construir resultadoLocal
  // Si un alérgeno está en bloqueadosGlobales → forzar 0
  const alergenos = {};
  const evidencias = {};

  for (const alergeno of ORDEN_ALFABETICO) {
    if (bloqueadosGlobales.has(alergeno)) {
      alergenos[alergeno] = 0;
    } else {
      const datos = reconocido[alergeno];
      alergenos[alergeno] = datos.valor;
      if (datos.valor === 1) {
        evidencias[alergeno] = datos.evidencias;
      }
    }
  }

  // PASO 6 — Pasaporte
  const sinTokens = textoAuditado.trim().split(/\s+/).filter(w => /[a-záéíóúüñ]/i.test(w)).length === 0;
  const requiereRevision = textoDegradado || colisionDetectada;
  const elapsedMs = Date.now() - tInicio;

  // ROJO: no hay base real para analizar → fallo real, ok: false, datos vacíos
  if (sinTokens) {
    return {
      ok: false,
      resultado: {
        estadoPasaporteModulo: 'ROJO',
        modulo: 'Boxer4_Alergenos',
        accionSugeridaParaCerebro: 'abortar_flujo',
        elapsedMs,
        traceId: traceId || null,
        datos: {},
      },
      error: {
        code: 'B4_SIN_BASE_ANALISIS',
        origin: 'Boxer4_Alergenos',
        passport: 'ROJO',
        message: 'El texto no contiene tokens analizables. No hay base real para clasificar alérgenos.',
        tipoFallo: 'irrecuperable_por_diseño',
        retryable: false,
        motivo: 'Sin tokens útiles el motor no puede producir un resultado válido.',
      },
    };
  }

  let estadoPasaporteModulo;
  if (requiereRevision) estadoPasaporteModulo = 'NARANJA';
  else estadoPasaporteModulo = 'VERDE';

  const confidence = estadoPasaporteModulo === 'VERDE' ? 'alta' : 'media';

  // PASO 7 — Salida con contrato 00B v4.1
  const resultado = {
    estadoPasaporteModulo,
    modulo: 'Boxer4_Alergenos',
    elapsedMs,
    traceId: traceId || null,
    datos: {
      modulo: 'Boxer4_Alergenos',
      estadoIA: 'NO_NECESITA_LLAMADA',
      tareasIA: [],
      resultadoLocal: {
        analysisId: analysisId || null,
        alergenos,
        evidencias,
        requiereRevision,
        confidence,
        bloqueadosGlobales: [...bloqueadosGlobales],
        bloqueosDetectados,
        zonasExcluidas,
      },
    },
  };

  if (estadoPasaporteModulo === 'NARANJA') {
    resultado.accionSugeridaParaCerebro = 'continuar_y_marcar_revision';
    resultado.warning = 'Texto degradado o colisión entre familias detectada.';
  }

  return { ok: true, resultado, error: null };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { Boxer4_Alergenos };
}
if (typeof globalThis !== "undefined") {
  globalThis.Boxer4Motor = { Boxer4_Alergenos: Boxer4_Alergenos };
}
