// Lógica pura (sin React ni localStorage) para calcular horarios libres.
import { addMinutes, format } from 'date-fns';
import { HOLD_MIN, STEP_MIN } from './config.js';

// Un turno "ocupa" el horario si no está cancelado y, si es pendiente de pago online,
// si todavía no venció la retención.
export function turnoActivo(t, now = new Date()) {
  if (t.estado === 'cancelado') return false;
  if (t.estado === 'pendiente') return now.getTime() - new Date(t.creado).getTime() < HOLD_MIN * 60000;
  return true;
}

function aFecha(day, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

export function diaBloqueado(db, barberoId, day) {
  const key = format(day, 'yyyy-MM-dd');
  return db.bloqueos.some(
    (b) => (b.barberoId === 'todos' || b.barberoId === barberoId) && b.desde <= key && (b.hasta || b.desde) >= key
  );
}

export function slotsParaBarbero(db, barberoId, servicio, day, now = new Date()) {
  const barbero = db.barberos.find((b) => b.id === barberoId);
  if (!barbero || !servicio) return [];
  const h = barbero.horarios[day.getDay()];
  if (!h) return [];
  if (diaBloqueado(db, barberoId, day)) return [];

  const apertura = aFecha(day, h.inicio);
  const cierre = aFecha(day, h.fin);
  const descanso = barbero.descanso ? [aFecha(day, barbero.descanso.inicio), aFecha(day, barbero.descanso.fin)] : null;
  const ocupados = db.turnos
    .filter((t) => t.barberoId === barberoId && turnoActivo(t, now))
    .map((t) => [new Date(t.inicio), new Date(t.fin)]);

  const out = [];
  for (let s = apertura; addMinutes(s, servicio.duracion) <= cierre; s = addMinutes(s, STEP_MIN)) {
    const e = addMinutes(s, servicio.duracion);
    if (s <= now) continue;
    if (descanso && s < descanso[1] && e > descanso[0]) continue;
    if (ocupados.some(([a, b]) => s < b && e > a)) continue;
    out.push(s);
  }
  return out;
}

// barberoId puede ser 'any' (cualquiera). Devuelve [{ inicio: Date, barberoIds: [...] }]
export function slotsDisponibles(db, barberoId, servicio, day, now = new Date()) {
  const ids = barberoId === 'any' ? db.barberos.map((b) => b.id) : [barberoId];
  const mapa = new Map();
  for (const id of ids) {
    for (const s of slotsParaBarbero(db, id, servicio, day, now)) {
      const k = s.getTime();
      if (!mapa.has(k)) mapa.set(k, []);
      mapa.get(k).push(id);
    }
  }
  return [...mapa.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ms, barberoIds]) => ({ inicio: new Date(ms), barberoIds }));
}
