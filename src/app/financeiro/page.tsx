import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import FinanceiroContent from "./financeiro-content";

export default async function FinanceiroPage() {
  const session = await auth();
  const isTrainee = (session?.user as any)?.isTrainee ?? false;
  if ((session?.user as any)?.role !== "ADMIN" && !isTrainee) redirect("/");

  return (
    <Suspense>
      <FinanceiroContent />
    </Suspense>
  );
}
