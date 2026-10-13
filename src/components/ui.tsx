"use client";

import { useEffect, useRef } from "react";

export function cx(...clases: (string | false | null | undefined)[]) {
  return clases.filter(Boolean).join(" ");
}

export function Tarjeta({ className, children, ...resto }: React.HTMLAttributes<HTMLElement> & { as?: "section" | "div" }) {
  return (
    <section className={cx("cristal rounded-[26px] p-5", className)} {...resto}>
      {children}
    </section>
  );
}

type Variante = "principal" | "secundario" | "peligro" | "suave";

const VARIANTES: Record<Variante, string> = {
  principal: "bg-acento text-sobre-acento active:bg-acento-oscuro",
  secundario: "cristal-leve text-tinta active:opacity-70",
  suave: "bg-acento-suave text-acento active:opacity-70",
  peligro: "bg-rojo/10 text-rojo active:opacity-70",
};

export function Boton({ variante = "principal", className, children, ...resto }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[17px] font-semibold transition-[background-color,opacity] disabled:opacity-50",
        VARIANTES[variante],
        className,
      )}
      {...resto}
    >
      {children}
    </button>
  );
}

export function Encabezado({ titulo, sobre, children }: { titulo: string; sobre?: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 px-1 pt-2 pb-4">
      <div className="min-w-0">
        {sobre && <p className="text-[13px] font-semibold tracking-wide text-tinta-suave uppercase">{sobre}</p>}
        <h1 className="text-[32px] leading-tight font-bold tracking-[-0.025em]">{titulo}</h1>
      </div>
      {children}
    </header>
  );
}

export function Vacio({ titulo, texto, children }: { titulo: string; texto: string; children?: React.ReactNode }) {
  return (
    <div className="grid justify-items-center gap-2 px-6 py-10 text-center">
      <p className="text-[17px] font-semibold">{titulo}</p>
      <p className="max-w-xs text-[15px] text-tinta-suave">{texto}</p>
      {children}
    </div>
  );
}

/**
 * Diálogo de confirmación nativo (<dialog>): atrapa el foco y se cierra con Escape.
 * Las acciones destructivas nombran el recurso y lo que va a pasar.
 */
export function Confirmar({
  abierto,
  titulo,
  texto,
  confirmar,
  peligro,
  onConfirmar,
  onCancelar,
  ocupado,
}: {
  abierto: boolean;
  titulo: string;
  texto: React.ReactNode;
  confirmar: string;
  peligro?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  ocupado?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancelar();
      }}
      className="cristal m-auto w-[min(92vw,24rem)] rounded-[28px] p-6 text-tinta backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <h2 className="text-[20px] font-bold">{titulo}</h2>
      <div className="mt-2 text-[15px] leading-snug text-tinta-suave">{texto}</div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Boton variante="secundario" onClick={onCancelar} disabled={ocupado}>
          Volver
        </Boton>
        <Boton variante={peligro ? "peligro" : "principal"} onClick={onConfirmar} disabled={ocupado}>
          {confirmar}
        </Boton>
      </div>
    </dialog>
  );
}

/** Selector de opciones en una píldora (tipo "segmented control"). */
export function Segmentos<T extends string>({
  opciones,
  valor,
  onCambiar,
  etiqueta,
}: {
  opciones: [T, string][];
  valor: T;
  onCambiar: (v: T) => void;
  etiqueta: string;
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="cristal-leve flex rounded-full p-1">
      {opciones.map(([v, texto]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={v === valor}
          onClick={() => onCambiar(v)}
          className={cx(
            "h-9 flex-1 rounded-full px-3 text-[14px] font-semibold whitespace-nowrap transition-colors",
            v === valor ? "bg-acento text-sobre-acento" : "text-tinta-suave",
          )}
        >
          {texto}
        </button>
      ))}
    </div>
  );
}
