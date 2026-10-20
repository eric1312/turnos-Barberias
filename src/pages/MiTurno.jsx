import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerTurnoPorCodigo } from '../lib/api.js';

export default function MiTurno() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');

  const buscar = (e) => {
    e.preventDefault();
    const t = obtenerTurnoPorCodigo(codigo);
    if (!t) return setError('No encontramos un turno con ese código.');
    navigate(`/turno/${t.codigo}`);
  };

  return (
    <form className="card stack" onSubmit={buscar} style={{ maxWidth: 420 }}>
      <h2>Mi turno</h2>
      <p className="muted">Ingresá el código de 6 caracteres que te dimos al reservar para verlo o cancelarlo.</p>
      {error && <div className="error">{error}</div>}
      <div>
        <label htmlFor="codigo">Código del turno</label>
        <input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" />
      </div>
      <button type="submit" className="btn primary" disabled={codigo.trim().length < 6}>
        Buscar
      </button>
    </form>
  );
}
