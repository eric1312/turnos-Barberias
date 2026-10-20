import { useState } from 'react';
import { addDays } from 'date-fns';
import { useDb, useTick } from '../../lib/storage.js';
import { turnoActivo } from '../../lib/slots.js';
import { cambiarEstado, marcarCobrado } from '../../lib/api.js';
import { ETIQUETA_PAGO, claveDia, fechaLarga, hora, precio } from '../../lib/format.js';

export default function Agenda() {
  const db = useDb();
  useTick();
  const [fecha, setFecha] = useState(claveDia(new Date()));
  const [barberoId, setBarberoId] = useState('todos');

  const dia = new Date(`${fecha}T00:00:00`);
  const turnos = db.turnos
    .filter((t) => claveDia(t.inicio) === fecha && (barberoId === 'todos' || t.barberoId === barberoId))
    .sort((a, b) => new Date(a.inicio) - new Date(b.inicio));

  const precioDe = (t) => db.servicios.find((s) => s.id === t.servicioId)?.precio || 0;
  const validos = turnos.filter((t) => t.estado !== 'cancelado');
  const cobrado = validos.filter((t) => t.estadoPago === 'pagado').reduce((a, t) => a + precioDe(t), 0);
  const porCobrar = validos.filter((t) => t.estadoPago !== 'pagado' && t.estado !== 'ausente').reduce((a, t) => a + precioDe(t), 0);

  const mover = (n) => setFecha(claveDia(addDays(dia, n)));

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn small" onClick={() => mover(-1)}>
          ←
        </button>
        <input type="date" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} style={{ width: 170 }} />
        <button type="button" className="btn small" onClick={() => mover(1)}>
          →
        </button>
        <button type="button" className="btn small" onClick={() => setFecha(claveDia(new Date()))}>
          Hoy
        </button>
        <select value={barberoId} onChange={(e) => setBarberoId(e.target.value)} style={{ width: 200 }}>
          <option value="todos">Todos los barberos</option>
          {db.barberos.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre}
            </option>
          ))}
        </select>
      </div>

      <h2 style={{ textTransform: 'capitalize' }}>{fechaLarga(dia)}</h2>

      <div className="grid cols-3">
        <div className="stat">
          <div className="muted small">Turnos</div>
          <div className="n">{validos.length}</div>
        </div>
        <div className="stat">
          <div className="muted small">Cobrado</div>
          <div className="n">{precio(cobrado)}</div>
        </div>
        <div className="stat">
          <div className="muted small">Por cobrar</div>
          <div className="n">{precio(porCobrar)}</div>
        </div>
      </div>

      <div className="card">
        {turnos.length === 0 && <p className="muted" style={{ margin: 0 }}>No hay turnos para este día.</p>}
        {turnos.map((t) => {
          const servicio = db.servicios.find((s) => s.id === t.servicioId);
          const barbero = db.barberos.find((b) => b.id === t.barberoId);
          const vencido = t.estado === 'pendiente' && !turnoActivo(t);
          const abierto = ['pendiente', 'confirmado'].includes(t.estado);
          return (
            <div className="turno" key={t.id}>
              <div className="hora">{hora(t.inicio)}</div>
              <div>
                <div>
                  <strong>{t.nombre}</strong> · {servicio?.nombre || 'Servicio eliminado'}{' '}
                  <span className="muted small">con {barbero?.nombre || 'barbero eliminado'}</span>
                </div>
                <div className="muted small">
                  {t.telefono}
                  {t.email ? ` · ${t.email}` : ''} · código {t.codigo}
                </div>
                <div className="row" style={{ marginTop: 6, gap: 6 }}>
                  <span className={`badge ${t.estado}`}>{t.estado}</span>
                  {vencido && <span className="badge">retención vencida</span>}
                  <span className={`badge ${t.estadoPago === 'pagado' ? 'pagado' : ''}`}>
                    {ETIQUETA_PAGO[t.estadoPago] || t.estadoPago}
                  </span>
                  <span className="muted small">{precio(precioDe(t))}</span>
                </div>
              </div>
              <div className="acciones">
                {abierto && (
                  <button type="button" className="btn small" onClick={() => cambiarEstado(t.id, 'completado')}>
                    Completado
                  </button>
                )}
                {abierto && (
                  <button type="button" className="btn small" onClick={() => cambiarEstado(t.id, 'ausente')}>
                    Ausente
                  </button>
                )}
                {t.estado !== 'cancelado' && t.estadoPago !== 'pagado' && (
                  <button type="button" className="btn small primary" onClick={() => marcarCobrado(t.id)}>
                    Marcar cobrado
                  </button>
                )}
                {abierto && (
                  <button
                    type="button"
                    className="btn small danger"
                    onClick={() => window.confirm('¿Cancelar este turno?') && cambiarEstado(t.id, 'cancelado')}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
