import sharp from "sharp";
import Tesseract, { PSM } from "tesseract.js";

export interface DetectedTradeLevels {
  direction: "LONG" | "SHORT" | null;
  entryPrice: number | null;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  /** Detected Actual R:R magnitude (always positive). */
  actualR: number | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  rawText: string;
}

/**
 * Parses raw OCR text from a TradingView screenshot to detect trading levels
 */
export function parseTradingViewText(rawText: string): DetectedTradeLevels {
  const text = rawText || "";
  let direction: "LONG" | "SHORT" | null = null;
  let entryPrice: number | null = null;
  let exitPrice: number | null = null;
  let stopLoss: number | null = null;
  let takeProfit: number | null = null;
  let actualR: number | null = null;

  // 1. Detect Direction from explicit keywords
  if (/\b(short position|short|sell)\b/i.test(text)) {
    direction = "SHORT";
  } else if (/\b(long position|long|buy)\b/i.test(text)) {
    direction = "LONG";
  }

  // 2. Detect Risk/Reward ratio
  const rrMatch = text.match(/(?:risk[\s/-]*reward(?:[\s]*ratio)?|r[\s/:]*r|rr|ratio)[:\s]*([0-9]+(?:\.[0-9]+)?)/i);
  if (rrMatch && rrMatch[1]) {
    const val = parseFloat(rrMatch[1]);
    if (!isNaN(val) && val > 0 && val < 50) {
      actualR = Number(val.toFixed(2));
    }
  }

  // 3. Detect Named Price Levels (Stop, Target, Entry, Open)
  const stopMatch = text.match(/(?:stop(?:\s*loss)?|sl)[:\s]*([0-9]{1,6}(?:\.[0-9]{1,6})?)/i);
  if (stopMatch && stopMatch[1]) {
    const val = parseFloat(stopMatch[1]);
    if (!isNaN(val) && val > 0) stopLoss = val;
  }

  const targetMatch = text.match(/(?:target(?:\s*profit)?|take(?:\s*profit)?|tp|profit)[:\s]*([0-9]{1,6}(?:\.[0-9]{1,6})?)/i);
  if (targetMatch && targetMatch[1]) {
    const val = parseFloat(targetMatch[1]);
    if (!isNaN(val) && val > 0) takeProfit = val;
  }

  const entryMatch = text.match(/(?:entry(?:\s*price)?|open)[:\s]*([0-9]{1,6}(?:\.[0-9]{1,6})?)/i);
  if (entryMatch && entryMatch[1]) {
    const val = parseFloat(entryMatch[1]);
    if (!isNaN(val) && val > 0) entryPrice = val;
  }

  const exitMatch = text.match(/(?:exit(?:\s*price)?|close(?:d)?(?:\s*price)?|closing(?:\s*price)?)[:\s]*([0-9]{1,6}(?:\.[0-9]{1,6})?)/i);
  if (exitMatch && exitMatch[1]) {
    const val = parseFloat(exitMatch[1]);
    if (!isNaN(val) && val > 0) exitPrice = val;
  }

  // 4. Extract all floating point numbers that look like prices
  const priceMatches = text.match(/\b\d{1,6}\.\d{2,6}\b/g);
  if (priceMatches && priceMatches.length >= 2) {
    const candidatePrices = Array.from(new Set(priceMatches.map(Number)))
      .filter((n) => !isNaN(n) && n > 0)
      .sort((a, b) => a - b);

    if (candidatePrices.length === 3) {
      if (direction === "SHORT") {
        if (!stopLoss) stopLoss = candidatePrices[2]; // highest
        if (!entryPrice) entryPrice = candidatePrices[1]; // middle
        if (!takeProfit) takeProfit = candidatePrices[0]; // lowest
      } else if (direction === "LONG") {
        if (!stopLoss) stopLoss = candidatePrices[0]; // lowest
        if (!entryPrice) entryPrice = candidatePrices[1]; // middle
        if (!takeProfit) takeProfit = candidatePrices[2]; // highest
      } else {
        // Infer direction based on existing values if any
        if (stopLoss && entryPrice && stopLoss > entryPrice) {
          direction = "SHORT";
          if (!takeProfit) takeProfit = candidatePrices[0];
        } else {
          direction = "LONG";
          if (!stopLoss) stopLoss = candidatePrices[0];
          if (!entryPrice) entryPrice = candidatePrices[1];
          if (!takeProfit) takeProfit = candidatePrices[2];
        }
      }
    }
  }

  // 5. Sanity check / Direction inference from detected prices
  if (entryPrice !== null && stopLoss !== null && takeProfit !== null) {
    if (stopLoss > entryPrice && entryPrice > takeProfit) {
      direction = "SHORT";
    } else if (takeProfit > entryPrice && entryPrice > stopLoss) {
      direction = "LONG";
    }
  }

  // 6. Calculate Actual R:R from prices if not explicitly extracted
  if (!actualR && entryPrice !== null && stopLoss !== null && takeProfit !== null) {
    let riskDist = 0;
    let rewardDist = 0;
    if (direction === "SHORT") {
      riskDist = Math.abs(stopLoss - entryPrice);
      rewardDist = Math.abs(entryPrice - takeProfit);
    } else {
      riskDist = Math.abs(entryPrice - stopLoss);
      rewardDist = Math.abs(takeProfit - entryPrice);
    }
    if (riskDist > 0 && rewardDist > 0) {
      actualR = Number((rewardDist / riskDist).toFixed(2));
    }
  }

  // 7. Assess Confidence
  let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (stopLoss !== null && takeProfit !== null && (actualR !== null || entryPrice !== null)) {
    confidence = "HIGH";
  } else if (stopLoss !== null || takeProfit !== null || actualR !== null) {
    confidence = "MEDIUM";
  }

  return {
    direction,
    entryPrice,
    exitPrice,
    stopLoss,
    takeProfit,
    actualR,
    confidence,
    rawText: text.trim().substring(0, 500),
  };
}

