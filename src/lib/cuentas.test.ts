import { describe, expect, it } from "vitest";
import { resumenDeCIA, type ExamenCIA } from "./estudios";
import { resumenDeRHA, textoDuracion, type ActividadRHA, type HabitoRHA, type RegistroRHA } from "./habitos";
import { formatoVolumen, nombreDeDia, resumenDeSemana, semanaDelPlan, type SerieGym, type SesionGym } from "./entrenamiento";
import {
  aCentavos,
  formatoPesos,
  formatoPesosCorto,
  gastoPorCategoria,
  principales,
  quedaEnFrascos,
  rangoDelMes,
  salidasPorDia,
  totales,
  type Movimiento,
} from "./finanzas";

const mov = (tipo: Movimiento["tipo"], pesos: number, fecha = "2026-10-05", categoriaId: string | null = null): Movimiento => ({
  tipo,
  centavos: aCentavos(pesos),
  fecha,
  categoriaId,
});

describe("finanzas, con las definiciones de FIA", () => {
  const movimientos = [
    mov("ingreso", 300000, "2026-10-01"),
    mov("gasto", 4500, "2026-10-02", "comida"),
    mov("gasto", 150000, "2026-10-03", "alquiler"),
    mov("transferencia_enviada", 45500, "2026-10-03", null),
    mov("transferencia_recibida", 10000, "2026-10-04"),
    mov("gasto", 0.5, "2026-10-04", "borrada"),
  ];
  const categorias = [
    { id: "comida", nombre: "Comida" },
    { id: "alquiler", nombre: "Alquiler" },
  ];

  it("salió, entró y te queda", () => {
    expect(totales(movimientos)).toEqual({ entro: 31000000, salio: 20000050, queda: 10999950 });
  });

  it("agrupa por categoría y manda lo desconocido a Sin clasificar", () => {
    const grupos = gastoPorCategoria(movimientos, categorias);
    expect(grupos.map((g) => [g.nombre, g.centavos])).toEqual([
      ["Alquiler", 15000000],
      ["Sin clasificar", 4550050],
      ["Comida", 450000],
    ]);
    expect(grupos.reduce((a, g) => a + g.parte, 0)).toBeCloseTo(1);
  });

  it("junta el resto en Otras", () => {
    const grupos = gastoPorCategoria(movimientos, categorias);
    const top = principales(grupos, 2);
    expect(top.map((g) => g.nombre)).toEqual(["Alquiler", "Otras (2)"]);
    expect(top[1].centavos).toBe(5000050);
    expect(principales(grupos, 5)).toHaveLength(3);
  });

  it("suma salidas por día y deja en cero los días vacíos", () => {
    expect(salidasPorDia(movimientos, "2026-10-01", "2026-10-04").map((d) => d.centavos)).toEqual([0, 450000, 19550000, 50]);
  });

  it("calcula lo que queda en los frascos", () => {
    expect(
      quedaEnFrascos([
        { id: "a", nombre: "Facu", asignado: 2000000, gastado: 300000 },
        { id: "b", nombre: "Salidas", asignado: 500000, gastado: 600000 },
      ]),
    ).toMatchObject({ total: 1600000, lista: [{ queda: 1700000 }, { queda: -100000 }] });
  });

  it("arma el rango del mes", () => {
    expect(rangoDelMes("2026-10-13")).toEqual({ desde: "2026-10-01", hasta: "2026-10-31" });
    expect(rangoDelMes("2028-02-10")).toEqual({ desde: "2028-02-01", hasta: "2028-02-29" });
  });

  it("escribe pesos", () => {
    expect(formatoPesos(24530000)).toBe("$ 245.300");
    expect(formatoPesos(123450)).toBe("$ 1.234,50");
    expect(formatoPesos(-500000)).toBe("−$ 5.000");
    expect(formatoPesosCorto(24530000)).toBe("$ 245 mil");
    expect(formatoPesosCorto(125000000)).toBe("$ 1,3 M");
  });
});

