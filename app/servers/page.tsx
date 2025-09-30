'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Server, Plus, Users, DollarSign, Calendar, Search, Filter, Gamepad2, Tag, Heart, Zap, MapPin, Copy } from 'lucide-react'
import ServerStats from '@/components/ServerStats'
import { useNotifications } from '@/contexts/NotificationContext'
import PriceDisplay from '@/components/PriceDisplay'

const REGIONS = [
  'US-East',
  'US-West', 
  'US-Central',
  'Europe',
  'UK',
  'Germany',
  'France',
  'Netherlands',
  'Australia',
  'New Zealand',
  'Asia-Pacific',
  'Singapore',
  'Japan',
  'South Korea',
  'Brazil',
  'Canada',
  'Mexico',
  'India',
  'Middle East',
  'South Africa'
]

interface ServerData {
  id: string
  name: string
  description: string
  cost: number
  isAcceptingPledges: boolean
  gameType: string
  region: string
  tags: string
  bannerUrl?: string
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
    favorites: number
  }
  createdAt: string
  isFavorited: boolean
  hasActiveBoost: boolean
  boostExpiresAt?: string
}

interface UserSettings {
  hasPaymentMethod: boolean
  hasDepositMethod: boolean
}

const GAME_TYPES = [
  'Minecraft',
  'Counter-Strike 2',
  'Counter-Strike: Global Offensive',
  'Team Fortress 2',
  'Garry\'s Mod',
  'ARK: Survival Evolved',
  'Rust',
  'Valheim',
  '7 Days to Die',
  'Terraria',
  'Factorio',
  'Satisfactory',
  'Space Engineers',
  'Astroneer',
  'Don\'t Starve Together',
  'Project Zomboid',
  'The Forest',
  'Green Hell',
  'Conan Exiles',
  'Atlas',
  'DayZ',
  'Unturned',
  'Palworld',
  'Enshrouded',
  'V Rising',
  'Icarus',
  'Grounded',
  'Raft',
  'Subnautica',
  'No Man\'s Sky',
  'Eco',
  'Other'
]

