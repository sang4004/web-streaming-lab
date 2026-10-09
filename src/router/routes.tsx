import { Route, Routes } from "react-router";

import HlsPage from "../pages/hls";
import HomePage from "../pages/home";
import NotFoundPage from "../pages/not-found";
import WebRtcPage from "../pages/webrtc";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/hls" element={<HlsPage />} />
      <Route path="/webrtc" element={<WebRtcPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
