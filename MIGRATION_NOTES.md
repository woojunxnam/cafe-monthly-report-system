# Migration Notes

## 목적

기준 계좌 1호의 기존 YAML 규칙과 기존 산출물 구조를 `private/accounts/*.json` 기반 로컬 규칙 구조로 이관하고, 2026-01~2026-03 결과를 재생성해 legacy output과 정합성을 맞춘다.

## 확인한 원본 규칙

- `config/category_map.yaml`
- `config/deposit_rules.yaml`
- `config/exclude_rules.yaml`
- `config/report_settings.yaml`

## 확인한 원본 데이터

- `data/raw/` 내부 기준 계좌 원본 `.xls`

원본 `.xls` 실제 헤더:

- `No`
- `거래일시`
- `보낸분/받는분`
- `출금액(원)`
- `입금액(원)`
- `잔액(원)`
- `내 통장 표시`
- `메모`
- `적요`
- `처리점`
- `구분`

## private 이관 결과

실제 운영 규칙은 다음 파일로 이관했다.

- `private/accounts/account-1.rules.json`

이 파일에 포함한 항목:

- 실제 계좌 메타데이터
- 실제 출금 카테고리 매핑
- 실제 입금 바인딩 우선순위
- 실제 exclude prefix
- 실제 관련자금 그룹
- 리포트 임계값

## 구현 메모

### 정규화 계층

- Excel COM을 이용해 `.xls`를 로컬 CSV 캐시로 변환
- 헤더 이전 안내 행 6줄을 제거하고 7번째 줄을 실제 헤더로 사용
- 날짜를 `날짜`, `시각`, `월` 필드로 정규화
- 금액 문자열을 정수로 정규화

### 분류 규칙

- 출금 분류는 `보낸분/받는분` 기준 substring 매칭
- `쿠팡이츠`와 `쿠팡` 충돌을 막기 위해 더 긴 키를 우선 매칭
- 입금 분류는 legacy 우선순위를 그대로 적용
- `ATM입금`은 `보낸분/받는분`, `내 통장 표시`, `메모`, `적요` 전체에서 탐지
- 실제 관련자금 그룹 2종은 입출금 양방향으로 집계

### detail 파일 규칙

- `major_withdrawal_details.csv`
  - 개별 거래 금액 기준이 아니라 월별 카테고리 총액이 `majorWithdrawalThreshold` 이상인 카테고리만 포함
- `major_deposit_details.csv`
  - 월별 카테고리 총액이 `majorDepositThreshold` 이상인 카테고리만 포함

이 규칙을 반영한 뒤 legacy와 1:1 정합이 맞았다.

## 생성한 스크립트

- `scripts/legacy_report_engine.py`
- `scripts/regenerate_legacy_reports.py`
- `scripts/validate_legacy_outputs.py`

## 생성 위치

재생성 결과는 tracked 경로가 아니라 아래에 둔다.

- `private/generated/account-1/2026-01`
- `private/generated/account-1/2026-02`
- `private/generated/account-1/2026-03`
- `private/generated/account-1/master/master_summary.csv`

## 보안 처리

- 실제 규칙 파일은 `private/` 아래에만 둠
- `private/`는 `.gitignore`로 제외 상태 유지
- `config_examples/`는 마스킹된 예시만 유지
- 공개 추적 코드의 기준 계좌 표시는 마스킹된 placeholder로 조정
