import { MagicLinkForm } from '@/components/auth/magic-link-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-baby-goats-black">
            BABY GOATS
          </Link>
          <p className="mt-2 text-gray-600">
            Welcome back to your athletic journey
          </p>
        </div>

        {/* Login Form */}
        <MagicLinkForm />

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="text-sm text-gray-600 hover:text-baby-goats-red"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}