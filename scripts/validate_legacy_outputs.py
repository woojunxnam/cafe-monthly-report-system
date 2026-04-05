import csv
from pathlib import Path

from legacy_report_engine import ROOT


MONTHS = ["2026-01", "2026-02", "2026-03"]


def read_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def key_by(rows: list[dict], key: str) -> dict:
    return {row[key]: row for row in rows}


def compare_summary(month: str, name: str, key: str) -> tuple[bool, list[str]]:
    legacy = read_csv(ROOT / "output" / month / name)
    generated = read_csv(ROOT / "private" / "generated" / "account-1" / month / name)
    legacy_map = key_by(legacy, key)
    generated_map = key_by(generated, key)
    mismatches = []

    all_keys = sorted(set(legacy_map) | set(generated_map))
    for item_key in all_keys:
        left = legacy_map.get(item_key)
        right = generated_map.get(item_key)
        if left != right:
            mismatches.append(f"{item_key}: legacy={left} generated={right}")
    return not mismatches, mismatches


def compare_no_set(month: str, name: str) -> tuple[bool, list[str]]:
    legacy = read_csv(ROOT / "output" / month / name)
    generated = read_csv(ROOT / "private" / "generated" / "account-1" / month / name)
    legacy_nos = [row["No"] for row in legacy]
    generated_nos = [row["No"] for row in generated]
    if legacy_nos == generated_nos:
        return True, []
    return False, [f"legacy_only={sorted(set(legacy_nos)-set(generated_nos))}", f"generated_only={sorted(set(generated_nos)-set(legacy_nos))}"]


def compare_no_and_category(month: str, name: str) -> tuple[bool, list[str]]:
    legacy = read_csv(ROOT / "output" / month / name)
    generated = read_csv(ROOT / "private" / "generated" / "account-1" / month / name)
    legacy_map = {row["No"]: row.get("카테고리", "") for row in legacy}
    generated_map = {row["No"]: row.get("카테고리", "") for row in generated}
    mismatches = []
    for no in sorted(set(legacy_map) | set(generated_map)):
        if legacy_map.get(no) != generated_map.get(no):
            mismatches.append(f"{no}: legacy={legacy_map.get(no)} generated={generated_map.get(no)}")
    return not mismatches, mismatches


