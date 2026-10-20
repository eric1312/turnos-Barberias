import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDb, useTick } from '../lib/storage.js';
import { cancelarTurnoCliente, confirmarPagoOnline, puedeCancelarCliente } from '../lib/api.js';
import { BARBERIA, CANCEL_HOURS, HOLD_MIN } from '../lib/config.js';
import { ETIQUETA_PAGO, fechaLarga, hora, precio } from '../lib/format.js';

export default function Turno() {
  const { codigo } = useParams();
  const db = useDb();
  useTick(1000); // actualiza la cuenta regresiva
  const [error, setError] = useState('');

  const turno = db.turnos.find((t) => t.codigo === (codigo || '').toUpperCase());
  if (!turno) {
    return (
      <div className="card">
        <h2>No encontramos ese turno</h2>
        <p className="muted">Revisá el código o volvé a reservar.</p>
        <Link to="/mi-turno" className="btn">
          Buscar por código
        </Link>
      </div>
    );
  }

  const servicio = db.servicios.find((s) => s.id === turno.servicioId);
  const barbero = db.barberos.find((b) => b.id === turno.barberoId);
  const restante = HOLD_MIN * 60 - Math.floor((Date.now() - new Date(turno.creado).getTime()) / 1000);
  const esperandoPago = turno.estado === 'pendiente' && turno.metodoPago === 'online';
  const retencionVigente = restante > 0;
  const min = Math.max(0, Math.floor(restante / 60));
  const seg = Math.max(0, restante % 60);

  const accion = (fn) => {
    try {
      setError('');
      fn();
    } catch (e) {
      setError(e.message);
    }
  };

  const mensajeWa = encodeURIComponent(
    `Hola, soy ${turno.nombre}. Consulta por mi turno ${turno.codigo} del ${fechaLarga(turno.inicio)} a las ${hora(turno.inicio)}.`
  );

  return (
    <div className="stack">
      <h1>{turno.estado === 'cancelado' ? 'Turno cancelado' : esperandoPago ? 'Falta el pago' : '¡Turno reservado!'}</h1>

      {error && <div className="error">{error}</div>}

      {esperandoPago && retencionVigente && (
        <div className="notice">
          Tu horario está retenido por {min}:{String(seg).padStart(2, '0')} minutos. Pagá para confirmarlo.
        </div>
      )}
      {esperandoPago && !retencionVigente && (
        <div className="notice">
          Venció el tiempo de retención. Si el horario sigue libre todavía podés pagar; si no, reservá de nuevo.
        </div>
      )}
      {turno.estado !== 'cancelado' && (
        <div className="success">
          Tu código es <strong>{turno.codigo}</strong>. Guardalo: lo necesitás para ver o cancelar el turno.
        </div>
      )}

      <div className="card stack">
        <div className="row between">
          <h3 style={{ margin: 0 }}>Detalle</h3>
          <span className={`badge ${turno.estado}`}>{turno.estado}</span>
        </div>
        <div>
          <div className="muted small">Servicio</div>
          {servicio ? `${servicio.nombre} · ${servicio.duracion} min` : 'Servicio eliminado'}
        </div>
        <div>
          <div className="muted small">Barbero</div>
          {barbero ? barbero.nombre : 'Barbero eliminado'}
        </div>
        <div>
          <div className="muted small">Fecha y hora</div>
          <span style={{ textTransform: 'capitalize' }}>{fechaLarga(turno.inicio)}</span>, {hora(turno.inicio)} hs
        </div>
        <div>
          <div className="muted small">Cliente</div>
          {turno.nombre} · {turno.telefono}
        </div>
        <div>
          <div className="muted small">Pago</div>
          <span className={`badge ${turno.estadoPago === 'pagado' ? 'pagado' : ''}`}>{ETIQUETA_PAGO[turno.estadoPago] || turno.estadoPago}</span>{' '}
          {servicio && <strong>{precio(servicio.precio)}</strong>}
        </div>
        <div className="muted small">
          {BARBERIA.nombre} · {BARBERIA.direccion}
        </div>
      </div>

      <div className="row">
        {esperandoPago && (
          <button type="button" className="btn primary" onClick={() => accion(() => confirmarPagoOnline(turno.id))}>
            Pagar con Mercado Pago (simulado)
          </button>
        )}
        {puedeCancelarCliente(turno) && (
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (window.confirm('¿Seguro que querés cancelar el turno?')) accion(() => cancelarTurnoCliente(turno.id));
            }}
          >
            Cancelar turno
          </button>
        )}
        <a className="btn" href={`https://wa.me/${BARBERIA.telefono}?text=${mensajeWa}`} target="_blank" rel="noreferrer">
          Escribir por WhatsApp
        </a>
        <Link to="/reservar" className="btn">
          Reservar otro
        </Link>
      </div>

      {['pendiente', 'confirmado'].includes(turno.estado) && !puedeCancelarCliente(turno) && (
        <p className="muted small">Ya no se puede cancelar desde la web (límite: {CANCEL_HOURS} horas antes). Escribinos por WhatsApp.</p>
      )}
    </div>
  );
}
