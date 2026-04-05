from pathlib import Path

from legacy_report_engine import (
    ROOT,
    build_html,
    build_master_summary,
    export_workbook_to_csv,
    generate_month,
    load_rules,
    read_raw_transactions,
    row_dicts,
    write_csv,
)


def main() -> None:
    rule_path = ROOT / "private" / "accounts" / "account-1.rules.json"
    rules = load_rules(rule_path)

    raw_workbook = ROOT / rules["sourceFiles"]["rawWorkbook"]
    csv_cache = ROOT / "private" / "_cache" / "account-1.csv"
    export_workbook_to_csv(raw_workbook, csv_cache)
    rows = read_raw_transactions(csv_cache)

    output_root = ROOT / "private" / "generated" / "account-1"
    month_results = []

    for month in rules["reportSettings"]["months"]:
        result = generate_month(rows, rules, month)
        month_results.append(result)
        month_dir = output_root / month

        write_csv(month_dir / "withdrawal_category_summary.csv", ["카테고리", "건수", "합계", "비중", "건당평균"], result.withdrawal_summary)
        write_csv(month_dir / "deposit_category_summary.csv", ["카테고리", "건수", "합계", "비중", "건당평균"], result.deposit_summary)
        write_csv(month_dir / "related_transfer_summary.csv", ["관련그룹", "입금건수", "입금합계", "출금건수", "출금합계", "순유입"], result.related_summary)
        write_csv(month_dir / "excluded_related_withdrawals.csv", ["No", "거래일시", "보낸분/받는분", "출금액(원)", "입금액(원)", "잔액(원)", "내 통장 표시", "메모", "적요", "처리점", "구분", "날짜", "시각", "월", "카테고리"], row_dicts(result.excluded_rows))
        write_csv(month_dir / "major_withdrawal_details.csv", ["No", "거래일시", "보낸분/받는분", "출금액(원)", "입금액(원)", "잔액(원)", "내 통장 표시", "메모", "적요", "처리점", "구분", "날짜", "시각", "월", "카테고리"], row_dicts(result.withdrawal_rows))
        write_csv(month_dir / "deposit_raw_with_categories.csv", ["No", "거래일시", "보낸분/받는분", "출금액(원)", "입금액(원)", "잔액(원)", "내 통장 표시", "메모", "적요", "처리점", "구분", "날짜", "시각", "월", "카테고리"], row_dicts(result.deposit_rows))
        write_csv(month_dir / "major_deposit_details.csv", ["No", "거래일시", "보낸분/받는분", "출금액(원)", "입금액(원)", "잔액(원)", "내 통장 표시", "메모", "적요", "처리점", "구분", "날짜", "시각", "월", "카테고리"], row_dicts(result.deposit_detail_rows))
        (month_dir / f"report_{month}.html").write_text(build_html(result, rules["account"]["accountName"]), encoding="utf-8")

    master_rows = build_master_summary(month_results)
    master_dir = output_root / "master"
    write_csv(master_dir / "master_summary.csv", ["월", "총지출", "총입금", "순유입", "지출건수", "입금건수"], master_rows)


if __name__ == "__main__":
    main()
