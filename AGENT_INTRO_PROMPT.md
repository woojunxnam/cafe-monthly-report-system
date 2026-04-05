[Sender] ChatGPT
[Recipient] AI Agent

한국어로만 답하라.

이 패키지는 카페 월간 계좌 리포트 시스템의 현재 최신 설계/출력 묶음이다.
먼저 아래 파일을 읽고 현재 상태를 정확히 이해하라.

읽기 우선순위:
1. CURRENT_DECISIONS.md
2. PROJECT_HANDOFF.md
3. REPORT_SPEC.md
4. config/category_map.yaml
5. config/deposit_rules.yaml
6. output/2026-03/report_2026-03.html

목표:
- 현재 규칙을 깨지 않고
- 월별 원본 파일을 입력받아
- 같은 형식의 HTML/CSV 리포트를 반복 생성하는 구조를 구현하는 것

중요 규칙:
- 출금 보고서와 입금 보고서를 섞지 말 것
- 박재민/성기용 관련 자금은 별도 관련자금 섹션으로 처리할 것
- ATM입금은 별도 카테고리 유지
- 다른 계좌는 동일 구조로 시작하되 세부 규칙은 후속 조정 가능하게 만들 것

이번 단계에서 할 일:
- 폴더 구조와 설정 구조를 검토
- 구현 시작 전에 누락된 사항이 있는지 보고
- 바로 코드 작성이 가능하다면 어떤 파일부터 구현할지 제안
