import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Home() {
  // Detectar host en SSR
  const hdrs = await headers();
  const host = hdrs.get("host") || "";
  if (host === "godcode.me" || host === "www.godcode.me") {
    redirect("/login");
    return null;
  }
  const match = host.match(/^([^.]+)\.godcode\.me$/);
  if (match && match[1]) {
    redirect(`/${match[1]}`);
    return null;
  }
  return null;
}
