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

- 미확인 또는 반영 대기
- Pages URL 직접 확인 결과: `404`
- 원격 코드 자체는 올라가 있으므로 현재 문제는 push가 아니라 Pages 공개 반영 단계일 가능성이 높음

## 배포 URL

- 예상 URL: `https://woojunxnam.github.io/cafe-monthly-report-system/`
- 실제 확인 결과: `404`

## smoke test 결과

### 로컬 정적 서버

- 첫 화면 정상 로드: 성공
- 3개 업로드 섹션 표시: 코드/구조 기준 준비 완료
- 시작 버튼 표시: 코드 기준 준비 완료
- 콘솔 치명 오류 여부: 배포 환경에서 미확인, 로컬 HTTP 응답은 정상

### 실제 배포 환경

- Pages URL 응답: `404`
- 첫 화면 정상 로드: 실패
- 3개 업로드 섹션 표시: 미확인
- 시작 버튼 표시: 미확인
- 정적 자산 로드 실패 여부: 미확인
- 콘솔 치명 오류 여부: 미확인
- GitHub Pages 하위 경로 문제 여부: 코드상 상대경로(`./src/...`)를 사용하고 있어 가능성 낮음

## 확인된 문제

- 로컬 `origin`은 설정됨
- `main` 브랜치는 원격에 실제로 올라감
- `raw.githubusercontent.com` 기준 `index.html`, `src/styles.css` 모두 `200`
- Pages URL만 `404`
- 따라서 현재 문제의 1차 원인은 애플리케이션 코드나 정적 자산 경로보다는 GitHub Pages 공개 반영 상태임

## 다음 즉시 작업 1개

- GitHub 저장소의 `Settings > Pages` 에서 source가 `main / root` 로 잡혀 있는지 확인하고, 반영 후 Pages URL을 다시 열어 smoke test 재실행
