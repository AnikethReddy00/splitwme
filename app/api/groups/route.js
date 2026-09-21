import { NextResponse } from "next/server";
import { getAllGroups, createGroup } from "@/lib/groupStore";

export async function GET() {
  const groups = getAllGroups();
  return NextResponse.json({ success: true, groups });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, category, creatorName, creatorUpi, creatorAvatar, members, memberDetails } = body;

    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const newGroup = createGroup({
      name,
      category,
      creatorName: creatorName || "Aniketh Reddy",
      creatorUpi: creatorUpi || "aniketh@okhdfcbank",
      creatorAvatar: creatorAvatar || null,
      members: members || [],
      memberDetails: memberDetails || {}
    });

    return NextResponse.json({ success: true, group: newGroup });
  } catch (err) {
    console.error("Create group error:", err);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
