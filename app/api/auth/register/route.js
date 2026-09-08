import { NextResponse } from "next/server";
import { registerNewUser } from "@/lib/users";
import { signToken } from "@/lib/jwt";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, upiId, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const result = registerNewUser({ name, email, password, upiId, phone });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const user = result.user;
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      upiId: user.upiId,
      avatar: user.avatar
    };

    const token = await signToken(tokenPayload, "7d");
    const { password: _, ...safeUser } = user;

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: safeUser,
      token
    });

    response.cookies.set({
      name: "splitwme_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error) {
    console.error("Register route error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
