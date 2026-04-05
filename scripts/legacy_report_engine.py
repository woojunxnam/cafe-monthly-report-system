import csv
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import win32com.client as win32


ROOT = Path(__file__).resolve().parents[1]


RAW_COLUMNS = [
    "No",
    "거래일시",
    "보낸분/받는분",
    "출금액(원)",
    "입금액(원)",
    "잔액(원)",
    "내 통장 표시",
    "메모",
    "적요",
    "처리점",
    "구분",
]


@dataclass
class GeneratedMonth:
    month: str
    withdrawal_summary: list
    deposit_summary: list
    related_summary: list
    excluded_rows: list
    withdrawal_rows: list
    deposit_rows: list
    deposit_detail_rows: list


def load_rules(rule_path: Path) -> dict:
    return json.loads(rule_path.read_text(encoding="utf-8"))


def export_workbook_to_csv(raw_workbook: Path, csv_path: Path) -> Path:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    excel = win32.Dispatch("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False
    workbook = excel.Workbooks.Open(str(raw_workbook.resolve()))
    workbook.SaveAs(str(csv_path.resolve()), 6)
    workbook.Close(False)
    excel.Quit()
    return csv_path


def read_raw_transactions(csv_path: Path) -> list[dict]:
    with csv_path.open("r", encoding="cp949", newline="") as handle:
        rows = list(csv.reader(handle))

    header = rows[6]
    data_rows = []
    for row in rows[7:]:
        if len(row) < len(header):
            continue
        item = dict(zip(header, row[: len(header)]))
        dt = datetime.strptime(item["거래일시"], "%Y.%m.%d %H:%M:%S")
        item["날짜"] = dt.strftime("%Y-%m-%d")
        item["시각"] = dt.strftime("%H:%M:%S")
        item["월"] = dt.strftime("%Y-%m")
        item["출금액(원)"] = to_int(item["출금액(원)"])
        item["입금액(원)"] = to_int(item["입금액(원)"])
        item["잔액(원)"] = to_int(item["잔액(원)"])
        data_rows.append(item)
    return data_rows


def generate_month(rows: list[dict], rules: dict, month: str) -> GeneratedMonth:
    month_rows = [row.copy() for row in rows if row["월"] == month]
    excluded_rows = []
    withdrawal_rows = []
    deposit_rows = []
    related_entries = []

    for row in month_rows:
        counterparty = row["보낸분/받는분"]
        if row["출금액(원)"] > 0:
            related_group = related_group_for(counterparty, rules["relatedTransferGroups"])
            if related_group:
                related_entries.append(("withdrawal", related_group, row["출금액(원)"]))

            if any(counterparty.startswith(prefix) for prefix in rules["excludePrefixes"]):
                row["카테고리"] = ""
                excluded_rows.append(row)
            else:
                row["카테고리"] = withdrawal_category_for(counterparty, rules)
                withdrawal_rows.append(row)

        if row["입금액(원)"] > 0:
            row["카테고리"] = deposit_category_for(row, rules)
            deposit_rows.append(row)
            related_group = related_group_for(counterparty, rules["relatedTransferGroups"])
            if related_group:
                related_entries.append(("deposit", related_group, row["입금액(원)"]))

    withdrawal_summary = summarize_category(withdrawal_rows, "출금액(원)")
    deposit_summary = summarize_category(deposit_rows, "입금액(원)")
    related_summary = summarize_related(related_entries, rules["relatedTransferGroups"])

    major_withdrawal_categories = {
        item["카테고리"]
        for item in withdrawal_summary
        if item["합계"] >= rules["reportSettings"]["majorWithdrawalThreshold"]
    }
    major_deposit_categories = {
        item["카테고리"]
        for item in deposit_summary
        if item["합계"] >= rules["reportSettings"]["majorDepositThreshold"]
    }
    withdrawal_detail_rows = [row for row in withdrawal_rows if row["카테고리"] in major_withdrawal_categories]
    deposit_detail_rows = [row for row in deposit_rows if row["카테고리"] in major_deposit_categories]

    return GeneratedMonth(
        month=month,
        withdrawal_summary=withdrawal_summary,
        deposit_summary=deposit_summary,
        related_summary=related_summary,
        excluded_rows=excluded_rows,
        withdrawal_rows=withdrawal_detail_rows,
        deposit_rows=deposit_rows,
        deposit_detail_rows=deposit_detail_rows,
    )


def withdrawal_category_for(counterparty: str, rules: dict) -> str:
    ordered = sorted(
        rules["withdrawalCategoryMap"].items(),
        key=lambda item: len(item[0]),
        reverse=True,
    )
    for needle, category in ordered:
        if needle in counterparty:
            return category
    return rules["defaultWithdrawalCategory"]


def deposit_category_for(row: dict, rules: dict) -> str:
    counterparty = row["보낸분/받는분"]
    display = row["내 통장 표시"]
    memo = row["메모"]
    description = row["적요"]
    amount = row["입금액(원)"]

    for category in rules["depositBindingPriority"]:
        rule = next(item for item in rules["depositRules"] if item["category"] == category)
        kind = rule["kind"]
        if kind == "prefix" and counterparty.startswith(rule["value"]):
            return category
        if kind == "contains_any":
            if any(rule["value"] in field for field in [counterparty, display, memo, description]):
                return category
        if kind == "regex" and re.search(rule["pattern"], counterparty):
            return category
        if kind == "regex_amount":
            if re.fullmatch(rule["pattern"], counterparty) and amount < rule["amountLessThan"]:
                return category
        if kind == "fallback":
            if "amountAtLeast" in rule and amount >= rule["amountAtLeast"]:
                return category
            if "amountLessThan" in rule and amount < rule["amountLessThan"]:
                return category
    return "기타입금"


def related_group_for(counterparty: str, groups: list[dict]) -> str:
    for group in groups:
        if counterparty.startswith(group["prefix"]):
            return group["name"]
    return ""


def summarize_category(rows: list[dict], amount_key: str) -> list[dict]:
    total = sum(row[amount_key] for row in rows)
    grouped = defaultdict(lambda: {"건수": 0, "합계": 0})
    for row in rows:
        item = grouped[row["카테고리"]]
        item["건수"] += 1
        item["합계"] += row[amount_key]

    summary = []
    for category, item in grouped.items():
        summary.append(
            {
                "카테고리": category,
                "건수": item["건수"],
                "합계": item["합계"],
                "비중": item["합계"] / total if total else 0,
                "건당평균": round(item["합계"] / item["건수"]) if item["건수"] else 0,
            }
        )
    summary.sort(key=lambda item: (-item["합계"], item["카테고리"]))
    return summary


def summarize_related(entries: list[tuple], groups: list[dict]) -> list[dict]:
    grouped = {
        group["name"]: {
            "관련그룹": group["name"],
            "입금건수": 0,
            "입금합계": 0,
            "출금건수": 0,
            "출금합계": 0,
            "순유입": 0,
        }
        for group in groups
    }
    for movement, name, amount in entries:
        bucket = grouped[name]
        if movement == "deposit":
            bucket["입금건수"] += 1
            bucket["입금합계"] += amount
        else:
            bucket["출금건수"] += 1
            bucket["출금합계"] += amount
        bucket["순유입"] = bucket["입금합계"] - bucket["출금합계"]
    return [grouped[group["name"]] for group in groups]


def write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def row_dicts(rows: list[dict]) -> list[dict]:
    ordered = []
    for row in rows:
        ordered.append({key: row.get(key, "") for key in RAW_COLUMNS + ["날짜", "시각", "월", "카테고리"]})
    return ordered


def build_master_summary(month_results: list[GeneratedMonth]) -> list[dict]:
    rows = []
    for result in month_results:
        rows.append(
            {
                "월": result.month,
                "총지출": sum(item["합계"] for item in result.withdrawal_summary),
                "총입금": sum(item["합계"] for item in result.deposit_summary),
                "순유입": sum(item["합계"] for item in result.deposit_summary)
                - sum(item["합계"] for item in result.withdrawal_summary),
                "지출건수": sum(item["건수"] for item in result.withdrawal_summary),
                "입금건수": sum(item["건수"] for item in result.deposit_summary),
            }
        )
    return rows


def build_html(result: GeneratedMonth, account_name: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>{result.month} 월간 리포트</title>
<style>
body {{ font-family: 'Malgun Gothic', sans-serif; color:#111; background:#fff; margin:0; padding:24px; }}
.section {{ border:1px solid #111; padding:16px; margin-bottom:16px; }}
table {{ width:100%; border-collapse:collapse; font-size:13px; }}
th, td {{ border:1px solid #d9d9d9; padding:8px; }}
th {{ background:#f5f5f5; }}
.num {{ text-align:right; }}
</style>
</head>
<body>
<section class="section">
  <h1>{result.month} 월간 리포트</h1>
  <p>{account_name}</p>
</section>
<section class="section">
  <h2>운영 지출 카테고리</h2>
  {table_html(result.withdrawal_summary)}
</section>
<section class="section">
  <h2>입금 카테고리</h2>
  {table_html(result.deposit_summary)}
</section>
<section class="section">
  <h2>관련 자금 흐름</h2>
  {table_html(result.related_summary)}
</section>
</body>
</html>"""


def table_html(rows: list[dict]) -> str:
    if not rows:
        return "<p>데이터 없음</p>"
    headers = list(rows[0].keys())
    head = "".join(f"<th>{header}</th>" for header in headers)
    body = []
    for row in rows:
        cols = []
        for header in headers:
            value = row[header]
            cls = " class='num'" if isinstance(value, (int, float)) else ""
            cols.append(f"<td{cls}>{value}</td>")
        body.append("<tr>" + "".join(cols) + "</tr>")
    return "<table><thead><tr>" + head + "</tr></thead><tbody>" + "".join(body) + "</tbody></table>"


def to_int(value: str) -> int:
    text = str(value or "").replace(",", "").strip()
    return int(text) if text else 0
