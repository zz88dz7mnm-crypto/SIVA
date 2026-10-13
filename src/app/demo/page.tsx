import { notFound } from "next/navigation";
import { Aplicacion } from "@/components/Aplicacion";
import { EntrarDemo } from "@/components/EntrarDemo";

export const instant = false;

/** Solo en desarrollo: abre el tablero con datos de muestra. /demo?caida=fia simula un módulo caído. */
export default function PaginaDemo() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Aplicacion>
      <EntrarDemo />
    </Aplicacion>
  );
}
