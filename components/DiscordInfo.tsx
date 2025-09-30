'use client';

import { useState, useEffect } from 'react';
import { Users, Wifi, Clock, Shield, Star } from 'lucide-react';

interface DiscordInfo {
  serverName: string;
  memberCount: number;
  onlineMembers: number;
  iconUrl: string | null;
  bannerUrl: string | null;
  features: string[];
  expiresAt: string | null;
  isActive: boolean;
}

interface DiscordInfoProps {
  discordUrl: string;
}

export default function DiscordInfo({ discordUrl }: DiscordInfoProps) {
  const [discordData, setDiscordData] = useState<DiscordInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscordInfo();
  }, [discordUrl]);

  const fetchDiscordInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/discord/info?url=${encodeURIComponent(discordUrl)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Discord info');
      }
      
      const result = await response.json();
      setDiscordData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Discord info');
    } finally {
      setLoading(false);
    }
  };

  const formatMemberCount = (count: number | null | undefined): string => {
    if (!count || count === 0) {
      return '0';
    }
    
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'verified':
        return <Shield className="w-3 h-3 text-green-500" />;
      case 'partner':
        return <Star className="w-3 h-3 text-purple-500" />;
      default:
        return <Shield className="w-3 h-3 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-slate-600 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-600 rounded w-1/2"></div>
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="h-3 bg-slate-600 rounded w-20"></div>
            <div className="h-3 bg-slate-600 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/50">
        <div className="flex items-center space-x-2 text-red-400">
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Discord Info Unavailable</span>
        </div>
        <p className="text-sm text-red-400 mt-1">{error}</p>
      </div>
    );
  }

  if (!discordData) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-[#5865F2] to-[#4752C4] rounded-lg p-4 text-white">
      {/* Discord Server Header */}
      <div className="flex items-center space-x-3 mb-1">
        {discordData.iconUrl ? (
          <img
            src={discordData.iconUrl}
            alt={discordData.serverName}
            className="w-12 h-12 rounded-full border-2 border-white/20"
          />
        ) : (
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{discordData?.serverName || 'Discord Server'}</h3>
        </div>
      </div>


      {/* Member Stats */}
      <div className="flex items-center space-x-4 mb-1">
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4 text-white/80" />
          <span className="text-sm font-medium">
            {formatMemberCount(discordData?.memberCount)} members
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm font-medium">
            {formatMemberCount(discordData?.onlineMembers)} online
          </span>
        </div>
      </div>

      {/* Features - Only show important ones */}
      {discordData.features && discordData.features.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {discordData.features
            .filter(feature => {
              // Only show important features that users care about
              const importantFeatures = [
                'verified',
                'partner',
                'community',
                'discoverable',
                'featureable',
                'monetization_enabled',
                'premium_tier_3',
                'premium_tier_2',
                'premium_tier_1'
              ];
              return importantFeatures.includes(feature);
            })
            .slice(0, 3)
            .map((feature, index) => (
              <div key={index} className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
                {getFeatureIcon(feature)}
                <span className="text-xs font-medium capitalize">
                  {feature === 'verified' && 'Verified'}
                  {feature === 'partner' && 'Partner'}
                  {feature === 'community' && 'Community'}
                  {feature === 'discoverable' && 'Discoverable'}
                  {feature === 'featureable' && 'Featured'}
                  {feature === 'monetization_enabled' && 'Monetized'}
                  {feature === 'premium_tier_3' && 'Premium Tier 3'}
                  {feature === 'premium_tier_2' && 'Premium Tier 2'}
                  {feature === 'premium_tier_1' && 'Premium Tier 1'}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Expiry Warning */}
      {discordData.expiresAt && (
        <div className="flex items-center space-x-1 text-xs text-yellow-200 bg-yellow-500/20 rounded-full px-2 py-1 w-fit">
          <Clock className="w-3 h-3" />
          <span>Invite expires</span>
        </div>
      )}

      {/* Join Button */}
      <a
        href={discordUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full mt-3 bg-white text-[#5865F2] px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
      >
        <span className="mr-2">🚀</span>
        Join Discord Server
      </a>
    </div>
  );
}
