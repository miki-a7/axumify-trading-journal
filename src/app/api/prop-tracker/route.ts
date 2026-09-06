import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function serializePropAccount(acc: any) {
  return {
    ...acc,
    accountSize: Number(acc.accountSize),
    startingBalance: Number(acc.startingBalance),
    currentBalance: Number(acc.currentBalance),
    profitTarget: Number(acc.profitTarget),
    maxDailyLoss: Number(acc.maxDailyLoss),
    maxTotalDrawdown: Number(acc.maxTotalDrawdown),
    currentDrawdown: Number(acc.currentDrawdown),
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propAccounts = await db.propAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ propAccounts: propAccounts.map(serializePropAccount) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const size = Number(body.accountSize);

    const propAccount = await db.propAccount.create({
      data: {
        userId: user.id,
        firmName: body.firmName,
        accountSize: size,
        startingBalance: size,
        currentBalance: Number(body.currentBalance ?? size),
        profitTarget: Number(body.profitTarget ?? size * 0.1),
        maxDailyLoss: Number(body.maxDailyLoss ?? size * 0.05),
        maxTotalDrawdown: Number(body.maxTotalDrawdown ?? size * 0.1),
        currentDrawdown: Number(body.currentDrawdown ?? 0),
        status: body.status || "EVALUATION",
      },
    });

    return NextResponse.json({ propAccount: serializePropAccount(propAccount) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    const existing = await db.propAccount.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Prop account not found" }, { status: 404 });
    }

    const updated = await db.propAccount.update({
      where: { id },
      data: {
        ...(body.firmName !== undefined && { firmName: body.firmName }),
        ...(body.accountSize !== undefined && { accountSize: Number(body.accountSize) }),
        ...(body.startingBalance !== undefined && { startingBalance: Number(body.startingBalance) }),
        ...(body.currentBalance !== undefined && { currentBalance: Number(body.currentBalance) }),
        ...(body.profitTarget !== undefined && { profitTarget: Number(body.profitTarget) }),
        ...(body.maxDailyLoss !== undefined && { maxDailyLoss: Number(body.maxDailyLoss) }),
        ...(body.maxTotalDrawdown !== undefined && { maxTotalDrawdown: Number(body.maxTotalDrawdown) }),
        ...(body.currentDrawdown !== undefined && { currentDrawdown: Number(body.currentDrawdown) }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    return NextResponse.json({ propAccount: serializePropAccount(updated) });
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
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    const existing = await db.propAccount.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Prop account not found" }, { status: 404 });
    }

    await db.propAccount.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
