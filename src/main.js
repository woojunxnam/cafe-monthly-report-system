import { accountManifests } from "./config/accountManifests.js";
import { starterRules } from "./config/starterRules.js";
import { parseTransactionFile } from "./core/workbookParser.js";
import { buildMasterReport, buildReports } from "./core/reportEngine.js";
import { createPrivateRuleVault } from "./core/privateRuleVault.js";

const accountSections = document.querySelector("#account-sections");
const template = document.querySelector("#account-card-template");
const reportMonthInput = document.querySelector("#report-month");
const startButton = document.querySelector("#start-button");
const statusBox = document.querySelector("#status-box");
const resultSummary = document.querySelector("#result-summary");
const downloadList = document.querySelector("#download-list");
const previewFrame = document.querySelector("#preview-frame");
const vault = createPrivateRuleVault();
const accountCardMap = new Map();
const runtimeRuleMap = new Map();
const vaultEntryMap = new Map();

initializeMonth();
await renderAccountCards();
startButton.addEventListener("click", handleStart);

function initializeMonth() {
  const now = new Date();
  reportMonthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function renderAccountCards() {
  accountSections.innerHTML = "";
  for (const manifest of accountManifests) {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".account-card");
    card.dataset.accountId = manifest.id;
    fragment.querySelector(".account-title").textContent = `${manifest.slot}. ${manifest.label}`;
    fragment.querySelector(".account-subtitle").textContent = `${manifest.accountNumber} / ${manifest.displayName}`;
    fragment.querySelector(".account-badge").textContent = manifest.kind === "baseline" ? "baseline" : "placeholder";
    fragment.querySelector(".account-meta").innerHTML = manifest.notes.map((note) => `<div>${note}</div>`).join("");
    bindVaultActions(card, manifest);
    accountSections.appendChild(fragment);
    accountCardMap.set(manifest.id, card);
  }

  await autoLoadVaultRules();
}

function bindVaultActions(card, manifest) {
  const rulesFileInput = card.querySelector(".rules-file");
  const importButton = card.querySelector(".vault-import-button");
  const importInput = card.querySelector(".vault-import-file");

  rulesFileInput.addEventListener("change", async () => {
    if (rulesFileInput.files[0]) {
      const rules = await safeParseRulesFile(rulesFileInput.files[0], "비공개 규칙 JSON 파싱에 실패했습니다.");
      runtimeRuleMap.set(manifest.id, { rules, source: "업로드 파일", autoLoaded: false });
      await renderVaultStatus(manifest.id);
    }
  });

  card.querySelector(".vault-save-button").addEventListener("click", async () => {
    try {
      const rules = await getCandidateRulesForSave(manifest.id);
      const entry = await vault.save(manifest.id, rules);
      vaultEntryMap.set(manifest.id, entry);
      runtimeRuleMap.set(manifest.id, { rules: entry.rules, source: "금고 저장본", autoLoaded: false, updatedAt: entry.updatedAt });
      await renderVaultStatus(manifest.id);
      setStatus(`${manifest.label} 규칙을 금고에 저장했습니다.`, "good");
    } catch (error) {
      setStatus(error.message, "warn");
    }
  });

  card.querySelector(".vault-load-button").addEventListener("click", async () => {
    try {
      const entry = await vault.get(manifest.id);
      if (!entry) {
        throw new Error("금고에 저장된 규칙이 없습니다.");
      }
      vaultEntryMap.set(manifest.id, entry);
      runtimeRuleMap.set(manifest.id, { rules: entry.rules, source: "금고 불러오기", autoLoaded: false, updatedAt: entry.updatedAt });
      await renderVaultStatus(manifest.id);
      setStatus(`${manifest.label} 규칙을 금고에서 불러왔습니다.`, "good");
    } catch (error) {
      setStatus(error.message, "warn");
    }
  });

  card.querySelector(".vault-delete-button").addEventListener("click", async () => {
    try {
      await vault.remove(manifest.id);
      vaultEntryMap.delete(manifest.id);
      if (runtimeRuleMap.get(manifest.id)?.source?.includes("금고")) {
        runtimeRuleMap.delete(manifest.id);
      }
      await renderVaultStatus(manifest.id);
      setStatus(`${manifest.label} 금고 규칙을 삭제했습니다.`, "good");
    } catch (error) {
      setStatus(error.message || "금고 규칙 삭제에 실패했습니다.", "warn");
    }
  });

  card.querySelector(".vault-export-button").addEventListener("click", async () => {
    try {
      const payload = await vault.exportEntry(manifest.id);
      downloadJson(`${manifest.id}-private-rules-export.json`, payload);
      setStatus(`${manifest.label} 금고 규칙을 내보냈습니다.`, "good");
    } catch (error) {
      setStatus(error.message, "warn");
    }
  });

  importButton.addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", async () => {
    try {
      const file = importInput.files[0];
      if (!file) {
        return;
      }
      const payload = await safeParseRulesFile(file, "가져오기 JSON 파싱에 실패했습니다.");
      if (payload.accountId && payload.accountId !== manifest.id) {
        throw new Error("가져오기 JSON의 accountId가 현재 슬롯과 다릅니다.");
      }
      const entry = await vault.importEntry({ accountId: manifest.id, rules: payload.rules ?? payload });
      vaultEntryMap.set(manifest.id, entry);
      runtimeRuleMap.set(manifest.id, { rules: entry.rules, source: "금고 가져오기", autoLoaded: false, updatedAt: entry.updatedAt });
      await renderVaultStatus(manifest.id);
      setStatus(`${manifest.label} 규칙을 금고로 가져왔습니다.`, "good");
    } catch (error) {
      setStatus(error.message, "warn");
    } finally {
      importInput.value = "";
    }
  });
}

