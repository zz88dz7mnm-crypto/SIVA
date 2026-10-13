"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cx } from "./ui";

export type Punto = { etiqueta: string; valor: number; detalle?: string };

/** Ancho real del contenedor, para dibujar el SVG en píxeles y no deformar trazos ni textos. */
function useAncho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setAncho(Math.round(e.contentRect.width)));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, ancho] as const;
}

/** Tres marcas "redondas" que cubren el rango. */
function escala(min: number, max: number): number[] {
  if (min === max) {
    const d = Math.max(1, Math.abs(min) * 0.1);
    min -= d;
    max += d;
  }
  const crudo = (max - min) / 3;
  const potencia = 10 ** Math.floor(Math.log10(crudo));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= crudo) ?? crudo;
  const desde = Math.floor(min / paso) * paso;
  const marcas: number[] = [];
  for (let v = desde; v <= max + paso * 0.999; v += paso) marcas.push(Math.round(v * 100) / 100);
  return marcas;
}

/** Margen izquierdo según la etiqueta más larga del eje (unos 6,5 px por carácter a 11 px). */
const margen = (textos: string[]) => Math.max(28, Math.ceil(Math.max(...textos.map((t) => t.length)) * 6.5) + 12);
const DER = 12;
const ARRIBA = 12;
const ABAJO = 26;

function Tooltip({ x, ancho, titulo, valor, detalle }: { x: number; ancho: number; titulo: string; valor: string; detalle?: string }) {
  const izquierda = Math.min(Math.max(x - 80, 0), Math.max(0, ancho - 160));
  return (
    <div className="cristal pointer-events-none absolute top-0 z-10 w-40 rounded-2xl px-3 py-2 text-[13px]" style={{ left: izquierda }}>
      <p className="text-tinta-suave">{titulo}</p>
      <p className="cifras text-[16px] font-bold">{valor}</p>
      {detalle && <p className="cifras text-tinta-suave">{detalle}</p>}
    </div>
  );
}

/** Una serie en el tiempo: línea de 2 px, puntos con aro, cursor con detalle al pasar o tocar. */
export function GraficoLinea({
  puntos,
  formato,
  nombre,
  alto = 200,
  color = "var(--color-grafico)",
}: {
  puntos: Punto[];
  formato: (n: number) => string;
  nombre: string;
  alto?: number;
  color?: string;
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const [activo, setActivo] = useState<number | null>(null);
  const idDegradado = useId();

  const valores = puntos.map((p) => p.valor);
  const marcas = escala(Math.min(...valores), Math.max(...valores));
  const yMin = marcas[0];
  const yMax = marcas.at(-1)!;
  const IZQ = margen(marcas.map((m) => m.toLocaleString("es-AR")));
  const anchoUtil = Math.max(1, ancho - IZQ - DER);
  const altoUtil = alto - ARRIBA - ABAJO;
  const x = (i: number) => IZQ + (puntos.length === 1 ? anchoUtil / 2 : (i / (puntos.length - 1)) * anchoUtil);
  const y = (v: number) => ARRIBA + altoUtil - ((v - yMin) / (yMax - yMin || 1)) * altoUtil;
  const linea = puntos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
  const area = puntos.length > 1 ? `${linea} L${x(puntos.length - 1).toFixed(1)},${ARRIBA + altoUtil} L${x(0).toFixed(1)},${ARRIBA + altoUtil} Z` : "";
  // En gráficos angostos, solo la primera y la última fecha: tres no entran sin pisarse.
  const etiquetasX =
    puntos.length <= 2 ? puntos.map((_, i) => i) : anchoUtil < 260 ? [0, puntos.length - 1] : [0, Math.floor((puntos.length - 1) / 2), puntos.length - 1];

  function mover(e: React.PointerEvent<SVGSVGElement>) {
    const caja = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - caja.left;
    let mejor = 0;
    for (let i = 1; i < puntos.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(mejor) - px)) mejor = i;
    setActivo(mejor);
  }

  const p = activo !== null ? puntos[activo] : null;

  return (
    <div ref={ref} className="relative" style={{ height: alto }}>
      {ancho > 0 && (
        <svg
          width={ancho}
          height={alto}
          role="img"
          aria-label={`${nombre}: ${puntos.length} registros, de ${formato(puntos[0].valor)} a ${formato(puntos.at(-1)!.valor)}`}
          onPointerMove={mover}
          onPointerDown={mover}
          onPointerLeave={() => setActivo(null)}
          className="touch-pan-y select-none"
        >
          <defs>
            <linearGradient id={idDegradado} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {marcas.map((m) => (
            <g key={m}>
              <line x1={IZQ} x2={ancho - DER} y1={y(m)} y2={y(m)} stroke="var(--color-grilla)" />
              <text x={IZQ - 8} y={y(m)} dy="0.32em" textAnchor="end" className="cifras fill-tinta-tenue text-[11px]">
                {m.toLocaleString("es-AR")}
              </text>
            </g>
          ))}
          {etiquetasX.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={alto - 6}
              textAnchor={puntos.length > 1 && i === 0 ? "start" : puntos.length > 1 && i === puntos.length - 1 ? "end" : "middle"}
              className="fill-tinta-tenue text-[11px]"
            >
              {puntos[i].etiqueta}
            </text>
          ))}
          {area && <path d={area} fill={`url(#${idDegradado})`} />}
          <path d={linea} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {activo !== null && <line x1={x(activo)} x2={x(activo)} y1={ARRIBA} y2={ARRIBA + altoUtil} stroke="var(--color-tinta-tenue)" strokeDasharray="3 3" />}
          {puntos.map((pt, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(pt.valor)}
              r={activo === i ? 6 : puntos.length > 24 ? 0 : 4}
              fill={color}
              stroke="var(--color-fondo)"
              strokeWidth={2}
            />
          ))}
        </svg>
      )}
      {p && activo !== null && <Tooltip x={x(activo)} ancho={ancho} titulo={p.etiqueta} valor={formato(p.valor)} detalle={p.detalle} />}
    </div>
  );
}

