import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();
  if (sessionStorage.getItem('admin-auth') !== '1') return <Navigate to="/admin/login" replace />;

  const salir = () => {
    sessionStorage.removeItem('admin-auth');
    navigate('/admin/login');
  };

  return (
    <div className="stack">
      <div className="row between">
        <nav className="nav">
          <NavLink to="/admin" end>
            Agenda
          </NavLink>
          <NavLink to="/admin/servicios">Servicios</NavLink>
          <NavLink to="/admin/barberos">Barberos y horarios</NavLink>
          <NavLink to="/admin/reportes">Reportes</NavLink>
        </nav>
        <button type="button" className="btn small" onClick={salir}>
          Salir
        </button>
      </div>
      <Outlet />
    </div>
  );
}
