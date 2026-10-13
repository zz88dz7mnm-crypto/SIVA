import { Aplicacion } from "@/components/Aplicacion";

// Todo se muestra recién en el navegador, después de iniciar sesión: no hay nada que validar del lado del servidor.
export const instant = false;

export default function Pagina() {
  return <Aplicacion />;
}
