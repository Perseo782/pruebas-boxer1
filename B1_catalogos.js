/**
 * =====================================================================
 * BOXER 1 v2 · CATALOGOS
 * =====================================================================
 * Catalogo cerrado de alergenos + patrones de peso/volumen.
 * Precalculado una vez al cargar la pagina.
 * Expone:
 *   - globalThis.B1_CATALOGOS
 *   - globalThis.B1_CATALOGOS_READY
 *   - globalThis.B1_CATALOGOS_ERROR
 * =====================================================================
 */

(function(global) {
  'use strict';

  function B1_cat_crearError(code, message) {
    return { code: code, message: message };
  }

  function B1_cat_crearSetProtegido(values) {
    var set = new Set(values);

    ['add', 'delete', 'clear'].forEach(function(methodName) {
      Object.defineProperty(set, methodName, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function() {
          throw new TypeError('B1 blacklist exactas es de solo lectura.');
        }
      });
    });

    return Object.freeze(set);
  }

  function B1_cat_esObjetoCongelable(value) {
    return value && (typeof value === 'object' || typeof value === 'function');
  }

  function B1_cat_deepFreeze(value) {
    if (!B1_cat_esObjetoCongelable(value) || Object.isFrozen(value)) {
      return value;
    }

    Object.getOwnPropertyNames(value).forEach(function(key) {
      var child = value[key];
      if (B1_cat_esObjetoCongelable(child)) {
        B1_cat_deepFreeze(child);
      }
    });

    return Object.freeze(value);
  }

  function B1_cat_normalizarTexto(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['`]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function B1_cat_normalizarToken(texto) {
    return B1_cat_normalizarTexto(texto).replace(/\s+/g, ' ').trim();
  }

  function B1_cat_crearEsqueleto(texto) {
    return texto.replace(/[aeiou]/g, '');
  }

  function B1_cat_crearFirmaOCR(texto) {
    return texto
      .replace(/0/g, 'o')
      .replace(/[1l]/g, 'i')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/8/g, 'b')
      .replace(/\s+/g, '');
  }

  function B1_cat_agregarIndice(indices, key, item) {
    if (!Object.prototype.hasOwnProperty.call(indices, key)) {
      indices[key] = [];
    }
    indices[key].push(item);
  }

  function B1_cat_validarMatriz(matriz, familiasOficiales, idiomasOficiales) {
    var faltantes = {};
    var familiasPresentes = {};

    familiasOficiales.forEach(function(familia) {
      faltantes[familia] = [];
      familiasPresentes[familia] = true;

      idiomasOficiales.forEach(function(idioma) {
        var bucket = matriz[familia] && matriz[familia][idioma];
        if (!bucket || !bucket.length) {
          faltantes[familia].push(idioma);
        }
      });
    });

    return {
      familiasPresentes: Object.keys(familiasPresentes),
      faltantes: faltantes
    };
  }

  function B1_cat_detectarChoquesBlacklist(blacklistValues, tablaAPalabras, tablaAFrases) {
    var formasOficiales = {};
    var choques = [];

    tablaAPalabras.forEach(function(item) {
      formasOficiales[item.forma] = true;
    });
    tablaAFrases.forEach(function(item) {
      formasOficiales[item.forma] = true;
    });

    blacklistValues.forEach(function(item) {
      if (formasOficiales[item] && choques.indexOf(item) === -1) {
        choques.push(item);
      }
    });

    return choques.sort();
  }

  function B1_cat_normalizarFormaValidada(rawForma, contexto) {
    if (typeof rawForma !== 'string') {
      throw B1_cat_crearError('B1_CAT_ENTRADA_INVALIDA', 'Entrada no string en ' + contexto + '.');
    }

    var forma = B1_cat_normalizarTexto(rawForma);
    if (!forma) {
      throw B1_cat_crearError('B1_CAT_ENTRADA_INVALIDA', 'Entrada vacia tras normalizar en ' + contexto + '.');
    }

    return forma;
  }

  function B1_cat_asegurarTablaNoVacia(nombre, tabla) {
    if (!Array.isArray(tabla) || tabla.length === 0) {
      throw B1_cat_crearError('B1_CAT_TABLA_VACIA', nombre + ' no puede quedar vacia.');
    }
  }

  function B1_cat_validarIndices(indices) {
    Object.keys(indices.hashExacto).forEach(function(key) {
      if (!Array.isArray(indices.hashExacto[key])) {
        throw B1_cat_crearError('B1_CAT_HASH_NO_ARRAY', 'hashExacto[' + key + '] debe ser array.');
      }
    });

    [
      'porLongitud',
      'porPrimeraLetra',
      'porUltimaLetra',
      'porEsqueleto',
      'porFirmaOCR',
      'frasesPorPrimerToken',
      'frasesPorNumeroTokens'
    ].forEach(function(indexName) {
      Object.keys(indices[indexName]).forEach(function(key) {
        if (!Array.isArray(indices[indexName][key])) {
          throw B1_cat_crearError(
            'B1_CAT_INDICE_NO_ARRAY',
            indexName + '[' + key + '] debe ser array.'
          );
        }
      });
    });
  }

  function B1_cat_congelarIndices(indices) {
    Object.keys(indices).forEach(function(key) {
      var bucket = indices[key];
      Object.keys(bucket).forEach(function(innerKey) {
        Object.freeze(bucket[innerKey]);
      });
      Object.freeze(bucket);
    });
    return Object.freeze(indices);
  }

  function B1_cat_congelarTablaB(tablaB) {
    tablaB.unidades = Object.freeze(tablaB.unidades.slice());

    tablaB.patronesCompactos = Object.freeze(tablaB.patronesCompactos.map(function(item) {
      return Object.freeze(item);
    }));
    tablaB.patronesSeparados = Object.freeze(tablaB.patronesSeparados.map(function(item) {
      return Object.freeze(item);
    }));
    tablaB.patronesMultipack = Object.freeze(tablaB.patronesMultipack.map(function(item) {
      return Object.freeze(item);
    }));

    return Object.freeze(tablaB);
  }

  try {
    var VERSION = 'B1_catalogos_v2_hijo1';
    var FAMILIAS_OFICIALES = Object.freeze([
      'gluten',
      'crustaceos',
      'huevos',
      'pescado',
      'cacahuetes',
      'soja',
      'lacteos',
      'frutos_cascara',
      'apio',
      'mostaza',
      'sesamo',
      'sulfitos',
      'altramuces',
      'moluscos'
    ]);
    var IDIOMAS_OFICIALES = Object.freeze(['es', 'en', 'fr', 'de', 'it', 'pt']);

    var MATRIZ_PALABRAS = {
      gluten: {
        es: ['gluten', 'trigo', 'cebada', 'centeno', 'avena', 'espelta', 'kamut'],
        en: ['wheat', 'barley', 'rye', 'oats', 'spelt'],
        fr: ['ble', 'orge', 'seigle', 'avoine', 'epeautre'],
        de: ['weizen', 'gerste', 'roggen', 'hafer', 'dinkel'],
        it: ['frumento', 'orzo', 'segale', 'avena', 'farro'],
        pt: ['trigo', 'cevada', 'centeio', 'aveia']
      },
      crustaceos: {
        es: ['crustaceos'],
        en: ['crustacean', 'crustaceans'],
        fr: ['crustaces'],
        de: ['krebstiere'],
        it: ['crostacei'],
        pt: ['crustaceos']
      },
      huevos: {
        es: ['huevo', 'huevos'],
        en: ['egg', 'eggs'],
        fr: ['oeuf', 'oeufs'],
        de: ['ei', 'eier'],
        it: ['uovo', 'uova'],
        pt: ['ovo', 'ovos']
      },
      pescado: {
        es: ['pescado'],
        en: ['fish'],
        fr: ['poisson'],
        de: ['fisch'],
        it: ['pesce'],
        pt: ['peixe']
      },
      cacahuetes: {
        es: ['cacahuete', 'cacahuetes', 'mani'],
        en: ['peanut', 'peanuts', 'groundnut'],
        fr: ['arachide', 'arachides'],
        de: ['erdnuss', 'erdnusse'],
        it: ['arachide'],
        pt: ['amendoim']
      },
      soja: {
        es: ['soja', 'soya'],
        en: ['soy', 'soya'],
        fr: ['soja'],
        de: ['soja'],
        it: ['soia'],
        pt: ['soja']
      },
      lacteos: {
        es: ['leche', 'lactosa', 'caseina', 'caseinas', 'suero'],
        en: ['milk', 'lactose', 'casein', 'caseins', 'whey'],
        fr: ['lait', 'lactose', 'caseine', 'lactoserum'],
        de: ['milch', 'laktose', 'kasein', 'molke'],
        it: ['latte', 'lattosio', 'caseina', 'siero'],
        pt: ['leite', 'lactose', 'caseina', 'soro']
      },
      frutos_cascara: {
        es: ['almendra', 'avellana', 'nuez', 'anacardo', 'pistacho', 'macadamia', 'pecana'],
        en: ['almond', 'hazelnut', 'walnut', 'cashew', 'pistachio', 'pecan'],
        fr: ['amande', 'noisette', 'noix', 'pistache'],
        de: ['mandel', 'haselnuss', 'walnuss', 'pistazie'],
        it: ['mandorla', 'nocciola', 'noce', 'pistacchio'],
        pt: ['amendoa', 'avela', 'noz']
      },
      apio: {
        es: ['apio'],
        en: ['celery'],
        fr: ['celeri'],
        de: ['sellerie'],
        it: ['sedano'],
        pt: ['aipo']
      },
      mostaza: {
        es: ['mostaza'],
        en: ['mustard'],
        fr: ['moutarde'],
        de: ['senf'],
        it: ['senape'],
        pt: ['mostarda']
      },
      sesamo: {
        es: ['sesamo'],
        en: ['sesame'],
        fr: ['sesame'],
        de: ['sesam'],
        it: ['sesamo'],
        pt: ['gergelim']
      },
      sulfitos: {
        es: ['sulfitos'],
        en: ['sulphites', 'sulfites'],
        fr: ['sulfites'],
        de: ['sulfite'],
        it: ['solfiti'],
        pt: ['sulfitos']
      },
      altramuces: {
        es: ['altramuz', 'altramuces'],
        en: ['lupin', 'lupins'],
        fr: ['lupin'],
        de: ['lupine'],
        it: ['lupino'],
        pt: ['lupino']
      },
      moluscos: {
        es: ['moluscos'],
        en: ['molluscs'],
        fr: ['mollusques'],
        de: ['weichtiere'],
        it: ['molluschi'],
        pt: ['moluscos']
      }
    };

    var MATRIZ_FRASES = {
      sulfitos: {
        es: ['dioxido de azufre'],
        en: ['sulphur dioxide'],
        fr: ['dioxyde de soufre'],
        de: ['schwefeldioxid'],
        it: ['anidride solforosa'],
        pt: ['dioxido de enxofre']
      }
    };

    var validation = B1_cat_validarMatriz(MATRIZ_PALABRAS, FAMILIAS_OFICIALES, IDIOMAS_OFICIALES);
    var coberturaFaltante = {};
    var familiasSinCobertura = [];
    Object.keys(validation.faltantes).forEach(function(familia) {
      var idiomasFaltantes = validation.faltantes[familia];
      if (idiomasFaltantes.length) {
        coberturaFaltante[familia] = idiomasFaltantes.slice();
        familiasSinCobertura.push(familia);
      }
    });

    if (familiasSinCobertura.length) {
      throw B1_cat_crearError(
        'B1_CAT_COBERTURA_INCOMPLETA',
        'Matriz de catalogos incompleta: ' + familiasSinCobertura.join(', ')
      );
    }

    var idiomasFaltantesFrasesSulfitos = IDIOMAS_OFICIALES.filter(function(idioma) {
      return !MATRIZ_FRASES.sulfitos || !MATRIZ_FRASES.sulfitos[idioma] || !MATRIZ_FRASES.sulfitos[idioma].length;
    });
    if (idiomasFaltantesFrasesSulfitos.length) {
      throw B1_cat_crearError(
        'B1_CAT_FRASES_INCOMPLETAS',
        'Frases de sulfitos incompletas: ' + idiomasFaltantesFrasesSulfitos.join(', ')
      );
    }

    var formaToFamilias = {};
    var tablaAPalabras = [];
    var tablaAFrases = [];

    FAMILIAS_OFICIALES.forEach(function(familia) {
      IDIOMAS_OFICIALES.forEach(function(idioma) {
        MATRIZ_PALABRAS[familia][idioma].forEach(function(rawForma) {
          var forma = B1_cat_normalizarFormaValidada(rawForma, 'tablaA.palabras.' + familia + '.' + idioma);
          if (!formaToFamilias[forma]) {
            formaToFamilias[forma] = {};
          }
          formaToFamilias[forma][familia] = true;
          tablaAPalabras.push({
            forma: forma,
            familia: familia,
            idioma: idioma
          });
        });
      });
    });

    Object.keys(MATRIZ_FRASES).forEach(function(familia) {
      var byIdioma = MATRIZ_FRASES[familia];
      Object.keys(byIdioma).forEach(function(idioma) {
        byIdioma[idioma].forEach(function(rawForma) {
          var forma = B1_cat_normalizarFormaValidada(rawForma, 'tablaA.frases.' + familia + '.' + idioma);
          var tokens = forma.split(' ');
          tablaAFrases.push({
            forma: forma,
            familia: familia,
            idioma: idioma,
            multifamilia: false,
            len: forma.replace(/\s+/g, '').length,
            primera: tokens[0] || '',
            ultima: tokens[tokens.length - 1] || '',
            esqueleto: B1_cat_crearEsqueleto(forma.replace(/\s+/g, '')),
            firmaOCR: B1_cat_crearFirmaOCR(forma),
            tokens: Object.freeze(tokens.slice()),
            numeroTokens: tokens.length
          });
        });
      });
    });

    var formasMultifamilia = [];
    tablaAPalabras = tablaAPalabras.map(function(item) {
      var familias = Object.keys(formaToFamilias[item.forma]);
      var multifamilia = familias.length > 1;
      if (multifamilia && formasMultifamilia.indexOf(item.forma) === -1) {
        formasMultifamilia.push(item.forma);
      }

      return Object.freeze({
        forma: item.forma,
        familia: item.familia,
        idioma: item.idioma,
        multifamilia: multifamilia,
        len: item.forma.length,
        primera: item.forma.charAt(0),
        ultima: item.forma.charAt(item.forma.length - 1),
        esqueleto: B1_cat_crearEsqueleto(item.forma),
        firmaOCR: B1_cat_crearFirmaOCR(item.forma)
      });
    });

    tablaAFrases = tablaAFrases.map(function(item) {
      if (formaToFamilias[item.forma]) {
        item.multifamilia = Object.keys(formaToFamilias[item.forma]).length > 1;
      }
      return Object.freeze(item);
    });

    B1_cat_asegurarTablaNoVacia('tablaA.palabras', tablaAPalabras);
    B1_cat_asegurarTablaNoVacia('tablaA.frases', tablaAFrases);

    var indices = {
      hashExacto: {},
      porLongitud: {},
      porPrimeraLetra: {},
      porUltimaLetra: {},
      porEsqueleto: {},
      porFirmaOCR: {},
      frasesPorPrimerToken: {},
      frasesPorNumeroTokens: {}
    };

    tablaAPalabras.forEach(function(item) {
      B1_cat_agregarIndice(indices.hashExacto, item.forma, item);
      B1_cat_agregarIndice(indices.porLongitud, String(item.len), item);
      B1_cat_agregarIndice(indices.porPrimeraLetra, item.primera, item);
      B1_cat_agregarIndice(indices.porUltimaLetra, item.ultima, item);
      B1_cat_agregarIndice(indices.porEsqueleto, item.esqueleto, item);
      B1_cat_agregarIndice(indices.porFirmaOCR, item.firmaOCR, item);
    });

    tablaAFrases.forEach(function(item) {
      B1_cat_agregarIndice(indices.frasesPorPrimerToken, item.primera, item);
      B1_cat_agregarIndice(indices.frasesPorNumeroTokens, String(item.numeroTokens), item);
    });
    B1_cat_validarIndices(indices);

    var unidadesTablaB = ['g', 'kg', 'l', 'ml', 'cl', 'oz', 'lb'];
    var tablaB = B1_cat_congelarTablaB({
      unidades: unidadesTablaB,
      patronesCompactos: [
        { id: 'numero_unidad', regex: /^\d+(?:[.,]\d+)?(?:g|kg|l|ml|cl|oz|lb)$/ },
        { id: 'unidad_sola', regex: /^(?:g|kg|l|ml|cl|oz|lb)$/ }
      ],
      patronesSeparados: [
        { id: 'numero_espacio_unidad', regex: /^\d+(?:[.,]\d+)?\s+(?:g|kg|l|ml|cl|oz|lb)$/ }
      ],
      patronesMultipack: [
        { id: 'multipack_compacto', regex: /^\d+\s*[x*]\s*\d+(?:[.,]\d+)?(?:g|kg|l|ml|cl|oz|lb)$/ },
        { id: 'multipack_separado', regex: /^\d+\s*[x*]\s*\d+(?:[.,]\d+)?\s+(?:g|kg|l|ml|cl|oz|lb)$/ }
      ]
    });
    B1_cat_asegurarTablaNoVacia('tablaB.unidades', tablaB.unidades);
    B1_cat_asegurarTablaNoVacia('tablaB.patronesCompactos', tablaB.patronesCompactos);
    B1_cat_asegurarTablaNoVacia('tablaB.patronesSeparados', tablaB.patronesSeparados);
    B1_cat_asegurarTablaNoVacia('tablaB.patronesMultipack', tablaB.patronesMultipack);

    var blacklistValues = ['sal', 'son', 'vez', 'pasta'];
    var choquesBlacklist = B1_cat_detectarChoquesBlacklist(blacklistValues, tablaAPalabras, tablaAFrases);
    if (choquesBlacklist.length) {
      throw B1_cat_crearError(
        'B1_CAT_BLACKLIST_CHOQUE',
        'Blacklist en conflicto con Tabla A: ' + choquesBlacklist.join(', ')
      );
    }

    var blacklist = Object.freeze({
      exactas: B1_cat_crearSetProtegido(blacklistValues)
    });

    var meta = Object.freeze({
      version: VERSION,
      familiasOficiales: FAMILIAS_OFICIALES,
      idiomasOficiales: IDIOMAS_OFICIALES,
      familiasDetectadas: Object.freeze(Array.from(new Set(
        tablaAPalabras.concat(tablaAFrases).map(function(item) {
          return item.familia;
        })
      ))),
      coberturaFaltante: Object.freeze(coberturaFaltante),
      formasMultifamilia: Object.freeze(formasMultifamilia.slice()),
      tablaACompleta: familiasSinCobertura.length === 0,
      tablaBCompleta:
        tablaB.unidades.length === 7 &&
        tablaB.patronesCompactos.length > 0 &&
        tablaB.patronesSeparados.length > 0 &&
        tablaB.patronesMultipack.length > 0
    });

    var catalogos = Object.freeze({
      tablaA: Object.freeze({
        palabras: Object.freeze(tablaAPalabras.slice()),
        frases: Object.freeze(tablaAFrases.slice())
      }),
      tablaB: tablaB,
      blacklist: blacklist,
      indices: B1_cat_congelarIndices(indices),
      meta: meta
    });

    B1_cat_deepFreeze(catalogos);

    global.B1_CATALOGOS = catalogos;
    global.B1_CATALOGOS_READY = true;
    global.B1_CATALOGOS_ERROR = null;
  } catch (error) {
    global.B1_CATALOGOS = null;
    global.B1_CATALOGOS_READY = false;
    global.B1_CATALOGOS_ERROR = error && error.code
      ? error
      : B1_cat_crearError('B1_CAT_BUILD_FAILED', error && error.message ? error.message : 'Error creando catalogos.');
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
