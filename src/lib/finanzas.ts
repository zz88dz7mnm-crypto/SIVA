/**
 * Las cuentas de finanzas, con las mismas definiciones que FIA (ver docs/CONTRATO.md del repo de FIA).
 * SIVA no las reinterpreta: el número tiene que coincidir con el panel de FIA.
 * Todo en centavos (enteros), para no arrastrar errores de coma flotante.
 */
import { sumarDias } from "./fechas";

export type TipoMovimiento = "gasto" | "ingreso" | "transferencia_enviada" | "transferencia_recibida";

/** Un movimiento de FIA ya filtrado: confirmado y no interno. */
export type Movimiento = { tipo: TipoMovimiento; centavos: number; fecha: string; categoriaId: string | null };

export type Categoria = { id: string; nombre: string };
export type Frasco = { id: string; nombre: string; asignado: number; gastado: number };

export const ES_ENTRADA: Record<TipoMovimiento, boolean> = {
  gasto: false,
  ingreso: true,
  transferencia_enviada: false,
  transferencia_recibida: true,
};

/** "1234.5" o 1234.5 → 123450. */
export function aCentavos(importe: number | string): number {
  return Math.round(Number(importe) * 100);
}

export function totales(movimientos: Movimiento[]) {
  let entro = 0;
  let salio = 0;
  for (const m of movimientos) {
    if (ES_ENTRADA[m.tipo]) entro += m.centavos;
    else salio += m.centavos;
  }
  return { entro, salio, queda: entro - salio };
}

export type GrupoDeGasto = { id: string | null; nombre: string; centavos: number; parte: number };

/** Lo que salió por categoría, de mayor a menor. Sin categoría (o con una que ya no existe) va a "Sin clasificar". */
export function gastoPorCategoria(movimientos: Movimiento[], categorias: Categoria[]): GrupoDeGasto[] {
  const nombres = new Map(categorias.map((c) => [c.id, c.nombre]));
  const sumas = new Map<string | null, number>();
  for (const m of movimientos) {
    if (ES_ENTRADA[m.tipo]) continue;
    const id = m.categoriaId && nombres.has(m.categoriaId) ? m.categoriaId : null;
    sumas.set(id, (sumas.get(id) ?? 0) + m.centavos);
  }
  const total = [...sumas.values()].reduce((a, b) => a + b, 0);
  return [...sumas]
    .map(([id, centavos]) => ({ id, nombre: id ? nombres.get(id)! : "Sin clasificar", centavos, parte: total ? centavos / total : 0 }))
    .sort((a, b) => b.centavos - a.centavos);
}

/** Las `n` categorías más grandes; el resto, sumado en "Otras". */
export function principales(grupos: GrupoDeGasto[], n: number): GrupoDeGasto[] {
  if (grupos.length <= n) return grupos;
  const resto = grupos.slice(n - 1);
  const centavos = resto.reduce((a, g) => a + g.centavos, 0);
  return [...grupos.slice(0, n - 1), { id: "__otras", nombre: `Otras (${resto.length})`, centavos, parte: resto.reduce((a, g) => a + g.parte, 0) }];
}

/** Lo que salió cada día, desde `desde` hasta `hasta` inclusive. Los días sin movimientos valen cero. */
export function salidasPorDia(movimientos: Movimiento[], desde: string, hasta: string): { fecha: string; centavos: number }[] {
  const dias = new Map<string, number>();
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) dias.set(d, 0);
  for (const m of movimientos) {
    if (!ES_ENTRADA[m.tipo] && dias.has(m.fecha)) dias.set(m.fecha, dias.get(m.fecha)! + m.centavos);
  }
  return [...dias].map(([fecha, centavos]) => ({ fecha, centavos }));
}

/** Lo que queda en cada frasco: lo asignado menos lo gastado. */
export function quedaEnFrascos(frascos: Frasco[]) {
  const lista = frascos.map((f) => ({ ...f, queda: f.asignado - f.gastado }));
  return { lista, total: lista.reduce((a, f) => a + f.queda, 0) };
}

/** Primer y último día del mes de `hoy`. */
export function rangoDelMes(hoy: string): { desde: string; hasta: string } {
  const [a, m] = hoy.split("-").map(Number);
  const hasta = new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
  return { desde: `${hoy.slice(0, 7)}-01`, hasta };
}

/** "$ 245.300" o "$ 1.234,50" (los centavos solo si hay). */
export function formatoPesos(centavos: number): string {
  const negativo = centavos < 0;
  const abs = Math.abs(centavos);
  const texto = (abs / 100).toLocaleString("es-AR", { minimumFractionDigits: abs % 100 ? 2 : 0, maximumFractionDigits: 2 });
  return `${negativo ? "−" : ""}$ ${texto}`;
}

/** "$ 245 mil", "$ 1,2 M": para ejes de gráficos. */
export function formatoPesosCorto(centavos: number): string {
  const pesos = centavos / 100;
  if (Math.abs(pesos) >= 1_000_000) return `$ ${(pesos / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M`;
  if (Math.abs(pesos) >= 1_000) return `$ ${Math.round(pesos / 1_000).toLocaleString("es-AR")} mil`;
  return `$ ${Math.round(pesos).toLocaleString("es-AR")}`;
}
