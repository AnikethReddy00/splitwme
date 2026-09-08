import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { findUserById } from "@/lib/users";

export async function GET(request) {
  try {
    // Check Authorization header or Cookie
    let token = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      const cookie = request.cookies.get("splitwme_token");
      token = cookie?.value;
    }

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = findUserById(payload.id);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 404 });
    }

    const { password: _, ...safeUser } = user;

    return NextResponse.json({
      authenticated: true,
      user: safeUser
    });
  } catch (error) {
    console.error("Auth me check error:", error);
    return NextResponse.json({ authenticated: false, error: "Token error" }, { status: 500 });
  }
}
