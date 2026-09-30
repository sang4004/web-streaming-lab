# Web Streaming Lab

HLS.js와 WebRTC를 단계별로 실험하고 비교하는 학습용 프로젝트입니다.

## 개발 환경

- Node.js 22.12 이상 (`.nvmrc` 제공)
- npm 10 이상
- Vite + Vanilla TypeScript

현재 시스템의 Node.js가 요구 버전과 다르면 다음 명령으로 전환합니다.

```bash
nvm install
nvm use
```

## 시작하기

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

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
│   ├── hls/       # HLS.js 실습
│   ├── webrtc/    # WebRTC 실습
│   ├── main.ts
│   └── styles.css
├── index.html
├── package.json
└── tsconfig.json
```

아직 HLS.js와 WebRTC 기능은 구현하지 않았으며, 각 디렉터리에 실습을 독립적으로 추가할 예정입니다.
