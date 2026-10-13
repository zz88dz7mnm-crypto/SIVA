/**
 * Las cuentas de hábitos y agenda, con las definiciones de RHA (ver docs/CONTRATO.md del repo de RHA):
 * - un hábito de días fijos se espera en esos días; uno semanal, N veces en la semana (lunes a domingo);
 * - los días en pausa no cuentan como incumplimiento;
 * - hoy cuenta solo si ya se registró: el día no terminó;
 * - una actividad vencida es una pendiente con fecha pasada.
 */
import { lunesDe, sumarDias } from "./fechas";

export type Prioridad = "alta" | "media" | "baja";

export type ActividadRHA = {
  id: string;
  titulo: string;
  fecha: string;
  inicio: string | null;
  fin: string | null;
  categoriaId: string | null;
  prioridad: Prioridad;
  estado: "pendiente" | "completada" | "cancelada";
};

export type HabitoRHA = {
  id: string;
  nombre: string;
  tipo: "dias" | "semanal";
  /** 1 = lunes … 7 = domingo. */
  dias: number[];
  metaSemanal: number | null;
  suplemento: boolean;
  estado: "activo" | "pausado" | "archivado";
  desde: string;
  orden: number;
};

export type PausaRHA = { habitoId: string; desde: string; hasta: string | null };
export type RegistroRHA = { habitoId: string; fecha: string; estado: "completado" | "parcial" | "no_completado" };
export type CategoriaRHA = { id: string; nombre: string; color: string };

/** 1 = lunes … 7 = domingo. */
export function diaDeSemana(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  const dow = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return dow === 0 ? 7 : dow;
}

export function enPausa(habitoId: string, fecha: string, pausas: PausaRHA[]): boolean {
  return pausas.some((p) => p.habitoId === habitoId && p.desde <= fecha && (p.hasta === null || fecha < p.hasta));
}

export function programadoEn(h: HabitoRHA, fecha: string, pausas: PausaRHA[]): boolean {
  if (h.estado === "archivado" || fecha < h.desde || enPausa(h.id, fecha, pausas)) return false;
  return h.tipo === "semanal" || h.dias.includes(diaDeSemana(fecha));
}

const registroDe = (registros: RegistroRHA[], habitoId: string, fecha: string) => registros.find((r) => r.habitoId === habitoId && r.fecha === fecha);

export type Adherencia = { completados: number; parciales: number; programados: number };

/** Días fijos: de los días programados en el rango, cuántos se completaron. Futuros no cuentan; hoy, solo si tiene registro. */
export function adherencia(h: HabitoRHA, registros: RegistroRHA[], pausas: PausaRHA[], desde: string, hasta: string, hoy: string): Adherencia {
  const r: Adherencia = { completados: 0, parciales: 0, programados: 0 };
  for (let d = desde; d <= hasta && d <= hoy; d = sumarDias(d, 1)) {
    if (!programadoEn(h, d, pausas)) continue;
    const reg = registroDe(registros, h.id, d);
    if (d === hoy && !reg) continue;
    r.programados += 1;
    if (reg?.estado === "completado") r.completados += 1;
    if (reg?.estado === "parcial") r.parciales += 1;
  }
  return r;
}

export function avanceSemanal(h: HabitoRHA, registros: RegistroRHA[], fecha: string): { hechas: number; meta: number; cumplida: boolean } {
  const lunes = lunesDe(fecha);
  const domingo = sumarDias(lunes, 6);
  const hechas = registros.filter((r) => r.habitoId === h.id && r.estado === "completado" && r.fecha >= lunes && r.fecha <= domingo).length;
  const meta = h.metaSemanal ?? 1;
  return { hechas, meta, cumplida: hechas >= meta };
}

/** Racha actual, como la cuenta RHA: días programados seguidos completados, o semanas seguidas con la meta cumplida. */
export function racha(h: HabitoRHA, registros: RegistroRHA[], pausas: PausaRHA[], hoy: string): { valor: number; unidad: "días" | "semanas" } {
  if (h.tipo === "semanal") {
    let valor = 0;
    let lunes = lunesDe(hoy);
    if (avanceSemanal(h, registros, lunes).cumplida) valor += 1;
    lunes = sumarDias(lunes, -7);
    for (let i = 0; i < 520 && sumarDias(lunes, 6) >= h.desde; i++, lunes = sumarDias(lunes, -7)) {
      const toda = Array.from({ length: 7 }, (_, k) => sumarDias(lunes, k)).every((d) => enPausa(h.id, d, pausas));
      if (toda) continue;
      if (!avanceSemanal(h, registros, lunes).cumplida) break;
      valor += 1;
    }
    return { valor, unidad: "semanas" };
  }
  let valor = 0;
  for (let d = hoy, i = 0; d >= h.desde && i < 3650; d = sumarDias(d, -1), i++) {
    if (!programadoEn(h, d, pausas)) continue;
    const estado = registroDe(registros, h.id, d)?.estado;
    if (estado === "completado") valor += 1;
    else if (d === hoy && !estado) continue;
    else break;
  }
  return { valor, unidad: "días" };
}

const aMinutos = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

