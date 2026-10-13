"use client";

import type { EstadoFuente } from "@/lib/modulos";
import { cx } from "./ui";

/**
 * Una sección del tablero que viene de un módulo. Se encarga de los estados que no son "datos":
 * cargando, módulo sin preparar, caído o desactualizado. Nunca muestra ceros si no pudo leer.
 */
export function Seccion<T>({
  titulo,
  periodo,
  modulo,
  url,
  color,
  estado,
  children,
}: {
  titulo: string;
  periodo: string;
  modulo: string;
  url: string | null;
  color: string;
  estado: EstadoFuente<T>;
  children: (datos: T) => React.ReactNode;
}) {
  const id = `seccion-${modulo.toLowerCase()}`;
  return (
    <section aria-labelledby={id} className="min-w-0">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.06em] text-tinta-tenue uppercase">
            <span className="size-2 rounded-full" style={{ background: color }} aria-hidden="true" />
            {modulo}
          </p>
          <h2 id={id} className="mt-1 text-[28px] leading-tight font-bold tracking-[-0.025em] sm:text-[34px]">
            {titulo} <span className="font-normal text-tinta-tenue">{periodo}</span>
          </h2>
        </div>
        {url && (
          <a href={url} className="shrink-0 pb-1 text-[15px] font-medium text-acento hover:underline">
            Abrir {modulo} ↗
          </a>
        )}
      </header>

      {estado.error && (
        <Aviso tono={estado.datos ? "aviso" : estado.error === "sin_tablas" ? "aviso" : "error"}>
          {estado.error === "sin_tablas"
            ? `${modulo} todavía no preparó su base de datos. Cuando lo haga, sus datos aparecen acá.`
            : estado.datos
              ? `No pude actualizar ${modulo}: lo que ves es de la última lectura. Se reintenta solo.`
              : `${modulo} no está disponible ahora (sin conexión o el servicio no responde). Esto no quiere decir que no haya datos.`}
        </Aviso>
      )}

      {estado.datos ? (
        <div className={cx("transition-opacity", estado.error && "opacity-70")}>{children(estado.datos)}</div>
      ) : estado.cargando ? (
        <Esqueleto />
      ) : null}
    </section>
  );
}

function Aviso({ tono, children }: { tono: "aviso" | "error"; children: React.ReactNode }) {
  return (
    <p
      role="status"
      className={cx("mb-4 rounded-2xl px-4 py-3 text-[14px] leading-snug", tono === "error" ? "bg-rojo/10 text-rojo" : "bg-[#d97706]/12 text-tinta")}
    >
      {children}
    </p>
  );
}

function Esqueleto() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true" aria-label="Cargando">
      <div className="h-40 rounded-[26px] bg-tinta/5" />
      <div className="h-40 rounded-[26px] bg-tinta/5" />
      <div className="h-56 rounded-[26px] bg-tinta/5 md:col-span-2" />
    </div>
  );
}

/** Una cifra grande con su etiqueta, al estilo de los widgets de Apple. */
export function Cifra({
  etiqueta,
  valor,
  detalle,
  grande,
  tono,
}: {
  etiqueta: string;
  valor: string;
  detalle?: React.ReactNode;
  grande?: boolean;
  tono?: "rojo" | "verde";
}) {
  return (
    <div className="min-w-0">
      <p className="text-[15px] text-tinta-suave">{etiqueta}</p>
      <p
        className={cx(
          "cifras mt-1 truncate font-semibold tracking-[-0.035em]",
          grande ? "text-[44px] leading-none sm:text-[56px]" : "text-[28px] leading-tight",
          tono === "rojo" && "text-rojo",
          tono === "verde" && "text-verde",
        )}
      >
        {valor}
      </p>
      {detalle && <div className="mt-1.5 text-[14px] text-tinta-suave">{detalle}</div>}
    </div>
  );
}
