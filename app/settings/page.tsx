'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreditCard, Building2, CheckCircle, AlertCircle, Save, User, Trash2, Edit3, X, Mail, Lock, Camera, Upload } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'
import StripePaymentForm from '@/components/StripePaymentForm'

const paymentMethodSchema = z.object({
  cardNumber: z.string().min(16, 'Card number must be 16 digits').max(19, 'Invalid card number'),
  expiryMonth: z.number().min(1, 'Invalid month').max(12, 'Invalid month'),
  expiryYear: z.number().min(new Date().getFullYear(), 'Card expired'),
  cvv: z.string().min(3, 'CVV must be 3 digits').max(4, 'CVV must be 3-4 digits'),
  cardholderName: z.string().min(2, 'Cardholder name required'),
})


const accountSettingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false
  }
  return true
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type PaymentMethodForm = z.infer<typeof paymentMethodSchema>
type AccountSettingsForm = z.infer<typeof accountSettingsSchema>

interface UserSettings {
  hasPaymentMethod: boolean
  hasDepositMethod: boolean
  cardLast4?: string
  cardBrand?: string
  cardExpMonth?: number
  cardExpYear?: number
  stripePaymentMethodId?: string
  stripeAccountId?: string
  bankAccountLast4?: string
  bankName?: string
  name?: string
  email?: string
  image?: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addNotification } = useNotifications()
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'account' | 'payment' | 'deposit'>('account')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)
  const [isUpdatingDeposit, setIsUpdatingDeposit] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteType, setDeleteType] = useState<'payment' | 'deposit'>('payment')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [savingProfileImage, setSavingProfileImage] = useState(false)
  const [stripeConnectStatus, setStripeConnectStatus] = useState<any>(null)
  const [settingUpStripe, setSettingUpStripe] = useState(false)
  const [stripeConnectLoading, setStripeConnectLoading] = useState(false)

  const paymentForm = useForm<PaymentMethodForm>({
    resolver: zodResolver(paymentMethodSchema)
  })


  const accountForm = useForm<AccountSettingsForm>({
    resolver: zodResolver(accountSettingsSchema)
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      fetchUserSettings()
      fetchStripeConnectStatus()
    } else if (status === 'loading') {
      // Keep loading state true while session is loading
      setLoading(true)
    }
  }, [status, router])

  const fetchUserSettings = async () => {
    try {
      setLoading(true)
      console.log('Fetching user settings...')
      const response = await fetch('/api/user/settings')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const settings = await response.json()
        console.log('Settings loaded:', settings)
        setUserSettings(settings)
        // Set form default values
        accountForm.reset({
          name: settings.name || '',
          email: settings.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        if (settings.image) {
          setProfileImagePreview(settings.image)
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch user settings:', response.status, errorData)
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load settings',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error loading settings',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStripeConnectStatus = async () => {
    try {
      const response = await fetch('/api/stripe/connect/status')
      if (response.ok) {
        const status = await response.json()
        setStripeConnectStatus(status)
      }
    } catch (error) {
      console.error('Error fetching Stripe Connect status:', error)
    }
  }


  const onPaymentSubmit = async (data: PaymentMethodForm) => {
    setSaving(true)
    try {
      const method = isUpdatingPayment ? 'PUT' : 'POST'
      const response = await fetch('/api/user/settings/payment', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const result = await response.json()
        await fetchUserSettings()
        paymentForm.reset()
        setIsUpdatingPayment(false)
        if (result.unpausedServers && result.unpausedServers.length > 0) {
          addNotification({
            type: 'success',
            title: 'Payment Method Saved',
            message: `Your servers have been unpaused: ${result.unpausedServers.join(', ')}`,
            duration: 6000
          })
        } else {
          addNotification({
            type: 'success',
            title: 'Payment Method Saved',
            message: `Payment method ${isUpdatingPayment ? 'updated' : 'added'} successfully!`,
            duration: 4000
          })
        }
      } else {
        const error = await response.json()
        console.error('Error saving payment method:', error.message)
      }
    } catch (error) {
      console.error('Error saving payment method:', error)
    } finally {
      setSaving(false)
    }
  }

  const onDeletePayment = async () => {
    setDeleting(true)
    try {
      const response = await fetch('/api/user/settings/payment', {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        await fetchUserSettings()
        setShowDeleteModal(false)
        addNotification({
          type: 'warning',
          title: 'Payment Method Deleted',
          message: `You were unpledged from ${result.unpledgedCount} server(s): ${result.unpledgedServers.join(', ')}`,
          duration: 8000
        })
      } else {
        const error = await response.json()
        console.error('Error deleting payment method:', error.message)
      }
    } catch (error) {
      console.error('Error deleting payment method:', error)
    } finally {
      setDeleting(false)
    }
  }

  const onStripePaymentSuccess = async (paymentMethodId: string) => {
    setSaving(true)
    try {
      const method = isUpdatingPayment ? 'PUT' : 'POST'
      const response = await fetch('/api/user/settings/payment', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId })
      })
      
      if (response.ok) {
        const result = await response.json()
        await fetchUserSettings()
        setIsUpdatingPayment(false)
        if (result.unpausedServers && result.unpausedServers.length > 0) {
          addNotification({
            type: 'success',
            title: 'Payment Method Saved',
            message: `Your servers have been unpaused: ${result.unpausedServers.join(', ')}`,
            duration: 6000
          })
        } else {
          addNotification({
            type: 'success',
            title: 'Payment Method Saved',
            message: `Payment method ${isUpdatingPayment ? 'updated' : 'added'} successfully!`,
            duration: 4000
          })
        }
      } else {
        const error = await response.json()
        addNotification({
          type: 'error',
          title: 'Error',
          message: error.message || 'Failed to save payment method',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error saving payment method:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error saving payment method',
        duration: 5000
      })
    } finally {
      setSaving(false)
    }
  }

  const onStripePaymentError = (error: string) => {
    addNotification({
      type: 'error',
      title: 'Payment Error',
      message: error,
      duration: 5000
    })
  }

  const setupStripeConnect = async () => {
    try {
      setStripeConnectLoading(true)
      const response = await fetch('/api/user/settings/deposit', {
        method: 'POST'
      })
      
      if (response.ok) {
        const { onboardingUrl } = await response.json()
        window.location.href = onboardingUrl
      } else {
        const error = await response.json()
        addNotification({
          type: 'error',
          title: 'Stripe Connect Setup Failed',
          message: error.message || 'Failed to set up Stripe Connect',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error setting up Stripe Connect:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error setting up Stripe Connect',
        duration: 5000
      })
    } finally {
      setStripeConnectLoading(false)
    }
  }

  const updateStripeConnect = async () => {
    try {
      setStripeConnectLoading(true)
      const response = await fetch('/api/user/settings/deposit', {
        method: 'PUT'
      })
      
      if (response.ok) {
        const { onboardingUrl } = await response.json()
        window.location.href = onboardingUrl
      } else {
        const error = await response.json()
        addNotification({
          type: 'error',
          title: 'Stripe Connect Update Failed',
          message: error.message || 'Failed to update Stripe Connect',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error updating Stripe Connect:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error updating Stripe Connect',
        duration: 5000
      })
    } finally {
      setStripeConnectLoading(false)
    }
  }

  const deleteStripeConnect = async () => {
    try {
      setDeleting(true)
      const response = await fetch('/api/user/settings/deposit', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const result = await response.json()
        addNotification({
          type: 'success',
          title: 'Stripe Connect Removed',
          message: result.message,
          duration: 4000
        })
        if (result.pausedServers && result.pausedServers.length > 0) {
          addNotification({
            type: 'info',
            title: 'Servers Paused',
            message: `Your servers have been paused: ${result.pausedServers.join(', ')}`,
            duration: 6000
          })
        }
        await fetchUserSettings()
      } else {
        const error = await response.json()
        addNotification({
          type: 'error',
          title: 'Error',
          message: error.message || 'Failed to remove Stripe Connect',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error deleting Stripe Connect:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error removing Stripe Connect',
        duration: 5000
      })
    } finally {
      setDeleting(false)
    }
  }



  const onAccountSubmit = async (data: AccountSettingsForm) => {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('email', data.email)
      formData.append('currentPassword', data.currentPassword)
      
      if (data.newPassword) {
        formData.append('newPassword', data.newPassword)
      }

      const response = await fetch('/api/user/settings/account', {
        method: 'PUT',
        body: formData
      })

      if (response.ok) {
        await fetchUserSettings()
        addNotification({
          type: 'success',
          title: 'Account Updated',
          message: 'Your account settings have been updated successfully!',
          duration: 4000
        })
      } else {
        const error = await response.json()
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: error.message || 'Failed to update account settings',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Error updating account:', error)
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update account settings',
        duration: 4000
      })
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  const removeProfileImage = () => {
    setProfileImage(null)
    setProfileImagePreview(null)
  }

  const saveProfileImage = async () => {
    if (!profileImage) return

    setSavingProfileImage(true)
    try {
      const formData = new FormData()
      formData.append('profileImage', profileImage)

      const response = await fetch('/api/user/settings/profile-image', {
        method: 'PUT',
        body: formData
      })

      if (response.ok) {
        await fetchUserSettings()
        setProfileImage(null)
        addNotification({
          type: 'success',
          title: 'Profile Picture Updated',
          message: 'Your profile picture has been updated successfully!',
          duration: 4000
        })
      } else {
        const error = await response.json()
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: error.message || 'Failed to update profile picture',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Error updating profile picture:', error)
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update profile picture',
        duration: 4000
      })
    } finally {
      setSavingProfileImage(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      processImageFile(file)
    }
  }

  const processImageFile = (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      addNotification({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please upload a PNG, JPG, or WebP image',
        duration: 4000
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        type: 'error',
        title: 'File Too Large',
        message: 'Please upload an image smaller than 5MB',
        duration: 4000
      })
      return
    }

    setProfileImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setProfileImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Not authenticated</h2>
          <p className="text-gray-400">Please log in to access your settings.</p>
        </div>
      </div>
    )
  }

  if (!userSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Loading settings...</h2>
          <p className="text-gray-400">Please wait while we load your account settings.</p>
          <button
            onClick={fetchUserSettings}
            className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
        <p className="text-gray-300 mt-2">Manage your payment and deposit methods</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-600 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('account')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'account'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-white hover:border-slate-500'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Account Settings
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payment'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-white hover:border-slate-500'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Payment Methods
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'deposit'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-white hover:border-slate-500'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Deposit Methods
          </button>
        </nav>
      </div>

      {/* Account Settings Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Profile Picture Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Picture</h2>
            
            <div 
              className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                isDragOver 
                  ? 'border-emerald-400 bg-emerald-500/10' 
                  : 'border-slate-600 hover:border-slate-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-slate-600"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex space-x-3 mb-2">
                    <label className="cursor-pointer bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2">
                      <Camera className="w-4 h-4" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    
                    {profileImage && (
                      <button
                        onClick={saveProfileImage}
                        disabled={savingProfileImage}
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{savingProfileImage ? 'Saving...' : 'Save Picture'}</span>
                      </button>
                    )}
                    
                    {profileImagePreview && (
                      <button
                        onClick={removeProfileImage}
                        className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                        title="Remove Profile Picture"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    Upload a PNG, JPG, or WebP image. Max size: 5MB
                  </p>
                  <p className="text-sm text-emerald-400 mt-1">
                    Or drag and drop an image here
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information Form */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
            
            <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...accountForm.register('name')}
                      type="text"
                      placeholder="Your username"
                      className="w-full pl-10 pr-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
                    />
                  </div>
                  {accountForm.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-400">
                      {accountForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...accountForm.register('email')}
                      type="email"
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
                    />
                  </div>
                  {accountForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-400">
                      {accountForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-600 pt-4">
                <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...accountForm.register('currentPassword')}
                        type="password"
                        placeholder="Enter current password"
                        className="w-full pl-10 pr-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
                      />
                    </div>
                    {accountForm.formState.errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-400">
                        {accountForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...accountForm.register('newPassword')}
                          type="password"
                          placeholder="Enter new password"
                          className="w-full pl-10 pr-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
                        />
                      </div>
                      {accountForm.formState.errors.newPassword && (
                        <p className="mt-1 text-sm text-red-400">
                          {accountForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...accountForm.register('confirmPassword')}
                          type="password"
                          placeholder="Confirm new password"
                          className="w-full pl-10 pr-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
                        />
                      </div>
                      {accountForm.formState.errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-400">
                          {accountForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 text-white py-2 px-6 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          {/* Current Payment Method Status */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Payment Method</h2>
              {userSettings.hasPaymentMethod ? (
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Verified</span>
                </div>
              ) : (
                <div className="flex items-center text-red-400">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Required for Pledging</span>
                </div>
              )}
            </div>

            {userSettings.hasPaymentMethod ? (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <CreditCard className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="font-medium text-white">
                        {userSettings.cardBrand?.toUpperCase()} •••• {userSettings.cardLast4}
                      </p>
                      <p className="text-sm text-gray-400">
                        Expires {userSettings.cardExpMonth?.toString().padStart(2, '0')}/{userSettings.cardExpYear}
                      </p>
                      <p className="text-xs text-green-400 mt-1">
                        ✓ Secured by Stripe
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsUpdatingPayment(true)}
                      className="p-2 text-gray-400 hover:text-emerald-400 transition-colors"
                      title="Update payment method"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteType('payment')
                        setShowDeleteModal(true)
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Remove payment method"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-blue-300 font-medium">
                      Add a secure payment method
                    </p>
                    <p className="text-blue-200 text-sm">
                      Your card information is processed securely by Stripe
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add/Update Payment Method Form */}
          {(isUpdatingPayment || !userSettings.hasPaymentMethod) && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                {isUpdatingPayment ? 'Update Payment Method' : 'Add Payment Method'}
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    <strong>Secure Payment:</strong> Your card information is processed securely by Stripe. 
                    We never store your full card details on our servers.
                  </p>
                </div>
                <StripePaymentForm
                  onSuccess={onStripePaymentSuccess}
                  onError={onStripePaymentError}
                  isUpdating={isUpdatingPayment}
                />
                <div className="flex space-x-4">
                  {isUpdatingPayment && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUpdatingPayment(false)
                        paymentForm.reset()
                      }}
                      className="flex-1 bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deposit Methods Tab */}
      {activeTab === 'deposit' && (
        <div className="space-y-6">
          {/* Current Deposit Method Status */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Deposit Method</h2>
              {userSettings.hasDepositMethod ? (
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Verified</span>
                </div>
              ) : (
                <div className="flex items-center text-red-400">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Required for Server Creation</span>
                </div>
              )}
            </div>

            {userSettings?.hasDepositMethod && userSettings?.stripeAccountId ? (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <CreditCard className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="font-medium text-white">
                        Stripe Connect Account
                      </p>
                      <p className="text-sm text-gray-400">
                        Account ID: {userSettings.stripeAccountId}
                      </p>
                      <p className="text-xs text-green-400 mt-1">
                        ✓ Ready to receive payments
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={updateStripeConnect}
                      disabled={stripeConnectLoading}
                      className="p-2 text-gray-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
                      title="Update Stripe Connect"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteType('deposit')
                        setShowDeleteModal(true)
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Remove Stripe Connect"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-blue-300 font-medium">
                      Set up Stripe Connect to receive payments
                    </p>
                    <p className="text-blue-200 text-sm">
                      Receive payments directly from pledges to your servers
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stripe Connect Setup */}
          {!userSettings?.hasDepositMethod && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                Set Up Stripe Connect
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    <strong>Secure Payment Processing:</strong> Stripe Connect allows you to receive payments directly from pledges. 
                    Your bank account information is handled securely by Stripe.
                  </p>
                </div>
                <button
                  onClick={setupStripeConnect}
                  disabled={stripeConnectLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {stripeConnectLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Setting up...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Set Up Stripe Connect</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Remove {deleteType === 'payment' ? 'Payment Method' : 'Stripe Connect'}
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-3">
                Are you sure you want to remove your {deleteType === 'payment' ? 'payment method' : 'Stripe Connect account'}? This action will:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>Remove your {deleteType} method from your account</li>
                {deleteType === 'payment' ? (
                  <>
                    <li><strong className="text-red-400">Automatically unpledge you from all current server commitments</strong></li>
                    <li>Prevent you from making new pledges until you add a new payment method</li>
                  </>
                ) : (
                  <>
                    <li><strong className="text-red-400">Pause all your servers (users won't be able to pledge to them)</strong></li>
                    <li>Prevent you from receiving payments until you add a new deposit method</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={deleteType === 'payment' ? onDeletePayment : deleteStripeConnect}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Removing...' : `Remove ${deleteType === 'payment' ? 'Payment Method' : 'Stripe Connect'}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
