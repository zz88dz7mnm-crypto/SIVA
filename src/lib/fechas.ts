/** Fechas como texto AAAA-MM-DD, sin horas: así no hay corrimientos por zona horaria. */

export const ZONA = "America/Argentina/Buenos_Aires";

/** El día de hoy en la zona dada. */
export function hoyEn(zona = ZONA, ahora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}

/** La hora local (0–23) en la zona dada. */
export function horaEn(zona = ZONA, ahora = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: zona, hour: "2-digit", hourCycle: "h23" }).format(ahora));
}

const aUTC = (fecha: string) => {
  const [a, m, d] = fecha.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
};

const deUTC = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function sumarDias(fecha: string, dias: number): string {
  return deUTC(aUTC(fecha) + dias * 86_400_000);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aUTC(hasta) - aUTC(desde)) / 86_400_000);
}

/** El lunes de la semana de esa fecha (la semana va de lunes a domingo). */
export function lunesDe(fecha: string): string {
  const diaSemana = new Date(aUTC(fecha)).getUTCDay(); // 0 = domingo
  return sumarDias(fecha, -((diaSemana + 6) % 7));
}

/** Semana del plan (1 = la del inicio). Puede dar menos de 1 o más de 12: quien la usa decide qué mostrar. */
export function semanaDelPlan(inicio: string, hoy: string): number {
  return Math.floor(diasEntre(lunesDe(inicio), hoy) / 7) + 1;
}

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "12 oct", o "12 oct 2025" si no es del año de `hoy`. */
export function fechaCorta(fecha: string, hoy?: string): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const base = `${d} ${MESES[m - 1]}`;
  return hoy && hoy.slice(0, 4) !== fecha.slice(0, 4) ? `${base} ${a}` : base;
}

/** "Hoy", "Ayer", "lunes 6 oct". */
export function fechaRelativa(fecha: string, hoy: string): string {
  const dif = diasEntre(fecha, hoy);
  if (dif === 0) return "Hoy";
  if (dif === 1) return "Ayer";
  const diaSemana = DIAS_SEMANA[new Date(aUTC(fecha)).getUTCDay()];
  return `${diaSemana} ${fechaCorta(fecha, hoy)}`;
}

/** Duración entre dos instantes ISO: "52 min", "1 h 05 min". */
export function duracion(inicio: string, fin: string): string {
  const minutos = Math.max(0, Math.round((Date.parse(fin) - Date.parse(inicio)) / 60_000));
  if (minutos < 60) return `${minutos} min`;
  return `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, "0")} min`;
}

/** Hora local de un instante ISO: "18:42". */
export function horaLocal(instante: string, zona = ZONA): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone: zona, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(instante));
}
