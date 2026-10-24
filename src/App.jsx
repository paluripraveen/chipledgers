import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Login from './pages/Login';

// Each page is its own chunk, so e.g. the charting library only loads on Stats
const Home = lazy(() => import('./pages/Home'));
const Players = lazy(() => import('./pages/Players'));
const Groups = lazy(() => import('./pages/Groups'));
const GroupHome = lazy(() => import('./pages/GroupHome'));
const Session = lazy(() => import('./pages/Session'));
const Summary = lazy(() => import('./pages/Summary'));
const Stats = lazy(() => import('./pages/Stats'));
const Admin = lazy(() => import('./pages/Admin'));
const Import = lazy(() => import('./pages/Import'));
const OddsLobby = lazy(() => import('./pages/OddsLobby'));
const OddsTable = lazy(() => import('./pages/OddsTable'));

const pageFallback = <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;

export default function App() {
  const [isAuthed, setIsAuthed] = useState(() => !!localStorage.getItem('cl_auth'));

  return (
    <BrowserRouter>
      <Suspense fallback={pageFallback}>
      <Routes>
        {/* Live odds is open to anyone with a table code, so players don't need the app login */}
        <Route path="/odds" element={<OddsLobby />} />
        <Route path="/odds/:code" element={<OddsTable />} />
        <Route element={isAuthed ? <Outlet /> : <Login onLogin={() => setIsAuthed(true)} />}>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/group/:groupId" element={<GroupHome />} />
          <Route path="/group/:groupId/session/:id" element={<Session />} />
          <Route path="/group/:groupId/summary/:id" element={<Summary />} />
          <Route path="/group/:groupId/stats" element={<Stats />} />
          <Route path="/group/:groupId/admin" element={<Admin />} />
          <Route path="/group/:groupId/import" element={<Import />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
