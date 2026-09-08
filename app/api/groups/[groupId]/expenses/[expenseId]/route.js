import { NextResponse } from "next/server";
import { updateExpenseInGroup, deleteExpenseFromGroup } from "@/lib/groupStore";

export async function PUT(request, { params }) {
  try {
    const { groupId, expenseId } = await params;
    const body = await request.json();

    const result = updateExpenseInGroup(groupId, expenseId, body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, expense: result.expense, group: result.group });
  } catch (err) {
    console.error("Update expense error:", err);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { groupId, expenseId } = await params;
    const result = deleteExpenseFromGroup(groupId, expenseId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Expense deleted successfully", group: result.group });
  } catch (err) {
    console.error("Delete expense error:", err);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
