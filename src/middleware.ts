import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const role = (req.auth.user as any)?.role
  if (role === "CAIXA") {
    const { pathname } = req.nextUrl
    const allowed = ["/", "/mesas", "/produtos"]
    if (!allowed.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.redirect(new URL("/mesas", req.url))
    }
  }
})

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|logo\\.png).*)"],
}
