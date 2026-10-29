"use client";

import { useState } from "react";
import { supabase } from "@/lib/datos/cliente";
import { Logo } from "./Logo";

const CAMPO =
  "h-12 w-full rounded-2xl border border-linea bg-campo px-4 text-[17px] text-tinta outline-none focus:border-acento focus:ring-2 focus:ring-acento/20";

/** Pantalla de entrada. Es la misma cuenta que RHA: la sesión se comparte por usuario, no por app. */
export function Ingreso() {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setEntrando(true);
    setError("");
    const { error: fallo } = await supabase().auth.signInWithPassword({ email: email.trim(), password: clave });
    if (fallo) {
      setError(fallo.status === 400 ? "El email o la contraseña no coinciden." : "No pude conectarme. Revisá tu conexión y probá de nuevo.");
      setEntrando(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="cristal w-full max-w-sm rounded-[32px] p-7">
        <Logo className="size-14" />
        <h1 className="mt-5 text-[34px] leading-[1.1] font-bold tracking-[-0.025em]">SIVA</h1>
        <p className="mt-2 text-[17px] leading-snug text-tinta-suave">
          Tu día de un vistazo: hábitos, agenda y lo que venga. Entrá con la misma cuenta de RHA.
        </p>

        <form onSubmit={entrar} className="mt-7 grid gap-3">
          <label className="grid grid-cols-1 gap-1.5 text-[13px] text-tinta-suave">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={CAMPO}
            />
          </label>
          <label className="grid grid-cols-1 gap-1.5 text-[13px] text-tinta-suave">
            Contraseña
            <input type="password" required autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} className={CAMPO} />
          </label>
          {error && (
            <p role="alert" className="text-[15px] text-rojo">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={entrando}
            className="mt-2 h-12 rounded-full bg-acento text-[17px] font-semibold text-sobre-acento transition-colors active:bg-acento-oscuro disabled:opacity-60"
          >
            {entrando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
