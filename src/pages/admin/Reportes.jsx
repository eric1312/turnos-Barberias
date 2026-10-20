import { addDays, startOfDay } from 'date-fns';
import { useDb } from '../../lib/storage.js';
import { claveDia, fechaCorta, precio } from '../../lib/format.js';

export default function Reportes() {
  const db = useDb();
  const hoy = startOfDay(new Date());
  const dias = Array.from({ length: 14 }, (_, i) => addDays(hoy, i - 6)); // 6 días atrás a 7 adelante

  const validos = db.turnos.filter((t) => t.estado !== 'cancelado' && (t.estado !== 'pendiente' || t.estadoPago === 'pagado'));
  const precioDe = (t) => db.servicios.find((s) => s.id === t.servicioId)?.precio || 0;

  const porDia = dias.map((d) => {
    const key = claveDia(d);
    const delDia = validos.filter((t) => claveDia(t.inicio) === key);
    return {
      d,
      cantidad: delDia.length,
      ingresos: delDia.filter((t) => t.estadoPago === 'pagado').reduce((a, t) => a + precioDe(t), 0),
    };
  });
  const maximo = Math.max(1, ...porDia.map((x) => x.cantidad));

  const totalIngresos = validos.filter((t) => t.estadoPago === 'pagado').reduce((a, t) => a + precioDe(t), 0);
  const ausentes = db.turnos.filter((t) => t.estado === 'ausente').length;
  const cancelados = db.turnos.filter((t) => t.estado === 'cancelado').length;

  const porServicio = db.servicios.map((s) => ({ nombre: s.nombre, n: validos.filter((t) => t.servicioId === s.id).length }));
  const porBarbero = db.barberos.map((b) => ({ nombre: b.nombre, n: validos.filter((t) => t.barberoId === b.id).length }));

  return (
    <div className="stack">
      <h2>Reportes</h2>

      <div className="grid cols-3">
        <div className="stat">
          <div className="muted small">Ingresos cobrados (total)</div>
          <div className="n">{precio(totalIngresos)}</div>
        </div>
        <div className="stat">
          <div className="muted small">Ausentes</div>
          <div className="n">{ausentes}</div>
        </div>
        <div className="stat">
          <div className="muted small">Cancelados</div>
          <div className="n">{cancelados}</div>
        </div>
      </div>

      <div className="card">
        <h3>Turnos por día (6 días atrás y próximos 7)</h3>
        <div className="bars">
          {porDia.map((x) => (
            <div className="bar-row" key={x.d.getTime()}>
              <span className="muted">{fechaCorta(x.d)}</span>
              <div className="bar" style={{ width: `${(x.cantidad / maximo) * 100}%` }} />
              <span>{x.cantidad}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>Por servicio</h3>
          <table>
            <tbody>
              {porServicio.map((x) => (
                <tr key={x.nombre}>
                  <td>{x.nombre}</td>
                  <td className="right">{x.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Por barbero</h3>
          <table>
            <tbody>
              {porBarbero.map((x) => (
                <tr key={x.nombre}>
                  <td>{x.nombre}</td>
                  <td className="right">{x.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Ingresos cobrados por día</h3>
        <table>
          <tbody>
            {porDia.map((x) => (
              <tr key={x.d.getTime()}>
                <td>{fechaCorta(x.d)}</td>
                <td className="right">{precio(x.ingresos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
