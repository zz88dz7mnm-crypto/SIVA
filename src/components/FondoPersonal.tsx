/**
 * La imagen de fondo elegida por el usuario, detrás de todo. Va en z-index -1 después de body::before (el fondo ambiental), así queda encima de él. Lleva encima un velo del color del tema
 * y una viñeta: el vidrio la deja ver, pero los textos se siguen leyendo.
 */
export function FondoPersonal({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-1">
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen del usuario, de un origen variable */}
      <img src={url} alt="" className="size-full object-cover" />
      <div className="absolute inset-0" style={{ background: "var(--velo-fondo)" }} />
    </div>
  );
}
