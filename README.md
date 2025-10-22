# PenguExec - AI-Powered Jira Assistant

## 📋 개요

PenguExec는 Tauri 프레임워크와 AI를 활용하여 자연어로 Jira 이슈를 생성하고 관리할 수 있는 데스크톱 애플리케이션입니다. 사용자가 자연어로 요청하면 AI가 이를 분석하여 적절한 Jira 이슈로 변환해주는 스마트한 도구입니다.

## 🎯 주요 기능

### 1차 목표
- **자연어 이슈 생성**: 사용자가 자연어로 입력한 요청을 AI가 분석하여 Jira 이슈로 변환
- **Jira API 연동**: Atlassian Jira와의 원활한 연동
- **직관적인 UI**: 간단하고 사용하기 쉬운 사용자 인터페이스
- **개발용 로깅**: 실시간 로그 뷰어와 파일 로깅 기능

### 향후 계획
- 이슈 상태 업데이트
- 이슈 검색 및 필터링
- 팀 협업 기능
- 대시보드 및 분석

## 🛠 기술 스택

- **Frontend**: React + TypeScript
- **Architecture**: Feature-Sliced Design (FSD)
- **Backend**: Tauri (Rust)
- **AI**: Google Gemini API
- **Jira 연동**: Atlassian REST API
- **UI Framework**: Material-UI (MUI)
- **상태 관리**: Zustand
- **아이콘**: MUI Icons
- **코드 품질**: ESLint + Steiger (FSD 린터)

## 🚀 시작하기

### 필요 조건
- Node.js (v18 이상)
- Rust (최신 버전)
- Jira 계정 및 API 토큰

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run tauri dev

# 빌드
npm run tauri build
```

### 개발 스크립트
```bash
# 개발 서버 (웹만)
npm run dev

# Tauri 개발 서버
npm run tauri dev

# 빌드 (웹만)
npm run build

# Tauri 빌드
npm run tauri build

# FSD 규칙 검사
npx steiger ./src

# FSD 자동 수정
npx steiger ./src --fix
```

## 📁 프로젝트 구조 (Feature-Sliced Design)

```
PenguExec/
├── src/                           # React 프론트엔드 (FSD 구조)
│   ├── app/                       # 앱 레벨 (진입점)
│   │   ├── App.tsx               # 메인 앱 컴포넌트
│   │   ├── main.tsx              # 앱 진입점
│   │   └── providers/            # 앱 프로바이더
│   ├── pages/                     # 페이지 레이어
│   │   └── main/                 # 메인 페이지
│   │       └── ui/               # 페이지 UI 컴포넌트
│   ├── widgets/                   # 위젯 레이어 (복합 UI 블록)
│   │   └── main-layout/          # 메인 레이아웃 위젯
│   │       └── ui/               # 위젯 UI 컴포넌트
│   ├── features/                  # 기능 레이어
│   │   ├── issue-creation/       # 이슈 생성 기능
│   │   ├── settings/             # 설정 기능
│   │   └── task-execution/       # 작업 실행 기능
│   ├── entities/                  # 엔티티 레이어 (비즈니스 객체)
│   │   ├── issue/                # 이슈 엔티티
│   │   ├── task/                 # 작업 엔티티
│   │   └── settings/             # 설정 엔티티
│   └── shared/                    # 공유 레이어
│       ├── ui/                   # 공통 UI 컴포넌트
│       ├── lib/                  # 공통 라이브러리
│       └── config/               # 설정
├── src-tauri/                    # Tauri 백엔드
│   ├── src/                      # Rust 소스 코드
│   └── Cargo.toml                # Rust 의존성
├── public/                       # 정적 파일
└── README.md
```

## 🔧 설정

### Jira 설정
1. Jira 계정에서 API 토큰 생성
2. 환경 변수 파일에 설정 추가:
   ```
   VITE_JIRA_BASE_URL=https://your-domain.atlassian.net
   VITE_JIRA_EMAIL=your-email@example.com
   VITE_JIRA_API_TOKEN=your-api-token
   ```

### AI 설정
```
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_AI_MODEL=gemini-2.0-flash-exp
```

## 📝 사용법

1. **연결 설정**: Jira 계정 정보 및 Gemini API 키 설정
2. **자연어 입력**: "버그 수정이 필요해", "새 기능 추가 요청" 등 자연어로 요청
3. **AI 분석**: AI가 요청을 분석하여 이슈 타입, 우선순위, 설명 등을 결정
4. **이슈 생성**: 분석 결과를 바탕으로 Jira에 이슈 자동 생성

## 🔍 개발자 기능

### Feature-Sliced Design 구조
- **레이어 분리**: app, pages, widgets, features, entities, shared
- **의존성 방향**: 상위 레이어가 하위 레이어를 참조
- **모듈화**: 각 레이어가 명확한 책임을 가짐
- **확장성**: 새로운 기능 추가 시 적절한 레이어에 배치

### 코드 품질 도구
```bash
# FSD 규칙 검사
npx steiger ./src

# 자동 수정
npx steiger ./src --fix

# TypeScript 린트
npm run lint
```

### 로그 뷰어
- 개발 모드에서 "로그" 버튼을 클릭하여 실시간 로그 확인
- 로그 레벨별 필터링 (DEBUG, INFO, WARN, ERROR)
- 소스별 필터링 및 검색 기능
- 로그 내보내기 및 파일 저장 기능

### 로깅 기능
- 모든 주요 작업에 대한 상세 로깅
- Tauri 백엔드와 프론트엔드 간의 통신 로깅
- 에러 및 예외 상황 추적
- 성능 및 사용 패턴 분석

## 🏗️ 아키텍처 가이드

### 레이어별 역할

#### App Layer (`src/app/`)
- 앱의 진입점과 전역 설정
- 프로바이더와 라우팅 설정
- 앱 레벨 상태 관리

#### Pages Layer (`src/pages/`)
- 페이지 컴포넌트
- 라우팅과 연결된 최상위 컴포넌트
- 페이지별 레이아웃

#### Widgets Layer (`src/widgets/`)
- 복합 UI 블록
- 여러 features를 조합한 위젯
- 재사용 가능한 복잡한 컴포넌트

#### Features Layer (`src/features/`)
- 사용자 시나리오별 기능
- 비즈니스 로직과 UI의 결합
- 독립적으로 동작하는 기능 단위

#### Entities Layer (`src/entities/`)
- 비즈니스 객체와 도메인 로직
- API 호출과 데이터 변환
- 도메인별 타입 정의

#### Shared Layer (`src/shared/`)
- 공통 유틸리티와 컴포넌트
- 프로젝트 전반에서 사용되는 코드
- 외부 라이브러리 래퍼

### 의존성 규칙
```
app → pages → widgets → features → entities → shared
```

### 개발 가이드라인
1. **새 기능 추가**: features 레이어에 배치
2. **공통 컴포넌트**: shared 레이어에 배치
3. **비즈니스 로직**: entities 레이어에 배치
4. **복합 UI**: widgets 레이어에 배치
5. **페이지**: pages 레이어에 배치

별 이상한 내용을 다써놨네