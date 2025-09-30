'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Filter,
  Search,
  User,
  Shield
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
  _count: {
    messages: number
  }
}

export default function StaffTicketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [ticketToUpdate, setTicketToUpdate] = useState<{id: string, currentStatus: string, newStatus: string} | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    // Check if user has staff permissions
    if (session.user?.role !== 'moderator' && session.user?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    fetchTickets()
  }, [session, status])

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/staff/tickets')
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      } else {
        console.error('Failed to fetch tickets')
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (ticketId: string, currentStatus: string, newStatus: string) => {
    if (currentStatus === newStatus) return
    
    setTicketToUpdate({ id: ticketId, currentStatus, newStatus })
    setShowConfirmModal(true)
  }

  const confirmStatusChange = async () => {
    if (!ticketToUpdate) return

    try {
      const response = await fetch(`/api/staff/tickets/${ticketToUpdate.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: ticketToUpdate.newStatus })
      })

      if (response.ok) {
        fetchTickets() // Refresh the list
        setShowConfirmModal(false)
        setTicketToUpdate(null)
      } else {
        console.error('Failed to update ticket status')
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
    }
  }

  const cancelStatusChange = () => {
    setShowConfirmModal(false)
    setTicketToUpdate(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'in_progress':
        return <AlertTriangle className="w-4 h-4 text-blue-400" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
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

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.createdBy.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesPriority && matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-emerald-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-300">Loading tickets...</p>
        </div>
      </div>
    )
  }

  if (!session || (session.user?.role !== 'moderator' && session.user?.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-300">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
              <p className="text-gray-300 mt-1">
                Manage and respond to user support tickets
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-6 h-6 text-emerald-400" />
              <span className="text-sm font-medium text-gray-300">
                {tickets.length} tickets
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
                  placeholder="Search tickets..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Categories</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="support">Support</option>
                <option value="report">Report</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('all')
                  setFilterPriority('all')
                  setFilterCategory('all')
                  setSearchQuery('')
                }}
                className="w-full px-4 py-2 text-gray-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
              <div key={ticket.id} className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-white">
                          {ticket.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>by {ticket.createdBy.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{ticket._count.messages} messages</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(ticket.status)}
                          <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                        {ticket.assignedTo && (
                          <div className="flex items-center space-x-1">
                            <Shield className="w-4 h-4" />
                            <span>Assigned to {ticket.assignedTo.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0 flex flex-col space-y-2">
                      <div className="text-right">
                        <div className="text-sm text-gray-400">
                          {ticket.category}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Updated {new Date(ticket.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <select
                          value={ticket.status}
                          onChange={(e) => handleStatusChange(ticket.id, ticket.status, e.target.value)}
                          className="text-xs px-2 py-1 bg-slate-700/50 border border-slate-600 text-white rounded focus:outline-none focus:ring-emerald-500"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                        
                        
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No tickets found</h3>
              <p className="text-gray-400">
                {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : "No support tickets have been created yet."
                }
              </p>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && ticketToUpdate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Confirm Status Change</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to change this ticket status from{' '}
                <span className="font-medium text-white">
                  {ticketToUpdate.currentStatus.replace('_', ' ')}
                </span>{' '}
                to{' '}
                <span className="font-medium text-white">
                  {ticketToUpdate.newStatus.replace('_', ' ')}
                </span>?
              </p>

              {ticketToUpdate.newStatus === 'closed' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <p className="text-sm text-red-400 font-medium">Important:</p>
                  </div>
                  <p className="text-sm text-red-300 mt-1">
                    Once closed, users will not be able to respond to this ticket and will need to create a new one.
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={cancelStatusChange}
                  className="flex-1 px-4 py-2 text-gray-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusChange}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    ticketToUpdate.newStatus === 'closed' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
