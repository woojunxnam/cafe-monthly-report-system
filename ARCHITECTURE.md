# Architecture

## 구현 방향

현재 구현은 브라우저 내 처리 방식을 우선합니다.

이유:

- 정적 호스팅 친화적입니다.
- 거래 파일과 비공개 규칙을 서버로 보내지 않아도 됩니다.
- GitHub Pages 같은 환경에서 바로 배포할 수 있습니다.
- 업로드 직후 HTML/CSV를 브라우저에서 바로 생성할 수 있습니다.

## 처리 흐름

1. 사용자가 계좌별 거래 파일을 업로드합니다.
2. 필요하면 비공개 규칙 JSON을 업로드하거나 로컬 금고에서 자동 로드합니다.
3. 브라우저가 거래 파일을 파싱해 공통 거래 구조로 정규화합니다.
4. starter rules와 계좌별 override를 결합합니다.
5. 계좌별 집계를 수행합니다.
6. 계좌별 HTML report와 CSV 묶음을 생성합니다.
7. 계좌별 결과를 합쳐 master report와 master summary CSV를 생성합니다.
8. 생성 결과를 브라우저에서 미리보기와 다운로드로 제공합니다.

## 거래 데이터 정규화 모델

```text
{
  accountId,
  accountNumber,
  date,
  dateKey,
  monthKey,
  description,
  note,
  withdrawal,
  deposit,
  amountDirection
}
```

## 규칙 계층

1. 공개 starter rules
2. 계좌 manifest 메타데이터
3. 비공개 override JSON
4. 브라우저 로컬 금고 저장본

병합 대상:

- 출금 카테고리 매핑
- 입금 바인딩 규칙
- 제외 prefix
- 관련자금 그룹
- 리포트 설정

## 브라우저 로컬 비밀 규칙 금고

현재 1차 구현은 `src/core/privateRuleVault.js`에서 담당합니다.

- 기본 저장소: IndexedDB
- fallback 저장소: localStorage
- 저장 단위: `accountId`
- 저장 내용:
  - rules
  - updatedAt
  - schemaVersion

현재 UI 흐름:

- 비공개 규칙 JSON 업로드
- 금고에 저장
- 다음 방문 시 자동 로드
- 수동 불러오기
- 삭제
- 내보내기
- 가져오기

현재 금고는 브라우저 로컬 저장소만 사용하며, 서버 동기화는 하지 않습니다.

## 향후 확장 포인트

2단계에서 private GitHub repo sync를 붙일 수 있도록 금고 접근 로직을 모듈로 분리했습니다.

확장 방향 예시:

- `localVaultProvider`
- `privateRepoBackupProvider`
- `hybridVaultProvider`

즉, 현재 UI와 리포트 엔진은 유지하고 저장소 adapter만 교체 또는 추가할 수 있게 설계하는 방향입니다.

## 출력물

계좌별:

- HTML report
- withdrawal category summary CSV
- deposit category summary CSV
- excluded rows CSV
- related transfer summary CSV

master:

- master HTML report
- master summary CSV

## 기존 패키지 계승 원칙

- 표 중심 리포트
- 월간 리뷰용 구조
- 흑백 중심 레이아웃
- 그래프는 필요한 범위에서만 색상 허용
- `ATM입금` 별도 유지
- 관련자금 그룹 양방향 흐름 유지
- 출금, 입금, 제외, 관련자금 흐름 분리 유지

## 현재 제약

- 브라우저 로컬 금고는 사용자 브라우저 저장소에 의존합니다.
- 기기나 브라우저가 바뀌면 저장본이 자동 이전되지 않습니다.
- 공용 PC에서는 사용 후 삭제가 필요합니다.
- 암호화는 아직 1차 구현 범위에 넣지 않았고, 추후 passphrase 기반 계층을 별도 도입할 수 있습니다.
