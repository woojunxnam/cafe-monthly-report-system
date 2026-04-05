export const accountManifests = [
  {
    id: "account-1",
    slot: 1,
    label: "기준 계좌 1호",
    accountNumber: "masked-account-01",
    displayName: "기준 계좌 1호",
    kind: "baseline",
    notes: [
      "현재 source of truth 기준 계좌입니다.",
      "관련자금 그룹 양방향 흐름을 유지합니다.",
      "ATM입금은 별도 입금 카테고리로 처리합니다."
    ]
  },
  {
    id: "account-2",
    slot: 2,
    label: "확장 계좌 2호",
    accountNumber: "placeholder-account-02",
    displayName: "규칙 미정 placeholder",
    kind: "placeholder",
    notes: [
      "아직 실제 규칙은 비어 있습니다.",
      "비공개 규칙 JSON을 업로드하거나 금고에서 불러오면 override 됩니다."
    ]
  },
  {
    id: "account-3",
    slot: 3,
    label: "확장 계좌 3호",
    accountNumber: "placeholder-account-03",
    displayName: "규칙 미정 placeholder",
    kind: "placeholder",
    notes: [
      "아직 실제 규칙은 비어 있습니다.",
      "향후 계좌가 늘어도 같은 구조로 확장 가능합니다."
    ]
  }
];
