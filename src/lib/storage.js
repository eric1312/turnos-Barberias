// Base de datos local (localStorage) con suscripción para React.
// Es el único archivo que "sabe" dónde viven los datos: para pasar a un backend real
// (Supabase, Express + PostgreSQL, etc.) se reemplazan las funciones de api.js.
import { useSyncExternalStore } from 'react';

const KEY = 'barberia-turnos-db-v1';

const hor = (inicio, fin) => ({ inicio, fin });
const semana = () => ({
  0: null, // domingo cerrado
  1: hor('10:00', '19:00'),
  2: hor('10:00', '19:00'),
  3: hor('10:00', '19:00'),
  4: hor('10:00', '19:00'),
  5: hor('10:00', '19:00'),
  6: hor('10:00', '15:00'),
});

export const seed = () => ({
  servicios: [
    { id: 's1', nombre: 'Corte clásico', duracion: 30, precio: 9000 },
    { id: 's2', nombre: 'Barba', duracion: 30, precio: 6000 },
    { id: 's3', nombre: 'Corte + barba', duracion: 60, precio: 14000 },
  ],
  barberos: [
    { id: 'b1', nombre: 'Matías', descanso: { inicio: '13:00', fin: '14:00' }, horarios: semana() },
    { id: 'b2', nombre: 'Lucas', descanso: { inicio: '13:00', fin: '14:00' }, horarios: semana() },
  ],
  bloqueos: [], // { id, barberoId ('todos' o id), desde 'yyyy-MM-dd', hasta, motivo }
  turnos: [],
});

let current = null;
const listeners = new Set();

function read() {
  if (current) return current;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      current = JSON.parse(raw);
      return current;
    }
  } catch {
    /* datos corruptos: se regeneran */
  }
  current = seed();
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* sin acceso a localStorage: queda en memoria */
  }
  return current;
}

export function getDb() {
  return read();
}

// Aplica un cambio sobre una copia y lo persiste. El cambio es síncrono,
// por eso dentro de una misma pestaña no hay carreras entre dos reservas.
export function updateDb(mutator) {
  const next = structuredClone(read());
  mutator(next);
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignorar */
  }
  listeners.forEach((l) => l());
  return next;
}

export function resetDb() {
  current = seed();
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* ignorar */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== 'undefined') {
  // Si se modifica desde otra pestaña, se recarga
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      current = null;
      listeners.forEach((l) => l());
    }
  });
}

export function useDb() {
  return useSyncExternalStore(subscribe, getDb);
}

// Reloj que fuerza re-render cada tanto (para vencer retenciones de horarios)
export function useTick(ms = 30000) {
  return useSyncExternalStore(
    (cb) => {
      const t = setInterval(cb, ms);
      return () => clearInterval(t);
    },
    () => Math.floor(Date.now() / ms)
  );
}
