"use client";

import { useCallback, useEffect, useState } from "react";
import type { Fuentes } from "@/lib/datos/fuentes";
import { hoyEn } from "@/lib/fechas";
import { useFuente } from "@/lib/modulos";
import { useTema, type Preferencia } from "@/lib/tema";
import { BotonActualizar, Lateral } from "./Lateral";
import { Segmentos } from "./ui";
import { SeccionEntrenamiento } from "./SeccionEntrenamiento";
import { SeccionFinanzas } from "./SeccionFinanzas";

/** La hora de ahora, refrescada cada 15 segundos (alcanza para mostrar minutos). */
export function useAhora() {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

/**
 * El tablero: SIVA presenta y consolida, no edita. Cada sección lee del módulo dueño
 * y dice de dónde viene y cuándo se actualizó.
 */
export function Tablero({ fuentes, salir }: { fuentes: Fuentes; salir?: () => void }) {
  const ahora = useAhora();
  const hoy = hoyEn(undefined, new Date(ahora));
  const [version, setVersion] = useState(0);

  const leerFinanzas = useCallback(() => fuentes.finanzas(hoy), [fuentes, hoy]);
  const leerEntrenamiento = useCallback(() => fuentes.entrenamiento(), [fuentes]);
  const finanzas = useFuente(leerFinanzas, version);
  const entrenamiento = useFuente(leerEntrenamiento, version);

  return (
    <div className="mx-auto min-h-dvh max-w-[1400px] lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <Lateral
        ahora={ahora}
        estados={{ fia: finanzas, gym: entrenamiento }}
        actualizando={finanzas.cargando || entrenamiento.cargando}
        onActualizar={() => setVersion((v) => v + 1)}
        salir={salir}
      />
      <main className="grid min-w-0 grid-cols-1 gap-14 px-4 pt-6 pb-16 sm:px-8 lg:px-12 lg:pt-14">
        <SeccionFinanzas estado={finanzas} hoy={hoy} />
        <SeccionEntrenamiento estado={entrenamiento} hoy={hoy} />
        <PieMovil actualizando={finanzas.cargando || entrenamiento.cargando} onActualizar={() => setVersion((v) => v + 1)} salir={salir} />
      </main>
    </div>
  );
}

/** En el celular no hay barra lateral: los ajustes van al final. */
function PieMovil({ actualizando, onActualizar, salir }: { actualizando: boolean; onActualizar: () => void; salir?: () => void }) {
  const [tema, setTema] = useTema();
  return (
    <footer className="grid gap-3 border-t border-linea pt-8 lg:hidden">
      <BotonActualizar actualizando={actualizando} onActualizar={onActualizar} />
      <Segmentos<Preferencia>
        etiqueta="Tema"
        opciones={[
          ["auto", "Automático"],
          ["claro", "Claro"],
          ["oscuro", "Oscuro"],
        ]}
        valor={tema}
        onCambiar={setTema}
      />
      {salir && (
        <button type="button" onClick={salir} className="h-10 text-[14px] font-medium text-tinta-tenue">
          Cerrar sesión
        </button>
      )}
    </footer>
  );
}