/** Barras por período, con una línea de objetivo opcional. */
export function GraficoBarras({
  barras,
  formato,
  nombre,
  objetivo,
  alto = 180,
  color = "var(--color-grafico)",
  etiquetas,
  formatoEje = (n: number) => n.toLocaleString("es-AR"),
}: {
  barras: Punto[];
  formato: (n: number) => string;
  nombre: string;
  objetivo?: number;
  alto?: number;
  color?: string;
  /** Qué barras llevan etiqueta abajo. Por defecto, todas si son pocas; si no, la primera, la del medio y la última. */
  etiquetas?: number[];
  /** Cómo escribir los valores del eje (más cortos que los del detalle). */
  formatoEje?: (n: number) => string;
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const [activo, setActivo] = useState<number | null>(null);
  const maximo = Math.max(objetivo ?? 0, ...barras.map((b) => b.valor), 1);
  const marcas = escala(0, maximo).filter((m) => m >= 0);
  const yMax = marcas.at(-1)!;
  const IZQ = margen(marcas.map(formatoEje));
  const anchoUtil = Math.max(1, ancho - IZQ - DER);
  const altoUtil = alto - ARRIBA - ABAJO;
  const ranura = anchoUtil / barras.length;
  const anchoBarra = Math.max(4, Math.min(28, ranura - 4));
  const y = (v: number) => ARRIBA + altoUtil - (v / yMax) * altoUtil;
  const cx0 = (i: number) => IZQ + ranura * i + ranura / 2;
  const b = activo !== null ? barras[activo] : null;

  return (
    <div ref={ref} className="relative" style={{ height: alto }}>
      {ancho > 0 && (
        <svg width={ancho} height={alto} role="img" aria-label={nombre} onPointerLeave={() => setActivo(null)} className="touch-pan-y select-none">
          {marcas.map((m) => (
            <g key={m}>
              <line x1={IZQ} x2={ancho - DER} y1={y(m)} y2={y(m)} stroke="var(--color-grilla)" />
              <text x={IZQ - 8} y={y(m)} dy="0.32em" textAnchor="end" className="cifras fill-tinta-tenue text-[11px]">
                {formatoEje(m)}
              </text>
            </g>
          ))}
          {objetivo !== undefined && (
            <g>
              <line x1={IZQ} x2={ancho - DER} y1={y(objetivo)} y2={y(objetivo)} stroke="var(--color-tinta-suave)" strokeDasharray="4 4" />
              <text x={ancho - DER} y={y(objetivo) - 5} textAnchor="end" className="fill-tinta-suave text-[11px]">
                Objetivo
              </text>
            </g>
          )}
          {barras.map((barra, i) => {
            const alturaBarra = Math.max(0, ARRIBA + altoUtil - y(barra.valor));
            const r = Math.min(4, alturaBarra / 2, anchoBarra / 2);
            const x0 = cx0(i) - anchoBarra / 2;
            const yTop = ARRIBA + altoUtil - alturaBarra;
            // Esquinas redondeadas solo arriba: la barra nace de la base.
            const d =
              alturaBarra > 0
                ? `M${x0},${ARRIBA + altoUtil} V${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} H${x0 + anchoBarra - r} Q${x0 + anchoBarra},${yTop} ${x0 + anchoBarra},${yTop + r} V${ARRIBA + altoUtil} Z`
                : "";
            return (
              <g key={i} onPointerEnter={() => setActivo(i)} onPointerDown={() => setActivo(i)}>
                <rect x={cx0(i) - ranura / 2} y={ARRIBA} width={ranura} height={altoUtil} fill="transparent" />
                {d && <path d={d} fill={color} opacity={activo === null || activo === i ? 1 : 0.45} />}
              </g>
            );
          })}
          {barras.map((barra, i) =>
            (etiquetas ? etiquetas.includes(i) : barras.length <= 7 || i === 0 || i === barras.length - 1 || i === Math.floor(barras.length / 2)) ? (
              <text key={i} x={cx0(i)} y={alto - 6} textAnchor="middle" className="fill-tinta-tenue text-[11px]">
                {barra.etiqueta}
              </text>
            ) : null,
          )}
        </svg>
      )}
      {b && activo !== null && <Tooltip x={cx0(activo)} ancho={ancho} titulo={b.etiqueta} valor={formato(b.valor)} detalle={b.detalle} />}
    </div>
  );
}

/** Alternativa accesible: los mismos datos en una tabla. */
export function TablaDeDatos({ titulo, columnas, filas, className }: { titulo: string; columnas: string[]; filas: string[][]; className?: string }) {
  return (
    <div className={cx("overflow-x-auto", className)}>
      <table className="w-full text-left text-[14px]">
        <caption className="sr-only">{titulo}</caption>
        <thead>
          <tr className="text-tinta-suave">
            {columnas.map((c, i) => (
              <th key={c} scope="col" className={cx("py-1.5 font-semibold", i > 0 && "text-right")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className="border-t border-linea">
              {fila.map((celda, j) => (
                <td key={j} className={cx("cifras py-1.5", j > 0 && "text-right")}>
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
