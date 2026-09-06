import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ConfigType = "system" | "setup" | "concept" | "entryModel" | "session" | "instrument" | "tag";

const configTypes: ConfigType[] = ["system", "setup", "concept", "entryModel", "session", "instrument", "tag"];

function isConfigType(value: unknown): value is ConfigType {
  return typeof value === "string" && configTypes.includes(value as ConfigType);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [systems, setups, concepts, entryModels, sessions, instruments, tags, checklists, rules] = await Promise.all([
    db.tradingSystem.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    db.tradingSetup.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    db.tradingConcept.findMany({ where: { userId: user.id, isActive: true }, orderBy: { name: "asc" } }),
    db.entryModel.findMany({ where: { userId: user.id, isActive: true }, orderBy: { name: "asc" } }),
    db.tradingSession.findMany({ where: { userId: user.id, isActive: true }, orderBy: { name: "asc" } }),
    db.tradingInstrument.findMany({ where: { userId: user.id, isActive: true }, orderBy: { symbol: "asc" } }),
    db.methodologyTag.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    db.checklist.findMany({ where: { userId: user.id }, include: { items: { orderBy: { order: "asc" } } }, orderBy: { createdAt: "asc" } }),
    db.tradingRule.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
  ]);

  return NextResponse.json({ systems, setups, concepts, entryModels, sessions, instruments, tags, checklists, rules });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.action === "starter-ict") return createIctTemplate(user.id);

  const type = body.type as ConfigType;
  if (!isConfigType(type)) return NextResponse.json({ error: "Invalid configuration type" }, { status: 400 });

  try {
    const name = text(body.name);
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const systemId = text(body.systemId);
    if (systemId && !(await db.tradingSystem.findFirst({ where: { id: systemId, userId: user.id } }))) {
      return NextResponse.json({ error: "Trading system not found" }, { status: 404 });
    }
    const checklistId = text(body.checklistId);
    if (checklistId && !(await db.checklist.findFirst({ where: { id: checklistId, userId: user.id } }))) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }

    if (type === "system") {
      return NextResponse.json({ item: await db.tradingSystem.create({ data: { userId: user.id, name, description: text(body.description) } }) }, { status: 201 });
    }
    if (type === "setup") {
      return NextResponse.json({ item: await db.tradingSetup.create({ data: { userId: user.id, systemId, name, description: text(body.description), market: text(body.market), timeframe: text(body.timeframe), entryConditions: text(body.entryConditions), confirmation: text(body.confirmation), invalidation: text(body.invalidation), targetLogic: text(body.targetLogic), checklistId } }) }, { status: 201 });
    }
    if (type === "concept") {
      return NextResponse.json({ item: await db.tradingConcept.create({ data: { userId: user.id, systemId: text(body.systemId), name, description: text(body.description) } }) }, { status: 201 });
    }
    if (type === "entryModel") {
      return NextResponse.json({ item: await db.entryModel.create({ data: { userId: user.id, systemId: text(body.systemId), name, description: text(body.description) } }) }, { status: 201 });
    }
    if (type === "session") {
      return NextResponse.json({ item: await db.tradingSession.create({ data: { userId: user.id, name, timezone: text(body.timezone) } }) }, { status: 201 });
    }
    if (type === "instrument") {
      return NextResponse.json({ item: await db.tradingInstrument.create({ data: { userId: user.id, symbol: name.toUpperCase(), market: text(body.market) || "CUSTOM" } }) }, { status: 201 });
    }
    return NextResponse.json({ item: await db.methodologyTag.create({ data: { userId: user.id, name } }) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.code === "P2002" ? "That configuration already exists" : error.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const type = body.type as ConfigType;
  if (!isConfigType(type) || !text(body.id)) return NextResponse.json({ error: "Type and id are required" }, { status: 400 });

  try {
    const id = body.id as string;
    const data = Object.fromEntries(Object.entries(body).filter(([key, value]) => !["id", "type", "userId"].includes(key) && value !== undefined));
    if (typeof data.systemId === "string" && !(await db.tradingSystem.findFirst({ where: { id: data.systemId, userId: user.id } }))) {
      return NextResponse.json({ error: "Trading system not found" }, { status: 404 });
    }
    if (typeof data.checklistId === "string" && !(await db.checklist.findFirst({ where: { id: data.checklistId, userId: user.id } }))) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }
    const model = type === "system" ? db.tradingSystem : type === "setup" ? db.tradingSetup : type === "concept" ? db.tradingConcept : type === "entryModel" ? db.entryModel : type === "session" ? db.tradingSession : type === "instrument" ? db.tradingInstrument : db.methodologyTag;
    const existing = await (model as any).findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    const item = await (model as any).update({ where: { id }, data });
    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const type = body.type || new URL(req.url).searchParams.get("type");
  const id = body.id || new URL(req.url).searchParams.get("id");
  if (!isConfigType(type) || !id) return NextResponse.json({ error: "Type and id are required" }, { status: 400 });

  const model = type === "system" ? db.tradingSystem : type === "setup" ? db.tradingSetup : type === "concept" ? db.tradingConcept : type === "entryModel" ? db.entryModel : type === "session" ? db.tradingSession : type === "instrument" ? db.tradingInstrument : db.methodologyTag;
  const existing = await (model as any).findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
  await (model as any).delete({ where: { id } });
  return NextResponse.json({ success: true });
}

async function createIctTemplate(userId: string) {
  const existing = await db.tradingSystem.findFirst({ where: { userId, name: "ICT" } });
  if (existing) return NextResponse.json({ error: "ICT starter system already exists" }, { status: 409 });

  const system = await db.tradingSystem.create({
    data: {
      userId,
      name: "ICT",
      description: "Optional ICT starter methodology. Edit or remove it to fit your process.",
      concepts: { create: ["Fair Value Gap (FVG)", "Order Block", "Liquidity Sweep", "Market Structure Shift (MSS)"].map((name) => ({ userId, name })) },
      entryModels: { create: [{ userId, name: "FVG Retest" }, { userId, name: "MSS + Displacement" }] },
      setups: { create: [{ userId, name: "Liquidity Sweep + FVG", description: "Starter setup; customize its conditions and invalidation." }] },
    },
    include: { concepts: true, entryModels: true, setups: true },
  });
  return NextResponse.json({ system }, { status: 201 });
}
