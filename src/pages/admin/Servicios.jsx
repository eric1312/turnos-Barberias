import { useState } from 'react';
import { useDb } from '../../lib/storage.js';
import { agregarServicio, borrarServicio, editarServicio } from '../../lib/api.js';

export default function Servicios() {
  const db = useDb();
  const [nuevo, setNuevo] = useState({ nombre: '', duracion: 30, precio: 0 });
  const [error, setError] = useState('');

  const agregar = (e) => {
    e.preventDefault();
    if (!nuevo.nombre.trim()) return setError('Poné un nombre al servicio.');
    if (!(Number(nuevo.duracion) >= 5)) return setError('La duración mínima es de 5 minutos.');
    setError('');
    agregarServicio({ nombre: nuevo.nombre.trim(), duracion: Number(nuevo.duracion), precio: Number(nuevo.precio) || 0 });
    setNuevo({ nombre: '', duracion: 30, precio: 0 });
  };

  return (
    <div className="stack">
      <h2>Servicios</h2>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th style={{ width: 120 }}>Duración (min)</th>
              <th style={{ width: 140 }}>Precio (ARS)</th>
              <th style={{ width: 90 }} />
            </tr>
          </thead>
          <tbody>
            {db.servicios.map((s) => (
              <tr key={s.id}>
                <td>
                  <input defaultValue={s.nombre} onBlur={(e) => editarServicio(s.id, { nombre: e.target.value.trim() || s.nombre })} />
                </td>
                <td>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    defaultValue={s.duracion}
                    onBlur={(e) => editarServicio(s.id, { duracion: Math.max(5, Number(e.target.value) || s.duracion) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    defaultValue={s.precio}
                    onBlur={(e) => editarServicio(s.id, { precio: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </td>
                <td className="right">
                  <button
                    type="button"
                    className="btn small danger"
                    onClick={() => window.confirm(`¿Eliminar "${s.nombre}"?`) && borrarServicio(s.id)}
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small" style={{ marginTop: 12 }}>
          Los cambios se guardan al salir de cada campo. Los turnos ya reservados conservan su horario.
        </p>
      </div>

      <form className="card stack" onSubmit={agregar}>
        <h3>Agregar servicio</h3>
        {error && <div className="error">{error}</div>}
        <div className="grid cols-3">
          <div>
            <label htmlFor="n-nombre">Nombre</label>
            <input id="n-nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
          </div>
          <div>
            <label htmlFor="n-dur">Duración (min)</label>
            <input id="n-dur" type="number" min="5" step="5" value={nuevo.duracion} onChange={(e) => setNuevo({ ...nuevo, duracion: e.target.value })} />
          </div>
          <div>
            <label htmlFor="n-precio">Precio (ARS)</label>
            <input id="n-precio" type="number" min="0" step="500" value={nuevo.precio} onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })} />
          </div>
        </div>
        <div>
          <button type="submit" className="btn primary">
            Agregar
          </button>
        </div>
      </form>
    </div>
  );
}
