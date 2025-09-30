'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useNotifications } from '@/contexts/NotificationContext'
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  User,
  Shield,
  Lock,
  X
} from 'lucide-react'

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  createdBy: {
    name: string
    image?: string
  }
  assignedTo?: {
    name: string
  }
  messages: Array<{
    id: string
    content: string
    isStaff: boolean
    createdAt: string
    author: {
      name: string
      image?: string
    }
  }>
}

interface MessageForm {
  content: string
}

export default function TicketPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { addNotification } = useNotifications()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [closing, setClosing] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<MessageForm>()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (params.id) {
      fetchTicket()
    }
  }, [session, status, params.id])

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTicket(data)
      } else {
        console.error('Failed to fetch ticket')
        addNotification({
          type: 'error',
          message: 'Failed to load ticket'
        })
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
      addNotification({
        type: 'error',
        message: 'Failed to load ticket'
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: MessageForm) => {
    if (!ticket) return

    setSubmitting(true)
    
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        reset()
        fetchTicket() // Refresh ticket data
        addNotification({
          type: 'success',
          message: 'Message sent successfully'
        })
      } else {
        const error = await response.json()
        addNotification({
          type: 'error',
          message: error.message || 'Failed to send message'
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      addNotification({
        type: 'error',
        message: 'Failed to send message'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!ticket) return

    setClosing(true)
    try {
      const response = await fetch(`/api/staff/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'closed' })
      })

      if (response.ok) {
        fetchTicket() // Refresh ticket data
        setShowCloseConfirm(false)
        addNotification({
          type: 'success',
          message: 'Ticket closed successfully'
        })
      } else {
        addNotification({
          type: 'error',
          message: 'Failed to close ticket'
        })
      }
    } catch (error) {
      console.error('Error closing ticket:', error)
      addNotification({
        type: 'error',
        message: 'Failed to close ticket'
      })
    } finally {
      setClosing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-5 h-5 text-yellow-400" />
      case 'in_progress':
        return <AlertTriangle className="w-5 h-5 text-blue-400" />
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'closed':
        return <XCircle className="w-5 h-5 text-gray-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400'
      case 'resolved':
        return 'bg-green-500/20 text-green-400'
      case 'closed':
        return 'bg-gray-500/20 text-gray-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400'
      case 'high':
        return 'bg-orange-500/20 text-orange-400'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'low':
        return 'bg-green-500/20 text-green-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-emerald-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-300">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Ticket Not Found</h1>
          <p className="text-gray-300 mb-4">The ticket you're looking for doesn't exist or you don't have access to it.</p>
          <Link
            href="/tickets"
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Tickets
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/tickets"
            className="flex items-center text-gray-300 hover:text-emerald-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{ticket.title}</h1>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
                <span className="text-sm text-gray-400">
                  {ticket.category}
                </span>
                {ticket.assignedTo && (
                  <div className="flex items-center space-x-1 text-sm text-gray-400">
                    <Shield className="w-4 h-4" />
                    <span>Assigned to {ticket.assignedTo.name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div>Created {new Date(ticket.createdAt).toLocaleDateString()}</div>
              <div>Updated {new Date(ticket.updatedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Description */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
              <p className="text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Messages */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50">
              <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Messages</h2>
                {session.user?.role === 'moderator' || session.user?.role === 'admin' ? (
                  ticket.status !== 'closed' ? (
                    <button
                      onClick={() => setShowCloseConfirm(true)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Close Ticket</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-slate-700/50 text-gray-400 text-sm rounded-lg flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Ticket Closed</span>
                    </span>
                  )
                ) : null}
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {ticket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isStaff ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isStaff 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-700/50 text-gray-300'
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          {message.isStaff ? (
                            <Shield className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                          <span className="text-sm font-medium">
                            {message.author.name}
                          </span>
                          {message.isStaff && (
                            <span className="text-xs bg-emerald-500 px-2 py-0.5 rounded">
                              Staff
                            </span>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.isStaff ? 'text-emerald-100' : 'text-gray-400'
                        }`}>
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Message Form */}
                {ticket.status !== 'closed' ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <textarea
                          {...register('content', { 
                            required: 'Message is required',
                            minLength: { value: 1, message: 'Message cannot be empty' }
                          })}
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
                          placeholder="Type your message..."
                        />
                        {errors.content && (
                          <p className="mt-1 text-sm text-red-400">{errors.content.message}</p>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {submitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-6 p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-white">Ticket Closed</h4>
                        <p className="text-sm text-gray-300 mt-1">
                          This ticket has been closed. You cannot send new messages. If you need further assistance, please create a new ticket.
                        </p>
                        <Link
                          href="/tickets/create"
                          className="inline-block mt-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                          Create New Ticket →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ticket Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(ticket.status)}
                  <span className="text-sm text-gray-300">Status: {ticket.status.replace('_', ' ')}</span>
                </div>
                <div className="text-sm text-gray-300">
                  <span className="font-medium">Priority:</span> {ticket.priority}
                </div>
                <div className="text-sm text-gray-300">
                  <span className="font-medium">Category:</span> {ticket.category}
                </div>
                <div className="text-sm text-gray-300">
                  <span className="font-medium">Created:</span> {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-300">
                  <span className="font-medium">Last Updated:</span> {new Date(ticket.updatedAt).toLocaleDateString()}
                </div>
                {ticket.resolvedAt && (
                  <div className="text-sm text-gray-300">
                    <span className="font-medium">Resolved:</span> {new Date(ticket.resolvedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Help */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-medium text-blue-400 mb-2">Need Help?</h4>
              <p className="text-sm text-blue-300 mb-3">
                Our support team is here to help! We typically respond within 24 hours.
              </p>
              <div className="text-sm text-blue-300">
                <p>• Be specific about your issue</p>
                <p>• Include error messages if any</p>
                <p>• Provide steps to reproduce the problem</p>
              </div>
            </div>
          </div>
        </div>

        {/* Close Ticket Confirmation Modal */}
        {showCloseConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <XCircle className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Close Ticket</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to close this ticket? Once closed, users will not be able to respond and will need to create a new ticket for further assistance.
              </p>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <p className="text-sm text-red-400 font-medium">Warning:</p>
                </div>
                <p className="text-sm text-red-300 mt-1">
                  This action cannot be undone. Make sure the issue has been fully resolved before closing.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  disabled={closing}
                  className="flex-1 px-4 py-2 text-gray-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseTicket}
                  disabled={closing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {closing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>Close Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
