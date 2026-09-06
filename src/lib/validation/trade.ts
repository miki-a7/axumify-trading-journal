import { z } from "zod";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined || isNaN(Number(val)) ? undefined : Number(val)),
  z.number().optional()
);

const optionalPositiveNumber = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    if (isNaN(num)) return undefined;
    return num;
  },
  z.number().positive("Value must be a positive number").nullable().optional().default(null)
);

const normalizeGrade = (val: any) => {
  if (val === "" || val === null || val === undefined || val === "NONE") return null;
  if (val === "A+") return "A_PLUS";
  if (val === "B+") return "B_PLUS";
  return val;
};

export const tradeBaseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  instrument: z.string().min(1, "Instrument is required (e.g. EURUSD, NAS100)"),
  market: z.string().min(1).default("CUSTOM"),
  session: z.string().min(1, "Session is required"),
  direction: z.enum(["LONG", "SHORT"]).default("LONG"),
  timeframe: z.string().default("15m"),

  entryPrice: optionalNumber.nullable().default(null),
  stopLoss: optionalNumber.nullable().default(null),
  takeProfit: optionalNumber.nullable().default(null),
  exitPrice: optionalNumber.nullable().default(null),
  positionSize: optionalNumber.nullable().default(null),
  riskAmount: optionalNumber.nullable().default(null),
  riskPercentage: optionalNumber.nullable().default(null),
  // plannedRR kept internally for DB backward-compat; not exposed to UI as "Planned R:R"
  plannedRR: optionalPositiveNumber.default(2.0),
  possibleRR: optionalPositiveNumber,
  actualR: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const num = Number(val);
      if (isNaN(num)) return undefined;
      return Math.abs(num);
    },
    z.number().min(0, "RR must be zero or positive").nullable().optional()
  ),
  pnl: optionalNumber.default(0),
  
  // Execution Metrics
  mae: optionalNumber.nullable().default(null),
  mfe: optionalNumber.nullable().default(null),
  commission: optionalNumber.nullable().default(null),
  fees: optionalNumber.nullable().default(null),
  swap: optionalNumber.nullable().default(null),
  slippage: optionalNumber.nullable().default(null),

  result: z.enum(["WIN", "LOSS", "BREAKEVEN"]).default("WIN"),
  grade: z.preprocess(normalizeGrade, z.enum(["A_PLUS", "A", "B_PLUS", "B", "C", "D", "F"]).nullable()).optional().default(null),

  // ICT Concepts & Setup
  ictConcepts: z.array(z.string()).default([]),
  setup: z.string().optional().default(""),
  customTags: z.array(z.string()).default([]),

  // Confluence Fields
  gc: z.string().optional().default(""), // General Confluence (HTF Context)
  ec: z.string().optional().default(""), // Execution Confluence (LTF Trigger)

  // Trade Plan Section
  htfBias: z.string().optional().default(""),
  marketCondition: z.string().optional().default(""),
  liquidityTarget: z.string().optional().default(""),
  entryModel: z.string().optional().default(""),
  confirmation: z.string().optional().default(""),
  invalidation: z.string().optional().default(""),
  targetReason: z.string().optional().default(""),
  reasonForEntry: z.string().optional().default(""),

  // Trade Psychology Ratings (1-5)
  psychConfidence: z.coerce.number().min(1).max(5).default(3),
  psychPatience: z.coerce.number().min(1).max(5).default(3),
  psychFear: z.coerce.number().min(1).max(5).default(1),
  psychGreed: z.coerce.number().min(1).max(5).default(1),
  psychFOMO: z.coerce.number().min(1).max(5).default(1),
  psychRevenge: z.coerce.number().min(1).max(5).default(1),
  psychDiscipline: z.coerce.number().min(1).max(5).default(4),
  psychStress: z.coerce.number().min(1).max(5).default(2),

  emotionBefore: z.string().optional().default(""),
  emotionDuring: z.string().optional().default(""),
  emotionAfter: z.string().optional().default(""),
  followedPlan: z.boolean().default(true),
  brokeRule: z.boolean().default(false),
  enteredTooEarly: z.boolean().default(false),
  movedSL: z.boolean().default(false),
  closedEarly: z.boolean().default(false),
  overtraded: z.boolean().default(false),

  mistakes: z.array(z.string()).default([]),
  positives: z.array(z.string()).default([]),
  notes: z.string().optional().default(""),

  images: z.array(
    z.object({
      type: z.enum(["BEFORE_ENTRY", "ENTRY", "AFTER_TRADE"]).default("ENTRY"),
      url: z.string(),
      caption: z.string().optional().default(""),
    })
  ).default([]),
});

export const tradeSchema = tradeBaseSchema.refine(
  (data) => {
    if (
      data.entryPrice !== undefined &&
      data.entryPrice !== null &&
      data.stopLoss !== undefined &&
      data.stopLoss !== null
    ) {
      return Math.abs(data.entryPrice - data.stopLoss) > 0;
    }
    return true;
  },
  {
    message: "Stop Loss cannot be equal to Entry Price",
    path: ["stopLoss"],
  }
);

export type TradeFormInput = z.infer<typeof tradeSchema>;
export const tradeUpdateSchema = tradeBaseSchema.partial();
export type TradeUpdateInput = z.infer<typeof tradeUpdateSchema>;

export function serializeTrade(t: any) {
  if (!t) return null;
  return {
    ...t,
    entryPrice: t.entryPrice !== null && t.entryPrice !== undefined ? Number(t.entryPrice) : null,
    stopLoss: t.stopLoss !== null && t.stopLoss !== undefined ? Number(t.stopLoss) : null,
    takeProfit: t.takeProfit !== null && t.takeProfit !== undefined ? Number(t.takeProfit) : null,
    exitPrice: t.exitPrice !== null && t.exitPrice !== undefined ? Number(t.exitPrice) : null,
    positionSize: t.positionSize !== null && t.positionSize !== undefined ? Number(t.positionSize) : null,
    riskAmount: t.riskAmount !== null && t.riskAmount !== undefined ? Number(t.riskAmount) : 300,
    riskPercentage: t.riskPercentage !== null && t.riskPercentage !== undefined ? Number(t.riskPercentage) : null,
    plannedRR: t.plannedRR !== null && t.plannedRR !== undefined ? Math.abs(Number(t.plannedRR)) : 2.0,
    possibleRR: t.possibleRR !== null && t.possibleRR !== undefined ? Number(t.possibleRR) : null,
    actualR: t.actualR !== null && t.actualR !== undefined ? Math.abs(Number(t.actualR)) : 0,
    pnl: t.pnl !== null && t.pnl !== undefined ? Number(t.pnl) : 0,
    result:
      t.result ||
      (Number(t.pnl) > 0 ? "WIN" : Number(t.pnl) < 0 ? "LOSS" : "BREAKEVEN"),
    mae: t.mae !== null && t.mae !== undefined ? Number(t.mae) : null,
    mfe: t.mfe !== null && t.mfe !== undefined ? Number(t.mfe) : null,
    commission: t.commission !== null && t.commission !== undefined ? Number(t.commission) : null,
    fees: t.fees !== null && t.fees !== undefined ? Number(t.fees) : null,
    swap: t.swap !== null && t.swap !== undefined ? Number(t.swap) : null,
    slippage: t.slippage !== null && t.slippage !== undefined ? Number(t.slippage) : null,
    gc: t.gc || "",
    ec: t.ec || "",
    isShared: Boolean(t.isShared),
    shareToken: t.shareToken || null,
    sharedAt: t.sharedAt || null,
  };
}
