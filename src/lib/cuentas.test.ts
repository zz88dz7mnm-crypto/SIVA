import { describe, expect, it } from "vitest";
import { resumenDeRHA, textoDuracion, type ActividadRHA, type HabitoRHA, type RegistroRHA } from "./habitos";

describe("hábitos y agenda, con las definiciones de RHA", () => {
  const habito = (cambios: Partial<HabitoRHA> = {}): HabitoRHA => ({
    id: "h",
    nombre: "Estudiar",
    tipo: "dias",
    dias: [1, 3, 5],
    metaSemanal: null,
    suplemento: false,
    estado: "activo",
    desde: "2026-09-01",
    orden: 0,
    ...cambios,
  });
  const reg = (fecha: string, estado: RegistroRHA["estado"] = "completado", habitoId = "h"): RegistroRHA => ({ habitoId, fecha, estado });
  const act = (fecha: string, cambios: Partial<ActividadRHA> = {}): ActividadRHA => ({
    id: `${fecha}-${Math.random()}`,
    titulo: "x",
    fecha,
    inicio: null,
    fin: null,
    categoriaId: null,
    prioridad: "media",
    estado: "pendiente",
    ...cambios,
  });
  // 2026-10-14 es miércoles.
  const hoy = "2026-10-14";

  it("cuenta la adherencia de la semana con su denominador, sin hoy si no está marcado", () => {
    const r = resumenDeRHA({ actividades: [], habitos: [habito()], registros: [reg("2026-10-12", "parcial")], pausas: [] }, hoy);
    expect(r.semana).toEqual({ completados: 0, parciales: 1, programados: 1 });
    const r2 = resumenDeRHA({ actividades: [], habitos: [habito()], registros: [reg("2026-10-12"), reg(hoy)], pausas: [] }, hoy);
    expect(r2.semana).toEqual({ completados: 2, parciales: 0, programados: 2 });
  });

  it("no cuenta los días en pausa ni los hábitos archivados", () => {
    const r = resumenDeRHA(
      {
        actividades: [],
        habitos: [habito(), habito({ id: "z", estado: "archivado" })],
        registros: [],
        pausas: [{ habitoId: "h", desde: "2026-10-10", hasta: null }],
      },
      hoy,
    );
    expect(r.semana.programados).toBe(0);
    expect(r.deHoy).toEqual([]);
  });

  it("muestra los hábitos de hoy y el avance de los semanales", () => {
    const semanal = habito({ id: "s", nombre: "Leer", tipo: "semanal", dias: [], metaSemanal: 2 });
    const r = resumenDeRHA({ actividades: [], habitos: [habito(), semanal], registros: [reg(hoy), reg("2026-10-12", "completado", "s")], pausas: [] }, hoy);
    expect(r.deHoy.map((d) => [d.habito.id, d.estado, d.semanal])).toEqual([
      ["h", "completado", null],
      ["s", null, { hechas: 1, meta: 2 }],
    ]);
    expect(r.hechosHoy).toBe(1);
    expect(r.semanales).toEqual({ cumplidos: 0, total: 1 });
  });

  it("separa agenda de hoy, vencidas y próximas, y suma el tiempo planificado", () => {
    const r = resumenDeRHA(
      {
        actividades: [
          act("2026-10-10"),
          act("2026-10-11", { estado: "completada" }),
          act(hoy, { titulo: "b", inicio: "15:00", fin: "17:00" }),
          act(hoy, { titulo: "a", inicio: "09:00", fin: "10:15" }),
          act(hoy, { titulo: "sin hora" }),
          act(hoy, { titulo: "cancelada", inicio: "11:00", fin: "12:00", estado: "cancelada" }),
          act("2026-10-16", { inicio: "10:00", fin: "11:00" }),
          act("2026-10-30"),
        ],
        habitos: [],
        registros: [],
        pausas: [],
      },
      hoy,
    );
    expect(r.agendaHoy.map((a) => a.titulo)).toEqual(["a", "b", "sin hora"]);
    expect(r.vencidas).toHaveLength(1);
    expect(r.proximas).toHaveLength(1);
    expect(r.porDia[2].minutos).toBe(195);
    expect(r.minutosSemana).toBe(255);
  });

  it("calcula rachas saltando hoy si todavía no se marcó", () => {
    const r = resumenDeRHA({ actividades: [], habitos: [habito()], registros: [reg("2026-10-09"), reg("2026-10-12")], pausas: [] }, hoy);
    expect(r.rachas).toEqual([{ nombre: "Estudiar", valor: 2, unidad: "días" }]);
    expect(textoDuracion(195)).toBe("3 h 15 min");
  });
});
