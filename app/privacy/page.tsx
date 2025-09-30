'use client'

import { Shield, Eye, Lock, User, CreditCard, Database } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Shield className="w-12 h-12 text-emerald-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-xl text-gray-300">
          Your privacy and data security are our top priorities
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="prose prose-lg max-w-none">
        {/* Introduction */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-400 mb-2">Our Commitment</h2>
          <p className="text-blue-300">
            CommunityPledges is committed to protecting your privacy and ensuring the security of your personal information. 
            This policy explains how we collect, use, and safeguard your data.
          </p>
        </div>

        {/* Information We Collect */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <Database className="w-6 h-6 text-emerald-400 mr-2" />
            Information We Collect
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Account Information</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Name and email address</li>
                <li>• Profile information</li>
                <li>• Authentication credentials</li>
                <li>• Account preferences</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Payment Information</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Payment method details (encrypted)</li>
                <li>• Billing address</li>
                <li>• Transaction history</li>
                <li>• Pledge amounts and dates</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Server Information</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Server names and descriptions</li>
                <li>• Game types and tags</li>
                <li>• Server IP addresses and ports</li>
                <li>• Discord channel information</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Usage Data</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Website interaction logs</li>
                <li>• Feature usage statistics</li>
                <li>• Error reports and diagnostics</li>
                <li>• Device and browser information</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Information */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <Eye className="w-6 h-6 text-emerald-400 mr-2" />
            How We Use Your Information
          </h2>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Service Provision</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Process payments and manage pledges</li>
                  <li>• Facilitate server hosting cost sharing</li>
                  <li>• Provide customer support</li>
                  <li>• Maintain your account and preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Communication</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Send important service notifications</li>
                  <li>• Provide updates about your pledges</li>
                  <li>• Respond to support requests</li>
                  <li>• Share platform updates (with consent)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Security & Compliance</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Protect against fraud and abuse</li>
                  <li>• Comply with legal obligations</li>
                  <li>• Maintain platform security</li>
                  <li>• Investigate violations of terms</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Improvement</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Analyze usage patterns</li>
                  <li>• Improve platform features</li>
                  <li>• Develop new services</li>
                  <li>• Optimize user experience</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Data Security */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <Lock className="w-6 h-6 text-emerald-400 mr-2" />
            Data Security
          </h2>
          
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-3">Security Measures</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-300 mb-2">Encryption</h4>
                <ul className="space-y-1 text-green-200 text-sm">
                  <li>• All data encrypted in transit (TLS 1.3)</li>
                  <li>• Sensitive data encrypted at rest</li>
                  <li>• Payment information tokenized</li>
                  <li>• Secure key management</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-300 mb-2">Access Control</h4>
                <ul className="space-y-1 text-green-200 text-sm">
                  <li>• Multi-factor authentication</li>
                  <li>• Role-based access controls</li>
                  <li>• Regular security audits</li>
                  <li>• Employee background checks</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <User className="w-6 h-6 text-emerald-400 mr-2" />
            Information Sharing
          </h2>
          
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">We Do NOT Sell Your Data</h3>
            <p className="text-yellow-300 mb-4">
              We never sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-yellow-300 mb-2">Limited Sharing Only</h4>
                <ul className="space-y-1 text-yellow-200 text-sm">
                  <li>• Payment processors (for transaction processing)</li>
                  <li>• Service providers (under strict agreements)</li>
                  <li>• Legal compliance (when required by law)</li>
                  <li>• Business transfers (with user notification)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Your Rights & Choices</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Access & Control</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• View and update your profile</li>
                <li>• Download your data</li>
                <li>• Delete your account</li>
                <li>• Manage communication preferences</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Data Protection</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Request data correction</li>
                <li>• Object to data processing</li>
                <li>• Data portability rights</li>
                <li>• Withdraw consent at any time</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Cookies & Tracking</h2>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <p className="text-gray-300 mb-4">
              We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-white mb-2">Essential Cookies</h4>
                <p className="text-sm text-gray-300">Required for basic website functionality and security.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Analytics Cookies</h4>
                <p className="text-sm text-gray-300">Help us understand how you use our platform.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Preference Cookies</h4>
                <p className="text-sm text-gray-300">Remember your settings and preferences.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About Privacy?</h2>
          
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
            <p className="text-primary-800 mb-4">
              If you have questions about this privacy policy or how we handle your data, please contact us:
            </p>
            
            <div className="space-y-2 text-primary-700">
              <p><strong>Email:</strong> privacy@communitypledges.com</p>
              <p><strong>Support:</strong> <a href="/contact" className="underline hover:text-primary-900">Contact Form</a></p>
            </div>
          </div>
        </section>

        {/* Updates */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Policy Updates</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700">
              We may update this privacy policy from time to time. We'll notify you of significant changes 
              via email or through our platform. Your continued use of our services after changes constitutes 
              acceptance of the updated policy.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}


