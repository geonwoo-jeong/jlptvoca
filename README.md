# JLPT 다국어 학습 서비스

영어·베트남어·인도네시아어·한국어를 지원하는 무료 JLPT 웹/PWA 학습 서비스다. 자체 제작 어휘를 Anki식 카드로 학습하고 FSRS가 복습 일정을 관리한다.

현재 상태는 구현 전 계획 확정 단계이며, 정식 서비스 개발 전에
`jlptvoca.com`에서 사용할 가벼운 다국어 파킹 페이지를 준비하고 있다.

## 파킹 페이지

- 공개 범위: 영어, 베트남어, 인도네시아어
- 진입 방식: 브라우저 언어 제안과 사용자의 명시적 언어 선택
- 호스팅: 공개 GitHub 저장소의 GitHub Pages
- 제외 범위: 학습 기능, 계정, 입력 폼, 광고, 분석과 외부 추적
- 로컬 검증: `npm test` 또는 coverage gate를 포함한 `npm run check`

파킹 페이지는 정식 제품의 네 언어 범위나 Phoenix 기반 아키텍처를 변경하지
않으며, 정식 앱이 배포되면 교체되는 임시 공개 표면이다.

## 문서

- [프로젝트 헌법](.specify/memory/constitution.md): 모든 제품·기술 결정에 적용되는 최상위 원칙, 품질 게이트와 개정 절차
- [제품·구현 기준서](docs/PRODUCT_IMPLEMENTATION_SPEC.md): 별도 SOT가 만들어지기 전까지 사용하는 현재 SOT로, 확정 요구사항, 사용자 흐름, 기술 구조, 페이즈별 구현·확인 게이트와 D1~D41 결정 대조표
- [파킹 페이지 배포 런북](docs/PARKING_PAGE_DEPLOYMENT.md): GitHub Pages, custom domain, DNS와 HTTPS를 안전한 순서로 연결하는 운영 절차

문서가 충돌하면 `프로젝트 헌법 -> 현재 SOT -> 기능별 spec·plan·tasks와 운영 문서 -> 역사적 제안·검토본` 순서로 해석한다.
