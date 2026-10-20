import { useState } from 'react';
import { useDb } from '../../lib/storage.js';
import { agregarBarbero, agregarBloqueo, borrarBarbero, borrarBloqueo, editarBarbero, editarHorario } from '../../lib/api.js';
import { NOMBRES_DIA, claveDia } from '../../lib/format.js';

const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0]; // lunes a domingo

function Barbero({ b }) {
  return (
    <div className="card stack">
      <div className="row between">
        <input defaultValue={b.nombre} onBlur={(e) => editarBarbero(b.id, { nombre: e.target.value.trim() || b.nombre })} style={{ maxWidth: 260, fontWeight: 600 }} />
        <button
          type="button"
          className="btn small danger"
          onClick={() => window.confirm(`¿Eliminar a ${b.nombre}? Sus turnos existentes quedarán sin barbero.`) && borrarBarbero(b.id)}
        >
          Eliminar
        </button>
      </div>

      <div className="row">
        <label style={{ margin: 0 }}>
          <input
            type="checkbox"
            checked={!!b.descanso}
            onChange={(e) => editarBarbero(b.id, { descanso: e.target.checked ? { inicio: '13:00', fin: '14:00' } : null })}
          />{' '}
          Descanso diario
        </label>
        {b.descanso && (
          <>
            <input type="time" value={b.descanso.inicio} onChange={(e) => editarBarbero(b.id, { descanso: { ...b.descanso, inicio: e.target.value } })} style={{ width: 120 }} />
            <span className="muted">a</span>
            <input type="time" value={b.descanso.fin} onChange={(e) => editarBarbero(b.id, { descanso: { ...b.descanso, fin: e.target.value } })} style={{ width: 120 }} />
          </>
        )}
      </div>

      <div>
        {ORDEN_DIAS.map((dia) => {
          const h = b.horarios[dia];
          const invalido = h && h.fin <= h.inicio;
          return (
            <div className="row" key={dia} style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
              <label style={{ margin: 0, width: 130, color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  checked={!!h}
                  onChange={(e) => editarHorario(b.id, dia, e.target.checked ? { inicio: '10:00', fin: '19:00' } : null)}
                />{' '}
                {NOMBRES_DIA[dia]}
              </label>
              {h ? (
                <>
                  <input type="time" value={h.inicio} onChange={(e) => editarHorario(b.id, dia, { ...h, inicio: e.target.value })} style={{ width: 120 }} />
                  <span className="muted">a</span>
                  <input type="time" value={h.fin} onChange={(e) => editarHorario(b.id, dia, { ...h, fin: e.target.value })} style={{ width: 120 }} />
                  {invalido && <span style={{ color: 'var(--bad)' }} className="small">El cierre debe ser posterior a la apertura.</span>}
                </>
              ) : (
                <span className="muted small">No trabaja</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Barberos() {
  const db = useDb();
  const [nombre, setNombre] = useState('');
  const [bloqueo, setBloqueo] = useState({ barberoId: 'todos', desde: claveDia(new Date()), hasta: claveDia(new Date()), motivo: '' });
  const [error, setError] = useState('');

  const nuevoBarbero = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    agregarBarbero(nombre.trim());
    setNombre('');
  };

  const nuevoBloqueo = (e) => {
    e.preventDefault();
    if (bloqueo.hasta < bloqueo.desde) return setError('La fecha "hasta" no puede ser anterior a "desde".');
    setError('');
    agregarBloqueo({ ...bloqueo, motivo: bloqueo.motivo.trim() || 'Bloqueado' });
  };

  const nombreDe = (id) => (id === 'todos' ? 'Todos' : db.barberos.find((b) => b.id === id)?.nombre || 'Barbero eliminado');
  const bloqueos = [...db.bloqueos].sort((a, b) => a.desde.localeCompare(b.desde));

  return (
    <div className="stack">
      <h2>Barberos y horarios</h2>
      {db.barberos.map((b) => (
        <Barbero key={b.id} b={b} />
      ))}

      <form className="card row" onSubmit={nuevoBarbero}>
        <input placeholder="Nombre del nuevo barbero" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ maxWidth: 280 }} />
        <button type="submit" className="btn primary">
          Agregar barbero
        </button>
      </form>

      <h2 style={{ marginTop: 16 }}>Bloqueos (vacaciones, feriados)</h2>
      <form className="card stack" onSubmit={nuevoBloqueo}>
        {error && <div className="error">{error}</div>}
        <div className="grid cols-2">
          <div>
            <label htmlFor="b-barbero">Barbero</label>
            <select id="b-barbero" value={bloqueo.barberoId} onChange={(e) => setBloqueo({ ...bloqueo, barberoId: e.target.value })}>
              <option value="todos">Toda la barbería</option>
              {db.barberos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="b-motivo">Motivo</label>
            <input id="b-motivo" value={bloqueo.motivo} onChange={(e) => setBloqueo({ ...bloqueo, motivo: e.target.value })} placeholder="Feriado, vacaciones…" />
          </div>
          <div>
            <label htmlFor="b-desde">Desde</label>
            <input id="b-desde" type="date" value={bloqueo.desde} onChange={(e) => setBloqueo({ ...bloqueo, desde: e.target.value })} />
          </div>
          <div>
            <label htmlFor="b-hasta">Hasta</label>
            <input id="b-hasta" type="date" value={bloqueo.hasta} onChange={(e) => setBloqueo({ ...bloqueo, hasta: e.target.value })} />
          </div>
        </div>
        <div>
          <button type="submit" className="btn primary">
            Bloquear días
          </button>
        </div>
      </form>

      {bloqueos.length > 0 && (
        <div className="card">
          <table>
            <tbody>
              {bloqueos.map((b) => (
                <tr key={b.id}>
                  <td>{nombreDe(b.barberoId)}</td>
                  <td>
                    {b.desde === b.hasta ? b.desde : `${b.desde} → ${b.hasta}`}
                  </td>
                  <td className="muted">{b.motivo}</td>
                  <td className="right">
                    <button type="button" className="btn small danger" onClick={() => borrarBloqueo(b.id)}>
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
