import { NextResponse } from "next/server";
import { getGroupById } from "@/lib/groupStore";

export async function GET(request, { params }) {
  const { groupId } = await params;
  const group = getGroupById(groupId);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, group });
}
