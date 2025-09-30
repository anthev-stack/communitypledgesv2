'use client'

import React from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { CheckCircle, X, Calendar, CreditCard } from 'lucide-react'
import PriceDisplay from '@/components/PriceDisplay'

interface PledgeConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  serverName: string
  serverId: string
  amount: number
}

const PledgeConfirmation: React.FC<PledgeConfirmationProps> = ({
  isOpen,
  onClose,
  onSuccess,
  serverName,
  serverId,
  amount,
}) => {
  const { addNotification } = useNotifications()

  const handleConfirm = async () => {
    try {
      // Call the pledge API
      const response = await fetch(`/api/servers/${serverId}/pledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })

      if (response.ok) {
        const data = await response.json()
        addNotification({
          type: 'success',
          title: 'Pledge Created!',
          message: data.message || 'Your pledge has been created successfully.',
          duration: 5000
        })
        onSuccess()
      } else {
        const errorData = await response.json()
        addNotification({
          type: 'error',
          title: 'Pledge Failed',
          message: errorData.message || 'Failed to create pledge',
          duration: 5000
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create pledge',
        duration: 5000
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Confirm Your Pledge</h2>
          <p className="text-gray-300 mb-6">
            You are about to pledge <span className="font-semibold text-emerald-400"><PriceDisplay amount={amount} /></span> to <span className="font-semibold text-blue-400">{serverName}</span>.
          </p>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-blue-300 font-medium mb-1">Payment Schedule</h3>
              <p className="text-blue-200 text-sm">
                You will be charged <strong>2 days before the monthly payment due date</strong>. 
                No immediate payment is required.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <CreditCard className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <h3 className="text-yellow-300 font-medium mb-1">Payment Method Required</h3>
              <p className="text-yellow-200 text-sm">
                Make sure you have a valid payment method saved in your settings. 
                You can update it anytime before the payment date.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 text-white py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Confirm Pledge</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PledgeConfirmation