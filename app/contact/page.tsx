'use client'

import Link from 'next/link'
import { Mail, MessageCircle, Clock, Ticket, ArrowRight } from 'lucide-react'

export default function ContactPage() {

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
        <p className="text-xl text-gray-300">
          We're here to help! Use our support ticket system for the best assistance.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Ticket className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Support Tickets</h3>
                <p className="text-gray-300">Create a support ticket for any issues</p>
                <p className="text-sm text-gray-400">Track your requests and get responses</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Mail className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Email Support</h3>
                <p className="text-gray-300">support@communitypledges.com</p>
                <p className="text-sm text-gray-400">We typically respond within 24 hours</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Discord Community</h3>
                <p className="text-gray-300">Join our Discord server</p>
                <p className="text-sm text-gray-400">Get real-time help from the community</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Clock className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Support Hours</h3>
                <p className="text-gray-300">24/7 Support Available</p>
                <p className="text-sm text-gray-400">Small team with other commitments - we'll respond as soon as possible</p>
              </div>
            </div>
          </div>

          {/* Help Center Link */}
          <div className="mt-8 p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50">
            <h3 className="font-semibold text-white mb-2">Before you contact us</h3>
            <p className="text-gray-300 mb-4">
              Check our <Link href="/help" className="text-emerald-400 hover:text-emerald-300 underline">Help Center</Link> for answers to common questions.
            </p>
            <Link
              href="/help"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Visit Help Center
            </Link>
          </div>
        </div>

        {/* Support Ticket System */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-6">Support Ticket System</h2>
          
          <div className="space-y-6">
            <div className="text-center py-8">
              <Ticket className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Use Our Ticket System</h3>
              <p className="text-gray-300 mb-6">
                For the best support experience, please use our ticket system. This allows us to track your request and provide better assistance.
              </p>
              
              <div className="space-y-4">
                <Link
                  href="/tickets/create"
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Create New Ticket</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                
                <Link
                  href="/tickets"
                  className="w-full bg-slate-700 text-white py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>View My Tickets</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Why use tickets?</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Track your request status</li>
                <li>• Get faster response times</li>
                <li>• Keep all communication in one place</li>
                <li>• Priority support for urgent issues</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


