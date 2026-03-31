import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
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
        <Route path="/session/:id" element={<Session />} />
        <Route path="/summary/:id" element={<Summary />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/import" element={<Import />} />
      </Routes>
    </BrowserRouter>
  );
}
