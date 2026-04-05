# Private Rule Vault

## 왜 public repo에 규칙을 넣지 않는가

계좌별 비공개 규칙에는 실제 운영 매핑, 제외 기준, 관련자금 그룹 같은 민감 정보가 들어갑니다.  
이 정보는 public 저장소에 커밋하면 안 되므로, 공개 저장소에는 구조와 예시만 남기고 실제 규칙은 로컬에서만 사용합니다.

## 로컬 금고 동작 방식

브라우저 로컬 비밀 규칙 금고는 사용자가 한 번 업로드한 계좌별 비공개 규칙 JSON을 브라우저 저장소에 보관합니다.

동작 순서:

1. 사용자가 계좌 카드에서 비공개 규칙 JSON을 업로드합니다.
2. `금고에 저장`을 누르면 해당 규칙이 계좌 slot 기준으로 저장됩니다.
3. 다음 방문 시 저장된 규칙이 자동 로드됩니다.
4. 사용자는 거래 파일만 다시 업로드해도 리포트를 생성할 수 있습니다.

## 저장 위치

기본 저장소:

- IndexedDB

fallback:

- localStorage

현재 구현 파일:

- [privateRuleVault.js](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/src/core/privateRuleVault.js)

저장 항목:

- `accountId`
- `rules`
- `updatedAt`
- `schemaVersion`

## 백업과의 관계

로컬 금고는 운영 중 빠른 재사용을 위한 저장소입니다.  
장치 교체나 브라우저 초기화에 대비한 이동성은 별도 백업 파일로 보완합니다.

현재 지원:

- 일반 백업 내보내기
- passphrase 기반 암호화 백업 내보내기
- 일반 백업 가져오기
- 암호화 백업 가져오기
- 구형 비암호화 export 포맷 호환 가져오기

상세는 [PRIVATE_RULE_BACKUP.md](/c:/Users/남우현/Desktop/cafe_monthly_report_final_pack/PRIVATE_RULE_BACKUP.md)에 있습니다.

## 자동 로드 방식

- 페이지 초기 로드 시 account manifest를 순회합니다.
- 계좌별 금고 저장본이 있으면 자동으로 메모리에 적재합니다.
- UI에는 `저장됨`, `마지막 업데이트`, `현재 사용 규칙`, `백업 방식`을 표시합니다.
- 이후 리포트 생성 시 업로드 규칙이 없더라도 자동 로드된 금고 규칙이 override로 사용됩니다.

## 삭제 방식

- 계좌 카드의 `금고에서 삭제` 버튼으로 해당 slot 규칙만 삭제합니다.
- 금고 저장본만 삭제되며, 별도로 보관한 백업 파일은 삭제되지 않습니다.

## 보안 주의사항

- 이 금고는 public 저장소가 아니라 사용자 브라우저 저장소를 사용합니다.
- GitHub Pages 배포본에는 민감 규칙이 포함되지 않습니다.
- 같은 브라우저 프로필을 공유하면 저장본에 접근될 수 있으므로 공용 PC에서는 사용 후 삭제가 필요합니다.
- 일반 백업 파일은 평문 JSON이므로 장기 보관에는 암호화 백업을 권장합니다.
- 암호화 백업의 passphrase를 잊으면 복구할 수 없습니다.

## 향후 확장 포인트

2단계에서는 private GitHub repo를 백업 저장소로 쓰는 구조를 붙일 수 있습니다.

확장 방향 예시:

- `localVaultProvider`
- `encryptedBackupFileProvider`
- `privateRepoBackupProvider`
- `hybridVaultProvider`

즉, 현재 UI와 리포트 엔진은 유지하고 저장소 adapter만 추가하는 방향입니다.
