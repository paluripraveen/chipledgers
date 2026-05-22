import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Players from './pages/Players';
import Groups from './pages/Groups';
import GroupHome from './pages/GroupHome';
import Session from './pages/Session';
import Summary from './pages/Summary';
import Stats from './pages/Stats';
import Admin from './pages/Admin';
import Import from './pages/Import';
import Login from './pages/Login';
import Register from './pages/Register';
import InviteAccept from './pages/InviteAccept';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/invite/:id" element={<InviteAccept />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/players" element={<Players />} />
      <Route path="/groups" element={<Groups />} />
      <Route path="/group/:groupId" element={<GroupHome />} />
      <Route path="/group/:groupId/session/:id" element={<Session />} />
      <Route path="/group/:groupId/summary/:id" element={<Summary />} />
      <Route path="/group/:groupId/stats" element={<Stats />} />
      <Route path="/group/:groupId/admin" element={<Admin />} />
      <Route path="/group/:groupId/import" element={<Import />} />
      <Route path="/invite/:id" element={<InviteAccept />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