describe("entrenamiento, con las definiciones de GYM", () => {
  const sesion = (id: string, fecha: string, estado: SesionGym["estado"] = "completada"): SesionGym => ({
    id,
    dia: "A",
    fecha,
    inicio: `${fecha}T21:00:00Z`,
    fin: `${fecha}T22:00:00Z`,
    estado,
  });
  const serie = (sesionId: string, ejercicio: string, kg: number | null, reps: number | null, hecha = true): SerieGym => ({
    sesionId,
    ejercicio,
    ejercicioNombre: ejercicio,
    kg,
    reps,
    hecha,
  });

  const sesiones = [
    sesion("v1", "2026-10-02"),
    sesion("l", "2026-10-05"),
    sesion("lun", "2026-10-12"),
    sesion("mie", "2026-10-14"),
    sesion("x", "2026-10-15", "cancelada"),
  ];
  const series = [
    serie("v1", "banca", 55, 10),
    serie("l", "banca", 60, 10),
    serie("l", "remo", 50, 10),
    serie("lun", "banca", 62.5, 8),
    serie("lun", "banca", 62.5, 7, false),
    serie("mie", "remo", 50, 12),
    serie("mie", "nuevo", 20, 10),
    serie("x", "banca", 100, 10),
  ];

  it("resume la semana de lunes a domingo", () => {
    const r = resumenDeSemana(sesiones, series, "2026-10-15");
    expect(r.lunes).toBe("2026-10-12");
    expect(r.sesiones.map((s) => s.id)).toEqual(["lun", "mie"]);
    expect(r.volumen).toBe(500 + 600 + 200);
    expect(r.series).toBe(3);
    expect(r.porDia.map((d) => d.volumen)).toEqual([500, 0, 800, 0, 0, 0, 0]);
    expect(r.volumenAnterior).toBe(1100);
    expect(r.ultima?.id).toBe("mie");
  });

  it("marca récords contra todo lo anterior, no la primera vez", () => {
    const r = resumenDeSemana(sesiones, series, "2026-10-15");
    expect(r.marcas).toEqual([{ ejercicio: "banca", nombre: "banca", kg: 62.5, anterior: 60 }]);
  });

  it("sin sesiones, todo en cero", () => {
    const r = resumenDeSemana([], [], "2026-10-15");
    expect(r.volumen).toBe(0);
    expect(r.ultima).toBeNull();
    expect(r.porDia).toHaveLength(7);
  });

  it("semana del plan y textos", () => {
    expect(semanaDelPlan("2026-09-14", "2026-10-13")).toBe(5);
    expect(nombreDeDia("B")).toBe("Día B");
    expect(nombreDeDia("libre")).toBe("Libre");
    expect(formatoVolumen(12450)).toBe("12,5 t");
  });
});

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

describe("estudios, con las definiciones de CIA", () => {
  const ex = (id: string, fecha: string, cambios: Partial<ExamenCIA> = {}): ExamenCIA => ({
    id,
    materiaId: "m",
    nombre: id,
    tipo: "parcial",
    fecha,
    fechaProvisoria: false,
    estado: "pendiente",
    avisos: [7, 3, 1],
    ...cambios,
  });
  const hoy = "2026-10-13";

  it("separa próximos, sin marcar, avisos y choques", () => {
    const r = resumenDeCIA(
      {
        examenes: [
          ex("pasado", "2026-10-08"),
          ex("p4", "2026-10-16"),
          ex("lejos", "2026-11-06"),
          ex("recu", "2026-11-06", { tipo: "recuperatorio" }),
          ex("cuest", "2026-11-06", { tipo: "cuestionario" }),
          ex("hoy", hoy),
        ],
        temas: [
          { examenId: "p4", estado: "terminado" },
          { examenId: "p4", estado: "en_curso" },
          { examenId: "p4", estado: "pendiente" },
        ],
      },
      hoy,
    );
    expect(r.proximos.map((e) => e.id)).toEqual(["hoy", "p4", "cuest", "lejos", "recu"]);
    expect(r.semana).toBe(2);
    expect(r.sinMarcar.map((e) => e.id)).toEqual(["pasado"]);
    expect(r.avisos.map((e) => [e.id, e.dias])).toEqual([
      ["hoy", 0],
      ["p4", 3],
    ]);
    expect(r.choques.map(([a, b]) => [a.id, b.id])).toEqual([["lejos", "recu"]]);
    expect(r.temas).toEqual({ terminados: 1, enCurso: 1, total: 3 });
    expect(r.proximos.find((e) => e.id === "p4")).toMatchObject({ terminados: 1, enCurso: 1, total: 3 });
  });
});
