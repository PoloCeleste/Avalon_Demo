# 교육 관리 시스템 - 데모 버전

> 데모 프로젝트입니다. 실제 데이터베이스 연결 없이 하드코딩된 샘플 데이터로 동작하는 기능 시연용 입니다.

## 주요 기능

- **인증**: JWT 기반 로그인/로그아웃
- **학생/교사/클래스 관리**: 학생 및 클래스 정보 조회
- **커리큘럼**: 커리큘럼 조회
- **숙제 관리**: 숙제 등록, 체크, 학생별 확인
- **수업 관리**: 수업 세션, 시간표, 휴일 조회
- **대시보드**: 저성과 학생, 숙제 진행률 통계
- ~~**카카오톡 발송**: 매주 학부모께 친구톡으로 금주 학생 성과 발송 (데모 제외)~~
- ~~**시간표 출력**: 반별 해당학기 시간표 출력 (데모 제외)~~

## 기술 스택

**Frontend**: React 18 + TypeScript + Vite + Zustand + Axios + TailwindCSS

**Backend**: FastAPI + Python + Pydantic, ~~SpringBoot + SOLAPI (데모 제외)~~

~~**DB:** MySQL, Redis (데모 제외)~~

## 폴더 구조

```
Avalon_Demo/
├── FE/AL-homepage/
│   ├── src/
│   │   ├── api/              # API 호출 함수
│   │   ├── pages/            # 페이지 (Login, Dashboard, Admin, ...)
│   │   ├── components/       # UI 컴포넌트
│   │   ├── store/            # Zustand 상태 관리
│   │   ├── types/            # TypeScript 타입 정의
│   │   └── router/           # 라우팅
│   └── package.json
│
└── BE/avalon/
    ├── app/
    │   ├── api/              # API 엔드포인트 (/api/auth, /api/students, ...)
    │   ├── core/             # 설정, 보안, 로깅
    │   ├── models/           # DB 모델 정의
    │   ├── schemas/          # Pydantic 스키마
    │   └── main.py           # FastAPI 앱
    ├── run.py                # 실행 파일
    └── requirements.txt
```

## 프로젝트 상세

본 프로젝트는 학원 운영의 효율성을 위한 백오피스 솔루션입니다. 학생, 반, 교사, 커리큘럼, 과제, 테스트, 상담 등 학원 내 주요 업무를 하나의 플랫폼에서 관리할 수 있도록 하였습니다. FastAPI 기반의 비동기 백엔드와 MySQL, Redis, SQLAlchemy, Alembic 등을 활용해 대용량 데이터 처리와 실시간 캐시, 통계 기능을 제공합니다. Agile 방식으로 개발하였으며, 확장 가능하도록 설계하였습니다.

주요 기능으로는 학생/반/교사/수업/테스트/상담/과제 등 모든 학사 데이터의 CRUD 및 통계, CSV 대량 데이터 등록, 권한별 API 접근 제어, 실시간 캐시 및 백그라운드 갱신, 통계 대시보드, 과제 체크, 학기별 커리큘럼 관리, 상담 및 테스트 결과 관리, 반별 스케쥴 PDF 생성, 주간 숙제 피드백 카카오톡 발송 등이 있습니다. 추가적으로, Postfix 메일 서버를 구축하여 회원 비밀번호 재설정 메일을 발송하며, 별도의 Spring Boot 기반 서버를 통해 카카오톡 메시지 스케쥴링 자동발송 기능을 구현하였습니다.

### API 구조

- `/api/auth/` - 로그인
- `/api/students/` - 학생
- `/api/classes/` - 클래스
- `/api/curriculums/` - 커리큘럼
- `/api/curriculum_details/` - 커리큘럼 상세
- `/api/homeworks/` - 숙제
- `/api/check_homeworks/` - 숙제 체크
- `/api/class_sessions/` - 수업 세션
- 등등...

#### 데모 링크

[https://avalon.poloceleste.site/](https://avalon.poloceleste.site/ "데모")
