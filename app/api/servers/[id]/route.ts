import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function calculateOptimizedCosts(pledgeAmounts: number[], serverCost: number, minCostPerPerson: number) {
  const totalPledged = pledgeAmounts.reduce((sum, amount) => sum + amount, 0)
  const pledgeCount = pledgeAmounts.length
  
  // If no pledges, accept new ones
  if (pledgeCount === 0) {
    return {
      optimizedCosts: [],
      isAcceptingPledges: true,
      maxPeople: Math.floor(serverCost / minCostPerPerson)
    }
  }
  
  // Calculate maximum people we can have at minimum cost
  const maxPeople = Math.floor(serverCost / minCostPerPerson)
  
  // If we have more people than max, stop accepting
  if (pledgeCount >= maxPeople) {
    return {
      optimizedCosts: new Array(pledgeCount).fill(minCostPerPerson),
      isAcceptingPledges: false,
      maxPeople
    }
  }
  
  // If total pledged is less than server cost, accept more pledges
  if (totalPledged < serverCost) {
    return {
      optimizedCosts: pledgeAmounts, // Users pay what they pledged
      isAcceptingPledges: true,
      maxPeople
    }
  }
  
  // Total pledged >= server cost, optimize distribution
  // Start with everyone paying their pledged amount
  let optimizedCosts = [...pledgeAmounts]
  let excess = totalPledged - serverCost
  
  // Create array of indices sorted by pledge amount (highest first)
  const sortedIndices = pledgeAmounts
    .map((amount, index) => ({ amount, index }))
    .sort((a, b) => b.amount - a.amount)
    .map(item => item.index)
  
  // Distribute excess by reducing costs among higher pledgers
  // We want to balance costs fairly among those who can afford to split
  let remainingExcess = excess
  
  // Create a more sophisticated balancing algorithm
  // First, identify who can participate in cost reduction (pledged more than minimum)
  const eligiblePledgers = sortedIndices.filter(index => 
    optimizedCosts[index] > minCostPerPerson
  )
  
  if (eligiblePledgers.length > 0) {
    // Calculate how much each eligible pledger can contribute to cost reduction
    const totalReducible = eligiblePledgers.reduce((sum, index) => 
      sum + (optimizedCosts[index] - minCostPerPerson), 0
    )
    
    if (remainingExcess <= totalReducible) {
      // We can balance the costs fairly
      // Distribute the excess proportionally among eligible pledgers
      for (const index of eligiblePledgers) {
        const currentCost = optimizedCosts[index]
        const maxReduction = currentCost - minCostPerPerson
        const proportionalReduction = (maxReduction / totalReducible) * remainingExcess
        
        optimizedCosts[index] = currentCost - proportionalReduction
      }
      remainingExcess = 0
    } else {
      // Reduce everyone to minimum and distribute remaining excess
      for (const index of eligiblePledgers) {
        const currentCost = optimizedCosts[index]
        const reduction = currentCost - minCostPerPerson
        optimizedCosts[index] = minCostPerPerson
        remainingExcess -= reduction
      }
    }
  }
  
  // Check if we can accept more people
  const canAcceptMore = pledgeCount < maxPeople
  
  return {
    optimizedCosts,
    isAcceptingPledges: canAcceptMore,
    maxPeople
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serverId = params.id

    const server = await prisma.server.findUnique({
      where: {
        id: serverId,
        isActive: true
      },
      include: {
        owner: {
          select: {
            name: true,
            image: true
          }
        },
        pledges: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            pledges: true
          }
        }
      }
    })

    if (!server) {
      return NextResponse.json(
        { message: 'Server not found' },
        { status: 404 }
      )
    }

    // Calculate dynamic pricing
    const totalPledged = server.pledges.reduce((sum, pledge) => sum + pledge.amount, 0)
    const pledgeCount = server.pledges.length
    const pledgeAmounts = server.pledges.map(pledge => pledge.amount)
    const minCostPerPerson = 2
    
    const { optimizedCosts, isAcceptingPledges, maxPeople } = calculateOptimizedCosts(
      pledgeAmounts,
      server.cost,
      minCostPerPerson
    )
    
    const remainingCost = Math.max(0, server.cost - totalPledged)
    const averageCost = pledgeCount > 0 ? server.cost / pledgeCount : server.cost

    // Create personalized costs for each pledge
    const personalizedCosts = server.pledges.map((pledge, index) => ({
      userId: pledge.userId,
      userName: pledge.user.name,
      pledgedAmount: pledge.amount,
      actualCost: optimizedCosts[index] || pledge.amount,
      savings: Math.max(0, pledge.amount - (optimizedCosts[index] || pledge.amount))
    }))

    const serverWithPricing = {
      ...server,
      costPerPerson: Math.round(averageCost * 100) / 100,
      isAcceptingPledges,
      totalPledged: Math.round(totalPledged * 100) / 100,
      remainingCost: Math.round(remainingCost * 100) / 100,
      progressPercentage: Math.min((totalPledged / server.cost) * 100, 100),
      isFullyFunded: !isAcceptingPledges,
      optimizedCosts,
      personalizedCosts,
      maxPeople
    }

    return NextResponse.json(serverWithPricing)
  } catch (error) {
    console.error('Error fetching server:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
