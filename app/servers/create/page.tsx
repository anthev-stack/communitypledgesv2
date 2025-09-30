'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Server, DollarSign, Users, FileText, Calendar, AlertCircle, Gamepad2, Tag, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useCurrency } from '@/contexts/CurrencyContext'

const createServerSchema = z.object({
  name: z.string().min(3, 'Server name must be at least 3 characters').max(50, 'Server name must be less than 50 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  cost: z.number().min(15, 'Cost must be at least A$15').max(80, 'Cost must be at most A$80'),
  withdrawalDay: z.number().min(1, 'Withdrawal day must be between 1-31').max(31, 'Withdrawal day must be between 1-31'),
  gameType: z.string().min(1, 'Game type is required'),
  region: z.string().min(1, 'Region is required'),
  bannerUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  serverIp: z.string().min(1, 'Server IP or domain is required'),
  serverPort: z.number().min(1, 'Port must be between 1-65535').max(65535, 'Port must be between 1-65535').optional(),
  discordChannel: z.string().url('Please enter a valid Discord URL').optional().or(z.literal('')),
  discordWebhook: z.string()
    .url('Please enter a valid Discord webhook URL')
    .refine((url) => {
      if (!url) return true; // Allow empty
      return url.includes('discord.com/api/webhooks/') || url.includes('discordapp.com/api/webhooks/');
    }, 'Please enter a valid Discord webhook URL (must contain discord.com/api/webhooks/)')
    .optional()
    .or(z.literal(''))
})

type CreateServerForm = z.infer<typeof createServerSchema>

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

interface UserSettings {
  hasPaymentMethod: boolean
  hasDepositMethod: boolean
}

export default function CreateServerPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [costError, setCostError] = useState('')
  const router = useRouter()
  const { data: session } = useSession()
  const { formatAmount } = useCurrency()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<CreateServerForm>({
    resolver: zodResolver(createServerSchema)
  })

  useEffect(() => {
    if (session) {
      fetchUserSettings()
    }
  }, [session])

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const settings = await response.json()
        setUserSettings(settings)
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
    } finally {
      setLoadingSettings(false)
    }
  }

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 10) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag))
  }

  const addCustomTag = () => {
    if (customTag.trim()) {
      addTag(customTag.trim())
      setCustomTag('')
    }
  }

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setCostError('')
    
    if (isNaN(value)) {
      return
    }
    
    if (value < 15) {
      setCostError('Cost must be at least $15')
    } else if (value > 80) {
      setCostError('Cost must be at most $80')
    }
  }

  const getAvailableTags = () => {
    const gameType = watch('gameType')
    return gameType && GAME_SPECIFIC_TAGS[gameType] 
      ? GAME_SPECIFIC_TAGS[gameType] 
      : GAME_SPECIFIC_TAGS['Other']
  }

  const onSubmit = async (data: CreateServerForm) => {
    console.log('Form submitted with data:', data)
    console.log('Selected tags:', selectedTags)
    
    if (!session) {
      setError('You must be logged in to create a server')
      return
    }

    if (selectedTags.length < 3) {
      setError('Please select at least 3 tags')
      return
    }

    if (costError) {
      setError('Please fix the cost validation error')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const requestData = {
        name: data.name,
        description: data.description,
        cost: data.cost,
        withdrawalDay: data.withdrawalDay,
        gameType: data.gameType,
        region: data.region,
        tags: selectedTags.join(', '),
        bannerUrl: data.bannerUrl || null,
        serverIp: data.serverIp || null,
        serverPort: data.serverPort || null,
        discordChannel: data.discordChannel || null,
        discordWebhook: data.discordWebhook || null
      }
      
      console.log('Sending request data:', requestData)
      
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const server = await response.json()
        console.log('Server created successfully:', server)
        router.push('/servers')
      } else {
        const errorData = await response.json()
        console.error('Server creation failed:', errorData)
        setError(errorData.message || 'An error occurred')
      }
    } catch (error) {
      console.error('Server creation error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-300 mb-4">You must be logged in to create a server.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  if (loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!userSettings?.hasDepositMethod) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Deposit Method Required</h1>
          <p className="text-gray-300 mb-6">
            You need to add a deposit method to create servers and receive payments from community pledges.
          </p>
          <Link
            href="/settings"
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Add Deposit Method
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Create New Server</h1>
        <p className="text-gray-300 mt-2">Set up a new community server for cost sharing</p>
      </div>

      <form onSubmit={(e) => {
        console.log('Form submit event triggered')
        handleSubmit(onSubmit)(e)
      }} className="space-y-6">
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Server Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Server className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('name')}
              type="text"
              className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 placeholder-gray-400 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter server name"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <div className="relative">
            <div className="absolute top-3 left-0 pl-3 pointer-events-none">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
              {...register('description')}
              rows={4}
              className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 placeholder-gray-400 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Describe your server and its purpose"
            />
          </div>
          {errors.description && (
            <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="cost" className="block text-sm font-medium text-gray-300 mb-2">
            Monthly Cost (USD)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('cost', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="15"
              max="80"
              onChange={handleCostChange}
              className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 placeholder-gray-400 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              placeholder="40.00"
            />
          </div>
          {(errors.cost || costError) && (
            <p className="mt-1 text-sm text-red-400">{errors.cost?.message || costError}</p>
          )}
          <p className="mt-1 text-sm text-gray-400">
            The cost will be automatically divided among pledgers. Minimum cost per person is {formatAmount(2)}. Server cost must be between {formatAmount(15)}-{formatAmount(80)}.
          </p>
        </div>

        <div>
          <label htmlFor="gameType" className="block text-sm font-medium text-gray-300 mb-2">
            Game Type
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Gamepad2 className="h-5 w-5 text-gray-400" />
            </div>
            <select
              {...register('gameType')}
              className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select a game type</option>
              {GAME_TYPES.map(game => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>
          </div>
          {errors.gameType && (
            <p className="mt-1 text-sm text-red-400">{errors.gameType.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-300 mb-2">
            Region
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <select
              {...register('region')}
              className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select a region</option>
              {REGIONS.map(region => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          {errors.region && (
            <p className="mt-1 text-sm text-red-400">{errors.region.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="bannerUrl" className="block text-sm font-medium text-gray-300 mb-2">
            Banner URL (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('bannerUrl')}
              type="url"
              placeholder="https://example.com/banner.gif"
              className="rounded-lg relative block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
            />
          </div>
          <p className="mt-1 text-sm text-gray-400">
            Add a GIF banner to make your server stand out! Recommended size: 1200x400px
          </p>
          {errors.bannerUrl && (
            <p className="mt-1 text-sm text-red-400">{errors.bannerUrl.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="serverIp" className="block text-sm font-medium text-gray-300 mb-2">
              Server IP or Domain *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Server className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('serverIp')}
                type="text"
                placeholder="play.example.com or 192.168.1.100"
                className="rounded-lg relative block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
              />
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Your server's IP address or domain name for live stats
            </p>
            {errors.serverIp && (
              <p className="mt-1 text-sm text-red-400">{errors.serverIp.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="serverPort" className="block text-sm font-medium text-gray-300 mb-2">
              Server Port (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('serverPort', { valueAsNumber: true })}
                type="number"
                placeholder="25565"
                min="1"
                max="65535"
                className="rounded-lg relative block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
              />
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Leave empty if using a domain (port included in domain) or for default port
            </p>
            {errors.serverPort && (
              <p className="mt-1 text-sm text-red-400">{errors.serverPort.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="discordChannel" className="block text-sm font-medium text-gray-300 mb-2">
            Discord Channel (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('discordChannel')}
              type="url"
              placeholder="https://discord.gg/your-invite"
              className="rounded-lg relative block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
            />
          </div>
          <p className="mt-1 text-sm text-gray-400">
            Discord invite link for your server community
          </p>
          {errors.discordChannel && (
            <p className="mt-1 text-sm text-red-400">{errors.discordChannel.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="discordWebhook" className="block text-sm font-medium text-gray-300 mb-2">
            Discord Webhook (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('discordWebhook')}
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              className="rounded-lg relative block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
            />
          </div>
          <p className="mt-1 text-sm text-gray-400">
            Discord webhook URL to receive pledge notifications in your server
          </p>
          <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>How to set up Discord webhooks:</strong>
            </p>
            <ol className="mt-1 text-xs text-blue-200 list-decimal list-inside space-y-1">
              <li>Go to your Discord server settings</li>
              <li>Navigate to Integrations → Webhooks</li>
              <li>Click "Create Webhook"</li>
              <li>Choose the channel for notifications</li>
              <li>Copy the webhook URL and paste it here</li>
            </ol>
          </div>
          {errors.discordWebhook && (
            <p className="mt-1 text-sm text-red-400">{errors.discordWebhook.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tags (Select at least 3)
          </label>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {getAvailableTags().map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)}
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
            
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                  placeholder="Add custom tag..."
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
                />
              </div>
              <button
                type="button"
                onClick={addCustomTag}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-400"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-emerald-600 hover:text-emerald-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            {selectedTags.length < 3 && (
              <p className="text-sm text-red-400">
                Please select at least 3 tags ({selectedTags.length}/3)
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="withdrawalDay" className="block text-sm font-medium text-gray-300 mb-2">
            Payment Due Date (Day of Month)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <select
              {...register('withdrawalDay', { valueAsNumber: true })}
              className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>
                  {day}st
                </option>
              ))}
            </select>
          </div>
          {errors.withdrawalDay && (
            <p className="mt-1 text-sm text-red-400">{errors.withdrawalDay.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-400">
            Community pledges will be collected 2 days before this date to ensure timely payment to you.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-400 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-300 space-y-1">
            <li>• Users can pledge any amount they want initially</li>
            <li>• Once enough people pledge to cover the full cost, prices will automatically adjust</li>
            <li>• The system will lower everyone's cost until it reaches {formatAmount(2)} per person</li>
            <li>• If someone unpledges and the cost goes above {formatAmount(2)}, new pledges will be accepted again</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-slate-600 text-gray-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Server'}
          </button>
        </div>
      </form>
    </div>
  )
}
