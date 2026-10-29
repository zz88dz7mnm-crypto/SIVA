import type { Metadata, Viewport } from "next";
import { SCRIPT_TEMA } from "@/lib/tema-base";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIVA",
  description: "Tu día de un vistazo: hábitos, agenda y lo que venga.",
  appleWebApp: { capable: true, title: "SIVA", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#090b0f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        {/* Elige claro u oscuro antes de pintar, para que no parpadee. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
