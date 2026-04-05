import { toCsv } from "./csv.js";
import { renderAccountHtml, renderMasterHtml } from "./reportRenderer.js";

export function buildReports({ manifest, transactions, overrides, reportMonth }) {
  const mergedRules = mergeRules(manifest.rules, overrides);
  const rules = normalizeRules(mergedRules);
  const monthRows = transactions
    .filter((row) => row.monthKey === reportMonth)
    .sort(sortRowsAsc);

  const meta = resolveAccountMeta(manifest, overrides);
  const excludedRows = [];
  const relatedRows = [];
  const operatingWithdrawals = [];
  const deposits = [];

  for (const row of monthRows) {
    if (row.withdrawal > 0) {
      const relatedGroup = matchRelatedGroup(row, rules.relatedTransferGroups);
      if (relatedGroup) {
        relatedRows.push({ ...row, relatedGroup, movementType: "withdrawal", amount: row.withdrawal });
      }

      const isExcluded = matchesAnyPrefix(resolveRuleText(row), rules.excludePrefixes);
      if (isExcluded) {
        excludedRows.push({ ...row, relatedGroup, exclusionReason: "exclude-prefix" });
      } else {
        operatingWithdrawals.push({
          ...row,
          category: resolveWithdrawalCategory(row, rules.withdrawalCategoryMap, rules.defaultWithdrawalCategory)
        });
      }
    }

    if (row.deposit > 0) {
      const category = resolveDepositCategory(row, rules.depositRules);
      const depositRow = { ...row, category };
      deposits.push(depositRow);

      const relatedGroup = matchRelatedGroup(row, rules.relatedTransferGroups);
      if (relatedGroup) {
        relatedRows.push({ ...depositRow, relatedGroup, movementType: "deposit", amount: row.deposit });
      }
    }
  }

  const withdrawalSummary = summarizeByCategory(operatingWithdrawals, "withdrawal");
  const depositSummary = summarizeByCategory(deposits, "deposit");
  const relatedTransferSummary = summarizeRelatedTransfers(relatedRows, rules.relatedTransferGroups);

  const majorWithdrawalCategories = new Set(
    withdrawalSummary
      .filter((item) => item.total >= rules.reportSettings.majorWithdrawalThreshold)
      .map((item) => item.category)
  );
  const majorDepositCategories = new Set(
    depositSummary
      .filter((item) => item.total >= rules.reportSettings.majorDepositThreshold)
      .map((item) => item.category)
  );

  const majorWithdrawals = operatingWithdrawals.filter((row) => majorWithdrawalCategories.has(row.category));
  const majorDeposits = deposits.filter((row) => majorDepositCategories.has(row.category));

  const report = {
    manifest: meta,
    reportMonth,
    rules,
    totals: {
      totalWithdrawal: sum(operatingWithdrawals, "withdrawal"),
      totalDeposit: sum(deposits, "deposit"),
      withdrawalCount: operatingWithdrawals.length,
      depositCount: deposits.length,
      netFlow: sum(deposits, "deposit") - sum(operatingWithdrawals, "withdrawal")
    },
    operatingWithdrawals,
    deposits,
    excludedRows,
    relatedRows,
    withdrawalSummary,
    depositSummary,
    relatedTransferSummary,
    majorWithdrawals,
    majorDeposits,
    withdrawalDailySeries: buildDailySeries(operatingWithdrawals, "withdrawal"),
    depositDailySeries: buildDailySeries(deposits, "deposit"),
    majorWithdrawalGroups: buildDetailGroups(majorWithdrawals, "withdrawal"),
    majorDepositGroups: buildDetailGroups(majorDeposits, "deposit"),
    relatedDetailGroups: buildRelatedDetailGroups(relatedRows, rules.relatedTransferGroups),
    notes: buildReviewNotes({
      reportMonth,
      meta,
      operatingWithdrawals,
      deposits,
      withdrawalSummary,
      depositSummary
    })
  };

  return {
    report,
    files: [
      buildFile(`account-${manifest.slot}-${reportMonth}-report.html`, renderAccountHtml(report), "text/html"),
      buildFile(
        `account-${manifest.slot}-${reportMonth}-withdrawal_category_summary.csv`,
        toCsv(mapSummaryForCsv(withdrawalSummary, "출금")),
        "text/csv"
      ),
      buildFile(
        `account-${manifest.slot}-${reportMonth}-deposit_category_summary.csv`,
        toCsv(mapSummaryForCsv(depositSummary, "입금")),
        "text/csv"
      ),
      buildFile(
        `account-${manifest.slot}-${reportMonth}-deposit_raw_with_categories.csv`,
        toCsv(mapRowsForCategoryCsv(deposits, "deposit")),
        "text/csv"
      ),
      buildFile(
        `account-${manifest.slot}-${reportMonth}-major_withdrawal_details.csv`,
        toCsv(mapRowsForCategoryCsv(majorWithdrawals, "withdrawal")),
        "text/csv"
      ),
      buildFile(
        `account-${manifest.slot}-${reportMonth}-major_deposit_details.csv`,
        toCsv(mapRowsForCategoryCsv(majorDeposits, "deposit")),
        "text/csv"
      ),
      buildFile(
        `account-${manifest.slot}-${reportMonth}-excluded_related_withdrawals.csv`,
        toCsv(mapRowsForExcludedCsv(excludedRows)),
        "text/csv"
      ),
      buildFile(
        `account-${manifest.slot}-${reportMonth}-related_transfer_summary.csv`,
        toCsv(mapRelatedSummaryForCsv(relatedTransferSummary)),
        "text/csv"
      )
    ]
  };
}

