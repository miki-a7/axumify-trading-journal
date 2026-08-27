import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propAccounts = await db.propAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ propAccounts });
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
        currentBalance: Number(body.currentBalance || size),
        profitTarget: Number(body.profitTarget || size * 0.1),
        maxDailyLoss: Number(body.maxDailyLoss || size * 0.05),
        maxTotalDrawdown: Number(body.maxTotalDrawdown || size * 0.1),
        currentDrawdown: Number(body.currentDrawdown || 0),
        status: body.status || "EVALUATION",
      },
    });

    return NextResponse.json({ propAccount }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
