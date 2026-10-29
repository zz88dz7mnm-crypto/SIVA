"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/datos/cliente";
import { fuentesSupabase, type Fuentes } from "@/lib/datos/fuentes";
import { fuentesDeMuestra } from "@/lib/datos/muestra";
import { Ingreso } from "./Ingreso";
import { Logo } from "./Logo";
import { Tablero } from "./Tablero";

type Estado = { paso: "cargando" } | { paso: "sin_sesion" } | { paso: "lista"; clave: string; fuentes: Fuentes; salir?: () => void };

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

  useEffect(() => {
    const demo = modoDemo();
    if (demo) {
      // La marca de demo solo existe en el navegador: no se puede decidir antes de hidratar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEstado({ paso: "lista", clave: "demo", fuentes: fuentesDeMuestra(demo) });
      return;
    }
    const db = supabase();
    const { data } = db.auth.onAuthStateChange((_evento, sesion) => {
      const usuarioId = sesion?.user.id;
      setEstado((previo) => {
        if (!usuarioId) return { paso: "sin_sesion" };
        if (previo.paso === "lista" && previo.clave === usuarioId) return previo;
        return { paso: "lista", clave: usuarioId, fuentes: fuentesSupabase(db), salir: () => void db.auth.signOut() };
      });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (ruta === "/demo") return children;
  if (estado.paso === "cargando") {
    return (
      <main className="grid min-h-dvh place-items-center" aria-busy="true" aria-label="Cargando">
        <Logo className="size-14 animate-pulse" />
      </main>
    );
  }
  if (estado.paso === "sin_sesion") return <Ingreso />;
  return <Tablero key={estado.clave} fuentes={estado.fuentes} salir={estado.salir} />;
}