/** Primero las que tienen horario, por hora; después las tareas sin horario, por prioridad. */
export function ordenar(lista: ActividadRHA[]): ActividadRHA[] {
  const peso = { alta: 0, media: 1, baja: 2 };
  return [...lista].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
    if (a.inicio && b.inicio) return a.inicio.localeCompare(b.inicio);
    if (a.inicio) return -1;
    if (b.inicio) return 1;
    return peso[a.prioridad] - peso[b.prioridad] || a.titulo.localeCompare(b.titulo);
  });
}

/** Suma de bloques con inicio y fin, sin canceladas. No es tiempo real trabajado. */
export function minutosPlanificados(actividades: ActividadRHA[]): number {
  return actividades
    .filter((a) => a.estado !== "cancelada" && a.inicio && a.fin)
    .reduce((total, a) => total + Math.max(0, aMinutos(a.fin!) - aMinutos(a.inicio!)), 0);
}

/** "2 h 30 min", "45 min". */
export function textoDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export type HabitoDeHoy = {
  habito: HabitoRHA;
  /** Días fijos: el registro de hoy. Semanales: el avance de la semana. */
  estado: RegistroRHA["estado"] | null;
  semanal: { hechas: number; meta: number } | null;
};

export type ResumenRHA = {
  lunes: string;
  /** Hábitos de días fijos que tocan hoy y semanales sin la meta cumplida. */
  deHoy: HabitoDeHoy[];
  hechosHoy: number;
  /** Adherencia de la semana (días fijos, lunes a hoy), con su denominador. */
  semana: Adherencia;
  /** Hábitos semanales: cuántos ya cumplieron la meta esta semana. */
  semanales: { cumplidos: number; total: number };
  agendaHoy: ActividadRHA[];
  vencidas: ActividadRHA[];
  /** Pendientes de mañana a 7 días, en orden. */
  proximas: ActividadRHA[];
  /** Por día de la semana actual (lunes a domingo): minutos planificados. */
  porDia: { fecha: string; minutos: number; actividades: number }[];
  minutosSemana: number;
  rachas: { nombre: string; valor: number; unidad: "días" | "semanas" }[];
};

export function resumenDeRHA(
  datos: { actividades: ActividadRHA[]; habitos: HabitoRHA[]; registros: RegistroRHA[]; pausas: PausaRHA[] },
  hoy: string,
): ResumenRHA {
  const { actividades, registros, pausas } = datos;
  const lunes = lunesDe(hoy);
  const domingo = sumarDias(lunes, 6);
  const habitos = datos.habitos.filter((h) => h.estado !== "archivado").sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));

  const deHoy: HabitoDeHoy[] = [];
  for (const h of habitos) {
    if (!programadoEn(h, hoy, pausas)) continue;
    if (h.tipo === "semanal") {
      const a = avanceSemanal(h, registros, hoy);
      deHoy.push({ habito: h, estado: registroDe(registros, h.id, hoy)?.estado ?? null, semanal: { hechas: a.hechas, meta: a.meta } });
    } else {
      deHoy.push({ habito: h, estado: registroDe(registros, h.id, hoy)?.estado ?? null, semanal: null });
    }
  }
  const hechosHoy = deHoy.filter((d) => d.estado === "completado").length;

  const semana: Adherencia = { completados: 0, parciales: 0, programados: 0 };
  for (const h of habitos.filter((x) => x.tipo === "dias")) {
    const a = adherencia(h, registros, pausas, lunes, domingo, hoy);
    semana.completados += a.completados;
    semana.parciales += a.parciales;
    semana.programados += a.programados;
  }
  const semanalesActivos = habitos.filter((h) => h.tipo === "semanal" && h.estado === "activo");
  const semanales = { cumplidos: semanalesActivos.filter((h) => avanceSemanal(h, registros, hoy).cumplida).length, total: semanalesActivos.length };

  const vigentes = actividades.filter((a) => a.estado !== "cancelada");
  const agendaHoy = ordenar(vigentes.filter((a) => a.fecha === hoy));
  const vencidas = ordenar(actividades.filter((a) => a.estado === "pendiente" && a.fecha < hoy));
  const proximas = ordenar(vigentes.filter((a) => a.estado === "pendiente" && a.fecha > hoy && a.fecha <= sumarDias(hoy, 7)));
  const porDia = Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(lunes, i);
    const del = vigentes.filter((a) => a.fecha === fecha);
    return { fecha, minutos: minutosPlanificados(del), actividades: del.length };
  });

  const rachas = habitos
    .filter((h) => h.estado === "activo")
    .map((h) => ({ nombre: h.nombre, ...racha(h, registros, pausas, hoy) }))
    .filter((r) => r.valor > 0)
    .sort((a, b) => (b.unidad === "semanas" ? b.valor * 7 : b.valor) - (a.unidad === "semanas" ? a.valor * 7 : a.valor));

  return {
    lunes,
    deHoy,
    hechosHoy,
    semana,
    semanales,
    agendaHoy,
    vencidas,
    proximas,
    porDia,
    minutosSemana: porDia.reduce((t, d) => t + d.minutos, 0),
    rachas,
  };
}
