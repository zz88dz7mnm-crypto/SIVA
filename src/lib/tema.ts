"use client";

import { useCallback, useEffect, useState } from "react";
import { horaEn } from "./fechas";
import { CLAVE, temaPara, type Preferencia } from "./tema-base";

export type { Preferencia };

function leer(): Preferencia {
  try {
    const p = localStorage.getItem(CLAVE);
    return p === "claro" || p === "oscuro" ? p : "auto";
  } catch {
    return "auto";
  }
}

function aplicar(preferencia: Preferencia) {
  const tema = temaPara(preferencia, horaEn());
  document.documentElement.dataset.tema = tema;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tema === "oscuro" ? "#0d0f14" : "#f2f3f7");
}

export function useTema(): [Preferencia, (p: Preferencia) => void] {
  // Se usa solo dentro de la app ya cargada, en el navegador: puede leer la preferencia al arrancar.
  const [preferencia, setPreferencia] = useState<Preferencia>(leer);

  useEffect(() => {
    aplicar(leer());
    // En automático, cambia solo al pasar las 18:00 aunque la app esté abierta.
    const id = setInterval(() => aplicar(leer()), 60_000);
    return () => clearInterval(id);
  }, []);

  const elegir = useCallback((p: Preferencia) => {
    try {
      if (p === "auto") localStorage.removeItem(CLAVE);
      else localStorage.setItem(CLAVE, p);
    } catch {
      // Sin almacenamiento, el cambio dura hasta recargar.
    }
    setPreferencia(p);
    aplicar(p);
  }, []);

  return [preferencia, elegir];
}
