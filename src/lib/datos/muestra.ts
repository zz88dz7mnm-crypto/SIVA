import { lunesDe, sumarDias } from "../fechas";
import { rangoDelMes, type Movimiento } from "../finanzas";
import type { SerieGym, SesionGym } from "../entrenamiento";
import type { ActividadRHA, HabitoRHA, RegistroRHA } from "../habitos";
import type { Fuentes } from "./fuentes";

/** Datos inventados para la demo (solo en desarrollo). `fallar` simula un módulo caído. */
export function fuentesDeMuestra(fallar: { finanzas?: boolean; entrenamiento?: boolean; habitos?: boolean } = {}): Fuentes {
  return {
    async finanzas(hoy) {
      await new Promise((r) => setTimeout(r, 300));
      if (fallar.finanzas) throw new Error("demo: FIA caída");
      const { desde, hasta } = rangoDelMes(hoy);
      const categorias = [
        { id: "c1", nombre: "Comida" },
        { id: "c2", nombre: "Alquiler" },
        { id: "c3", nombre: "Transporte" },
        { id: "c4", nombre: "Salidas" },
        { id: "c5", nombre: "Facultad" },
        { id: "c6", nombre: "Servicios" },
        { id: "c7", nombre: "Suscripciones" },
      ];
      const movimientos: Movimiento[] = [{ tipo: "ingreso", centavos: 30000000, fecha: desde, categoriaId: null }];
      const gasto = (dia: number, pesos: number, categoriaId: string) => {
        const fecha = sumarDias(desde, dia);
        if (fecha <= hoy) movimientos.push({ tipo: "gasto", centavos: pesos * 100, fecha, categoriaId });
      };
      gasto(0, 120000, "c2");
      for (let d = 0; d < 31; d++) {
        if (d % 2 === 0) gasto(d, 4500 + (d % 5) * 900, "c1");
        if (d % 3 === 1) gasto(d, 1600, "c3");
        if (d % 7 === 5) gasto(d, 14000, "c4");
      }
      gasto(3, 9800, "c5");
      gasto(6, 21000, "c6");
      gasto(9, 5300, "c7");
      return {
        desde,
        hasta,
        movimientos,
        categorias,
        frascos: [
          { id: "f1", nombre: "Facu", asignado: 2000000, gastado: 980000 },
          { id: "f2", nombre: "Salidas", asignado: 4000000, gastado: 2800000 },
          { id: "f3", nombre: "Viaje", asignado: 15000000, gastado: 0 },
        ],
      };
    },

    async entrenamiento() {
      await new Promise((r) => setTimeout(r, 450));
      if (fallar.entrenamiento) throw new Error("demo: GYM caído");
      const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
      const inicio = sumarDias(lunesDe(hoy), -28);
      const sesiones: SesionGym[] = [];
      const series: SerieGym[] = [];
      let n = 0;
      for (let semana = 0; semana < 5; semana++) {
        for (const [k, offset] of [0, 2, 4].entries()) {
          const fecha = sumarDias(inicio, semana * 7 + offset);
          if (fecha > hoy) continue;
          const id = `s${++n}`;
          sesiones.push({ id, dia: "ABC"[k], fecha, inicio: `${fecha}T21:00:00Z`, fin: `${fecha}T22:05:00Z`, estado: "completada" });
          for (const [ejercicio, base] of [
            ["Press de banca plano", 50],
            ["Jalón al pecho", 25],
            ["Elevaciones laterales", 8],
          ] as const) {
            for (let i = 0; i < 3; i++) {
              series.push({
                sesionId: id,
                ejercicio,
                ejercicioNombre: ejercicio,
                kg: base + Math.floor(semana / 2) * (base >= 20 ? 2.5 : 1),
                reps: 8 + (semana % 2) * 2,
                hecha: true,
              });
            }
          }
        }
      }
      return { inicioPlan: inicio, sesiones, series };
    },

    async habitos(hoy) {
      await new Promise((r) => setTimeout(r, 380));
      if (fallar.habitos) throw new Error("demo: RHA caída");
      const lunes = lunesDe(hoy);
      const desde = sumarDias(lunes, -35);
      const categorias = [
        { id: "k1", nombre: "Facultad", color: "#5e5ce6" },
        { id: "k2", nombre: "Gimnasio", color: "#ff6b00" },
        { id: "k3", nombre: "Personal", color: "#30b0c7" },
        { id: "k4", nombre: "Salud", color: "#ff2d55" },
      ];
      let n = 0;
      const act = (
        dias: number,
        titulo: string,
        inicio: string | null,
        fin: string | null,
        categoriaId: string,
        estado: ActividadRHA["estado"] = "pendiente",
      ): ActividadRHA => ({
        id: `a${++n}`,
        titulo,
        fecha: sumarDias(hoy, dias),
        inicio,
        fin,
        categoriaId,
        prioridad: "media",
        estado,
      });
      const actividades: ActividadRHA[] = [
        act(-3, "Entregar TP de Física", null, null, "k1"),
        act(-1, "Gimnasio · Día C", "09:00", "10:15", "k2", "completada"),
        act(0, "Gimnasio · Día A", "09:00", "10:15", "k2", "completada"),
        act(0, "Estudiar matrices", "15:00", "17:00", "k1"),
        act(0, "Clase de Álgebra", "18:00", "20:00", "k1"),
        act(0, "Comprar creatina", null, null, "k4"),
        act(1, "Producir beat nuevo", "21:00", "23:00", "k3"),
        act(2, "Gimnasio · Día B", "09:00", "10:15", "k2"),
        act(3, "Parcial de Álgebra", "14:00", "16:00", "k1"),
      ];
      const habito = (id: string, nombre: string, tipo: HabitoRHA["tipo"], dias: number[], metaSemanal: number | null, suplemento = false): HabitoRHA => ({
        id,
        nombre,
        tipo,
        dias,
        metaSemanal,
        suplemento,
        estado: "activo",
        desde,
        orden: Number(id.slice(1)),
      });
      const habitos = [
        habito("h1", "Estudiar", "dias", [1, 2, 3, 4, 5], null),
        habito("h2", "Creatina", "dias", [1, 2, 3, 4, 5, 6, 7], null, true),
        habito("h3", "Acostarme antes de las 00:30", "dias", [1, 2, 3, 4, 5, 6, 7], null),
        habito("h4", "Leer", "semanal", [], 3),
      ];
      const registros: RegistroRHA[] = [];
      for (let d = desde; d < hoy; d = sumarDias(d, 1)) {
        const k = Number(d.slice(8));
        registros.push({ habitoId: "h2", fecha: d, estado: k % 9 === 0 ? "no_completado" : "completado" });
        registros.push({ habitoId: "h3", fecha: d, estado: k % 4 === 0 ? "parcial" : "completado" });
        if (k % 7 !== 0) registros.push({ habitoId: "h1", fecha: d, estado: k % 5 === 0 ? "parcial" : "completado" });
        if (k % 3 === 0) registros.push({ habitoId: "h4", fecha: d, estado: "completado" });
      }
      registros.push({ habitoId: "h2", fecha: hoy, estado: "completado" });
      return { actividades, habitos, registros, pausas: [], categorias };
    },
  };
}
