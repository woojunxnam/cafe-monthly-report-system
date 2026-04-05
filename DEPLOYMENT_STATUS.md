# Deployment Status

## 원격 저장소 주소

- `origin`: `https://github.com/woojunxnam/cafe-monthly-report-system.git`

## 기본 브랜치

- `main`

## push 성공 여부

- 성공
- 실행 명령: `git push -u origin main`
- 결과: `branch 'main' set up to track 'origin/main'`
- 원격 브랜치 확인: `git ls-remote --heads origin` 에서 `refs/heads/main` 확인
- raw 파일 확인: `https://raw.githubusercontent.com/woojunxnam/cafe-monthly-report-system/main/index.html` 응답 `200`

## Pages 활성화 여부

- 활성화됨
- Pages URL 직접 확인 결과: `200`
- 원격 코드와 정적 자산(`index.html`, `src/styles.css`, `src/main.js`) 응답 정상 확인

## 배포 URL

- 예상 URL: `https://woojunxnam.github.io/cafe-monthly-report-system/`
- 실제 확인 결과: `200`

## smoke test 결과

### 로컬 정적 서버

- 첫 화면 정상 로드: 성공
- 3개 업로드 섹션 표시: 코드/구조 기준 준비 완료
- 시작 버튼 표시: 코드 기준 준비 완료
- 콘솔 치명 오류 여부: 배포 환경에서 미확인, 로컬 HTTP 응답은 정상

### 실제 배포 환경

- Pages URL 응답: `200`
- 첫 화면 정상 로드: 성공
- 3개 업로드 섹션 표시: 코드/모듈 기준 3개 manifest 확인
- 시작 버튼 표시: HTML 기준 `#start-button` 존재 확인
- 정적 자산 로드 실패 여부: `src/styles.css`, `src/main.js`, CDN xlsx 응답 모두 `200`
- 콘솔 치명 오류 여부: 이 환경에서 브라우저 콘솔 직접 확인은 불가, 다만 자산 응답과 모듈 로드 기준 치명 오류 징후 없음
- GitHub Pages 하위 경로 문제 여부: 상대경로(`./src/...`) 사용으로 문제 없음

## 확인된 문제

- 확인된 치명 문제 없음
- 초기 반영 지연으로 `404`가 있었으나 현재는 Pages URL이 정상 응답

## 다음 즉시 작업 1개

- 실제 브라우저에서 거래 파일 1개를 업로드해 end-to-end 리포트 생성 다운로드까지 한 번 수행
