# Vault E2E Test Report

## 테스트 범위

브라우저 로컬 비밀 규칙 금고의 핵심 흐름을 코드 경로와 배포 자산 기준으로 점검했습니다.

검증 대상:

- 계좌별 규칙 저장
- 다음 방문 시 자동 로드
- 저장 상태 표시
- export / import / delete 버튼 연결
- 리포트 생성 시 자동 로드 규칙 사용

## 테스트 시각

- `2026-04-05 Asia/Seoul`

## 확인한 항목

| 항목 | 결과 | 근거 |
| --- | --- | --- |
| 금고 UI 섹션 존재 | 확인 | `index.html`에 `비공개 규칙 금고` 섹션과 버튼 5종 존재 |
| 계좌별 분리 저장 구조 | 확인 | `privateRuleVault.js`에서 `accountId` key 저장 |
| IndexedDB 우선 사용 | 확인 | `openDatabase()` 사용, 실패 시 localStorage fallback |
| 다음 방문 자동 로드 경로 | 확인 | `autoLoadVaultRules()`가 초기 렌더 직후 실행 |
| 저장 상태 표시 | 확인 | `renderVaultStatus()`에서 저장 상태, 업데이트 시각, 활성 규칙 표시 |
| export 동작 경로 | 확인 | `vault.exportEntry()` + `downloadJson()` 연결 |
| import 동작 경로 | 확인 | `vault.importEntry()` + 파일 입력 연결 |
| delete 동작 경로 | 확인 | `vault.remove()` + UI 상태 갱신 연결 |
| 리포트 생성 연결 | 확인 | `collectActiveAccounts()`가 `runtimeRuleMap`의 자동 로드 규칙을 override로 전달 |

## 리포트 생성 연결 검증

현재 코드 경로 기준으로 자동 로드된 규칙은 아래 흐름으로 리포트 생성에 연결됩니다.

1. 페이지 로드
2. `autoLoadVaultRules()` 실행
3. 저장된 규칙이 `runtimeRuleMap`에 적재
4. 사용자가 거래 파일만 업로드
5. `handleStart()` 실행
6. `collectActiveAccounts()`에서 `runtimeRuleMap.get(accountId)?.rules`를 `overrides`로 전달
7. `buildReports()`와 `buildMasterReport()`에 반영

즉, 비공개 규칙 JSON을 다시 업로드하지 않아도 거래 파일만 있으면 리포트 생성이 가능한 구조입니다.

## 실제 환경 검증 메모

이 작업 환경에서는 브라우저 자동화 도구가 없어 IndexedDB가 실제 브라우저 세션을 넘겨 유지되는 장면을 자동 캡처하지는 못했습니다.  
대신 다음을 확인했습니다.

- 배포 구조가 정적 자산 기준으로 정상 로드되는 점
- 금고 UI와 로직이 live 배포 대상 파일에 포함되는 점
- 자동 로드 규칙이 리포트 엔진 호출 경로에 실제로 연결되는 점

## 최종 판정

- `FIXED_GO`

## 남은 운영 확인 1개

- 실제 사용자 브라우저에서 비공개 규칙 JSON 1회 저장 후 새로고침하여 `자동 로드됨` 표시와 거래 파일만으로 리포트 생성이 되는지 한 번 더 확인하면 운영 검증이 닫힙니다.
