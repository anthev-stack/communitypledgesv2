'use client'

import Link from 'next/link'
import { Heart, Mail, MessageCircle, Shield, Instagram, Globe } from 'lucide-react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { Currency } from '@/lib/currency'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { selectedCurrency, setSelectedCurrency, isLoading } = useCurrency()

  const currencies: Currency[] = ['AUD', 'USD', 'EUR', 'GBP', 'CAD']

  return (
    <footer className="text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="text-xl font-bold">COMMUNITYPLEDGES</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Keeping community servers alive since 2025. Share the cost with your community or simply pledge to your favorite community server.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://discord.gg/jj7GJFe3vH"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Discord"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/communitypledges"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 uppercase">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/servers" className="text-gray-400 hover:text-white transition-colors">
                  Browse Servers
                </Link>
              </li>
              <li>
                <Link href="/members" className="text-gray-400 hover:text-white transition-colors">
                  Community Members
                </Link>
              </li>
              <li>
                <Link href="/servers/create" className="text-gray-400 hover:text-white transition-colors">
                  Create Server
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-gray-400 hover:text-white transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 uppercase">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/tickets" className="text-gray-400 hover:text-white transition-colors">
                  Support Tickets
                </Link>
              </li>
              <li>
                <Link href="/tickets/create" className="text-gray-400 hover:text-white transition-colors">
                  Create Ticket
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@communitypledges.com"
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Support</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 uppercase">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-gray-400 hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-gray-400 hover:text-white transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © {currentYear} COMMUNITYPLEDGES. ALL RIGHTS RESERVED.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              {/* Currency Selector */}
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <Globe className="w-4 h-4" />
                <div className="relative">
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
                    disabled={isLoading}
                    className="bg-slate-800 border border-slate-600 rounded pl-2 pr-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-8"
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {isLoading && <span className="text-xs">Loading rates...</span>}
              </div>
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <Shield className="w-4 h-4" />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
