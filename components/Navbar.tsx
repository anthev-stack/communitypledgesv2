'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { User, LogOut, Menu, X, Settings } from 'lucide-react'
import { useState } from 'react'
// import { useActivityNotifications } from '@/contexts/ActivityNotificationContext'

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const unreadCount = 0 // Temporarily disabled

  return (
    <nav className="bg-slate-900/80 backdrop-blur-sm shadow-lg border-b border-slate-700/50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-emerald-400">
            COMMUNITYPLEDGES
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-300 hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <Link href="/servers" className="text-gray-300 hover:text-emerald-400 transition-colors">
              Servers
            </Link>
            
            {status === 'loading' ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : session ? (
              <>
                <Link href="/dashboard" className="text-gray-300 hover:text-emerald-400 transition-colors relative">
                  Dashboard
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                {(session.user?.role === 'moderator' || session.user?.role === 'admin') && (
                  <Link href="/staff" className="text-gray-300 hover:text-emerald-400 transition-colors">
                    Staff
                  </Link>
                )}
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/settings"
                    className="text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                  <Link 
                    href={`/user/${session.user?.name}`}
                    className="flex items-center space-x-2 text-gray-300 hover:text-emerald-400 transition-colors"
                  >
                    {session.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'User'} 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-400" />
                      </div>
                    )}
                    <span>{session.user?.name}</span>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center space-x-1 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/auth/login" 
                  className="text-gray-300 hover:text-emerald-400 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-emerald-400 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700/50">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-gray-300 hover:text-emerald-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/servers" 
                className="text-gray-300 hover:text-emerald-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Servers
              </Link>
              
              {session ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="text-gray-300 hover:text-emerald-400 transition-colors relative"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  {(session.user?.role === 'moderator' || session.user?.role === 'admin') && (
                    <Link 
                      href="/staff" 
                      className="text-gray-300 hover:text-emerald-400 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Staff
                    </Link>
                  )}
                  <Link 
                    href="/settings"
                    className="flex items-center space-x-2 text-gray-300 hover:text-emerald-400 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <Link 
                    href={`/user/${session.user?.name}`}
                    className="flex items-center space-x-2 text-gray-300 hover:text-emerald-400 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {session.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'User'} 
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-400" />
                      </div>
                    )}
                    <span>{session.user?.name}</span>
                  </Link>
                  <button
                    onClick={() => {
                      signOut()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    className="text-gray-300 hover:text-emerald-400 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}


