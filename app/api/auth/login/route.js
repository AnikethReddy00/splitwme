import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/users";
import { signToken } from "@/lib/jwt";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Build JWT payload
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      upiId: user.upiId,
      avatar: user.avatar
    };

    const token = await signToken(tokenPayload, "7d");

    // Prepare safe user object (omit password)
    const { password: _, ...safeUser } = user;

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: safeUser,
      token
    });

    // Set HttpOnly Cookie for session persistence
    response.cookies.set({
      name: "splitwme_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Internal server error during login" },
      { status: 500 }
    );
  }
}
