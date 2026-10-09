import { Link } from "react-router";

import PageLayout from "../components/PageLayout";

const HomePage = () => {
  return (
    <PageLayout title="Web Streaming Lab" isBackLinkVisible={false}>
      <section className="labs" aria-label="공부 목록">
        <Link className="lab-card" to="/hls">
          <span className="lab-title">HLS.js</span>
          <span className="lab-description">
            HTTP 기반 스트리밍, 적응형 화질과 플레이어 이벤트를 직접 적용 해보기
          </span>
          <code>src/hls/</code>
        </Link>

        <Link className="lab-card" to="/webrtc">
          <span className="lab-title">WebRTC</span>
          <span className="lab-description">
            미디어 캡처, PeerConnection과 실시간 통신 흐름을 직접 적용 해보기
          </span>
          <code>src/webrtc/</code>
        </Link>
      </section>
    </PageLayout>
  );
};

export default HomePage;
