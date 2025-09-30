'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { STRIPE_PUBLISHABLE_KEY } from '@/lib/stripe'

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)

interface StripePaymentProps {
  serverId: string
  amount: number
  type: 'pledge' | 'boost'
  onSuccess?: () => void
  onError?: (error: string) => void
}

function PaymentForm({ serverId, amount, type, onSuccess, onError }: StripePaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, amount, type })
      })

      const { clientSecret } = await response.json()

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      // Confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/servers/${serverId}?payment=success`,
        },
      })

      if (error) {
        onError?.(error.message || 'Payment failed')
      } else {
        onSuccess?.()
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  )
}

export default function StripePayment({ serverId, amount, type, onSuccess, onError }: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        serverId={serverId} 
        amount={amount} 
        type={type} 
        onSuccess={onSuccess} 
        onError={onError} 
      />
    </Elements>
  )
}



