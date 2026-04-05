# Private Folder

이 폴더는 실제 운영용 비공개 파일 전용입니다.

권장 구조:

```text
private/
└─ accounts/
   ├─ account-1.json
   ├─ account-2.json
   └─ account-3.json
```

예시:

- 실제 출금 카테고리 매핑
- 실제 입금 바인딩 규칙
- 실제 제외 규칙
- 계좌별 상세 리포트 설정
- 향후 민감 식별자 매핑

주의:

- 이 폴더 내용은 `.gitignore`로 기본 제외됩니다.
- 실제 거래 원본이나 실제 산출물도 public 저장소에 커밋하지 않는 것을 권장합니다.
