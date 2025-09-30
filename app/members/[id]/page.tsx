'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Server, 
  Heart, 
  DollarSign,
  Gamepad2,
  Users
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  createdAt: string;
  stats: {
    serverCount: number;
    pledgeCount: number;
    totalServerCost: number;
  };
  servers: Array<{
    id: string;
    name: string;
    description: string;
    gameType: string;
    cost: number;
    bannerUrl: string | null;
    createdAt: string;
    pledgeCount: number;
  }>;
  pledges: Array<{
    id: string;
    amount: number;
    createdAt: string;
    server: {
      id: string;
      name: string;
      gameType: string;
      cost: number;
      bannerUrl: string | null;
    };
  }>;
}

export default function UserProfilePage() {
  const params = useParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchUserProfile(params.id as string);
    }
  }, [params.id]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/members/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <User className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-400">Error loading profile</h3>
                <p className="mt-1 text-sm text-red-300">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">User not found</h3>
            <p className="mt-1 text-sm text-gray-400">
              The user profile you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/members"
            className="inline-flex items-center text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-sm border border-slate-700/50 p-8 mb-8">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <User className="h-12 w-12 text-emerald-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
              <div className="flex items-center space-x-4 text-gray-300">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    Member since {formatDate(user.createdAt)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Server className="h-4 w-4" />
                  <span className="text-sm">
                    {user.stats.serverCount} {user.stats.serverCount === 1 ? 'Server' : 'Servers'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span className="text-sm">
                    {user.stats.pledgeCount} {user.stats.pledgeCount === 1 ? 'Pledge' : 'Pledges'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-slate-700/50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Server className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Servers Owned</p>
                <p className="text-2xl font-bold text-white">{user.stats.serverCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-slate-700/50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Heart className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active Pledges</p>
                <p className="text-2xl font-bold text-white">{user.stats.pledgeCount}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Servers Section */}
        {user.servers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Servers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.servers.map((server) => (
                <Link
                  key={server.id}
                  href={`/servers/${server.id}`}
                  className="block"
                >
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-sm border border-slate-700/50 overflow-hidden hover:shadow-xl hover:ring-2 hover:ring-emerald-500 hover:ring-opacity-50 transition-all duration-200 cursor-pointer">
                    {server.bannerUrl && (
                      <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${server.bannerUrl})` }} />
                    )}
                    <div className="p-6">
                      <div className="flex items-center space-x-2 mb-2">
                        <Gamepad2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">{server.gameType}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{server.name}</h3>
                      <p className="text-sm text-gray-300 mb-4 line-clamp-2">{server.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Monthly Cost:</span>
                          <span className="font-medium text-white">{formatCurrency(server.cost)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Pledges:</span>
                          <span className="font-medium text-white">{server.pledgeCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pledges Section */}
        {user.pledges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Active Pledges</h2>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-sm border border-slate-700/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-700/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Server
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Game Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Since
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800/50 divide-y divide-slate-600">
                    {user.pledges.map((pledge) => (
                      <tr key={pledge.id} className="hover:bg-slate-700/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/servers/${pledge.server.id}`}
                            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                          >
                            {pledge.server.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {pledge.server.gameType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                          {formatCurrency(pledge.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatDate(pledge.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty States */}
        {user.servers.length === 0 && user.pledges.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No activity yet</h3>
            <p className="mt-1 text-sm text-gray-400">
              This user hasn't created any servers or made any pledges yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
