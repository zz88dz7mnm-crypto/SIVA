# SIVA

Sistema Integrado de Vida y Administración: el tablero general del ecosistema. Muestra en una pantalla lo que tienen las otras apps. **Solo lee**: cada dato sigue siendo de su módulo y se edita allá.

- **Hábitos y agenda** (RHA): hábitos de hoy, cumplimiento de la semana (siempre con cuántos días se mide), agenda del día, vencidas, próximos 7 días, tiempo planificado por día y rachas. Definiciones en `docs/CONTRATO.md` del repo de RHA.
- **Estado de cada módulo**, en palabras: al día (con la hora), desactualizado, no disponible, sin preparar o próximamente. Si un módulo no responde, SIVA lo dice: nunca lo muestra como "sin datos".

Se actualiza al entrar, cada 5 minutos, al volver a la pestaña y con el botón Actualizar. Tema oscuro automático desde las 18:00. En la compu, la fecha y los módulos van en la columna de la izquierda; en el celular, arriba.

## Cómo está armado

- `src/lib/habitos.ts`: las cuentas, código puro con pruebas (`src/lib/cuentas.test.ts`).
- `src/lib/datos/fuentes.ts`: las lecturas a Supabase (paginadas). No hay ninguna escritura.
- `src/lib/modulos.ts`: la lista de módulos y el estado de cada lectura.
- `src/components/`: el tablero (`Tablero`, `Lateral`, `SeccionHabitos`).

`/` y `/panel` muestran lo mismo.

## Desarrollo

```bash
npm install
npm run dev
npm test
```

`http://localhost:3000/demo` abre el tablero con datos de muestra (solo en desarrollo). `/demo?caida=rha` simula RHA caída.

## Puesta en marcha

1. No necesita SQL propio: lee las tablas de RHA con la clave pública.
2. **Vercel:** Add New → Project → importar este repo → Deploy.
3. El enlace "Abrir RHA" sale de `NEXT_PUBLIC_URL_RHA` en `.env`. Si está vacía, el enlace no aparece.
4. No tiene usuario ni contraseña: abre directo. Cualquiera con la dirección puede verlo.

## Fuera de esta versión

Los informes diarios de las 22:00, el historial de informes, los filtros por período y la comparación entre períodos son de SIVA final. AICA aparece como "próximamente" hasta que exista.
