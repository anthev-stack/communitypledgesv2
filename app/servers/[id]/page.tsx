'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Server, DollarSign, Users, Calendar, ArrowLeft, Heart, X, Gamepad2, MapPin, Copy, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import ServerStats from '@/components/ServerStats'
import DiscordInfo from '@/components/DiscordInfo'
import PledgeConfirmation from '@/components/PledgeConfirmation'
import { useNotifications } from '@/contexts/NotificationContext'
import PriceDisplay from '@/components/PriceDisplay'

interface ServerDetail {
  id: string
  name: string
  description: string
  cost: number
  costPerPerson: number
  isAcceptingPledges: boolean
  totalPledged: number
  progressPercentage: number
  withdrawalDay: number
  gameType: string
  region: string
  discordChannel?: string
  serverIp?: string
  serverPort?: number
  owner: {
    name: string
    image?: string
  }
  pledges: Array<{
    id: string
    amount: number
    user: {
      name: string
    }
    createdAt: string
  }>
  personalizedCosts?: Array<{
    userId: string
    userName: string
    pledgedAmount: number
    actualCost: number
    savings: number
  }>
  _count: {
    pledges: number
  }
  createdAt: string
}

export default function ServerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { addNotification } = useNotifications()
  const [server, setServer] = useState<ServerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pledgeAmount, setPledgeAmount] = useState(0)
  const [pledging, setPledging] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchServer()
    }
  }, [params.id])

  const fetchServer = async () => {
    try {
      const response = await fetch(`/api/servers/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setServer(data)
      } else {
        setError('Server not found')
      }
    } catch (error) {
      setError('Failed to fetch server')
    } finally {
      setLoading(false)
    }
  }

  const [showPledgeConfirmation, setShowPledgeConfirmation] = useState(false)
  const [pledgeData, setPledgeData] = useState<{
    amount: number
  } | null>(null)

  const handlePledge = async () => {
    if (!session) {
      addNotification({
        type: 'error',
        message: 'You must be logged in to pledge',
        duration: 4000
      })
      return
    }

    if (!pledgeAmount || pledgeAmount <= 0) {
      addNotification({
        type: 'error',
        message: 'Please enter a valid pledge amount',
        duration: 4000
      })
      return
    }

    setPledgeData({
      amount: pledgeAmount
    })
    setShowPledgeConfirmation(true)
  }

  const handlePledgeSuccess = async () => {
    setShowPledgeConfirmation(false)
    setPledgeData(null)
    setPledgeAmount(0)
    await fetchServer()
  }

  const handleUnpledge = async () => {
    if (!session) {
      addNotification({
        type: 'error',
        message: 'You must be logged in to unpledge',
        duration: 4000
      })
      return
    }

    setPledging(true)

    try {
      const response = await fetch(`/api/servers/${params.id}/pledge`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchServer()
      } else {
        const errorData = await response.json()
        addNotification({
          type: 'error',
          message: errorData.message || 'Failed to remove pledge',
          duration: 4000
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to remove pledge',
        duration: 4000
      })
    } finally {
      setPledging(false)
    }
  }

  const getUserPledge = () => {
    if (!session || !server) return null
    return server.pledges.find(pledge => pledge.user.name === session.user?.name)
  }

  const getPersonalizedCost = (userName: string) => {
    if (!server?.personalizedCosts) return null
    return server.personalizedCosts.find(cost => cost.userName === userName)
  }

  const copyServerIP = async (serverIp: string, serverPort?: number) => {
    const ipToCopy = serverPort ? `${serverIp}:${serverPort}` : serverIp
    try {
      await navigator.clipboard.writeText(ipToCopy)
      addNotification({
        type: 'success',
        message: `Server IP copied to clipboard: ${ipToCopy}`,
        duration: 3000
      })
    } catch (err) {
      console.error('Failed to copy IP:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = ipToCopy
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      addNotification({
        type: 'success',
        message: `Server IP copied to clipboard: ${ipToCopy}`,
        duration: 3000
      })
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    )
  }

  if (error || !server) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Server className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-white">Server not found</h3>
          <p className="mt-1 text-sm text-gray-300">{error}</p>
          <div className="mt-6">
            <Link
              href="/servers"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Servers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const userPledge = getUserPledge()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/servers"
          className="inline-flex items-center text-gray-300 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Servers
        </Link>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-slate-700/50">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">{server.name}</h1>
              <p className="text-gray-300 mt-2">{server.description}</p>
              <div className="flex items-center space-x-3 mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-400">
                  <Gamepad2 className="w-4 h-4 mr-1" />
                  {server.gameType}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-700/50 text-gray-300">
                  <MapPin className="w-4 h-4 mr-1" />
                  {server.region}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                server.isAcceptingPledges 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {server.isAcceptingPledges ? 'Accepting Pledges' : 'Goal Reached'}
              </span>
              {userPledge && (
                <span className="text-sm text-emerald-400 font-medium">
                  You pledged ${userPledge.amount}
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">MONTHLY COST</span>
                <PriceDisplay amount={server.cost} className="text-2xl font-bold text-white" />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">PAYMENT DUE DATE</span>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-lg font-semibold text-white">{server.withdrawalDay}st of each month</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">REMAINING COST</span>
                <span className="text-2xl font-bold text-emerald-400">${server.remainingCost?.toFixed(2) || '0.00'}</span>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 text-blue-400 mt-0.5">💡</div>
                  <div>
                    <p className="text-blue-300 text-sm font-medium mb-1">SMART COST DISTRIBUTION</p>
                    <p className="text-blue-200 text-xs">Higher pledgers help reduce overall costs. You'll never pay more than you pledged, but often pay less!</p>
                  </div>
                </div>
              </div>
              
              {server.serverIp && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">SERVER IP</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-mono text-white">
                      {server.serverIp}{server.serverPort ? `:${server.serverPort}` : ''}
                    </span>
                    <button
                      onClick={() => copyServerIP(server.serverIp!, server.serverPort)}
                      className="p-1 rounded hover:bg-slate-600/50 transition-colors"
                      title="Copy IP to clipboard"
                    >
                      <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">TOTAL PLEDGED</span>
                <span className="text-lg font-semibold text-white">
                  <PriceDisplay amount={server.totalPledged} className="text-white" /> / <PriceDisplay amount={server.cost} className="text-white" />
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">PLEDGERS</span>
                <span className="text-lg font-semibold text-white">
                  {server._count.pledges} people
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Progress</span>
                  <span className="text-sm text-gray-400">{server.progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div 
                    className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(server.progressPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Discord Community Info */}
              {server.discordChannel && (
                <div className="mt-4">
                  <DiscordInfo discordUrl={server.discordChannel} />
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-gray-400 mt-4">
                <span>Created: {new Date(server.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Live Server Stats */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Server className="w-5 h-5 mr-2" />
              LIVE SERVER STATUS
            </h3>
            <div className="bg-slate-700/30 rounded-lg p-6">
              <ServerStats serverId={server.id} gameType={server.gameType || 'minecraft'} />
            </div>
          </div>

          {/* Pledge Information */}
          <div className="border-t pt-6">
            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 mb-6">
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="w-full text-left flex items-center justify-between text-lg font-semibold text-white mb-4 hover:text-emerald-400 transition-colors"
              >
                <div className="flex items-center">
                  HOW COMMUNITY PLEDGING WORKS
                </div>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform duration-200 ${
                    showHowItWorks ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {showHowItWorks && (
                <div className="space-y-4 text-sm text-gray-300">
                  <div>
                    <h4 className="font-semibold mb-2 text-white">How It Works</h4>
                    <p>You pledge your maximum amount (what you're willing to pay). The system uses smart optimization to fairly distribute the actual server cost among all pledgers, often reducing what everyone pays!</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-white">Smart Cost Optimization</h4>
                    <p>The system balances costs intelligently: higher pledgers help reduce costs for everyone, but you never pay more than your pledged amount. The goal is to get everyone as close to <PriceDisplay amount={2} /> as possible.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-white"><PriceDisplay amount={2} /> Minimum Rule</h4>
                    <p>No one pays less than <PriceDisplay amount={2} /> per month. Once the cost per person reaches <PriceDisplay amount={2} />, the server stops accepting new pledges to maintain this minimum.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-white">Fair Distribution</h4>
                    <p>Higher pledgers help reduce costs for everyone. The system balances costs fairly while respecting each person's pledge limit - you never pay more than you pledged!</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-white">Dynamic Pricing</h4>
                    <p>If someone unpledges and costs go above <PriceDisplay amount={2} />, the server reopens for new pledges to bring costs back down.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pledge Section */}
            <div>
              {userPledge ? (
                <div className="text-center">
                  <div className="mb-4">
                    <p className="text-lg text-white">You've pledged ${userPledge.amount}</p>
                    <div className="text-sm text-gray-400">
                      <p>Your actual cost will be calculated using our optimization system shown below.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUnpledge}
                    disabled={pledging}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                  >
                    <X className="w-4 h-4" />
                    <span>{pledging ? 'Removing...' : 'Remove Pledge'}</span>
                  </button>
                </div>
              ) : server.isAcceptingPledges ? (
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">Make a Pledge</h3>
                  <div className="flex space-x-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="1000"
                      placeholder="Amount"
                      value={pledgeAmount || ''}
                      onChange={(e) => setPledgeAmount(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
                    />
                    <button
                      onClick={handlePledge}
                      disabled={pledging || !pledgeAmount || pledgeAmount <= 0}
                      className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Heart className="w-4 h-4" />
                      <span>{pledging ? 'Pledging...' : 'Pledge'}</span>
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 text-center mt-2">
                    <p className="text-yellow-400">💡 You'll only pay what you pledge (up to your limit), but higher pledges help reduce everyone's costs!</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-lg text-gray-300 mb-2">Fully funded!</p>
                  <p className="text-sm text-gray-400">
                    All pledges have been collected
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pledges List */}
        {server.pledges.length > 0 && (
          <div className="border-t bg-slate-700/30 px-8 py-6">
            <h3 className="text-lg font-semibold text-white mb-4">Pledges ({server.pledges.length})</h3>
            <div className="space-y-3">
              {server.pledges.map((pledge) => {
                const personalizedCost = getPersonalizedCost(pledge.user.name)
                return (
                  <div key={pledge.id} className="flex justify-between items-center py-3 border-b border-slate-600 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{pledge.user.name}</p>
                        <p className="text-sm text-gray-400">{new Date(pledge.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Pledged:</span>
                        <span className="text-lg font-bold text-emerald-400">${pledge.amount.toFixed(2)}</span>
                      </div>
                      {personalizedCost && (
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-400">Pays:</span>
                          <span className="text-lg font-bold text-green-400">${personalizedCost.actualCost.toFixed(2)}</span>
                          {personalizedCost.savings > 0 && (
                            <span className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded-full">
                              Reduced ${personalizedCost.savings.toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pledge Confirmation Modal */}
        {pledgeData && (
          <PledgeConfirmation
            isOpen={showPledgeConfirmation}
            onClose={() => setShowPledgeConfirmation(false)}
            onSuccess={handlePledgeSuccess}
            serverName={server?.name || ''}
            serverId={params.id}
            amount={pledgeData.amount}
          />
        )}
      </div>
    </div>
  )
}
