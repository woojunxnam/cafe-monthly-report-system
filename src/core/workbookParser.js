const dateAliases = ["거래일시", "거래일자", "일시", "날짜", "date", "datetime"];
const descriptionAliases = ["거래내용", "기재내용", "적요", "상대방", "보낸분/받는분", "내용", "description"];
const noteAliases = ["통장메모", "메모", "비고", "내 통장 표시", "note", "memo"];
const withdrawalAliases = ["출금액", "출금액(원)", "withdrawal", "debit"];
const depositAliases = ["입금액", "입금액(원)", "deposit", "credit"];

export async function parseTransactionFile(file, manifest) {
  if (!window.XLSX) {
    throw new Error("XLSX 라이브러리를 불러오지 못했습니다.");
  }

  const buffer = await file.arrayBuffer();
  const workbook = window.XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = extractRows(sheet);

  if (!rows.length) {
    throw new Error(`${manifest.label}: 업로드 파일에 읽을 수 있는 행이 없습니다.`);
  }

  return rows
    .map((row, index) => normalizeRow(row, manifest, index))
    .filter(Boolean);
}

function extractRows(sheet) {
  const matrix = window.XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false
  });

  if (!matrix.length) {
    return [];
  }

  const headerRowIndex = matrix.findIndex((row) =>
    Array.isArray(row) &&
    row.some((cell) => matchesAlias(cell, dateAliases)) &&
    row.some((cell) => matchesAlias(cell, descriptionAliases))
  );

  if (headerRowIndex === -1) {
    return window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
  }

  const headerRow = matrix[headerRowIndex].map((cell) => String(cell ?? "").trim());
  return matrix
    .slice(headerRowIndex + 1)
    .filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) => {
      const obj = {};
      for (let index = 0; index < headerRow.length; index += 1) {
        const key = headerRow[index] || `column_${index}`;
        obj[key] = row[index] ?? "";
      }
      return obj;
    });
}

function normalizeRow(row, manifest, index) {
  const dateValue = findValue(row, dateAliases);
  const counterparty = cleanText(findValue(row, ["보낸분/받는분", "상대방", "counterparty"]));
  const description = cleanText(findValue(row, ["적요", "거래내용", "기재내용", "description"])) || counterparty;
  const display = cleanText(findValue(row, ["내 통장 표시", "display"]));
  const memo = cleanText(findValue(row, ["메모", "통장메모", "비고", "memo"]));
  const note = [display, memo].filter(Boolean).join(" / ");
  const withdrawal = toAmount(findValue(row, withdrawalAliases));
  const deposit = toAmount(findValue(row, depositAliases));

  if (!dateValue || (!withdrawal && !deposit)) {
    return null;
  }

  const date = toDate(dateValue);
  if (!date) {
    return null;
  }

  const dateKey = date.toISOString().slice(0, 10);
  const monthKey = dateKey.slice(0, 7);

  return {
    rowId: `${manifest.id}-${index + 1}`,
    accountId: manifest.id,
    accountNumber: manifest.accountNumber,
    accountDisplayName: manifest.displayName,
    date,
    dateKey,
    monthKey,
    counterparty,
    description,
    display,
    memo,
    note,
    combined: `${counterparty} ${description} ${display} ${memo}`.trim(),
    withdrawal,
    deposit,
    direction: withdrawal > 0 ? "withdrawal" : "deposit"
  };
}

function findValue(row, aliases) {
  for (const alias of aliases) {
    const match = Object.keys(row).find((key) => String(key).trim().toLowerCase() === alias.toLowerCase());
    if (match) {
      return row[match];
    }
  }
  return "";
}

function matchesAlias(value, aliases) {
  const text = String(value ?? "").trim().toLowerCase();
  return aliases.some((alias) => text === alias.toLowerCase());
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function toAmount(value) {
  if (typeof value === "number") {
    return Math.abs(Math.trunc(value));
  }
  const cleaned = String(value ?? "").replace(/[^\d.-]/g, "");
  if (!cleaned) {
    return 0;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.abs(Math.trunc(parsed)) : 0;
}

function toDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number") {
    const parsed = window.XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
  }

  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }

  const normalized = text
    .replace(/[.년]/g, "-")
    .replace(/[월/]/g, "-")
    .replace(/일/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const datePart = normalized.split(" ")[0];
  const candidate = new Date(datePart);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}