export function buildMasterReport(accountReports, reportMonth) {
  const rows = accountReports.map(({ report }) => ({
    account: report.manifest.displayName,
    accountNumber: report.manifest.accountNumber,
    totalWithdrawal: report.totals.totalWithdrawal,
    totalDeposit: report.totals.totalDeposit,
    netFlow: report.totals.netFlow,
    withdrawalCount: report.totals.withdrawalCount,
    depositCount: report.totals.depositCount
  }));

  const operatingWithdrawals = accountReports.flatMap(({ report }) =>
    report.operatingWithdrawals.map((row) => ({
      ...row,
      accountLabel: report.manifest.displayName,
      accountNumberLabel: report.manifest.accountNumber
    }))
  );
  const deposits = accountReports.flatMap(({ report }) =>
    report.deposits.map((row) => ({
      ...row,
      accountLabel: report.manifest.displayName,
      accountNumberLabel: report.manifest.accountNumber
    }))
  );
  const excludedRows = accountReports.flatMap(({ report }) =>
    report.excludedRows.map((row) => ({
      ...row,
      accountLabel: report.manifest.displayName,
      accountNumberLabel: report.manifest.accountNumber
    }))
  );
  const relatedRows = accountReports.flatMap(({ report }) =>
    report.relatedRows.map((row) => ({
      ...row,
      accountLabel: report.manifest.displayName,
      accountNumberLabel: report.manifest.accountNumber
    }))
  );

  const withdrawalSummary = summarizeByCategory(operatingWithdrawals, "withdrawal");
  const depositSummary = summarizeByCategory(deposits, "deposit");
  const relatedTransferSummary = summarizeRelatedTransfers(relatedRows);
  const majorWithdrawalThreshold = Math.min(
    ...accountReports.map(({ report }) => report.rules.reportSettings.majorWithdrawalThreshold)
  );
  const majorDepositThreshold = Math.min(
    ...accountReports.map(({ report }) => report.rules.reportSettings.majorDepositThreshold)
  );
  const majorWithdrawalCategories = new Set(
    withdrawalSummary.filter((item) => item.total >= majorWithdrawalThreshold).map((item) => item.category)
  );
  const majorDepositCategories = new Set(
    depositSummary.filter((item) => item.total >= majorDepositThreshold).map((item) => item.category)
  );
  const majorWithdrawals = operatingWithdrawals.filter((row) => majorWithdrawalCategories.has(row.category));
  const majorDeposits = deposits.filter((row) => majorDepositCategories.has(row.category));

  const master = {
    reportMonth,
    manifest: {
      displayName: "통합 master report",
      accountNumber: `${accountReports.length}개 계좌 합산`,
      notes: ["계좌별 리포트와 동일한 구조로 전체 데이터를 합산한 통합 리포트입니다."]
    },
    summaryRows: rows,
    totals: {
      totalWithdrawal: sum(operatingWithdrawals, "withdrawal"),
      totalDeposit: sum(deposits, "deposit"),
      withdrawalCount: operatingWithdrawals.length,
      depositCount: deposits.length,
      netFlow: sum(deposits, "deposit") - sum(operatingWithdrawals, "withdrawal"),
      accountCount: accountReports.length
    },
    operatingWithdrawals,
    deposits,
    excludedRows,
    relatedRows,
    withdrawalSummary,
    depositSummary,
    relatedTransferSummary,
    majorWithdrawals,
    majorDeposits,
    withdrawalDailySeries: buildDailySeries(operatingWithdrawals, "withdrawal"),
    depositDailySeries: buildDailySeries(deposits, "deposit"),
    majorWithdrawalGroups: buildDetailGroups(majorWithdrawals, "withdrawal"),
    majorDepositGroups: buildDetailGroups(majorDeposits, "deposit"),
    relatedDetailGroups: buildRelatedDetailGroups(relatedRows),
    notes: buildMasterReviewNotes({
      reportMonth,
      accountCount: accountReports.length,
      operatingWithdrawals,
      deposits,
      withdrawalSummary,
      depositSummary
    })
  };

  return {
    master,
    files: [
      buildFile(`master-${reportMonth}-report.html`, renderMasterHtml(master), "text/html"),
      buildFile(`master-${reportMonth}-summary.csv`, toCsv(mapMasterRowsForCsv(rows)), "text/csv")
    ]
  };
}

