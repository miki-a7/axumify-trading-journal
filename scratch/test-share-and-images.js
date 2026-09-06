const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING AXUMIFY SCREENSHOT, SHARING & GC/EC TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Setup test user
    const testUser = await prisma.user.upsert({
      where: { email: "share-test@axumify.com" },
      update: {},
      create: {
        email: "share-test@axumify.com",
        name: "Share Tester",
        timezone: "UTC",
        currency: "USD",
      },
    });
    assert(testUser && testUser.id, "Test user created/found");

    // 2. Create trade with GC, EC, and images
    const trade = await prisma.trade.create({
      data: {
        userId: testUser.id,
        date: new Date(),
        instrument: "EURUSD",
        market: "FOREX",
        session: "New York",
        direction: "SHORT",
        entryPrice: 1.08500,
        stopLoss: 1.08700,
        takeProfit: 1.07900,
        plannedRR: 3.0,
        actualR: 3.0,
        pnl: 900.0,
        result: "WIN",
        grade: "A_PLUS",
        gc: "Daily Bearish FVG + Weekly DOL",
        ec: "1m MSS with displacement into 15m FVG",
        setup: "Liquidity Sweep + FVG",
        images: {
          create: [
            {
              type: "ENTRY",
              url: "screenshots/user_123/screenshot_123.png",
              caption: "TradingView 15m Chart",
            },
            {
              type: "AFTER_TRADE",
              url: "https://example.com/chart-after.png",
              caption: "After Exit 3R Hit",
            },
          ],
        },
      },
      include: { images: true },
    });

    assert(trade.id, "Trade created with DB ID");
    assert(trade.gc === "Daily Bearish FVG + Weekly DOL", "GC (General Confluence) persisted correctly");
    assert(trade.ec === "1m MSS with displacement into 15m FVG", "EC (Execution Confluence) persisted correctly");
    assert(trade.images.length === 2, "Trade images associated correctly with tradeId");
    assert(trade.images[0].url === "screenshots/user_123/screenshot_123.png", "Storage path stored in TradeImage");

    // 3. Test Sharing Flow
    // 3a. Initially isShared should be false
    assert(trade.isShared === false, "isShared is initially false");
    assert(trade.shareToken === null, "shareToken is initially null");

    // 3b. Enable sharing with generated token
    const crypto = require("crypto");
    const generatedToken = crypto.randomBytes(16).toString("hex");

    const sharedTrade = await prisma.trade.update({
      where: { id: trade.id },
      data: {
        isShared: true,
        shareToken: generatedToken,
        sharedAt: new Date(),
      },
      include: { images: true },
    });

    assert(sharedTrade.isShared === true, "isShared enabled");
    assert(sharedTrade.shareToken === generatedToken, "shareToken assigned properly");
    assert(sharedTrade.sharedAt instanceof Date, "sharedAt timestamp set");

    // 3c. Public lookup simulation (by shareToken where isShared === true)
    const publicLookup = await prisma.trade.findUnique({
      where: { shareToken: generatedToken },
      include: { images: true },
    });

    assert(publicLookup !== null && publicLookup.isShared === true, "Public lookup finds trade by token");
    assert(publicLookup.gc === trade.gc, "Public lookup contains GC");
    assert(publicLookup.ec === trade.ec, "Public lookup contains EC");
    assert(publicLookup.images.length === 2, "Public lookup returns images");

    // 3d. Revoke sharing
    const revokedTrade = await prisma.trade.update({
      where: { id: trade.id },
      data: {
        isShared: false,
        shareToken: null,
        sharedAt: null,
      },
    });

    assert(revokedTrade.isShared === false, "isShared successfully revoked");
    assert(revokedTrade.shareToken === null, "shareToken removed upon revoke");

    // 3e. Lookup with old token should return nothing
    const lookupAfterRevoke = await prisma.trade.findUnique({
      where: { shareToken: generatedToken },
    });
    assert(lookupAfterRevoke === null, "Revoked token lookup returns null");

    // 4. Cleanup test trade and user
    await prisma.trade.delete({ where: { id: trade.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    assert(true, "Cleanup completed successfully");

  } catch (err) {
    console.error("Test error:", err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log("==================================================");
  console.log(`TOTAL: ${passed} passed, ${failed} failed`);
  console.log("==================================================");
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
