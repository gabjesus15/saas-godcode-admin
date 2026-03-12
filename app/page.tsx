import { redirect } from "next/navigation";

export default function Home() {
  // Detectar subdominio desde el host
  if (typeof window !== "undefined") {
    const host = window.location.host;
    // Extraer el subdominio
    const match = host.match(/^([^.]+)\.godcode\.me$/);
    if (match && match[1]) {
      // Redirigir al home del negocio
      redirect(`/${match[1]}`);
      return null;
    }
  }
  // Si no hay subdominio, puedes mostrar el home global o dejar en blanco
  return null;
}
