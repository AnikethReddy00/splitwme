import { NextResponse } from "next/server";
import { addExpenseToGroup } from "@/lib/groupStore";

export async function POST(request, { params }) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const {
      title,
      amount,
      paidBy,
      splitBetween,
      category,
      date,
      memberShares,
      items,
      tax,
      serviceCharge,
      extraCharges
    } = body;

    if (!title || !amount) {
      return NextResponse.json(
        { error: "Title and amount are required" },
        { status: 400 }
      );
    }

    const result = addExpenseToGroup(groupId, {
      title,
      amount: Number(amount),
      paidBy,
      splitBetween,
      category,
      date,
      memberShares,
      items,
      tax,
      serviceCharge,
      extraCharges
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      expense: result.expense,
      group: result.group
    });
  } catch (err) {
    console.error("Add expense error:", err);
    return NextResponse.json(
      { error: "Failed to add expense" },
      { status: 500 }
    );
  }
}
