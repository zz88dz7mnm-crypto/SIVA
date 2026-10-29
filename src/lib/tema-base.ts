/**
 * Tema: vidrio oscuro siempre (predeterminado, "auto") o claro elegido a mano. Se guarda por dispositivo.
 * DESDE_HORA y HASTA_HORA quedan por si se quiere volver al cambio automático por horario.
 */
export type Preferencia = "auto" | "claro" | "oscuro";

export const CLAVE = "siva-tema";
export const DESDE_HORA = 18;
export const HASTA_HORA = 7;

export function temaPara(preferencia: Preferencia, hora: number): "claro" | "oscuro" {
  if (preferencia === "claro") return "claro";
  void hora;
  return "oscuro";
}

/** Se ejecuta en el <head> antes de pintar, para que no parpadee el tema equivocado. */
export const SCRIPT_TEMA = `(function(){try{var p=localStorage.getItem("${CLAVE}")||"auto";var h=Number(new Intl.DateTimeFormat("en-GB",{timeZone:"America/Argentina/Buenos_Aires",hour:"2-digit",hourCycle:"h23"}).format(new Date()));var t=p==="claro"?"claro":"oscuro";void h;document.documentElement.dataset.tema=t;}catch(e){}})();`;
