"use client";

import { MODULOS, type EstadoFuente } from "@/lib/modulos";
import { useTema, type Preferencia } from "@/lib/tema";
import { Logo } from "./Logo";
import { cx, Segmentos } from "./ui";

const ZONA = "America/Argentina/Buenos_Aires";
const formato = (opciones: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, ...opciones });

function hora(ms: number) {
  return formato({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(ms);
}

type Estados = { fia: EstadoFuente<unknown>; gym: EstadoFuente<unknown> };

/** Cómo está cada módulo, en palabras: nunca solo con un color. */
export function estadoDeModulo(estado: EstadoFuente<unknown> | undefined, existe: boolean): { texto: string; tono: "ok" | "aviso" | "error" | "nada" } {
  if (!existe) return { texto: "Próximamente", tono: "nada" };
  if (!estado || (estado.cargando && !estado.datos)) return { texto: "Cargando…", tono: "nada" };
  if (estado.error === "sin_tablas") return { texto: "Sin preparar", tono: "aviso" };
  if (estado.error && estado.datos && estado.actualizado) return { texto: `Desactualizado · ${hora(estado.actualizado)}`, tono: "aviso" };
  if (estado.error) return { texto: "No disponible", tono: "error" };
  return { texto: estado.actualizado ? `Al día · ${hora(estado.actualizado)}` : "Al día", tono: "ok" };
}

const PUNTO = { ok: "bg-verde", aviso: "bg-[#d97706]", error: "bg-rojo", nada: "bg-tinta/20" };

export function Lateral({
  ahora,
  estados,
  actualizando,
  onActualizar,
  salir,
}: {
  ahora: number;
  estados: Estados;
  actualizando: boolean;
  onActualizar: () => void;
  salir?: () => void;
}) {
  const [tema, setTema] = useTema();
  const diaSemana = formato({ weekday: "long" }).format(ahora);
  const dia = formato({ day: "numeric" }).format(ahora);
  const mes = formato({ month: "long" }).format(ahora);
  const anio = formato({ year: "numeric" }).format(ahora);

  return (
    <aside className="px-4 pt-[max(env(safe-area-inset-top),1.25rem)] sm:px-8 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-linea lg:px-8 lg:pt-10 lg:pb-8">
      <div className="flex items-center gap-2.5">
        <Logo className="size-8" />
        <span className="text-[17px] font-semibold tracking-tight">SIVA</span>
      </div>

      {/* La fecha: protagonista en la compu, una línea en el celular. */}
      <div className="mt-8 hidden lg:block">
        <p className="text-[19px] font-medium text-tinta-suave first-letter:uppercase">{diaSemana}</p>
        <p className="cifras text-[112px] leading-[0.95] font-semibold tracking-[-0.05em]">{dia}</p>
        <p className="mt-1 text-[19px] font-medium first-letter:uppercase">
          {mes} <span className="text-tinta-tenue">{anio}</span>
        </p>
        <p className="cifras mt-4 text-[34px] font-light tracking-tight text-tinta-suave">{hora(ahora)}</p>
      </div>
      <div className="mt-5 flex items-baseline justify-between lg:hidden">
        <p className="text-[28px] leading-tight font-bold tracking-[-0.02em] first-letter:uppercase">
          {diaSemana} {dia}
          <span className="block text-[17px] font-medium tracking-normal text-tinta-suave first-letter:uppercase">
            {mes} {anio}
          </span>
        </p>
        <p className="cifras text-[28px] font-light text-tinta-suave">{hora(ahora)}</p>
      </div>

      <nav aria-label="Módulos" className="mt-8 lg:mt-12">
        <p className="mb-2 text-[12px] font-semibold tracking-[0.08em] text-tinta-tenue uppercase">Módulos</p>
        <ul className="sin-barra -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:grid lg:gap-0.5 lg:overflow-visible lg:px-0">
          {MODULOS.map((m) => {
            const { texto, tono } = estadoDeModulo(m.clave === "fia" || m.clave === "gym" ? estados[m.clave] : undefined, m.existe);
            const contenido = (
              <>
                <span className={cx("size-2 shrink-0 rounded-full", PUNTO[tono])} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold whitespace-nowrap">
                    {m.nombre} <span className="font-normal text-tinta-suave">· {m.tema}</span>
                  </span>
                  <span className={cx("block text-[13px] whitespace-nowrap", tono === "error" ? "text-rojo" : "text-tinta-tenue")}>{texto}</span>
                </span>
              </>
            );
            const clases = cx(
              "flex items-center gap-3 rounded-xl px-3 py-2",
              m.existe ? "cristal-leve lg:bg-transparent lg:shadow-none lg:border-transparent" : "opacity-60",
            );
            return (
              <li key={m.clave} className="shrink-0">
                {m.url ? (
                  <a href={m.url} className={cx(clases, "transition-colors lg:hover:bg-tinta/5")} aria-label={`Abrir ${m.nombre}: ${texto}`}>
                    {contenido}
                  </a>
                ) : (
                  <div className={clases}>{contenido}</div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto hidden gap-3 pt-10 lg:grid">
        <BotonActualizar actualizando={actualizando} onActualizar={onActualizar} />
        <Segmentos<Preferencia>
          etiqueta="Tema"
          opciones={[
            ["auto", "Auto"],
            ["claro", "Claro"],
            ["oscuro", "Oscuro"],
          ]}
          valor={tema}
          onCambiar={setTema}
        />
        {salir && (
          <button type="button" onClick={salir} className="h-9 text-[14px] font-medium text-tinta-tenue hover:text-tinta">
            Cerrar sesión
          </button>
        )}
      </div>
    </aside>
  );
}

export function BotonActualizar({ actualizando, onActualizar }: { actualizando: boolean; onActualizar: () => void }) {
  return (
    <button
      type="button"
      onClick={onActualizar}
      disabled={actualizando}
      className="cristal-leve inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold disabled:opacity-60"
    >
      <svg
        viewBox="0 0 24 24"
        className={cx("size-4", actualizando && "animate-spin")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
      </svg>
      {actualizando ? "Actualizando…" : "Actualizar"}
    </button>
  );
}
