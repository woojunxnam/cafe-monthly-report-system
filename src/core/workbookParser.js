const numberAliases = ["No", "번호", "no"];
const dateAliases = ["거래일시", "거래일자", "일시", "날짜", "date", "datetime"];
const counterpartyAliases = ["보낸분/받는분", "상대방", "counterparty"];
const descriptionAliases = ["거래내용", "기재내용", "적요", "상대방", "보낸분/받는분", "내용", "description"];
const displayAliases = ["내 통장 표시", "표시내용", "display"];
const noteAliases = ["통장메모", "메모", "비고", "note", "memo"];
const withdrawalAliases = ["출금액", "출금액(원)", "withdrawal", "debit"];
const depositAliases = ["입금액", "입금액(원)", "deposit", "credit"];
const balanceAliases = ["잔액", "잔액(원)", "balance"];

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
    throw new Error(`${manifest.label}: 업로드 파일에서 읽을 수 있는 행이 없습니다.`);
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
  const date = toDate(dateValue);
  const withdrawal = toAmount(findValue(row, withdrawalAliases));
  const deposit = toAmount(findValue(row, depositAliases));

  if (!date || (!withdrawal && !deposit)) {
    return null;
  }

  const counterparty = cleanText(findValue(row, counterpartyAliases));
  const description = cleanText(findValue(row, descriptionAliases)) || counterparty;
  const display = cleanText(findValue(row, displayAliases));
  const memo = cleanText(findValue(row, noteAliases));
  const note = [display, memo].filter(Boolean).join(" / ");
  const dateKey = formatDate(date);
  const timeKey = formatTime(date);
  const monthKey = dateKey.slice(0, 7);

  return {
    rowId: `${manifest.id}-${index + 1}`,
    rowNumber: toAmount(findValue(row, numberAliases)) || index + 1,
    accountId: manifest.id,
    accountNumber: manifest.accountNumber,
    accountDisplayName: manifest.displayName,
    date,
    dateKey,
    timeKey,
    monthKey,
    counterparty,
    description,
    display,
    memo,
    note,
    combined: `${counterparty} ${description} ${display} ${memo}`.trim(),
    withdrawal,
    deposit,
    balance: toAmount(findValue(row, balanceAliases)),
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
      return new Date(
        parsed.y,
        parsed.m - 1,
        parsed.d,
        parsed.H || parsed.h || 0,
        parsed.M || parsed.m || 0,
        parsed.S || parsed.s || 0
      );
    }
  }

  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }

  const matched = text.match(
    /^(\d{4})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})(?:일)?(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (matched) {
    const [, year, month, day, hour = "0", minute = "0", second = "0"] = matched;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
  }

  const candidate = new Date(text);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}
