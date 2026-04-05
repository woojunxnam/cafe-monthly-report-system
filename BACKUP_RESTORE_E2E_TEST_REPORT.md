# Backup Restore E2E Test Report

## 테스트 범위

비공개 규칙 백업/복원 강화 단계의 핵심 흐름을 코드 경로와 배포 자산 기준으로 점검했습니다.

검증 대상:

- 일반 백업 export
- 암호화 백업 export
- 일반 백업 import
- 암호화 백업 import
- 구형 일반 export 호환 import
- 로컬 금고와의 충돌 여부
- 새 브라우저/새 PC 복원 경로 문서화

## 테스트 시각

- `2026-04-05 Asia/Seoul`

## 확인한 항목

| 항목 | 결과 | 근거 |
| --- | --- | --- |
| 일반 백업 버튼 노출 | 확인 | `index.html`에 `일반 내보내기` 버튼 추가 |
| 암호화 백업 버튼 노출 | 확인 | `index.html`에 `암호화 내보내기` 버튼 추가 |
| import 자동 판별 경로 | 확인 | `importBackupPayload()`가 일반/암호화/구형 포맷 분기 |
| passphrase 요구 경로 | 확인 | 암호화 import/export에서 `window.prompt` 호출 |
| Web Crypto API 사용 | 확인 | `privateRuleBackupCrypto.js`에서 PBKDF2 + AES-GCM 사용 |
| 구형 export 호환 | 확인 | `payload.accountId && payload.rules` 경로 지원 |
| 금고 저장 메타데이터 유지 | 확인 | `privateRuleVault.js`에서 `updatedAt`, `schemaVersion` 보존 |
| 리포트 생성 경로 유지 | 확인 | 금고 자동 로드 경로와 `collectActiveAccounts()` 구조 유지 |

## 암호화 백업 형식 검토

현재 암호화 백업 포맷은 아래 요소를 포함합니다.

- `backupFormat`
- `exportVersion`
- `accountId`
- `exportedAt`
- `encrypted`
- `algorithm`
- `kdf`
- `iv`
- `ciphertext`

이 포맷은 추후 private backup repo에 파일 단위로 보관하기 적합합니다.

## 복원 경로 검토

새 브라우저 또는 새 PC에서의 예상 복원 흐름:

1. 공개 Pages 접속
2. 계좌 카드에서 `가져오기`
3. 백업 JSON 선택
4. 암호화 파일이면 passphrase 입력
5. 금고 저장 상태 확인
6. 거래 파일만 업로드해 리포트 생성

## 실제 환경 검증 메모

이 작업 환경에는 브라우저 자동화 도구가 없어, 실제 브라우저에서 파일 선택과 prompt 입력까지 포함한 자동 E2E는 수행하지 못했습니다.  
대신 다음은 확인했습니다.

- 배포 대상 JS에 암호화 백업 모듈이 포함되도록 구조화된 점
- import/export 분기 로직이 명시적으로 구현된 점
- 구형 export 호환 경로가 존재하는 점
- 금고 자동 로드와 리포트 생성 경로가 유지되는 점

## 최종 판정

- `FIXED_GO`

## 남은 운영 확인 1개

- 실제 사용자 브라우저에서 `암호화 내보내기`로 파일을 만든 뒤, 다른 브라우저 프로필 또는 시크릿 세션에서 `가져오기`와 passphrase 입력으로 복원되는지 한 번 확인하면 운영 검증이 닫힙니다.
