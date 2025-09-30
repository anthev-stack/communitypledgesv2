import { notFound } from 'next/navigation'
import { User, Calendar, Server, DollarSign, Users } from 'lucide-react'
import { prisma } from '@/lib/prisma'

interface UserPageProps {
  params: {
    username: string
  }
}

export default async function UserPage({ params }: UserPageProps) {
  const { username } = params

  // Fetch user data from database
  const user = await prisma.user.findUnique({
    where: {
      name: username
    },
    include: {
      servers: {
        where: {
          isActive: true
        },
        include: {
          pledges: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              pledges: true
            }
          }
        }
      },
      pledges: {
        include: {
          server: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!user) {
    notFound()
  }

  const totalPledged = user.pledges.reduce((sum, pledge) => sum + pledge.amount, 0)
  const totalServerCost = user.servers.reduce((sum, server) => sum + server.cost, 0)

  // Calculate dynamic pricing for servers
  const serversWithPricing = user.servers.map(server => {
    const totalPledged = server.pledges.reduce((sum, pledge) => sum + pledge.amount, 0)
    const pledgeCount = server.pledges.length
    const remainingCost = Math.max(0, server.cost - totalPledged)
    
    // Server is fully funded when total pledged >= server cost
    const isFullyFunded = totalPledged >= server.cost
    
    // Calculate what the cost per person would be if we divided equally among current pledgers
    const equalDivision = pledgeCount > 0 ? server.cost / pledgeCount : server.cost
    
    // Show the equal division cost, but users only pay what they pledged
    const costPerPerson = equalDivision

    return {
      ...server,
      costPerPerson: Math.round(costPerPerson * 100) / 100,
      isAcceptingPledges: !isFullyFunded,
      remainingCost: Math.round(remainingCost * 100) / 100,
      isFullyFunded
    }
  })

  return (
    <div className="max-w-4xl mx-auto">
      {/* User Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-8 mb-8 border border-slate-700/50">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            {user.image ? (
              <img
                src={user.image}
                alt={user.username}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-emerald-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{user.name}</h1>
          <p className="text-gray-300 mt-2">Community Member since {new Date(user.createdAt).toLocaleDateString()}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{user.servers.length}</div>
                <div className="text-sm text-gray-400">Servers Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{user.pledges.length}</div>
                <div className="text-sm text-gray-400">Active Pledges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">${totalPledged.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Total Pledged</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Servers Created */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
          <div className="flex items-center space-x-2 mb-4">
            <Server className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">Servers Created</h2>
          </div>
          
          {serversWithPricing.length > 0 ? (
            <div className="space-y-4">
              {serversWithPricing.map((server) => (
                <div key={server.id} className="border border-slate-600/50 rounded-lg p-4 bg-slate-700/30">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white">{server.name}</h3>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        server.isAcceptingPledges 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {server.isAcceptingPledges ? 'Accepting Pledges' : 'Goal Reached'}
                      </span>
                      <span className="text-xs text-gray-400">
                        ${server.costPerPerson.toFixed(2)} per person
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-400">Monthly Cost: ${server.cost}</span>
                    <span className="text-sm text-gray-400">
                      {server._count.pledges} pledges
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${Math.min((server._count.pledges * server.costPerPerson / server.cost) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No servers created yet</p>
          )}
        </div>

        {/* Pledges Made */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">Pledges Made</h2>
          </div>
          
          {user.pledges.length > 0 ? (
            <div className="space-y-4">
              {user.pledges.map((pledge) => (
                <div key={pledge.id} className="border border-slate-600/50 rounded-lg p-4 bg-slate-700/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">{pledge.server.name}</h3>
                      <p className="text-sm text-gray-400">
                        Pledged on {new Date(pledge.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-emerald-400">${pledge.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No pledges made yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
