<!--
Sync Impact Report
- Version change: unratified -> 1.0.0
- Modified principles: none (initial ratification)
- Added principles:
  - I. 학습자 성과 우선
  - II. 콘텐츠 주권과 불변 게시
  - III. 결정적 학습 기록과 서버 정본
  - IV. 오프라인 수렴과 사용자 데이터 보존
  - V. 개인정보 최소화와 최소 권한 보안
  - VI. 단순한 아키텍처와 명시적 경계
  - VII. 증거 기반 TDD와 품질 게이트
  - VIII. 접근성·저데이터 환경을 기본 제약으로
- Added sections:
  - 권위 계층 및 제품·기술 제약
  - 개발 워크플로와 품질 게이트
  - Governance
- Removed sections: none
- Template synchronization:
  - ⚠ pending: .specify/templates/plan-template.md (Spec Kit templates not initialized)
  - ⚠ pending: .specify/templates/spec-template.md (Spec Kit templates not initialized)
  - ⚠ pending: .specify/templates/tasks-template.md (Spec Kit templates not initialized)
  - ⚠ pending: .specify/templates/commands/*.md (directory not initialized)
- Runtime guidance synchronization:
  - ✅ updated: README.md
  - ✅ updated: docs/PRODUCT_IMPLEMENTATION_SPEC.md
- Follow-up items:
  - Create the project SOT and include a requirement-to-verification traceability matrix.
  - Initialize and align Spec Kit plan/spec/tasks templates before using those workflows.
-->

# JLPT 다국어 학습 서비스 헌법

## Core Principles

### I. 학습자 성과 우선

- 모든 제품 결정은 학습 완료, 반복 복습, 재방문과 실제 회상 유지를 SEO,
  광고 노출과 단기 수익보다 우선해야 한다(MUST).
- 첫 방문자는 설문 없이 설명 언어와 JLPT 레벨만 선택해 10카드 체험을
  시작할 수 있어야 한다(MUST).
- SEO와 광고는 각각 사용자 획득과 수익화 계층으로만 동작해야 한다(MUST).
  광고, CMP 거부·미확정, 광고차단과 광고 로드 실패는 카드 학습, 로그인,
  설정, 개인정보 보호, 계정 삭제와 오프라인 복습을 막아서는 안 된다(MUST NOT).
- 핵심 학습 기능은 무료로 제공해야 하며(MUST), 결제·구독·entitlement와
  광고 제거 상품을 도입해서는 안 된다(MUST NOT).
- 후속 페이즈 기능은 현재 페이즈의 기준선을 지연시키거나 암묵적으로
  포함해서는 안 된다(MUST NOT).

이 원칙은 반복 사용하는 학습 도구가 제품의 목적이고, 검색과 광고는 그
목적을 지원하는 수단이라는 경계를 보존한다.

### II. 콘텐츠 주권과 불변 게시

- 생산 학습 콘텐츠는 자체 제작이어야 한다(MUST). 외부 자료를 참고한 경우
  실제 사용 범위, 권리, 귀속, 변형과 레벨 부여 근거를 추적할 수 있어야
  한다(MUST).
- 모든 콘텐츠와 오디오는 원본 식별자, 작성자 또는 공급자, 생성·수정 시각,
  소유권·라이선스 근거와 품질 검토 상태를 기록해야 한다(MUST).
- 게시된 콘텐츠 버전은 불변이어야 한다(MUST). 정정은 새 버전과 명시적
  release로 수행하고, rollback은 이전 불변 버전으로 active pointer를
  전환해야 한다(MUST).
- 승인되지 않은 번역을 게시하거나 준비되지 않은 언어를 다른 언어로
  조용히 대체해서는 안 된다(MUST NOT).
- 생성, 수정, 승인, 게시와 rollback은 사전에 부여된 단일 `content_owner`만
  수행할 수 있어야 하며(MUST), 모든 권한·콘텐츠 변경은 감사해야 한다(MUST).

이 원칙은 학습 정확성, 자체 콘텐츠라는 제품 약속과 상업 이용의 법적
재현성을 동시에 보장한다.

### III. 결정적 학습 기록과 서버 정본

- 학습 event는 append-only여야 하고(MUST), 계약된 고유키로 멱등 처리해야
  한다(MUST). 기존 event를 덮어쓰거나 삭제해 결과를 수정해서는 안 된다
  (MUST NOT).
- snapshot과 복습 큐는 event에서 다시 계산할 수 있는 파생 데이터여야
  하며(MUST), 서버가 원본 event를 fold한 결과가 학습 상태의 정본이어야
  한다(MUST).
- 서버는 클라이언트가 제출한 `due`, `stability`, `difficulty`와 다음 간격을
  신뢰해서는 안 된다(MUST NOT).
- 모든 review event는 FSRS 버전과 parameter version을 기록해야 한다(MUST).
  알고리즘 변경은 event replay, migration, 브라우저·서버 parity와 canary를
  통과한 뒤에만 활성화할 수 있다(MUST).
- 초기 카드 평가는 UI, API와 ingest 경계에서 `Again(1)`과 `Good(3)`만
  허용해야 한다(MUST).

이 원칙은 온라인·오프라인·다중 기기에서 같은 학습 이력을 재현하고, 손실,
중복과 클라이언트 조작으로부터 복습 상태를 보호한다.

### IV. 오프라인 수렴과 사용자 데이터 보존

- 온라인과 오프라인 학습은 모두
  `ReviewPlayer -> outbox -> ingest -> fold -> snapshot` 경로를 사용해야
  한다(MUST).
- 중복 전송, 순서 변경, 재시도와 batch 부분 실패 뒤에도 같은 유효 event
  집합은 같은 서버 snapshot으로 수렴해야 한다(MUST).
- 팩은 schema version, content version과 checksum을 포함해야 하며(MUST),
  검증과 원자 활성화에 실패하면 이전 정상 팩을 유지해야 한다(MUST).
- 미지원 schema, 저장공간 부족, 캐시 손상과 동기화 오류를 이유로 사용자
  학습 event를 조용히 삭제해서는 안 된다(MUST NOT).
- 동기화 실패는 상태, 영향 범위와 복구 방법을 사용자에게 보여줘야 하며
  (MUST), 앱 버전 N은 검증된 데이터 schema N과 N-1 호환 계약을 지켜야
  한다(MUST).

이 원칙은 제한적 오프라인 지원의 가치를 기능 수가 아니라 데이터 무손실,
수렴과 복구 가능성으로 정의한다.

### V. 개인정보 최소화와 최소 권한 보안

- 개인정보는 기능에 필요한 최소 범위만 수집·보존해야 한다(MUST). 국가,
  Google access/refresh token, 불필요한 프로필 정보와 관심 기반 광고
  targeting 정보는 저장해서는 안 된다(MUST NOT).
- 인증, 업로드, URL, 동기화, 검색, 신고와 운영 요청은 시스템 경계에서
  schema, 권한, 크기, 빈도와 허용 범위를 검증해야 한다(MUST).
- OAuth/OIDC 검증, CSRF, CSP, HSTS, 보안 쿠키, 용도별 rate limit과 최소
  권한을 적용해야 한다(MUST). 운영 권한을 애플리케이션 UI에서 스스로
  부여할 수 없어야 한다(MUST).
- 비밀은 저장소에 기록하지 않고 실행 환경 또는 비밀 관리 서비스로 주입하며,
  시작 시 존재와 유효성을 검증해야 한다(MUST).
- 로그와 진단 자료에서 token, 이메일과 상세 학습 응답을 제거해야 하며
  (MUST), 사용자가 자신의 데이터를 내보내고 삭제할 수 있어야 한다(MUST).
- 권한·운영 변경은 행위자, 시각, 이전값, 새값과 이유를 감사해야 한다(MUST).

이 원칙은 인증, 콘텐츠 운영과 오프라인 동기화가 만나는 경계에서 수집량과
침해 피해 범위를 최소화한다.

### VI. 단순한 아키텍처와 명시적 경계

- 초기 시스템은 Phoenix 단일 애플리케이션과 `Catalog`, `Learning`,
  `Accounts` context 경계를 유지해야 한다(MUST).
- Controller, LiveView, 동기화 endpoint와 Oban worker는 context 함수를
  호출하는 얇은 adapter여야 한다(MUST). 도메인 규칙을 전송·UI·작업 큐
  계층에 중복 구현해서는 안 된다(MUST NOT).
- 새로운 프레임워크, 별도 서비스, 저장소 또는 메시징 계층은 측정된 필요,
  대안 비교, 운영 비용, 데이터 migration, rollback과 검증 계획이 SOT에
  기록된 뒤에만 도입할 수 있다(MUST).
- 앱 release와 콘텐츠 release·rollback은 독립적으로 수행할 수 있어야
  한다(MUST).

이 원칙은 조기 분산화와 중복 정본을 막으면서, 측정된 필요가 생겼을 때
검증 가능한 방식으로 구조를 확장하게 한다.

### VII. 증거 기반 TDD와 품질 게이트

- 모든 기능과 버그 수정은 실패하는 테스트를 먼저 작성하고
  RED -> GREEN -> REFACTOR 순서로 구현해야 한다(MUST).
- Elixir와 TypeScript의 line·branch coverage는 각각 80% 이상이어야 한다
  (MUST). event fold, 멱등 ingest, trial import, rating 검증과 pack 활성화의
  모든 식별된 위험 분기는 직접 테스트해야 한다(MUST).
- 변경 성격에 맞는 단위, 통합, 계약, E2E, 접근성, 성능, 보안과 운영 복구
  테스트를 계획에 포함하고 실행해야 한다(MUST).
- 결정적 테스트를 위해 시계, UUID, 난수 seed와 network scheduler를 주입하고,
  실패 seed를 저장해 CI에서 재현할 수 있어야 한다(MUST).
- 각 페이즈는 실제 동작 증거, 자동화 테스트·접근성·성능·보안 결과, 발견해
  수정한 우려와 다음 단계 진입 판단을 기록하기 전에는 완료가 아니다(MUST).
- P0 또는 P1 결함이 남아 있는 release는 다음 운영 단계로 승격해서는 안 된다
  (MUST NOT).

이 원칙은 정상 경로뿐 아니라 실패와 복구의 정확성을 반복 가능한 증거로
입증하게 한다.

### VIII. 접근성·저데이터 환경을 기본 제약으로

- 저가형 Android와 불안정 네트워크를 성능·데이터 사용의 기준 환경으로
  삼아야 한다(MUST).
- 관련 UI는 키보드, screen reader, focus, `aria-live`, 200% 확대, 고대비,
  reduced motion과 일본어 ruby를 검증해야 한다(MUST).
- 오디오는 사용자 요청 전에 다운로드하거나 재생해서는 안 되며(MUST NOT),
  모바일 데이터에서는 자동 다운로드와 백그라운드 갱신을 해서는 안 된다
  (MUST NOT).
- 실제 build와 기기 측정으로 byte, latency, 저장 용량 예산을 Phase 2에서
  고정하고(MUST), 이후 품질 게이트에서 회귀를 검사해야 한다(MUST).
- 연결 끊김, 빈 상태, 오류와 저장공간 부족을 숨겨서는 안 되며(MUST NOT),
  핵심 학습을 계속하거나 안전하게 복구할 경로를 제공해야 한다(MUST).

이 원칙은 다국어 PWA의 주요 사용 환경을 사후 최적화가 아닌 설계 입력으로
다룬다.

## 권위 계층 및 제품·기술 제약

이 프로젝트의 지속적인 권위 계층은 다음과 같다.

1. 이 헌법: 변경할 수 없는 것이 아니라, 별도 개정 절차가 필요한 최상위
   원칙과 거버넌스를 정의한다.
2. 프로젝트 SOT: 현재 유효한 제품·기술 계약, 결정, acceptance criteria와
   검증 근거를 정의한다. 별도 SOT가 비준되기 전에는
   `docs/PRODUCT_IMPLEMENTATION_SPEC.md`가 이 역할을 수행한다.
3. 기능별 spec, plan, tasks, runbook과 운영 문서: SOT를 특정 변경과 실행
   단위로 구체화한다.
4. 최초 제안서와 검토본: 역사적 근거이며 상위 문서와 충돌할 때 우선하지
   않는다.

프로젝트 소유자가 대화에서 승인한 변경은 유효한 변경 지시지만, 같은 작업에서
헌법 또는 SOT와 영향받는 하위 문서에 반영해야 지속적인 정본이 된다(MUST).
문서 간 충돌은 상위 문서를 따르고, 하위 문서를 수정하거나 명시적 헌법 개정을
완료하기 전에는 구현을 진행해서는 안 된다(MUST NOT).

첫 통합 기준선은 `웹/PWA + 한국어 N5 + 일본어에서 뜻으로 가는 단방향 어휘
카드 + Again/Good 2버튼 FSRS`다. 후속 언어, 레벨, 광고, 문제 연습과 모의시험은
SOT의 페이즈 순서와 선행 게이트를 따라야 한다(MUST). 자체 제작 콘텐츠 파일을
받기 전에는 카드 뒷면의 세부 배치, importer mapping과 중복 규칙을 추측해서는
안 된다(MUST NOT).

FSRS 최적화 문턱, clock skew, schema 호환 창, cache quota, rate limit,
RPO/RTO와 같은 운영 수치는 제품 질문으로 되돌리지 않는다. 해당 페이즈의 공식
제약, 테스트, 실제 build, 저사양 기기와 운영 데이터를 사용해 결정하고, 값,
근거, 버전, 승격·중단 조건을 SOT에 기록해야 한다(MUST).

## 개발 워크플로와 품질 게이트

모든 변경은 다음 순서를 따라야 한다(MUST).

1. SOT와 관련 요구사항을 식별하고 독립적으로 검증 가능한 acceptance
   criteria, 제외 범위와 실패·복구 동작을 작성한다.
2. 구현 전 Constitution Check를 수행해 각 원칙의 적용 여부와 검증 방법을
   기록한다. 적용되지 않는 원칙에는 이유를 남긴다.
3. 자동화 테스트를 먼저 작성해 의도한 이유로 실패하는지 확인한다.
4. 최소 구현으로 테스트를 통과시킨 뒤 중복과 복잡성을 제거한다.
5. 코드 품질, 보안, 개인정보, 접근성, 성능과 운영 복구를 검토하고 관련
   문서와 추적표를 같은 변경에서 갱신한다.
6. 페이즈 게이트 증거를 기록하고 다음 단계 진입 가능 여부를 판정한다.

요구사항은 SOT의 결정 또는 acceptance criterion에서 spec, plan, task, test와
운영 증거까지 추적할 수 있어야 한다(MUST). event, schema, pack 또는 콘텐츠
계약 변경에는 migration, N/N-1 호환성, rollback과 데이터 보존 검증을 포함해야
한다(MUST).

일시적 예외는 프로젝트 소유자가 승인한 waiver로만 허용한다. waiver에는 위반
원칙, 이유, 범위, 책임자, 만료일, 사용자·데이터 영향, 복구 계획과 후속 검증을
기록해야 한다(MUST). 보안 취약점, 학습 event 손실, 권한 상승, 개인정보 누출과
사용자 데이터의 묵시적 삭제는 waiver 대상이 될 수 없다(MUST NOT).

## Governance

이 헌법은 모든 프로젝트 관행과 하위 문서보다 우선한다. 개정에는 변경 이유,
영향받는 원칙과 SOT 항목, 사용자·데이터 영향, migration·rollback 계획, 검증
증거와 프로젝트 소유자의 명시적 승인이 필요하다(MUST). 개정과 같은 변경에서
Sync Impact Report, SOT, README와 영향받는 템플릿을 함께 갱신해야 한다(MUST).

헌법 버전은 Semantic Versioning을 따른다.

- MAJOR: 원칙을 제거하거나 의미를 호환되지 않게 재정의하거나, 거버넌스의
  권위·승인 절차를 호환되지 않게 변경한다.
- MINOR: 새 원칙이나 섹션을 추가하거나 기존 의무를 실질적으로 확장한다.
- PATCH: 의미를 바꾸지 않는 명확화, 오탈자와 표현 수정이다.

모든 spec과 plan은 시작 전에 Constitution Check를 통과해야 하며(MUST), 모든
변경은 병합 전 준수 검토를 받아야 한다(MUST). 각 페이즈 종료와 release 전에는
원칙별 증거, waiver 만료 여부와 SOT 동기화를 다시 검토해야 한다(MUST).
준수하지 못한 변경은 수정하거나 승인된 waiver를 기록하기 전에는 병합 또는
승격할 수 없다(MUST NOT).

**Version**: 1.0.0 | **Ratified**: 2026-07-13 | **Last Amended**: 2026-07-13
