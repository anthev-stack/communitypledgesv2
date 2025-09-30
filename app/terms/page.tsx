'use client'

import { FileText, Scale, Users, CreditCard, Shield, AlertTriangle } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Scale className="w-12 h-12 text-emerald-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
        <p className="text-xl text-gray-300">
          Please read these terms carefully before using our platform
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="prose prose-lg max-w-none">
        {/* Agreement */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-400 mb-2">Agreement to Terms</h2>
          <p className="text-blue-300">
            By accessing or using CommunityPledges, you agree to be bound by these Terms of Service and our Privacy Policy. 
            If you disagree with any part of these terms, you may not access the service.
          </p>
        </div>

        {/* Service Description */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <FileText className="w-6 h-6 text-emerald-400 mr-2" />
            Service Description
          </h2>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <p className="text-gray-300 mb-4">
              CommunityPledges is a platform that enables community server owners to share hosting costs with their communities 
              through a pledge system. Users can pledge monthly amounts to support servers they enjoy, and the platform 
              facilitates cost-sharing among pledgers.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">For Server Owners</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Create server listings with cost information</li>
                  <li>• Receive community support for hosting costs</li>
                  <li>• Manage server information and settings</li>
                  <li>• View pledge statistics and community engagement</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">For Community Members</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Browse and discover community servers</li>
                  <li>• Pledge monthly amounts to support servers</li>
                  <li>• Track your pledge commitments</li>
                  <li>• Participate in cost-sharing communities</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* User Responsibilities */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <Users className="w-6 h-6 text-emerald-400 mr-2" />
            User Responsibilities
          </h2>
          
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Account Requirements</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Provide accurate and complete information</li>
                <li>• Maintain the security of your account credentials</li>
                <li>• Notify us immediately of any unauthorized access</li>
                <li>• You are responsible for all activities under your account</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Prohibited Activities</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-white mb-2">General Prohibitions</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Violating any applicable laws or regulations</li>
                    <li>• Impersonating others or providing false information</li>
                    <li>• Attempting to gain unauthorized access</li>
                    <li>• Interfering with platform operations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Content Restrictions</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Inappropriate, offensive, or harmful content</li>
                    <li>• Copyright infringement or intellectual property violations</li>
                    <li>• Spam, phishing, or malicious activities</li>
                    <li>• Harassment or abuse of other users</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Terms */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <CreditCard className="w-6 h-6 text-emerald-400 mr-2" />
            Payment Terms
          </h2>
          
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3">Pledge System</h3>
              <ul className="space-y-2 text-green-300">
                <li>• Pledges are monthly commitments that auto-renew</li>
                <li>• You can modify or cancel pledges at any time</li>
                <li>• Changes take effect at the next billing cycle</li>
                <li>• Failed payments may result in pledge suspension</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Billing & Refunds</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-2">Billing</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Monthly charges on your pledge date</li>
                    <li>• Payment methods must be kept current</li>
                    <li>• Failed payments may incur fees</li>
                    <li>• Prices may change with notice</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Refunds</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Refunds handled case-by-case</li>
                    <li>• Unused portions may be refundable</li>
                    <li>• Contact support for refund requests</li>
                    <li>• Processing may take 5-10 business days</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Server Owner Terms */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Server Owner Terms</h2>
          
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Additional Responsibilities</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-yellow-300 mb-2">Server Management</h4>
                <ul className="space-y-1 text-yellow-200 text-sm">
                  <li>• Maintain accurate server information</li>
                  <li>• Ensure server availability and performance</li>
                  <li>• Provide appropriate community moderation</li>
                  <li>• Comply with game server hosting policies</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-yellow-300 mb-2">Financial Obligations</h4>
                <ul className="space-y-1 text-yellow-200 text-sm">
                  <li>• Provide valid payment and deposit methods</li>
                  <li>• Cover hosting costs regardless of pledge amounts</li>
                  <li>• Maintain minimum $2 per person pricing</li>
                  <li>• Handle refunds for server downtime</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Limitations */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <AlertTriangle className="w-6 h-6 text-orange-400 mr-2" />
            Platform Limitations
          </h2>
          
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-400 mb-3">Service Availability</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-orange-300 mb-2">Availability</h4>
                <ul className="space-y-1 text-orange-200 text-sm">
                  <li>• Service provided "as is" without warranties</li>
                  <li>• We strive for 99.9% uptime but cannot guarantee it</li>
                  <li>• Maintenance windows may cause temporary outages</li>
                  <li>• Third-party dependencies may affect service</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-orange-300 mb-2">Limitations</h4>
                <ul className="space-y-1 text-orange-200 text-sm">
                  <li>• We are not responsible for server hosting quality</li>
                  <li>• Disputes between users are not our responsibility</li>
                  <li>• We may suspend accounts for policy violations</li>
                  <li>• Service may be discontinued with notice</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Intellectual Property */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property</h2>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Your Content</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• You retain ownership of your server content</li>
                  <li>• You grant us license to display and distribute</li>
                  <li>• You are responsible for content rights</li>
                  <li>• We may remove content that violates policies</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Our Platform</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• CommunityPledges owns the platform and technology</li>
                  <li>• Trademarks and logos are protected</li>
                  <li>• You may not copy or reverse engineer</li>
                  <li>• Limited license to use our service</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy & Data */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <Shield className="w-6 h-6 text-emerald-400 mr-2" />
            Privacy & Data Protection
          </h2>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <p className="text-gray-300 mb-4">
              Your privacy is important to us. Please review our Privacy Policy for detailed information about 
              how we collect, use, and protect your data.
            </p>
            <a
              href="/privacy"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Shield className="w-4 h-4 mr-2" />
              Read Privacy Policy
            </a>
          </div>
        </section>

        {/* Termination */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Termination</h2>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-400 mb-3">Account Termination</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-red-300 mb-2">By You</h4>
                <ul className="space-y-1 text-red-200 text-sm">
                  <li>• You may delete your account at any time</li>
                  <li>• Active pledges will be cancelled</li>
                  <li>• Data deletion may take up to 30 days</li>
                  <li>• Some data may be retained for legal reasons</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-red-300 mb-2">By Us</h4>
                <ul className="space-y-1 text-red-200 text-sm">
                  <li>• We may suspend accounts for policy violations</li>
                  <li>• Immediate termination for severe violations</li>
                  <li>• Notice provided when possible</li>
                  <li>• Appeal process available for suspensions</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Governing Law */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Governing Law & Disputes</h2>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Governing Law</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Terms governed by applicable laws</li>
                  <li>• Jurisdiction in competent courts</li>
                  <li>• International users subject to local laws</li>
                  <li>• Severability clause applies</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Dispute Resolution</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Contact us first for dispute resolution</li>
                  <li>• Arbitration may be required</li>
                  <li>• Class action waivers may apply</li>
                  <li>• Mediation available for eligible disputes</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
          
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6">
            <p className="text-emerald-300 mb-4">
              If you have questions about these terms, please contact us:
            </p>
            
            <div className="space-y-2 text-emerald-200">
              <p><strong>Email:</strong> legal@communitypledges.com</p>
              <p><strong>Support:</strong> <a href="/contact" className="underline hover:text-emerald-100">Contact Form</a></p>
              <p><strong>Address:</strong> CommunityPledges Legal Department</p>
            </div>
          </div>
        </section>

        {/* Updates */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Terms Updates</h2>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <p className="text-gray-300">
              We may update these terms from time to time. We'll notify you of significant changes 
              via email or through our platform. Your continued use of our services after changes 
              constitutes acceptance of the updated terms.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}


