import { z } from "zod";

export const tradeSchema = z.object({
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  instrument: z.string().min(1, "Instrument is required (e.g. EURUSD, NAS100)"),
  market: z.enum(["FOREX", "INDICES", "CRYPTO", "STOCKS", "COMMODITIES"]),
  session: z.enum(["Asian", "London", "New York", "London Close", "Other"]),
  direction: z.enum(["LONG", "SHORT"]),
  timeframe: z.string().default("15m"),

  entryPrice: z.coerce.number().positive("Entry price must be greater than 0"),
  stopLoss: z.coerce.number().positive("Stop loss must be greater than 0"),
  takeProfit: z.coerce.number().positive("Take profit must be greater than 0"),
  exitPrice: z.coerce.number().optional(),
  positionSize: z.coerce.number().optional(),
  riskAmount: z.coerce.number().optional(),
  riskPercentage: z.coerce.number().optional(),
  plannedRR: z.coerce.number().optional(),
  actualR: z.coerce.number().optional(),
  pnl: z.coerce.number().optional(),
  
  // Execution Metrics
  mae: z.coerce.number().optional(),
  mfe: z.coerce.number().optional(),
  commission: z.coerce.number().optional(),
  fees: z.coerce.number().optional(),
  swap: z.coerce.number().optional(),
  slippage: z.coerce.number().optional(),

  result: z.enum(["WIN", "LOSS", "BREAKEVEN"]).default("BREAKEVEN"),
  grade: z.enum(["A_PLUS", "A", "B_PLUS", "B", "C", "D", "F"]).optional(),

  // ICT Concepts & Setup
  ictConcepts: z.array(z.string()).default([]),
  setup: z.string().optional(),
  customTags: z.array(z.string()).default([]),

  // Trade Plan Section
  htfBias: z.string().optional(),
  marketCondition: z.string().optional(),
  liquidityTarget: z.string().optional(),
  entryModel: z.string().optional(),
  confirmation: z.string().optional(),
  invalidation: z.string().optional(),
  targetReason: z.string().optional(),
  reasonForEntry: z.string().optional(),

  // Trade Psychology Ratings (1-5)
  psychConfidence: z.coerce.number().min(1).max(5).default(3),
  psychPatience: z.coerce.number().min(1).max(5).default(3),
  psychFear: z.coerce.number().min(1).max(5).default(1),
  psychGreed: z.coerce.number().min(1).max(5).default(1),
  psychFOMO: z.coerce.number().min(1).max(5).default(1),
  psychRevenge: z.coerce.number().min(1).max(5).default(1),
  psychDiscipline: z.coerce.number().min(1).max(5).default(4),
  psychStress: z.coerce.number().min(1).max(5).default(2),

  emotionBefore: z.string().optional(),
  emotionDuring: z.string().optional(),
  emotionAfter: z.string().optional(),
  followedPlan: z.boolean().default(true),
  brokeRule: z.boolean().default(false),
  enteredTooEarly: z.boolean().default(false),
  movedSL: z.boolean().default(false),
  closedEarly: z.boolean().default(false),
  overtraded: z.boolean().default(false),

  mistakes: z.array(z.string()).default([]),
  positives: z.array(z.string()).default([]),
  notes: z.string().optional(),

  images: z.array(
    z.object({
      type: z.enum(["BEFORE_ENTRY", "ENTRY", "AFTER_TRADE"]),
      url: z.string(),
      caption: z.string().optional(),
    })
  ).default([]),
});

export type TradeFormInput = z.infer<typeof tradeSchema>;
