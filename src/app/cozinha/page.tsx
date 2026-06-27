import { auth } from "@/auth";
import { redirect } from "next/navigation";
import KdsBoard from "./kds-board";

export default async function CozinhaPage() {
  const session = await auth();
  if (!session) redirect("/cozinha/login");

  const role = (session.user as any)?.role;
  if (role !== "COZINHA" && role !== "ADMIN") redirect("/cozinha/login");

  return <KdsBoard />;
}