const GAME_SPECIFIC_TAGS: { [key: string]: string[] } = {
  'Minecraft': [
    'Survival', 'Creative', 'Vanilla', 'Modded', 'Factions', 'Economy', 'Hardcore',
    'Roleplay', 'Towny', 'Skyblock', 'Minigames', 'Anarchy', 'Semi-Vanilla',
    'KitPvP', 'Prison', 'Skywars', 'Bedwars', 'Build', 'Redstone', 'Technical',
    'Hermitcraft', 'Whitelist', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Competitive', 'Casual', 'Speedrun', 'Challenge', 'Adventure', 'Exploration'
  ],
  'Counter-Strike 2': [
    'Casual', 'Competitive', 'Retakes', 'Surf', 'Jailbreak', 'Bhop', 'Climb',
    'Minigames', 'Deathrun', 'Aim', 'KZ', '1v1', 'Arena', 'Gun Game', 'TTT',
    'Murder', 'Zombie', 'Escape', 'Hostage', 'Bomb', 'Defuse', 'Wingman',
    'Danger Zone', 'War Games', 'Arms Race', 'Demolition', 'Public', 'Community',
    'Friendly', 'Mature', 'Family-Friendly', 'Whitelist', '5v5', '10v10'
  ],
  'Counter-Strike: Global Offensive': [
    'Casual', 'Competitive', 'Retakes', 'Surf', 'Jailbreak', 'Bhop', 'Climb',
    'Minigames', 'Deathrun', 'Aim', 'KZ', '1v1', 'Arena', 'Gun Game', 'TTT',
    'Murder', 'Zombie', 'Escape', 'Hostage', 'Bomb', 'Defuse', 'Wingman',
    'Danger Zone', 'War Games', 'Arms Race', 'Demolition', 'Public', 'Community',
    'Friendly', 'Mature', 'Family-Friendly', 'Whitelist', '5v5', '10v10'
  ],
  'ARK: Survival Evolved': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Factions',
    'Tribe Wars', 'Raid', 'Building', 'Breeding', 'Taming', 'Boss Fights',
    'Cave Running', 'Ocean', 'Aberration', 'Extinction', 'Genesis', 'Fjordur',
    'Crystal Isles', 'Ragnarok', 'The Center', 'Valguero', 'Public', 'Community',
    'Friendly', 'Mature', 'Family-Friendly', 'Whitelist', 'Roleplay', 'Economy'
  ],
  'Rust': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Factions',
    'Clan Wars', 'Raid', 'Building', 'Farming', 'PvP Arena', 'KitPvP',
    'Prison', 'Minigames', 'Roleplay', 'Economy', 'Shop', 'Events', 'Monthly',
    'Weekly', 'Bi-Weekly', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Valheim': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building',
    'Exploration', 'Boss Fights', 'Sailing', 'Farming', 'Crafting', 'Mining',
    'Fishing', 'Hunting', 'Roleplay', 'Economy', 'Events', 'Public', 'Community',
    'Friendly', 'Mature', 'Family-Friendly', 'Whitelist', 'Competitive', 'Casual'
  ],
  '7 Days to Die': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Zombie',
    'Horde Night', 'Building', 'Looting', 'Crafting', 'Mining', 'Farming',
    'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Terraria': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building',
    'Exploration', 'Boss Fights', 'Farming', 'Crafting', 'Mining', 'Fishing',
    'Adventure', 'Roleplay', 'Economy', 'Events', 'Public', 'Community',
    'Friendly', 'Mature', 'Family-Friendly', 'Whitelist', 'Competitive', 'Casual'
  ],
  'Factorio': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building',
    'Automation', 'Logistics', 'Trains', 'Circuits', 'Science', 'Mining',
    'Crafting', 'Multiplayer', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Satisfactory': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building',
    'Automation', 'Logistics', 'Trains', 'Circuits', 'Science', 'Mining',
    'Crafting', 'Multiplayer', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Space Engineers': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building',
    'Space', 'Planets', 'Asteroids', 'Ships', 'Stations', 'Mining', 'Crafting',
    'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Astroneer': [
    'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building', 'Exploration',
    'Space', 'Planets', 'Mining', 'Crafting', 'Research', 'Adventure', 'Public',
    'Community', 'Friendly', 'Mature', 'Family-Friendly', 'Whitelist', 'Casual'
  ],
  'Don\'t Starve Together': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building',
    'Exploration', 'Farming', 'Crafting', 'Cooking', 'Fighting', 'Adventure',
    'Roleplay', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Project Zomboid': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Zombie',
    'Building', 'Farming', 'Crafting', 'Cooking', 'Fighting', 'Looting',
    'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'The Forest': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Horror',
    'Building', 'Exploration', 'Crafting', 'Fighting', 'Cave', 'Adventure',
    'Roleplay', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Green Hell': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Jungle',
    'Building', 'Exploration', 'Crafting', 'Fighting', 'Farming', 'Adventure',
    'Roleplay', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Conan Exiles': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Factions',
    'Building', 'Exploration', 'Crafting', 'Fighting', 'Farming', 'Breeding',
    'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Atlas': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Factions',
    'Building', 'Exploration', 'Crafting', 'Fighting', 'Farming', 'Sailing',
    'Pirates', 'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly',
    'Mature', 'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'DayZ': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Zombie',
    'Building', 'Exploration', 'Crafting', 'Fighting', 'Looting', 'Vehicles',
    'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Unturned': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Zombie',
    'Building', 'Exploration', 'Crafting', 'Fighting', 'Looting', 'Vehicles',
    'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Palworld': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building',
    'Exploration', 'Crafting', 'Fighting', 'Farming', 'Breeding', 'Pals',
    'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Enshrouded': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building',
    'Exploration', 'Crafting', 'Fighting', 'Farming', 'Magic', 'Adventure',
    'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'V Rising': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Vampire',
    'Building', 'Exploration', 'Crafting', 'Fighting', 'Farming', 'Blood',
    'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Icarus': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building',
    'Exploration', 'Crafting', 'Fighting', 'Farming', 'Space', 'Planets',
    'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Grounded': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building',
    'Exploration', 'Crafting', 'Fighting', 'Farming', 'Insects', 'Adventure',
    'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Raft': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building',
    'Exploration', 'Crafting', 'Fighting', 'Farming', 'Ocean', 'Sailing',
    'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Subnautica': [
    'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building', 'Exploration',
    'Ocean', 'Underwater', 'Crafting', 'Farming', 'Adventure', 'Public',
    'Community', 'Friendly', 'Mature', 'Family-Friendly', 'Whitelist', 'Casual'
  ],
  'No Man\'s Sky': [
    'PvP', 'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building',
    'Exploration', 'Space', 'Planets', 'Crafting', 'Farming', 'Mining',
    'Roleplay', 'Economy', 'Events', 'Public', 'Community', 'Friendly', 'Mature',
    'Family-Friendly', 'Whitelist', 'Competitive', 'Casual', 'Challenge'
  ],
  'Eco': [
    'PvE', 'Survival', 'Hardcore', 'Modded', 'Vanilla', 'Building', 'Exploration',
    'Crafting', 'Farming', 'Mining', 'Economy', 'Politics', 'Science', 'Public',
    'Community', 'Friendly', 'Mature', 'Family-Friendly', 'Whitelist', 'Casual'
  ],
  'Other': [
    'PvP', 'PvE', 'Survival', 'Creative', 'Hardcore', 'Modded', 'Vanilla',
    'Roleplay', 'Economy', 'Factions', 'Building', 'Exploration', 'Crafting',
    'Fighting', 'Farming', 'Minigames', 'Events', 'Public', 'Community',
    'Friendly', 'Mature', 'Family-Friendly', 'Whitelist', 'Competitive', 'Casual',
    'Challenge', 'Adventure', 'Technical', 'Speedrun'
  ]
}

