# SIVA

Sistema Integrado de Vida y Administración: el tablero general del ecosistema (fase 2, SIVA v1, de la especificación maestra). Muestra en una pantalla lo que tienen las otras apps. **Solo lee**: cada dato sigue siendo de su módulo (FIA, la plata; GYM, los entrenamientos) y se edita allá.

- **Finanzas del mes** (FIA): cuánto gastaste, cuánto te queda para gastar (lo que entró menos lo que salió), gasto por día, en qué se fue y cómo vienen los frascos. Con las mismas definiciones que el panel de FIA (`docs/CONTRATO.md` del repo de FIA).
- **Entrenamiento de la semana** (GYM): entrenamientos (x de 3), semana del plan, volumen por día, sesiones y récords de la semana. Definiciones en `docs/CONTRATO.md` del repo de GYM.
- **Estado de cada módulo**, en palabras: al día (con la hora), desactualizado, no disponible, sin preparar o próximamente. Si un módulo no responde, SIVA lo dice: nunca lo muestra como "sin datos".

Se actualiza al entrar, cada 5 minutos, al volver a la pestaña y con el botón Actualizar. Tema oscuro automático desde las 18:00. En la compu, la fecha y los módulos van en la columna de la izquierda; en el celular, arriba.

## Cómo está armado

- `src/lib/finanzas.ts` y `src/lib/entrenamiento.ts`: las cuentas, código puro con pruebas (`src/lib/cuentas.test.ts`).
- `src/lib/datos/fuentes.ts`: las lecturas a Supabase (paginadas). No hay ninguna escritura.
- `src/lib/modulos.ts`: la lista de módulos y el estado de cada lectura.
- `src/components/`: el tablero (`Tablero`, `Lateral`, `SeccionFinanzas`, `SeccionEntrenamiento`).

`/` y `/panel` muestran lo mismo.

## Desarrollo

```bash
npm install
npm run dev
npm test
```

`http://localhost:3000/demo` abre el tablero con datos de muestra (solo en desarrollo). `/demo?caida=fia` (o `gym`, o `fia,gym`) simula un módulo caído.

## Puesta en marcha

1. No necesita SQL propio: lee las tablas de FIA y GYM con la sesión del usuario (RLS).
2. **Vercel:** Add New → Project → importar este repo → Deploy.
3. Los enlaces "Abrir FIA" y "Abrir GYM" salen de `NEXT_PUBLIC_URL_FIA` y `NEXT_PUBLIC_URL_GYM` en `.env`. Si una está vacía, el enlace no aparece.
4. Se entra con la misma cuenta de FIA.

## Fuera de esta versión

Los informes diarios de las 22:00, el historial de informes, los filtros por período y la comparación entre períodos son de SIVA final (fase 7). RHA, CIA y AICA aparecen como "próximamente" hasta que existan.
