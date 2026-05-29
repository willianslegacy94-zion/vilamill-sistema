import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import FinanceiroContent from "./financeiro-content";

export default async function FinanceiroPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const isTrainee = (session?.user as any)?.isTrainee ?? false;
  if (role !== "ADMIN" && !isTrainee) redirect("/");

  const isAdmin = role === "ADMIN" && !isTrainee;

  return (
    <Suspense>
      <FinanceiroContent isAdmin={isAdmin} />
    </Suspense>
  );
}
