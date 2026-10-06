// 랜더링 화면
import { useEffect, useRef, useState } from "react";
import "./styles.css";
import {
  getCameraErrorMessage,
  getCameraStream,
  stopCameraStream,
} from "./get-user-media";

const GetUserMedia = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 카메라 연결 상태 관리
  const [status, setStatus] = useState<"idle" | "opening" | "active">("idle");
  // 카메라 연결 실패 시 에러 메시지 관리
  const [errorMessage, setErrorMessage] = useState("");

  // 연결 상태에 따른 상태 텍스트
  const statusText = {
    idle: "연결 대기",
    opening: "카메라 연결 중",
    active: "카메라 켜짐",
  }[status];

  //  컴포넌트 종료 시 카메라 스트림 종료
  useEffect(() => {
    return () => {
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

  const handleCloseCamera = () => {
    stopCameraStream(streamRef.current);
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // 연결 상태를 대기 상태로 변경
    setStatus("idle");
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
