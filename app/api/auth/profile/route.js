import { NextResponse } from "next/server";
import { verifyToken, signToken } from "@/lib/jwt";
import { updateUserProfile, findUserById } from "@/lib/users";
import { getAllGroups } from "@/lib/groupStore";

export async function PUT(request) {
  try {
    let token = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      const cookie = request.cookies.get("splitwme_token");
      token = cookie?.value;
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { name, upiId, avatar, phone } = body;

    const oldUser = findUserById(payload.id);
    const oldName = oldUser?.name;

    const result = updateUserProfile(payload.id, { name, upiId, avatar, phone });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    const updatedUser = result.user;

    // Update references in all active groups if name or upiId changed
    const groups = getAllGroups();
    groups.forEach((group) => {
      if (oldName && group.members?.includes(oldName)) {
        if (name && name !== oldName) {
          group.members = group.members.map((m) => (m === oldName ? name : m));
          if (group.memberDetails && group.memberDetails[oldName]) {
            const oldDetails = group.memberDetails[oldName];
            delete group.memberDetails[oldName];
            group.memberDetails[name] = {
              ...oldDetails,
              upiId: upiId || oldDetails.upiId,
              avatar: avatar || oldDetails.avatar
            };
          }
          // Update in expenses
          group.expenses?.forEach((exp) => {
            if (exp.paidBy === oldName) exp.paidBy = name;
            if (exp.splitBetween?.includes(oldName)) {
              exp.splitBetween = exp.splitBetween.map((m) => (m === oldName ? name : m));
            }
          });
        } else if (upiId && group.memberDetails && group.memberDetails[oldName]) {
          group.memberDetails[oldName].upiId = upiId;
          if (avatar) group.memberDetails[oldName].avatar = avatar;
        }
      }
    });

    // Issue updated token
    const newToken = await signToken({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      upiId: updatedUser.upiId,
      avatar: updatedUser.avatar
    });

    const response = NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
      token: newToken
    });

    response.cookies.set({
      name: "splitwme_token",
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
