// "API" de la aplicación. Hoy trabaja sobre localStorage; para usar un backend real
// se mantienen estas mismas funciones pero haciendo fetch() a tu servidor.
// IMPORTANTE: en un backend real la validación anti doble reserva debe vivir en el servidor
// (transacción o restricción única), no solo en el navegador.
import { addHours, startOfDay } from 'date-fns';
import { CANCEL_HOURS } from './config.js';
import { getDb, updateDb } from './storage.js';
import { slotsParaBarbero, turnoActivo } from './slots.js';

const uid = () => Math.random().toString(36).slice(2, 10);

function codigoTurno(db) {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (;;) {
    let c = '';
    for (let i = 0; i < 6; i++) c += letras[Math.floor(Math.random() * letras.length)];
    if (!db.turnos.some((t) => t.codigo === c)) return c;
  }
}

// ---------- Turnos ----------

export function crearTurno({ barberoId, servicioId, inicio, nombre, telefono, email, metodoPago }) {
  const db = getDb();
  const servicio = db.servicios.find((s) => s.id === servicioId);
  if (!servicio) throw new Error('El servicio elegido ya no existe.');

  const start = new Date(inicio);
  const candidatos = barberoId === 'any' ? db.barberos.map((b) => b.id) : [barberoId];
  const libre = candidatos.find((id) =>
    slotsParaBarbero(db, id, servicio, startOfDay(start)).some((s) => s.getTime() === start.getTime())
  );
  if (!libre) throw new Error('Ese horario ya no está disponible. Elegí otro, por favor.');

  const end = new Date(start.getTime() + servicio.duracion * 60000);
  const online = metodoPago === 'online';
  let creado;
  updateDb((d) => {
    creado = {
      id: uid(),
      codigo: codigoTurno(d),
      barberoId: libre,
      servicioId,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: (email || '').trim(),
      inicio: start.toISOString(),
      fin: end.toISOString(),
      estado: online ? 'pendiente' : 'confirmado',
      metodoPago: online ? 'online' : 'local',
      estadoPago: online ? 'pendiente' : 'pago en local',
      creado: new Date().toISOString(),
    };
    d.turnos.push(creado);
  });
  return creado;
}

export function obtenerTurnoPorCodigo(codigo) {
  const c = (codigo || '').trim().toUpperCase();
  return getDb().turnos.find((t) => t.codigo === c) || null;
}

// Simula el retorno exitoso de Mercado Pago (Checkout Pro).
// En producción esto lo hace el webhook de Mercado Pago contra tu backend.
export function confirmarPagoOnline(id) {
  const t = getDb().turnos.find((x) => x.id === id);
  if (!t) throw new Error('Turno inexistente.');
  if (t.estado === 'cancelado') throw new Error('El turno fue cancelado.');
  // Si la retención venció, solo se puede pagar si nadie más tomó ese horario
  if (!turnoActivo(t)) {
    const inicio = new Date(t.inicio);
    const fin = new Date(t.fin);
    const tomado = getDb().turnos.some(
      (o) => o.id !== t.id && o.barberoId === t.barberoId && turnoActivo(o) && inicio < new Date(o.fin) && fin > new Date(o.inicio)
    );
    if (tomado) throw new Error('Pasó el tiempo de retención y el horario ya fue tomado. Reservá de nuevo.');
  }
  updateDb((d) => {
    const x = d.turnos.find((y) => y.id === id);
    x.estadoPago = 'pagado';
    x.estado = 'confirmado';
  });
}

export function puedeCancelarCliente(t, now = new Date()) {
  if (!['pendiente', 'confirmado'].includes(t.estado)) return false;
  return new Date(t.inicio) >= addHours(now, CANCEL_HOURS);
}

export function cancelarTurnoCliente(id) {
  const t = getDb().turnos.find((x) => x.id === id);
  if (!t) throw new Error('Turno inexistente.');
  if (!puedeCancelarCliente(t)) {
    throw new Error(`Solo se puede cancelar hasta ${CANCEL_HOURS} horas antes. Comunicate con la barbería.`);
  }
  cambiarEstado(id, 'cancelado');
}

// ---------- Acciones de administración ----------

export function cambiarEstado(id, estado) {
  updateDb((d) => {
    const t = d.turnos.find((x) => x.id === id);
    if (t) t.estado = estado;
  });
}

export function marcarCobrado(id) {
  updateDb((d) => {
    const t = d.turnos.find((x) => x.id === id);
    if (t) t.estadoPago = 'pagado';
  });
}

// ---------- Servicios ----------

export function agregarServicio(s) {
  updateDb((d) => d.servicios.push({ id: uid(), ...s }));
}
export function editarServicio(id, cambios) {
  updateDb((d) => {
    const s = d.servicios.find((x) => x.id === id);
    if (s) Object.assign(s, cambios);
  });
}
export function borrarServicio(id) {
  updateDb((d) => {
    d.servicios = d.servicios.filter((x) => x.id !== id);
  });
}

// ---------- Barberos ----------

export function agregarBarbero(nombre) {
  updateDb((d) => {
    const base = d.barberos[0];
    d.barberos.push({
      id: uid(),
      nombre,
      descanso: base ? { ...base.descanso } : null,
      horarios: base
        ? structuredClone(base.horarios)
        : { 0: null, 1: { inicio: '10:00', fin: '19:00' }, 2: { inicio: '10:00', fin: '19:00' }, 3: { inicio: '10:00', fin: '19:00' }, 4: { inicio: '10:00', fin: '19:00' }, 5: { inicio: '10:00', fin: '19:00' }, 6: null },
    });
  });
}
export function editarBarbero(id, cambios) {
  updateDb((d) => {
    const b = d.barberos.find((x) => x.id === id);
    if (b) Object.assign(b, cambios);
  });
}
export function editarHorario(barberoId, dia, valor) {
  updateDb((d) => {
    const b = d.barberos.find((x) => x.id === barberoId);
    if (b) b.horarios[dia] = valor;
  });
}
export function borrarBarbero(id) {
  updateDb((d) => {
    d.barberos = d.barberos.filter((x) => x.id !== id);
  });
}

// ---------- Bloqueos ----------

export function agregarBloqueo(b) {
  updateDb((d) => d.bloqueos.push({ id: uid(), ...b }));
}
export function borrarBloqueo(id) {
  updateDb((d) => {
    d.bloqueos = d.bloqueos.filter((x) => x.id !== id);
  });
}
