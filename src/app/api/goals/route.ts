import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rawGoals = await db.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const goals = rawGoals.map((g) => ({
      ...g,
      targetValue: Number(g.targetValue),
      currentValue: Number(g.currentValue),
    }));

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

    const created = await db.goal.create({
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

    const goal = {
      ...created,
      targetValue: Number(created.targetValue),
      currentValue: Number(created.currentValue),
    };

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
    const { id, title, targetValue, currentValue, unit, deadline, isCompleted } = body;

    if (!id) {
      return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
    }

    const existing = await db.goal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const updated = await db.goal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(targetValue !== undefined && { targetValue: Number(targetValue) }),
        ...(currentValue !== undefined && { currentValue: Number(currentValue) }),
        ...(unit !== undefined && { unit }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(isCompleted !== undefined && { isCompleted }),
      },
    });

    const goal = {
      ...updated,
      targetValue: Number(updated.targetValue),
      currentValue: Number(updated.currentValue),
    };

    return NextResponse.json({ goal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
    }

    const goal = await db.goal.findFirst({
      where: { id, userId: user.id },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    await db.goal.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
