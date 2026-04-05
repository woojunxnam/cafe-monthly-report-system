# Architecture

## 선택한 구현 방향

이번 단계는 브라우저 내 처리 방식을 우선 채택한다.

이유:

- 정적 호스팅 친화적이다.
- 민감 거래 파일을 서버로 보내지 않아도 된다.
- GitHub Pages 또는 private repo 정적 배포와 잘 맞는다.
- 업로드 후 즉시 HTML/CSV를 생성하기 쉽다.

## 핵심 흐름

1. 사용자가 계좌별 거래 파일을 업로드한다.
2. 필요 시 계좌별 비공개 규칙 JSON을 함께 업로드한다.
3. 브라우저가 파일을 파싱해 표준 거래 구조로 정규화한다.
4. 계좌별 기본 규칙과 override 규칙을 병합한다.
5. 선택한 보고 월 기준으로 계좌별 집계를 만든다.
6. 계좌별 HTML report와 CSV들을 생성한다.
7. 모든 계좌 집계를 합쳐 master report와 master summary CSV를 생성한다.
8. 결과를 브라우저에서 미리 보고 다운로드한다.

## 표준 거래 모델

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

병합 대상:

- 출금 카테고리 매핑
- 입금 바인딩 규칙
- 제외 prefix
- 관련자금 그룹
- 리포트 설정

## 출력물

계좌별:

- HTML report
- withdrawal category summary CSV
- deposit category summary CSV
- excluded rows CSV
- related transfer summary CSV

마스터:

- master HTML report
- master summary CSV

## 기존 패키지 계승 원칙

- 표 중심 레이아웃 유지
- 흑백 중심 문서 톤 유지
- 그래프는 컬러 허용
- `ATM입금` 별도 유지
- 관련자금 양방향 흐름 유지
- 출금, 입금, 관련자금 흐름을 분리 표시

## 향후 확장 포인트

- 계좌 추가
  - `accountManifests.js`와 `config_examples/accounts/`에만 추가
- 포맷 추가
  - `workbookParser.js`의 컬럼 alias 확장
- 규칙 상세화
  - 비공개 JSON에 match conditions 추가
- 결과 묶음 다운로드
  - ZIP export 추가
- 자동 검증
  - 기존 `output/`과 결과 비교 스크립트 추가
