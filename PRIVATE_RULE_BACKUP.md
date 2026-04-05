# Private Rule Backup

## 왜 public repo에 규칙을 넣지 않는가

비공개 규칙에는 실제 계좌 운영 분류 기준과 민감한 매핑 정보가 포함됩니다.  
따라서 public 저장소에는 절대 넣지 않고, 공개 저장소는 구조와 코드만 유지합니다.

## 왜 공개 Pages가 private repo를 직접 읽지 않게 해야 하는가

GitHub Pages 공개 사이트가 private repo를 직접 읽기 시작하면 다음 문제가 생깁니다.

- 인증 토큰이나 접근 제어 문제가 프런트엔드에 섞입니다.
- 브라우저 배포본에 비밀 접근 경로가 들어갈 수 있습니다.
- 정적 호스팅 구조가 복잡해지고 보안 검토 범위가 커집니다.

이번 단계에서는 이를 구현하지 않고, 공개 Pages는 계속 정적 사이트로 유지합니다.

## 권장 운영 구조

1. public repo
   - `cafe-monthly-report-system`
   - 공개 코드, 문서, 예시 설정만 포함

2. browser local vault
   - 현재 사용 브라우저의 IndexedDB 또는 localStorage
   - 빠른 재사용용

3. private backup repo
   - 예시 이름: `cafe-monthly-report-secrets`
   - 암호화 백업 파일만 보관
   - 직접 읽기 대상이 아니라 사람 중심 백업 저장소

## 백업 파일 형식

### 일반 백업

일반 백업은 평문 JSON입니다.

```json
{
  "backupFormat": "private-rule-backup",
  "exportVersion": 2,
  "accountId": "account-1",
  "exportedAt": "2026-04-05T12:00:00.000Z",
  "encrypted": false,
  "entry": {
    "accountId": "account-1",
    "rules": {},
    "updatedAt": "2026-04-05T11:58:00.000Z",
    "schemaVersion": 1
  }
}
```

### 암호화 백업

암호화 백업은 Web Crypto API 기반 AES-GCM + PBKDF2 구조를 사용합니다.

```json
{
  "backupFormat": "private-rule-backup",
  "exportVersion": 2,
  "accountId": "account-1",
  "exportedAt": "2026-04-05T12:00:00.000Z",
  "encrypted": true,
  "algorithm": "AES-GCM",
  "kdf": {
    "name": "PBKDF2",
    "hash": "SHA-256",
    "iterations": 250000,
    "salt": "..."
  },
  "iv": "...",
  "ciphertext": "..."
}
```

## 암호화 export 절차

1. 계좌 카드에서 `암호화 내보내기`를 누릅니다.
2. passphrase를 입력합니다.
3. 같은 passphrase를 다시 입력합니다.
4. 암호화 JSON 파일을 다운로드합니다.
5. 이 파일을 로컬 안전 폴더 또는 private backup repo에 보관합니다.

## import 절차

### 일반 백업

1. 계좌 카드에서 `가져오기`를 누릅니다.
2. 일반 백업 JSON을 선택합니다.
3. 금고에 복원됩니다.

### 암호화 백업

1. 계좌 카드에서 `가져오기`를 누릅니다.
2. 암호화 백업 JSON을 선택합니다.
3. passphrase 입력 창이 나타납니다.
4. 올바른 passphrase를 입력하면 금고에 복원됩니다.

### 구형 export 호환

이전 단계의 단순 export JSON도 가져오기를 지원합니다.

## 새 브라우저 / 새 PC 복원 절차

1. public 사이트를 엽니다.
2. 각 계좌 카드에서 `가져오기`를 누릅니다.
3. 보관 중인 일반 또는 암호화 백업 파일을 선택합니다.
4. 암호화 파일이면 passphrase를 입력합니다.
5. 복원 후 저장 상태와 마지막 업데이트 시각을 확인합니다.
6. 거래 파일만 업로드해 리포트가 생성되는지 확인합니다.

## private GitHub backup repo 사용 예시

예시 저장소 이름:

- `cafe-monthly-report-secrets`

권장 보관 방식:

- 계좌별 백업 파일을 `accounts/` 아래에 저장
- 파일명 예시:
  - `accounts/account-1.private-rules.encrypted.json`
  - `accounts/account-2.private-rules.encrypted.json`
- 월별 스냅샷 폴더를 두고 교체 또는 보관 정책을 명확히 유지

중요:

- 이번 단계에서는 이 private repo를 사이트가 직접 읽지 않습니다.
- 사용자가 필요할 때 수동으로 backup file을 내려받아 가져오는 구조입니다.

## 보안 주의사항

- 일반 백업은 평문이므로 안전한 저장소에만 두어야 합니다.
- 장기 보관과 이동은 암호화 백업을 권장합니다.
- passphrase는 public repo, issue, PR, 채팅 로그에 남기지 않습니다.
- passphrase를 잃으면 암호화 백업은 복구할 수 없습니다.
- public Pages는 계속 정적 사이트로 유지하고, 비밀 접근 토큰을 넣지 않습니다.