/**
 * Advanced multi-pass image extractor for TradingView screenshots.
 * Inspects:
 * 1. Text annotations / summary cards
 * 2. Visual position tool (Red Risk zone vs Green/Cyan Reward zone)
 * 3. Right-axis vertical price scale labels and badges
 */
export async function extractTradeLevelsFromImage(imageBuffer: Buffer): Promise<DetectedTradeLevels> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 600;

    // Reuse one worker for both passes; creating a second worker reloads the language model.
    const worker = await Tesseract.createWorker("eng");

    // 1. First pass: downscaled OCR for explicit text labels
    let rawText = "";
    try {
      const ocrImage = await image
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      const fullOcrRes = await worker.recognize(ocrImage);
      rawText = fullOcrRes.data?.text || "";
    } catch {
      // Ignore if full OCR fails
    }

    const textDetected = parseTradingViewText(rawText);
    if (textDetected.confidence === "HIGH" && textDetected.entryPrice && textDetected.stopLoss && textDetected.takeProfit) {
      await worker.terminate();
      return textDetected;
    }

    // 2. Scan image pixels for Position Tool (Red/Risk zone vs Green/Reward zone)
    const rawPixels = await image.raw().toBuffer({ resolveWithObject: true });
    const data = rawPixels.data;
    const channels = rawPixels.info.channels;
    const chartWidth = Math.floor(width * 0.82);

    const redRows: number[] = [];
    const greenRows: number[] = [];

    for (let y = 0; y < height; y++) {
      let redCount = 0;
      let greenCount = 0;

      for (let x = 0; x < chartWidth; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Red/pink zone (Risk area in TradingView position tool)
        const isRed = (r > 195 && r > g + 25 && r > b + 25) || (r > 210 && g < 185 && b < 185) || (r > 240 && g > 160 && g < 225 && b > 160 && b < 225 && r > g + 30);
        // Green/cyan zone (Reward area in TradingView position tool)
        const isGreen = (g > 185 && b > 185 && r < 190) || (g > 195 && g > r + 25 && b > r + 15) || (g > 220 && b > 220 && r < 210);

        if (isRed) redCount++;
        if (isGreen) greenCount++;
      }

      if (redCount > 30) redRows.push(y);
      if (greenCount > 30) greenRows.push(y);
    }

    let toolDirection: "LONG" | "SHORT" | null = null;
    let toolSlY: number | null = null;
    let toolEntryY: number | null = null;
    let toolTpY: number | null = null;

    if (redRows.length > 0 || greenRows.length > 0) {
      const minRed = redRows.length > 0 ? Math.min(...redRows) : null;
      const maxRed = redRows.length > 0 ? Math.max(...redRows) : null;
      const minGreen = greenRows.length > 0 ? Math.min(...greenRows) : null;
      const maxGreen = greenRows.length > 0 ? Math.max(...greenRows) : null;

      if (minRed !== null && maxRed !== null && minGreen !== null && maxGreen !== null) {
        if (minRed < minGreen) {
          toolDirection = "SHORT";
          toolSlY = minRed;
          toolEntryY = (maxRed + minGreen) / 2;
          toolTpY = maxGreen;
        } else {
          toolDirection = "LONG";
          toolTpY = minGreen;
          toolEntryY = (maxGreen + minRed) / 2;
          toolSlY = maxRed;
        }
      } else if (minRed !== null && maxRed !== null) {
        toolDirection = "SHORT";
        toolSlY = minRed;
        toolEntryY = maxRed;
      }
    }

    // 3. Right Axis Crop and High-Res OCR
    const axisWidth = Math.round(width * 0.20);
    const axisLeft = width - axisWidth;
    const scaleFactor = 3;

    const croppedAxisBuf = await sharp(imageBuffer)
      .extract({ left: axisLeft, top: 0, width: axisWidth, height })
      .resize(axisWidth * scaleFactor, height * scaleFactor, { kernel: "lanczos3" })
      .grayscale()
      .normalise()
      .sharpen()
      .toBuffer();

    const axisOcrRes = await worker.recognize(croppedAxisBuf, {}, { hocr: true });

    const hocr = axisOcrRes.data.hocr || "";
    const wordRegex = /<span[^>]*class=['"]ocrx_word['"][^>]*title=['"]bbox\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)[^'"]*['"][^>]*>([^<]+)<\/span>/g;
    let match: RegExpExecArray | null;
    const axisPrices: Array<{ price: number; y: number; raw: string; type?: string }> = [];

    while ((match = wordRegex.exec(hocr)) !== null) {
      const [, , y0, , y1, rawWord] = match;
      const cleanWord = rawWord.trim().replace(/^[^\d.]+/, "").replace(/[^\d.]+$/, "");
      const parsed = parseFloat(cleanWord);
      if (!isNaN(parsed) && cleanWord.includes(".") && parsed > 0.00001 && parsed < 1000000) {
        const yCenter = (parseInt(y0) + parseInt(y1)) / (2 * scaleFactor);
        axisPrices.push({ price: parsed, y: yCenter, raw: cleanWord });
      }
    }

    // 4. Detect colored badge clusters on right vertical axis
    const rowBadgeTypes = new Array(height).fill("NONE");
    for (let y = 0; y < height; y++) {
      let redBadge = 0, greenBadge = 0, darkBadge = 0;
      for (let x = axisLeft; x < width; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        if (r > 170 && g < 110 && b < 110) redBadge++;
        else if (g > 120 && r < 110 && b < 150) greenBadge++;
        else if (r < 60 && g < 60 && b < 60) darkBadge++;
      }
      if (redBadge >= 15) rowBadgeTypes[y] = "RED";
      else if (greenBadge >= 15) rowBadgeTypes[y] = "GREEN";
      else if (darkBadge >= 25) rowBadgeTypes[y] = "DARK";
    }

    const clusters: Array<{ type: string; startY: number; endY: number }> = [];
    let curCluster: { type: string; startY: number; endY: number } | null = null;
    for (let y = 0; y < height; y++) {
      const type = rowBadgeTypes[y];
      if (type !== "NONE") {
        if (!curCluster || curCluster.type !== type || y > curCluster.endY + 2) {
          if (curCluster && curCluster.endY - curCluster.startY >= 6) clusters.push(curCluster);
          curCluster = { type, startY: y, endY: y };
        } else {
          curCluster.endY = y;
        }
      }
    }
    if (curCluster && curCluster.endY - curCluster.startY >= 6) clusters.push(curCluster);

    await worker.setParameters({
      tessedit_char_whitelist: "0123456789.",
      tessedit_pageseg_mode: PSM.SINGLE_LINE,
    });

    for (const cluster of clusters) {
      const padY = 2;
      const top = Math.max(0, cluster.startY - padY);
      const boxH = Math.min(height - top, (cluster.endY - cluster.startY + 1) + 2 * padY);
      const badgeBuf = await sharp(imageBuffer)
        .extract({ left: axisLeft, top, width: axisWidth, height: boxH })
        .resize(axisWidth * 4, boxH * 4, { kernel: "lanczos3" })
        .grayscale()
        .normalise()
        .sharpen()
        .toBuffer();

      const bRes = await worker.recognize(badgeBuf);
      const text = bRes.data.text.trim();
      let num = parseFloat(text);
      if (isNaN(num) || !text.includes(".")) {
        if (axisPrices.length > 0) {
          const ref = axisPrices[0].price;
          const digits = text.replace(/[^\d]/g, "");
          if (digits.length >= 4) {
            const guessed = parseFloat(digits.slice(0, 1) + "." + digits.slice(1));
            if (!isNaN(guessed) && Math.abs(guessed - ref) < ref * 0.5) {
              num = guessed;
            }
          }
        }
      }
      if (!isNaN(num) && num > 0.00001) {
        axisPrices.push({
          price: num,
          y: (cluster.startY + cluster.endY) / 2,
          raw: text,
          type: cluster.type,
        });
      }
    }

    await worker.terminate();

    // Deduplicate and sort axis prices by Y
    const uniquePrices: Array<{ price: number; y: number; raw: string; type?: string }> = [];
    axisPrices.sort((a, b) => a.y - b.y);
    for (const ap of axisPrices) {
      const existing = uniquePrices.find(u => Math.abs(u.y - ap.y) < 5 || Math.abs(u.price - ap.price) < 0.00001);
      if (!existing) {
        uniquePrices.push(ap);
      }
    }

    // 5. Derive Direction, Entry, Stop Loss, Take Profit
    let direction: "LONG" | "SHORT" | null = toolDirection || textDetected.direction;
    if (!direction) {
      if (/\b(short position|short|sell)\b/i.test(rawText)) direction = "SHORT";
      else if (/\b(long position|long|buy)\b/i.test(rawText)) direction = "LONG";
    }

    function findNearestPrice(targetY: number | null): number | null {
      if (targetY === null || uniquePrices.length === 0) return null;
      let closest: { price: number; y: number } | null = null;
      let minDiff = Infinity;
      for (const p of uniquePrices) {
        const diff = Math.abs(p.y - targetY);
        if (diff < minDiff) {
          minDiff = diff;
          closest = p;
        }
      }
      return closest ? closest.price : null;
    }

    let stopLoss: number | null = textDetected.stopLoss ?? findNearestPrice(toolSlY);
    let entryPrice: number | null = textDetected.entryPrice ?? findNearestPrice(toolEntryY);
    let takeProfit: number | null = textDetected.takeProfit ?? findNearestPrice(toolTpY);
    const exitPrice: number | null = textDetected.exitPrice;

    // Fallback using sorted right axis prices
    if (!entryPrice || !stopLoss) {
      if (uniquePrices.length >= 2) {
        if (direction === "SHORT") {
          if (!stopLoss) stopLoss = uniquePrices[0].price; // highest price on axis
          if (!entryPrice && uniquePrices.length >= 2) entryPrice = uniquePrices[1].price;
          if (!takeProfit && uniquePrices.length >= 3) takeProfit = uniquePrices[uniquePrices.length - 1].price;
        } else if (direction === "LONG") {
          if (!stopLoss) stopLoss = uniquePrices[uniquePrices.length - 1].price; // lowest price
          if (!entryPrice && uniquePrices.length >= 2) entryPrice = uniquePrices[uniquePrices.length - 2].price;
          if (!takeProfit && uniquePrices.length >= 3) takeProfit = uniquePrices[0].price;
        }
      }
    }

    // Direction auto-correction
    if (entryPrice && stopLoss && takeProfit) {
      if (stopLoss > entryPrice && entryPrice > takeProfit) {
        direction = "SHORT";
      } else if (takeProfit > entryPrice && entryPrice > stopLoss) {
        direction = "LONG";
      }
    }

    // Calculate Actual R:R
    let actualR: number | null = textDetected.actualR;
    if (!actualR && entryPrice && stopLoss && takeProfit) {
      const risk = Math.abs(entryPrice - stopLoss);
      const reward = Math.abs(entryPrice - takeProfit);
      if (risk > 0 && reward > 0) {
        actualR = Number((reward / risk).toFixed(2));
      }
    }

    let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";
    if (entryPrice && stopLoss && takeProfit) {
      confidence = "HIGH";
    } else if (entryPrice || stopLoss || takeProfit) {
      confidence = "MEDIUM";
    }

    return {
      direction: direction || "SHORT",
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      actualR,
      confidence,
      rawText: rawText.trim().substring(0, 500),
    };
  } catch (error) {
    console.error("extractTradeLevelsFromImage error:", error);
    return parseTradingViewText("");
  }
}

