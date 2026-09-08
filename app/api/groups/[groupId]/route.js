import { NextResponse } from "next/server";
import { getGroupById, updateGroup, deleteGroup } from "@/lib/groupStore";

export async function GET(request, { params }) {
  const { groupId } = await params;
  const group = getGroupById(groupId);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, group });
}

export async function PUT(request, { params }) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const { name, category } = body;

    const result = updateGroup(groupId, { name, category });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, group: result.group });
  } catch (err) {
    console.error("Update group error:", err);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { groupId } = await params;
    const result = deleteGroup(groupId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Group deleted successfully" });
  } catch (err) {
    console.error("Delete group error:", err);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}
