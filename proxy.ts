import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { HAS_ESTABLISHMENT_COOKIE } from "@/_lib/has-establishment-cookie";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!user) {
    return response;
  }

  if (request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const isOnboardingPath = request.nextUrl.pathname.startsWith("/onboarding");
  const hasEstablishmentCookie = request.cookies.get(HAS_ESTABLISHMENT_COOKIE)?.value === "true";

  let hasEstablishment = hasEstablishmentCookie;

  if (!hasEstablishmentCookie) {
    const { data: establishment } = await supabase.from("establishments").select("id").maybeSingle();

    hasEstablishment = Boolean(establishment);

    if (hasEstablishment) {
      response.cookies.set(HAS_ESTABLISHMENT_COOKIE, "true", {
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }
  }

  if (!hasEstablishment && !isOnboardingPath && !isPublicPath) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (hasEstablishment && isOnboardingPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js).*)"],
};
