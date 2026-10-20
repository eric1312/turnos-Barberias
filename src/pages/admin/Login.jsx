import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_PASSWORD } from '../../lib/config.js';

export default function Login() {
  const navigate = useNavigate();
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');

  const entrar = (e) => {
    e.preventDefault();
    if (clave !== ADMIN_PASSWORD) return setError('Clave incorrecta.');
    sessionStorage.setItem('admin-auth', '1');
    navigate('/admin');
  };

  return (
    <form className="card stack" onSubmit={entrar} style={{ maxWidth: 380 }}>
      <h2>Panel de la barbería</h2>
      {error && <div className="error">{error}</div>}
      <div>
        <label htmlFor="clave">Clave</label>
        <input id="clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoFocus />
      </div>
      <button type="submit" className="btn primary">
        Ingresar
      </button>
      <p className="muted small">Demo: la clave está en src/lib/config.js. En producción usá un login real en el backend.</p>
    </form>
  );
}
