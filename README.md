# cafe-monthly-report-system

브라우저 기반으로 월별 카페 계좌 리포트를 생성하는 정적 호스팅 친화형 MVP입니다.  
거래 파일을 업로드하면 계좌별 HTML report, 계좌별 CSV 묶음, master HTML report, master summary CSV를 브라우저 안에서 바로 생성합니다.

현재 공개 배포 URL:

- `https://woojunxnam.github.io/cafe-monthly-report-system/`

## 프로젝트 개요

- 브라우저에서 거래 파일을 직접 파싱합니다.
- 기본 UI는 3개 계좌 업로드 섹션으로 시작합니다.
- 각 계좌는 개별 규칙 override를 가질 수 있습니다.
- 마지막에 계좌별 결과와 통합 master report를 함께 생성합니다.
- 민감 규칙과 원본 거래 데이터는 public 저장소에 포함하지 않습니다.

## 현재 지원 범위

- 브라우저 기반 MVP UI
- 계좌 업로드 섹션 3개
- 계좌별 거래 파일 업로드
- 계좌별 비공개 규칙 JSON 업로드
- 브라우저 로컬 비밀 규칙 금고
- 계좌별 HTML/CSV report 생성
- master HTML report 및 master summary CSV 생성
- 기준 계좌 1호의 기존 2026-01, 2026-02, 2026-03 산출물과 1:1 정합 검증 완료

정합 검증 상세는 [VALIDATION_REPORT.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/VALIDATION_REPORT.md)에 있습니다.

## 비공개 규칙 금고

공개 저장소에는 실제 규칙을 커밋하지 않으면서, 사용자가 매번 JSON을 다시 업로드하지 않도록 브라우저 로컬 금고를 제공합니다.

- 저장 위치: 기본 IndexedDB, 불가 시 localStorage fallback
- 저장 단위: account slot 별 규칙 JSON
- 자동 로드: 다음 방문 시 저장된 규칙을 자동 반영
- 지원 기능:
  - 금고에 저장
  - 금고에서 불러오기
  - 금고에서 삭제
  - 내보내기
  - 가져오기

설계와 보안 주의사항은 [PRIVATE_RULE_VAULT.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/PRIVATE_RULE_VAULT.md)에 정리했습니다.

## 사용 방법

1. 리포트 월을 선택합니다.
2. 필요한 계좌의 거래 파일을 업로드합니다.
3. 처음 한 번만 비공개 규칙 JSON을 업로드합니다.
4. 계좌 카드의 `금고에 저장`을 눌러 로컬 금고에 저장합니다.
5. 다음 방문부터는 저장된 규칙이 자동 로드되므로 거래 파일만 올려도 리포트를 생성할 수 있습니다.
6. `시작` 버튼을 누르면 계좌별 report와 master report가 생성됩니다.

## 로컬 실행 방법

정적 파일 구조이므로 간단한 서버만 있으면 실행할 수 있습니다.

```powershell
python -m http.server 8080
```

브라우저에서 `http://localhost:8080`으로 접속합니다.

## private 규칙 사용 방법

실제 운영 규칙은 public 저장소가 아니라 로컬 또는 업로드 기반으로만 사용합니다.

- 비공개 로컬 파일: `private/accounts/<account-id>.json`
- 브라우저 업로드: 각 계좌 카드의 `비공개 규칙 JSON`
- 브라우저 로컬 저장: 계좌 카드의 `비공개 규칙 금고`

공개 예시는 [config_examples/README.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/config_examples/README.md)와 `config_examples/accounts/*.example.json`에 있습니다.

## 보안 원칙

- `private/` 아래 실제 규칙 파일은 커밋하지 않습니다.
- `data/raw/` 아래 원본 거래 파일은 커밋하지 않습니다.
- `output/` 아래 legacy 산출물은 커밋하지 않습니다.
- `private/generated/`, `private/_cache/`, `private/_inspection/` 같은 로컬 생성물도 커밋하지 않습니다.
- 온라인 배포본은 민감 규칙을 포함하지 않으며, 규칙은 업로드 또는 로컬 금고를 통해서만 사용합니다.
- 브라우저 로컬 금고는 사용자 기기 브라우저 저장소를 사용하므로 공용 PC에서는 사용 후 삭제가 필요합니다.

## 정적 배포 메모

- 현재 구조는 GitHub Pages 같은 정적 호스팅에 맞춰 설계되어 있습니다.
- 루트 진입점은 `index.html`입니다.
- 정적 자산은 `src/` 아래에 있습니다.
- `.nojekyll`을 포함해 Pages 하위 경로 문제를 줄였습니다.

배포 절차와 smoke test는 [DEPLOYMENT_GUIDE.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/DEPLOYMENT_GUIDE.md)를 참고하면 됩니다.

## 향후 확장 구조

- 계좌 추가: `src/config/accountManifests.js`
- 공개 예시 규칙 추가: `config_examples/accounts/`
- 은행 포맷 확장: `src/core/workbookParser.js`
- 리포트 엔진 확장: `src/core/reportEngine.js`
- 금고 백업 확장: 추후 private GitHub repo sync adapter 추가 가능

## 참고 문서

- [ARCHITECTURE.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/ARCHITECTURE.md)
- [REPOSITORY_PLAN.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/REPOSITORY_PLAN.md)
- [MIGRATION_NOTES.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/MIGRATION_NOTES.md)
- [VALIDATION_REPORT.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/VALIDATION_REPORT.md)
- [PRIVATE_RULE_VAULT.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/PRIVATE_RULE_VAULT.md)
- [VAULT_E2E_TEST_REPORT.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/VAULT_E2E_TEST_REPORT.md)
