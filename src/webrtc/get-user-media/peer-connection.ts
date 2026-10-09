// ICE 후보를 전달하는 함수
// source에서 생성된 후보를 target에 전달
// 아직 전달할 준비가 안 됐다면 배열에 보관했다가 순서대로 전달
export const forwardIceCandidates = (
  source: RTCPeerConnection,
  target: RTCPeerConnection,
) => {
  const pendingCandidates: RTCIceCandidate[] = [];
  let isReady = false;
  let candidateDelivery = Promise.resolve();

  const sendCandidate = (candidate: RTCIceCandidate) => {
    // 후보를 생성된 순서대로 전달
    candidateDelivery = candidateDelivery
      .then(async () => {
        if (target.signalingState === "closed") {
          return;
        }

        await target.addIceCandidate(candidate);
      })
      .catch((error) => {
        if (target.signalingState !== "closed") {
          console.error("ICE 후보 전달 실패:", error);
        }
      });
  };

  source.addEventListener("icecandidate", (event) => {
    if (!event.candidate) {
      return;
    }

    if (isReady) {
      sendCandidate(event.candidate);
    } else {
      pendingCandidates.push(event.candidate);
    }
  });

  // 상대 SDP 등록 후 호출할 함수 반환
  return () => {
    isReady = true;
    pendingCandidates.splice(0).forEach(sendCandidate);
  };
};
