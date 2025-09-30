'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Ban, 
  CheckCircle, 
  Search, 
  Shield, 
  AlertTriangle,
  UserCheck,
  UserX,
  Crown,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  isBanned: boolean
  bannedAt?: string
  banReason?: string
  createdAt: string
  _count: {
    servers: number
    pledges: number
  }
}

export default function UserManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [showDemoteModal, setShowDemoteModal] = useState(false)
  const [userToPromote, setUserToPromote] = useState<User | null>(null)
  const [promoting, setPromoting] = useState(false)

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

    fetchUsers()
  }, [session, status])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/staff/users')
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

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      const response = await fetch(`/api/staff/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        fetchUsers() // Refresh the list
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
        method: 'POST'
      })

      if (response.ok) {
        fetchUsers() // Refresh the list
      } else {
        console.error('Failed to unban user')
      }
    } catch (error) {
      console.error('Error unbanning user:', error)
    }
  }

  const handlePromoteUser = async (userId: string, newRole: string) => {
    setPromoting(true)
    try {
      const response = await fetch(`/api/staff/users/${userId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        fetchUsers() // Refresh the list
        setShowPromoteModal(false)
        setUserToPromote(null)
      } else {
        console.error('Failed to promote user')
      }
    } catch (error) {
      console.error('Error promoting user:', error)
    } finally {
      setPromoting(false)
    }
  }

  const handleDemoteUser = async (userId: string, newRole: string) => {
    setPromoting(true)
    try {
      const response = await fetch(`/api/staff/users/${userId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        fetchUsers() // Refresh the list
        setShowDemoteModal(false)
        setUserToPromote(null)
      } else {
        console.error('Failed to demote user')
      }
    } catch (error) {
      console.error('Error demoting user:', error)
    } finally {
      setPromoting(false)
    }
  }

  const openPromoteModal = (user: User) => {
    setUserToPromote(user)
    setShowPromoteModal(true)
  }

  const openDemoteModal = (user: User) => {
    setUserToPromote(user)
    setShowDemoteModal(true)
  }

  const closeModals = () => {
    setShowPromoteModal(false)
    setShowDemoteModal(false)
    setUserToPromote(null)
  }

  const isAdmin = session?.user?.role === 'admin'

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'banned' && user.isBanned) ||
                         (filterStatus === 'active' && !user.isBanned)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-emerald-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-300">Loading users...</p>
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
              <h1 className="text-3xl font-bold text-white">User Management</h1>
              <p className="text-gray-300 mt-1">
                Manage users, view activity, and moderate content
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-emerald-400" />
              <span className="text-sm font-medium text-gray-300">
                {users.length} users
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  placeholder="Search by name or email..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
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
                <option value="active">Active</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h3 className="text-lg font-medium text-white">
              Users ({filteredUsers.length})
            </h3>
          </div>
          
          <div className="divide-y divide-slate-700/50">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-6 hover:bg-slate-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-white">
                          {user.name || 'Unnamed User'}
                        </h4>
                        {user.role !== 'user' && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                            user.role === 'moderator' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {user.role}
                          </span>
                        )}
                        {user.isBanned && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
                            Banned
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-400">
                          {user._count.servers} servers
                        </span>
                        <span className="text-sm text-gray-400">
                          {user._count.pledges} pledges
                        </span>
                        <span className="text-sm text-gray-400">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {user.isBanned && user.banReason && (
                        <p className="text-sm text-red-400 mt-1">
                          Ban reason: {user.banReason}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Role Management - Admin Only */}
                    {isAdmin && user.id !== session?.user?.id && (
                      <div className="flex items-center space-x-1">
                        {user.role === 'user' && (
                          <button
                            onClick={() => openPromoteModal(user)}
                            className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <ArrowUp className="w-4 h-4" />
                            <span>Promote</span>
                          </button>
                        )}
                        {user.role === 'moderator' && (
                          <button
                            onClick={() => openDemoteModal(user)}
                            className="flex items-center space-x-1 px-3 py-1 text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-colors"
                          >
                            <ArrowDown className="w-4 h-4" />
                            <span>Demote</span>
                          </button>
                        )}
                        {user.role === 'admin' && (
                          <span className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-400 bg-slate-700/50 rounded-lg">
                            <Crown className="w-4 h-4" />
                            <span>Admin</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Ban/Unban Actions */}
                    {user.isBanned ? (
                      isAdmin && (
                        <button
                          onClick={() => handleUnbanUser(user.id)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Unban</span>
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => {
                          const reason = prompt('Enter ban reason:')
                          if (reason) handleBanUser(user.id, reason)
                        }}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                        <span>Ban</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {/* Promotion Confirmation Modal */}
        {showPromoteModal && userToPromote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <Crown className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Promote User</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to promote{' '}
                <span className="font-medium text-white">
                  {userToPromote.name || 'Unnamed User'}
                </span>{' '}
                to <span className="font-medium text-blue-400">Moderator</span>?
              </p>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <p className="text-sm text-blue-400 font-medium">Moderator Permissions:</p>
                </div>
                <ul className="text-sm text-blue-300 mt-2 space-y-1">
                  <li>• Can respond to support tickets</li>
                  <li>• Can ban users and servers</li>
                  <li>• Can access staff dashboard</li>
                  <li>• Cannot unban users (admin only)</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeModals}
                  disabled={promoting}
                  className="flex-1 px-4 py-2 text-gray-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePromoteUser(userToPromote.id, 'moderator')}
                  disabled={promoting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {promoting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <ArrowUp className="w-4 h-4" />
                      <span>Promote</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demotion Confirmation Modal */}
        {showDemoteModal && userToPromote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <ArrowDown className="w-6 h-6 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">Demote User</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to demote{' '}
                <span className="font-medium text-white">
                  {userToPromote.name || 'Unnamed User'}
                </span>{' '}
                from <span className="font-medium text-blue-400">Moderator</span> to{' '}
                <span className="font-medium text-gray-400">User</span>?
              </p>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <p className="text-sm text-orange-400 font-medium">Warning:</p>
                </div>
                <p className="text-sm text-orange-300 mt-1">
                  This will remove all moderator permissions. The user will lose access to staff features and will need to be promoted again to regain them.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeModals}
                  disabled={promoting}
                  className="flex-1 px-4 py-2 text-gray-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDemoteUser(userToPromote.id, 'user')}
                  disabled={promoting}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {promoting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <ArrowDown className="w-4 h-4" />
                      <span>Demote</span>
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
