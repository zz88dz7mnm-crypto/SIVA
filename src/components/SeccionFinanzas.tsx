"use client";

import type { DatosFinanzas } from "@/lib/datos/fuentes";
import { diasEntre, fechaCorta } from "@/lib/fechas";
import { formatoPesos, formatoPesosCorto, gastoPorCategoria, principales, quedaEnFrascos, salidasPorDia, totales } from "@/lib/finanzas";
import { MODULOS, type EstadoFuente } from "@/lib/modulos";
import { GraficoBarras } from "./Grafico";
import { Cifra, Seccion } from "./Seccion";
import { Tarjeta, Vacio } from "./ui";

const FIA = MODULOS[0];
const COLOR = "var(--color-fia)";

export function SeccionFinanzas({ estado, hoy }: { estado: EstadoFuente<DatosFinanzas>; hoy: string }) {
  const mes = new Intl.DateTimeFormat("es-AR", { month: "long", timeZone: "UTC" }).format(new Date(`${hoy}T12:00:00Z`));
  return (
    <Seccion titulo="Finanzas" periodo={mes} modulo="FIA" url={FIA.url} color={COLOR} estado={estado}>
      {(datos) => <Contenido datos={datos} hoy={hoy} />}
    </Seccion>
  );
}

function Contenido({ datos, hoy }: { datos: DatosFinanzas; hoy: string }) {
  const { salio, entro, queda } = totales(datos.movimientos);
  const categorias = principales(gastoPorCategoria(datos.movimientos, datos.categorias), 6);
  const dias = salidasPorDia(datos.movimientos, datos.desde, datos.hasta);
  const frascos = quedaEnFrascos(datos.frascos);
  const transcurridos = Math.min(diasEntre(datos.desde, hoy) + 1, dias.length);
  const promedio = transcurridos > 0 ? Math.round(salio / transcurridos / 100) * 100 : 0;
  const sinMovimientos = datos.movimientos.length === 0;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <Tarjeta className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 xl:col-span-5 xl:p-8">
        <Cifra
          grande
          etiqueta="Gastaste este mes"
          valor={formatoPesos(salio)}
          detalle={sinMovimientos ? "Todavía no hay movimientos confirmados este mes." : `${formatoPesos(promedio)} por día en promedio`}
        />
        <Cifra
          grande
          etiqueta="Te queda para gastar"
          valor={formatoPesos(queda)}
          tono={queda < 0 ? "rojo" : undefined}
          detalle={
            <>
              Entró {formatoPesos(entro)} y salió {formatoPesos(salio)}.{queda < 0 && <span className="block text-rojo">Gastaste más de lo que entró.</span>}
            </>
          }
        />
      </Tarjeta>

      <Tarjeta className="p-6 xl:col-span-3">
        <h3 className="text-[17px] font-semibold">Gasto por día</h3>
        {salio > 0 ? (
          <div className="mt-4">
            <GraficoBarras
              nombre="Gasto por día del mes"
              color={COLOR}
              alto={300}
              formato={formatoPesos}
              barras={dias.map((d) => ({
                etiqueta: String(Number(d.fecha.slice(8))),
                valor: d.centavos,
                detalle: d.fecha > hoy ? "Todavía no llegó" : fechaCorta(d.fecha),
              }))}
              formatoEje={formatoPesosCorto}
              etiquetas={[0, 9, 19, dias.length - 1]}
            />
          </div>
        ) : (
          <Vacio titulo="Sin gastos" texto="Cuando anotes gastos en FIA, vas a verlos día por día." />
        )}
      </Tarjeta>

      <Tarjeta className="p-6 xl:col-span-2">
        <h3 className="text-[17px] font-semibold">En qué se fue</h3>
        {categorias.length > 0 ? (
          <ul className="mt-4 grid gap-3.5">
            {categorias.map((c) => (
              <li key={c.id ?? "sin"}>
                <div className="flex items-baseline justify-between gap-3 text-[15px]">
                  <span className="min-w-0 truncate">{c.nombre}</span>
                  <span className="cifras shrink-0 font-semibold">{formatoPesos(c.centavos)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-tinta/8">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(2, c.parte * 100)}%`, background: COLOR }} />
                  </div>
                  <span className="cifras w-10 text-right text-[12px] text-tinta-tenue">{Math.round(c.parte * 100)}%</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Vacio titulo="Sin gastos" texto="Todavía no hay gastos este mes." />
        )}
      </Tarjeta>

      {frascos.lista.length > 0 && (
        <Tarjeta className="p-6 xl:col-span-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[17px] font-semibold">Frascos</h3>
            <p className="cifras text-[15px] text-tinta-suave">Quedan {formatoPesos(frascos.total)} apartados</p>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {frascos.lista.map((f) => {
              const usado = f.asignado > 0 ? Math.min(1, f.gastado / f.asignado) : 0;
              return (
                <li key={f.id} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[15px] font-medium">{f.nombre}</span>
                    <span className={`cifras shrink-0 text-[15px] font-semibold ${f.queda < 0 ? "text-rojo" : ""}`}>{formatoPesos(f.queda)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-tinta/8">
                    <div className="h-full rounded-full" style={{ width: `${usado * 100}%`, background: f.queda < 0 ? "var(--color-rojo)" : COLOR }} />
                  </div>
                  <p className="cifras mt-1 text-[12px] text-tinta-tenue">
                    Gastado {formatoPesos(f.gastado)} de {formatoPesos(f.asignado)}
                  </p>
                </li>
              );
            })}
          </ul>
        </Tarjeta>
      )}
    </div>
  );
}
