/**
 * Tema: automático (oscuro desde las 18:00 hasta las 7:00, hora de Argentina) o elegido a mano.
 * Lo elegido a mano vale hasta que se vuelve a "automático". Se guarda por dispositivo.
 */
export type Preferencia = "auto" | "claro" | "oscuro";

export const CLAVE = "siva-tema";
export const DESDE_HORA = 18;
export const HASTA_HORA = 7;

export function temaPara(preferencia: Preferencia, hora: number): "claro" | "oscuro" {
  if (preferencia !== "auto") return preferencia;
  return hora >= DESDE_HORA || hora < HASTA_HORA ? "oscuro" : "claro";
}

/** Se ejecuta en el <head> antes de pintar, para que no parpadee el tema equivocado. */
export const SCRIPT_TEMA = `(function(){try{var p=localStorage.getItem("${CLAVE}")||"auto";var h=Number(new Intl.DateTimeFormat("en-GB",{timeZone:"America/Argentina/Buenos_Aires",hour:"2-digit",hourCycle:"h23"}).format(new Date()));var t=p==="claro"||p==="oscuro"?p:(h>=${DESDE_HORA}||h<${HASTA_HORA}?"oscuro":"claro");document.documentElement.dataset.tema=t;}catch(e){}})();`;