function mergeRules(base, overrides = {}) {
  return {
    account: { ...(base.account || {}), ...(overrides.account || {}) },
    withdrawalCategoryMap: { ...(base.withdrawalCategoryMap || {}), ...(overrides.withdrawalCategoryMap || {}) },
    depositRules: [...(overrides.depositRules || base.depositRules || [])],
    depositBindingPriority: [...(overrides.depositBindingPriority || base.depositBindingPriority || [])],
    excludePrefixes: [...new Set([...(base.excludePrefixes || []), ...(overrides.excludePrefixes || [])])],
    relatedTransferGroups: [...(overrides.relatedTransferGroups || base.relatedTransferGroups || [])],
    reportSettings: { ...(base.reportSettings || {}), ...(overrides.reportSettings || {}) },
    defaultWithdrawalCategory: overrides.defaultWithdrawalCategory || base.defaultWithdrawalCategory || "기타"
  };
}

function normalizeRules(rules) {
  return {
    ...rules,
    depositRules: normalizeDepositRules(rules.depositRules, rules.depositBindingPriority),
    reportSettings: {
      majorWithdrawalThreshold: rules.reportSettings?.majorWithdrawalThreshold ?? 250000,
      majorDepositThreshold: rules.reportSettings?.majorDepositThreshold ?? 100000
    }
  };
}

function normalizeDepositRules(rules = [], priority = []) {
  const ordered = priority.length
    ? priority.map((category) => rules.find((rule) => rule.category === category)).filter(Boolean)
    : rules;

  return ordered.map((rule) => ({
    ...rule,
    type: rule.type || rule.kind || "",
    value: rule.value ?? rule.pattern ?? "",
    minAmount: rule.minAmount ?? rule.amountAtLeast ?? null,
    maxAmountExclusive: rule.maxAmountExclusive ?? rule.amountLessThan ?? null,
    fields: rule.fields || (rule.field ? [rule.field] : [])
  }));
}

