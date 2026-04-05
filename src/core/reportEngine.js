import { toCsv } from "./csv.js";
import { renderAccountHtml, renderMasterHtml } from "./reportRenderer.js";

export function buildReports({ manifest, transactions, overrides, reportMonth }) {
  const rules = normalizeRules(mergeRules(manifest.rules, overrides));
  const monthRows = transactions.filter((row) => row.monthKey === reportMonth);

  const excludedRows = [];
  const relatedRows = [];
  const operatingWithdrawals = [];
  const deposits = [];

  for (const row of monthRows) {
    if (row.withdrawal > 0) {
      const relatedGroup = matchRelatedGroup(row, rules.relatedTransferGroups);
      if (relatedGroup) {
        relatedRows.push({ ...row, relatedGroup, movementType: "withdrawal" });
      }

      const isExcluded = matchesAnyPrefix(resolveRuleText(row), rules.excludePrefixes);
      if (isExcluded) {
        excludedRows.push({ ...row, exclusionReason: "exclude-prefix" });
      } else {
        operatingWithdrawals.push({
          ...row,
          category: resolveWithdrawalCategory(row, rules.withdrawalCategoryMap)
        });
      }
    }

    if (row.deposit > 0) {
      const relatedGroup = matchRelatedGroup(row, rules.relatedTransferGroups);
      if (relatedGroup) {
        relatedRows.push({ ...row, relatedGroup, movementType: "deposit" });
      }

      deposits.push({
        ...row,
        category: resolveDepositCategory(row, rules.depositRules)
      });
    }
  }

  const withdrawalSummary = summarizeByCategory(operatingWithdrawals, "withdrawal");
  const depositSummary = summarizeByCategory(deposits, "deposit");
  const relatedTransferSummary = summarizeRelatedTransfers(relatedRows);
  const majorWithdrawals = operatingWithdrawals.filter((row) => row.withdrawal >= rules.reportSettings.majorWithdrawalThreshold);
  const majorDeposits = deposits.filter((row) => row.deposit >= rules.reportSettings.majorDepositThreshold);

  const report = {
    manifest,
    reportMonth,
    rules,
    totals: {
      totalWithdrawal: sum(operatingWithdrawals, "withdrawal"),
      totalDeposit: sum(deposits, "deposit"),
      withdrawalCount: operatingWithdrawals.length,
      depositCount: deposits.length
    },
    operatingWithdrawals,
    deposits,
    excludedRows,
    relatedRows,
    withdrawalSummary,
    depositSummary,
    relatedTransferSummary,
    majorWithdrawals,
    majorDeposits
  };

  return {
    report,
    files: [
      buildFile(`account-${manifest.slot}-${reportMonth}-report.html`, renderAccountHtml(report), "text/html"),
      buildFile(`account-${manifest.slot}-${reportMonth}-withdrawal_category_summary.csv`, toCsv(withdrawalSummary), "text/csv"),
      buildFile(`account-${manifest.slot}-${reportMonth}-deposit_category_summary.csv`, toCsv(depositSummary), "text/csv"),
      buildFile(`account-${manifest.slot}-${reportMonth}-excluded_rows.csv`, toCsv(mapRowsForCsv(excludedRows, "withdrawal")), "text/csv"),
      buildFile(`account-${manifest.slot}-${reportMonth}-related_transfer_summary.csv`, toCsv(relatedTransferSummary), "text/csv")
    ]
  };
}

export function buildMasterReport(accountReports, reportMonth) {
  const rows = accountReports.map(({ report }) => ({
    계좌: report.manifest.displayName,
    계좌번호: report.manifest.accountNumber,
    총지출: report.totals.totalWithdrawal,
    총입금: report.totals.totalDeposit,
    순유입: report.totals.totalDeposit - report.totals.totalWithdrawal,
    지출건수: report.totals.withdrawalCount,
    입금건수: report.totals.depositCount
  }));

  const majorCategoryComparison = accountReports.flatMap(({ report }) =>
    report.withdrawalSummary.slice(0, 5).map((item) => ({
      계좌: report.manifest.displayName,
      유형: "출금",
      카테고리: item.category,
      합계: item.total,
      건수: item.count
    })).concat(
      report.depositSummary.slice(0, 5).map((item) => ({
        계좌: report.manifest.displayName,
        유형: "입금",
        카테고리: item.category,
        합계: item.total,
        건수: item.count
      }))
    )
  );

  const relatedTransferRows = accountReports.flatMap(({ report }) =>
    report.relatedTransferSummary.map((item) => ({
      계좌: report.manifest.displayName,
      ...item
    }))
  );

  const master = {
    reportMonth,
    rows,
    majorCategoryComparison,
    relatedTransferRows,
    totals: {
      totalWithdrawal: rows.reduce((acc, row) => acc + row.총지출, 0),
      totalDeposit: rows.reduce((acc, row) => acc + row.총입금, 0)
    }
  };

  return {
    master,
    files: [
      buildFile(`master-${reportMonth}-report.html`, renderMasterHtml(master), "text/html"),
      buildFile(`master-${reportMonth}-summary.csv`, toCsv(rows), "text/csv")
    ]
  };
}

function mergeRules(base, overrides = {}) {
  return {
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
    depositRules: normalizeDepositRules(rules.depositRules, rules.depositBindingPriority)
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

function resolveWithdrawalCategory(row, categoryMap) {
  const text = resolveRuleText(row);
  const match = Object.entries(categoryMap || {}).find(([needle]) => text.includes(needle));
  return match ? match[1] : "기타";
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

    if (rule.maxAmount != null && row.deposit >= rule.maxAmount) {
      continue;
    }
    if (rule.minAmount != null && row.deposit < rule.minAmount) {
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
    .sort((a, b) => b.total - a.total);
}

function summarizeRelatedTransfers(rows) {
  const grouped = new Map();
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

function mapRowsForCsv(rows, type) {
  return rows.map((row) => ({
    날짜: row.dateKey,
    계좌번호: row.accountNumber,
    적요: row.description,
    메모: row.note,
    금액: type === "withdrawal" ? row.withdrawal : row.deposit,
    사유: row.exclusionReason || row.category || row.relatedGroup || ""
  }));
}

function sum(rows, key) {
  return rows.reduce((acc, row) => acc + (row[key] || 0), 0);
}

function buildFile(name, content, mimeType) {
  return { name, content, mimeType };
}
