# Validation Report

기준 계좌 1호에 대해 기존 output과 private 재생성 결과를 비교했다.

## 확인한 기존 규칙 소스

- `config/category_map.yaml`
- `config/deposit_rules.yaml`
- `config/exclude_rules.yaml`
- `config/report_settings.yaml`
- `data/raw/` 내부 기준 계좌 원본 `.xls`

## 확인한 기존 output 구조

- `output/2026-01/*`
- `output/2026-02/*`
- `output/2026-03/*`
- 비교 기준 파일: `withdrawal_category_summary.csv`, `deposit_category_summary.csv`, `related_transfer_summary.csv`, `excluded_related_withdrawals.csv`, `deposit_raw_with_categories.csv`, `major_withdrawal_details.csv`, `major_deposit_details.csv`

## 월별 비교 요약

| 월 | 출금 카테고리 합계 | 입금 카테고리 합계 | 관련자금 그룹 2종 | ATM입금 | excluded 분리 | master summary 합계 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-01 | 일치 | 일치 | 일치 | 일치 | 일치 | 일치 |

## 2026-01
- 출금 카테고리: 일치
- 입금 카테고리: 일치
- 관련자금 흐름: 일치
- ATM입금: 일치
- excluded No 집합: 일치
- deposit raw No 집합: 일치
- major withdrawal No+카테고리: 일치
- major deposit No+카테고리: 일치
- master 월합계: legacy=(15392680, 18305216), generated=(15392680, 18305216)

| 2026-02 | 일치 | 일치 | 일치 | 일치 | 일치 | 일치 |

## 2026-02
- 출금 카테고리: 일치
- 입금 카테고리: 일치
- 관련자금 흐름: 일치
- ATM입금: 일치
- excluded No 집합: 일치
- deposit raw No 집합: 일치
- major withdrawal No+카테고리: 일치
- major deposit No+카테고리: 일치
- master 월합계: legacy=(12124626, 13937977), generated=(12124626, 13937977)

| 2026-03 | 일치 | 일치 | 일치 | 일치 | 일치 | 일치 |

## 2026-03
- 출금 카테고리: 일치
- 입금 카테고리: 일치
- 관련자금 흐름: 일치
- ATM입금: 일치
- excluded No 집합: 일치
- deposit raw No 집합: 일치
- major withdrawal No+카테고리: 일치
- major deposit No+카테고리: 일치
- master 월합계: legacy=(15448152, 17465328), generated=(15448152, 17465328)

## Master Summary

| 월 | legacy(총지출, 총입금) | generated(총지출, 총입금) |
| --- | --- | --- |
| 2026-01 | (15392680, 18305216) | (15392680, 18305216) |
| 2026-02 | (12124626, 13937977) | (12124626, 13937977) |
| 2026-03 | (15448152, 17465328) | (15448152, 17465328) |

## 판정

### 완전 일치

- 2026-01, 2026-02, 2026-03의 출금 카테고리 합계
- 2026-01, 2026-02, 2026-03의 입금 카테고리 합계
- 관련자금 그룹 2종 관련자금 흐름 요약
- ATM입금 처리
- excluded 분리 결과
- deposit raw 카테고리 배정 No 집합
- major withdrawal / major deposit 상세행 No+카테고리
- master summary 월 합계 구조

### 부분 일치 / 추가 수정 필요

- 없음

### 아직 확인 불가 / 데이터 부족

- 없음