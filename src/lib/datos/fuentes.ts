import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { lunesDe, sumarDias } from "../fechas";
import type { ActividadRHA, CategoriaRHA, HabitoRHA, PausaRHA, RegistroRHA } from "../habitos";

/**
 * SIVA solo lee. Cada módulo es dueño de sus datos (RHA de la agenda y los hábitos):
 * acá no hay ni un insert ni un update.
 */
export type DatosHabitos = {
  actividades: ActividadRHA[];
  habitos: HabitoRHA[];
  registros: RegistroRHA[];
  pausas: PausaRHA[];
  categorias: CategoriaRHA[];
};

export interface Fuentes {
  habitos(hoy: string): Promise<DatosHabitos>;
  /** La imagen de fondo elegida en RHA, o null (fondo ambiental). */
  fondo(): Promise<string | null>;
}

/** Por qué no se pudo leer un módulo. "sin_tablas": el módulo todavía no preparó su base. */
export class ErrorDeFuente extends Error {
  constructor(
    mensaje: string,
    readonly motivo: "sin_tablas" | "conexion",
  ) {
    super(mensaje);
  }
}

const SIN_TABLAS = ["42P01", "42703", "PGRST202", "PGRST204", "PGRST205"];

function exigir<T>({ data, error }: { data: T | null; error: PostgrestError | null }): T {
  if (error) throw new ErrorDeFuente(error.message, SIN_TABLAS.includes(error.code) ? "sin_tablas" : "conexion");
  return data as T;
}

const FILAS_POR_PAGINA = 1000;

/** Trae todas las filas de a páginas: la API corta en 1000 por consulta. */
async function todas<T>(consulta: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>): Promise<T[]> {
  const filas: T[] = [];
  for (let pagina = 0; ; pagina++) {
    const lote = exigir(await consulta(pagina * FILAS_POR_PAGINA, (pagina + 1) * FILAS_POR_PAGINA - 1));
    filas.push(...lote);
    if (lote.length < FILAS_POR_PAGINA) return filas;
  }
}

type FilaActividad = {
  id: string;
  titulo: string;
  fecha: string;
  inicio: string | null;
  fin: string | null;
  categoria_id: string | null;
  prioridad: ActividadRHA["prioridad"];
  estado: ActividadRHA["estado"];
};
type FilaHabito = {
  id: string;
  nombre: string;
  tipo: HabitoRHA["tipo"];
  dias: number[];
  meta_semanal: number | null;
  suplemento: boolean;
  estado: HabitoRHA["estado"];
  desde: string;
  orden: number;
};

const COLUMNAS_ACTIVIDAD = "id, titulo, fecha, inicio, fin, categoria_id, prioridad, estado";
/** Las horas llegan como "HH:MM:SS". */
const hhmm = (hora: string | null) => (hora ? hora.slice(0, 5) : null);
const aActividad = (f: FilaActividad): ActividadRHA => ({
  id: f.id,
  titulo: f.titulo,
  fecha: f.fecha,
  inicio: hhmm(f.inicio),
  fin: hhmm(f.fin),
  categoriaId: f.categoria_id,
  prioridad: f.prioridad,
  estado: f.estado,
});

export function fuentesSupabase(db: SupabaseClient): Fuentes {
  return {
    async habitos(hoy) {
      const lunes = lunesDe(hoy);
      // Lo de esta semana y los próximos 7 días, más las pendientes de antes (las vencidas).
      // Los registros, de un año para atrás: alcanza para las rachas.
      const [cercanas, vencidas, habitos, registros, pausas, categorias] = await Promise.all([
        todas<FilaActividad>((a, b) =>
          db.from("rha_actividades").select(COLUMNAS_ACTIVIDAD).gte("fecha", lunes).lte("fecha", sumarDias(hoy, 7)).order("fecha").order("id").range(a, b),
        ),
        todas<FilaActividad>((a, b) =>
          db.from("rha_actividades").select(COLUMNAS_ACTIVIDAD).eq("estado", "pendiente").lt("fecha", lunes).order("fecha").order("id").range(a, b),
        ),
        todas<FilaHabito>((a, b) =>
          db.from("rha_habitos").select("id, nombre, tipo, dias, meta_semanal, suplemento, estado, desde, orden").order("orden").order("id").range(a, b),
        ),
        todas<{ habito_id: string; fecha: string; estado: RegistroRHA["estado"] }>((a, b) =>
          db.from("rha_registros").select("habito_id, fecha, estado").gte("fecha", sumarDias(hoy, -400)).order("fecha").order("habito_id").range(a, b),
        ),
        todas<{ habito_id: string; desde: string; hasta: string | null }>((a, b) =>
          db.from("rha_pausas").select("habito_id, desde, hasta").order("id").range(a, b),
        ),
        todas<CategoriaRHA>((a, b) => db.from("rha_categorias").select("id, nombre, color").order("orden").order("id").range(a, b)),
      ]);
      return {
        actividades: [...vencidas, ...cercanas].map(aActividad),
        habitos: habitos.map((h) => ({
          id: h.id,
          nombre: h.nombre,
          tipo: h.tipo,
          dias: h.dias,
          metaSemanal: h.meta_semanal,
          suplemento: h.suplemento,
          estado: h.estado,
          desde: h.desde,
          orden: h.orden,
        })),
        registros: registros.map((r) => ({ habitoId: r.habito_id, fecha: r.fecha, estado: r.estado })),
        pausas: pausas.map((p) => ({ habitoId: p.habito_id, desde: p.desde, hasta: p.hasta })),
        categorias,
      };
    },

    async fondo() {
      // Con "*": si RHA todavía no tiene la columna, no hay fondo y listo.
      const { data } = await db.from("rha_ajustes").select("*").limit(1).maybeSingle();
      return (data?.fondo as string | null | undefined) ?? null;
    },
  };
}
