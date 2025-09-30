'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Server, 
  MessageSquare, 
  Shield, 
  Ban, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  UserCheck,
  ServerCheck,
  Ticket,
  Settings,
  Search,
  Filter,
  Eye,
  Trash2,
  RefreshCw,
  DollarSign,
  Building2,
  CreditCard
} from 'lucide-react'
import { useCurrency } from '@/contexts/CurrencyContext'
import PriceDisplay from '@/components/PriceDisplay'

interface StaffDashboardData {
  totalUsers: number
  bannedUsers: number
  totalServers: number
  bannedServers: number
  openTickets: number
  recentTickets: Array<{
    id: string
    title: string
    status: string
    priority: string
    category: string
    createdAt: string
    createdBy: {
      name: string
      image?: string
    }
    assignedTo?: {
      name: string
    }
  }>
  recentBans: Array<{
    id: string
    action: string
    reason: string
    createdAt: string
    staff: {
      name: string
    }
    targetUser?: {
      name: string
    }
    targetServer?: {
      name: string
    }
  }>
}

interface ServerData {
  id: string
  name: string
  description: string
  gameType: string
  region: string
  isActive: boolean
  isBanned: boolean
  bannedAt?: string
  bannedBy?: string
  banReason?: string
  createdAt: string
  owner: {
    id: string
    name: string
    image?: string
    role: string
  }
  _count: {
    pledges: number
    favorites: number
  }
}

interface UserData {
  id: string
  name: string
  email: string
  image?: string
  role: string
  isBanned: boolean
  bannedAt?: string
  bannedBy?: string
  banReason?: string
  isPaymentSuspended: boolean
  paymentFailureCount: number
  lastPaymentFailure?: string
  paymentSuspendedAt?: string
  createdAt: string
  _count: {
    servers: number
    pledges: number
  }
}

