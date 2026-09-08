import { NextResponse } from "next/server";
import { removeMemberFromGroup } from "@/lib/groupStore";

export async function DELETE(request, { params }) {
  try {
    const { groupId, memberName } = await params;
    const decodedMemberName = decodeURIComponent(memberName);

    const result = removeMemberFromGroup(groupId, decodedMemberName);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Removed ${decodedMemberName}`, group: result.group });
  } catch (err) {
    console.error("Remove member error:", err);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
