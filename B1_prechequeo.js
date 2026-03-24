/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 2 · PRECHEQUEO DE IMAGEN
 * ═══════════════════════════════════════════════════════════════
 */

async function B1_redimensionarImagen(imageSrc) {
  let bitmap;

  if (typeof ImageBitmap !== 'undefined' && imageSrc instanceof ImageBitmap) {
    bitmap = imageSrc;
  } else if (typeof HTMLImageElement !== 'undefined' && imageSrc instanceof HTMLImageElement) {
    bitmap = await createImageBitmap(imageSrc);
  } else if (imageSrc instanceof Blob) {
    bitmap = await createImageBitmap(imageSrc);
  } else if (typeof imageSrc === 'string' && imageSrc.trim()) {
    const blob = await (await fetch(imageSrc)).blob();
    bitmap = await createImageBitmap(blob);
  } else {
    throw new Error('Tipo de imageRef no soportado. Usa Blob, HTMLImageElement, ImageBitmap o string URL/dataURL.');
  }

  const maxSide = B1_CONFIG.MAX_IMAGE_SIDE_PX;
  let w = bitmap.width;
  let h = bitmap.height;

  if (Math.max(w, h) > maxSide) {
    const ratio = maxSide / Math.max(w, h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);

  return { canvas, width: w, height: h };
}

function B1_chequeoRapido(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const totalPixels = w * h;

  const problemas = [];
  const metricas = {};

  metricas.focusScore = _calcularNitidez(data, w, h);
  if (metricas.focusScore < 15) problemas.push('desenfoque_severo');

  metricas.reflectionScore = _calcularReflejo(data, totalPixels);
  if (metricas.reflectionScore > 0.25) problemas.push('reflejo_severo');

  metricas.brightness = _calcularBrillo(data, totalPixels);
  if (metricas.brightness < 30) problemas.push('imagen_muy_oscura');
  else if (metricas.brightness > 240) problemas.push('imagen_muy_clara');

  metricas.textAreaRatio = _estimarAreaTexto(data, w, h);
  if (metricas.textAreaRatio < 0.05) problemas.push('sin_texto_visible');

  metricas.borderUniformity = _detectarRecorteRoto(data, w, h);
  if (metricas.borderUniformity > 0.85) problemas.push('recorte_roto');

  const graves = problemas.filter(p => ['desenfoque_severo', 'reflejo_severo', 'sin_texto_visible'].includes(p));
  return { viable: graves.length < 2, problemas, metricas };
}

function _calcularNitidez(data, w, h) {
  let sum = 0;
  let count = 0;
  const stride = 4;
  for (let y = 1; y < h - 1; y += 3) {
    for (let x = 1; x < w - 1; x += 3) {
      const idx = (y * w + x) * stride;
      const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const top = ((y - 1) * w + x) * stride;
      const bottom = ((y + 1) * w + x) * stride;
      const left = (y * w + (x - 1)) * stride;
      const right = (y * w + (x + 1)) * stride;
      const gTop = data[top] * 0.299 + data[top + 1] * 0.587 + data[top + 2] * 0.114;
      const gBottom = data[bottom] * 0.299 + data[bottom + 1] * 0.587 + data[bottom + 2] * 0.114;
      const gLeft = data[left] * 0.299 + data[left + 1] * 0.587 + data[left + 2] * 0.114;
      const gRight = data[right] * 0.299 + data[right + 1] * 0.587 + data[right + 2] * 0.114;
      sum += Math.abs(gTop + gBottom + gLeft + gRight - 4 * gray);
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

function _calcularReflejo(data, totalPixels) {
  let blancos = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250) blancos++;
  }
  return blancos / totalPixels;
}

function _calcularBrillo(data, totalPixels) {
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  return sum / totalPixels;
}

function _estimarAreaTexto(data, w, h) {
  const blockSize = 16;
  let bloquesCon = 0;
  let bloquesTotal = 0;
  for (let by = 0; by < h - blockSize; by += blockSize) {
    for (let bx = 0; bx < w - blockSize; bx += blockSize) {
      let sum = 0, sumSq = 0, n = 0;
      for (let y = by; y < by + blockSize; y += 2) {
        for (let x = bx; x < bx + blockSize; x += 2) {
          const idx = (y * w + x) * 4;
          const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
          sum += gray;
          sumSq += gray * gray;
          n++;
        }
      }
      const mean = sum / n;
      const variance = (sumSq / n) - (mean * mean);
      if (variance > 200) bloquesCon++;
      bloquesTotal++;
    }
  }
  return bloquesTotal > 0 ? bloquesCon / bloquesTotal : 0;
}

function _detectarRecorteRoto(data, w, h) {
  const sampleBorder = (pixels) => {
    if (pixels.length < 2) return 0;
    const first = pixels[0];
    let iguales = 0;
    for (let i = 1; i < pixels.length; i++) {
      if (Math.abs(pixels[i] - first) < 10) iguales++;
    }
    return iguales / (pixels.length - 1);
  };

  const topRow = [];
  const bottomRow = [];
  const leftCol = [];
  const rightCol = [];
  for (let x = 0; x < w; x += 4) {
    const tIdx = x * 4;
    const bIdx = ((h - 1) * w + x) * 4;
    topRow.push(data[tIdx] * 0.299 + data[tIdx + 1] * 0.587 + data[tIdx + 2] * 0.114);
    bottomRow.push(data[bIdx] * 0.299 + data[bIdx + 1] * 0.587 + data[bIdx + 2] * 0.114);
  }
  for (let y = 0; y < h; y += 4) {
    const lIdx = (y * w) * 4;
    const rIdx = (y * w + (w - 1)) * 4;
    leftCol.push(data[lIdx] * 0.299 + data[lIdx + 1] * 0.587 + data[lIdx + 2] * 0.114);
    rightCol.push(data[rIdx] * 0.299 + data[rIdx + 1] * 0.587 + data[rIdx + 2] * 0.114);
  }
  return [sampleBorder(topRow), sampleBorder(bottomRow), sampleBorder(leftCol), sampleBorder(rightCol)]
    .reduce((a, b) => a + b, 0) / 4;
}

async function B1_prechequeo(imageSrc, cronometro) {
  try {
    const { canvas, width, height } = await B1_redimensionarImagen(imageSrc);
    if (cronometro.expired()) {
      return {
        ok: false,
        canvas: null,
        width,
        height,
        problemas: ['presupuesto_agotado_en_prechequeo'],
        metricasImagen: {},
        abortReason: 'Tiempo agotado durante redimensionado.'
      };
    }

    const chequeo = B1_chequeoRapido(canvas);
    if (!chequeo.viable) {
      return {
        ok: false,
        canvas: null,
        width,
        height,
        problemas: chequeo.problemas,
        metricasImagen: chequeo.metricas,
        abortReason: `Foto imposible de procesar: ${chequeo.problemas.join(', ')}.`
      };
    }

    return {
      ok: true,
      canvas,
      width,
      height,
      problemas: chequeo.problemas,
      metricasImagen: chequeo.metricas,
      abortReason: null
    };
  } catch (err) {
    return {
      ok: false,
      canvas: null,
      width: 0,
      height: 0,
      problemas: ['error_interno_prechequeo'],
      metricasImagen: {},
      abortReason: `Error en prechequeo: ${err.message}`
    };
  }
}
