import test from 'node:test';
import assert from 'node:assert/strict';
import { slotsParaBarbero, slotsDisponibles, turnoActivo } from '../src/lib/slots.js';
import { seed } from '../src/lib/storage.js';

// Lunes 2030-01-07 a las 08:00 (futuro y antes de abrir)
const dia = new Date(2030, 0, 7);
const ahora = new Date(2030, 0, 7, 8, 0, 0);
const servicioCorte = { duracion: 30 };
const servicioCombo = { duracion: 60 };

const horas = (slots) => slots.map((s) => `${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`);

test('agenda libre: respeta apertura, cierre y descanso', () => {
  const db = seed();
  const h = horas(slotsParaBarbero(db, 'b1', servicioCorte, dia, ahora));
  assert.equal(h[0], '10:00');
  assert.equal(h.at(-1), '18:30');
  assert.ok(!h.includes('13:00') && !h.includes('13:30'), 'no debe ofrecer horarios en el descanso');
});

test('un servicio de 60 min no puede pisar el descanso ni el cierre', () => {
  const db = seed();
  const h = horas(slotsParaBarbero(db, 'b1', servicioCombo, dia, ahora));
  assert.ok(!h.includes('12:30'), '12:30 + 60 min pisa el descanso');
  assert.ok(h.includes('12:00'));
  assert.equal(h.at(-1), '18:00');
});

test('un turno tomado bloquea sus horarios y los que se superponen', () => {
  const db = seed();
  db.turnos.push({
    barberoId: 'b1', estado: 'confirmado',
    inicio: new Date(2030, 0, 7, 11, 0).toISOString(),
    fin: new Date(2030, 0, 7, 12, 0).toISOString(),
    creado: new Date().toISOString(),
  });
  const h = horas(slotsParaBarbero(db, 'b1', servicioCorte, dia, ahora));
  assert.ok(!h.includes('11:00') && !h.includes('11:30'));
  assert.ok(h.includes('10:30') && h.includes('12:00'));
  // un combo de 60 min a las 10:30 pisaría las 11:00
  const combo = horas(slotsParaBarbero(db, 'b1', servicioCombo, dia, ahora));
  assert.ok(!combo.includes('10:30'));
});

test('turno cancelado libera el horario', () => {
  const db = seed();
  db.turnos.push({
    barberoId: 'b1', estado: 'cancelado',
    inicio: new Date(2030, 0, 7, 11, 0).toISOString(),
    fin: new Date(2030, 0, 7, 11, 30).toISOString(),
    creado: new Date().toISOString(),
  });
  assert.ok(horas(slotsParaBarbero(db, 'b1', servicioCorte, dia, ahora)).includes('11:00'));
});

test('retención de 10 minutos para turnos pendientes de pago', () => {
  const t = { estado: 'pendiente', creado: new Date(ahora.getTime() - 5 * 60000).toISOString() };
  assert.equal(turnoActivo(t, ahora), true);
  const vencido = { estado: 'pendiente', creado: new Date(ahora.getTime() - 11 * 60000).toISOString() };
  assert.equal(turnoActivo(vencido, ahora), false);
});

test('domingo cerrado y días bloqueados no tienen horarios', () => {
  const db = seed();
  const domingo = new Date(2030, 0, 6);
  assert.equal(slotsParaBarbero(db, 'b1', servicioCorte, domingo, new Date(2030, 0, 6, 8)).length, 0);
  db.bloqueos.push({ id: 'x', barberoId: 'b1', desde: '2030-01-07', hasta: '2030-01-07', motivo: 'Vacaciones' });
  assert.equal(slotsParaBarbero(db, 'b1', servicioCorte, dia, ahora).length, 0);
  assert.ok(slotsParaBarbero(db, 'b2', servicioCorte, dia, ahora).length > 0);
});

test('"cualquiera" une los horarios de todos los barberos', () => {
  const db = seed();
  db.turnos.push({
    barberoId: 'b1', estado: 'confirmado',
    inicio: new Date(2030, 0, 7, 10, 0).toISOString(),
    fin: new Date(2030, 0, 7, 10, 30).toISOString(),
    creado: new Date().toISOString(),
  });
  const slots = slotsDisponibles(db, 'any', servicioCorte, dia, ahora);
  const diez = slots.find((s) => s.inicio.getHours() === 10 && s.inicio.getMinutes() === 0);
  assert.deepEqual(diez.barberoIds, ['b2']);
});

test('no ofrece horarios que ya pasaron', () => {
  const db = seed();
  const tarde = new Date(2030, 0, 7, 17, 0, 0);
  const h = horas(slotsParaBarbero(db, 'b1', servicioCorte, dia, tarde));
  assert.deepEqual(h, ['17:30', '18:00', '18:30']);
});
