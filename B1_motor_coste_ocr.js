/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 v2 · MOTOR DE RECONOCIMIENTO POR COSTE OCR CERRADO
 * ═══════════════════════════════════════════════════════════════
 * Alineado con madre v5 y 12 reglas fijas del proyecto.
 *
 * Regla madre: una palabra OCR solo entra al agente si puede
 * explicarse como deformacion de una palabra oficial del lexico,
 * con coste por debajo del umbral.
 * Si duda entre dos familias, va a Gemini. No muere ambigua.
 *
 * Misma entrada, misma salida. Siempre.
 *
 * 5 grupos de salida:
 *   validas, rotasReconocidas, rechazadasDefinitivas,
 *   tablaBReconocida, observabilidadMotor
 *
 * Sin sensitivityMode. Sin confidence como puerta.
 * Sin fetch, canvas, slots ni Gemini.
 * ═══════════════════════════════════════════════════════════════
 */


/* ═══════════════════════════════════════════════════════════
   MAPA DE CONFUSIONES OCR — tabla cerrada
   ═══════════════════════════════════════════════════════════ */

var _B1_MOTOR_PARES_COSTE_1 = {
  '0_o':1, '1_i':1, '1_l':1, '4_a':1, '5_s':1, '8_b':1,
  'b_h':1, 'c_e':1, 'n_r':1
};

var _B1_MOTOR_PARES_COSTE_2 = {
  'b_d':2, 'f_t':2, 'g_q':2, 'm_n':2, 'p_q':2, 'u_v':2
};

var _B1_MOTOR_COMPUESTOS = {
  'rn': {reemplazo:'m', coste:1},
  'cl': {reemplazo:'d', coste:1},
  'vv': {reemplazo:'w', coste:1},
  'ii': {reemplazo:'u', coste:1}
};

var _B1_MOTOR_COSTE_INFINITO = 9999;

function _B1_motor_costeSustitucion(a, b) {
  if (a === b) return 0;
  var clave = a < b ? (a + '_' + b) : (b + '_' + a);
  if (_B1_MOTOR_PARES_COSTE_1[clave]) return 1;
  if (_B1_MOTOR_PARES_COSTE_2[clave]) return 2;
  // Sustitucion sin parecido visual
  return 4;
}

function _B1_motor_costeInsercion(ch) {
  // Insercion = falta caracter en token (hay que anadir para llegar al candidato)
  if (ch === "'" || ch === '\u2019') return 1;
  return 2;
}

function _B1_motor_costeEliminacion(ch, prevCh, token, pos) {
  // Eliminacion = sobra caracter en token
  if (ch === "'" || ch === '\u2019') return 1;
  // Duplicado: mismo caracter que el anterior
  if (pos > 0 && ch === prevCh) return 1;
  return 2;
}


/* ═══════════════════════════════════════════════════════════
   NORMALIZACION
   ═══════════════════════════════════════════════════════════ */

