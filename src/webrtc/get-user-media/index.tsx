import { useEffect, useRef, useState } from "react";

import {
  getCameraErrorMessage,
  getCameraStream,
  stopCameraStream,
} from "./get-user-media";
import { forwardIceCandidates } from "./peer-connection";

import "./styles.css";

type CameraStatus = "idle" | "opening" | "active";

const GetUserMedia = () => {
  // 카메라 영상을 렌더링할 video 요소
  const videoRef = useRef<HTMLVideoElement>(null);
  // 카메라 스트림을 저장하기 위한 ref
  const streamRef = useRef<MediaStream | null>(null);
  // WebRTC 수신 영상을 렌더링할 video 요소
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // 송신 PeerConnection을 보관하는 ref
  const localPeerRef = useRef<RTCPeerConnection | null>(null);
  // 수신 PeerConnection을 보관하는 ref
  const remotePeerRef = useRef<RTCPeerConnection | null>(null);
  // 카메라 영상의 WebRTC 송신 객체 보관
  const videoSenderRef = useRef<RTCRtpSender | null>(null);

  // 카메라 상태 관리
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  // 카메라 요청 및 WebRTC 협상 오류 메시지 관리
  const [errorMessage, setErrorMessage] = useState("");
  // WebRTC 연결 상태 관리
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");
  // 영상 송출 여부
  const [isVideoSending, setIsVideoSending] = useState(false);
  // 송출 전환 중 중복 클릭 방지용
  const [isVideoSwitching, setIsVideoSwitching] = useState(false);

  // 카메라 상태에 따른 표시 문구
  const cameraStatusText = {
    idle: "연결 대기",
    opening: "카메라 연결 중",
    active: "카메라 켜짐",
  }[cameraStatus];

  // WebRTC 연결 상태에 따른 표시 문구
  const connectionStatusText = {
    new: "수신 대기",
    connecting: "연결 중",
    connected: "연결됨",
    disconnected: "연결 끊김",
    failed: "연결 실패",
    closed: "연결 종료",
  }[connectionState];

  // 연결은 유지되지만 영상 송출을 중지한 경우에만 안내 화면 표시
  const isRemoteVideoPaused =
    connectionState === "connected" && !isVideoSending;

  // 페이지 이탈 시 WebRTC 연결과 카메라 스트림을 정리
  useEffect(() => {
    return () => {
      // 컴포넌트 종료 시 WebRTC 연결 종료
      localPeerRef.current?.close();
      remotePeerRef.current?.close();

      // 컴포넌트 종료 시 ref 초기화
      localPeerRef.current = null;
      remotePeerRef.current = null;
      videoSenderRef.current = null;

      // 컴포넌트 종료 시 카메라 스트림 종료
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  // 카메라는 유지하고 WebRTC 연결만 종료
  const handleStopConnection = () => {
    localPeerRef.current?.close();
    remotePeerRef.current?.close();

    localPeerRef.current = null;
    remotePeerRef.current = null;
    videoSenderRef.current = null;

    // 연결 종료에 따른 송출 상태 초기화
    setIsVideoSending(false);
    setIsVideoSwitching(false);

    // 수신 영상만 비우기
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // 다시 연결할 수 있도록 대기 상태로 초기화
    setConnectionState("new");
  };

  // 카메라 열기 버튼 클릭 시 카메라 스트림 시작
  const handleOpenCamera = async () => {
    if (cameraStatus !== "idle" || streamRef.current) {
      return;
    }

    // 새 요청을 시작할 때 이전 오류 제거
    setErrorMessage("");
    setCameraStatus("opening");

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

      // WebRTC 연결 상태와 별개로 카메라 상태를 활성화
      setCameraStatus("active");
    } catch (error) {
      // 카메라 요청 실패 시 에러 메시지 표시
      console.error("카메라 요청 실패:", error);
      setErrorMessage(getCameraErrorMessage(error));
      setCameraStatus("idle");
    }
  };

  // WebRTC 연결과 카메라 스트림을 모두 종료
  const handleCloseCamera = () => {
    if (cameraStatus !== "active" || !streamRef.current) {
      return;
    }

    handleStopConnection();

    stopCameraStream(streamRef.current);
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStatus("idle");
  };

  // WebRTC 연결 시작
  const handleStartConnection = async () => {
    const stream = streamRef.current;

    // 카메라가 없거나 이미 연결 객체를 만들었다면 종료
    if (!stream || localPeerRef.current || remotePeerRef.current) {
      return;
    }

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
        if (remotePeerRef.current !== remotePeer) {
          return;
        }

        const [receivedStream] = event.streams;
        const video = remoteVideoRef.current;

        if (video && receivedStream) {
          video.srcObject = receivedStream;
        }
      });

      // 수신 연결의 상태가 바뀌면 화면에 반영
      remotePeer.addEventListener("connectionstatechange", () => {
        // 이미 종료되거나 교체된 연결의 이벤트는 무시
        if (remotePeerRef.current !== remotePeer) {
          return;
        }

        setConnectionState(remotePeer.connectionState);
        console.log("수신 WebRTC 연결 상태:", remotePeer.connectionState);
      });

      // 송신 쪽에 카메라 트랙 등록
      stream.getTracks().forEach((track) => {
        const sender = localPeer.addTrack(track, stream);

        if (track.kind === "video") {
          videoSenderRef.current = sender;
          setIsVideoSending(true);
        }
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
      if (localPeerRef.current !== localPeer) {
        return;
      }

      localPeerRef.current = null;
      remotePeerRef.current = null;
      videoSenderRef.current = null;

      // 현재 연결의 실패일 때만 화면 상태 초기화
      setIsVideoSending(false);
      setIsVideoSwitching(false);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      console.error("WebRTC 협상 실패:", error);
      setErrorMessage("WebRTC 연결 협상에 실패했습니다. 다시 시도해주세요.");
      setConnectionState("new");
    }
  };

  // 카메라 영상 송출 켜기/끄기
  const handleToggleVideoSending = async () => {
    const sender = videoSenderRef.current;
    const [videoTrack] = streamRef.current?.getVideoTracks() ?? [];

    if (
      connectionState !== "connected" ||
      !sender ||
      !videoTrack ||
      isVideoSwitching
    ) {
      return;
    }

    // 송신기에 트랙이 없으면 재개하고, 있으면 중지
    const isNextVideoSending = sender.track === null;

    setErrorMessage("");
    setIsVideoSwitching(true);

    try {
      // 송출 상태 전환
      await sender.replaceTrack(isNextVideoSending ? videoTrack : null);

      // 기다리는 동안 연결이 종료되거나 교체됐다면 무시
      if (videoSenderRef.current !== sender) {
        return;
      }

      setIsVideoSending(isNextVideoSending);
    } catch (error) {
      if (videoSenderRef.current !== sender) {
        return;
      }

      console.error("영상 송출 전환 실패:", error);
      setErrorMessage("영상 송출 상태를 변경하지 못했습니다.");
    } finally {
      // 이전 요청이 새 연결의 처리 상태를 덮어쓰지 않도록 확인
      if (videoSenderRef.current === sender) {
        setIsVideoSwitching(false);
      }
    }
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
            data-status={cameraStatus}
            role="status"
          >
            {cameraStatusText}
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

        <div className="get-user-media__remote-stage">
          <video
            ref={remoteVideoRef}
            className="get-user-media__video get-user-media__video--remote"
            id="remote-video"
            aria-label="WebRTC로 받은 영상"
            aria-hidden={isRemoteVideoPaused}
            autoPlay
            playsInline
            muted
          />

          {isRemoteVideoPaused && (
            <div className="get-user-media__placeholder">
              <div className="get-user-media__avatar">W</div>
              <p className="get-user-media__placeholder-title">
                영상 송출이 일시중지됐어요
              </p>
              <p className="get-user-media__placeholder-description">
                연결은 유지되고 있어요
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="get-user-media__controls">
        <button
          className="get-user-media__button get-user-media__button--primary"
          id="open-camera"
          type="button"
          onClick={handleOpenCamera}
          disabled={cameraStatus !== "idle"}
        >
          카메라 열기
        </button>
        <button
          className="get-user-media__button"
          id="close-camera"
          type="button"
          onClick={handleCloseCamera}
          disabled={cameraStatus !== "active"}
        >
          카메라 닫기
        </button>
        <button
          className="get-user-media__button"
          type="button"
          onClick={handleStartConnection}
          disabled={cameraStatus !== "active" || connectionState !== "new"}
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

        <button
          className="get-user-media__button"
          type="button"
          onClick={handleToggleVideoSending}
          disabled={connectionState !== "connected" || isVideoSwitching}
        >
          {isVideoSwitching
            ? "변경 중..."
            : isVideoSending
              ? "송출 중지"
              : "송출 재개"}
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
