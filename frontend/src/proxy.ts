import { NextRequest, NextResponse } from "next/server";

const backend = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:8000";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login") return NextResponse.next();

  let authenticated = false;
  try {
    const response = await fetch(`${backend}/api/v1/auth/session`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (response.ok) {
      const status = await response.json() as { authenticated?: boolean };
      authenticated = status.authenticated === true;
    }
  } catch {
    // Fail closed when the auth service cannot be reached.
  }

  if (!authenticated) {
    const login = new URL("/login", request.url);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
