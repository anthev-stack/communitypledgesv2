'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNotifications } from '@/contexts/NotificationContext'
import { ArrowLeft, Send, AlertCircle } from 'lucide-react'

const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  category: z.enum(['bug', 'feature', 'support', 'report', 'other'], {
    required_error: 'Please select a category'
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    required_error: 'Please select a priority'
  })
})

type CreateTicketForm = z.infer<typeof createTicketSchema>

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report', description: 'Report a bug or technical issue' },
  { value: 'feature', label: 'Feature Request', description: 'Suggest a new feature or improvement' },
  { value: 'support', label: 'Support', description: 'Get help with using the platform' },
  { value: 'report', label: 'Report User/Server', description: 'Report inappropriate content or behavior' },
  { value: 'other', label: 'Other', description: 'Something else not covered above' }
]

const PRIORITIES = [
  { value: 'low', label: 'Low', description: 'Not urgent, can wait' },
  { value: 'medium', label: 'Medium', description: 'Normal priority' },
  { value: 'high', label: 'High', description: 'Important, needs attention soon' },
  { value: 'urgent', label: 'Urgent', description: 'Critical issue, needs immediate attention' }
]

export default function CreateTicketPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addNotification } = useNotifications()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      category: 'support',
      priority: 'medium'
    }
  })

  const selectedCategory = watch('category')
  const selectedPriority = watch('priority')

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-emerald-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/login')
    return null
  }

  const onSubmit = async (data: CreateTicketForm) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const result = await response.json()
        addNotification({
          type: 'success',
          message: 'Ticket created successfully! We\'ll get back to you soon.'
        })
        router.push(`/tickets/${result.id}`)
      } else {
        const error = await response.json()
        addNotification({
          type: 'error',
          message: error.message || 'Failed to create ticket'
        })
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      addNotification({
        type: 'error',
        message: 'Failed to create ticket. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-300 hover:text-emerald-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">Create Support Ticket</h1>
          <p className="text-gray-300 mt-2">
            Need help? Report a bug? Have a suggestion? We're here to help!
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
                placeholder="Brief description of your issue or request"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CATEGORIES.map((category) => (
                  <label
                    key={category.value}
                    className={`relative flex items-start p-4 border rounded-lg cursor-pointer ${
                      selectedCategory === category.value
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                    }`}
                  >
                    <input
                      {...register('category')}
                      type="radio"
                      value={category.value}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{category.label}</div>
                      <div className="text-sm text-gray-400">{category.description}</div>
                    </div>
                    {selectedCategory === category.value && (
                      <div className="absolute top-2 right-2">
                        <div className="w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-red-400">{errors.category.message}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRIORITIES.map((priority) => (
                  <label
                    key={priority.value}
                    className={`relative flex flex-col items-center p-3 border rounded-lg cursor-pointer ${
                      selectedPriority === priority.value
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                    }`}
                  >
                    <input
                      {...register('priority')}
                      type="radio"
                      value={priority.value}
                      className="sr-only"
                    />
                    <div className="font-medium text-white">{priority.label}</div>
                    <div className="text-xs text-gray-400 text-center mt-1">
                      {priority.description}
                    </div>
                    {selectedPriority === priority.value && (
                      <div className="absolute top-1 right-1">
                        <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-400">{errors.priority.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={6}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
                placeholder="Please provide as much detail as possible about your issue or request..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-400">
                {watch('description')?.length || 0}/1000 characters
              </p>
            </div>

            {/* Tips */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-400 mb-2">Tips for getting help faster:</h4>
                  <ul className="text-sm text-blue-300 space-y-1">
                    <li>• Be specific about what you're experiencing</li>
                    <li>• Include steps to reproduce the issue (for bugs)</li>
                    <li>• Mention your browser and device if relevant</li>
                    <li>• Attach screenshots if helpful</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-gray-300 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
