/**
 * Las cuentas de entrenamiento, con las definiciones de GYM (ver docs/CONTRATO.md del repo de GYM):
 * solo cuentan las sesiones completadas y sus series hechas con kilos y repeticiones.
 */
import { diasEntre, lunesDe, sumarDias } from "./fechas";

export type SesionGym = { id: string; dia: string; fecha: string; inicio: string; fin: string | null; estado: "en_curso" | "completada" | "cancelada" };
export type SerieGym = { sesionId: string; ejercicio: string; ejercicioNombre: string; kg: number | null; reps: number | null; hecha: boolean };

export const SESIONES_POR_SEMANA = 3;
export const SEMANAS_DEL_PLAN = 12;

const cuenta = (s: SerieGym): s is SerieGym & { kg: number; reps: number } => s.hecha && s.kg !== null && s.reps !== null && s.kg >= 0 && s.reps > 0;

/** "Día A", "Libre". */
export function nombreDeDia(dia: string): string {
  return dia === "libre" ? "Libre" : `Día ${dia}`;
}

/** Semana del plan (1 = la del inicio). Fuera del plan puede dar menos de 1 o más de 12. */
export function semanaDelPlan(inicio: string, hoy: string): number {
  return Math.floor(diasEntre(lunesDe(inicio), hoy) / 7) + 1;
}

export type Marca = { ejercicio: string; nombre: string; kg: number; anterior: number };

export type SemanaGym = {
  lunes: string;
  sesiones: SesionGym[];
  volumen: number;
  series: number;
  /** Volumen por día, de lunes a domingo. */
  porDia: { fecha: string; volumen: number; sesiones: number }[];
  /** Ejercicios en los que esta semana se movió más peso que en cualquier semana anterior. */
  marcas: Marca[];
  volumenAnterior: number;
  ultima: SesionGym | null;
};

export function resumenDeSemana(sesiones: SesionGym[], series: SerieGym[], hoy: string): SemanaGym {
  const lunes = lunesDe(hoy);
  const domingo = sumarDias(lunes, 6);
  const completadas = sesiones.filter((s) => s.estado === "completada");
  const deLaSemana = completadas
    .filter((s) => s.fecha >= lunes && s.fecha <= domingo)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.inicio.localeCompare(b.inicio));
  const idsSemana = new Set(deLaSemana.map((s) => s.id));
  const lunesAnterior = sumarDias(lunes, -7);
  const idsAnterior = new Set(completadas.filter((s) => s.fecha >= lunesAnterior && s.fecha < lunes).map((s) => s.id));
  const idsPrevios = new Set(completadas.filter((s) => s.fecha < lunes).map((s) => s.id));
  const fechaDe = new Map(deLaSemana.map((s) => [s.id, s.fecha]));

  const porDia = Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(lunes, i);
    return { fecha, volumen: 0, sesiones: deLaSemana.filter((s) => s.fecha === fecha).length };
  });
  let volumen = 0;
  let cantidad = 0;
  let volumenAnterior = 0;
  const mejorPrevio = new Map<string, number>();
  const mejorSemana = new Map<string, { nombre: string; kg: number }>();

  for (const s of series) {
    if (!cuenta(s)) continue;
    if (idsSemana.has(s.sesionId)) {
      volumen += s.kg * s.reps;
      cantidad += 1;
      const dia = porDia.find((d) => d.fecha === fechaDe.get(s.sesionId));
      if (dia) dia.volumen += s.kg * s.reps;
      const previo = mejorSemana.get(s.ejercicio);
      if (!previo || s.kg > previo.kg) mejorSemana.set(s.ejercicio, { nombre: s.ejercicioNombre, kg: s.kg });
    }
    if (idsAnterior.has(s.sesionId)) volumenAnterior += s.kg * s.reps;
    if (idsPrevios.has(s.sesionId)) mejorPrevio.set(s.ejercicio, Math.max(mejorPrevio.get(s.ejercicio) ?? 0, s.kg));
  }

  const marcas: Marca[] = [];
  for (const [ejercicio, { nombre, kg }] of mejorSemana) {
    const anterior = mejorPrevio.get(ejercicio);
    if (anterior !== undefined && kg > anterior) marcas.push({ ejercicio, nombre, kg, anterior });
  }
  marcas.sort((a, b) => b.kg - b.anterior - (a.kg - a.anterior));

  const r1 = (n: number) => Math.round(n * 10) / 10;
  const ultima = [...completadas].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.inicio.localeCompare(a.inicio))[0] ?? null;
  return {
    lunes,
    sesiones: deLaSemana,
    volumen: r1(volumen),
    series: cantidad,
    porDia: porDia.map((d) => ({ ...d, volumen: r1(d.volumen) })),
    marcas,
    volumenAnterior: r1(volumenAnterior),
    ultima,
  };
}

/** "12.450 kg", "12,5 t". */
export function formatoVolumen(kg: number): string {
  if (kg >= 10_000) return `${(kg / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} t`;
  return `${Math.round(kg).toLocaleString("es-AR")} kg`;
}

export function formatoKg(kg: number): string {
  return `${kg.toLocaleString("es-AR", { maximumFractionDigits: 2 })} kg`;
}