// Get all unique tags for the filter
const getAllTags = () => {
  const allTags = new Set<string>()
  Object.values(GAME_SPECIFIC_TAGS).forEach(tags => {
    tags.forEach(tag => allTags.add(tag))
  })
  return Array.from(allTags).sort()
}

export default function ServersPage() {
  const [servers, setServers] = useState<ServerData[]>([])
  const [filteredServers, setFilteredServers] = useState<ServerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGameType, setSelectedGameType] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('default')
  const { data: session } = useSession()
  const { addNotification } = useNotifications()

  useEffect(() => {
    fetchServers()
    if (session) {
      fetchUserSettings()
    }
  }, [session, selectedGameType, selectedRegion, sortBy])

  useEffect(() => {
    filterServers()
  }, [servers, searchQuery, selectedTags])

  const filterServers = () => {
    let filtered = servers

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(server =>
        server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.gameType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.tags.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Game type filter
    if (selectedGameType) {
      filtered = filtered.filter(server => server.gameType === selectedGameType)
    }

    // Region filter
    if (selectedRegion) {
      filtered = filtered.filter(server => server.region === selectedRegion)
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(server => {
        const serverTags = server.tags.split(',').map(tag => tag.trim().toLowerCase())
        return selectedTags.some(tag => serverTags.includes(tag.toLowerCase()))
      })
    }

    setFilteredServers(filtered)
  }

  const fetchServers = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedGameType) params.append('gameType', selectedGameType)
      if (selectedRegion) params.append('region', selectedRegion)
      if (sortBy) params.append('sortBy', sortBy)
      
      const response = await fetch(`/api/servers?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setServers(data)
        setFilteredServers(data)
      } else {
        setError('Failed to fetch servers')
      }
    } catch (error) {
      setError('Failed to fetch servers')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const settings = await response.json()
        setUserSettings(settings)
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
    }
  }

  const handleToggleFavorite = async (serverId: string, isCurrentlyFavorited: boolean) => {
    if (!session) {
      alert('Please log in to favorite servers')
      return
    }

    try {
      const url = `/api/servers/${serverId}/favorite`
      const method = isCurrentlyFavorited ? 'DELETE' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // Update the local state
        setServers(prevServers => 
          prevServers.map(server => 
            server.id === serverId 
              ? { ...server, isFavorited: !isCurrentlyFavorited }
              : server
          )
        )
        setFilteredServers(prevServers => 
          prevServers.map(server => 
            server.id === serverId 
              ? { ...server, isFavorited: !isCurrentlyFavorited }
              : server
          )
        )
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update favorite')
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('Failed to update favorite')
    }
  }

  const getUserPersonalizedCost = (server: ServerData) => {
    if (!session) return null
    return server.personalizedCosts?.find(cost => cost.userName === session.user?.name)
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Community Servers</h1>
          <p className="text-gray-300 mt-2">Browse and pledge to community servers</p>
        </div>
        <Link
          href="/servers/create"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Server</span>
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-8 border border-slate-700/50">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search servers by name, description, game type, or tags..."
                className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg hover:bg-slate-600/50 transition-colors flex items-center space-x-2"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-slate-600">
            <div className="space-y-6">
              {/* Game Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Game Type
                </label>
                <select
                  value={selectedGameType}
                  onChange={(e) => {
                    setSelectedGameType(e.target.value)
                    // Clear tags when game type changes
                    setSelectedTags([])
                  }}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Games</option>
                  {GAME_TYPES.map(game => (
                    <option key={game} value={game}>
                      {game}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Region
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Regions</option>
                  {REGIONS.map(region => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="default">Default (Favorites + Boosted)</option>
                  <option value="favorites_high">Most Favorited</option>
                  <option value="favorites_low">Least Favorited</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="pledges_high">Most Pledges</option>
                  <option value="pledges_low">Least Pledges</option>
                </select>
              </div>

              {/* Dynamic Tags Filter - Only show when a game is selected */}
              {selectedGameType && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {selectedGameType} Tags
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {GAME_SPECIFIC_TAGS[selectedGameType]?.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (selectedTags.includes(tag)) {
                            setSelectedTags(selectedTags.filter(t => t !== tag))
                          } else {
                            setSelectedTags([...selectedTags, tag])
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="mt-2 text-sm text-emerald-400 hover:text-emerald-300"
                    >
                      Clear all tags
                    </button>
                  )}
                </div>
              )}

              {/* General Tags Filter - Only show when no game is selected */}
              {!selectedGameType && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    All Tags
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {getAllTags().map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (selectedTags.includes(tag)) {
                            setSelectedTags(selectedTags.filter(t => t !== tag))
                          } else {
                            setSelectedTags([...selectedTags, tag])
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="mt-2 text-sm text-emerald-400 hover:text-emerald-300"
                    >
                      Clear all tags
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {filteredServers.length} of {servers.length} servers
                {selectedGameType && (
                  <span className="ml-2 text-emerald-400">
                    • Filtered by {selectedGameType}
                  </span>
                )}
                {selectedRegion && (
                  <span className="ml-2 text-emerald-400">
                    • Region: {selectedRegion}
                  </span>
                )}
                {selectedTags.length > 0 && (
                  <span className="ml-2 text-emerald-400">
                    • {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected
                  </span>
                )}
                {sortBy !== 'default' && (
                  <span className="ml-2 text-emerald-400">
                    • Sorted by {sortBy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Servers Grid - 3 Column Layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredServers.map((server) => {
          const userPersonalizedCost = getUserPersonalizedCost(server)

          return (
            <Link
              key={server.id}
              href={`/servers/${server.id}`}
              className="block bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl hover:ring-2 hover:ring-emerald-500 hover:ring-opacity-50 transition-all duration-200 overflow-hidden group cursor-pointer border border-slate-700/50"
            >
              {/* Banner Section */}
              {server.bannerUrl && (
                <div className="h-32 bg-gray-200 overflow-hidden">
                  <img
                    src={server.bannerUrl}
                    alt={`${server.name} banner`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              )}

              <div className="p-6">
                {/* Server Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors">{server.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                        <Gamepad2 className="w-3 h-3 mr-1" />
                        {server.gameType}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleFavorite(server.id, server.isFavorited);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          server.isFavorited 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'text-gray-400 hover:text-red-500'
                        }`}
                        title={server.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart className={`w-5 h-5 ${server.isFavorited ? 'fill-current' : ''}`} />
                      </button>
                      <span className="text-sm text-gray-400 font-medium">
                        {server._count.favorites}
                      </span>
                    </div>
                    {userPersonalizedCost && (
                      <div className="text-right">
                        <span className="text-xs text-emerald-400 font-medium">
                          You pay ${userPersonalizedCost.actualCost.toFixed(2)}
                        </span>
                        {userPersonalizedCost.savings > 0 && (
                          <span className="text-xs text-green-400 block">
                            Reduced ${userPersonalizedCost.savings.toFixed(2)}!
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-300 mb-4 line-clamp-2">{server.description}</p>
                
                {/* Tags */}
                {server.tags && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {server.tags.split(',').slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-gray-300"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag.trim()}
                        </span>
                      ))}
                      {server.tags.split(',').length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          +{server.tags.split(',').length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* LIVE SERVER STATS */}
                <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
                  <ServerStats serverId={server.id} gameType={server.gameType} />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">MONTHLY COST</span>
                    <PriceDisplay amount={server.cost} className="font-semibold text-white" />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Status</span>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      server.isAcceptingPledges 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {server.isAcceptingPledges ? 'Accepting Pledges' : 'Goal Reached'}
                    </span>
                  </div>
                  
                  {server.serverIp && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">SERVER IP</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono text-white">
                          {server.serverIp}{server.serverPort ? `:${server.serverPort}` : ''}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            copyServerIP(server.serverIp!, server.serverPort);
                          }}
                          className="p-1 rounded hover:bg-slate-600/50 transition-colors"
                          title="Copy IP to clipboard"
                        >
                          <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">PLEDGERS</span>
                    <span className="font-semibold text-white">
                      {server._count.pledges} people
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span className="inline-flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {server.region}
                    </span>
                    <span>{new Date(server.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
            </Link>
          )
        })}
      </div>

      {servers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Server className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-white">No servers yet</h3>
          <p className="mt-1 text-sm text-gray-400">Get started by creating a new server.</p>
          <div className="mt-6">
            <Link
              href="/servers/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Server
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