function ServerManagement() {
  const { data: session } = useSession()
  const [servers, setServers] = useState<ServerData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [banReason, setBanReason] = useState('')
  const [banningServer, setBanningServer] = useState<string | null>(null)
  const [showBanModal, setShowBanModal] = useState(false)

  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    fetchServers()
  }, [search, status])

  const fetchServers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (status !== 'all') params.append('status', status)
      
      const response = await fetch(`/api/staff/servers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setServers(data)
      } else {
        console.error('Failed to fetch servers')
      }
    } catch (error) {
      console.error('Error fetching servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBanServer = async (serverId: string) => {
    if (!banReason.trim()) return

    try {
      const response = await fetch(`/api/staff/servers/${serverId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: banReason }),
      })

      if (response.ok) {
        await fetchServers()
        setShowBanModal(false)
        setBanReason('')
        setBanningServer(null)
      } else {
        console.error('Failed to ban server')
      }
    } catch (error) {
      console.error('Error banning server:', error)
    }
  }

  const handleUnbanServer = async (serverId: string) => {
    try {
      const response = await fetch(`/api/staff/servers/${serverId}/unban`, {
        method: 'POST',
      })

      if (response.ok) {
        await fetchServers()
      } else {
        console.error('Failed to unban server')
      }
    } catch (error) {
      console.error('Error unbanning server:', error)
    }
  }

  const openBanModal = (serverId: string) => {
    setBanningServer(serverId)
    setShowBanModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow border border-slate-700/50">
        <div className="px-6 py-4 border-b border-slate-600">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Server Management</h3>
            <button
              onClick={fetchServers}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search servers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Servers</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Servers List */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow border border-slate-700/50">
        <div className="px-6 py-4 border-b border-slate-600">
          <h4 className="text-lg font-medium text-white">Servers ({servers.length})</h4>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 bg-emerald-600 rounded-full animate-pulse mx-auto mb-4"></div>
              <p className="text-gray-300">Loading servers...</p>
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center py-8">
              <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No servers found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {servers.map((server) => (
                <div key={server.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h5 className="text-lg font-medium text-white">{server.name}</h5>
                        <div className="flex items-center space-x-2">
                          {server.isBanned ? (
                            <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                              Banned
                            </span>
                          ) : server.isActive ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full">
                              Inactive
                            </span>
                          )}
                          <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                            {server.gameType}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{server.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>Owner: {server.owner.name}</span>
                        <span>Region: {server.region}</span>
                        <span>Pledges: {server._count.pledges}</span>
                        <span>Favorites: {server._count.favorites}</span>
                        <span>Created: {new Date(server.createdAt).toLocaleDateString()}</span>
                      </div>
                      {server.isBanned && server.banReason && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-300">
                          <strong>Ban Reason:</strong> {server.banReason}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => window.open(`/servers/${server.id}`, '_blank')}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="View Server"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {server.isBanned ? (
                        isAdmin && (
                          <button
                            onClick={() => handleUnbanServer(server.id)}
                            className="p-2 text-green-400 hover:text-green-300 transition-colors"
                            title="Unban Server"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => openBanModal(server.id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          title="Ban Server"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-slate-600">
              <h3 className="text-lg font-medium text-white">Ban Server</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Please provide a reason for banning this server:
              </p>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter ban reason..."
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                rows={3}
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-600 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBanModal(false)
                  setBanReason('')
                  setBanningServer(null)
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => banningServer && handleBanServer(banningServer)}
                disabled={!banReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ban Server
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function UserManagement() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [banReason, setBanReason] = useState('')
  const [banningUser, setBanningUser] = useState<string | null>(null)
  const [showBanModal, setShowBanModal] = useState(false)
  const [promotingUser, setPromotingUser] = useState<string | null>(null)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [newRole, setNewRole] = useState('user')

  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    fetchUsers()
  }, [search, status])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (status !== 'all') params.append('status', status)
      
      const response = await fetch(`/api/staff/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async (userId: string) => {
    if (!banReason.trim()) return

    try {
      const response = await fetch(`/api/staff/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: banReason }),
      })

      if (response.ok) {
        await fetchUsers()
        setShowBanModal(false)
        setBanReason('')
        setBanningUser(null)
      } else {
        console.error('Failed to ban user')
      }
    } catch (error) {
      console.error('Error banning user:', error)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/staff/users/${userId}/unban`, {
        method: 'POST',
      })

      if (response.ok) {
        await fetchUsers()
      } else {
        console.error('Failed to unban user')
      }
    } catch (error) {
      console.error('Error unbanning user:', error)
    }
  }

  const handlePromoteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/staff/users/${userId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        await fetchUsers()
        setShowPromoteModal(false)
        setNewRole('user')
        setPromotingUser(null)
      } else {
        console.error('Failed to promote user')
      }
    } catch (error) {
      console.error('Error promoting user:', error)
    }
  }

  const openBanModal = (userId: string) => {
    setBanningUser(userId)
    setShowBanModal(true)
  }

  const openPromoteModal = (userId: string) => {
    setPromotingUser(userId)
    setShowPromoteModal(true)
  }

  const handleUnsuspendUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/staff/users/${userId}/unsuspend`, {
        method: 'POST',
      })

      if (response.ok) {
        await fetchUsers()
      } else {
        console.error('Failed to unsuspend user')
      }
    } catch (error) {
      console.error('Error unsuspending user:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow border border-slate-700/50">
        <div className="px-6 py-4 border-b border-slate-600">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">User Management</h3>
            <button
              onClick={fetchUsers}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
                <option value="payment_suspended">Payment Suspended</option>
                <option value="moderator">Moderators</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow border border-slate-700/50">
        <div className="px-6 py-4 border-b border-slate-600">
          <h4 className="text-lg font-medium text-white">Users ({users.length})</h4>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 bg-emerald-600 rounded-full animate-pulse mx-auto mb-4"></div>
              <p className="text-gray-300">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h5 className="text-lg font-medium text-white">{user.name}</h5>
                          <div className="flex items-center space-x-2">
                            {user.isBanned ? (
                              <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                                Banned
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                                Active
                              </span>
                            )}
                            {user.isPaymentSuspended && (
                              <span className="px-2 py-1 text-xs font-medium bg-orange-500/20 text-orange-400 rounded-full">
                                Payment Suspended
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                              user.role === 'moderator' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{user.email}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>Servers: {user._count.servers}</span>
                          <span>Pledges: {user._count.pledges}</span>
                          <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        {user.isBanned && user.banReason && (
                          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-300">
                            <strong>Ban Reason:</strong> {user.banReason}
                          </div>
                        )}
                        {user.isPaymentSuspended && (
                          <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded text-sm text-orange-300">
                            <div className="flex items-center justify-between">
                              <div>
                                <strong>Payment Suspended:</strong> {user.paymentFailureCount} failure(s)
                                {user.lastPaymentFailure && (
                                  <span className="ml-2">
                                    (Last: {new Date(user.lastPaymentFailure).toLocaleDateString()})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => window.open(`/members/${user.id}`, '_blank')}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {user.isBanned ? (
                        isAdmin && (
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            className="p-2 text-green-400 hover:text-green-300 transition-colors"
                            title="Unban User"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => openBanModal(user.id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          title="Ban User"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      {user.isPaymentSuspended && (isAdmin || isModerator) && (
                        <button
                          onClick={() => handleUnsuspendUser(user.id)}
                          className="p-2 text-green-400 hover:text-green-300 transition-colors"
                          title="Unsuspend Payment"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {isAdmin && user.role !== 'admin' && (
                        <button
                          onClick={() => openPromoteModal(user.id)}
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Promote User"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-slate-600">
              <h3 className="text-lg font-medium text-white">Ban User</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Please provide a reason for banning this user:
              </p>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter ban reason..."
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                rows={3}
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-600 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBanModal(false)
                  setBanReason('')
                  setBanningUser(null)
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => banningUser && handleBanUser(banningUser)}
                disabled={!banReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-slate-600">
              <h3 className="text-lg font-medium text-white">Promote User</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Select a new role for this user:
              </p>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="px-6 py-4 border-t border-slate-600 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPromoteModal(false)
                  setNewRole('user')
                  setPromotingUser(null)
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => promotingUser && handlePromoteUser(promotingUser)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StaffDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { formatAmount } = useCurrency()
  
  const [dashboardData, setDashboardData] = useState<StaffDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'servers' | 'tickets' | 'transactions' | 'stripe'>('overview')

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

    fetchDashboardData()
  }, [session, status])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/staff/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      } else {
        console.error('Failed to fetch staff dashboard data')
      }
    } catch (error) {
      console.error('Error fetching staff dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-emerald-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-300">Loading staff dashboard...</p>
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
          <p className="text-gray-300">You don't have permission to access the staff dashboard.</p>
        </div>
      </div>
    )
  }

  const isAdmin = session.user?.role === 'admin'

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Staff Dashboard</h1>
              <p className="text-gray-300 mt-1">
                Welcome back, {session.user?.name} ({session.user?.role})
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-emerald-400" />
              <span className="text-sm font-medium text-gray-300">
                {isAdmin ? 'Administrator' : 'Moderator'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-slate-500'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-slate-500'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('servers')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'servers'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-slate-500'
              }`}
            >
              Servers
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tickets'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-slate-500'
              }`}
            >
              Tickets
            </button>
            {session?.user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'transactions'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-slate-500'
                  }`}
                >
                  Transactions
                </button>
                <button
                  onClick={() => setActiveTab('stripe')}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'stripe'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-slate-500'
                  }`}
                >
                  Config
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow p-6 border border-slate-700/50">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Total Users</p>
                    <p className="text-2xl font-semibold text-white">{dashboardData.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow p-6 border border-slate-700/50">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Ban className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Banned Users</p>
                    <p className="text-2xl font-semibold text-white">{dashboardData.bannedUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow p-6 border border-slate-700/50">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Server className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Total Servers</p>
                    <p className="text-2xl font-semibold text-white">{dashboardData.totalServers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow p-6 border border-slate-700/50">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-8 h-8 text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Open Tickets</p>
                    <p className="text-2xl font-semibold text-white">{dashboardData.openTickets}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Tickets */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow border border-slate-700/50">
                <div className="px-6 py-4 border-b border-slate-600">
                  <h3 className="text-lg font-medium text-white">Recent Tickets</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {dashboardData.recentTickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Ticket className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-white">{ticket.title}</p>
                            <p className="text-sm text-gray-400">
                              by {ticket.createdBy.name} • {new Date(ticket.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            ticket.status === 'open' ? 'bg-green-500/20 text-green-400' :
                            ticket.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {ticket.status}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            ticket.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                            ticket.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            ticket.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Ban Actions */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow border border-slate-700/50">
                <div className="px-6 py-4 border-b border-slate-600">
                  <h3 className="text-lg font-medium text-white">Recent Ban Actions</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {dashboardData.recentBans.map((ban) => (
                      <div key={ban.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {ban.action.includes('ban') ? (
                            <Ban className="w-5 h-5 text-red-400" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                          <div>
                            <p className="font-medium text-white">
                              {ban.action.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-400">
                              by {ban.staff.name} • {new Date(ban.createdAt).toLocaleDateString()}
                            </p>
                            {ban.targetUser && (
                              <p className="text-sm text-gray-300">User: {ban.targetUser.name}</p>
                            )}
                            {ban.targetServer && (
                              <p className="text-sm text-gray-300">Server: {ban.targetServer.name}</p>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 max-w-xs truncate">
                          {ban.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && <UserManagement />}

        {/* Servers Tab */}
        {activeTab === 'servers' && <ServerManagement />}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow border border-slate-700/50">
              <div className="px-6 py-4 border-b border-slate-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Tickets</h3>
                  <a
                    href="/staff/tickets"
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Manage Tickets</span>
                  </a>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-300 mb-4">
                  Manage user support tickets, respond to inquiries, and track ticket status. You can assign tickets, change status, and communicate with users.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Ticket Actions</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• View all support tickets</li>
                      <li>• Respond to user messages</li>
                      <li>• Change ticket status</li>
                      <li>• Assign tickets to staff</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Status Management</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Open: New tickets</li>
                      <li>• In Progress: Being worked on</li>
                      <li>• Resolved: Issue fixed</li>
                      <li>• Closed: Ticket completed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab - Admin Only */}
        {activeTab === 'transactions' && session?.user?.role === 'admin' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow border border-slate-700/50">
              <div className="px-6 py-4 border-b border-slate-600">
                <h3 className="text-lg font-medium text-white">Transaction History</h3>
                <p className="text-sm text-gray-400 mt-1">
                  View all financial transactions including server payments and platform fees
                </p>
              </div>
              <div className="p-6">
                <TransactionsManagement />
              </div>
            </div>
          </div>
        )}

        {/* Stripe Configuration Tab - Admin Only */}
        {activeTab === 'stripe' && session?.user?.role === 'admin' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow border border-slate-700/50">
              <div className="px-6 py-4 border-b border-slate-600">
                <h3 className="text-lg font-medium text-white">Stripe Configuration</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Manage Stripe payment processing settings and platform fees
                </p>
              </div>
              <div className="p-6">
                <StripeManagement />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Transactions Management Component
function TransactionsManagement() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'payments' | 'fees' | 'boosts'>('all')
  
  const { formatAmount } = useCurrency()

  useEffect(() => {
    fetchTransactions()
  }, [filter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/staff/transactions?filter=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionType = (type: string) => {
    switch (type) {
      case 'payment_processed':
        return { label: 'Server Payment', color: 'text-green-400', bgColor: 'bg-green-500/20' }
      case 'platform_fee':
        return { label: 'Platform Fee (1%)', color: 'text-blue-400', bgColor: 'bg-blue-500/20' }
      case 'server_boost':
        return { label: 'Server Boost', color: 'text-purple-400', bgColor: 'bg-purple-500/20' }
      default:
        return { label: 'Other', color: 'text-gray-400', bgColor: 'bg-gray-500/20' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="ml-2 text-gray-300">Loading transactions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'All Transactions' },
          { key: 'payments', label: 'Server Payments' },
          { key: 'fees', label: 'Platform Fees' },
          { key: 'boosts', label: 'Server Boosts' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {filter === 'all' ? 'No transactions have been recorded yet.' : `No ${filter} transactions found.`}
            </p>
          </div>
        ) : (
          transactions.map((transaction) => {
            const typeInfo = getTransactionType(transaction.type)
            return (
              <div
                key={transaction.id}
                className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${typeInfo.bgColor}`}>
                      <DollarSign className={`w-5 h-5 ${typeInfo.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className="text-2xl font-bold text-white">
                          {formatAmount(transaction.amount)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {transaction.description || 'Transaction processed'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      User: {transaction.user?.name || 'Unknown'}
                    </p>
                    {transaction.server && (
                      <p className="text-sm text-gray-400">
                        Server: {transaction.server.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// Stripe Management Component
function StripeManagement() {
  const [stripeConfig, setStripeConfig] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  
  const { formatAmount } = useCurrency()

  useEffect(() => {
    fetchStripeConfig()
  }, [])

  const fetchStripeConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/staff/stripe')
      if (response.ok) {
        const data = await response.json()
        setStripeConfig(data.config)
      } else {
        console.error('Failed to fetch Stripe config:', response.statusText)
        // Set a default config for display purposes
        setStripeConfig({
          environment: 'test',
          chargesEnabled: false,
          payoutsEnabled: false
        })
      }
    } catch (error) {
      console.error('Error fetching Stripe config:', error)
      // Set a default config for display purposes
      setStripeConfig({
        environment: 'test',
        chargesEnabled: false,
        payoutsEnabled: false
      })
    } finally {
      setLoading(false)
    }
  }

  const testStripeConnection = async () => {
    try {
      setTesting(true)
      const response = await fetch('/api/staff/stripe/test', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(`Stripe connection successful! Account: ${data.account?.business_profile?.name || 'Test Account'}`)
      } else {
        alert('Stripe connection failed. Please check your API keys.')
      }
    } catch (error) {
      console.error('Error testing Stripe:', error)
      alert('Error testing Stripe connection.')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="ml-2 text-gray-300">Loading Stripe configuration...</span>
      </div>
    )
  }

  if (!stripeConfig) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300">Stripe configuration not available</p>
          <button
            onClick={fetchStripeConfig}
            className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stripe Status */}
      <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <CreditCard className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-white">Stripe Payment Processing</h4>
              <p className="text-sm text-gray-400">
                Secure payment processing with automatic platform fees
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-green-400">Connected</span>
            </div>
            <button
              onClick={testStripeConnection}
              disabled={testing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Test Connection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h5 className="font-medium text-white mb-2">Environment</h5>
            <p className="text-sm text-gray-400">
              {stripeConfig?.environment === 'live' ? 'Live Mode (Production)' : 'Test Mode (Sandbox)'}
            </p>
            <p className={`text-xs mt-1 ${stripeConfig?.environment === 'live' ? 'text-green-400' : 'text-yellow-400'}`}>
              {stripeConfig?.environment === 'live' ? 'Using live API keys' : 'Using test API keys'}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h5 className="font-medium text-white mb-2">Platform Fee</h5>
            <p className="text-sm text-gray-400">1% on all transactions</p>
            <p className="text-xs text-gray-500 mt-1">Automatically collected by Stripe</p>
          </div>
        </div>
      </div>

      {/* API Keys Status */}
      <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
        <h4 className="text-lg font-medium text-white mb-4">API Configuration</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Publishable Key
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value="pk_live_51RusS8FtejGbn4s0JYRxJivuSDA4eX1S3iC9Rh16e2mA20bA48IvMS6wwokWyOrQFpHQWhK5njuuxRNpjFVtOMbM00nGZikJFG"
                readOnly
                className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600 text-white rounded-lg text-sm font-mono"
              />
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Secret Key
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="password"
                value="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"
                readOnly
                className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600 text-white rounded-lg text-sm font-mono"
              />
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Connect Account ID
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value="acct_1RuuHFFf28aynpbG"
                readOnly
                className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600 text-white rounded-lg text-sm font-mono"
              />
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Keys are configured and ready for use. In production, these should be stored as environment variables.
        </p>
      </div>

      {/* Platform Fee Information */}
      <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
        <h4 className="text-lg font-medium text-white mb-4">Platform Fee Structure</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Server Payments</span>
            <span className="text-white font-medium">1% platform fee</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Server Boosts</span>
            <span className="text-white font-medium"><PriceDisplay amount={3} /> flat fee</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Stripe Processing</span>
            <span className="text-white font-medium">2.9% + <PriceDisplay amount={0.30} /></span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-300">
            <strong>Example:</strong> <PriceDisplay amount={100} /> server payment = <PriceDisplay amount={1} /> platform fee + <PriceDisplay amount={3.20} /> Stripe fee = <PriceDisplay amount={95.80} /> to server owner
          </p>
        </div>
      </div>
    </div>
  )
}

