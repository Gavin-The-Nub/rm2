export type PricingConfig = {
  session: number
  weekly: number
  monthlyRegular: number
  monthlyStudent: number
}

export type MonthlyPlan = "regular" | "student"

export const DEFAULT_PRICING: PricingConfig = {
  session: 70,
  weekly: 200,
  monthlyRegular: 600,
  monthlyStudent: 500,
}

