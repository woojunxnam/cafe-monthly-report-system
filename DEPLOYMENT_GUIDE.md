# Deployment Guide

## 배포 대상

이 프로젝트는 정적 파일 배포를 기준으로 설계되어 있습니다.

권장 대상:

- GitHub Pages
- Netlify
- Vercel static
- 기타 정적 호스팅

## 배포 전 원칙

- private rule 파일은 배포 산출물에 포함하지 않습니다.
- 원본 거래 데이터는 배포 산출물에 포함하지 않습니다.
- 온라인 배포본에서는 비공개 규칙을 업로드 또는 브라우저 로컬 금고 방식으로만 사용합니다.
- 브라우저 로컬 금고는 사용자 브라우저 저장소를 사용하므로 기기 교체 시 자동 이전되지 않습니다.

## GitHub Pages 기준

기본 진입점:

- `index.html`

정적 자산:

- `src/`

추가 메모:

- `.nojekyll`을 포함해 정적 파일이 그대로 배포되도록 유지합니다.
- 자산 경로는 상대경로 `./src/...` 기준으로 유지합니다.

## 로컬 정적 서버 실행 방법

```powershell
python -m http.server 8080
```

브라우저에서 `http://localhost:8080`으로 접속합니다.

## 배포 전 smoke test

1. 첫 화면이 정상 로드되는지 확인합니다.
2. 계좌 업로드 섹션 3개가 보이는지 확인합니다.
3. `시작` 버튼이 보이는지 확인합니다.
4. `비공개 규칙 금고` 섹션이 각 계좌 카드에 보이는지 확인합니다.
5. 규칙 JSON 업로드 후 `금고에 저장`이 동작하는지 확인합니다.
6. 새로고침 후 `자동 로드됨` 상태가 보이는지 확인합니다.
7. 거래 파일만 다시 업로드해도 리포트 생성이 되는지 확인합니다.

## 배포 후 확인 항목

1. Pages URL이 `200`으로 응답하는지 확인합니다.
2. `src/styles.css`, `src/main.js`가 정상 로드되는지 확인합니다.
3. CDN `xlsx.full.min.js`가 정상 로드되는지 확인합니다.
4. live 페이지에서 3개 업로드 섹션과 시작 버튼이 보이는지 확인합니다.
5. 브라우저 콘솔에 치명 오류가 없는지 확인합니다.
6. 한 계좌만 올려도 리포트 생성이 되는지 확인합니다.
7. 비공개 규칙 금고 자동 로드가 실제 리포트 생성에 반영되는지 확인합니다.

## GitHub Pages 또는 동등 배포 시 고려사항

- GitHub Pages는 서버 로직이 없으므로 민감 규칙을 저장소에 넣지 않습니다.
- 비공개 규칙은 업로드 또는 브라우저 저장소 방식으로만 처리합니다.
- IndexedDB가 차단된 환경에서는 localStorage fallback을 사용합니다.
- 공용 브라우저에서는 금고 사용 후 삭제를 권장합니다.

## 운영 메모

- 현재 배포 URL: `https://woojunxnam.github.io/cafe-monthly-report-system/`
- 배포 상태 상세: [DEPLOYMENT_STATUS.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/DEPLOYMENT_STATUS.md)
- live 테스트 상세: [LIVE_SMOKE_TEST_REPORT.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/LIVE_SMOKE_TEST_REPORT.md)
- 금고 테스트 상세: [VAULT_E2E_TEST_REPORT.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/VAULT_E2E_TEST_REPORT.md)
