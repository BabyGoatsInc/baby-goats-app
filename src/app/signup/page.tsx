import { SignupForm } from '@/components/auth/magic-link-form'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-baby-goats-black">
            BABY GOATS
          </Link>
          <p className="mt-2 text-gray-600">
            Start your journey to greatness
          </p>
        </div>

        {/* Signup Form */}
        <SignupForm />

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-medium text-baby-goats-red hover:underline"
            >
              Sign in here
            </Link>
          </p>
          <Link 
            href="/" 
            className="block mt-4 text-sm text-gray-600 hover:text-baby-goats-red"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}