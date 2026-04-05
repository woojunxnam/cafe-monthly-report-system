import { accountManifests } from "./config/accountManifests.js";
import { starterRules } from "./config/starterRules.js";
import { parseTransactionFile } from "./core/workbookParser.js";
import { buildMasterReport, buildReports } from "./core/reportEngine.js";

const accountSections = document.querySelector("#account-sections");
const template = document.querySelector("#account-card-template");
const reportMonthInput = document.querySelector("#report-month");
const startButton = document.querySelector("#start-button");
const statusBox = document.querySelector("#status-box");
const resultSummary = document.querySelector("#result-summary");
const downloadList = document.querySelector("#download-list");
const previewFrame = document.querySelector("#preview-frame");

initializeMonth();
renderAccountCards();
startButton.addEventListener("click", handleStart);

function initializeMonth() {
  const now = new Date();
  reportMonthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function renderAccountCards() {
  accountSections.innerHTML = "";
  for (const manifest of accountManifests) {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".account-card");
    card.dataset.accountId = manifest.id;
    fragment.querySelector(".account-title").textContent = `${manifest.slot}. ${manifest.label}`;
    fragment.querySelector(".account-subtitle").textContent = `${manifest.accountNumber} / ${manifest.displayName}`;
    fragment.querySelector(".account-badge").textContent = manifest.kind === "baseline" ? "baseline" : "placeholder";
    fragment.querySelector(".account-meta").innerHTML = manifest.notes.map((note) => `<div>${note}</div>`).join("");
    accountSections.appendChild(fragment);
  }
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
    const rulesFile = card.querySelector(".rules-file").files[0];

    if (!transactionFile) {
      continue;
    }

    const overrides = rulesFile ? JSON.parse(await rulesFile.text()) : {};
    activeAccounts.push({
      manifest: {
        ...manifest,
        rules: starterRules[accountId]
      },
      transactionFile,
      overrides
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
