"use client";

import type { DatosHabitos } from "@/lib/datos/fuentes";
import { fechaCorta, fechaRelativa } from "@/lib/fechas";
import { resumenDeRHA, textoDuracion, type ActividadRHA, type CategoriaRHA, type HabitoDeHoy } from "@/lib/habitos";
import { MODULOS, type EstadoFuente } from "@/lib/modulos";
import { GraficoBarras } from "./Grafico";
import { Cifra, Seccion } from "./Seccion";
import { cx, Tarjeta, Vacio } from "./ui";

const RHA = MODULOS[2];
const COLOR = "var(--color-rha)";
const INICIALES = ["L", "M", "M", "J", "V", "S", "D"];
const GRIS = "#8e8e93";

export function SeccionHabitos({ estado, hoy }: { estado: EstadoFuente<DatosHabitos>; hoy: string }) {
  return (
    <Seccion titulo="Hábitos y agenda" periodo="hoy y esta semana" modulo="RHA" url={RHA.url} color={COLOR} estado={estado}>
      {(datos) => <Contenido datos={datos} hoy={hoy} />}
    </Seccion>
  );
}

function Contenido({ datos, hoy }: { datos: DatosHabitos; hoy: string }) {
  const r = resumenDeRHA(datos, hoy);
  const categoria = new Map(datos.categorias.map((c) => [c.id, c]));
  const totalHoy = r.deHoy.length;
  const minutosHoy = r.porDia.find((d) => d.fecha === hoy)?.minutos ?? 0;
  const pendientesHoy = r.agendaHoy.filter((a) => a.estado === "pendiente").length;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <Tarjeta className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-4 xl:col-span-5 xl:p-8">
        <div className="min-w-0">
          <p className="text-[15px] text-tinta-suave">Hábitos de hoy</p>
          <p className="cifras mt-1 text-[28px] leading-tight font-semibold tracking-[-0.035em]">
            {totalHoy === 0 ? (
              "—"
            ) : (
              <>
                {r.hechosHoy} <span className="text-tinta-tenue">de {totalHoy}</span>
              </>
            )}
          </p>
          {totalHoy > 0 ? (
            <div className="mt-2 flex gap-1" aria-hidden="true">
              {r.deHoy.map((d) => (
                <span
                  key={d.habito.id}
                  className="h-1.5 flex-1 rounded-full"
                  style={{
                    background:
                      d.estado === "completado"
                        ? COLOR
                        : d.estado === "parcial"
                          ? `color-mix(in srgb, ${COLOR} 45%, transparent)`
                          : "color-mix(in srgb, var(--color-tinta) 10%, transparent)",
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-[14px] text-tinta-suave">Ninguno toca hoy</p>
          )}
        </div>
        <Cifra
          etiqueta="Cumplimiento semanal"
          valor={r.semana.programados === 0 ? "—" : `${r.semana.completados} de ${r.semana.programados}`}
          detalle={
            r.semana.programados === 0
              ? "Sin días programados todavía"
              : [
                  "días programados, de lunes a hoy",
                  r.semana.parciales ? `${r.semana.parciales} parcial${r.semana.parciales === 1 ? "" : "es"}` : null,
                  r.semanales.total ? `Semanales: ${r.semanales.cumplidos} de ${r.semanales.total} con la meta` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
          }
        />
        <Cifra
          etiqueta="Agenda de hoy"
          valor={r.agendaHoy.length === 0 ? "Libre" : `${r.agendaHoy.length} ${r.agendaHoy.length === 1 ? "cosa" : "cosas"}`}
          detalle={
            r.agendaHoy.length === 0
              ? "Nada agendado"
              : `${pendientesHoy ? `${pendientesHoy} pendiente${pendientesHoy === 1 ? "" : "s"}` : "Todo hecho"}${minutosHoy ? ` · ${textoDuracion(minutosHoy)} planificadas` : ""}`
          }
        />
        <Cifra
          etiqueta="Vencidas"
          valor={String(r.vencidas.length)}
          tono={r.vencidas.length > 0 ? "rojo" : undefined}
          detalle={r.vencidas.length > 0 ? "Pendientes con fecha pasada: se deciden en RHA" : "Nada atrasado"}
        />
      </Tarjeta>

      <Tarjeta className="p-6 xl:col-span-3">
        <h3 className="text-[17px] font-semibold">Agenda de hoy</h3>
        {r.agendaHoy.length > 0 ? (
          <ul className="mt-4 grid gap-3">
            {r.agendaHoy.map((a) => (
              <FilaActividad key={a.id} a={a} cat={a.categoriaId ? categoria.get(a.categoriaId) : undefined} />
            ))}
          </ul>
        ) : (
          <Vacio titulo="Nada agendado para hoy" texto="Las actividades y tareas del día aparecen acá." />
        )}
      </Tarjeta>

      <Tarjeta className="p-6 xl:col-span-2">
        <h3 className="text-[17px] font-semibold">Hábitos de hoy</h3>
        {r.deHoy.length > 0 ? (
          <ul className="mt-4 grid gap-3">
            {r.deHoy.map((d) => (
              <FilaHabito key={d.habito.id} d={d} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[15px] text-tinta-suave">Hoy no toca ningún hábito.</p>
        )}
        {r.rachas.length > 0 && (
          <>
            <h4 className="mt-6 text-[13px] font-semibold tracking-[0.06em] text-tinta-tenue uppercase">Rachas</h4>
            <ul className="mt-2 grid gap-2">
              {r.rachas.slice(0, 3).map((x) => (
                <li key={x.nombre} className="flex items-baseline justify-between gap-3 text-[15px]">
                  <span className="min-w-0 truncate">{x.nombre}</span>
                  <span className="cifras shrink-0 font-semibold">
                    {x.valor} {x.valor === 1 ? x.unidad.slice(0, -1) : x.unidad}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Tarjeta>

      <Tarjeta className="p-6 xl:col-span-3">
        <h3 className="text-[17px] font-semibold">Tiempo planificado por día</h3>
        {r.minutosSemana > 0 ? (
          <>
            <p className="mt-1 text-[14px] text-tinta-suave">
              {textoDuracion(r.minutosSemana)} en la semana. Suma de bloques con horario: no es tiempo real trabajado.
            </p>
            <div className="mt-4">
              <GraficoBarras
                nombre="Tiempo planificado por día de la semana"
                color={COLOR}
                alto={200}
                // En horas, para que el eje marque valores redondos.
                formato={(h) => textoDuracion(Math.round(h * 60))}
                formatoEje={(h) => `${h.toLocaleString("es-AR")} h`}
                barras={r.porDia.map((d, i) => ({
                  etiqueta: INICIALES[i],
                  valor: Math.round((d.minutos / 60) * 100) / 100,
                  detalle: `${fechaCorta(d.fecha)} · ${d.actividades === 1 ? "1 actividad" : `${d.actividades} actividades`}`,
                }))}
              />
            </div>
          </>
        ) : (
          <Vacio titulo="Sin bloques con horario esta semana" texto="Cuando agendes actividades con hora de inicio y fin, se suman acá." />
        )}
      </Tarjeta>

      <Tarjeta className="p-6 xl:col-span-2">
        <h3 className="text-[17px] font-semibold">Vencidas y próximas</h3>
        {r.vencidas.length === 0 && r.proximas.length === 0 ? (
          <p className="mt-4 text-[15px] text-tinta-suave">Nada pendiente en los próximos 7 días.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {r.vencidas.slice(0, 4).map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-3 text-[15px]">
                <span className="min-w-0 truncate">{a.titulo}</span>
                <span className="shrink-0 text-[14px] font-medium text-rojo">Vencida · {fechaCorta(a.fecha, hoy)}</span>
              </li>
            ))}
            {r.vencidas.length > 4 && <li className="text-[14px] text-rojo">y {r.vencidas.length - 4} vencidas más</li>}
            {r.proximas.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-3 text-[15px]">
                <span className="min-w-0 truncate">{a.titulo}</span>
                <span className="shrink-0 text-[14px] text-tinta-suave">
                  {fechaRelativa(a.fecha, hoy)}
                  {a.inicio ? ` · ${a.inicio}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}

function FilaActividad({ a, cat }: { a: ActividadRHA; cat?: CategoriaRHA }) {
  const hecha = a.estado === "completada";
  return (
    <li className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-baseline gap-3 text-[15px]">
      <span className="cifras text-[14px] text-tinta-suave">{a.inicio ?? "—"}</span>
      <span className="min-w-0">
        <span className={cx("block truncate", hecha && "text-tinta-tenue line-through")}>{a.titulo}</span>
        <span className="flex items-center gap-1.5 text-[13px] text-tinta-tenue">
          <span className="size-2 rounded-full" style={{ background: cat?.color ?? GRIS }} aria-hidden="true" />
          {cat?.nombre ?? "Sin categoría"}
          {a.inicio && a.fin ? ` · hasta ${a.fin}` : !a.inicio ? " · sin horario" : ""}
        </span>
      </span>
      <span className={cx("shrink-0 text-[13px] font-medium", hecha ? "text-verde" : "text-tinta-suave")}>{hecha ? "Hecha" : "Pendiente"}</span>
    </li>
  );
}

const ESTADO_HABITO = { completado: "Hecho", parcial: "Parcial", no_completado: "No" } as const;

function FilaHabito({ d }: { d: HabitoDeHoy }) {
  const texto = d.semanal
    ? `${d.semanal.hechas} de ${d.semanal.meta} esta semana`
    : d.estado
      ? ESTADO_HABITO[d.estado]
      : d.habito.suplemento
        ? "Sin tomar"
        : "Pendiente";
  const tono = d.estado === "completado" ? "text-verde" : d.estado === "no_completado" ? "text-rojo" : "text-tinta-suave";
  return (
    <li className="flex items-baseline justify-between gap-3 text-[15px]">
      <span className="min-w-0 truncate">
        {d.habito.nombre}
        {d.habito.suplemento && <span className="text-tinta-tenue"> · suplemento</span>}
      </span>
      <span className={cx("shrink-0 text-[14px] font-medium", tono)}>{texto}</span>
    </li>
  );
}
