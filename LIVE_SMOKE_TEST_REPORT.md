# Live Smoke Test Report

## 배포 URL

- `https://woojunxnam.github.io/cafe-monthly-report-system/`

## 테스트 시각

- `2026-04-05 19:37:07 +09:00`

## 첫 화면 로드 결과

- 실패
- Pages URL 응답: `404`

## 3개 업로드 섹션 표시 여부

- 미확인
- 사유: 첫 화면이 열리지 않아 DOM 확인 불가

## 시작 버튼 표시 여부

- 미확인
- 사유: 첫 화면이 열리지 않아 DOM 확인 불가

## 콘솔 오류 여부

- 미확인
- 사유: 실제 페이지가 로드되지 않아 브라우저 콘솔 단계에 진입하지 못함

## 네트워크 / 정적 자산 오류 여부

- 첫 단계에서 페이지 자체가 `404`
- 정적 자산 로드까지 진행되지 않음
- 참고:
  - `raw.githubusercontent.com/.../main/index.html` 응답 `200`
  - `raw.githubusercontent.com/.../main/src/styles.css` 응답 `200`

## 수정한 문제

- 애플리케이션 코드 수정 없음
- 현재 코드의 정적 경로는 상대경로(`./src/...`)라 GitHub Pages 하위 경로 문제 가능성은 낮음
- 문제 원인을 Pages 공개 반영 상태로 재분류함

## 추가 확인 사항

- `git push -u origin main` 성공
- `git ls-remote --heads origin` 에서 `refs/heads/main` 확인
- live 배포 실패 원인은 현재 기준으로 GitHub Pages 공개 반영 지연 또는 Pages 설정 상태 문제 가능성이 높음

## 최종 판정

- `BLOCKED`
