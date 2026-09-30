import './styles.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="shell">
    <section class="labs" aria-label="공부 목록">
      <article class="lab-card">
        <h2>HLS.js</h2>
        <p>HTTP 기반 스트리밍, 적응형 화질과 플레이어 이벤트를 직접 적용 해보기</p>
        <code>src/hls/</code>
      </article>

      <article class="lab-card">
        <h2>WebRTC</h2>
        <p>미디어 캡처, PeerConnection과 실시간 통신 흐름을 직접 적용 해보기</p>
        <code>src/webrtc/</code>
      </article>
    </section>
  </main>
`
