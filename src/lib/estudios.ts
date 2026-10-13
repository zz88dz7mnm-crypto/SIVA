/**
 * Las cuentas de estudios, con las definiciones de CIA (ver docs/CONTRATO.md del repo de CIA):
 * - un examen pendiente con fecha pasada no se da por rendido: se muestra "sin marcar";
 * - la preparación son los estados de los temas, sin inferir dominio real;
 * - los bloques de estudio ya están en RHA: acá no se suman otra vez.
 */
import { diasEntre } from "./fechas";

export type MateriaCIA = { id: string; nombre: string; color: string };
export type ExamenCIA = {
  id: string;
  materiaId: string;
  nombre: string;
  tipo: "parcial" | "recuperatorio" | "tp" | "cuestionario" | "final";
  fecha: string;
  fechaProvisoria: boolean;
  estado: "pendiente" | "rendido" | "no_rendido" | "descartado";
  avisos: number[];
};
export type TemaCIA = { examenId: string; estado: "pendiente" | "en_curso" | "terminado" };

export type ExamenConPreparacion = ExamenCIA & { dias: number; terminados: number; enCurso: number; total: number };

export type ResumenCIA = {
  /** Pendientes de hoy en adelante, por fecha. */
  proximos: ExamenConPreparacion[];
  /** Los de los próximos 7 días. */
  semana: number;
  /** Pasaron y siguen pendientes. */
  sinMarcar: ExamenCIA[];
  /** Hoy toca aviso (los días elegidos antes, o el mismo día). */
  avisos: ExamenConPreparacion[];
  /** Pares de exámenes pendientes el mismo día (sin cuestionarios). */
  choques: [ExamenCIA, ExamenCIA][];
  /** Temas de exámenes próximos. */
  temas: { terminados: number; enCurso: number; total: number };
};

export function resumenDeCIA(datos: { examenes: ExamenCIA[]; temas: TemaCIA[] }, hoy: string): ResumenCIA {
  const prep = (id: string) => {
    const propios = datos.temas.filter((t) => t.examenId === id);
    return {
      terminados: propios.filter((t) => t.estado === "terminado").length,
      enCurso: propios.filter((t) => t.estado === "en_curso").length,
      total: propios.length,
    };
  };
  const pendientes = datos.examenes.filter((e) => e.estado === "pendiente");
  const proximos = pendientes
    .filter((e) => e.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.nombre.localeCompare(b.nombre))
    .map((e) => ({ ...e, dias: diasEntre(hoy, e.fecha), ...prep(e.id) }));
  const ordenados = [...pendientes].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id));
  const choques: [ExamenCIA, ExamenCIA][] = [];
  for (let i = 0; i < ordenados.length; i++) {
    for (let j = i + 1; j < ordenados.length && ordenados[j].fecha === ordenados[i].fecha; j++) {
      if (ordenados[i].tipo === "cuestionario" || ordenados[j].tipo === "cuestionario" || ordenados[i].fecha < hoy) continue;
      choques.push([ordenados[i], ordenados[j]]);
    }
  }
  const temas = proximos.reduce((t, e) => ({ terminados: t.terminados + e.terminados, enCurso: t.enCurso + e.enCurso, total: t.total + e.total }), {
    terminados: 0,
    enCurso: 0,
    total: 0,
  });
  return {
    proximos,
    semana: proximos.filter((e) => e.dias <= 7).length,
    sinMarcar: pendientes.filter((e) => e.fecha < hoy).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    avisos: proximos.filter((e) => e.dias === 0 || e.avisos.includes(e.dias)),
    choques,
    temas,
  };
}

/** "Hoy", "Mañana", "En 4 días". */
export function cuandoEs(dias: number): string {
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  return `En ${dias} días`;
}
