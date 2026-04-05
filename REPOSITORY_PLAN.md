# Repository Plan

## 목표

`cafe_monthly_report_final_pack`의 현재 결과물과 규칙 체계를 보존하면서, GitHub에서 장기 운영 가능한 저장소 형태로 전환한다.

## 1단계 범위

- 정적 호스팅형 웹 UI 시작
- 계좌 업로드 섹션 3개
- 계좌별 규칙 분리 구조
- 계좌별 월간 report 생성
- master report 생성
- 민감 설정의 비공개 분리

## 추천 저장소 구조

```text
.
├─ index.html
├─ src/
│  ├─ main.js
│  ├─ styles.css
│  ├─ config/
│  │  ├─ accountManifests.js
│  │  └─ starterRules.js
│  └─ core/
│     ├─ workbookParser.js
│     ├─ reportEngine.js
│     ├─ reportRenderer.js
│     └─ csv.js
├─ config_examples/
│  ├─ README.md
│  └─ accounts/
├─ private/
│  └─ README.md
├─ data/
│  └─ raw/
├─ output/
├─ templates/
├─ docs/
└─ scripts/
```

## 공개 / 비공개 경계

- 공개 가능
  - 앱 코드
  - 예시 설정
  - 문서
  - 템플릿 구조
- 비공개 유지
  - 실제 계좌 매핑
  - 실제 제외 규칙
  - 실제 입금 바인딩 override
  - 원본 거래 파일
  - 실제 생성 산출물

## 계좌 전략

- account-1
  - 기준 계좌
  - 실제 식별자는 `private/` 규칙 파일에서 로컬 관리
- account-2
  - placeholder
  - 규칙 JSON 나중에 주입
- account-3
  - placeholder
  - 규칙 JSON 나중에 주입

## 다음 구현 순서

1. 현재 UI를 기준으로 실제 운영 규칙 파일 연결
2. 은행 포맷별 컬럼 정규화 강화
3. 기존 `output/YYYY-MM/report_*.html`와 비교 검증
4. master report 다계좌 비교 고도화
5. ZIP 패키지 출력
6. GitHub Pages 배포 또는 private repo 운영 설정

## 이번 단계 산출물

- 저장소 뼈대
- 보안 경계 문서화
- 업로드 UI 초안
- 브라우저 처리 엔진 MVP
- 계좌별 config 구조
- master report 흐름 구현 초안
