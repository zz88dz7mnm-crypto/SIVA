import { notFound } from "next/navigation";
import { Aplicacion } from "@/components/Aplicacion";
import { EntrarDemo } from "@/components/EntrarDemo";

export const instant = false;

/** Solo en desarrollo: abre el tablero con datos de muestra. /demo?caida=rha simula RHA caída. */
export default function PaginaDemo() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Aplicacion>
      <EntrarDemo />
    </Aplicacion>
  );
}
