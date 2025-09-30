'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { STRIPE_PUBLISHABLE_KEY } from '@/lib/stripe'

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)

interface StripePaymentFormProps {
  onSuccess: (paymentMethodId: string) => void
  onError: (error: string) => void
  isUpdating?: boolean
}

function PaymentForm({ onSuccess, onError, isUpdating }: StripePaymentFormProps) {
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
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (error) {
        onError(error.message || 'Payment method creation failed')
      } else if (paymentMethod) {
        onSuccess(paymentMethod.id)
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment method creation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': {
                  color: '#9ca3af',
                },
              },
              invalid: {
                color: '#ef4444',
              },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : (isUpdating ? 'Update Payment Method' : 'Add Payment Method')}
      </button>
    </form>
  )
}

export default function StripePaymentForm({ onSuccess, onError, isUpdating = false }: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm onSuccess={onSuccess} onError={onError} isUpdating={isUpdating} />
    </Elements>
  )
}
