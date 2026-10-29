// Genera los íconos de la app: las cuatro tarjetas de SIVA. Uso: node scripts/iconos.mjs
import sharp from "sharp";

const icono = (lado) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 96 96">
    <defs><linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#263342"/><stop offset="1" stop-color="#11161e"/></linearGradient></defs><rect width="96" height="96" fill="url(#v)"/>
    <g transform="translate(24 24) scale(2)" fill="#67a9ff">
      <rect x="3" y="3" width="8" height="10" rx="2.2"/>
      <rect x="13" y="3" width="8" height="6" rx="2.2"/>
      <rect x="13" y="11" width="8" height="10" rx="2.2"/>
      <rect x="3" y="15" width="8" height="6" rx="2.2"/>
    </g>
  </svg>`;

const salidas = [
  ["public/iconos/siva-192.png", 192],
  ["public/iconos/siva-512.png", 512],
  ["src/app/apple-icon.png", 180],
  ["src/app/icon.png", 96],
];

for (const [ruta, lado] of salidas) {
  await sharp(Buffer.from(icono(lado))).png().toFile(ruta);
  console.log(ruta);
}
