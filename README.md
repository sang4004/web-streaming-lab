# Web Streaming Lab

HLS.js와 WebRTC를 단계별로 실험하고 비교하는 학습용 프로젝트입니다.

## 개발 환경

- Node.js 22.12 이상 (`.nvmrc` 제공)
- npm 10 이상
- Vite + React + TypeScript
- React Router (BrowserRouter)

## 시작하기

```bash
npm install
npm run dev
```

## 명령어

```bash
npm run dev        # 개발 서버 실행
npm run typecheck  # TypeScript 타입 검사
npm run build      # 타입 검사 후 프로덕션 빌드
npm run preview    # 프로덕션 빌드 미리보기
```

## 프로젝트 구조

```text
.
├── src/
│   ├── components/ # 공통 페이지 레이아웃
│   ├── pages/      # 함수형 페이지 컴포넌트 (.tsx)
│   ├── router/     # 페이지 경로 등록
│   ├── hls/        # HLS.js 실습
│   ├── webrtc/     # WebRTC 실습
│   ├── App.tsx    # BrowserRouter 연결
│   ├── main.tsx   # React 앱 시작
│   └── styles.css
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 페이지 구성

페이지는 JSX를 반환하는 React 함수형 컴포넌트로 작성합니다.
경로는 `src/router/routes.tsx`에서 등록하고, 페이지 이동에는 React Router의 `Link`를 사용합니다.

- `/`: 실습 목록
- `/hls`: HLS.js 실습
- `/webrtc`: WebRTC getUserMedia 실습
- 그 외 경로: 페이지를 찾을 수 없음

## 코드 컨벤션

동작 원리를 이해할 수 있는 명확한 이름과 읽기 쉬운 코드를 우선
