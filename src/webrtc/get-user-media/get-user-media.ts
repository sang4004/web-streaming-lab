// 카메라 스트림 제어

// 카메라 스트림 가져오기
export const getCameraStream = (): Promise<MediaStream> => {
  return navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
};

// 카메라 스트림 종료
export const stopCameraStream = (stream: MediaStream | null): void => {
  stream?.getTracks().forEach((track) => track.stop());
};

export const getCameraErrorMessage = (error: unknown): string => {
  const fallback = "카메라를 열 수 없습니다. 잠시 후 다시 시도해주세요.";

  if (!(error instanceof DOMException)) {
    return fallback;
  }

  const messages: Record<string, string> = {
    NotAllowedError:
      "카메라 접근이 허용되지 않았습니다. 브라우저와 시스템 권한을 확인해주세요.",
    NotFoundError:
      "사용 가능한 카메라를 찾지 못했습니다. 카메라 연결을 확인해주세요.",
    NotReadableError:
      "카메라를 시작할 수 없습니다. 장치 상태와 다른 앱의 카메라 사용 여부를 확인해주세요.",
  };

  return messages[error.name] ?? fallback;
};
