'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Server, DollarSign, Users, Plus, Calendar, Heart, UserPlus, AlertCircle, Clock, X, Pause, Zap, Edit, Trash2, Save } from 'lucide-react'
import CountdownTimer from '@/components/CountdownTimer'
import { useNotifications } from '@/contexts/NotificationContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import PriceDisplay from '@/components/PriceDisplay'

const editServerSchema = z.object({
  name: z.string().min(3, 'Server name must be at least 3 characters').max(50, 'Server name must be less than 50 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  cost: z.number().min(15, 'Cost must be at least A$15').max(80, 'Cost must be at most A$80'),
  withdrawalDay: z.number().min(1, 'Withdrawal day must be between 1-31').max(31, 'Withdrawal day must be between 1-31'),
  gameType: z.string().min(1, 'Game type is required'),
  region: z.string().min(1, 'Region is required'),
  bannerUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  serverIp: z.string().min(1, 'Server IP or domain is required'),
  serverPort: z.number().min(1, 'Port must be between 1-65535').max(65535, 'Port must be between 1-65535').nullable().optional(),
  discordChannel: z.string().url('Please enter a valid Discord URL').optional().or(z.literal('')),
  discordWebhook: z.string()
    .url('Please enter a valid Discord webhook URL')
    .refine((url) => {
      if (!url) return true; // Allow empty
      return url.includes('discord.com/api/webhooks/') || url.includes('discordapp.com/api/webhooks/');
    }, 'Please enter a valid Discord webhook URL (must contain discord.com/api/webhooks/)')
    .optional()
    .or(z.literal('')),
  tags: z.string().min(1, 'At least one tag is required')
})

type EditServerForm = z.infer<typeof editServerSchema>

interface DashboardData {
  stats: {
    totalPledged: number
    activePledges: number
    serversCreated: number
  }
  myServers: Array<{
    id: string
    name: string
    description: string
    cost: number
    withdrawalDay: number
    gameType: string
    region: string
    bannerUrl?: string
    serverIp?: string
    serverPort?: number
    discordChannel?: string
    discordWebhook?: string
    tags: string
    currentPledges: number
    costPerPerson: number
    isAcceptingPledges: boolean
    status: string
    isActive: boolean
    hasActiveBoost: boolean
    boostExpiresAt?: string
  }>
  recentActivity: Array<{
    id: string
    type: string
    message: string
    date: string
    amount?: number
    serverName?: string
    userName?: string
  }>
  serverActivity: Array<{
    id: string
    type: string
    message: string
    date: string
    amount?: number
    serverName?: string
    userName?: string
  }>
  nextPledgeCharges: Array<{
    serverName: string
    pledgedAmount: number
    actualCost: number
    savings: number
    nextChargeDate: string
    daysUntilCharge: number
    serverId: string
  }>
  paymentStatus: {
    failureCount: number
    lastFailure: string | null
    isSuspended: boolean
    suspendedAt: string | null
    remainingAttempts: number
  } | null
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addNotification } = useNotifications()
  const { formatAmount } = useCurrency()
  const markAsRead = () => {} // Temporarily disabled
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeActivityTab, setActiveActivityTab] = useState<'recent' | 'server'>('recent')
  const [showBoostConfirm, setShowBoostConfirm] = useState(false)
  const [serverToBoost, setServerToBoost] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [serverToEdit, setServerToEdit] = useState<any>(null)
  const [serverToDelete, setServerToDelete] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)

  const editForm = useForm<EditServerForm>({
    resolver: zodResolver(editServerSchema),
    defaultValues: {
      name: '',
      description: '',
      cost: 15,
      withdrawalDay: 1,
      gameType: 'minecraft',
      region: 'US-East',
      bannerUrl: '',
      serverIp: '',
      serverPort: null,
      discordChannel: '',
      discordWebhook: '',
      tags: ''
    }
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status, router])

  // Mark activities as read when dashboard data is loaded
  useEffect(() => {
    if (dashboardData && !loading) {
      markAsRead()
    }
  }, [dashboardData, loading, markAsRead])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBoostServer = (serverId: string) => {
    setServerToBoost(serverId)
    setShowBoostConfirm(true)
  }

  const confirmBoost = async () => {
    if (!serverToBoost) return

    try {
      const response = await fetch(`/api/servers/${serverToBoost}/boost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Server Boosted!',
          message: 'Your server will appear at the top of the server list for 24 hours.',
          duration: 5000
        })
        // Refresh dashboard data to show updated boost status
        fetchDashboardData()
      } else {
        const error = await response.json()
        addNotification({
          type: 'error',
          title: 'Boost Failed',
          message: error.error || 'Failed to boost server',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error boosting server:', error)
      addNotification({
        type: 'error',
        title: 'Boost Failed',
        message: 'Failed to boost server',
        duration: 5000
      })
    } finally {
      setShowBoostConfirm(false)
      setServerToBoost(null)
    }
  }

  const cancelBoost = () => {
    setShowBoostConfirm(false)
    setServerToBoost(null)
  }

  const handleEditServer = (server: any) => {
    setServerToEdit(server)
    // Populate form with current server data
    editForm.reset({
      name: server.name || '',
      description: server.description || '',
      cost: server.cost || 15,
      withdrawalDay: server.withdrawalDay || 1,
      gameType: server.gameType || 'minecraft',
      region: server.region || 'US-East',
      bannerUrl: server.bannerUrl || '',
      serverIp: server.serverIp || '',
      serverPort: server.serverPort || null,
      discordChannel: server.discordChannel || '',
      discordWebhook: server.discordWebhook || '',
      tags: server.tags || ''
    })
    setShowEditModal(true)
  }

  const onEditSubmit = async (data: EditServerForm) => {
    if (!serverToEdit) return

    setIsEditing(true)
    try {
      // Check if cost or withdrawal day changed (this will remove pledges)
      const costChanged = data.cost !== serverToEdit.cost
      const dateChanged = data.withdrawalDay !== serverToEdit.withdrawalDay
      const willRemovePledges = costChanged || dateChanged

      const response = await fetch(`/api/servers/${serverToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          willRemovePledges
        })
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Server Updated',
          message: willRemovePledges 
            ? 'Server updated successfully. All existing pledges have been removed due to cost or date changes.'
            : 'Server updated successfully.',
          duration: 5000
        })
        setShowEditModal(false)
        setServerToEdit(null)
        // Refresh dashboard data
        fetchDashboardData()
      } else {
        const error = await response.json()
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: error.message || 'Failed to update server',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error updating server:', error)
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update server',
        duration: 5000
      })
    } finally {
      setIsEditing(false)
    }
  }

  const cancelEdit = () => {
    setShowEditModal(false)
    setServerToEdit(null)
    editForm.reset()
  }

  const handleDeleteServer = (server: any) => {
    setServerToDelete(server)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!serverToDelete) return

    try {
      const response = await fetch(`/api/servers?id=${serverToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Server Deleted',
          message: `"${serverToDelete.name}" has been deleted permanently`,
          duration: 5000
        })
        // Refresh dashboard data
        fetchDashboardData()
      } else {
        const error = await response.json()
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: error.message || 'Failed to delete server',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error deleting server:', error)
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete server',
        duration: 5000
      })
    } finally {
      setShowDeleteModal(false)
      setServerToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setServerToDelete(null)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!session || !dashboardData) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-300 mt-2">Welcome back, {session.user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Pledged</p>
              <p className="text-2xl font-bold text-white"><PriceDisplay amount={dashboardData.stats.totalPledged} /></p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Active Pledges</p>
              <p className="text-2xl font-bold text-white">{dashboardData.stats.activePledges}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Server className="w-6 h-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Servers Created</p>
              <p className="text-2xl font-bold text-white">{dashboardData.stats.serversCreated}</p>
            </div>
          </div>
        </div>

      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* My Servers */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">My Servers</h2>
            <div className="flex space-x-3">
              <Link
                href="/tickets"
                className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4" />
                <span>My Tickets</span>
              </Link>
              <Link
                href="/servers/create"
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Server</span>
              </Link>
            </div>
          </div>

          {dashboardData.myServers.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.myServers.map((server) => (
                <div key={server.id} className={`border rounded-lg p-4 ${
                  !server.isActive ? 'border-red-500/50 bg-red-900/20' : 'border-slate-700/50 bg-slate-700/30'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-white">{server.name}</h3>
                      {server.hasActiveBoost && (
                        <div className="flex items-center space-x-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium px-2 py-1 rounded-full">
                          <Zap className="w-3 h-3" />
                          <span>BOOSTED</span>
                        </div>
                      )}
                      {!server.isActive && (
                        <div className="flex items-center space-x-1 bg-red-500/20 text-red-400 text-xs font-medium px-2 py-1 rounded-full">
                          <Pause className="w-3 h-3" />
                          <span>PAUSED</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditServer(server)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                        title="Edit Server"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteServer(server)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                        title="Delete Server"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        !server.isActive 
                          ? 'bg-red-500/20 text-red-400'
                          : server.isAcceptingPledges 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {!server.isActive 
                          ? 'Server Paused' 
                          : server.isAcceptingPledges 
                            ? 'Accepting Pledges' 
                            : 'Goal Reached'
                        }
                      </span>
                      <span className="text-xs text-gray-400">
                        <PriceDisplay amount={server.costPerPerson} /> per person
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                    <span>Monthly Cost: <PriceDisplay amount={server.cost} /></span>
                    <span>{server.currentPledges} pledges</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${Math.min((server.currentPledges * server.costPerPerson / server.cost) * 100, 100)}%` }}
                    ></div>
                  </div>
                  
                  {/* Boost Button */}
                  {server.isActive && (
                    <div className="mt-3 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        {server.hasActiveBoost && server.boostExpiresAt && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-400">Boost expires in:</span>
                            <CountdownTimer expiresAt={server.boostExpiresAt} />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleBoostServer(server.id)}
                        disabled={server.hasActiveBoost}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          server.hasActiveBoost
                            ? 'bg-slate-700 text-gray-400 cursor-not-allowed'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                        }`}
                      >
                        {server.hasActiveBoost ? 'Already Boosted' : `Boost Server (${formatAmount(3)})`}
                      </button>
                    </div>
                  )}
                  {!server.isActive && (
                    <div className="mt-3 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="text-red-400 font-medium">Server is paused</p>
                          <p className="text-red-300 mt-1">
                            This server is not accepting new pledges. Add a payment or deposit method in your 
                            <Link href="/settings" className="underline font-medium hover:text-red-200"> settings</Link> to unpause it.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Server className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No servers yet</h3>
              <p className="mt-1 text-sm text-gray-400">Get started by creating a new server.</p>
            </div>
          )}
        </div>

        {/* Payment Status Warning */}
        {dashboardData.paymentStatus && (dashboardData.paymentStatus.isSuspended || dashboardData.paymentStatus.failureCount > 0) && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-400 mb-1">
                  {dashboardData.paymentStatus.isSuspended ? 'Account Suspended' : 'Payment Issues Detected'}
                </h3>
                <p className="text-sm text-red-300 mb-2">
                  {dashboardData.paymentStatus.isSuspended 
                    ? 'Your account has been suspended due to repeated payment failures. Please contact support to resolve this issue.'
                    : `You have ${dashboardData.paymentStatus.failureCount} payment failure(s). ${dashboardData.paymentStatus.remainingAttempts} attempts remaining before account suspension.`
                  }
                </p>
                {dashboardData.paymentStatus.lastFailure && (
                  <p className="text-xs text-red-400">
                    Last failure: {new Date(dashboardData.paymentStatus.lastFailure).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pledge Commitments */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Pledge Commitments</h2>
          
          {/* Next Pledge Charges */}
          {dashboardData.nextPledgeCharges.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-400" />
                Next Pledge Charges
              </h3>
              <div className="space-y-3">
                {dashboardData.nextPledgeCharges.slice(0, 3).map((charge, index) => (
                  <div key={index} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-white">{charge.serverName}</p>
                        <p className="text-sm text-blue-300">
                          {charge.daysUntilCharge === 0 
                            ? 'Charging today!' 
                            : charge.daysUntilCharge === 1 
                            ? 'Charging tomorrow'
                            : `Charging in ${charge.daysUntilCharge} days`
                          }
                        </p>
                        <p className="text-xs text-blue-400 mt-1">
                          {new Date(charge.nextChargeDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="space-y-1">
                          <div>
                            <p className="font-semibold text-blue-300"><PriceDisplay amount={charge.actualCost} /></p>
                            <p className="text-xs text-blue-400">actual cost</p>
                          </div>
                          {charge.savings > 0 && (
                            <div className="pt-1 border-t border-blue-500/30">
                              <p className="text-sm text-green-400 font-medium">-<PriceDisplay amount={charge.savings} /></p>
                              <p className="text-xs text-green-400">savings</p>
                            </div>
                          )}
                          {charge.pledgedAmount !== charge.actualCost && (
                            <div className="pt-1">
                              <p className="text-xs text-gray-400">pledged: <PriceDisplay amount={charge.pledgedAmount} /></p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {dashboardData.nextPledgeCharges.length > 3 && (
                  <p className="text-sm text-gray-400 text-center">
                    +{dashboardData.nextPledgeCharges.length - 3} more charge{dashboardData.nextPledgeCharges.length - 3 > 1 ? 's' : ''} scheduled
                  </p>
                )}
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Activity Section */}
      <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Activity</h2>
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="w-4 h-4 mr-1" />
            <span>Live updates</span>
          </div>
        </div>

        {/* Activity Tab Navigation */}
        <div className="border-b border-slate-600 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveActivityTab('recent')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeActivityTab === 'recent'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-slate-500'
              }`}
            >
              Recent Activity
            </button>
            {dashboardData.myServers.length > 0 && (
              <button
                onClick={() => setActiveActivityTab('server')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeActivityTab === 'server'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-slate-500'
                }`}
              >
                Server Activity
              </button>
            )}
          </nav>
        </div>
        
        <div className="space-y-4">
          {activeActivityTab === 'recent' ? (
            // Recent Activity Tab
            dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 py-4 border-b border-slate-600 last:border-b-0 hover:bg-slate-700/30 rounded-lg px-2 -mx-2 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {activity.type === 'pledge' ? (
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-green-600" />
                    </div>
                  ) : activity.type === 'unpledge' ? (
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="w-5 h-5 text-red-600" />
                    </div>
                  ) : activity.type === 'server_pledge' ? (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                    </div>
                  ) : activity.type === 'server_unpledge' ? (
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                  ) : activity.type === 'server_created' ? (
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Server className="w-5 h-5 text-purple-600" />
                    </div>
                  ) : activity.type === 'server_boost' ? (
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-yellow-600" />
                    </div>
                  ) : activity.type === 'payment_processed' ? (
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                  ) : activity.type === 'deposit_received' ? (
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.message}</p>
                      {activity.amount && (
                        <p className="text-sm text-green-400 font-semibold mt-1">
                          <PriceDisplay amount={activity.amount} />
                        </p>
                      )}
                      {activity.serverName && (
                        <p className="text-xs text-gray-400 mt-1">
                          Server: {activity.serverName}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No recent activity</h3>
              <p className="mt-1 text-sm text-gray-400">Your personal pledge activities will appear here.</p>
            </div>
          )
        ) : (
          // Server Activity Tab
          dashboardData.serverActivity.length > 0 ? (
            dashboardData.serverActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 py-4 border-b border-slate-600 last:border-b-0 hover:bg-slate-700/30 rounded-lg px-2 -mx-2 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {activity.type === 'server_pledge' ? (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                    </div>
                  ) : activity.type === 'server_unpledge' ? (
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                  ) : activity.type === 'deposit_received' ? (
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.message}</p>
                      {activity.amount && (
                        <p className="text-sm text-green-400 font-semibold mt-1">
                          <PriceDisplay amount={activity.amount} />
                        </p>
                      )}
                      {activity.serverName && (
                        <p className="text-xs text-gray-400 mt-1">
                          Server: {activity.serverName}
                        </p>
                      )}
                      {activity.userName && (
                        <p className="text-xs text-gray-500 mt-1">
                          User: {activity.userName}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Server className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No server activity</h3>
              <p className="mt-1 text-sm text-gray-400">Activity on your servers will appear here when people pledge or unpledge.</p>
            </div>
          )
        )}
        </div>
      </div>

      {/* Boost Confirmation Modal */}
      {showBoostConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Boost Server</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to boost this server? This will charge you <strong className="text-white"><PriceDisplay amount={3} /></strong> from your payment method and make your server appear at the top of the server list for 24 hours.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelBoost}
                className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-gray-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBoost}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Boost Server ({formatAmount(3)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && serverToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Server</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-3">
                Are you sure you want to delete <strong className="text-white">"{serverToDelete.name}"</strong>?
              </p>
              <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-300">
                    <p className="font-medium">This action cannot be undone!</p>
                    <p className="mt-1">
                      This will permanently delete your server and remove all associated pledges, 
                      activities, and data. All users who have pledged to this server will be notified.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-gray-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete Server
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Server Modal */}
      {showEditModal && serverToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Edit className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Edit Server</h3>
                </div>
                <button
                  onClick={cancelEdit}
                  className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                {/* Warning about pledge removal */}
                {(() => {
                  const costChanged = editForm.watch('cost') !== serverToEdit.cost
                  const dateChanged = editForm.watch('withdrawalDay') !== serverToEdit.withdrawalDay
                  const willRemovePledges = costChanged || dateChanged
                  
                  return willRemovePledges && (
                    <div className="p-4 bg-orange-900/20 border border-orange-500/50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-orange-300">
                          <p className="font-medium">Warning: Changing cost or withdrawal date will remove all existing pledges!</p>
                          <p className="mt-1">
                            All users who have pledged to this server will be notified and their pledges will be cancelled.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Server Name
                    </label>
                    <input
                      {...editForm.register('name')}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {editForm.formState.errors.name && (
                      <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Monthly Cost (AUD)
                    </label>
                    <input
                      {...editForm.register('cost', { valueAsNumber: true })}
                      type="number"
                      min="15"
                      max="80"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {editForm.formState.errors.cost && (
                      <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.cost.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Withdrawal Day
                    </label>
                    <input
                      {...editForm.register('withdrawalDay', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="31"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {editForm.formState.errors.withdrawalDay && (
                      <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.withdrawalDay.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Game Type
                    </label>
                    <select
                      {...editForm.register('gameType')}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="minecraft">Minecraft</option>
                      <option value="cs2">Counter-Strike 2</option>
                      <option value="csgo">Counter-Strike: Global Offensive</option>
                      <option value="rust">Rust</option>
                      <option value="ark">ARK: Survival Evolved</option>
                      <option value="valheim">Valheim</option>
                      <option value="other">Other</option>
                    </select>
                    {editForm.formState.errors.gameType && (
                      <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.gameType.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Region
                    </label>
                    <select
                      {...editForm.register('region')}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="US-East">US-East</option>
                      <option value="US-West">US-West</option>
                      <option value="US-Central">US-Central</option>
                      <option value="Europe">Europe</option>
                      <option value="UK">UK</option>
                      <option value="Asia-Pacific">Asia-Pacific</option>
                    </select>
                    {editForm.formState.errors.region && (
                      <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.region.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Server IP
                    </label>
                    <input
                      {...editForm.register('serverIp')}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {editForm.formState.errors.serverIp && (
                      <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.serverIp.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Server Port
                    </label>
                    <input
                      {...editForm.register('serverPort', { 
                        valueAsNumber: true,
                        setValueAs: (value) => value === '' ? null : Number(value)
                      })}
                      type="number"
                      min="1"
                      max="65535"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {editForm.formState.errors.serverPort && (
                      <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.serverPort.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Banner URL (Optional)
                    </label>
                    <input
                      {...editForm.register('bannerUrl')}
                      type="url"
                      placeholder="https://example.com/banner.gif"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {editForm.formState.errors.bannerUrl && (
                      <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.bannerUrl.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Discord Channel (Optional)
                    </label>
                    <input
                      {...editForm.register('discordChannel')}
                      type="url"
                      placeholder="https://discord.gg/your-invite"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {editForm.formState.errors.discordChannel && (
                      <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.discordChannel.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Discord Webhook (Optional)
                  </label>
                  <input
                    {...editForm.register('discordWebhook')}
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-400">
                    Discord webhook URL to receive pledge notifications in your server
                  </p>
                  {editForm.formState.errors.discordWebhook && (
                    <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.discordWebhook.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags
                  </label>
                  <input
                    {...editForm.register('tags')}
                    placeholder="pvp, survival, modded, friendly, etc."
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-400">
                    Comma-separated tags to help users find your server
                  </p>
                  {editForm.formState.errors.tags && (
                    <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.tags.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    {...editForm.register('description')}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {editForm.formState.errors.description && (
                    <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.description.message}</p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-gray-300 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditing}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isEditing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Update Server</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
