import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, startOfDay } from 'date-fns';
import { useDb, useTick } from '../lib/storage.js';
import { slotsDisponibles } from '../lib/slots.js';
import { crearTurno } from '../lib/api.js';
import { precio, fechaLarga, hora, diaSemanaCorto } from '../lib/format.js';
import { DIAS_RESERVA, HOLD_MIN } from '../lib/config.js';

const PASOS = ['Servicio', 'Barbero', 'Fecha y hora', 'Tus datos y pago'];

export default function Reservar() {
  const db = useDb();
  const tick = useTick();
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);
  const [servicioId, setServicioId] = useState(null);
  const [barberoId, setBarberoId] = useState(null);
  const [dia, setDia] = useState(null);
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', metodoPago: 'local' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const servicio = db.servicios.find((s) => s.id === servicioId) || null;
  const barbero = db.barberos.find((b) => b.id === barberoId) || null;

  const dias = useMemo(() => {
    const hoy = startOfDay(new Date());
    return Array.from({ length: DIAS_RESERVA }, (_, i) => addDays(hoy, i));
  }, []);

  // Horarios por día (para deshabilitar los días sin lugar)
  const slotsPorDia = useMemo(() => {
    if (!servicio || !barberoId) return new Map();
    const ahora = new Date();
    return new Map(dias.map((d) => [d.getTime(), slotsDisponibles(db, barberoId, servicio, d, ahora)]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, servicio, barberoId, dias, tick]);

  const slots = dia ? slotsPorDia.get(dia.getTime()) || [] : [];

  const elegirServicio = (id) => {
    setServicioId(id);
    setSlot(null);
    setDia(null);
    setPaso(2);
  };
  const elegirBarbero = (id) => {
    setBarberoId(id);
    setSlot(null);
    setDia(null);
    setPaso(3);
  };

  const validar = () => {
    if (form.nombre.trim().length < 2) return 'Ingresá tu nombre.';
    if (form.telefono.replace(/\D/g, '').length < 8) return 'Ingresá un teléfono válido (con código de área).';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'El email no parece válido.';
    return '';
  };

  const confirmar = (e) => {
    e.preventDefault();
    const msg = validar();
    if (msg) return setError(msg);
    setEnviando(true);
    setError('');
    try {
      const turno = crearTurno({
        barberoId,
        servicioId,
        inicio: slot.inicio.toISOString(),
        ...form,
      });
      navigate(`/turno/${turno.codigo}`);
    } catch (err) {
      setError(err.message);
      setSlot(null);
      setPaso(3);
    } finally {
      setEnviando(false);
    }
  };

  if (db.servicios.length === 0 || db.barberos.length === 0) {
    return (
      <div className="card">
        <h2>Reservas no disponibles</h2>
        <p className="muted">La barbería todavía no cargó servicios o barberos.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <h1>Reservar turno</h1>

      <div className="steps">
        {PASOS.map((nombre, i) => {
          const n = i + 1;
          return (
            <button
              key={nombre}
              type="button"
              className={`step ${paso === n ? 'active' : ''} ${n < paso ? 'done' : ''}`}
              disabled={n >= paso}
              onClick={() => setPaso(n)}
            >
              {n}. {nombre}
            </button>
          );
        })}
      </div>

      {error && <div className="error">{error}</div>}

      {paso === 1 && (
        <div className="grid cols-3">
          {db.servicios.map((s) => (
            <button key={s.id} type="button" className={`tile ${s.id === servicioId ? 'selected' : ''}`} onClick={() => elegirServicio(s.id)}>
              <div className="title">{s.nombre}</div>
              <div className="muted small">{s.duracion} min</div>
              <div>{precio(s.precio)}</div>
            </button>
          ))}
        </div>
      )}

      {paso === 2 && (
        <div className="grid cols-3">
          <button type="button" className={`tile ${barberoId === 'any' ? 'selected' : ''}`} onClick={() => elegirBarbero('any')}>
            <div className="title">Cualquiera</div>
            <div className="muted small">Más horarios disponibles</div>
          </button>
          {db.barberos.map((b) => (
            <button key={b.id} type="button" className={`tile ${b.id === barberoId ? 'selected' : ''}`} onClick={() => elegirBarbero(b.id)}>
              <div className="title">{b.nombre}</div>
            </button>
          ))}
        </div>
      )}

      {paso === 3 && (
        <div className="stack">
          <div className="days">
            {dias.map((d) => {
              const hay = (slotsPorDia.get(d.getTime()) || []).length > 0;
              return (
                <button
                  key={d.getTime()}
                  type="button"
                  className={`day ${dia && dia.getTime() === d.getTime() ? 'selected' : ''}`}
                  disabled={!hay}
                  onClick={() => {
                    setDia(d);
                    setSlot(null);
                  }}
                >
                  <div className="dow">{diaSemanaCorto(d)}</div>
                  <div className="num">{d.getDate()}</div>
                </button>
              );
            })}
          </div>

          {!dia && <p className="muted">Elegí un día para ver los horarios libres.</p>}
          {dia && (
            <>
              <h3 style={{ textTransform: 'capitalize' }}>{fechaLarga(dia)}</h3>
              <div className="slots">
                {slots.map((s) => (
                  <button
                    key={s.inicio.getTime()}
                    type="button"
                    className={`slot ${slot && slot.inicio.getTime() === s.inicio.getTime() ? 'selected' : ''}`}
                    onClick={() => setSlot(s)}
                  >
                    {hora(s.inicio)}
                  </button>
                ))}
              </div>
            </>
          )}
          <div>
            <button type="button" className="btn primary" disabled={!slot} onClick={() => setPaso(4)}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {paso === 4 && servicio && slot && (
        <form className="grid cols-2" onSubmit={confirmar}>
          <div className="card stack">
            <h3>Tus datos</h3>
            <div>
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="tel">Teléfono (WhatsApp)</label>
              <input id="tel" type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} autoComplete="tel" />
            </div>
            <div>
              <label htmlFor="email">Email (opcional)</label>
              <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
            </div>
            <div>
              <label>Cómo querés pagar</label>
              <button
                type="button"
                className={`tile ${form.metodoPago === 'local' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, metodoPago: 'local' })}
              >
                <div className="title">En el local</div>
                <div className="muted small">Pagás al terminar el turno.</div>
              </button>
              <div style={{ height: 8 }} />
              <button
                type="button"
                className={`tile ${form.metodoPago === 'online' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, metodoPago: 'online' })}
              >
                <div className="title">Online (Mercado Pago)</div>
                <div className="muted small">Tenés {HOLD_MIN} minutos para pagar y asegurar el horario.</div>
              </button>
            </div>
          </div>

          <div className="card stack">
            <h3>Resumen</h3>
            <div>
              <div className="muted small">Servicio</div>
              {servicio.nombre} · {servicio.duracion} min
            </div>
            <div>
              <div className="muted small">Barbero</div>
              {barbero ? barbero.nombre : 'Cualquiera (se asigna al confirmar)'}
            </div>
            <div>
              <div className="muted small">Fecha y hora</div>
              <span style={{ textTransform: 'capitalize' }}>{fechaLarga(slot.inicio)}</span>, {hora(slot.inicio)} hs
            </div>
            <div>
              <div className="muted small">Total</div>
              <strong>{precio(servicio.precio)}</strong>
            </div>
            <button type="submit" className="btn primary" disabled={enviando}>
              Confirmar reserva
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
