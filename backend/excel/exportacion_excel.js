(function initExportacionExcelModule(globalScope) {
  "use strict";

  var allergenCatalog = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      allergenCatalog = require("../../../shared/alergenos_oficiales.js");
    } catch (errRequire) {
      allergenCatalog = null;
    }
  }
  if (!allergenCatalog && globalScope && globalScope.AppV2AlergenosOficiales) {
    allergenCatalog = globalScope.AppV2AlergenosOficiales;
  }

  var MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  function getOfficialAllergens() {
    if (allergenCatalog && Array.isArray(allergenCatalog.NOMBRES_OFICIALES)) {
      return allergenCatalog.NOMBRES_OFICIALES.slice(0);
    }
    return [];
  }

  function normalizeAllergenList(input) {
    if (allergenCatalog && typeof allergenCatalog.normalizeAllergenList === "function") {
      return allergenCatalog.normalizeAllergenList(input);
    }
    var safeInput = Array.isArray(input) ? input : [];
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < safeInput.length; i += 1) {
      var item = String(safeInput[i] || "").trim().toLowerCase();
      if (!item || seen[item]) continue;
      seen[item] = true;
      out.push(item);
    }
    return out.sort();
  }

  function toHeaderLabel(allergenId) {
    var safe = String(allergenId || "").trim().replace(/_/g, " ");
    if (!safe) return "";
    return safe.toUpperCase();
  }

  function xmlEscape(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function utf8Encode(value) {
    var safeValue = String(value == null ? "" : value);
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(safeValue);
    }
    if (typeof Buffer !== "undefined") {
      return Uint8Array.from(Buffer.from(safeValue, "utf8"));
    }
    var out = [];
    for (var i = 0; i < safeValue.length; i += 1) {
      var code = safeValue.charCodeAt(i);
      if (code < 0x80) {
        out.push(code);
      } else if (code < 0x800) {
        out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else {
        out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      }
    }
    return Uint8Array.from(out);
  }

  function concatBytes(chunks) {
    var safeChunks = Array.isArray(chunks) ? chunks : [];
    var total = 0;
    var i;
    for (i = 0; i < safeChunks.length; i += 1) {
      total += safeChunks[i] ? safeChunks[i].length : 0;
    }
    var out = new Uint8Array(total);
    var offset = 0;
    for (i = 0; i < safeChunks.length; i += 1) {
      var chunk = safeChunks[i];
      if (!chunk || !chunk.length) continue;
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }

  function writeUint16(bytes, offset, value) {
    bytes[offset] = value & 0xff;
    bytes[offset + 1] = (value >>> 8) & 0xff;
  }

  function writeUint32(bytes, offset, value) {
    bytes[offset] = value & 0xff;
    bytes[offset + 1] = (value >>> 8) & 0xff;
    bytes[offset + 2] = (value >>> 16) & 0xff;
    bytes[offset + 3] = (value >>> 24) & 0xff;
  }

  var CRC32_TABLE = (function buildCrc32Table() {
    var table = new Uint32Array(256);
    for (var i = 0; i < 256; i += 1) {
      var c = i;
      for (var j = 0; j < 8; j += 1) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    var crc = 0xffffffff;
    for (var i = 0; i < bytes.length; i += 1) {
      crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function getDosDateTimeParts(date) {
    var value = date instanceof Date ? date : new Date();
    var year = Math.max(1980, value.getFullYear());
    var month = value.getMonth() + 1;
    var day = value.getDate();
    var hours = value.getHours();
    var minutes = value.getMinutes();
    var seconds = Math.floor(value.getSeconds() / 2);
    return {
      date: ((year - 1980) << 9) | (month << 5) | day,
      time: (hours << 11) | (minutes << 5) | seconds
    };
  }

  function createStoredZip(files, createdAt) {
    var safeFiles = Array.isArray(files) ? files : [];
    var localChunks = [];
    var centralChunks = [];
    var offset = 0;
    var timestamp = getDosDateTimeParts(createdAt || new Date());
    var i;

    for (i = 0; i < safeFiles.length; i += 1) {
      var file = safeFiles[i] || {};
      var nameBytes = utf8Encode(String(file.name || "").replace(/\\/g, "/"));
      var dataBytes = file.data instanceof Uint8Array ? file.data : utf8Encode(file.data || "");
      var crc = crc32(dataBytes);

      var localHeader = new Uint8Array(30 + nameBytes.length);
      writeUint32(localHeader, 0, 0x04034b50);
      writeUint16(localHeader, 4, 20);
      writeUint16(localHeader, 6, 0);
      writeUint16(localHeader, 8, 0);
      writeUint16(localHeader, 10, timestamp.time);
      writeUint16(localHeader, 12, timestamp.date);
      writeUint32(localHeader, 14, crc);
      writeUint32(localHeader, 18, dataBytes.length);
      writeUint32(localHeader, 22, dataBytes.length);
      writeUint16(localHeader, 26, nameBytes.length);
      writeUint16(localHeader, 28, 0);
      localHeader.set(nameBytes, 30);

      localChunks.push(localHeader, dataBytes);

      var centralHeader = new Uint8Array(46 + nameBytes.length);
      writeUint32(centralHeader, 0, 0x02014b50);
      writeUint16(centralHeader, 4, 20);
      writeUint16(centralHeader, 6, 20);
      writeUint16(centralHeader, 8, 0);
      writeUint16(centralHeader, 10, 0);
      writeUint16(centralHeader, 12, timestamp.time);
      writeUint16(centralHeader, 14, timestamp.date);
      writeUint32(centralHeader, 16, crc);
      writeUint32(centralHeader, 20, dataBytes.length);
      writeUint32(centralHeader, 24, dataBytes.length);
      writeUint16(centralHeader, 28, nameBytes.length);
      writeUint16(centralHeader, 30, 0);
      writeUint16(centralHeader, 32, 0);
      writeUint16(centralHeader, 34, 0);
      writeUint16(centralHeader, 36, 0);
      writeUint32(centralHeader, 38, 0);
      writeUint32(centralHeader, 42, offset);
      centralHeader.set(nameBytes, 46);
      centralChunks.push(centralHeader);

      offset += localHeader.length + dataBytes.length;
    }

    var centralBytes = concatBytes(centralChunks);
    var endRecord = new Uint8Array(22);
    writeUint32(endRecord, 0, 0x06054b50);
    writeUint16(endRecord, 4, 0);
    writeUint16(endRecord, 6, 0);
    writeUint16(endRecord, 8, safeFiles.length);
    writeUint16(endRecord, 10, safeFiles.length);
    writeUint32(endRecord, 12, centralBytes.length);
    writeUint32(endRecord, 16, offset);
    writeUint16(endRecord, 20, 0);

    return concatBytes([concatBytes(localChunks), centralBytes, endRecord]);
  }

  function columnRefFromIndex(index) {
    var n = Number(index) + 1;
    var out = "";
    while (n > 0) {
      var rem = (n - 1) % 26;
      out = String.fromCharCode(65 + rem) + out;
      n = Math.floor((n - 1) / 26);
    }
    return out;
  }

  function buildCell(ref, text, styleId) {
    var safeText = String(text == null ? "" : text);
    if (!safeText) return "";
    return "<c r=\"" + ref + "\" t=\"inlineStr\"" + (styleId != null ? " s=\"" + styleId + "\"" : "") + "><is><t>" + xmlEscape(safeText) + "</t></is></c>";
  }

  function buildSheetXml(rows, allergens) {
    var safeRows = Array.isArray(rows) ? rows : [];
    var safeAllergens = Array.isArray(allergens) ? allergens : [];
    var lastColumn = columnRefFromIndex(safeAllergens.length);
    var rowCount = safeRows.length + 1;
    var xmlRows = [];
    var headerCells = ["<c r=\"A1\" t=\"inlineStr\" s=\"1\"><is><t>PRODUCTOS</t></is></c>"];
    var i;

    for (i = 0; i < safeAllergens.length; i += 1) {
      headerCells.push(
        "<c r=\"" + columnRefFromIndex(i + 1) + "1\" t=\"inlineStr\" s=\"1\"><is><t>" + xmlEscape(toHeaderLabel(safeAllergens[i])) + "</t></is></c>"
      );
    }
    xmlRows.push("<row r=\"1\" ht=\"24\" customHeight=\"1\">" + headerCells.join("") + "</row>");

    for (i = 0; i < safeRows.length; i += 1) {
      var rowIndex = i + 2;
      var row = safeRows[i] || {};
      var cells = [];
      cells.push(buildCell("A" + rowIndex, row.nombre || "", 0));
      for (var j = 0; j < safeAllergens.length; j += 1) {
        var ref = columnRefFromIndex(j + 1) + rowIndex;
        var mark = row.marcas && row.marcas[safeAllergens[j]] ? "X" : "";
        cells.push(buildCell(ref, mark, mark ? 2 : 0));
      }
      xmlRows.push("<row r=\"" + rowIndex + "\">" + cells.join("") + "</row>");
    }

    return [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">",
      "<sheetViews>",
      "<sheetView workbookViewId=\"0\">",
      "<pane ySplit=\"1\" topLeftCell=\"A2\" activePane=\"bottomLeft\" state=\"frozen\"/>",
      "<selection pane=\"bottomLeft\" activeCell=\"A2\" sqref=\"A2\"/>",
      "</sheetView>",
      "</sheetViews>",
      "<dimension ref=\"A1:" + lastColumn + rowCount + "\"/>",
      "<sheetFormatPr defaultRowHeight=\"18\"/>",
      "<cols><col min=\"1\" max=\"1\" width=\"38\" customWidth=\"1\"/><col min=\"2\" max=\"" + (safeAllergens.length + 1) + "\" width=\"14\" customWidth=\"1\"/></cols>",
      "<sheetData>",
      xmlRows.join(""),
      "</sheetData>",
      "</worksheet>"
    ].join("");
  }

  function buildStylesXml() {
    return [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">",
      "<fonts count=\"3\">",
      "<font><sz val=\"11\"/><name val=\"Calibri\"/></font>",
      "<font><b/><sz val=\"11\"/><color rgb=\"FF1F1F1F\"/><name val=\"Calibri\"/></font>",
      "<font><b/><sz val=\"11\"/><color rgb=\"FFC00000\"/><name val=\"Calibri\"/></font>",
      "</fonts>",
      "<fills count=\"3\">",
      "<fill><patternFill patternType=\"none\"/></fill>",
      "<fill><patternFill patternType=\"gray125\"/></fill>",
      "<fill><patternFill patternType=\"solid\"><fgColor rgb=\"FFF3D36A\"/><bgColor indexed=\"64\"/></patternFill></fill>",
      "</fills>",
      "<borders count=\"2\">",
      "<border><left/><right/><top/><bottom/><diagonal/></border>",
      "<border><left style=\"thin\"><color rgb=\"FFD4C37B\"/></left><right style=\"thin\"><color rgb=\"FFD4C37B\"/></right><top style=\"thin\"><color rgb=\"FFD4C37B\"/></top><bottom style=\"thin\"><color rgb=\"FFD4C37B\"/></bottom><diagonal/></border>",
      "</borders>",
      "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>",
      "<cellXfs count=\"3\">",
      "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>",
      "<xf numFmtId=\"0\" fontId=\"1\" fillId=\"2\" borderId=\"1\" xfId=\"0\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\"/></xf>",
      "<xf numFmtId=\"0\" fontId=\"2\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\"/></xf>",
      "</cellXfs>",
      "<cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>",
      "</styleSheet>"
    ].join("");
  }

  function buildWorkbookXml() {
    return [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">",
      "<sheets><sheet name=\"Exportacion\" sheetId=\"1\" r:id=\"rId1\"/></sheets>",
      "</workbook>"
    ].join("");
  }

  function buildWorkbookRelsXml() {
    return [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">",
      "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>",
      "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>",
      "</Relationships>"
    ].join("");
  }

  function buildRootRelsXml() {
    return [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">",
      "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>",
      "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/>",
      "<Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/>",
      "</Relationships>"
    ].join("");
  }

  function buildContentTypesXml() {
    return [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">",
      "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>",
      "<Default Extension=\"xml\" ContentType=\"application/xml\"/>",
      "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>",
      "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>",
      "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>",
      "<Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/>",
      "<Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/>",
      "</Types>"
    ].join("");
  }

  function buildAppXml() {
    return [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\" xmlns:vt=\"http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes\">",
      "<Application>App Alergenos V2</Application>",
      "<DocSecurity>0</DocSecurity>",
      "<ScaleCrop>false</ScaleCrop>",
      "<HeadingPairs><vt:vector size=\"2\" baseType=\"variant\"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs>",
      "<TitlesOfParts><vt:vector size=\"1\" baseType=\"lpstr\"><vt:lpstr>Exportacion</vt:lpstr></vt:vector></TitlesOfParts>",
      "</Properties>"
    ].join("");
  }

  function buildCoreXml(createdAtIso) {
    var safeIso = String(createdAtIso || new Date().toISOString());
    return [
      "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
      "<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:dcterms=\"http://purl.org/dc/terms/\" xmlns:dcmitype=\"http://purl.org/dc/dcmitype/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">",
      "<dc:creator>App Alergenos V2</dc:creator>",
      "<cp:lastModifiedBy>App Alergenos V2</cp:lastModifiedBy>",
      "<dcterms:created xsi:type=\"dcterms:W3CDTF\">" + xmlEscape(safeIso) + "</dcterms:created>",
      "<dcterms:modified xsi:type=\"dcterms:W3CDTF\">" + xmlEscape(safeIso) + "</dcterms:modified>",
      "</cp:coreProperties>"
    ].join("");
  }

  function buildExportRows(products, allergens) {
    var safeProducts = Array.isArray(products) ? products : [];
    var safeAllergens = Array.isArray(allergens) ? allergens : getOfficialAllergens();
    var rows = [];
    for (var i = 0; i < safeProducts.length; i += 1) {
      var product = safeProducts[i] || {};
      var nombre = product.identidad && product.identidad.nombre
        ? String(product.identidad.nombre).trim()
        : String(product.nombre || "").trim();
      if (!nombre) continue;
      var active = normalizeAllergenList(product.alergenos);
      var marks = Object.create(null);
      for (var j = 0; j < active.length; j += 1) {
        marks[active[j]] = true;
      }
      rows.push({
        nombre: nombre,
        marcas: marks
      });
    }
    rows.sort(function byName(a, b) {
      return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
    });
    return {
      allergens: safeAllergens.slice(0),
      rows: rows
    };
  }

  function createExportFilename(date) {
    var value = date instanceof Date ? date : new Date();
    var day = String(value.getDate()).padStart(2, "0");
    var month = String(value.getMonth() + 1).padStart(2, "0");
    var year = String(value.getFullYear());
    return "EXPORTACION BD GESTION ALERGENOS " + day + "-" + month + "-" + year + ".xlsx";
  }

  function buildWorkbookBytes(input) {
    var safeInput = input || {};
    var createdAt = safeInput.createdAt instanceof Date ? safeInput.createdAt : new Date();
    var createdAtIso = createdAt.toISOString();
    var base = buildExportRows(safeInput.products, safeInput.allergens);
    var files = [
      { name: "[Content_Types].xml", data: utf8Encode(buildContentTypesXml()) },
      { name: "_rels/.rels", data: utf8Encode(buildRootRelsXml()) },
      { name: "docProps/app.xml", data: utf8Encode(buildAppXml()) },
      { name: "docProps/core.xml", data: utf8Encode(buildCoreXml(createdAtIso)) },
      { name: "xl/workbook.xml", data: utf8Encode(buildWorkbookXml()) },
      { name: "xl/_rels/workbook.xml.rels", data: utf8Encode(buildWorkbookRelsXml()) },
      { name: "xl/styles.xml", data: utf8Encode(buildStylesXml()) },
      { name: "xl/worksheets/sheet1.xml", data: utf8Encode(buildSheetXml(base.rows, base.allergens)) }
    ];
    return createStoredZip(files, createdAt);
  }

  function createWorkbookBlob(input) {
    return new Blob([buildWorkbookBytes(input)], { type: MIME_XLSX });
  }

  function triggerDownload(filename, bytes) {
    if (!globalScope || typeof Blob === "undefined" || !globalScope.URL || typeof globalScope.URL.createObjectURL !== "function") {
      return {
        ok: false,
        errorCode: "EXPORT_DOWNLOAD_NO_DISPONIBLE",
        message: "No se pudo preparar la descarga."
      };
    }
    var blob = new Blob([bytes], { type: MIME_XLSX });
    var url = globalScope.URL.createObjectURL(blob);
    try {
      var link = globalScope.document.createElement("a");
      link.href = url;
      link.download = String(filename || createExportFilename(new Date()));
      globalScope.document.body.appendChild(link);
      link.click();
      globalScope.document.body.removeChild(link);
      return { ok: true };
    } finally {
      globalScope.setTimeout(function revoke() {
        globalScope.URL.revokeObjectURL(url);
      }, 0);
    }
  }

  var api = {
    MIME_XLSX: MIME_XLSX,
    createExportFilename: createExportFilename,
    buildExportRows: buildExportRows,
    buildWorkbookBytes: buildWorkbookBytes,
    createWorkbookBlob: createWorkbookBlob,
    triggerDownload: triggerDownload
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase10ExportacionExcel = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
