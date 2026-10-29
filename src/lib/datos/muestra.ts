import { lunesDe, sumarDias } from "../fechas";
import type { ActividadRHA, HabitoRHA, RegistroRHA } from "../habitos";
import type { Fuentes } from "./fuentes";

/** Datos inventados para la demo (solo en desarrollo). `fallar` simula un módulo caído. */
export function fuentesDeMuestra(fallar: { habitos?: boolean } = {}): Fuentes {
  return {
    fondo: async () => null,
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
