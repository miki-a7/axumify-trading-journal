import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goals = await db.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ goals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const goal = await db.goal.create({
      data: {
        userId: user.id,
        title: body.title,
        targetValue: Number(body.targetValue),
        currentValue: Number(body.currentValue || 0),
        unit: body.unit || "Trades",
        deadline: body.deadline ? new Date(body.deadline) : null,
        isCompleted: body.isCompleted || false,
      },
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, currentValue, isCompleted } = body;

    const goal = await db.goal.update({
      where: { id },
      data: {
        ...(currentValue !== undefined && { currentValue: Number(currentValue) }),
        ...(isCompleted !== undefined && { isCompleted }),
      },
    });

    return NextResponse.json({ goal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