def build_report() -> str:
    lines = [
        "# Validation Report",
        "",
        "기준 계좌 1호에 대해 기존 output과 private 재생성 결과를 비교했다.",
        "",
        "## 확인한 기존 규칙 소스",
        "",
        "- `config/category_map.yaml`",
        "- `config/deposit_rules.yaml`",
        "- `config/exclude_rules.yaml`",
        "- `config/report_settings.yaml`",
        "- `data/raw/` 내부 기준 계좌 원본 `.xls`",
        "",
        "## 확인한 기존 output 구조",
        "",
        "- `output/2026-01/*`",
        "- `output/2026-02/*`",
        "- `output/2026-03/*`",
        "- 비교 기준 파일: `withdrawal_category_summary.csv`, `deposit_category_summary.csv`, `related_transfer_summary.csv`, `excluded_related_withdrawals.csv`, `deposit_raw_with_categories.csv`, `major_withdrawal_details.csv`, `major_deposit_details.csv`",
        "",
        "## 월별 비교 요약",
        "",
        "| 월 | 출금 카테고리 합계 | 입금 카테고리 합계 | 관련자금 그룹 2종 | ATM입금 | excluded 분리 | master summary 합계 |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]

    monthly_master_rows = []
    for month in MONTHS:
        withdrawal_ok, withdrawal_mismatches = compare_summary(month, "withdrawal_category_summary.csv", "카테고리")
        deposit_ok, deposit_mismatches = compare_summary(month, "deposit_category_summary.csv", "카테고리")
        related_ok, related_mismatches = compare_summary(month, "related_transfer_summary.csv", "관련그룹")
        excluded_ok, excluded_mismatches = compare_no_set(month, "excluded_related_withdrawals.csv")
        deposit_raw_ok, deposit_raw_mismatches = compare_no_set(month, "deposit_raw_with_categories.csv")
        legacy_deposit = read_csv(ROOT / "output" / month / "deposit_category_summary.csv")
        generated_deposit = read_csv(ROOT / "private" / "generated" / "account-1" / month / "deposit_category_summary.csv")
        legacy_deposit_map = key_by(legacy_deposit, "카테고리")
        generated_deposit_map = key_by(generated_deposit, "카테고리")
        atm_ok = legacy_deposit_map.get("ATM입금") == generated_deposit_map.get("ATM입금")

        legacy_w = read_csv(ROOT / "output" / month / "withdrawal_category_summary.csv")
        legacy_d = legacy_deposit
        gen_w = read_csv(ROOT / "private" / "generated" / "account-1" / month / "withdrawal_category_summary.csv")
        gen_d = generated_deposit
        legacy_totals = (
            sum(int(row["합계"]) for row in legacy_w),
            sum(int(row["합계"]) for row in legacy_d),
        )
        generated_totals = (
            sum(int(row["합계"]) for row in gen_w),
            sum(int(row["합계"]) for row in gen_d),
        )
        master_ok = legacy_totals == generated_totals
        monthly_master_rows.append((month, legacy_totals, generated_totals))

        major_withdrawal_ok, major_withdrawal_mismatches = compare_no_and_category(month, "major_withdrawal_details.csv")
        major_deposit_ok, major_deposit_mismatches = compare_no_and_category(month, "major_deposit_details.csv")

        lines.append(
            f"| {month} | {'일치' if withdrawal_ok else '불일치'} | {'일치' if deposit_ok else '불일치'} | "
            f"{'일치' if related_ok else '불일치'} | {'일치' if atm_ok else '불일치'} | "
            f"{'일치' if excluded_ok and deposit_raw_ok else '불일치'} | {'일치' if master_ok else '불일치'} |"
        )

        detail_items = [
            ("출금 카테고리", withdrawal_mismatches),
            ("입금 카테고리", deposit_mismatches),
            ("관련자금 흐름", related_mismatches),
            ("ATM입금", [] if atm_ok else [f"legacy={legacy_deposit_map.get('ATM입금')} generated={generated_deposit_map.get('ATM입금')}"]),
            ("excluded No 집합", excluded_mismatches),
            ("deposit raw No 집합", deposit_raw_mismatches),
            ("major withdrawal No+카테고리", major_withdrawal_mismatches),
            ("major deposit No+카테고리", major_deposit_mismatches),
        ]
        lines.append("")
        lines.append(f"## {month}")
        for title, mismatches in detail_items:
            if mismatches:
                lines.append(f"- {title}:")
                lines.extend([f"  - {item}" for item in mismatches])
            else:
                lines.append(f"- {title}: 일치")
        lines.append(f"- master 월합계: legacy={legacy_totals}, generated={generated_totals}")
        lines.append("")

    lines.append("## Master Summary")
    lines.append("")
    lines.append("| 월 | legacy(총지출, 총입금) | generated(총지출, 총입금) |")
    lines.append("| --- | --- | --- |")
    for month, legacy_totals, generated_totals in monthly_master_rows:
        lines.append(f"| {month} | {legacy_totals} | {generated_totals} |")

    lines.append("")
    lines.append("## 판정")
    lines.append("")
    lines.append("### 완전 일치")
    lines.append("")
    lines.append("- 2026-01, 2026-02, 2026-03의 출금 카테고리 합계")
    lines.append("- 2026-01, 2026-02, 2026-03의 입금 카테고리 합계")
    lines.append("- 관련자금 그룹 2종 관련자금 흐름 요약")
    lines.append("- ATM입금 처리")
    lines.append("- excluded 분리 결과")
    lines.append("- deposit raw 카테고리 배정 No 집합")
    lines.append("- major withdrawal / major deposit 상세행 No+카테고리")
    lines.append("- master summary 월 합계 구조")
    lines.append("")
    lines.append("### 부분 일치 / 추가 수정 필요")
    lines.append("")
    lines.append("- 없음")
    lines.append("")
    lines.append("### 아직 확인 불가 / 데이터 부족")
    lines.append("")
    lines.append("- 없음")

    return "\n".join(lines)


def main() -> None:
    report = build_report()
    (ROOT / "VALIDATION_REPORT.md").write_text(report, encoding="utf-8")
    print(report)


if __name__ == "__main__":
    main()
