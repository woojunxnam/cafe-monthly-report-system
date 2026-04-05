function formatWon(value) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function formatPercent(value) {
  return `${((value || 0) * 100).toFixed(1)}%`;
}

function renderSummaryTable(rows, columns, emptyLabel = "데이터 없음") {
  const head = columns.map((column) => `<th${column.numeric ? ' class="num"' : ""}>${column.label}</th>`).join("");
  const body = rows.length
    ? rows
        .map(
          (row) =>
            `<tr>${columns
              .map(
                (column) =>
                  `<td${column.numeric ? ' class="num"' : ""}>${
                    column.render ? column.render(row[column.key], row) : escapeHtml(row[column.key])
                  }</td>`
              )
              .join("")}</tr>`
        )
        .join("")
    : `<tr><td colspan="${columns.length}">${emptyLabel}</td></tr>`;

  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

export function renderAccountHtml(report) {
  const topWithdrawal = report.withdrawalSummary[0];
  const topDeposit = report.depositSummary[0];

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(report.reportMonth)} 카페 월간 리포트</title>
<style>
  :root { --bg:#ffffff; --ink:#111111; --muted:#555555; --line:#d9d9d9; --soft:#f5f5f5; --soft2:#fafafa; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",Arial,sans-serif; line-height:1.5; }
  .wrap { max-width:1360px; margin:0 auto; padding:24px; }
  .header { border:2px solid #111; padding:20px 22px; margin-bottom:18px; }
  .header h1 { margin:0 0 6px; font-size:28px; letter-spacing:-0.02em; }
  .sub { color:var(--muted); font-size:14px; }
  .meta { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin-top:14px; }
  .meta-box { border:1px solid #111; padding:12px 14px; min-height:86px; }
  .meta-box .label { font-size:12px; color:var(--muted); margin-bottom:6px; }
  .meta-box .value { font-size:20px; font-weight:700; letter-spacing:-0.02em; }
  .meta-box .note { font-size:12px; color:var(--muted); margin-top:6px; }
  .section { margin-bottom:18px; border:1px solid #111; padding:16px; }
  .section h2 { margin:0 0 8px; font-size:20px; letter-spacing:-0.02em; }
  .desc { margin:0 0 14px; color:var(--muted); font-size:13px; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  .detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  .chart-box { border:1px solid var(--line); padding:10px; background:#fff; }
  .chart-title { margin:0 0 8px; font-size:13px; font-weight:700; }
  svg { width:100%; height:auto; display:block; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  thead th { background:var(--soft); font-weight:700; }
  th, td { border:1px solid var(--line); padding:8px 9px; white-space:nowrap; }
  th:first-child, td:first-child { text-align:left; }
  td.num, th.num { text-align:right; }
  tbody tr:nth-child(even) { background:var(--soft2); }
  .table-wrap { overflow:auto; }
  .detail-box { border:1px solid var(--line); padding:12px; }
  .detail-head { display:flex; justify-content:space-between; gap:12px; align-items:end; margin-bottom:8px; }
  .detail-head h3 { margin:0; font-size:16px; }
  .detail-meta { font-size:12px; color:var(--muted); }
  .subtotal td { font-weight:700; background:#F3F4F6; }
  .note-box { border:1px solid var(--line); background:#fcfcfc; padding:12px 14px; }
  .note-box ul { margin:0; padding-left:18px; }
  .note-box li { margin-bottom:6px; }
  .footer { margin-top:10px; color:var(--muted); font-size:12px; text-align:right; }
  @media (max-width:1100px) { .meta, .two-col, .detail-grid { grid-template-columns:1fr; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>${escapeHtml(report.reportMonth)} 카페 월간 리포트</h1>
    <div class="sub">계좌번호 ${escapeHtml(report.manifest.accountNumber)} / 계좌명 ${escapeHtml(report.manifest.displayName)} / 표 중심 월간 리뷰 / 관련자금은 별도 섹션으로 분리</div>
    <div class="meta">
      <div class="meta-box"><div class="label">운영지출 합계</div><div class="value">${formatWon(report.totals.totalWithdrawal)}</div><div class="note">관련자금 출금 제외</div></div>
      <div class="meta-box"><div class="label">운영지출 건수</div><div class="value">${report.totals.withdrawalCount.toLocaleString("ko-KR")}건</div><div class="note">출금 메인 섹션</div></div>
      <div class="meta-box"><div class="label">총 입금 합계</div><div class="value">${formatWon(report.totals.totalDeposit)}</div><div class="note">입금액 > 0 전체</div></div>
      <div class="meta-box"><div class="label">총 입금 건수</div><div class="value">${report.totals.depositCount.toLocaleString("ko-KR")}건</div><div class="note">입금 섹션 전체</div></div>
      <div class="meta-box"><div class="label">최대 지출 카테고리</div><div class="value">${escapeHtml(topWithdrawal?.category || "-")}</div><div class="note">${formatWon(topWithdrawal?.total || 0)}</div></div>
      <div class="meta-box"><div class="label">최대 입금 카테고리</div><div class="value">${escapeHtml(topDeposit?.category || "-")}</div><div class="note">${formatWon(topDeposit?.total || 0)}</div></div>
    </div>
  </div>

  <section class="section">
    <h2>1. 운영지출 개요</h2>
    <p class="desc">운영비 검토용 섹션입니다. 관련자금 출금은 제외하고, 실제 운영지출만 카테고리별로 요약합니다.</p>
    <div class="two-col">
      <div class="chart-box"><p class="chart-title">일자별 운영지출</p>${renderDailyBarChart(report.withdrawalDailySeries, ["#111827", "#2563EB", "#DC2626"])}</div>
      <div class="chart-box"><p class="chart-title">운영지출 카테고리별 합계</p>${renderCategoryBarChart(report.withdrawalSummary, ["#4F46E5", "#0EA5E9", "#111827", "#10B981", "#F59E0B", "#EF4444"])}</div>
    </div>
    ${renderSummaryTable(report.withdrawalSummary, [
      { key: "category", label: "카테고리" },
      { key: "count", label: "건수", numeric: true },
      { key: "total", label: "합계", numeric: true, render: (value) => formatWon(value) },
      { key: "share", label: "비중", numeric: true, render: (value) => formatPercent(value) },
      { key: "average", label: "건당평균", numeric: true, render: (value) => formatWon(value) }
    ])}
  </section>

  <section class="section">
    <h2>2. 입금 개요</h2>
    <p class="desc">입금은 관련자금, 카드매출정산, ATM입금, 고객직접입금, 기타입금으로 분류합니다.</p>
    <div class="two-col">
      <div class="chart-box"><p class="chart-title">일자별 입금</p>${renderDailyBarChart(report.depositDailySeries, ["#16A34A", "#2563EB", "#7C3AED"])}</div>
      <div class="chart-box"><p class="chart-title">입금 카테고리별 합계</p>${renderCategoryBarChart(report.depositSummary, ["#7C3AED", "#F59E0B", "#2563EB", "#16A34A", "#111827"])}</div>
    </div>
    ${renderSummaryTable(report.depositSummary, [
      { key: "category", label: "카테고리" },
      { key: "count", label: "건수", numeric: true },
      { key: "total", label: "합계", numeric: true, render: (value) => formatWon(value) },
      { key: "share", label: "비중", numeric: true, render: (value) => formatPercent(value) },
      { key: "average", label: "건당평균", numeric: true, render: (value) => formatWon(value) }
    ])}
  </section>

  <section class="section">
    <h2>3. 관련자금 흐름 요약</h2>
    <p class="desc">박재민관련, 성기용관련 등 양방향 흐름은 운영지출과 분리해 순유입 기준으로 봅니다.</p>
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
    <h2>4. 주요 운영지출 상세</h2>
    <p class="desc">월 합계가 기준 이상인 지출 카테고리의 개별 거래를 펼쳐 보여줍니다.</p>
    <div class="detail-grid">${report.majorWithdrawalGroups.map((group) => renderCategoryDetailBox(group, "withdrawal")).join("") || "<div class='detail-box'>데이터 없음</div>"}</div>
  </section>

  <section class="section">
    <h2>5. 주요 입금 상세</h2>
    <p class="desc">월 합계가 기준 이상인 입금 카테고리의 개별 거래를 펼쳐 보여줍니다.</p>
    <div class="detail-grid">${report.majorDepositGroups.map((group) => renderCategoryDetailBox(group, "deposit")).join("") || "<div class='detail-box'>데이터 없음</div>"}</div>
  </section>

  <section class="section">
    <h2>6. 제외 또는 관련 출금</h2>
    <p class="desc">운영지출에서 제외된 출금만 별도로 남겨 검토합니다.</p>
    ${renderSummaryTable(
      report.excludedRows.map((row) => ({
        dateKey: row.dateKey,
        timeKey: row.timeKey,
        counterparty: row.counterparty,
        description: row.description,
        amount: row.withdrawal,
        reason: row.relatedGroup || row.exclusionReason || "-"
      })),
      [
        { key: "dateKey", label: "날짜" },
        { key: "timeKey", label: "시각" },
        { key: "counterparty", label: "원본 이름" },
        { key: "description", label: "적요" },
        { key: "amount", label: "금액", numeric: true, render: (value) => formatWon(value) },
        { key: "reason", label: "구분" }
      ]
    )}
  </section>

  <section class="section">
    <h2>7. 입금 원본 분류표</h2>
    <p class="desc">입금 원본 행에 어떤 카테고리가 붙었는지 확인하는 검토용 표입니다.</p>
    ${renderSummaryTable(
      report.deposits.map((row) => ({
        dateKey: row.dateKey,
        timeKey: row.timeKey,
        counterparty: row.counterparty,
        description: row.description,
        category: row.category,
        amount: row.deposit
      })),
      [
        { key: "dateKey", label: "날짜" },
        { key: "timeKey", label: "시각" },
        { key: "counterparty", label: "원본 이름" },
        { key: "description", label: "적요" },
        { key: "category", label: "카테고리" },
        { key: "amount", label: "금액", numeric: true, render: (value) => formatWon(value) }
      ]
    )}
  </section>

  <section class="section">
    <h2>8. 관련 개별 거래</h2>
    <div class="detail-grid">${report.relatedDetailGroups.map(renderRelatedDetailBox).join("") || "<div class='detail-box'>데이터 없음</div>"}</div>
  </section>

  <section class="section">
    <h2>9. 검토 메모</h2>
    <div class="note-box"><ul>${report.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul></div>
  </section>

  <div class="footer">${escapeHtml(report.reportMonth)} report generated from current binding rules</div>
</div>
</body>
</html>`;
}

export function renderMasterHtml(master) {
  const topWithdrawal = master.withdrawalSummary[0];
  const topDeposit = master.depositSummary[0];

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(master.reportMonth)} Master Report</title>
<style>
  :root { --bg:#ffffff; --ink:#111111; --muted:#555555; --line:#d9d9d9; --soft:#f5f5f5; --soft2:#fafafa; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",Arial,sans-serif; line-height:1.5; }
  .wrap { max-width:1360px; margin:0 auto; padding:24px; }
  .header { border:2px solid #111; padding:20px 22px; margin-bottom:18px; }
  .header h1 { margin:0 0 6px; font-size:28px; letter-spacing:-0.02em; }
  .sub { color:var(--muted); font-size:14px; }
  .meta { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin-top:14px; }
  .meta-box { border:1px solid #111; padding:12px 14px; min-height:86px; }
  .meta-box .label { font-size:12px; color:var(--muted); margin-bottom:6px; }
  .meta-box .value { font-size:20px; font-weight:700; letter-spacing:-0.02em; }
  .meta-box .note { font-size:12px; color:var(--muted); margin-top:6px; }
  .section { margin-bottom:18px; border:1px solid #111; padding:16px; }
  .section h2 { margin:0 0 8px; font-size:20px; letter-spacing:-0.02em; }
  .desc { margin:0 0 14px; color:var(--muted); font-size:13px; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  .detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  .chart-box { border:1px solid var(--line); padding:10px; background:#fff; }
  .chart-title { margin:0 0 8px; font-size:13px; font-weight:700; }
  svg { width:100%; height:auto; display:block; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  thead th { background:var(--soft); font-weight:700; }
  th, td { border:1px solid var(--line); padding:8px 9px; white-space:nowrap; }
  th:first-child, td:first-child { text-align:left; }
  td.num, th.num { text-align:right; }
  tbody tr:nth-child(even) { background:var(--soft2); }
  .table-wrap { overflow:auto; }
  .detail-box { border:1px solid var(--line); padding:12px; }
  .detail-head { display:flex; justify-content:space-between; gap:12px; align-items:end; margin-bottom:8px; }
  .detail-head h3 { margin:0; font-size:16px; }
  .detail-meta { font-size:12px; color:var(--muted); }
  .subtotal td { font-weight:700; background:#F3F4F6; }
  .note-box { border:1px solid var(--line); background:#fcfcfc; padding:12px 14px; }
  .note-box ul { margin:0; padding-left:18px; }
  .note-box li { margin-bottom:6px; }
  .footer { margin-top:10px; color:var(--muted); font-size:12px; text-align:right; }
  @media (max-width:1100px) { .meta, .two-col, .detail-grid { grid-template-columns:1fr; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>${escapeHtml(master.reportMonth)} Master Report</h1>
    <div class="sub">${escapeHtml(master.manifest.accountNumber)} / ${escapeHtml(master.manifest.displayName)} / 계좌별 리포트와 동일한 구조로 전체 데이터를 합산</div>
    <div class="meta">
      <div class="meta-box"><div class="label">운영지출 합계</div><div class="value">${formatWon(master.totals.totalWithdrawal)}</div><div class="note">관련자금 출금 제외</div></div>
      <div class="meta-box"><div class="label">운영지출 건수</div><div class="value">${master.totals.withdrawalCount.toLocaleString("ko-KR")}건</div><div class="note">전체 계좌 합산</div></div>
      <div class="meta-box"><div class="label">총 입금 합계</div><div class="value">${formatWon(master.totals.totalDeposit)}</div><div class="note">전체 계좌 합산</div></div>
      <div class="meta-box"><div class="label">총 입금 건수</div><div class="value">${master.totals.depositCount.toLocaleString("ko-KR")}건</div><div class="note">전체 계좌 합산</div></div>
      <div class="meta-box"><div class="label">최대 지출 카테고리</div><div class="value">${escapeHtml(topWithdrawal?.category || "-")}</div><div class="note">${formatWon(topWithdrawal?.total || 0)}</div></div>
      <div class="meta-box"><div class="label">최대 입금 카테고리</div><div class="value">${escapeHtml(topDeposit?.category || "-")}</div><div class="note">${formatWon(topDeposit?.total || 0)}</div></div>
    </div>
  </div>

  <section class="section">
    <h2>1. 운영지출 개요</h2>
    <p class="desc">계좌별 리포트와 동일하게 관련자금 출금은 제외하고, 전체 운영지출만 카테고리별로 합산합니다.</p>
    <div class="two-col">
      <div class="chart-box"><p class="chart-title">일자별 운영지출</p>${renderDailyBarChart(master.withdrawalDailySeries, ["#111827", "#2563EB", "#DC2626"])}</div>
      <div class="chart-box"><p class="chart-title">운영지출 카테고리별 합계</p>${renderCategoryBarChart(master.withdrawalSummary, ["#4F46E5", "#0EA5E9", "#111827", "#10B981", "#F59E0B", "#EF4444"])}</div>
    </div>
    ${renderSummaryTable(master.withdrawalSummary, [
      { key: "category", label: "카테고리" },
      { key: "count", label: "건수", numeric: true },
      { key: "total", label: "합계", numeric: true, render: (value) => formatWon(value) },
      { key: "share", label: "비중", numeric: true, render: (value) => formatPercent(value) },
      { key: "average", label: "건당평균", numeric: true, render: (value) => formatWon(value) }
    ])}
  </section>

  <section class="section">
    <h2>2. 입금 개요</h2>
    <p class="desc">계좌별 리포트와 동일한 카테고리 철학으로 전체 입금을 합산합니다.</p>
    <div class="two-col">
      <div class="chart-box"><p class="chart-title">일자별 입금</p>${renderDailyBarChart(master.depositDailySeries, ["#16A34A", "#2563EB", "#7C3AED"])}</div>
      <div class="chart-box"><p class="chart-title">입금 카테고리별 합계</p>${renderCategoryBarChart(master.depositSummary, ["#7C3AED", "#F59E0B", "#2563EB", "#16A34A", "#111827"])}</div>
    </div>
    ${renderSummaryTable(master.depositSummary, [
      { key: "category", label: "카테고리" },
      { key: "count", label: "건수", numeric: true },
      { key: "total", label: "합계", numeric: true, render: (value) => formatWon(value) },
      { key: "share", label: "비중", numeric: true, render: (value) => formatPercent(value) },
      { key: "average", label: "건당평균", numeric: true, render: (value) => formatWon(value) }
    ])}
  </section>

  <section class="section">
    <h2>3. 관련자금 흐름 요약</h2>
    ${renderSummaryTable(master.relatedTransferSummary, [
      { key: "relatedGroup", label: "관련 그룹" },
      { key: "depositCount", label: "입금건수", numeric: true },
      { key: "depositTotal", label: "입금합계", numeric: true, render: (value) => formatWon(value) },
      { key: "withdrawalCount", label: "출금건수", numeric: true },
      { key: "withdrawalTotal", label: "출금합계", numeric: true, render: (value) => formatWon(value) },
      { key: "netInflow", label: "순유입", numeric: true, render: (value) => formatWon(value) }
    ])}
  </section>

  <section class="section">
    <h2>4. 주요 운영지출 상세</h2>
    <div class="detail-grid">${master.majorWithdrawalGroups.map((group) => renderCategoryDetailBox(group, "withdrawal")).join("") || "<div class='detail-box'>데이터 없음</div>"}</div>
  </section>

  <section class="section">
    <h2>5. 주요 입금 상세</h2>
    <div class="detail-grid">${master.majorDepositGroups.map((group) => renderCategoryDetailBox(group, "deposit")).join("") || "<div class='detail-box'>데이터 없음</div>"}</div>
  </section>

  <section class="section">
    <h2>6. 제외 또는 관련 출금</h2>
    ${renderSummaryTable(
      master.excludedRows.map((row) => ({
        accountLabel: row.accountLabel,
        dateKey: row.dateKey,
        timeKey: row.timeKey,
        counterparty: row.counterparty,
        description: row.description,
        amount: row.withdrawal,
        reason: row.relatedGroup || row.exclusionReason || "-"
      })),
      [
        { key: "accountLabel", label: "계좌" },
        { key: "dateKey", label: "날짜" },
        { key: "timeKey", label: "시각" },
        { key: "counterparty", label: "원본 이름" },
        { key: "description", label: "적요" },
        { key: "amount", label: "금액", numeric: true, render: (value) => formatWon(value) },
        { key: "reason", label: "구분" }
      ]
    )}
  </section>

  <section class="section">
    <h2>7. 입금 원본 분류표</h2>
    ${renderSummaryTable(
      master.deposits.map((row) => ({
        accountLabel: row.accountLabel,
        dateKey: row.dateKey,
        timeKey: row.timeKey,
        counterparty: row.counterparty,
        description: row.description,
        category: row.category,
        amount: row.deposit
      })),
      [
        { key: "accountLabel", label: "계좌" },
        { key: "dateKey", label: "날짜" },
        { key: "timeKey", label: "시각" },
        { key: "counterparty", label: "원본 이름" },
        { key: "description", label: "적요" },
        { key: "category", label: "카테고리" },
        { key: "amount", label: "금액", numeric: true, render: (value) => formatWon(value) }
      ]
    )}
  </section>

  <section class="section">
    <h2>8. 관련 개별 거래</h2>
    <div class="detail-grid">${master.relatedDetailGroups.map(renderRelatedDetailBox).join("") || "<div class='detail-box'>데이터 없음</div>"}</div>
  </section>

  <section class="section">
    <h2>9. 검토 메모</h2>
    <div class="note-box"><ul>${master.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul></div>
  </section>

  <div class="footer">${escapeHtml(master.reportMonth)} master report generated from current binding rules</div>
</div>
</body>
</html>`;
}

function renderCategoryDetailBox(group, movementType) {
  const amountKey = movementType === "withdrawal" ? "withdrawal" : "deposit";
  const showAccount = group.rows.some((row) => row.accountLabel);
  const headerCells = showAccount ? "<th>계좌</th><th>날짜</th><th>시각</th><th>원본 이름</th><th>적요</th><th>금액</th>" : "<th>날짜</th><th>시각</th><th>원본 이름</th><th>적요</th><th>금액</th>";
  return `
    <section class="detail-box">
      <div class="detail-head">
        <h3>${escapeHtml(group.category)}</h3>
        <div class="detail-meta">거래 ${group.count.toLocaleString("ko-KR")}건 / 합계 ${formatWon(group.total)}</div>
      </div>
      <div class="table-wrap">
        <table class="detail-table">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>
            ${group.rows
              .map(
                (row) =>
                  `<tr>${showAccount ? `<td>${escapeHtml(row.accountLabel)}</td>` : ""}<td>${escapeHtml(row.dateKey)}</td><td>${escapeHtml(row.timeKey)}</td><td>${escapeHtml(
                    row.counterparty
                  )}</td><td>${escapeHtml(row.description)}</td><td class='num'>${formatWon(row[amountKey])}</td></tr>`
              )
              .join("")}
            <tr class="subtotal"><td colspan="${showAccount ? 5 : 4}">합계</td><td class="num">${formatWon(group.total)}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderRelatedDetailBox(group) {
  const showAccount = group.rows.some((row) => row.accountLabel);
  const headerCells = showAccount
    ? "<th>계좌</th><th>날짜</th><th>시각</th><th>구분</th><th>원본 이름</th><th>적요</th><th>금액</th>"
    : "<th>날짜</th><th>시각</th><th>구분</th><th>원본 이름</th><th>적요</th><th>금액</th>";
  return `
    <section class="detail-box">
      <div class="detail-head">
        <h3>${escapeHtml(group.relatedGroup)}</h3>
        <div class="detail-meta">입금 ${formatWon(group.depositTotal)} / 출금 ${formatWon(group.withdrawalTotal)} / 순유입 ${formatWon(group.netInflow)}</div>
      </div>
      <div class="table-wrap">
        <table class="detail-table">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>
            ${group.rows
              .map((row) => {
                const amount = row.movementType === "deposit" ? row.deposit : row.withdrawal;
                const label = row.movementType === "deposit" ? "입금" : "출금";
                return `<tr>${showAccount ? `<td>${escapeHtml(row.accountLabel)}</td>` : ""}<td>${escapeHtml(row.dateKey)}</td><td>${escapeHtml(row.timeKey)}</td><td>${label}</td><td>${escapeHtml(
                  row.counterparty
                )}</td><td>${escapeHtml(row.description)}</td><td class='num'>${formatWon(amount)}</td></tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderDailyBarChart(series, palette) {
  if (!series.length) {
    return `<div>데이터 없음</div>`;
  }

  const width = 860;
  const height = 280;
  const left = 55;
  const bottom = 52;
  const top = 18;
  const right = 20;
  const chartHeight = height - top - bottom;
  const chartWidth = width - left - right;
  const max = Math.max(...series.map((item) => item.total), 1);
  const step = chartWidth / series.length;
  const barWidth = Math.max(12, step * 0.62);
  const gridLines = 5;

  let svg = `<svg viewBox="0 0 ${width} ${height}">`;

  for (let index = 0; index < gridLines; index += 1) {
    const value = Math.round((max * (gridLines - index - 1)) / (gridLines - 1));
    const y = top + (chartHeight * index) / (gridLines - 1);
    svg += `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="#E5E7EB"/>`;
    svg += `<text x="${left - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6B7280">${Number(value).toLocaleString("ko-KR")}</text>`;
  }

  series.forEach((item, index) => {
    const x = left + index * step + (step - barWidth) / 2;
    const barHeight = max ? (item.total / max) * chartHeight : 0;
    const y = top + chartHeight - barHeight;
    const color = palette[index % palette.length];
    svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="6" fill="${color}"/>`;
    svg += `<text x="${(x + barWidth / 2).toFixed(1)}" y="${height - 22}" text-anchor="middle" font-size="10" fill="#111827">${escapeHtml(
      item.label
    )}</text>`;
  });

  svg += `</svg>`;
  return svg;
}

function renderCategoryBarChart(rows, palette) {
  if (!rows.length) {
    return `<div>데이터 없음</div>`;
  }

  const limited = rows.slice(0, 10);
  const width = 860;
  const rowHeight = 32.2;
  const top = 26;
  const bottom = 24;
  const chartLeft = 150;
  const chartWidth = 685;
  const labelX = 140;
  const max = Math.max(...limited.map((item) => item.total), 1);
  const height = Math.max(220, top + bottom + limited.length * rowHeight);

  let svg = `<svg viewBox="0 0 ${width} ${height}">`;
  limited.forEach((item, index) => {
    const y = top + index * rowHeight;
    const barWidth = (item.total / max) * chartWidth;
    const color = palette[index % palette.length];
    svg += `<text x="${labelX}" y="${(y + 11).toFixed(1)}" text-anchor="end" font-size="12" fill="#111827">${escapeHtml(
      item.category
    )}</text>`;
    svg += `<rect x="${chartLeft}" y="${y}" width="${chartWidth}" height="16" rx="8" fill="#F3F4F6"/>`;
    svg += `<rect x="${chartLeft}" y="${y}" width="${barWidth.toFixed(1)}" height="16" rx="8" fill="${color}"/>`;
    svg += `<text x="${(chartLeft + Math.min(barWidth + 8, chartWidth - 42)).toFixed(1)}" y="${(y + 11).toFixed(
      1
    )}" font-size="11" fill="#111827">${formatWon(item.total)}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
