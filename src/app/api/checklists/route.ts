import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const checklists = await db.checklist.findMany({
      where: { userId: user.id },
      include: { items: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ checklists });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const checklist = await db.checklist.create({
      data: {
        userId: user.id,
        title: body.title,
        category: body.category || "PRE_MARKET",
        items: {
          create: (body.items || []).map((text: string, index: number) => ({
            text,
            checked: false,
            order: index + 1,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ checklist }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { itemId, checked } = body;

    const item = await db.checklistItem.update({
      where: { id: itemId },
      data: { checked },
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
