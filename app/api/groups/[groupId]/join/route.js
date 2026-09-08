import { NextResponse } from "next/server";
import { addMemberToGroup } from "@/lib/groupStore";
import { registerNewUser, findUserByEmail } from "@/lib/users";
import { signToken } from "@/lib/jwt";

export async function POST(request, { params }) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const { name, upiId, email } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required to join" }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanUpi = upiId ? upiId.trim() : `${cleanName.toLowerCase().replace(/\s+/g, "")}@upi`;
    const cleanEmail = email ? email.trim() : `${cleanName.toLowerCase().replace(/\s+/g, "")}@guest.splitwme.com`;

    // Add to group
    const result = addMemberToGroup(groupId, { name: cleanName, upiId: cleanUpi });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    // Auto-create or find user profile
    let user = findUserByEmail(cleanEmail);
    if (!user) {
      const reg = registerNewUser({
        name: cleanName,
        email: cleanEmail,
        password: "password123",
        upiId: cleanUpi
      });
      user = reg.user;
    }

    const token = await signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      upiId: user.upiId,
      avatar: user.avatar
    });

    const response = NextResponse.json({
      success: true,
      message: `Successfully joined ${result.group.name}!`,
      group: result.group,
      user,
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
  } catch (err) {
    console.error("Join group error:", err);
    return NextResponse.json({ error: "Failed to join group" }, { status: 500 });
  }
}
