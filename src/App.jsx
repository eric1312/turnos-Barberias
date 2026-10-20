import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { BARBERIA } from './lib/config.js';
import Home from './pages/Home.jsx';
import Reservar from './pages/Reservar.jsx';
import Turno from './pages/Turno.jsx';
import MiTurno from './pages/MiTurno.jsx';
import AdminLogin from './pages/admin/Login.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Agenda from './pages/admin/Agenda.jsx';
import Servicios from './pages/admin/Servicios.jsx';
import Barberos from './pages/admin/Barberos.jsx';
import Reportes from './pages/admin/Reportes.jsx';

function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/" className="brand">
          ✂ <span>{BARBERIA.nombre}</span>
        </NavLink>
        <nav className="nav">
          <NavLink to="/reservar">Reservar turno</NavLink>
          <NavLink to="/mi-turno">Mi turno</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reservar" element={<Reservar />} />
          <Route path="/turno/:codigo" element={<Turno />} />
          <Route path="/mi-turno" element={<MiTurno />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Agenda />} />
            <Route path="servicios" element={<Servicios />} />
            <Route path="barberos" element={<Barberos />} />
            <Route path="reportes" element={<Reportes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
