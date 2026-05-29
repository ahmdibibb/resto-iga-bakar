import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  // ============================================
  // PUBLIC ROUTES — No authentication required
  // ============================================

  // Customer-facing routes (guest access, no login needed)
  const customerRoutes = [
    "/menu",
    "/checkout",
    "/payment",
    "/receipt",
    "/cart",
  ];
  const isCustomerRoute = customerRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Other public routes
  const publicRoutes = ["/login", "/"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname === route || (route !== "/" && pathname.startsWith(route))
  );

  // Public API routes (no auth needed)
  const publicApiRoutes = [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/products",     // Product listing is public
    "/api/orders",       // Guest can create & view orders
    "/api/payments",     // Guest can make payments
    "/api/tables/validate", // Table QR validation is public
  ];
  const isPublicApiRoute = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Allow all public routes
  if (isCustomerRoute || isPublicRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  // Redirect /products to /menu (old route → new route)
  if (pathname.startsWith("/products")) {
    return NextResponse.redirect(new URL("/menu", request.url));
  }

  // ============================================
  // PROTECTED ROUTES — Authentication required
  // ============================================

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = await verifyToken(token);
    const userRole = payload.role;

    // Owner routes — only OWNER
    if (pathname.startsWith("/owner")) {
      if (userRole !== "OWNER") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.next();
    }

    // Admin routes — only ADMIN (OWNER redirected to /owner)
    if (pathname.startsWith("/admin")) {
      if (userRole === "OWNER") {
        return NextResponse.redirect(new URL("/owner", request.url));
      }
      if (userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.next();
    }

    // Kasir routes — only KASIR (and ADMIN), OWNER blocked
    if (pathname.startsWith("/kasir")) {
      if (userRole === "OWNER") {
        return NextResponse.redirect(new URL("/owner", request.url));
      }
      if (userRole !== "KASIR" && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