async function autoLoadVaultRules() {
  for (const manifest of accountManifests) {
    const entry = await vault.get(manifest.id);
    if (entry) {
      vaultEntryMap.set(manifest.id, entry);
      runtimeRuleMap.set(manifest.id, {
        rules: entry.rules,
        source: "금고 자동 로드",
        autoLoaded: true,
        updatedAt: entry.updatedAt
      });
    } else {
      vaultEntryMap.delete(manifest.id);
    }
    await renderVaultStatus(manifest.id);
  }
}

async function renderVaultStatus(accountId) {
  const card = accountCardMap.get(accountId);
  const runtime = runtimeRuleMap.get(accountId);
  const savedEntry = vaultEntryMap.get(accountId);
  const savedState = card.querySelector(".vault-saved-state");
  const updatedAt = card.querySelector(".vault-updated-at");
  const activeSource = card.querySelector(".vault-active-source");
  const autoBadge = card.querySelector(".vault-auto-badge");

  savedState.textContent = savedEntry ? "저장됨" : "없음";
  updatedAt.textContent = savedEntry ? formatTimestamp(savedEntry.updatedAt) : "-";

  if (!runtime) {
    activeSource.textContent = "starter rules만 사용";
    autoBadge.textContent = "자동 로드 없음";
    autoBadge.className = "vault-auto-badge vault-auto-off";
    return;
  }

  activeSource.textContent = runtime.source;
  autoBadge.textContent = runtime.autoLoaded ? "자동 로드됨" : "자동 로드 사용 가능";
  autoBadge.className = `vault-auto-badge ${runtime.autoLoaded ? "vault-auto-on" : "vault-auto-off"}`;
}

async function handleStart() {
  setStatus("파일을 읽고 집계를 시작합니다.", "good");
  resultSummary.innerHTML = "";
  downloadList.innerHTML = "";
  previewFrame.srcdoc = "";

  try {
    const reportMonth = reportMonthInput.value;
    if (!reportMonth) {
      throw new Error("리포트 월을 먼저 선택해 주세요.");
    }

    const activeAccounts = await collectActiveAccounts();
    if (!activeAccounts.length) {
      throw new Error("최소 1개 계좌의 거래 파일을 업로드해 주세요.");
    }

    const parsedAccounts = [];
    for (const account of activeAccounts) {
      const transactions = await parseTransactionFile(account.transactionFile, account.manifest);
      parsedAccounts.push({ ...account, transactions });
    }

    const effectiveMonth = resolveEffectiveMonth(parsedAccounts, reportMonth);

    const accountReports = [];
    const allDownloadGroups = [];

    for (const account of parsedAccounts) {
      const { report, files } = buildReports({
        manifest: account.manifest,
        transactions: account.transactions,
        overrides: account.overrides,
        reportMonth: effectiveMonth
      });

      accountReports.push({ report, files });
      allDownloadGroups.push({
        title: `${account.manifest.label} 결과`,
        files
      });
    }

    const { master, files: masterFiles } = buildMasterReport(accountReports, effectiveMonth);
    allDownloadGroups.unshift({
      title: "Master 결과",
      files: masterFiles
    });

    renderDownloadGroups(allDownloadGroups);
    renderSummary(accountReports, master);
    previewFrame.srcdoc = masterFiles[0].content;
    const monthNotice = effectiveMonth === reportMonth ? effectiveMonth : `${effectiveMonth} (선택 월에서 자동 보정)`;
    setStatus(`완료되었습니다. ${accountReports.length}개 계좌와 master report를 생성했습니다. 기준 월: ${monthNotice}`, "good");
  } catch (error) {
    setStatus(error.message || "처리 중 오류가 발생했습니다.", "warn");
  }
}

