import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import Explore from './pages/Explore';
import Reels from './pages/Reels';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import CreatePost from './pages/CreatePost';
import Notifications from './pages/Notifications';

import { SocketProvider, useSocket } from './context/SocketContext';
import VideoCallModal from './components/common/VideoCallModal';

const CallOverlay = () => {
    const { call, callAccepted, isCalling, callEnded } = useSocket();
    
    // Show if receiving call, calling, or active call
    if (call.isReceivingCall && !callAccepted) return <VideoCallModal />;
    if (isCalling || (callAccepted && !callEnded)) return <VideoCallModal />;
    
    return null;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
            <CallOverlay />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/reels" element={<Reels />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/profile/:username" element={<Profile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/create" element={<CreatePost />} />
                  <Route path="/notifications" element={<Notifications />} />
                </Route>
              </Route>
            </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
