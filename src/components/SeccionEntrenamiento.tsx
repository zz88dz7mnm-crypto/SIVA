"use client";

import type { DatosEntrenamiento } from "@/lib/datos/fuentes";
import { fechaCorta, fechaRelativa, sumarDias } from "@/lib/fechas";
import { formatoKg, formatoVolumen, nombreDeDia, resumenDeSemana, SEMANAS_DEL_PLAN, SESIONES_POR_SEMANA, semanaDelPlan } from "@/lib/entrenamiento";
import { MODULOS, type EstadoFuente } from "@/lib/modulos";
import { GraficoBarras } from "./Grafico";
import { Cifra, Seccion } from "./Seccion";
import { Tarjeta, Vacio } from "./ui";

const GYM = MODULOS[1];
const COLOR = "var(--color-gym)";
const INICIALES = ["L", "M", "M", "J", "V", "S", "D"];

export function SeccionEntrenamiento({ estado, hoy }: { estado: EstadoFuente<DatosEntrenamiento>; hoy: string }) {
  return (
    <Seccion titulo="Entrenamiento" periodo="esta semana" modulo="GYM" url={GYM.url} color={COLOR} estado={estado}>
      {(datos) => <Contenido datos={datos} hoy={hoy} />}
    </Seccion>
  );
}

function Contenido({ datos, hoy }: { datos: DatosEntrenamiento; hoy: string }) {
  const r = resumenDeSemana(datos.sesiones, datos.series, hoy);
  const semana = datos.inicioPlan ? semanaDelPlan(datos.inicioPlan, hoy) : null;
  const hechas = r.sesiones.length;
  const enCurso = datos.sesiones.find((s) => s.estado === "en_curso");

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <Tarjeta className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-4 xl:col-span-5 xl:p-8">
        <div className="min-w-0">
          <p className="text-[15px] text-tinta-suave">Entrenamientos</p>
          <p className="cifras mt-1 text-[28px] leading-tight font-semibold tracking-[-0.035em]">
            {hechas} <span className="text-tinta-tenue">de {SESIONES_POR_SEMANA}</span>
          </p>
          <div className="mt-2 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: Math.max(SESIONES_POR_SEMANA, hechas) }, (_, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{ background: i < hechas ? COLOR : "color-mix(in srgb, var(--color-tinta) 10%, transparent)" }}
              />
            ))}
          </div>
        </div>
        <Cifra
          etiqueta="Semana del plan"
          valor={semana === null ? "—" : semana < 1 ? "Por arrancar" : semana > SEMANAS_DEL_PLAN ? "Terminado" : `${semana} de ${SEMANAS_DEL_PLAN}`}
          detalle={semana === null ? "Sin fecha de inicio en GYM" : undefined}
        />
        <Cifra
          etiqueta="Volumen"
          valor={formatoVolumen(r.volumen)}
          detalle={
            // Una semana a medio hacer contra una completa daría un porcentaje engañoso: se muestra la referencia, sin comparar.
            r.volumenAnterior > 0 ? `La semana pasada: ${formatoVolumen(r.volumenAnterior)}` : hechas === 0 ? "Todavía sin entrenar esta semana" : undefined
          }
        />
        <Cifra
          etiqueta={enCurso ? "Ahora" : "Último"}
          valor={enCurso ? "Entrenando" : r.ultima ? fechaRelativa(r.ultima.fecha, hoy) : "—"}
          detalle={enCurso ? nombreDeDia(enCurso.dia) : r.ultima ? nombreDeDia(r.ultima.dia) : "Sin entrenamientos"}
        />
      </Tarjeta>

      <Tarjeta className="p-6 xl:col-span-3">
        <h3 className="text-[17px] font-semibold">Volumen por día</h3>
        {r.volumen > 0 ? (
          <div className="mt-4">
            <GraficoBarras
              nombre="Volumen por día de la semana"
              color={COLOR}
              alto={200}
              formato={formatoVolumen}
              formatoEje={(n) => (n >= 1000 ? `${(n / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} t` : `${n}`)}
              barras={r.porDia.map((d, i) => ({
                etiqueta: INICIALES[i],
                valor: d.volumen,
                detalle: `${fechaCorta(d.fecha)}${d.sesiones ? ` · ${d.sesiones === 1 ? "1 entrenamiento" : `${d.sesiones} entrenamientos`}` : d.fecha > hoy ? " · todavía no llegó" : " · descanso"}`,
              }))}
            />
          </div>
        ) : (
          <Vacio
            titulo="Sin entrenamientos esta semana"
            texto={`La semana va del lunes ${fechaCorta(r.lunes)} al domingo ${fechaCorta(sumarDias(r.lunes, 6))}.`}
          />
        )}
      </Tarjeta>

      <Tarjeta className="p-6 xl:col-span-2">
        <h3 className="text-[17px] font-semibold">Esta semana</h3>
        {hechas > 0 ? (
          <ul className="mt-4 grid gap-3">
            {r.sesiones.map((s) => (
              <li key={s.id} className="flex items-baseline justify-between gap-3 text-[15px]">
                <span>{nombreDeDia(s.dia)}</span>
                <span className="text-tinta-suave">{fechaRelativa(s.fecha, hoy)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[15px] text-tinta-suave">Todavía no entrenaste esta semana.</p>
        )}
        {r.marcas.length > 0 && (
          <>
            <h4 className="mt-6 text-[13px] font-semibold tracking-[0.06em] text-tinta-tenue uppercase">Récords de la semana</h4>
            <ul className="mt-2 grid gap-2">
              {r.marcas.slice(0, 4).map((m) => (
                <li key={m.ejercicio} className="flex items-baseline justify-between gap-3 text-[15px]">
                  <span className="min-w-0 truncate">{m.nombre}</span>
                  <span className="cifras shrink-0 font-semibold">
                    {formatoKg(m.kg)} <span className="font-normal text-verde">+{formatoKg(Math.round((m.kg - m.anterior) * 10) / 10)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Tarjeta>
    </div>
  );
}
