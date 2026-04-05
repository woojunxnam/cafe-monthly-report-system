function formatWon(value) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function formatPercent(value) {
  return `${((value || 0) * 100).toFixed(1)}%`;
}

function renderSummaryTable(rows, columns) {
  const head = columns.map((column) => `<th${column.numeric ? ' class="num"' : ""}>${column.label}</th>`).join("");
  const body = rows.length
    ? rows.map((row) => `<tr>${columns.map((column) => `<td${column.numeric ? ' class="num"' : ""}>${column.render ? column.render(row[column.key], row) : escapeHtml(row[column.key])}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${columns.length}">데이터 없음</td></tr>`;

  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function renderAccountHtml(report) {
  const topWithdrawal = report.withdrawalSummary[0];
  const topDeposit = report.depositSummary[0];

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${report.reportMonth} ${report.manifest.displayName} 월간 리포트</title>
<style>
  :root { --bg:#ffffff; --ink:#111111; --muted:#555555; --line:#d9d9d9; --soft:#f5f5f5; --soft2:#fafafa; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:"Noto Sans KR","Malgun Gothic",sans-serif; line-height:1.5; }
  .wrap { max-width:1360px; margin:0 auto; padding:24px; }
  .header,.section { border:1px solid #111; padding:18px; margin-bottom:18px; }
  .header h1,.section h2 { margin:0 0 8px; letter-spacing:-0.02em; }
  .meta { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-top:14px; }
  .meta-box { border:1px solid #111; padding:12px; }
  .label { font-size:12px; color:var(--muted); }
  .value { font-size:22px; font-weight:700; margin-top:4px; }
  .note { color:var(--muted); font-size:13px; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  .card { border:1px solid var(--line); padding:12px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th, td { border:1px solid var(--line); padding:8px 9px; }
  thead th { background:var(--soft); }
  tbody tr:nth-child(even) { background:var(--soft2); }
  .num { text-align:right; }
  .footer { color:var(--muted); font-size:12px; text-align:right; margin-top:12px; }
  @media (max-width: 980px) { .meta,.two-col { grid-template-columns:1fr; } }
</style>
</head>
<body>
<div class="wrap">
  <section class="header">
    <h1>${escapeHtml(report.reportMonth)} 월간 계좌 리포트</h1>
    <p class="note">${escapeHtml(report.manifest.accountNumber)} / ${escapeHtml(report.manifest.displayName)} / 표 중심 / 흑백 중심 / 그래프 최소화</p>
    <div class="meta">
      <div class="meta-box"><div class="label">총 지출</div><div class="value">${formatWon(report.totals.totalWithdrawal)}</div></div>
      <div class="meta-box"><div class="label">총 입금</div><div class="value">${formatWon(report.totals.totalDeposit)}</div></div>
      <div class="meta-box"><div class="label">최대 지출 카테고리</div><div class="value">${escapeHtml(topWithdrawal?.category || "-")}</div><div class="note">${formatWon(topWithdrawal?.total || 0)}</div></div>
      <div class="meta-box"><div class="label">최대 입금 카테고리</div><div class="value">${escapeHtml(topDeposit?.category || "-")}</div><div class="note">${formatWon(topDeposit?.total || 0)}</div></div>
    </div>
  </section>

  <section class="section">
    <h2>1. 운영 지출 개요</h2>
    <div class="two-col">
      <div class="card">
        <p class="note">관련자금 출금은 별도 그룹으로 유지하고 운영 지출은 제외 prefix 기준으로 정리했습니다.</p>
        ${renderSummaryTable(report.withdrawalSummary, [
          { key: "category", label: "카테고리" },
          { key: "count", label: "건수", numeric: true },
          { key: "total", label: "합계", numeric: true, render: (value) => formatWon(value) },
          { key: "share", label: "비중", numeric: true, render: (value) => formatPercent(value) },
          { key: "average", label: "건당평균", numeric: true, render: (value) => formatWon(value) }
        ])}
      </div>
      <div class="card">
        <p class="note">기존 패키지 보고 철학을 따라 입금/출금/관련자금 흐름을 분리합니다.</p>
        ${renderSummaryTable(report.depositSummary, [
          { key: "category", label: "카테고리" },
          { key: "count", label: "건수", numeric: true },
          { key: "total", label: "합계", numeric: true, render: (value) => formatWon(value) },
          { key: "share", label: "비중", numeric: true, render: (value) => formatPercent(value) },
          { key: "average", label: "건당평균", numeric: true, render: (value) => formatWon(value) }
        ])}
      </div>
    </div>
  </section>

  <section class="section">
    <h2>2. 관련자금 흐름 요약</h2>
    ${renderSummaryTable(report.relatedTransferSummary, [
      { key: "relatedGroup", label: "관련 그룹" },
      { key: "depositCount", label: "입금건수", numeric: true },
      { key: "depositTotal", label: "입금합계", numeric: true, render: (value) => formatWon(value) },
      { key: "withdrawalCount", label: "출금건수", numeric: true },
      { key: "withdrawalTotal", label: "출금합계", numeric: true, render: (value) => formatWon(value) },
      { key: "netInflow", label: "순유입", numeric: true, render: (value) => formatWon(value) }
    ])}
  </section>

  <section class="section">
    <h2>3. 주요 출금 상세</h2>
    ${renderSummaryTable(report.majorWithdrawals.map((row) => ({
      dateKey: row.dateKey,
      description: row.description,
      category: row.category,
      amount: row.withdrawal
    })), [
      { key: "dateKey", label: "날짜" },
      { key: "description", label: "적요" },
      { key: "category", label: "카테고리" },
      { key: "amount", label: "금액", numeric: true, render: (value) => formatWon(value) }
    ])}
  </section>

  <section class="section">
    <h2>4. 주요 입금 상세</h2>
    ${renderSummaryTable(report.majorDeposits.map((row) => ({
      dateKey: row.dateKey,
      description: row.description,
      category: row.category,
      amount: row.deposit
    })), [
      { key: "dateKey", label: "날짜" },
      { key: "description", label: "적요" },
      { key: "category", label: "카테고리" },
      { key: "amount", label: "금액", numeric: true, render: (value) => formatWon(value) }
    ])}
  </section>

  <section class="section">
    <h2>5. 제외된 관련 출금</h2>
    ${renderSummaryTable(report.excludedRows.map((row) => ({
      dateKey: row.dateKey,
      description: row.description,
      amount: row.withdrawal,
      reason: row.exclusionReason
    })), [
      { key: "dateKey", label: "날짜" },
      { key: "description", label: "적요" },
      { key: "amount", label: "금액", numeric: true, render: (value) => formatWon(value) },
      { key: "reason", label: "사유" }
    ])}
  </section>

  <div class="footer">Browser-generated MVP report</div>
</div>
</body>
</html>`;
}

export function renderMasterHtml(master) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${master.reportMonth} Master Report</title>
<style>
  body { margin:0; padding:24px; color:#111; background:#fff; font-family:"Noto Sans KR","Malgun Gothic",sans-serif; }
  .section { border:1px solid #111; padding:16px; margin-bottom:16px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th, td { border:1px solid #d9d9d9; padding:8px; }
  th { background:#f5f5f5; }
  .num { text-align:right; }
</style>
</head>
<body>
  <section class="section">
    <h1>${escapeHtml(master.reportMonth)} Master Report</h1>
    <p>계좌별 총 지출/총 입금 비교, 주요 카테고리 비교, 전체 합산 기준 master summary, 관련자금 흐름을 포함합니다.</p>
    <p><strong>총 지출:</strong> ${formatWon(master.totals.totalWithdrawal)} / <strong>총 입금:</strong> ${formatWon(master.totals.totalDeposit)}</p>
  </section>

  <section class="section">
    <h2>1. 계좌별 총액 비교</h2>
    ${renderSummaryTable(master.rows, [
      { key: "계좌", label: "계좌" },
      { key: "계좌번호", label: "계좌번호" },
      { key: "총지출", label: "총지출", numeric: true, render: (value) => formatWon(value) },
      { key: "총입금", label: "총입금", numeric: true, render: (value) => formatWon(value) },
      { key: "순유입", label: "순유입", numeric: true, render: (value) => formatWon(value) },
      { key: "지출건수", label: "지출건수", numeric: true },
      { key: "입금건수", label: "입금건수", numeric: true }
    ])}
  </section>

  <section class="section">
    <h2>2. 주요 카테고리 비교</h2>
    ${renderSummaryTable(master.majorCategoryComparison, [
      { key: "계좌", label: "계좌" },
      { key: "유형", label: "유형" },
      { key: "카테고리", label: "카테고리" },
      { key: "합계", label: "합계", numeric: true, render: (value) => formatWon(value) },
      { key: "건수", label: "건수", numeric: true }
    ])}
  </section>

  <section class="section">
    <h2>3. 관련자금 흐름 요약</h2>
    ${renderSummaryTable(master.relatedTransferRows, [
      { key: "계좌", label: "계좌" },
      { key: "relatedGroup", label: "관련 그룹" },
      { key: "depositCount", label: "입금건수", numeric: true },
      { key: "depositTotal", label: "입금합계", numeric: true, render: (value) => formatWon(value) },
      { key: "withdrawalCount", label: "출금건수", numeric: true },
      { key: "withdrawalTotal", label: "출금합계", numeric: true, render: (value) => formatWon(value) },
      { key: "netInflow", label: "순유입", numeric: true, render: (value) => formatWon(value) }
    ])}
  </section>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
