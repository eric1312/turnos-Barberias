import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const moneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export const precio = (n) => moneda.format(n || 0);
export const fechaLarga = (d) => format(new Date(d), "EEEE d 'de' MMMM", { locale: es });
export const fechaCorta = (d) => format(new Date(d), 'dd/MM/yyyy');
export const hora = (d) => format(new Date(d), 'HH:mm');
export const claveDia = (d) => format(new Date(d), 'yyyy-MM-dd');
export const diaSemanaCorto = (d) => format(new Date(d), 'EEE', { locale: es });

export const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const ETIQUETA_PAGO = {
  pendiente: 'Pago online pendiente',
  pagado: 'Pagado',
  'pago en local': 'Pago en el local',
};
