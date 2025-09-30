'use client'

import { useState } from 'react'
import { Search, ChevronDown, ChevronUp, HelpCircle, Mail, MessageCircle } from 'lucide-react'

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        question: 'How does CommunityPledges work?',
        answer: 'CommunityPledges allows server owners to share hosting costs with their community. Users can pledge monthly amounts to support servers they love, and the cost is divided among all pledgers.'
      },
      {
        question: 'How do I create a server listing?',
        answer: 'Click "Create Server" in the navigation or dashboard, fill in your server details including name, description, game type, and monthly cost. You\'ll need to add payment and deposit methods in settings.'
      },
      {
        question: 'What payment methods are supported?',
        answer: 'We support major credit cards (Visa, MasterCard, American Express) and bank transfers for deposit methods. All payments are processed securely through our payment partners.'
      }
    ]
  },
  {
    category: 'Pledging',
    questions: [
      {
        question: 'How much should I pledge?',
        answer: 'You can pledge any amount you\'re comfortable with. The platform shows the cost per person if divided equally, but you only pay what you actually pledge.'
      },
      {
        question: 'Can I change or cancel my pledge?',
        answer: 'Yes, you can modify or cancel your pledges at any time through your dashboard. Changes take effect at the next billing cycle.'
      },
      {
        question: 'What happens if a server doesn\'t reach its goal?',
        answer: 'If a server doesn\'t reach its funding goal, pledgers are still charged their pledged amounts at the end of the month. The server owner will need to cover the remaining cost to keep the server running.'
      }
    ]
  },
  {
    category: 'Server Management',
    questions: [
      {
        question: 'Why is my server paused?',
        answer: 'Servers are automatically paused when payment or deposit methods are removed or invalid. Add valid payment methods in settings to unpause your servers.'
      },
      {
        question: 'How do I update my server information?',
        answer: 'Go to your dashboard, find your server, and click the edit button. You can update server details, costs, and other information at any time.'
      },
      {
        question: 'Can I see who pledged to my server?',
        answer: 'Yes, you can see pledge amounts and usernames in your server dashboard. This helps you understand your community support.'
      }
    ]
  },
  {
    category: 'Billing & Payments',
    questions: [
      {
        question: 'When am I charged for pledges?',
        answer: 'Pledges are charged monthly on the same date you first pledged. You\'ll receive email notifications before charges.'
      },
      {
        question: 'How do refunds work?',
        answer: 'Refunds are handled on a case-by-case basis. Contact support for refund requests. Unused portions of monthly pledges may be eligible for refunds.'
      },
      {
        question: 'Is my payment information secure?',
        answer: 'Yes, we use industry-standard encryption and work with certified payment processors. We never store your full payment details on our servers.'
      }
    ]
  }
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Help Center</h1>
        <p className="text-xl text-gray-300 mb-8">
          Find answers to common questions and get support
        </p>
        
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <Mail className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Contact Support</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <a
            href="mailto:support@communitypledges.com"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Mail className="w-4 h-4 mr-2" />
            Email Support
          </a>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <MessageCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Join Discord</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Connect with the community and get real-time help from other users.
          </p>
          <a
            href="#"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Join Discord
          </a>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="space-y-8">
        {filteredFaqs.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50">
            <div className="p-6 border-b border-slate-600">
              <h2 className="text-2xl font-bold text-white">{category.category}</h2>
            </div>
            <div className="divide-y divide-slate-600">
              {category.questions.map((faq, faqIndex) => {
                const itemId = `${categoryIndex}-${faqIndex}`
                const isExpanded = expandedItems.has(itemId)
                
                return (
                  <div key={faqIndex}>
                    <button
                      onClick={() => toggleExpanded(itemId)}
                      className="w-full px-6 py-4 text-left hover:bg-slate-700/30 transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium text-white">{faq.question}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {searchQuery && filteredFaqs.length === 0 && (
        <div className="text-center py-12">
          <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
          <p className="text-gray-300 mb-4">
            Try different keywords or contact support for personalized help.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  )
}
