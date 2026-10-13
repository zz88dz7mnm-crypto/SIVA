"use client";

import { useEffect } from "react";
import { MARCA_DEMO } from "./Aplicacion";

export function EntrarDemo() {
  useEffect(() => {
    sessionStorage.setItem(MARCA_DEMO, new URLSearchParams(window.location.search).get("caida") ?? "");
    window.location.replace("/");
  }, []);
  return null;
}
