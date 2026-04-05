export function toCsv(rows) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const body = rows.map((row) =>
    headers
      .map((key) => escapeCsvValue(row[key]))
      .join(",")
  );

  return [headers.join(","), ...body].join("\n");
}

function escapeCsvValue(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
