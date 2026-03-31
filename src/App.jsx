import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Players from './pages/Players';
import Groups from './pages/Groups';
import GroupHome from './pages/GroupHome';
import Session from './pages/Session';
import Summary from './pages/Summary';
import Stats from './pages/Stats';
import Admin from './pages/Admin';
import Import from './pages/Import';

export default function App() {
  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}