function resolveAccountMeta(manifest, overrides = {}) {
  const accountMeta = overrides.account || {};
  return {
    ...manifest,
    accountNumber: accountMeta.accountNumber || manifest.accountNumber,
    displayName: accountMeta.accountName || accountMeta.displayName || manifest.displayName,
    notes: accountMeta.notes || manifest.notes || []
  };
}

function resolveWithdrawalCategory(row, categoryMap, fallback) {
  const text = resolveRuleText(row);
  const match = Object.entries(categoryMap || {})
    .sort((a, b) => b[0].length - a[0].length)
    .find(([needle]) => text.includes(needle));
  return match ? match[1] : fallback;
}

function resolveDepositCategory(row, rules) {
  const ordered = rules || [];
  for (const rule of ordered) {
    if (rule.type === "fallback") {
      if (rule.minAmount != null && row.deposit < rule.minAmount) {
        continue;
      }
      if (rule.maxAmountExclusive != null && row.deposit >= rule.maxAmountExclusive) {
        continue;
      }
      return rule.category;
    }

    if (rule.minAmount != null && row.deposit < rule.minAmount) {
      continue;
    }
    if (rule.maxAmountExclusive != null && row.deposit >= rule.maxAmountExclusive) {
      continue;
    }

    const targets = selectRuleTargets(row, rule);
    if (!targets.length) {
      continue;
    }

    if (rule.type === "prefix" && targets.some((target) => target.startsWith(rule.value))) {
      return rule.category;
    }
    if ((rule.type === "contains" || rule.type === "contains_any") && targets.some((target) => target.includes(rule.value))) {
      return rule.category;
    }
    if (rule.type === "regex" && targets.some((target) => new RegExp(rule.value).test(target))) {
      return rule.category;
    }
    if (rule.type === "regex_amount" && targets.some((target) => new RegExp(rule.value).test(target))) {
      return rule.category;
    }
  }

  return "기타입금";
}

function selectRuleTargets(row, rule) {
  const fields = rule.fields?.length ? rule.fields : [rule.field].filter(Boolean);
  if (!fields.length) {
    return [resolveRuleText(row)].filter(Boolean);
  }
  return fields.map((field) => selectRuleField(row, field)).filter(Boolean);
}

function selectRuleField(row, field) {
  if (!field) {
    return "";
  }
  if (field === "combined") {
    return row.combined || "";
  }
  if (field === "counterparty") {
    return row.counterparty || row.description || "";
  }
  if (field === "display") {
    return row.display || row.note || "";
  }
  if (field === "memo") {
    return row.memo || row.note || "";
  }
  if (field === "description") {
    return row.description || "";
  }
  return row[field] || "";
}

function matchRelatedGroup(row, groups) {
  return (groups || []).find((group) => (row.counterparty || row.description || "").startsWith(group.prefix))?.name || "";
}

function matchesAnyPrefix(text, prefixes) {
  return (prefixes || []).some((prefix) => (text || "").startsWith(prefix));
}

function resolveRuleText(row) {
  return [row.counterparty, row.description, row.display, row.memo, row.note]
    .filter(Boolean)
    .join(" ");
}

function summarizeByCategory(rows, amountField) {
  const total = sum(rows, amountField);
  const map = new Map();

  for (const row of rows) {
    const current = map.get(row.category) || { category: row.category, count: 0, total: 0, share: 0, average: 0 };
    current.count += 1;
    current.total += row[amountField];
    map.set(row.category, current);
  }

  return [...map.values()]
    .map((item) => ({
      ...item,
      share: total ? item.total / total : 0,
      average: item.count ? Math.round(item.total / item.count) : 0
    }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category, "ko"));
}

