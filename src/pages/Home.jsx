import { Link } from 'react-router-dom';
import { useDb } from '../lib/storage.js';
import { BARBERIA, CANCEL_HOURS } from '../lib/config.js';
import { precio } from '../lib/format.js';

export default function Home() {
  const db = useDb();
  return (
    <>
      <section className="hero">
        <h1>Reservá tu turno online</h1>
        <p>
          Elegí el servicio, tu barbero y un horario libre. Pagás online o en el local, al terminar el turno.
        </p>
        <Link to="/reservar" className="btn primary">
          Reservar turno
        </Link>
      </section>

      <section className="card">
        <h2>Servicios y precios</h2>
        <table>
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Duración</th>
              <th className="right">Precio</th>
            </tr>
          </thead>
          <tbody>
            {db.servicios.map((s) => (
              <tr key={s.id}>
                <td>{s.nombre}</td>
                <td>{s.duracion} min</td>
                <td className="right">{precio(s.precio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid cols-3" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>1. Elegí</h3>
          <p className="muted small">Servicio y barbero (o &quot;cualquiera&quot; para el primer horario libre).</p>
        </div>
        <div className="card">
          <h3>2. Reservá</h3>
          <p className="muted small">Ves los horarios disponibles en tiempo real y confirmás con tu nombre y teléfono.</p>
        </div>
        <div className="card">
          <h3>3. Pagá</h3>
          <p className="muted small">Online con Mercado Pago o en el local al terminar. Podés cancelar hasta {CANCEL_HOURS} horas antes.</p>
        </div>
      </section>

      <p className="muted small" style={{ marginTop: 24 }}>
        {BARBERIA.nombre} · {BARBERIA.direccion}
      </p>
    </>
  );
}
