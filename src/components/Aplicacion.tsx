"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/datos/cliente";
import { fuentesSupabase, type Fuentes } from "@/lib/datos/fuentes";
import { fuentesDeMuestra } from "@/lib/datos/muestra";
import { Logo } from "./Logo";
import { Tablero } from "./Tablero";

type Estado = { paso: "cargando" } | { paso: "lista"; clave: string; fuentes: Fuentes };

/** Solo en desarrollo: /demo deja esta marca (y qué módulo simular caído) y la app usa datos de muestra. */
export const MARCA_DEMO = "siva-demo";

function modoDemo(): { habitos?: boolean } | null {
  if (process.env.NODE_ENV === "production") return null;
  try {
    const marca = sessionStorage.getItem(MARCA_DEMO);
    if (marca === null) return null;
    return { habitos: marca.includes("rha") };
  } catch {
    return null;
  }
}

export function Aplicacion({ children }: { children?: React.ReactNode }) {
  const ruta = usePathname();
  const [estado, setEstado] = useState<Estado>({ paso: "cargando" });

  // Sin usuario ni contraseña: abre directo. Lo de la demo solo se sabe en el navegador.
  useEffect(() => {
    const demo = modoDemo();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstado(
      demo ? { paso: "lista", clave: "demo", fuentes: fuentesDeMuestra(demo) } : { paso: "lista", clave: "siva", fuentes: fuentesSupabase(supabase()) },
    );
  }, []);

  if (ruta === "/demo") return children;
  if (estado.paso === "cargando") {
    return (
      <main className="grid min-h-dvh place-items-center" aria-busy="true" aria-label="Cargando">
        <Logo className="size-14 animate-pulse" />
      </main>
    );
  }
  return <Tablero key={estado.clave} fuentes={estado.fuentes} />;
}
