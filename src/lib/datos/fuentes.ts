import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { SerieGym, SesionGym } from "../entrenamiento";
import { aCentavos, ES_ENTRADA, rangoDelMes, type Categoria, type Frasco, type Movimiento, type TipoMovimiento } from "../finanzas";

/**
 * SIVA solo lee. Cada módulo es dueño de sus datos (FIA de la plata, GYM de los entrenamientos):
 * acá no hay ni un insert ni un update.
 */
export type DatosFinanzas = { movimientos: Movimiento[]; categorias: Categoria[]; frascos: Frasco[]; desde: string; hasta: string };
export type DatosEntrenamiento = { inicioPlan: string | null; sesiones: SesionGym[]; series: SerieGym[] };

export interface Fuentes {
  finanzas(hoy: string): Promise<DatosFinanzas>;
  entrenamiento(): Promise<DatosEntrenamiento>;
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

type FilaMovimiento = { tipo: TipoMovimiento; importe: number | string; fecha: string; categoria_id: string | null };

export function fuentesSupabase(db: SupabaseClient): Fuentes {
  return {
    async finanzas(hoy) {
      const { desde, hasta } = rangoDelMes(hoy);
      // Mismo filtro que el panel de FIA: confirmados, sin movimientos entre cuentas propias.
      const [filas, categorias, frascos, aportes, conFrasco] = await Promise.all([
        todas<FilaMovimiento>((a, b) =>
          db
            .from("transacciones")
            .select("tipo, importe, fecha, categoria_id")
            .eq("estado", "confirmada")
            .eq("es_interna", false)
            .gte("fecha", desde)
            .lte("fecha", hasta)
            .order("fecha")
            .order("id")
            .range(a, b),
        ),
        todas<Categoria>((a, b) => db.from("categorias").select("id, nombre").order("id").range(a, b)),
        todas<{ id: string; nombre: string }>((a, b) => db.from("frascos").select("id, nombre").order("creado_en").range(a, b)),
        todas<{ frasco_id: string; importe: number | string }>((a, b) => db.from("aportes_frasco").select("frasco_id, importe").order("id").range(a, b)),
        todas<{ frasco_id: string; importe: number | string; tipo: TipoMovimiento }>((a, b) =>
          db.from("transacciones").select("frasco_id, importe, tipo").eq("estado", "confirmada").not("frasco_id", "is", null).order("id").range(a, b),
        ),
      ]);
      const sumar = (lista: { frasco_id: string; importe: number | string }[], id: string) =>
        lista.filter((f) => f.frasco_id === id).reduce((total, f) => total + aCentavos(f.importe), 0);
      const salidas = conFrasco.filter((f) => !ES_ENTRADA[f.tipo]);
      return {
        desde,
        hasta,
        movimientos: filas.map((f) => ({ tipo: f.tipo, centavos: aCentavos(f.importe), fecha: f.fecha, categoriaId: f.categoria_id })),
        categorias,
        frascos: frascos.map((f) => ({ id: f.id, nombre: f.nombre, asignado: sumar(aportes, f.id), gastado: sumar(salidas, f.id) })),
      };
    },

    async entrenamiento() {
      const [ajustes, sesiones, series] = await Promise.all([
        db.from("gym_ajustes").select("inicio_plan").maybeSingle(),
        todas<SesionGym>((a, b) =>
          db.from("gym_sesiones").select("id, dia, fecha, inicio, fin, estado").order("fecha", { ascending: false }).order("id").range(a, b),
        ),
        todas<{ sesion_id: string; ejercicio: string; ejercicio_nombre: string; kg: number | string | null; reps: number | null; hecha: boolean }>((a, b) =>
          db.from("gym_series").select("sesion_id, ejercicio, ejercicio_nombre, kg, reps, hecha").order("id").range(a, b),
        ),
      ]);
      const filaAjustes = exigir(ajustes);
      return {
        inicioPlan: filaAjustes?.inicio_plan ?? null,
        sesiones,
        series: series.map((s) => ({
          sesionId: s.sesion_id,
          ejercicio: s.ejercicio,
          ejercicioNombre: s.ejercicio_nombre,
          kg: s.kg === null ? null : Number(s.kg),
          reps: s.reps,
          hecha: s.hecha,
        })),
      };
    },
  };
}
