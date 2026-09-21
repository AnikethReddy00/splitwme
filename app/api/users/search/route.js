import { NextResponse } from "next/server";
import { searchUsersBinary } from "@/lib/users";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Perform Binary Search Prefix Lookup on sorted indexes
    const users = searchUsersBinary(query, limit);

    return NextResponse.json({
      success: true,
      query,
      count: users.length,
      users
    });
  } catch (error) {
    console.error("Directory search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search directory" },
      { status: 500 }
    );
  }
}