function _B1_motor_normalizar(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _B1_motor_soloLetras(texto) {
  return texto.replace(/[^a-z]/g, '');
}

function _B1_motor_esqueleto(texto) {
  return texto.replace(/[aeiou]/g, '');
}

function _B1_motor_firmaOCR(texto) {
  var out = '';
  for (var i = 0; i < texto.length; i++) {
    var ch = texto[i];
    if (ch === '0') { out += 'o'; }
    else if (ch === '1' || ch === 'l' || ch === 'i') { out += 'l'; }
    else if (ch === "'" || ch === '\u2019') { /* skip */ }
    else { out += ch; }
  }
  return out;
}

function _B1_motor_esVocal(ch) {
  return ch === 'a' || ch === 'e' || ch === 'i' || ch === 'o' || ch === 'u';
}

function _B1_motor_longitudesRachaVocalDesde(texto, inicio) {
  var out = [];
  var len = 0;

  for (var i = inicio; i < texto.length; i++) {
    if (!_B1_motor_esVocal(texto[i])) break;
    len++;
    if (len >= 2) out.push(len);
  }

  return out;
}

function _B1_motor_intentarActualizar(costes, back, fila, col, paso) {
  var actual = costes[fila][col];
  var prioridadActual = back[fila][col] ? back[fila][col].prioridad : 999;

  if (
    actual == null ||
    paso.coste < actual ||
    (paso.coste === actual && paso.prioridad < prioridadActual)
  ) {
    costes[fila][col] = paso.coste;
    back[fila][col] = paso;
  }
}

function _B1_motor_reconstruirOperaciones(back, fila, col) {
  var operaciones = [];
  var i = fila;
  var j = col;

  while (i > 0 || j > 0) {
    var paso = back[i][j];
    if (!paso) break;

    operaciones.push({
      op: paso.op,
      tokenConsumido: paso.tokenConsumido || '',
      candidatoConsumido: paso.candidatoConsumido || '',
      costOperacion: paso.costOperacion || 0,
      desdeFila: paso.pi,
      desdeCol: paso.pj,
      hastaFila: i,
      hastaCol: j
    });

    i = paso.pi;
    j = paso.pj;
  }

  operaciones.reverse();
  return operaciones;
}

function _B1_motor_mismoMulticonjunto(a, b) {
  if (a.length !== b.length) return false;

  var mapa = {};
  for (var i = 0; i < a.length; i++) {
    mapa[a[i]] = (mapa[a[i]] || 0) + 1;
  }

  for (var j = 0; j < b.length; j++) {
    if (!mapa[b[j]]) return false;
    mapa[b[j]]--;
  }

  return Object.keys(mapa).every(function(clave) {
    return mapa[clave] === 0;
  });
}

function _B1_motor_tieneReordenacion(token, candidato, operaciones) {
  if (token.length === candidato.length && token !== candidato && _B1_motor_mismoMulticonjunto(token, candidato)) {
    return true;
  }

  for (var i = 0; i < operaciones.length - 1; i++) {
    var op1 = operaciones[i];
    var op2 = operaciones[i + 1];

    if (
      op1.op === 'sustitucion' &&
      op2.op === 'sustitucion' &&
      op1.tokenConsumido.length === 1 &&
      op2.tokenConsumido.length === 1 &&
      op1.candidatoConsumido.length === 1 &&
      op2.candidatoConsumido.length === 1 &&
      op1.tokenConsumido === op2.candidatoConsumido &&
      op2.tokenConsumido === op1.candidatoConsumido
    ) {
      return true;
    }
  }

  return false;
}

function _B1_motor_totalInsercionesSimples(operaciones) {
  var total = 0;

  for (var i = 0; i < operaciones.length; i++) {
    if (operaciones[i].op === 'insercion') {
      total += operaciones[i].candidatoConsumido.length;
    }
  }

  return total;
}

function _B1_motor_analizarAlineamiento(token, candidato, operaciones, costeAbsoluto) {
  var longitudBase = Math.max(token.length, candidato.length) || 1;

  if (costeAbsoluto / longitudBase > 0.65) {
    return { prohibida: true, motivo: 'destruccion_excesiva' };
  }

  if (_B1_motor_tieneReordenacion(token, candidato, operaciones)) {
    return { prohibida: true, motivo: 'reordenacion' };
  }

  if (_B1_motor_totalInsercionesSimples(operaciones) >= 3) {
    return { prohibida: true, motivo: 'insercion_masiva' };
  }

  return { prohibida: false, motivo: null };
}


/* ═══════════════════════════════════════════════════════════
   LEVENSHTEIN PONDERADO CON CORTE TEMPRANO
   ═══════════════════════════════════════════════════════════ */

function _B1_motor_distanciaPonderada(token, candidatoForma, maxCoste) {
  var n = token.length;
  var m = candidatoForma.length;
  var costes = new Array(n + 1);
  var back = new Array(n + 1);

  for (var i = 0; i <= n; i++) {
    costes[i] = new Array(m + 1);
    back[i] = new Array(m + 1);
  }

  costes[0][0] = 0;

  for (var fila = 0; fila <= n; fila++) {
    for (var col = 0; col <= m; col++) {
      var costeBase = costes[fila][col];
      if (costeBase == null || costeBase > maxCoste) continue;

      if (fila < n && col < m) {
        var chToken = token[fila];
        var chCand = candidatoForma[col];
        var costeSust = _B1_motor_costeSustitucion(chToken, chCand);
        _B1_motor_intentarActualizar(costes, back, fila + 1, col + 1, {
          coste: costeBase + costeSust,
          prioridad: costeSust === 0 ? 0 : 1,
          pi: fila,
          pj: col,
          op: costeSust === 0 ? 'match' : 'sustitucion',
          costOperacion: costeSust,
          tokenConsumido: chToken,
          candidatoConsumido: chCand
        });
      }

      if (fila < n) {
        var costeElim = _B1_motor_costeEliminacion(
          token[fila],
          fila > 0 ? token[fila - 1] : '',
          token,
          fila
        );
        _B1_motor_intentarActualizar(costes, back, fila + 1, col, {
          coste: costeBase + costeElim,
          prioridad: 5,
          pi: fila,
          pj: col,
          op: 'eliminacion',
          costOperacion: costeElim,
          tokenConsumido: token[fila],
          candidatoConsumido: ''
        });
      }

      if (col < m) {
        var costeIns = _B1_motor_costeInsercion(candidatoForma[col]);
        _B1_motor_intentarActualizar(costes, back, fila, col + 1, {
          coste: costeBase + costeIns,
          prioridad: 5,
          pi: fila,
          pj: col,
          op: 'insercion',
          costOperacion: costeIns,
          tokenConsumido: '',
          candidatoConsumido: candidatoForma[col]
        });
      }

      if (fila + 1 < n && col < m) {
        var bigramaToken = token[fila] + token[fila + 1];
        var compuestoToken = _B1_MOTOR_COMPUESTOS[bigramaToken];
        if (compuestoToken && compuestoToken.reemplazo === candidatoForma[col]) {
          _B1_motor_intentarActualizar(costes, back, fila + 2, col + 1, {
            coste: costeBase + compuestoToken.coste,
            prioridad: 2,
            pi: fila,
            pj: col,
            op: 'compuesto_token_bigrama',
            costOperacion: compuestoToken.coste,
            tokenConsumido: bigramaToken,
            candidatoConsumido: candidatoForma[col]
          });
        }
      }

      if (fila < n && col + 1 < m) {
        var bigramaCand = candidatoForma[col] + candidatoForma[col + 1];
        var compuestoCand = _B1_MOTOR_COMPUESTOS[bigramaCand];
        if (compuestoCand && compuestoCand.reemplazo === token[fila]) {
          _B1_motor_intentarActualizar(costes, back, fila + 1, col + 2, {
            coste: costeBase + compuestoCand.coste,
            prioridad: 2,
            pi: fila,
            pj: col,
            op: 'compuesto_candidato_bigrama',
            costOperacion: compuestoCand.coste,
            tokenConsumido: token[fila],
            candidatoConsumido: bigramaCand
          });
        }
      }

      var rachasCand = _B1_motor_longitudesRachaVocalDesde(candidatoForma, col);
      for (var rc = 0; rc < rachasCand.length; rc++) {
        var lenCand = rachasCand[rc];
        _B1_motor_intentarActualizar(costes, back, fila, col + lenCand, {
          coste: costeBase + 3,
          prioridad: 3,
          pi: fila,
          pj: col,
          op: 'vocales_perdidas_token',
          costOperacion: 3,
          tokenConsumido: '',
          candidatoConsumido: candidatoForma.slice(col, col + lenCand)
        });
      }

      var rachasToken = _B1_motor_longitudesRachaVocalDesde(token, fila);
      for (var rt = 0; rt < rachasToken.length; rt++) {
        var lenToken = rachasToken[rt];
        _B1_motor_intentarActualizar(costes, back, fila + lenToken, col, {
          coste: costeBase + 3,
          prioridad: 3,
          pi: fila,
          pj: col,
          op: 'vocales_extra_token',
          costOperacion: 3,
          tokenConsumido: token.slice(fila, fila + lenToken),
          candidatoConsumido: ''
        });
      }
    }
  }

  var costeAbsoluto = costes[n][m];
  if (costeAbsoluto == null || costeAbsoluto > maxCoste) {
    return { coste: _B1_MOTOR_COSTE_INFINITO, prohibida: false, motivoProhibida: null, operaciones: [] };
  }

  var operaciones = _B1_motor_reconstruirOperaciones(back, n, m);
  var analisis = _B1_motor_analizarAlineamiento(token, candidatoForma, operaciones, costeAbsoluto);

  return {
    coste: costeAbsoluto,
    prohibida: analisis.prohibida,
    motivoProhibida: analisis.motivo,
    operaciones: operaciones
  };
}


/* ═══════════════════════════════════════════════════════════
   UMBRALES
   ═══════════════════════════════════════════════════════════ */

function _B1_motor_umbral(longitudCandidato) {
  if (longitudCandidato <= 3) return 0.35;
  if (longitudCandidato <= 4) return 0.45;
  return 0.65;
}


/* ═══════════════════════════════════════════════════════════
   PREPROCESO: TABLA B SEPARADA
   ═══════════════════════════════════════════════════════════ */

/*
 * Helper: los patrones de Tabla B pueden ser regex directas
 * o objetos { regex: /.../ }. Esta funcion maneja ambos.
 */
function _B1_motor_testPatron(patron, texto) {
  if (patron instanceof RegExp) return patron.test(texto);
  if (patron && patron.regex instanceof RegExp) return patron.regex.test(texto);
  return false;
}

var _B1_MOTOR_TABLA_B_UNIDADES = {
  g:  { grupo: 'masa',    factor: 1 },
  kg: { grupo: 'masa',    factor: 1000 },
  oz: { grupo: 'masa',    factor: 28.349523125 },
  lb: { grupo: 'masa',    factor: 453.59237 },
  ml: { grupo: 'volumen', factor: 1 },
  cl: { grupo: 'volumen', factor: 10 },
  l:  { grupo: 'volumen', factor: 1000 }
};

function _B1_motor_parsearNumeroTablaB(texto) {
  var valor = parseFloat(String(texto || '').replace(',', '.'));
  return isNaN(valor) ? null : valor;
}

function _B1_motor_coincideConPatronesTablaB(tipo, texto, catalogos) {
  var patrones = [];
  if (tipo === 'compacto') patrones = catalogos.tablaB.patronesCompactos || [];
  else if (tipo === 'separado') patrones = catalogos.tablaB.patronesSeparados || [];
  else if (tipo === 'multipack') patrones = catalogos.tablaB.patronesMultipack || [];

  for (var i = 0; i < patrones.length; i++) {
    if (_B1_motor_testPatron(patrones[i], texto)) return true;
  }
  return false;
}

function _B1_motor_crearDetectadoTablaB(params) {
  var numero = params.numero != null ? _B1_motor_parsearNumeroTablaB(params.numero) : null;
  var unidadInfo = params.unidad ? _B1_MOTOR_TABLA_B_UNIDADES[params.unidad] : null;
  var valorEstandar = (numero != null && unidadInfo) ? (numero * unidadInfo.factor) : null;
  var totalEstandar = valorEstandar;

  if (params.cantidadPack != null && valorEstandar != null) {
    totalEstandar = params.cantidadPack * valorEstandar;
  }

  return {
    detectado: true,
    patron: params.patron,
    tokenConsumidoOriginal: params.tokenConsumidoOriginal,
    tokenConsumidoNormalizado: params.tokenConsumidoNormalizado,
    consumeSiguiente: !!params.consumeSiguiente,
    numero: numero,
    unidad: params.unidad || null,
    grupoUnidad: unidadInfo ? unidadInfo.grupo : null,
    valorEstandar: valorEstandar,
    totalEstandar: totalEstandar,
    cantidadPack: params.cantidadPack != null ? params.cantidadPack : null
  };
}

function _B1_motor_detectarTablaB(tokenNorm, siguienteNorm, textoOriginal, siguienteOriginal, catalogos) {
  var tokenPlano = (tokenNorm || '').replace(/\s+/g, '');
  var siguientePlano = (siguienteNorm || '').replace(/\s+/g, '');
  var combinadoSeparado = tokenNorm && siguienteNorm ? (tokenNorm + ' ' + siguienteNorm).trim() : '';
  var combinadoPlano = tokenPlano && siguientePlano ? (tokenPlano + siguientePlano) : '';

  var match;

  match = tokenPlano.match(/^(\d+(?:[.,]\d+)?)(g|kg|l|ml|cl|oz|lb)$/);
  if (match && _B1_motor_coincideConPatronesTablaB('compacto', tokenPlano, catalogos)) {
    return _B1_motor_crearDetectadoTablaB({
      patron: 'compacto',
      tokenConsumidoOriginal: textoOriginal,
      tokenConsumidoNormalizado: tokenPlano,
      consumeSiguiente: false,
      numero: match[1],
      unidad: match[2]
    });
  }

  match = tokenPlano.match(/^(\d+)[x*](\d+(?:[.,]\d+)?)(g|kg|l|ml|cl|oz|lb)$/);
  if (match && _B1_motor_coincideConPatronesTablaB('multipack', tokenPlano, catalogos)) {
    return _B1_motor_crearDetectadoTablaB({
      patron: 'multipack',
      tokenConsumidoOriginal: textoOriginal,
      tokenConsumidoNormalizado: tokenPlano,
      consumeSiguiente: false,
      cantidadPack: parseInt(match[1], 10),
      numero: match[2],
      unidad: match[3]
    });
  }

  if (combinadoSeparado) {
    match = combinadoSeparado.match(/^(\d+(?:[.,]\d+)?)\s+(g|kg|l|ml|cl|oz|lb)$/);
    if (match && _B1_motor_coincideConPatronesTablaB('separado', combinadoSeparado, catalogos)) {
      return _B1_motor_crearDetectadoTablaB({
        patron: 'separado',
        tokenConsumidoOriginal: textoOriginal + ' ' + siguienteOriginal,
        tokenConsumidoNormalizado: combinadoSeparado,
        consumeSiguiente: true,
        numero: match[1],
        unidad: match[2]
      });
    }
  }

  if (combinadoPlano) {
    match = combinadoPlano.match(/^(\d+)[x*](\d+(?:[.,]\d+)?)(g|kg|l|ml|cl|oz|lb)$/);
    if (match && _B1_motor_coincideConPatronesTablaB('multipack', combinadoPlano, catalogos)) {
      return _B1_motor_crearDetectadoTablaB({
        patron: 'multipack',
        tokenConsumidoOriginal: textoOriginal + ' ' + siguienteOriginal,
        tokenConsumidoNormalizado: combinadoPlano,
        consumeSiguiente: true,
        cantidadPack: parseInt(match[1], 10),
        numero: match[2],
        unidad: match[3]
      });
    }
  }

  if (_B1_MOTOR_TABLA_B_UNIDADES[tokenPlano] && _B1_motor_coincideConPatronesTablaB('compacto', tokenPlano, catalogos)) {
    return _B1_motor_crearDetectadoTablaB({
      patron: 'unidad_sola',
      tokenConsumidoOriginal: textoOriginal,
      tokenConsumidoNormalizado: tokenPlano,
      consumeSiguiente: false,
      numero: null,
      unidad: tokenPlano
    });
  }

  return { detectado: false };
}

function _B1_motor_resolverPesoVolumenReal(tablaBReconocida) {
  var frecuencias = {};
  var grupos = {};
  var ganadoresPorGrupo = [];

  function clave(item) {
    return [
      item.grupoUnidad || '',
      item.totalEstandar != null ? item.totalEstandar : 'null',
      item.cantidadPack != null ? item.cantidadPack : 'null'
    ].join('|');
  }

  function rankPatron(item) {
    if (item.patronDetectado === 'separado') return 4;
    if (item.patronDetectado === 'compacto') return 3;
    if (item.patronDetectado === 'multipack') return 2;
    if (item.patronDetectado === 'unidad_sola') return 0;
    return 1;
  }

  function compararDentroDeGrupo(a, b) {
    if (a.totalEstandar !== b.totalEstandar) {
      return b.totalEstandar - a.totalEstandar;
    }
    if (rankPatron(a) !== rankPatron(b)) {
      return rankPatron(b) - rankPatron(a);
    }
    if ((frecuencias[clave(a)] || 0) !== (frecuencias[clave(b)] || 0)) {
      return (frecuencias[clave(b)] || 0) - (frecuencias[clave(a)] || 0);
    }
    return a.ordenDeteccion - b.ordenDeteccion;
  }

  function compararGanadoresDeGrupo(a, b) {
    if (rankPatron(a) !== rankPatron(b)) {
      return rankPatron(b) - rankPatron(a);
    }
    if ((frecuencias[clave(a)] || 0) !== (frecuencias[clave(b)] || 0)) {
      return (frecuencias[clave(b)] || 0) - (frecuencias[clave(a)] || 0);
    }
    return a.ordenDeteccion - b.ordenDeteccion;
  }

  tablaBReconocida.forEach(function(item) {
    item.esPesoVolumenReal = false;
    item.esPesoVolumenRealGrupo = false;
    item.motivoSeleccion = null;
    if (item.totalEstandar == null || !item.grupoUnidad) return;
    var k = clave(item);
    frecuencias[k] = (frecuencias[k] || 0) + 1;
    if (!grupos[item.grupoUnidad]) {
      grupos[item.grupoUnidad] = [];
    }
    grupos[item.grupoUnidad].push(item);
  });

  Object.keys(grupos).forEach(function(grupo) {
    grupos[grupo].sort(compararDentroDeGrupo);
    if (grupos[grupo].length > 0) {
      var ganadorGrupo = grupos[grupo][0];
      ganadorGrupo.esPesoVolumenRealGrupo = true;
      ganadorGrupo.motivoSeleccion =
        'valor comercial mayor dentro del grupo ' + grupo + '; frecuencia solo como desempate';
      ganadoresPorGrupo.push(ganadorGrupo);
    }
  });

  if (ganadoresPorGrupo.length === 0) return null;

  ganadoresPorGrupo.sort(compararGanadoresDeGrupo);
  ganadoresPorGrupo[0].esPesoVolumenReal = true;
  return ganadoresPorGrupo[0];
}


/* ═══════════════════════════════════════════════════════════
   PREPROCESO: FRASES MULTITOKEN
   ═══════════════════════════════════════════════════════════ */

function _B1_motor_detectarFrase(indice, palabrasOCR, catalogos) {
  var tokenNorm = _B1_motor_normalizar(palabrasOCR[indice].texto);
  var candidatos = catalogos.indices.frasesPorPrimerToken[tokenNorm];
  if (!candidatos || candidatos.length === 0) return null;

  for (var f = 0; f < candidatos.length; f++) {
    var frase = candidatos[f];
    var tokens = frase.forma.split(' ');
    if (indice + tokens.length > palabrasOCR.length) continue;

    var coincide = true;
    for (var t = 0; t < tokens.length; t++) {
      var palNorm = _B1_motor_normalizar(palabrasOCR[indice + t].texto);
      if (palNorm !== tokens[t]) { coincide = false; break; }
    }

    if (coincide) {
      return { frase: frase, tokensConsumidos: tokens.length };
    }
  }

  return null;
}


/* ═══════════════════════════════════════════════════════════
   PREPROCESO: TOKENS FUSIONADOS Y PARTIDOS
   ═══════════════════════════════════════════════════════════ */

function _B1_motor_intentarParticion(tokenNorm, catalogos) {
  if (tokenNorm.length < 8) return null;
  for (var corte = 3; corte <= tokenNorm.length - 3; corte++) {
    var parte1 = tokenNorm.substring(0, corte);
    var parte2 = tokenNorm.substring(corte);
    var match1 = catalogos.indices.hashExacto[parte1];
    var match2 = catalogos.indices.hashExacto[parte2];
    if (match1 && match1.length > 0 && match2 && match2.length > 0) {
      return { parte1: match1[0], parte2: match2[0] };
    }
  }
  return null;
}

function _B1_motor_intentarFusion(indice, palabrasOCR, catalogos) {
  if (indice >= palabrasOCR.length - 1) return null;
  var t1 = _B1_motor_normalizar(palabrasOCR[indice].texto);
  var t2 = _B1_motor_normalizar(palabrasOCR[indice + 1].texto);
  if (t1.length > 6 || t2.length > 6) return null;
  var combinado = t1 + t2;
  if (combinado.length < 4 || combinado.length > 15) return null;
  var match = catalogos.indices.hashExacto[combinado];
  if (match && match.length > 0) {
    return { forma: match[0], tokensConsumidos: 2 };
  }
  return null;
}

function _B1_motor_ordenarEntradasExactas(entradas) {
  return entradas.slice().sort(function(a, b) {
    if (a.familia !== b.familia) return a.familia < b.familia ? -1 : 1;
    if (a.forma !== b.forma) return a.forma < b.forma ? -1 : 1;
    if (a.idioma !== b.idioma) return a.idioma < b.idioma ? -1 : 1;
    return 0;
  });
}

function _B1_motor_agruparExactosPorFamilia(exacto) {
  var agrupadas = {};
  var familias = [];
  var ordenadas = _B1_motor_ordenarEntradasExactas(exacto);

  ordenadas.forEach(function(entrada) {
    if (!agrupadas[entrada.familia]) {
      agrupadas[entrada.familia] = [];
      familias.push(entrada.familia);
    }
    agrupadas[entrada.familia].push(entrada);
  });

  return {
    familias: familias,
    agrupadas: agrupadas,
    ordenadas: ordenadas
  };
}

function _B1_motor_construirCandidatoExacto(entrada) {
  return {
    forma: entrada.forma,
    familia: entrada.familia,
    idioma: entrada.idioma,
    costeAbsoluto: 0,
    costeNormalizado: 0
  };
}


/* ═══════════════════════════════════════════════════════════
   FUNCION PRINCIPAL
   ═══════════════════════════════════════════════════════════ */

function B1_motorCosteOCR_filtrar(params) {
  var palabrasOCR = params.palabrasOCR || [];
  var catalogos   = params.catalogos;

  var validas              = [];
  var rotasReconocidas     = [];
  var rechazadasDefinitivas= [];
  var tablaBReconocida     = [];
  var observabilidadMotor  = [];
  var refsTablaB           = [];

  var cache = {};
  var consumidos = {}; // indices consumidos por frases/fusion/tabla B separada

  // ── PASADA PRINCIPAL ──────────────────────────────────────
  for (var i = 0; i < palabrasOCR.length; i++) {
    if (consumidos[i]) continue;

    var pal = palabrasOCR[i];
    var textoOriginal = pal.texto || '';
    var tokenNorm = _B1_motor_normalizar(textoOriginal);

    // ── Vacio ──
    if (!tokenNorm) {
      rechazadasDefinitivas.push({
        tokenOriginal: textoOriginal, tokenNormalizado: '',
        decision: 'rechazada_definitiva', motivoRechazo: 'sin_match'
      });
      observabilidadMotor.push({
        tokenOriginal: textoOriginal, tokenNormalizado: '',
        candidato1: null, candidato2: null, margenUnicidad: null,
        tipoMatch: null, decision: 'rechazada_definitiva',
        motivoRechazo: 'sin_match', candidatosEvaluados: 0, usoCacheLocal: false
      });
      continue;
    }

    // ── Cache ──
    if (cache[tokenNorm]) {
      var cached = cache[tokenNorm];
      // Clonar resultado con datos de posicion actuales
      var clonado = _B1_motor_clonarResultado(cached, pal);
      _B1_motor_colocarResultado(clonado, validas, rotasReconocidas, rechazadasDefinitivas, tablaBReconocida);
      observabilidadMotor.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        candidato1: cached.candidato1 || null, candidato2: cached.candidato2 || null,
        margenUnicidad: cached.margenUnicidad || null, tipoMatch: cached.tipoMatch || null,
        decision: cached.decision, motivoRechazo: cached.motivoRechazo || null,
        candidatosEvaluados: 0, usoCacheLocal: true
      });
      continue;
    }

    // ── PASO 1: ya normalizado ──

    // ── PASO 2: Lookup exacto ──
    var exacto = catalogos.indices.hashExacto[tokenNorm];
    if (exacto && exacto.length > 0) {
      var exactosAgrupados = _B1_motor_agruparExactosPorFamilia(exacto);
      var familiasUnicas = exactosAgrupados.familias;
      var tieneMultifamilia = exactosAgrupados.ordenadas.some(function(entradaExacta) {
        return !!entradaExacta.multifamilia;
      });

      if (familiasUnicas.length === 1 && !tieneMultifamilia) {
        // Una sola familia exacta: valida, con eleccion determinista
        var entrada = exactosAgrupados.agrupadas[familiasUnicas[0]][0];
        var resultado = {
          decision: 'valida', forma: entrada.forma, familia: entrada.familia,
          idioma: entrada.idioma, tipoMatch: 'exacta'
        };
        cache[tokenNorm] = resultado;
        validas.push({
          tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
          forma: entrada.forma, familia: entrada.familia, idioma: entrada.idioma,
          confidence: pal.confidence, pageIndex: pal.pageIndex,
          blockIndex: pal.blockIndex, wordIndex: pal.wordIndex
        });
        observabilidadMotor.push({
          tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
          candidato1: {forma:entrada.forma, familia:entrada.familia, costeAbsoluto:0, costeNormalizado:0},
          candidato2: null, margenUnicidad: null, tipoMatch: 'exacta',
          decision: 'valida', motivoRechazo: null, candidatosEvaluados: 1, usoCacheLocal: false
        });
      } else {
        // Multiples familias exactas o forma multifamilia: ambigua para Gemini
        var familiasOrdenadas = familiasUnicas.slice().sort();
        var ent1 = exactosAgrupados.agrupadas[familiasOrdenadas[0]][0];
        var ent2 = familiasOrdenadas.length > 1
          ? exactosAgrupados.agrupadas[familiasOrdenadas[1]][0]
          : null;
        var cand1Ex = _B1_motor_construirCandidatoExacto(ent1);
        var cand2Ex = ent2 ? _B1_motor_construirCandidatoExacto(ent2) : null;
        var resAmbEx = {
          decision: 'rota_reconocida', tipoMatch: 'ambigua_para_gemini',
          candidato1: cand1Ex, candidato2: cand2Ex, margenUnicidad: 0
        };
        cache[tokenNorm] = resAmbEx;
        rotasReconocidas.push({
          tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
          candidato1: cand1Ex, candidato2: cand2Ex,
          margenUnicidad: 0, tipoMatch: 'ambigua_para_gemini',
          decision: 'rota_reconocida', confidence: pal.confidence,
          boundingPoly: pal.boundingPoly, pageIndex: pal.pageIndex,
          blockIndex: pal.blockIndex, wordIndex: pal.wordIndex, bloque: pal.bloque
        });
        observabilidadMotor.push({
          tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
          candidato1: cand1Ex, candidato2: cand2Ex,
          margenUnicidad: 0, tipoMatch: 'ambigua_para_gemini',
          decision: 'rota_reconocida', motivoRechazo: null,
          candidatosEvaluados: exacto.length, usoCacheLocal: false,
          familiasExactas: familiasOrdenadas
        });
      }
      continue;
    }

    // ── PASO 3: Tabla B ──
    var sigTexto = (i + 1 < palabrasOCR.length) ? palabrasOCR[i + 1].texto : null;
    var sigNorm  = (i + 1 < palabrasOCR.length) ? _B1_motor_normalizar(palabrasOCR[i + 1].texto) : '';
    var tablaB = _B1_motor_detectarTablaB(tokenNorm, sigNorm, textoOriginal, sigTexto, catalogos);
    if (tablaB.detectado) {
      var itemTablaB = {
        tokenOriginal: tablaB.tokenConsumidoOriginal,
        tokenNormalizado: tablaB.tokenConsumidoNormalizado,
        patronDetectado: tablaB.patron,
        decision: 'tabla_b_reconocida',
        unidad: tablaB.unidad,
        grupoUnidad: tablaB.grupoUnidad,
        valorEstandar: tablaB.valorEstandar,
        totalEstandar: tablaB.totalEstandar,
        cantidadPack: tablaB.cantidadPack,
        ordenDeteccion: tablaBReconocida.length,
        esPesoVolumenReal: false,
        esPesoVolumenRealGrupo: false,
        motivoSeleccion: null
      };
      var obsTablaB = {
        tokenOriginal: tablaB.tokenConsumidoOriginal, tokenNormalizado: tablaB.tokenConsumidoNormalizado,
        candidato1: null, candidato2: null, margenUnicidad: null,
        tipoMatch: null, decision: 'tabla_b_reconocida',
        motivoRechazo: null, candidatosEvaluados: 0, usoCacheLocal: false,
        detalleTablaB: {
          patronDetectado: tablaB.patron,
          unidad: tablaB.unidad,
          valorEstandar: tablaB.valorEstandar,
          totalEstandar: tablaB.totalEstandar,
          cantidadPack: tablaB.cantidadPack,
          esPesoVolumenReal: false,
          esPesoVolumenRealGrupo: false
        }
      };
      tablaBReconocida.push(itemTablaB);
      observabilidadMotor.push(obsTablaB);
      refsTablaB.push({ item: itemTablaB, obs: obsTablaB });
      if (tablaB.consumeSiguiente) { consumidos[i + 1] = true; }
      continue;
    }

    // ── PASO 3b: Frases multitoken ──
    var frase = _B1_motor_detectarFrase(i, palabrasOCR, catalogos);
    if (frase) {
      validas.push({
        tokenOriginal: textoOriginal, tokenNormalizado: frase.frase.forma,
        forma: frase.frase.forma, familia: frase.frase.familia, idioma: frase.frase.idioma,
        confidence: pal.confidence, pageIndex: pal.pageIndex,
        blockIndex: pal.blockIndex, wordIndex: pal.wordIndex
      });
      observabilidadMotor.push({
        tokenOriginal: textoOriginal, tokenNormalizado: frase.frase.forma,
        candidato1: {forma:frase.frase.forma, familia:frase.frase.familia, costeAbsoluto:0, costeNormalizado:0},
        candidato2: null, margenUnicidad: null, tipoMatch: 'frase_exacta',
        decision: 'valida', motivoRechazo: null, candidatosEvaluados: 1, usoCacheLocal: false
      });
      for (var fc = 1; fc < frase.tokensConsumidos; fc++) { consumidos[i + fc] = true; }
      continue;
    }

    // ── PASO 3c: Fusion de 2 tokens consecutivos ──
    var fusion = _B1_motor_intentarFusion(i, palabrasOCR, catalogos);
    if (fusion) {
      var fe = fusion.forma;
      validas.push({
        tokenOriginal: textoOriginal + ' ' + palabrasOCR[i+1].texto,
        tokenNormalizado: fe.forma, forma: fe.forma, familia: fe.familia,
        idioma: fe.idioma, confidence: pal.confidence,
        pageIndex: pal.pageIndex, blockIndex: pal.blockIndex, wordIndex: pal.wordIndex
      });
      consumidos[i + 1] = true;
      continue;
    }

    // ── PASO 4: Longitud minima ──
    var soloLetras = _B1_motor_soloLetras(tokenNorm);
    if (soloLetras.length < 3) {
      var resCorto = {
        decision: 'rechazada_definitiva', motivoRechazo: 'longitud_insuficiente'
      };
      cache[tokenNorm] = resCorto;
      rechazadasDefinitivas.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        decision: 'rechazada_definitiva', motivoRechazo: 'longitud_insuficiente'
      });
      observabilidadMotor.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        candidato1: null, candidato2: null, margenUnicidad: null,
        tipoMatch: null, decision: 'rechazada_definitiva',
        motivoRechazo: 'longitud_insuficiente', candidatosEvaluados: 0, usoCacheLocal: false
      });
      continue;
    }

    // ── PASO 5: Blacklist ──
    if (catalogos.blacklist.exactas.has(tokenNorm)) {
      var resBL = {
        decision: 'rechazada_definitiva', motivoRechazo: 'blacklist'
      };
      cache[tokenNorm] = resBL;
      rechazadasDefinitivas.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        decision: 'rechazada_definitiva', motivoRechazo: 'blacklist'
      });
      observabilidadMotor.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        candidato1: null, candidato2: null, margenUnicidad: null,
        tipoMatch: null, decision: 'rechazada_definitiva',
        motivoRechazo: 'blacklist', candidatosEvaluados: 0, usoCacheLocal: false
      });
      continue;
    }

    // ── PASO 6-9: Comparar contra todo tablaA.palabras ──
    var mejor1 = null; // {entrada, costeAbs, costeNorm}
    var mejor2 = null;
    var totalEvaluados = 0;

    var palabrasLexico = catalogos.tablaA.palabras;
    for (var k = 0; k < palabrasLexico.length; k++) {
      var candidato = palabrasLexico[k];
      var umbralMax = _B1_motor_umbral(candidato.len);
      var maxCosteAbs = Math.ceil(umbralMax * Math.max(tokenNorm.length, candidato.len));

      var dist = _B1_motor_distanciaPonderada(tokenNorm, candidato.forma, maxCosteAbs);
      totalEvaluados++;

      if (dist.coste >= _B1_MOTOR_COSTE_INFINITO) continue;
      if (dist.prohibida) continue;

      var costeNorm = dist.coste / Math.max(tokenNorm.length, candidato.len);
      if (costeNorm >= umbralMax) continue;

      var entry = { entrada: candidato, costeAbs: dist.coste, costeNorm: costeNorm };

      if (!mejor1 || costeNorm < mejor1.costeNorm) {
        mejor2 = mejor1;
        mejor1 = entry;
      } else if (!mejor2 || costeNorm < mejor2.costeNorm) {
        mejor2 = entry;
      }
    }

    // ── PASO 3d: Particion de token largo (si no hubo match) ──
    if (!mejor1) {
      var part = _B1_motor_intentarParticion(tokenNorm, catalogos);
      if (part) {
        validas.push({
          tokenOriginal: textoOriginal, tokenNormalizado: part.parte1.forma,
          forma: part.parte1.forma, familia: part.parte1.familia, idioma: part.parte1.idioma,
          confidence: pal.confidence, pageIndex: pal.pageIndex,
          blockIndex: pal.blockIndex, wordIndex: pal.wordIndex
        });
        validas.push({
          tokenOriginal: textoOriginal, tokenNormalizado: part.parte2.forma,
          forma: part.parte2.forma, familia: part.parte2.familia, idioma: part.parte2.idioma,
          confidence: pal.confidence, pageIndex: pal.pageIndex,
          blockIndex: pal.blockIndex, wordIndex: pal.wordIndex
        });
        observabilidadMotor.push({
          tokenOriginal: textoOriginal, tokenNormalizado: part.parte1.forma + ' ' + part.parte2.forma,
          candidato1: {forma:part.parte1.forma, familia:part.parte1.familia, costeAbsoluto:0, costeNormalizado:0},
          candidato2: {forma:part.parte2.forma, familia:part.parte2.familia, costeAbsoluto:0, costeNormalizado:0},
          margenUnicidad: null, tipoMatch: 'particion_doble_exacta',
          decision: 'valida', motivoRechazo: null, candidatosEvaluados: 2, usoCacheLocal: false
        });
        continue;
      }
    }

    // Sin candidato valido
    if (!mejor1) {
      var resSM = {
        decision: 'rechazada_definitiva', motivoRechazo: 'sin_match'
      };
      cache[tokenNorm] = resSM;
      rechazadasDefinitivas.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        decision: 'rechazada_definitiva', motivoRechazo: 'sin_match'
      });
      observabilidadMotor.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        candidato1: null, candidato2: null, margenUnicidad: null,
        tipoMatch: null, decision: 'rechazada_definitiva',
        motivoRechazo: 'sin_match', candidatosEvaluados: totalEvaluados, usoCacheLocal: false
      });
      continue;
    }

    // ── Decision por familia ──
    var cand1 = {
      forma: mejor1.entrada.forma, familia: mejor1.entrada.familia,
      idioma: mejor1.entrada.idioma,
      costeAbsoluto: mejor1.costeAbs, costeNormalizado: mejor1.costeNorm
    };
    var cand2 = mejor2 ? {
      forma: mejor2.entrada.forma, familia: mejor2.entrada.familia,
      idioma: mejor2.entrada.idioma,
      costeAbsoluto: mejor2.costeAbs, costeNormalizado: mejor2.costeNorm
    } : null;

    var margenUnicidad = (cand2) ? (cand2.costeNormalizado - cand1.costeNormalizado) : null;
    var tipoMatch = 'unica';

    // Multifamilia
    if (mejor1.entrada.multifamilia) {
      tipoMatch = 'ambigua_para_gemini';
    }
    // Dos familias distintas con margen insuficiente
    else if (cand2 && cand1.familia !== cand2.familia && margenUnicidad < 0.15) {
      tipoMatch = 'ambigua_para_gemini';
    }

    var resMotor = {
      decision: 'rota_reconocida', tipoMatch: tipoMatch,
      candidato1: cand1, candidato2: cand2, margenUnicidad: margenUnicidad
    };
    cache[tokenNorm] = resMotor;

    rotasReconocidas.push({
      tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
      candidato1: cand1, candidato2: cand2,
      margenUnicidad: margenUnicidad,
      tipoMatch: tipoMatch, decision: 'rota_reconocida',
      confidence: pal.confidence, boundingPoly: pal.boundingPoly,
      pageIndex: pal.pageIndex, blockIndex: pal.blockIndex,
      wordIndex: pal.wordIndex, bloque: pal.bloque
    });

    observabilidadMotor.push({
      tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
      candidato1: cand1, candidato2: cand2,
      margenUnicidad: margenUnicidad, tipoMatch: tipoMatch,
      decision: 'rota_reconocida', motivoRechazo: null,
      candidatosEvaluados: totalEvaluados, usoCacheLocal: false
    });
  }

  var pesoVolumenReal = _B1_motor_resolverPesoVolumenReal(tablaBReconocida);
  for (var tb = 0; tb < refsTablaB.length; tb++) {
    refsTablaB[tb].obs.detalleTablaB.esPesoVolumenReal = refsTablaB[tb].item.esPesoVolumenReal;
    refsTablaB[tb].obs.detalleTablaB.esPesoVolumenRealGrupo = refsTablaB[tb].item.esPesoVolumenRealGrupo;
    refsTablaB[tb].obs.detalleTablaB.motivoSeleccion = refsTablaB[tb].item.motivoSeleccion;
  }

  return {
    validas:               validas,
    rotasReconocidas:      rotasReconocidas,
    rechazadasDefinitivas: rechazadasDefinitivas,
    tablaBReconocida:      tablaBReconocida,
    observabilidadMotor:   observabilidadMotor
  };
}