async function collectActiveAccounts() {
  const cards = [...document.querySelectorAll(".account-card")];
  const activeAccounts = [];

  for (const card of cards) {
    const accountId = card.dataset.accountId;
    const manifest = accountManifests.find((item) => item.id === accountId);
    const transactionFile = card.querySelector(".transaction-file").files[0];
    const runtimeRules = runtimeRuleMap.get(accountId);

    if (!transactionFile) {
      continue;
    }

    activeAccounts.push({
      manifest: {
        ...manifest,
        rules: starterRules[accountId]
      },
      transactionFile,
      overrides: runtimeRules?.rules || {}
    });
  }

  return activeAccounts;
}

function renderDownloadGroups(groups) {
  downloadList.innerHTML = "";
  for (const group of groups) {
    const wrapper = document.createElement("section");
    wrapper.className = "download-group";

    const title = document.createElement("h3");
    title.textContent = group.title;
    wrapper.appendChild(title);

    const actions = document.createElement("div");
    actions.className = "download-actions";

    for (const file of group.files) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "download-button";
      button.textContent = file.name;
      button.addEventListener("click", () => downloadFile(file));
      actions.appendChild(button);
    }

    wrapper.appendChild(actions);
    downloadList.appendChild(wrapper);
  }
}

function renderSummary(accountReports, master) {
  resultSummary.innerHTML = [
    `<div><strong>리포트 월:</strong> ${master.reportMonth}</div>`,
    `<div><strong>계좌 수:</strong> ${accountReports.length}</div>`,
    `<div><strong>전체 총지출:</strong> ${formatWon(master.totals.totalWithdrawal)}</div>`,
    `<div><strong>전체 총입금:</strong> ${formatWon(master.totals.totalDeposit)}</div>`,
    `<div><strong>생성 파일:</strong> 계좌별 HTML/CSV + master HTML/CSV</div>`
  ].join("");
}

function downloadFile(file) {
  const blob = new Blob([file.content], { type: `${file.mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function setStatus(message, tone) {
  statusBox.textContent = message;
  statusBox.className = `status-box ${tone === "warn" ? "status-warn" : "status-good"}`;
}

function formatWon(value) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function resolveEffectiveMonth(accounts, selectedMonth) {
  const hasSelectedMonth = accounts.some((account) =>
    account.transactions.some((row) => row.monthKey === selectedMonth)
  );

  if (hasSelectedMonth) {
    return selectedMonth;
  }

  const months = accounts
    .flatMap((account) => account.transactions.map((row) => row.monthKey))
    .filter(Boolean)
    .sort();

  if (!months.length) {
    throw new Error("업로드 파일에서 월 정보를 찾지 못했습니다.");
  }

  const latestMonth = months[months.length - 1];
  reportMonthInput.value = latestMonth;
  return latestMonth;
}

async function getCandidateRulesForSave(accountId) {
  const runtime = runtimeRuleMap.get(accountId);
  if (runtime?.rules) {
    return runtime.rules;
  }
  throw new Error("금고에 저장할 규칙이 없습니다. 먼저 비공개 규칙 JSON을 업로드하거나 금고 규칙을 불러와 주세요.");
}

async function safeParseRulesFile(file, errorMessage) {
  try {
    return JSON.parse(await file.text());
  } catch {
    throw new Error(errorMessage);
  }
}

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("ko-KR");
}
