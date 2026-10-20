# Turnos de barbería (React + Vite)

Web para reservar turnos de barbería: el cliente elige servicio, barbero, día y horario libre, y paga online o en el local. Incluye panel de administración.

> **Estado:** MVP funcional que guarda los datos en el navegador (`localStorage`). Sirve para probar el flujo completo y para validar el diseño. Para usarlo con clientes reales hay que pasarlo a un backend (ver "Próximos pasos").

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # prueba la lógica de horarios
npm run build    # versión de producción en /dist
```

Requiere Node 18 o superior.

## Qué incluye

**Cliente**
- `/` Inicio con servicios y precios
- `/reservar` Reserva en 4 pasos: servicio → barbero (o "cualquiera") → fecha y hora → datos y forma de pago
- `/turno/:codigo` Detalle del turno, pago online (simulado), cancelación y link a WhatsApp
- `/mi-turno` Buscar un turno por su código de 6 caracteres

**Admin** (`/admin`, clave de demo: `admin123`)
- Agenda por día y por barbero: marcar completado, ausente, cancelado y cobrado
- Servicios: nombre, duración y precio
- Barberos: días y horarios de trabajo, descanso diario y bloqueos (vacaciones, feriados)
- Reportes: turnos por día, ingresos cobrados, por servicio y por barbero

## Reglas de negocio (configurables en `src/lib/config.js`)

| Regla | Valor |
| --- | --- |
| Retención de horario con pago online pendiente | 10 minutos |
| Cancelación del cliente | hasta 2 horas antes |
| Grilla de horarios | cada 30 minutos |
| Días reservables hacia adelante | 14 |

Estados del turno: `pendiente` → `confirmado` → `completado` (o `cancelado` / `ausente`).
Estados del pago: `pendiente` (online sin pagar), `pagado`, `pago en local` (se cobra al terminar).

## Estructura

```
src/
  lib/
    config.js     datos de la barbería y reglas
    storage.js    base local + hook useDb()
    slots.js      cálculo de horarios libres (lógica pura, con tests)
    api.js        crear/cancelar turnos y administración
    format.js     fechas y precios
  pages/          pantallas públicas
  pages/admin/    panel de administración
tests/            tests de la lógica de horarios
```

## Próximos pasos para producción

1. **Backend y base de datos.** Reemplazar las funciones de `src/lib/api.js` por llamadas a tu servidor (Node + Express + PostgreSQL, o Supabase). Tablas sugeridas: barberias, barberos, servicios, horarios_trabajo, bloqueos, turnos.
2. **Anti doble reserva en el servidor.** Hoy se valida en el navegador; en producción usá una transacción o una restricción única (por ejemplo una restricción de exclusión sobre `barbero_id` + rango de tiempo en PostgreSQL).
3. **Mercado Pago.** El botón "Pagar con Mercado Pago (simulado)" marca el turno como pagado. En producción: el backend crea la preferencia de Checkout Pro, redirige al cliente y confirma el pago con el webhook (nunca desde el frontend).
4. **Login real del admin.** La clave actual es solo de demo y se ve en el código.
5. **Zona horaria.** Hoy se usa la hora del navegador. Guardá las fechas en UTC y mostralas en hora de Argentina (`America/Argentina/Buenos_Aires`).
6. **Notificaciones.** Emails de confirmación (Resend o Nodemailer) y recordatorios por WhatsApp Business API.
7. **Código del turno.** Sirve para consultar y cancelar sin cuenta; para mayor seguridad pedí también el teléfono.

## Restablecer los datos de prueba

Borrá la clave `barberia-turnos-db-v1` desde las herramientas del navegador (Application → Local Storage).
