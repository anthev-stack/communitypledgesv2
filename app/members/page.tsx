'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Calendar, Heart, Server, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Member {
  id: string;
  name: string;
  image: string | null;
  createdAt: string;
  pledgeCount: number;
  serverCount: number;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/members');
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      const data = await response.json();
      setMembers(data.members || []);
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
                <h3 className="text-sm font-medium text-red-400">Error loading members</h3>
                <p className="mt-1 text-sm text-red-300">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-8 w-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">Community Members</h1>
          </div>
          <p className="text-lg text-gray-300">
            Discover the amazing community of server owners and pledgers
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-slate-700/50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Members</p>
                <p className="text-2xl font-bold text-white">{members.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-slate-700/50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Server className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active Servers</p>
                <p className="text-2xl font-bold text-white">
                  {members.reduce((sum, member) => sum + member.serverCount, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-slate-700/50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Heart className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Pledges</p>
                <p className="text-2xl font-bold text-white">
                  {members.reduce((sum, member) => sum + member.pledgeCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Link
              key={member.id}
              href={`/members/${member.id}`}
              className="block"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-sm border border-slate-700/50 p-6 hover:shadow-xl hover:ring-2 hover:ring-emerald-500 hover:ring-opacity-50 transition-all duration-200 cursor-pointer">
                {/* Profile Header */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {member.name}
                    </h3>
                  </div>
                </div>

                {/* Member Since */}
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">
                    Member since {formatDate(member.createdAt)}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Server className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-white">
                        {member.serverCount}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {member.serverCount === 1 ? 'Server' : 'Servers'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Heart className="h-4 w-4 text-red-400" />
                      <span className="text-sm font-medium text-white">
                        {member.pledgeCount}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {member.pledgeCount === 1 ? 'Pledge' : 'Pledges'}
                    </p>
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {members.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No members found</h3>
            <p className="mt-1 text-sm text-gray-400">
              There are no community members to display at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

