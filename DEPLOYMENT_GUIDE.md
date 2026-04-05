# Deployment Guide

## 배포 대상

이 프로젝트는 정적 파일 배포를 기준으로 준비되어 있습니다.

권장 대상:

- GitHub Pages
- Netlify
- Vercel static
- 기타 정적 호스팅

## 배포 전 원칙

- private rule 파일은 절대 배포물에 포함하지 않습니다.
- 원본 거래 데이터는 절대 배포물에 포함하지 않습니다.
- 온라인 배포에서는 private rule을 브라우저 업로드 방식으로만 사용합니다.

## GitHub Pages 기준

기본 진입점:

- `index.html`

정적 자산:

- `src/`

추가 메모:

- `.nojekyll` 파일을 포함해 Jekyll 처리 없이 정적 파일 그대로 배포할 수 있게 합니다.

## 로컬 smoke test

```powershell
python -m http.server 8080
```

브라우저에서 확인:

1. 첫 화면이 열린다.
2. 계좌 업로드 섹션 3개가 보인다.
3. 월 선택과 `시작` 버튼이 보인다.
4. 거래 파일 업로드 후 결과 영역이 갱신된다.
5. master report 미리보기가 iframe에 표시된다.
6. 다운로드 버튼이 생성된다.

## 배포 체크 순서

1. `PUBLIC_RELEASE_CHECKLIST.md`를 점검한다.
2. `git status --ignored`로 ignore 상태를 확인한다.
3. Pages 또는 정적 호스팅 설정을 켠다.
4. 배포 후 브라우저에서 smoke test를 다시 수행한다.

## GitHub Pages 수동 설정 예시

1. GitHub 저장소 생성
2. 기본 브랜치 `main`에 push
3. GitHub 저장소 설정에서 Pages 활성화
4. 배포 소스를 `Deploy from a branch` 또는 정적 빌드 방식으로 선택
5. 루트 경로 `/` 기준으로 배포

## 현재 단계에서 인증이 필요한 작업

- GitHub 원격 저장소 생성
- 원격 push
- GitHub Pages 실제 활성화
