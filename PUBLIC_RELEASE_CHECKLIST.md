# Public Release Checklist

## 민감정보 점검

- `private/` 아래 실제 규칙 파일이 커밋 대상이 아닌지 확인
- `data/raw/` 아래 원본 거래 파일이 커밋 대상이 아닌지 확인
- `output/` 아래 기존 산출물이 커밋 대상이 아닌지 확인
- `private/generated/`, `private/_cache/`, `private/_inspection/`가 커밋 대상이 아닌지 확인
- tracked 파일에서 실명, 계좌번호, 실제 규칙 키워드가 제거되었는지 확인

## 문서 점검

- `README.md`에 프로젝트 개요, 실행법, 보안 원칙이 있는지 확인
- `DEPLOYMENT_GUIDE.md`에 정적 배포 절차가 있는지 확인
- `config_examples/`가 샘플만 포함하는지 확인
- `VALIDATION_REPORT.md`가 기준 계좌 검증 완료 상태를 설명하는지 확인

## 동작 점검

- `index.html`이 로컬 정적 서버에서 열리는지 확인
- 업로드 섹션 3개가 보이는지 확인
- `시작` 버튼으로 report 생성 흐름이 보이는지 확인
- master report 미리보기가 뜨는지 확인

## 공개 전 최종 확인

- `git status --ignored`로 ignore 대상이 예상대로 숨겨지는지 확인
- `git ls-files` 목록에 민감 파일이 없는지 확인
- 첫 커밋 메시지가 public-safe 상태를 반영하는지 확인
