"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorDeFuente } from "./datos/fuentes";

/** Las apps del ecosistema. SIVA las muestra; las que todavía no existen aparecen como tales. */
export const MODULOS = [
  { clave: "fia", nombre: "FIA", tema: "Finanzas", url: process.env.NEXT_PUBLIC_URL_FIA || null, existe: true },
  { clave: "gym", nombre: "GYM", tema: "Entrenamiento", url: process.env.NEXT_PUBLIC_URL_GYM || null, existe: true },
  { clave: "rha", nombre: "RHA", tema: "Hábitos y agenda", url: process.env.NEXT_PUBLIC_URL_RHA || null, existe: true },
  { clave: "cia", nombre: "CIA", tema: "Estudios", url: process.env.NEXT_PUBLIC_URL_CIA || null, existe: true },
  { clave: "aica", nombre: "AICA", tema: "Asistente", url: null, existe: false },
] as const;

export type ClaveModulo = (typeof MODULOS)[number]["clave"];

/**
 * Estado de una fuente. Si una actualización falla, los datos anteriores se conservan
 * pero quedan marcados como desactualizados: nunca se muestran como si fueran de ahora.
 */
export type EstadoFuente<T> = {
  datos: T | null;
  /** Cuándo se leyeron los datos que se muestran (ms). */
  actualizado: number | null;
  cargando: boolean;
  error: "sin_tablas" | "conexion" | null;
};

const CADA = 5 * 60_000;
const VIEJO = 60_000;

/** Lee una fuente al entrar, cada 5 minutos y al volver a la pestaña (si pasó más de un minuto). */
export function useFuente<T>(leer: () => Promise<T>, version: number): EstadoFuente<T> {
  const [estado, setEstado] = useState<EstadoFuente<T>>({ datos: null, actualizado: null, cargando: true, error: null });
  const ultimo = useRef(0);
  const vigente = useRef(0);

  const cargar = useCallback(() => {
    const turno = ++vigente.current;
    ultimo.current = Date.now();
    // El aviso de "cargando" va en un paso aparte: así el efecto que arranca la lectura no cambia estado de golpe.
    Promise.resolve()
      .then(() => {
        if (turno === vigente.current) setEstado((e) => (e.cargando ? e : { ...e, cargando: true }));
        return leer();
      })
      .then((datos) => turno === vigente.current && setEstado({ datos, actualizado: Date.now(), cargando: false, error: null }))
      .catch((fallo) => {
        if (turno !== vigente.current) return;
        const motivo = fallo instanceof ErrorDeFuente ? fallo.motivo : "conexion";
        setEstado((e) => ({ ...e, cargando: false, error: motivo }));
      });
  }, [leer]);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, CADA);
    const alVolver = () => document.visibilityState === "visible" && Date.now() - ultimo.current > VIEJO && cargar();
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
    };
  }, [cargar, version]);

  return estado;
}
