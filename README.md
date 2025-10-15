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
- **Backend**: Tauri (Rust)
- **AI**: OpenAI GPT API 또는 다른 AI 서비스
- **Jira 연동**: Atlassian REST API
- **UI Framework**: Material-UI (MUI)
- **상태 관리**: Zustand
- **아이콘**: MUI Icons

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

## 📁 프로젝트 구조

```
PenguExec/
├── src/                    # React 프론트엔드
│   ├── components/         # React 컴포넌트
│   ├── hooks/             # 커스텀 훅
│   ├── services/          # API 서비스
│   ├── store/             # 상태 관리
│   └── types/             # TypeScript 타입 정의
├── src-tauri/             # Tauri 백엔드
│   ├── src/               # Rust 소스 코드
│   └── Cargo.toml         # Rust 의존성
├── public/                # 정적 파일
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
VITE_OPENAI_API_KEY=your-openai-api-key
```

## 📝 사용법

1. **연결 설정**: Jira 계정 정보 및 AI API 키 설정
2. **자연어 입력**: "버그 수정이 필요해", "새 기능 추가 요청" 등 자연어로 요청
3. **AI 분석**: AI가 요청을 분석하여 이슈 타입, 우선순위, 설명 등을 결정
4. **이슈 생성**: 분석 결과를 바탕으로 Jira에 이슈 자동 생성

## 🔍 개발자 기능

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
