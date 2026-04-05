# cafe-monthly-report-system

브라우저 기반으로 월별 카페 계좌 리포트를 생성하는 정적 호스팅 친화형 MVP입니다.

이 저장소는 `cafe_monthly_report_final_pack`를 source of truth로 삼아 시작했으며, 현재 기준 계좌 1호에 대해 기존 2026-01, 2026-02, 2026-03 산출물과의 정합 검증을 완료했습니다. 검증 결과는 [VALIDATION_REPORT.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/VALIDATION_REPORT.md)에 정리되어 있습니다.

## 프로젝트 개요

- 브라우저에서 거래 파일을 업로드해 월간 리포트를 생성합니다.
- 업로드 섹션은 기본 3개이며, 계좌 수 확장이 가능한 구조입니다.
- 각 계좌별 HTML report와 CSV들을 생성합니다.
- 마지막에 master HTML report와 master summary CSV를 생성합니다.
- 민감 규칙과 원본 데이터는 public 저장소에 포함하지 않습니다.

## 현재 지원 범위

- 브라우저 기반 MVP UI
- 계좌 업로드 섹션 3개
- 계좌별 거래 파일 업로드
- 계좌별 private rule JSON 업로드
- 계좌별 월간 HTML/CSV 생성
- master report 생성 구조
- 기준 계좌 1호에 대한 legacy output 정합 검증 완료

## 저장소 구조

```text
.
├─ index.html
├─ src/
│  ├─ main.js
│  ├─ styles.css
│  ├─ config/
│  └─ core/
├─ config_examples/
├─ private/
├─ scripts/
├─ README.md
├─ ARCHITECTURE.md
├─ REPOSITORY_PLAN.md
├─ MIGRATION_NOTES.md
├─ VALIDATION_REPORT.md
└─ .gitignore
```

## 로컬 실행 방법

정적 파일 구조이므로 간단한 서버만 있으면 실행할 수 있습니다.

```powershell
python -m http.server 8080
```

브라우저에서 `http://localhost:8080`을 엽니다.

## 사용 방법

1. 리포트 월을 선택합니다.
2. 계좌별 거래 파일을 업로드합니다.
3. 필요하면 계좌별 private rule JSON을 업로드합니다.
4. `시작` 버튼을 누릅니다.
5. 계좌별 report와 master report를 다운로드합니다.

## private 규칙 사용 방법

실제 운영 규칙은 public 저장소에 커밋하지 않습니다.

- 로컬 파일 방식: `private/accounts/<account-id>.json`
- 업로드 방식: 웹 UI에서 계좌별 JSON 직접 업로드

공개 예시는 [config_examples/README.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/config_examples/README.md)와 `config_examples/accounts/*.example.json`에 있습니다.

## 보안 원칙

- `private/` 아래 실제 규칙 파일은 커밋하지 않습니다.
- `data/raw/` 아래 원본 거래 파일은 커밋하지 않습니다.
- `output/` 아래 legacy 산출물은 커밋하지 않습니다.
- `private/generated/`, `private/_cache/`, `private/_inspection/` 같은 로컬 생성물은 커밋하지 않습니다.
- 예시 설정은 마스킹된 샘플만 유지합니다.
- 온라인 배포 시 private rule은 로컬 파일 또는 업로드 기반으로만 사용합니다.

## 정합 검증 상태

기준 계좌 1호에 대해 다음 항목이 legacy output과 일치합니다.

- 월별 출금 카테고리 합계
- 월별 입금 카테고리 합계
- 관련자금 그룹 2종 처리
- `ATM입금` 처리
- excluded 분리 결과
- master summary 월 합계 구조

## 정적 배포 메모

- 이 프로젝트는 GitHub Pages 같은 정적 배포에 맞춰 설계했습니다.
- 서버 측 비밀값 없이 동작해야 합니다.
- private rule은 배포 산출물에 넣지 않고 업로드 방식으로만 사용해야 합니다.
- 배포 전 점검 절차는 [DEPLOYMENT_GUIDE.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/DEPLOYMENT_GUIDE.md)를 따릅니다.

## 향후 확장 구조

- 계좌 추가: `src/config/accountManifests.js`, `config_examples/accounts/`
- 포맷 추가: `src/core/workbookParser.js`
- 리포트 엔진 확장: `src/core/reportEngine.js`, `scripts/legacy_report_engine.py`
- master 비교 확장: `src/core/reportRenderer.js`

## 참고 문서

- [ARCHITECTURE.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/ARCHITECTURE.md)
- [REPOSITORY_PLAN.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/REPOSITORY_PLAN.md)
- [MIGRATION_NOTES.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/MIGRATION_NOTES.md)
- [VALIDATION_REPORT.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/VALIDATION_REPORT.md)
- [PUBLIC_RELEASE_CHECKLIST.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/PUBLIC_RELEASE_CHECKLIST.md)
