# Live Smoke Test Report

## 배포 URL

- `https://woojunxnam.github.io/cafe-monthly-report-system/`

## 테스트 시각

- `2026-04-05 19:45:00 +09:00`

## 첫 화면 로드 결과

- 성공
- Pages URL 응답: `200`

## 3개 업로드 섹션 표시 여부

- 확인
- 근거:
  - live `src/config/accountManifests.js` 응답 `200`
  - 계좌 manifest 3개 정의 확인
  - HTML에서 `#account-sections`, `#account-card-template` 존재 확인

## 시작 버튼 표시 여부

- 확인
- 근거: live HTML에서 `#start-button` 존재 확인

## 콘솔 오류 여부

- 직접 브라우저 콘솔은 이 환경에서 확인 불가
- 대체 확인:
  - `src/main.js` 응답 `200`
  - `src/styles.css` 응답 `200`
  - CDN xlsx 스크립트 응답 `200`
  - 치명 오류 징후 없음

## 네트워크 / 정적 자산 오류 여부

- 없음
- 확인 결과:
  - 배포 URL `200`
  - `src/styles.css` `200`
  - `src/main.js` `200`
  - CDN xlsx `200`

## 수정한 문제

- 애플리케이션 코드 수정 없음
- Pages 공개 반영이 완료된 이후 live 재검증 수행

## 추가 확인 사항

- `git push -u origin main` 성공
- `git ls-remote --heads origin` 에서 `refs/heads/main` 확인
- GitHub Pages 하위 경로 문제 없음
- live 기본 자산 로드 정상

## 최종 판정

- `GO`
