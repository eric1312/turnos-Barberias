// Configuración general de la barbería. Cambiá estos valores a gusto.
export const BARBERIA = {
  nombre: 'Barbería Don Filo',
  direccion: 'Av. Principal 123',
  // Teléfono en formato internacional sin "+" ni espacios (para links de WhatsApp)
  telefono: '5491100000000',
};

// Minutos que se retiene un horario mientras el cliente completa el pago online
export const HOLD_MIN = 10;

// Horas mínimas de anticipación para que el cliente pueda cancelar solo
export const CANCEL_HOURS = 2;

// Cada cuántos minutos arranca un horario posible (grilla de turnos)
export const STEP_MIN = 30;

// Cuántos días hacia adelante se puede reservar
export const DIAS_RESERVA = 14;

// Clave del panel admin (DEMO). En producción reemplazar por login real en el backend.
export const ADMIN_PASSWORD = 'admin123';
