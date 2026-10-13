"use client";

import type { DatosEstudios } from "@/lib/datos/fuentes";
import { cuandoEs, resumenDeCIA, type ExamenConPreparacion } from "@/lib/estudios";
import { fechaCorta } from "@/lib/fechas";
import { MODULOS, type EstadoFuente } from "@/lib/modulos";
import { Cifra, Seccion } from "./Seccion";
import { cx, Tarjeta, Vacio } from "./ui";

const CIA = MODULOS[3];
const COLOR = "var(--color-cia)";
const GRIS = "#8e8e93";

export function SeccionEstudios({ estado, hoy }: { estado: EstadoFuente<DatosEstudios>; hoy: string }) {
  return (
    <Seccion titulo="Preparación académica" periodo="próximos exámenes" modulo="CIA" url={CIA.url} color={COLOR} estado={estado}>
      {(datos) => <Contenido datos={datos} hoy={hoy} />}
    </Seccion>
  );
}

function Contenido({ datos, hoy }: { datos: DatosEstudios; hoy: string }) {
  const r = resumenDeCIA(datos, hoy);
  const materia = new Map(datos.materias.map((m) => [m.id, m]));
  const nombre = (e: { materiaId: string; nombre: string }) => `${materia.get(e.materiaId)?.nombre ?? "?"} · ${e.nombre}`;
  const proximo = r.proximos.find((e) => e.tipo !== "cuestionario") ?? r.proximos[0];

  if (datos.materias.length === 0) {
    return (
      <Tarjeta className="p-6">
        <Vacio titulo="Sin materias en CIA" texto="Cuando cargues tus materias y exámenes en CIA, aparecen acá." />
      </Tarjeta>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <Tarjeta className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-4 xl:col-span-5 xl:p-8">
        <Cifra
          etiqueta="Próximo examen"
          valor={proximo ? cuandoEs(proximo.dias) : "—"}
          detalle={proximo ? `${nombre(proximo)}${proximo.fechaProvisoria ? " · fecha provisoria" : ""}` : "Sin exámenes pendientes"}
        />
        <Cifra etiqueta="En los próximos 7 días" valor={String(r.semana)} detalle={r.semana === 1 ? "examen" : "exámenes"} />
        <Cifra
          etiqueta="Temas de lo que viene"
          valor={r.temas.total ? `${r.temas.terminados} de ${r.temas.total}` : "—"}
          detalle={r.temas.total ? `terminados${r.temas.enCurso ? ` · ${r.temas.enCurso} en curso` : ""}` : "Sin temas cargados"}
        />
        <Cifra
          etiqueta="Sin marcar"
          valor={String(r.sinMarcar.length)}
          tono={r.sinMarcar.length ? "rojo" : undefined}
          detalle={r.sinMarcar.length ? "Ya pasaron: falta decir si se rindieron (en CIA)" : "Todo al día"}
        />
      </Tarjeta>

      <Tarjeta className="p-6 xl:col-span-3">
        <h3 className="text-[17px] font-semibold">Próximos exámenes</h3>
        {r.proximos.length ? (
          <ul className="mt-4 grid gap-3.5">
            {r.proximos.slice(0, 6).map((e) => (
              <FilaExamen key={e.id} e={e} materia={materia.get(e.materiaId)} hoy={hoy} />
            ))}
          </ul>
        ) : (
          <Vacio titulo="Sin exámenes pendientes" texto="Los que cargues en CIA aparecen acá con su preparación." />
        )}
      </Tarjeta>

      <Tarjeta className="p-6 xl:col-span-2">
        <h3 className="text-[17px] font-semibold">Avisos</h3>
        {r.avisos.length === 0 && r.choques.length === 0 && r.sinMarcar.length === 0 ? (
          <p className="mt-4 text-[15px] text-tinta-suave">Nada para avisar hoy.</p>
        ) : (
          <ul className="mt-4 grid gap-3 text-[15px]">
            {r.avisos.map((e) => (
              <li key={e.id}>
                <span className="font-semibold">{cuandoEs(e.dias)}:</span> {nombre(e)}
              </li>
            ))}
            {r.choques.map(([a, b]) => (
              <li key={`${a.id}-${b.id}`}>
                <span className="font-semibold text-[#b45309]">Mismo día ({fechaCorta(a.fecha, hoy)}):</span> {nombre(a)} y {nombre(b)}
              </li>
            ))}
            {r.sinMarcar.slice(0, 3).map((e) => (
              <li key={e.id}>
                <span className="font-semibold text-rojo">Sin marcar:</span> {nombre(e)} ({fechaCorta(e.fecha, hoy)})
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}

function FilaExamen({ e, materia, hoy }: { e: ExamenConPreparacion; materia?: { nombre: string; color: string }; hoy: string }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5">
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-tinta-suave">
          <span className="size-2 rounded-full" style={{ background: materia?.color ?? GRIS }} aria-hidden="true" />
          {materia?.nombre ?? "?"}
          {e.fechaProvisoria && <span className="text-[#b45309]"> · provisoria</span>}
        </span>
        <span className="block truncate text-[15px] font-semibold">{e.nombre}</span>
      </span>
      <span className="text-right text-[14px]">
        <span className={cx("block font-semibold", e.dias <= 3 ? "text-acento" : "")}>{cuandoEs(e.dias)}</span>
        <span className="block text-tinta-tenue">{fechaCorta(e.fecha, hoy)}</span>
      </span>
      {e.tipo !== "cuestionario" && (
        <span className="col-span-2 grid gap-1">
          {e.total ? (
            <>
              <span className="flex h-1.5 overflow-hidden rounded-full bg-tinta/10" aria-hidden="true">
                <span style={{ width: `${(e.terminados / e.total) * 100}%`, background: COLOR }} />
                <span style={{ width: `${(e.enCurso / e.total) * 100}%`, background: `color-mix(in srgb, ${COLOR} 40%, transparent)` }} />
              </span>
              <span className="cifras text-[13px] text-tinta-suave">
                {e.terminados} de {e.total} temas terminados{e.enCurso ? ` · ${e.enCurso} en curso` : ""}
              </span>
            </>
          ) : (
            <span className="text-[13px] text-tinta-tenue">Sin temas cargados</span>
          )}
        </span>
      )}
    </li>
  );
}
