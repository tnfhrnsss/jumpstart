# 아키텍처 결정 기록 (ADR)

이 폴더는 Jumpstart의 **"왜 이렇게 만들었나"** 를 기록합니다. 사용법·설치는 루트
[`README.md`](../../README.md), 코드 구조·작업 시 함정은 [`../CLAUDE.md`](../CLAUDE.md)
를 보세요. 여기엔 **나중에 다시 질문하게 될 설계 선택의 근거**만 둡니다.

| 번호 | 제목 | 상태 |
| --- | --- | --- |
| [0001](0001-terminal-launch.md) | 터미널 실행을 osascript + Terminal.app으로 | 채택 |
| [0002](0002-git-push-status.md) | "마지막 푸시" 상태를 ahead 카운트로 추정 | 채택 |
| [0003](0003-process-and-storage.md) | 3-프로세스 분리 · 데이터는 userData에 저장 | 채택 |

새 결정이 생기면 다음 번호로 파일을 추가하고 위 표에 한 줄 더합니다.
