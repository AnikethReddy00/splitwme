import { NextResponse } from "next/server";
import { findUserByUsername, validateUsername } from "@/lib/users";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || "";

    const val = validateUsername(username);
    if (!val.valid) {
      return NextResponse.json({
        available: false,
        valid: false,
        error: val.error
      });
    }

    const existing = findUserByUsername(val.sanitized);
    if (existing) {
      return NextResponse.json({
        available: false,
        valid: true,
        sanitized: val.sanitized,
        error: `@${val.sanitized} is already taken.`
      });
    }

    return NextResponse.json({
      available: true,
      valid: true,
      sanitized: val.sanitized,
      message: `@${val.sanitized} is available!`
    });
  } catch (error) {
    console.error("Check username error:", error);
    return NextResponse.json(
      { available: false, valid: false, error: "Validation error" },
      { status: 500 }
    );
  }
}
