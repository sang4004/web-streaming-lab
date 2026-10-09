import PageLayout from "../components/PageLayout";
import GetUserMedia from "../webrtc/get-user-media";

const WebRtcPage = () => {
  return (
    <PageLayout title="WebRTC 실습">
      <GetUserMedia />
    </PageLayout>
  );
};

export default WebRtcPage;