function summarizeRelatedTransfers(rows, groups) {
  const grouped = new Map();
  for (const group of groups || []) {
    grouped.set(group.name, {
      relatedGroup: group.name,
      depositCount: 0,
      depositTotal: 0,
      withdrawalCount: 0,
      withdrawalTotal: 0,
      netInflow: 0
    });
  }

  for (const row of rows) {
    const current = grouped.get(row.relatedGroup) || {
      relatedGroup: row.relatedGroup,
      depositCount: 0,
      depositTotal: 0,
      withdrawalCount: 0,
      withdrawalTotal: 0,
      netInflow: 0
    };
    if (row.movementType === "deposit") {
      current.depositCount += 1;
      current.depositTotal += row.deposit;
    } else {
      current.withdrawalCount += 1;
      current.withdrawalTotal += row.withdrawal;
    }
    current.netInflow = current.depositTotal - current.withdrawalTotal;
    grouped.set(row.relatedGroup, current);
  }

  return [...grouped.values()].sort((a, b) => b.netInflow - a.netInflow);
}

function buildDailySeries(rows, amountField) {
  const grouped = new Map();
  for (const row of rows) {
    grouped.set(row.dateKey, (grouped.get(row.dateKey) || 0) + (row[amountField] || 0));
  }

  return [...grouped.entries()]
    .map(([dateKey, total]) => ({ dateKey, label: dateKey.slice(5), total }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

function buildDetailGroups(rows, amountField) {
  const grouped = new Map();
  for (const row of rows) {
    const current = grouped.get(row.category) || { category: row.category, amountField, total: 0, count: 0, rows: [] };
    current.rows.push(row);
    current.count += 1;
    current.total += row[amountField] || 0;
    grouped.set(row.category, current);
  }

  return [...grouped.values()]
    .map((group) => ({
      ...group,
      rows: group.rows.sort(sortRowsAsc)
    }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category, "ko"));
}

function buildRelatedDetailGroups(rows, groups) {
  const order = new Map((groups || []).map((group, index) => [group.name, index]));
  const grouped = new Map();

  for (const row of rows) {
    const current = grouped.get(row.relatedGroup) || {
      relatedGroup: row.relatedGroup,
      depositTotal: 0,
      withdrawalTotal: 0,
      netInflow: 0,
      rows: []
    };
    current.rows.push(row);
    if (row.movementType === "deposit") {
      current.depositTotal += row.deposit;
    } else {
      current.withdrawalTotal += row.withdrawal;
    }
    current.netInflow = current.depositTotal - current.withdrawalTotal;
    grouped.set(row.relatedGroup, current);
  }

  return [...grouped.values()]
    .map((group) => ({ ...group, rows: group.rows.sort(sortRowsAsc) }))
    .sort((a, b) => (order.get(a.relatedGroup) ?? 999) - (order.get(b.relatedGroup) ?? 999));
}

function buildReviewNotes({ reportMonth, meta, operatingWithdrawals, deposits, withdrawalSummary, depositSummary }) {
  const topWithdrawal = withdrawalSummary[0];
  const topDeposit = depositSummary[0];
  const atmDeposits = deposits.filter((row) => row.category === "ATM입금");
  const directDeposits = deposits.filter((row) => row.category === "고객직접입금");
  const cardSettlements = deposits.filter((row) => row.category === "카드매출정산");

  return [
    `${reportMonth} 기준 운영지출 합계는 ${formatWon(sum(operatingWithdrawals, "withdrawal"))}, 총 입금 합계는 ${formatWon(sum(deposits, "deposit"))}입니다.`,
    `최대 운영지출 카테고리는 ${topWithdrawal?.category || "-"}, 최대 입금 카테고리는 ${topDeposit?.category || "-"}입니다.`,
    `카드매출정산 ${cardSettlements.length}건, 고객직접입금 ${directDeposits.length}건, ATM입금 ${atmDeposits.length}건으로 분류되었습니다.`,
    `이 리포트는 계좌 ${meta.accountNumber} 기준이며, 계좌별 override 규칙에 따라 분류가 달라질 수 있습니다.`
  ];
}

function buildMasterReviewNotes({ reportMonth, accountCount, operatingWithdrawals, deposits, withdrawalSummary, depositSummary }) {
  const topWithdrawal = withdrawalSummary[0];
  const topDeposit = depositSummary[0];
  const atmDeposits = deposits.filter((row) => row.category === "ATM입금");
  const directDeposits = deposits.filter((row) => row.category === "고객직접입금");
  const cardSettlements = deposits.filter((row) => row.category === "카드매출정산");

  return [
    `${reportMonth} 기준 ${accountCount}개 계좌를 합산한 master report입니다.`,
    `운영지출 합계는 ${formatWon(sum(operatingWithdrawals, "withdrawal"))}, 총 입금 합계는 ${formatWon(sum(deposits, "deposit"))}입니다.`,
    `최대 운영지출 카테고리는 ${topWithdrawal?.category || "-"}, 최대 입금 카테고리는 ${topDeposit?.category || "-"}입니다.`,
    `카드매출정산 ${cardSettlements.length}건, 고객직접입금 ${directDeposits.length}건, ATM입금 ${atmDeposits.length}건으로 분류되었습니다.`
  ];
}

function mapSummaryForCsv(rows, type) {
  return rows.map((row) => ({
    유형: type,
    카테고리: row.category,
    건수: row.count,
    합계: row.total,
    비중: Number(row.share.toFixed(6)),
    건당평균: row.average
  }));
}

function mapRowsForCategoryCsv(rows, movementType) {
  return rows.map((row) => ({
    No: row.rowNumber,
    거래일시: `${row.dateKey} ${row.timeKey}`,
    보낸분받는분: row.counterparty,
    출금액원: row.withdrawal,
    입금액원: row.deposit,
    잔액원: row.balance,
    내통장표시: row.display,
    메모: row.memo,
    적요: row.description,
    날짜: row.dateKey,
    시각: row.timeKey,
    월: row.monthKey,
    카테고리: row.category,
    구분: movementType === "withdrawal" ? "출금" : "입금"
  }));
}

function mapRowsForExcludedCsv(rows) {
  return rows.map((row) => ({
    No: row.rowNumber,
    거래일시: `${row.dateKey} ${row.timeKey}`,
    보낸분받는분: row.counterparty,
    출금액원: row.withdrawal,
    잔액원: row.balance,
    내통장표시: row.display,
    메모: row.memo,
    적요: row.description,
    날짜: row.dateKey,
    시각: row.timeKey,
    월: row.monthKey,
    카테고리: row.relatedGroup || "",
    제외사유: row.exclusionReason || ""
  }));
}

function mapRelatedSummaryForCsv(rows) {
  return rows.map((row) => ({
    관련그룹: row.relatedGroup,
    입금건수: row.depositCount,
    입금합계: row.depositTotal,
    출금건수: row.withdrawalCount,
    출금합계: row.withdrawalTotal,
    순유입: row.netInflow
  }));
}

function mapMasterRowsForCsv(rows) {
  return rows.map((row) => ({
    계좌: row.account,
    계좌번호: row.accountNumber,
    총지출: row.totalWithdrawal,
    총입금: row.totalDeposit,
    순유입: row.netFlow,
    지출건수: row.withdrawalCount,
    입금건수: row.depositCount
  }));
}

function sum(rows, key) {
  return rows.reduce((acc, row) => acc + (row[key] || 0), 0);
}

function sortRowsAsc(a, b) {
  if (a.dateKey !== b.dateKey) {
    return a.dateKey.localeCompare(b.dateKey);
  }
  if ((a.timeKey || "") !== (b.timeKey || "")) {
    return (a.timeKey || "").localeCompare(b.timeKey || "");
  }
  return (a.rowNumber || 0) - (b.rowNumber || 0);
}

function buildFile(name, content, mimeType) {
  return { name, content, mimeType };
}

function formatWon(value) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}
