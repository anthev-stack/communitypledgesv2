import Stripe from 'stripe'

// Initialize Stripe with your live keys
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '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', {
  apiVersion: '2024-06-20',
  typescript: true,
})

// Stripe publishable key for client-side
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51RusS8FtejGbn4s0JYRxJivuSDA4eX1S3iC9Rh16e2mA20bA48IvMS6wwokWyOrQFpHQWhK5njuuxRNpjFVtOMbM00nGZikJFG'

// Stripe Connect account ID for CommunityPledges
export const STRIPE_CONNECT_ACCOUNT_ID = process.env.STRIPE_CONNECT_ACCOUNT_ID || 'acct_1RusS8FtejGbn4s0'

// Platform fee percentage (1%)
export const PLATFORM_FEE_PERCENTAGE = 0.01

// Calculate platform fee amount
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_PERCENTAGE * 100) / 100
}

// Calculate amount after platform fee
export function calculateAmountAfterFee(amount: number): number {
  return amount - calculatePlatformFee(amount)
}

// Calculate Stripe processing fee (2.9% + $0.30)
export function calculateStripeFee(amount: number): number {
  return Math.round((amount * 0.029 + 0.30) * 100) / 100
}

// Calculate net amount to server owner
export function calculateNetAmount(amount: number): number {
  return amount - calculatePlatformFee(amount) - calculateStripeFee(amount)
}
