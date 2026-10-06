import { useEffect, useRef, useState } from "react";
import "./styles.css";
import {
  getCameraErrorMessage,
  getCameraStream,
  stopCameraStream,
} from "./get-user-media";
import { forwardIceCandidates } from "./peer-connection";

const GetUserMedia = () => {
  // 카메라 영상 랜더링을 위한 video ref
  const videoRef = useRef<HTMLVideoElement>(null);
  // 카메라 스트림을 저장하기 위한 ref
  const streamRef = useRef<MediaStream | null>(null);
  // 원격 영상 랜더링을 위한 video ref
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // 송신 PeerConnection을 보관하는 ref
  const localPeerRef = useRef<RTCPeerConnection | null>(null);
  // 수신 PeerConnection을 보관하는 ref
  const remotePeerRef = useRef<RTCPeerConnection | null>(null);

  // 카메라 상태 관리
  const [status, setStatus] = useState<"idle" | "opening" | "active">("idle");
  // 카메라 요청 및 WebRTC 협상 오류 메시지 관리
  const [errorMessage, setErrorMessage] = useState("");
  // WebRTC 연결 상태 관리
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");

  // 연결 상태에 따른 상태 텍스트
  const statusText = {
    idle: "연결 대기",
    opening: "카메라 연결 중",
    active: "카메라 켜짐",
  }[status];

  // WebRTC 연결 상태에 따른 표시 문구
  const connectionStatusText = {
    new: "수신 대기",
    connecting: "연결 중",
    connected: "연결됨",
    disconnected: "연결 끊김",
    failed: "연결 실패",
    closed: "연결 종료",
  }[connectionState];

  // 정리 함수에서 WebRTC 연결과 카메라 스트림 종료
  useEffect(() => {
    return () => {
      // 컴포넌트 종료 시 WebRTC 연결 종료
      localPeerRef.current?.close();
      remotePeerRef.current?.close();

      // 컴포넌트 종료 시 ref 초기화
      localPeerRef.current = null;
      remotePeerRef.current = null;

      // 컴포넌트 종료 시 카메라 스트림 종료
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  // 카메라 열기 버튼 클릭 시 카메라 스트림 시작
  const handleOpenCamera = async () => {
    if (status !== "idle" || streamRef.current) return;

    // 새 요청을 시작할 때 이전 오류 제거
    setErrorMessage("");
    setStatus("opening");

    try {
      const stream = await getCameraStream();
      const video = videoRef.current;

      // 권한을 기다리는 동안 페이지를 나가거나 다른 요청이 먼저 연결됐다면 새로운 스트림 종료
      if (!video || streamRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;

      // 연결 상태를 활성화로 변경
      setStatus("active");
    } catch (error) {
      // 카메라 요청 실패 시 에러 메시지 표시
      console.error("카메라 요청 실패:", error);
      setErrorMessage(getCameraErrorMessage(error));
      setStatus("idle");
    }
  };

  // 카메라 닫기 버튼 클릭 시 카메라 스트림 종료
  const handleCloseCamera = () => {
    if (status !== "active" || !streamRef.current) return;

    handleStopConnection();

    stopCameraStream(streamRef.current);
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus("idle");
  };

  // WebRTC 연결 시작
  const handleStartConnection = async () => {
    const stream = streamRef.current;

    // 카메라가 없거나 이미 연결 객체를 만들었다면 종료
    if (!stream || localPeerRef.current || remotePeerRef.current) return;

    // 실제로 새 연결을 시작할 때 이전 오류 제거
    setErrorMessage("");

    const localPeer = new RTCPeerConnection();
    const remotePeer = new RTCPeerConnection();

    localPeerRef.current = localPeer;
    remotePeerRef.current = remotePeer;

    // 송신 쪽 ICE 후보를 수신 쪽으로 전달하도록 설정
    const enableRemoteIce = forwardIceCandidates(localPeer, remotePeer);
    // 수신 쪽 ICE 후보를 송신 쪽으로 전달하도록 설정
    const enableLocalIce = forwardIceCandidates(remotePeer, localPeer);

    try {
      // 수신 쪽에서 트랙을 받으면 영상 요소에 연결
      remotePeer.addEventListener("track", (event) => {
        if (remotePeerRef.current !== remotePeer) return;

        const [receivedStream] = event.streams;
        const video = remoteVideoRef.current;

        if (video && receivedStream) {
          video.srcObject = receivedStream;
        }
      });

      // 수신 연결의 상태가 바뀌면 화면에 반영
      remotePeer.addEventListener("connectionstatechange", () => {
        // 이미 종료되거나 교체된 연결의 이벤트는 무시
        if (remotePeerRef.current !== remotePeer) return;

        setConnectionState(remotePeer.connectionState);
        console.log("수신 WebRTC 연결 상태:", remotePeer.connectionState);
      });

      // 송신 쪽에 카메라 트랙 등록
      stream.getTracks().forEach((track) => {
        localPeer.addTrack(track, stream);
      });

      // 송신 쪽에서 연결 제안 생성
      const offer = await localPeer.createOffer();
      await localPeer.setLocalDescription(offer);

      // 수신 쪽에 제안 전달
      await remotePeer.setRemoteDescription(offer);
      enableRemoteIce();

      // 수신 쪽에서 응답 생성
      const answer = await remotePeer.createAnswer();
      await remotePeer.setLocalDescription(answer);

      // 송신 쪽에 응답 전달
      await localPeer.setRemoteDescription(answer);
      enableLocalIce();

      console.log("송신 협상 상태:", localPeer.signalingState);
      console.log("수신 협상 상태:", remotePeer.signalingState);
    } catch (error) {
      localPeer.close();
      remotePeer.close();

      // 페이지 이탈이나 다른 연결로 교체된 경우 종료
      if (localPeerRef.current !== localPeer) return;

      localPeerRef.current = null;
      remotePeerRef.current = null;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      console.error("WebRTC 협상 실패:", error);
      setErrorMessage("WebRTC 연결 협상에 실패했습니다. 다시 시도해주세요.");
      setConnectionState("new");
    }
  };

  // 카메라는 유지하고 WebRTC 연결만 종료
  const handleStopConnection = () => {
    localPeerRef.current?.close();
    remotePeerRef.current?.close();

    localPeerRef.current = null;
    remotePeerRef.current = null;

    // 수신 영상만 비우기
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // 다시 연결할 수 있도록 대기 상태로 초기화
    setConnectionState("new");
  };

  return (
    <section className="get-user-media" aria-labelledby="get-user-media-title">
      <header className="get-user-media__header">
        <p className="get-user-media__eyebrow">WebRTC 첫 번째 실습</p>
        <h1 id="get-user-media-title">getUserMedia 실습</h1>
        <p className="get-user-media__description">
          카메라를 열고 브라우저에서 내 영상 확인 하기
        </p>
      </header>

      {/* 로컬 카메라 */}
      <div className="get-user-media__preview">
        <div className="get-user-media__preview-header">
          <span>카메라 미리보기</span>
          <span
            className="get-user-media__status"
            data-status={status}
            role="status"
          >
            {statusText}
          </span>
        </div>

        <video
          ref={videoRef}
          className="get-user-media__video"
          id="local-video"
          aria-label="내 카메라 영상"
          autoPlay
          playsInline
          muted
        />
      </div>

      {/* WebRTC 수신 영상 */}
      <div className="get-user-media__preview">
        <div className="get-user-media__preview-header">
          <span>WebRTC 수신 영상</span>
          <span
            className="get-user-media__status"
            data-status={connectionState}
            role="status"
          >
            {connectionStatusText}
          </span>
        </div>

        <video
          ref={remoteVideoRef}
          className="get-user-media__video get-user-media__video--remote"
          id="remote-video"
          aria-label="WebRTC로 받은 영상"
          autoPlay
          playsInline
          muted
        />
      </div>

      <div className="get-user-media__controls">
        <button
          className="get-user-media__button get-user-media__button--primary"
          id="open-camera"
          type="button"
          onClick={handleOpenCamera}
          disabled={status !== "idle"}
        >
          카메라 열기
        </button>
        <button
          className="get-user-media__button"
          id="close-camera"
          type="button"
          onClick={handleCloseCamera}
          disabled={status !== "active"}
        >
          카메라 닫기
        </button>
        <button
          className="get-user-media__button"
          type="button"
          onClick={handleStartConnection}
          disabled={status !== "active" || connectionState !== "new"}
        >
          WebRTC 연결 준비
        </button>
        <button
          className="get-user-media__button"
          type="button"
          onClick={handleStopConnection}
          disabled={connectionState === "new"}
        >
          WebRTC 연결 종료
        </button>
      </div>

      <p className="get-user-media__notice">
        카메라 제어 기능을 준비 중입니다.
      </p>
      <p className="get-user-media__error" id="error-message" role="alert">
        {errorMessage}
      </p>
    </section>
  );
};

export default GetUserMedia;
