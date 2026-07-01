import { auth } from "@/auth";

export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return !!session && (session.user as any)?.role === "ADMIN";
}
