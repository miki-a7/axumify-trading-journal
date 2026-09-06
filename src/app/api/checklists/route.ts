import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

    if (body.checklistId && body.itemText) {
      const checklist = await db.checklist.findFirst({ where: { id: body.checklistId, userId: user.id }, include: { items: true } });
      if (!checklist) return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
      const item = await db.checklistItem.create({ data: { checklistId: checklist.id, text: String(body.itemText).trim(), order: checklist.items.length + 1 } });
      return NextResponse.json({ item }, { status: 201 });
    }

    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json({ error: "Checklist title is required" }, { status: 400 });
    }

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
    const { id, itemId, checked, text, order, title } = body;

    if (id && title) {
      const checklist = await db.checklist.findFirst({ where: { id, userId: user.id } });
      if (!checklist) return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
      const updatedChecklist = await db.checklist.update({ where: { id }, data: { title: String(title).trim() } });
      return NextResponse.json({ checklist: updatedChecklist });
    }

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const item = await db.checklistItem.findFirst({
      where: {
        id: itemId,
        checklist: { userId: user.id },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updated = await db.checklistItem.update({
      where: { id: itemId },
      data: {
        ...(checked !== undefined && { checked }),
        ...(text !== undefined && { text }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });

    return NextResponse.json({ item: updated });
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
    const itemId = searchParams.get("itemId");

    if (itemId) {
      const item = await db.checklistItem.findFirst({
        where: {
          id: itemId,
          checklist: { userId: user.id },
        },
      });

      if (!item) {
        return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
      }

      await db.checklistItem.delete({
        where: { id: itemId },
      });

      return NextResponse.json({ success: true });
    }

    if (id) {
      const checklist = await db.checklist.findFirst({
        where: { id, userId: user.id },
      });

      if (!checklist) {
        return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
      }

      await db.checklist.deleteMany({
        where: { id, userId: user.id },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "id or itemId is required" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
