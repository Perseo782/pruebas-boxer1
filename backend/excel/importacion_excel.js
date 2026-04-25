(function initImportacionExcelModule(globalScope) {
  "use strict";

  var allergenCatalog = null;
  var altaManualApi = null;
  var sheetJsApi = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      allergenCatalog = require("../../../shared/alergenos_oficiales.js");
    } catch (errCatalog) {
      allergenCatalog = null;
    }
    try {
      altaManualApi = require("../../../FASE 3/PROGRAMACION DE LA FASE 3/backend/operativa/alta_manual.js");
    } catch (errAltaManual) {
      altaManualApi = null;
    }
    try {
      sheetJsApi = require("xlsx");
    } catch (errSheetJs) {
      sheetJsApi = null;
    }
  }
  if (!allergenCatalog && globalScope && globalScope.AppV2AlergenosOficiales) {
    allergenCatalog = globalScope.AppV2AlergenosOficiales;
  }
  if (!altaManualApi && globalScope && globalScope.Fase3OperativaAltaManual) {
    altaManualApi = globalScope.Fase3OperativaAltaManual;
  }
  if (!sheetJsApi && globalScope && globalScope.XLSX) {
    sheetJsApi = globalScope.XLSX;
  }

  var MODULE_NAME = "Fase10_Importacion_Excel";
  var MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
  var MAX_ROWS = 2000;
  var MAX_VISIBLE_SHEETS = 5;
  var DEFAULT_BLOCK_SIZE = 50;
  var HEADER_SCAN_LIMIT = 25;
  var POSITIVE_VALUES = Object.freeze([
    "x", "si", "sí", "1", "true", "verdadero", "presente", "contiene", "contains"
  ]);
  var NEGATIVE_VALUES = Object.freeze([
    "", "no", "0", "false", "falso", "-", "ausente", "vacio", "vacío"
  ]);
  var PRODUCT_HEADER_ALIASES = Object.freeze([
    "producto", "productos", "nombre", "nombre producto", "descripcion", "descripción", "articulo", "artículo", "item"
  ]);
  var FORMAT_HEADER_ALIASES = Object.freeze([
    "formato", "peso", "peso neto", "contenido neto", "volumen", "capacidad", "tamano", "tamaño",
    "cantidad", "unidad", "unidades", "medida", "pack", "envase"
  ]);
  var EXTRA_ALLERGEN_ALIASES = Object.freeze({
    gluten: ["gluten", "trigo", "cereales", "cereal", "harina de trigo"],
    lacteos: ["lacteos", "lácteos", "lacteo", "lácteo", "leche"],
    altramuces: ["altramuces", "altramuz"],
    sesamo: ["sesamo", "sésamo"],
    frutos_secos: ["frutos secos", "frutos_secos", "frutos de cascara", "fruto de cascara", "nueces"],
    crustaceos: ["crustaceos", "crustáceos", "crustaceo", "crustáceo"]
  });

  function elapsedSince(startMs) {
    return Math.max(0, Date.now() - startMs);
  }

  function buildError(startMs, code, message, action, tipoFallo, retryable, extra) {
    var safeExtra = extra && typeof extra === "object" ? extra : {};
    return {
      ok: false,
      resultado: {
        estadoPasaporteModulo: "ROJO",
        modulo: MODULE_NAME,
        accionSugeridaParaCerebro: action || "bloquear_guardado",
        elapsedMs: elapsedSince(startMs),
        traceId: String(safeExtra.traceId || "").trim() || null,
        datos: safeExtra.datos || {}
      },
      error: {
        code: code,
        origin: MODULE_NAME,
        passport: "ROJO",
        message: message,
        retryable: !!retryable,
        tipoFallo: tipoFallo || "irrecuperable_por_diseno",
        motivo: safeExtra.motivo || null
      }
    };
  }

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

  function normalizeHeader(value) {
    return normalizeText(value);
  }

  function normalizeAllergenList(input) {
    if (allergenCatalog && typeof allergenCatalog.normalizeAllergenList === "function") {
      return allergenCatalog.normalizeAllergenList(input);
    }
    var safeInput = Array.isArray(input) ? input : [];
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < safeInput.length; i += 1) {
      var item = normalizeText(safeInput[i]);
      if (!item || seen[item]) continue;
      seen[item] = true;
      out.push(item);
    }
    return out.sort();
  }

  function canonicalizeAllergen(value) {
    var safe = normalizeText(value);
    if (!safe) return null;
    if (allergenCatalog && typeof allergenCatalog.canonicalizeAllergen === "function") {
      var byCore = allergenCatalog.canonicalizeAllergen(safe);
      if (byCore) return byCore;
    }
    var families = Object.keys(EXTRA_ALLERGEN_ALIASES);
    for (var i = 0; i < families.length; i += 1) {
      var family = families[i];
      var aliases = EXTRA_ALLERGEN_ALIASES[family] || [];
      for (var j = 0; j < aliases.length; j += 1) {
        if (normalizeText(aliases[j]) === safe) return family;
      }
    }
    return null;
  }

  function xmlUnescape(value) {
    return String(value || "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }

  function decodeCellText(value) {
    return xmlUnescape(String(value || ""))
      .replace(/\r/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function concatBytes(chunks) {
    var total = 0;
    var i;
    for (i = 0; i < chunks.length; i += 1) {
      total += chunks[i] ? chunks[i].length : 0;
    }
    var out = new Uint8Array(total);
    var offset = 0;
    for (i = 0; i < chunks.length; i += 1) {
      var chunk = chunks[i];
      if (!chunk || !chunk.length) continue;
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }

  function utf8Decode(bytes) {
    if (typeof TextDecoder !== "undefined") {
      return new TextDecoder("utf-8").decode(bytes);
    }
    if (typeof Buffer !== "undefined") {
      return Buffer.from(bytes).toString("utf8");
    }
    var out = "";
    for (var i = 0; i < bytes.length; i += 1) {
      out += String.fromCharCode(bytes[i]);
    }
    try {
      return decodeURIComponent(escape(out));
    } catch (err) {
      return out;
    }
  }

  function readUint16LE(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8);
  }

  function readUint32LE(bytes, offset) {
    return (bytes[offset]) |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24 >>> 0);
  }

  function findEndOfCentralDirectory(bytes) {
    var min = Math.max(0, bytes.length - 65557);
    for (var i = bytes.length - 22; i >= min; i -= 1) {
      if (
        bytes[i] === 0x50 &&
        bytes[i + 1] === 0x4b &&
        bytes[i + 2] === 0x05 &&
        bytes[i + 3] === 0x06
      ) {
        return i;
      }
    }
    return -1;
  }

  async function inflateRaw(bytes) {
    if (typeof Buffer !== "undefined" && typeof require === "function") {
      var zlib = require("zlib");
      return Uint8Array.from(zlib.inflateRawSync(Buffer.from(bytes)));
    }
    if (typeof DecompressionStream !== "undefined") {
      var ds = new DecompressionStream("deflate-raw");
      var blob = new Blob([bytes]);
      var stream = blob.stream().pipeThrough(ds);
      var response = new Response(stream);
      return new Uint8Array(await response.arrayBuffer());
    }
    throw new Error("No hay soporte de descompresion disponible.");
  }

  async function unzipEntries(bytes) {
    var eocdOffset = findEndOfCentralDirectory(bytes);
    if (eocdOffset < 0) {
      throw new Error("Archivo Excel no valido.");
    }
    var centralDirectorySize = readUint32LE(bytes, eocdOffset + 12);
    var centralDirectoryOffset = readUint32LE(bytes, eocdOffset + 16);
    var cursorEnd = centralDirectoryOffset + centralDirectorySize;
    var cursor = centralDirectoryOffset;
    var out = Object.create(null);

    while (cursor < cursorEnd) {
      if (
        bytes[cursor] !== 0x50 ||
        bytes[cursor + 1] !== 0x4b ||
        bytes[cursor + 2] !== 0x01 ||
        bytes[cursor + 3] !== 0x02
      ) {
        break;
      }
      var compressionMethod = readUint16LE(bytes, cursor + 10);
      var compressedSize = readUint32LE(bytes, cursor + 20);
      var fileNameLength = readUint16LE(bytes, cursor + 28);
      var extraLength = readUint16LE(bytes, cursor + 30);
      var commentLength = readUint16LE(bytes, cursor + 32);
      var localHeaderOffset = readUint32LE(bytes, cursor + 42);
      var fileName = utf8Decode(bytes.slice(cursor + 46, cursor + 46 + fileNameLength));

      var localNameLength = readUint16LE(bytes, localHeaderOffset + 26);
      var localExtraLength = readUint16LE(bytes, localHeaderOffset + 28);
      var dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      var rawData = bytes.slice(dataStart, dataStart + compressedSize);
      var fileBytes;
      if (compressionMethod === 0) {
        fileBytes = rawData;
      } else if (compressionMethod === 8) {
        fileBytes = await inflateRaw(rawData);
      } else {
        throw new Error("Compresion Excel no permitida.");
      }
      out[fileName.replace(/\\/g, "/")] = fileBytes;
      cursor += 46 + fileNameLength + extraLength + commentLength;
    }

    return out;
  }

  function parseWorkbookSheetTargets(workbookXml, workbookRelsXml) {
    var rels = Object.create(null);
    workbookRelsXml.replace(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/>/g, function each(_, id, target) {
      rels[id] = String(target || "");
      return _;
    });
    var sheets = [];
    workbookXml.replace(/<sheet\b([^>]*)\/>/g, function each(_, attrText) {
      var nameMatch = /name="([^"]*)"/.exec(attrText);
      var relIdMatch = /r:id="([^"]+)"/.exec(attrText);
      var stateMatch = /state="([^"]+)"/.exec(attrText);
      var name = nameMatch ? nameMatch[1] : "";
      var relId = relIdMatch ? relIdMatch[1] : "";
      var target = rels[relId];
      if (!target) return _;
      var normalizedTarget = target.indexOf("xl/") === 0 ? target : "xl/" + target.replace(/^\.\.\//, "");
      normalizedTarget = normalizedTarget.replace("xl//", "xl/");
      sheets.push({
        name: decodeCellText(name),
        path: normalizedTarget,
        hidden: String(stateMatch ? stateMatch[1] : "").toLowerCase() === "hidden"
      });
      return _;
    });
    return sheets;
  }

  function parseSharedStrings(sharedStringsXml) {
    var values = [];
    if (!sharedStringsXml) return values;
    sharedStringsXml.replace(/<si\b[^>]*>([\s\S]*?)<\/si>/g, function each(_, content) {
      var parts = [];
      content.replace(/<t\b[^>]*>([\s\S]*?)<\/t>/g, function eachText(__, value) {
        parts.push(xmlUnescape(value));
        return __;
      });
      values.push(decodeCellText(parts.join("")));
      return _;
    });
    return values;
  }

  function columnIndexFromRef(ref) {
    var letters = String(ref || "").replace(/[^A-Z]/gi, "").toUpperCase();
    if (!letters) return -1;
    var out = 0;
    for (var i = 0; i < letters.length; i += 1) {
      out = out * 26 + (letters.charCodeAt(i) - 64);
    }
    return out - 1;
  }

  function parseHiddenColumnIndexes(sheetXml) {
    var hidden = Object.create(null);
    sheetXml.replace(/<col\b([^>]*)\/>/g, function each(_, attrText) {
      var hiddenMatch = /hidden="([^"]+)"/.exec(attrText);
      if (!hiddenMatch || hiddenMatch[1] !== "1") return _;
      var minMatch = /min="(\d+)"/.exec(attrText);
      var maxMatch = /max="(\d+)"/.exec(attrText);
      var min = minMatch ? Number(minMatch[1]) : 1;
      var max = maxMatch ? Number(maxMatch[1]) : min;
      for (var i = min; i <= max; i += 1) {
        hidden[i - 1] = true;
      }
      return _;
    });
    return hidden;
  }

  function parseSheetRows(sheetXml, sharedStrings) {
    var safeSharedStrings = Array.isArray(sharedStrings) ? sharedStrings : [];
    var hiddenColumns = parseHiddenColumnIndexes(sheetXml);
    var rows = [];
    sheetXml.replace(/<row\b([^>]*)>([\s\S]*?)<\/row>/g, function eachRow(_, rowAttrText, rowContent) {
      var rowNumberMatch = /r="(\d+)"/.exec(rowAttrText);
      var rowHiddenMatch = /hidden="([^"]+)"/.exec(rowAttrText);
      if (!rowNumberMatch || (rowHiddenMatch && rowHiddenMatch[1] === "1")) return _;
      var rowNumber = rowNumberMatch[1];
      var cells = [];
      rowContent.replace(/<c\b([^>]*)>([\s\S]*?)<\/c>/g, function eachCell(__, attrText, cellContent) {
        var refMatch = /r="([^"]+)"/.exec(attrText);
        var typeMatch = /t="([^"]+)"/.exec(attrText);
        var ref = refMatch ? refMatch[1] : "";
        var type = typeMatch ? typeMatch[1] : "";
        var value = "";
        if (type === "inlineStr") {
          var parts = [];
          cellContent.replace(/<t\b[^>]*>([\s\S]*?)<\/t>/g, function eachText(___, inner) {
            parts.push(xmlUnescape(inner));
            return ___;
          });
          value = decodeCellText(parts.join(""));
        } else {
          var rawValueMatch = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(cellContent);
          var rawValue = rawValueMatch ? decodeCellText(rawValueMatch[1]) : "";
          if (type === "s") {
            value = safeSharedStrings[Number(rawValue)] || "";
          } else if (type === "b") {
            value = rawValue === "1" ? "TRUE" : "FALSE";
          } else {
            value = rawValue;
          }
        }
        var columnIndex = columnIndexFromRef(ref);
        if (hiddenColumns[columnIndex]) return __;
        cells.push({
          columnIndex: columnIndex,
          value: value
        });
        return __;
      });
      rows.push({
        rowNumber: Number(rowNumber),
        cells: cells
      });
      return _;
    });
    return rows;
  }

  function buildImportAliasMap() {
    var map = Object.create(null);
    if (allergenCatalog && Array.isArray(allergenCatalog.NOMBRES_OFICIALES)) {
      for (var i = 0; i < allergenCatalog.NOMBRES_OFICIALES.length; i += 1) {
        var family = allergenCatalog.NOMBRES_OFICIALES[i];
        map[normalizeText(family)] = family;
        map[normalizeText(family.replace(/_/g, " "))] = family;
      }
    }
    var extraFamilies = Object.keys(EXTRA_ALLERGEN_ALIASES);
    for (var j = 0; j < extraFamilies.length; j += 1) {
      var key = extraFamilies[j];
      var aliases = EXTRA_ALLERGEN_ALIASES[key] || [];
      for (var k = 0; k < aliases.length; k += 1) {
        map[normalizeText(aliases[k])] = key;
      }
    }
    return map;
  }

  var IMPORT_ALIAS_MAP = buildImportAliasMap();

  function detectHeaderRow(rows) {
    var safeRows = Array.isArray(rows) ? rows : [];
    for (var i = 0; i < safeRows.length && i < HEADER_SCAN_LIMIT; i += 1) {
      var row = safeRows[i];
      var productColumn = null;
      var formatColumns = [];
      var formatSeen = Object.create(null);
      var allergenColumns = Object.create(null);
      var ignoredColumns = [];

      for (var j = 0; j < row.cells.length; j += 1) {
        var cell = row.cells[j];
        var header = normalizeHeader(cell.value);
        if (!header) continue;
        if (PRODUCT_HEADER_ALIASES.indexOf(header) >= 0 && productColumn == null) {
          productColumn = cell.columnIndex;
          continue;
        }
        if (FORMAT_HEADER_ALIASES.indexOf(header) >= 0 && !formatSeen[cell.columnIndex]) {
          formatColumns.push(cell.columnIndex);
          formatSeen[cell.columnIndex] = true;
          continue;
        }
        var allergenId = IMPORT_ALIAS_MAP[header] || canonicalizeAllergen(header);
        if (allergenId) {
          allergenColumns[cell.columnIndex] = allergenId;
          continue;
        }
        ignoredColumns.push({
          columnIndex: cell.columnIndex,
          header: decodeCellText(cell.value)
        });
      }

      if (productColumn != null) {
        return {
          rowNumber: row.rowNumber,
          productColumn: productColumn,
          formatColumns: formatColumns,
          allergenColumns: allergenColumns,
          ignoredColumns: ignoredColumns
        };
      }
    }
    return null;
  }

  function getCellValueByColumn(row, columnIndex) {
    if (!row || !Array.isArray(row.cells)) return "";
    for (var i = 0; i < row.cells.length; i += 1) {
      if (row.cells[i].columnIndex === columnIndex) return decodeCellText(row.cells[i].value);
    }
    return "";
  }

  function isPositiveValue(value) {
    return POSITIVE_VALUES.indexOf(normalizeText(value)) >= 0;
  }

  function isNegativeValue(value) {
    return NEGATIVE_VALUES.indexOf(normalizeText(value)) >= 0;
  }

  function combineFormatParts(parts) {
    var safeParts = Array.isArray(parts) ? parts : [];
    var out = [];
    for (var i = 0; i < safeParts.length; i += 1) {
      var part = decodeCellText(safeParts[i]);
      if (!part) continue;
      out.push(part);
    }
    return decodeCellText(out.join(" "));
  }

  function combineNameAndFormat(nombre, formato) {
    var safeName = decodeCellText(nombre);
    var safeFormat = decodeCellText(formato);
    if (!safeFormat) return safeName;
    if (normalizeText(safeName).indexOf(normalizeText(safeFormat)) >= 0) {
      return safeName;
    }
    return decodeCellText(safeName + " " + safeFormat);
  }

  function parseDataRows(rows, headerInfo) {
    var safeRows = Array.isArray(rows) ? rows : [];
    var parsed = [];
    var review = [];
    var trackedRows = 0;

    for (var i = 0; i < safeRows.length; i += 1) {
      var row = safeRows[i];
      if (!row || row.rowNumber <= headerInfo.rowNumber) continue;

      var productName = getCellValueByColumn(row, headerInfo.productColumn);
      var formatName = combineFormatParts((headerInfo.formatColumns || []).map(function each(columnIndex) {
        return getCellValueByColumn(row, columnIndex);
      }));
      var finalName = combineNameAndFormat(productName, formatName);
      if (!normalizeText(finalName)) {
        continue;
      }
      trackedRows += 1;
      if (trackedRows > MAX_ROWS) {
        throw new Error("El archivo supera el limite permitido de filas.");
      }

      var allergens = [];
      var ambiguous = false;
      var columns = Object.keys(headerInfo.allergenColumns);
      for (var j = 0; j < columns.length; j += 1) {
        var columnIndex = Number(columns[j]);
        var allergenId = headerInfo.allergenColumns[columns[j]];
        var rawValue = getCellValueByColumn(row, columnIndex);
        if (isNegativeValue(rawValue)) continue;
        if (isPositiveValue(rawValue)) {
          allergens.push(allergenId);
          continue;
        }
        ambiguous = true;
      }

      if (ambiguous) {
        review.push({
          rowNumber: row.rowNumber,
          nombre: finalName,
          alergenos: normalizeAllergenList(allergens),
          motivo: "Hay celdas de alergenos que no se entienden con seguridad."
        });
        continue;
      }

      parsed.push({
        rowNumber: row.rowNumber,
        nombre: finalName,
        alergenos: normalizeAllergenList(allergens)
      });
    }

    return {
      rows: parsed,
      review: review
    };
  }

  function parseRowsFromObjects(objects) {
    var safeObjects = Array.isArray(objects) ? objects : [];
    var rows = [];
    if (!safeObjects.length) return rows;
    var headers = Object.keys(safeObjects[0] || {});
    rows.push({
      rowNumber: 1,
      cells: headers.map(function each(header, index) {
        return { columnIndex: index, value: decodeCellText(header) };
      })
    });
    for (var i = 0; i < safeObjects.length; i += 1) {
      var item = safeObjects[i] || {};
      var cells = [];
      for (var j = 0; j < headers.length; j += 1) {
        cells.push({
          columnIndex: j,
          value: decodeCellText(item[headers[j]])
        });
      }
      rows.push({
        rowNumber: i + 2,
        cells: cells
      });
    }
    return rows;
  }

  function parseWithSheetJs(bytes) {
    if (!sheetJsApi || typeof sheetJsApi.read !== "function" || !sheetJsApi.utils || typeof sheetJsApi.utils.sheet_to_json !== "function") {
      throw new Error("No hay lector Excel disponible para este formato.");
    }
    var workbook = sheetJsApi.read(bytes, {
      type: "array",
      cellFormula: false,
      cellHTML: false,
      cellNF: false,
      cellStyles: false
    });
    var workbookSheetsMeta = workbook && workbook.Workbook && Array.isArray(workbook.Workbook.Sheets)
      ? workbook.Workbook.Sheets
      : [];
    var sheetNames = Array.isArray(workbook && workbook.SheetNames) ? workbook.SheetNames : [];
    var visibleSheetsChecked = 0;
    for (var i = 0; i < sheetNames.length; i += 1) {
      var sheetName = sheetNames[i];
      var sheet = workbook.Sheets ? workbook.Sheets[sheetName] : null;
      var sheetMeta = workbookSheetsMeta[i] || null;
      if (sheetMeta && Number(sheetMeta.Hidden || 0) !== 0) continue;
      if (!sheet) continue;
      visibleSheetsChecked += 1;
      if (visibleSheetsChecked > MAX_VISIBLE_SHEETS) break;
      var arrays = sheetJsApi.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: false,
        blankrows: true
      });
      var hiddenRows = Array.isArray(sheet["!rows"]) ? sheet["!rows"] : [];
      var hiddenCols = Array.isArray(sheet["!cols"]) ? sheet["!cols"] : [];
      var rows = [];
      for (var rowIndex = 0; rowIndex < arrays.length; rowIndex += 1) {
        if (hiddenRows[rowIndex] && hiddenRows[rowIndex].hidden) continue;
        var rawRow = Array.isArray(arrays[rowIndex]) ? arrays[rowIndex] : [];
        var cells = [];
        for (var colIndex = 0; colIndex < rawRow.length; colIndex += 1) {
          if (hiddenCols[colIndex] && hiddenCols[colIndex].hidden) continue;
          cells.push({
            columnIndex: colIndex,
            value: decodeCellText(rawRow[colIndex])
          });
        }
        rows.push({
          rowNumber: rowIndex + 1,
          cells: cells
        });
      }
      var headerInfo = detectHeaderRow(rows);
      if (!headerInfo) continue;
      var parsed = parseDataRows(rows, headerInfo);
      return {
        ok: true,
        sheetName: sheetName,
        headerRowNumber: headerInfo.rowNumber,
        mode: "sumar_fusionar",
        ignoredColumns: headerInfo.ignoredColumns || [],
        rows: parsed.rows,
        review: parsed.review || []
      };
    }
    throw new Error("No se encontro una hoja valida para importar.");
  }

  async function parseXlsxBytes(bytes) {
    var entries = await unzipEntries(bytes);
    var workbookBytes = entries["xl/workbook.xml"];
    var workbookRelsBytes = entries["xl/_rels/workbook.xml.rels"];
    if (!workbookBytes || !workbookRelsBytes) {
      throw new Error("Archivo Excel no valido.");
    }

    var workbookXml = utf8Decode(workbookBytes);
    var workbookRelsXml = utf8Decode(workbookRelsBytes);
    var sharedStrings = entries["xl/sharedStrings.xml"] ? parseSharedStrings(utf8Decode(entries["xl/sharedStrings.xml"])) : [];
    var sheets = parseWorkbookSheetTargets(workbookXml, workbookRelsXml);
    var visibleSheetsChecked = 0;

    for (var i = 0; i < sheets.length; i += 1) {
      var sheet = sheets[i];
      if (sheet.hidden) continue;
      visibleSheetsChecked += 1;
      if (visibleSheetsChecked > MAX_VISIBLE_SHEETS) break;
      var sheetBytes = entries[sheet.path];
      if (!sheetBytes) continue;
      var rows = parseSheetRows(utf8Decode(sheetBytes), sharedStrings);
      var headerInfo = detectHeaderRow(rows);
      if (!headerInfo) continue;
      var parsed = parseDataRows(rows, headerInfo);
      return {
        ok: true,
        sheetName: sheet.name,
        headerRowNumber: headerInfo.rowNumber,
        mode: "sumar_fusionar",
        ignoredColumns: headerInfo.ignoredColumns || [],
        rows: parsed.rows,
        review: parsed.review || []
      };
    }

    throw new Error("No se encontro una hoja valida para importar.");
  }

  async function parseExcelBytes(input) {
    var safeInput = input || {};
    var bytes = safeInput.bytes instanceof Uint8Array ? safeInput.bytes : new Uint8Array(safeInput.bytes || []);
    var extension = normalizeText(String(safeInput.extension || "").replace(/^\./, ""));
    if (extension === "xlsx") {
      return parseXlsxBytes(bytes);
    }
    if (extension === "xls") {
      return parseWithSheetJs(bytes);
    }
    throw new Error("Formato Excel no permitido.");
  }

  function validateFileMeta(fileLike) {
    var startedAt = Date.now();
    var safeFile = fileLike || {};
    var name = String(safeFile.name || "").trim();
    var size = Number(safeFile.size || 0);
    var extension = String(name.split(".").pop() || "").trim().toLowerCase();
    if (!name) {
      return buildError(startedAt, "IMP_ARCHIVO_VACIO", "No se ha recibido ningun archivo.", "pedir_dato_al_usuario", "irrecuperable_por_diseno", false);
    }
    if (size <= 0) {
      return buildError(startedAt, "IMP_ARCHIVO_SIN_DATOS", "El archivo esta vacio.", "pedir_dato_al_usuario", "irrecuperable_por_diseno", false);
    }
    if (size > MAX_FILE_SIZE_BYTES) {
      return buildError(startedAt, "IMP_ARCHIVO_DEMASIADO_GRANDE", "El archivo es demasiado grande.", "pedir_dato_al_usuario", "irrecuperable_por_diseno", false);
    }
    if (extension !== "xlsx" && extension !== "xls") {
      return buildError(startedAt, "IMP_EXTENSION_NO_PERMITIDA", "Solo se admiten archivos Excel validos.", "pedir_dato_al_usuario", "irrecuperable_por_diseno", false);
    }
    return {
      ok: true,
      resultado: {
        estadoPasaporteModulo: "VERDE",
        modulo: MODULE_NAME,
        accionSugeridaParaCerebro: null,
        elapsedMs: elapsedSince(startedAt),
        traceId: null,
        datos: {
          extension: extension,
          size: size,
          name: name
        }
      },
      error: null
    };
  }

  async function validateAndParseExcel(input) {
    var startedAt = Date.now();
    var metaOut = validateFileMeta(input && input.file);
    if (!metaOut || metaOut.ok !== true) return metaOut;

    try {
      var parsed = await parseExcelBytes({
        bytes: input.bytes,
        extension: metaOut.resultado.datos.extension
      });
      return {
        ok: true,
        resultado: {
          estadoPasaporteModulo: parsed.review.length ? "NARANJA" : "VERDE",
          modulo: MODULE_NAME,
          accionSugeridaParaCerebro: parsed.review.length ? "continuar_y_marcar_revision" : null,
          elapsedMs: elapsedSince(startedAt),
          traceId: String(input && input.traceId || "").trim() || null,
          datos: {
            sheetName: parsed.sheetName,
            headerRowNumber: parsed.headerRowNumber,
            mode: parsed.mode,
            ignoredColumns: parsed.ignoredColumns,
            rows: parsed.rows,
            review: parsed.review || []
          }
        },
        error: null
      };
    } catch (err) {
      return buildError(
        startedAt,
        "IMP_PARSE_INVALIDO",
        err && err.message ? err.message : "El archivo no se pudo leer con seguridad.",
        "pedir_dato_al_usuario",
        "irrecuperable_por_diseno",
        false,
        { traceId: String(input && input.traceId || "").trim() || null }
      );
    }
  }

  async function importarFilasEnBloques(input) {
    var startedAt = Date.now();
    var safeInput = input || {};
    var rows = Array.isArray(safeInput.rows) ? safeInput.rows : [];
    var deps = safeInput.deps || {};
    var store = deps.store;
    var onProgress = typeof safeInput.onProgress === "function" ? safeInput.onProgress : function noop() {};
    var blockSize = Math.max(1, Math.min(50, Number(safeInput.blockSize || DEFAULT_BLOCK_SIZE)));

    if (!store || !altaManualApi || typeof altaManualApi.ejecutarAltaManual !== "function") {
      return buildError(startedAt, "IMP_STORE_NO_DISPONIBLE", "Falta la tuberia real de alta para importar.", "bloquear_guardado", "irrecuperable_por_diseno", false);
    }

    var summary = {
      totalRows: rows.length,
      imported: 0,
      merged: 0,
      rejected: 0,
      items: []
    };

    for (var start = 0; start < rows.length; start += blockSize) {
      var block = rows.slice(start, start + blockSize);
      for (var i = 0; i < block.length; i += 1) {
        var row = block[i];
        var out = altaManualApi.ejecutarAltaManual(
          { nombre: row.nombre, alergenos: row.alergenos },
          { store: store }
        );
        if (out && out.ok === true) {
          summary.imported += out.resultado.datos.fusionExacta ? 0 : 1;
          summary.merged += out.resultado.datos.fusionExacta ? 1 : 0;
          summary.items.push({
            rowNumber: row.rowNumber,
            ok: true,
            merged: !!out.resultado.datos.fusionExacta,
            productId: out.resultado.datos.producto && out.resultado.datos.producto.id ? out.resultado.datos.producto.id : null
          });
        } else {
          summary.rejected += 1;
          summary.items.push({
            rowNumber: row.rowNumber,
            ok: false,
            nombre: row.nombre,
            message: out && out.error && out.error.message ? out.error.message : "No se pudo guardar la fila."
          });
        }
      }
      onProgress({
        total: rows.length,
        done: Math.min(rows.length, start + block.length),
        imported: summary.imported,
        merged: summary.merged,
        rejected: summary.rejected
      });
      await new Promise(function pause(resolve) {
        setTimeout(resolve, 0);
      });
    }

    return {
      ok: true,
      resultado: {
        estadoPasaporteModulo: summary.rejected > 0 ? "NARANJA" : "VERDE",
        modulo: MODULE_NAME,
        accionSugeridaParaCerebro: summary.rejected > 0 ? "continuar_y_marcar_revision" : null,
        elapsedMs: elapsedSince(startedAt),
        traceId: String(safeInput.traceId || "").trim() || null,
        datos: {
          summary: summary
        }
      },
      error: null
    };
  }

  var api = {
    MODULE_NAME: MODULE_NAME,
    MAX_FILE_SIZE_BYTES: MAX_FILE_SIZE_BYTES,
    MAX_ROWS: MAX_ROWS,
    DEFAULT_BLOCK_SIZE: DEFAULT_BLOCK_SIZE,
    validateFileMeta: validateFileMeta,
    validateAndParseExcel: validateAndParseExcel,
    importarFilasEnBloques: importarFilasEnBloques,
    parseExcelBytes: parseExcelBytes,
    parseXlsxBytes: parseXlsxBytes,
    detectHeaderRow: detectHeaderRow,
    parseDataRows: parseDataRows,
    combineNameAndFormat: combineNameAndFormat,
    canonicalizeAllergen: canonicalizeAllergen,
    isPositiveValue: isPositiveValue,
    isNegativeValue: isNegativeValue
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase10ImportacionExcel = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
