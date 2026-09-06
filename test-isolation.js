#!/usr/bin/env node
/**
 * Multi-user isolation tests (Prisma layer).
 * Run: node test-isolation.js
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("AXUMIFY Multi-User Isolation Tests\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ ${message}`);
      failed++;
    }
  }

  const userA = await prisma.user.upsert({
    where: { email: "isolation-a@axumify.test" },
    update: {},
    create: { email: "isolation-a@axumify.test", name: "User A" },
  });

  const userB = await prisma.user.upsert({
    where: { email: "isolation-b@axumify.test" },
    update: {},
    create: { email: "isolation-b@axumify.test", name: "User B" },
  });

  const tradeA = await prisma.trade.create({
    data: {
      userId: userA.id,
      date: new Date(),
      instrument: "EURUSD",
      direction: "LONG",
      result: "WIN",
      actualR: 2,
      pnl: 600,
      plannedRR: 2,
      gc: "User A GC",
      ec: "User A EC",
    },
  });

  const tradeB = await prisma.trade.create({
    data: {
      userId: userB.id,
      date: new Date(),
      instrument: "GBPUSD",
      direction: "SHORT",
      result: "WIN",
      actualR: 3,
      pnl: 900,
      plannedRR: 3,
      gc: "User B GC",
      ec: "User B EC",
    },
  });

  const aTrades = await prisma.trade.findMany({ where: { userId: userA.id } });
  const bTrades = await prisma.trade.findMany({ where: { userId: userB.id } });

  assert(aTrades.every((t) => t.userId === userA.id), "User A only sees own trades");
  assert(bTrades.every((t) => t.userId === userB.id), "User B only sees own trades");
  assert(!aTrades.some((t) => t.id === tradeB.id), "User A cannot see User B trade");
  assert(!bTrades.some((t) => t.id === tradeA.id), "User B cannot see User A trade");

  const crossLookup = await prisma.trade.findFirst({
    where: { id: tradeB.id, userId: userA.id },
  });
  assert(crossLookup === null, "Cross-user trade lookup returns null");

  const token = require("crypto").randomBytes(16).toString("hex");
  await prisma.trade.update({
    where: { id: tradeA.id },
    data: { isShared: true, shareToken: token, sharedAt: new Date() },
  });

  const publicTrade = await prisma.trade.findUnique({ where: { shareToken: token } });
  assert(publicTrade?.id === tradeA.id, "Share token exposes only intended trade");
  assert(publicTrade?.userId === userA.id, "Shared trade belongs to owner");

  await prisma.trade.delete({ where: { id: tradeA.id } });
  await prisma.trade.delete({ where: { id: tradeB.id } });
  await prisma.user.delete({ where: { id: userA.id } });
  await prisma.user.delete({ where: { id: userB.id } });

  console.log(`\nTOTAL: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
