import { Route, Routes } from 'react-router'
import HomePage from '../pages/home'
import HlsPage from '../pages/hls'
import WebRtcPage from '../pages/webrtc'
import NotFoundPage from '../pages/not-found'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/hls" element={<HlsPage />} />
      <Route path="/webrtc" element={<WebRtcPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