/* ═══════════════════════════════════════════════════════════
   HELPERS INTERNOS
   ═══════════════════════════════════════════════════════════ */

function _B1_motor_clonarResultado(cached, pal) {
  return {
    decision: cached.decision,
    forma: cached.forma || null,
    familia: cached.familia || null,
    idioma: cached.idioma || null,
    tipoMatch: cached.tipoMatch || null,
    candidato1: cached.candidato1 || null,
    candidato2: cached.candidato2 || null,
    margenUnicidad: cached.margenUnicidad || null,
    motivoRechazo: cached.motivoRechazo || null,
    tokenOriginal: pal.texto,
    tokenNormalizado: _B1_motor_normalizar(pal.texto),
    confidence: pal.confidence,
    boundingPoly: pal.boundingPoly,
    pageIndex: pal.pageIndex,
    blockIndex: pal.blockIndex,
    wordIndex: pal.wordIndex,
    bloque: pal.bloque,
    patronDetectado: cached.patronDetectado || null
  };
}

function _B1_motor_colocarResultado(res, validas, rotasReconocidas, rechazadasDefinitivas, tablaBReconocida) {
  if (res.decision === 'valida') {
    validas.push({
      tokenOriginal: res.tokenOriginal, tokenNormalizado: res.tokenNormalizado,
      forma: res.forma, familia: res.familia, idioma: res.idioma,
      confidence: res.confidence, pageIndex: res.pageIndex,
      blockIndex: res.blockIndex, wordIndex: res.wordIndex
    });
  } else if (res.decision === 'rota_reconocida') {
    rotasReconocidas.push({
      tokenOriginal: res.tokenOriginal, tokenNormalizado: res.tokenNormalizado,
      candidato1: res.candidato1, candidato2: res.candidato2,
      margenUnicidad: res.margenUnicidad, tipoMatch: res.tipoMatch,
      decision: 'rota_reconocida', confidence: res.confidence,
      boundingPoly: res.boundingPoly, pageIndex: res.pageIndex,
      blockIndex: res.blockIndex, wordIndex: res.wordIndex, bloque: res.bloque
    });
  } else if (res.decision === 'rechazada_definitiva') {
    rechazadasDefinitivas.push({
      tokenOriginal: res.tokenOriginal, tokenNormalizado: res.tokenNormalizado,
      decision: 'rechazada_definitiva', motivoRechazo: res.motivoRechazo
    });
  } else if (res.decision === 'tabla_b_reconocida') {
    tablaBReconocida.push({
      tokenOriginal: res.tokenOriginal, tokenNormalizado: res.tokenNormalizado,
      patronDetectado: res.patronDetectado, decision: 'tabla_b_reconocida'
    });
  }
}
