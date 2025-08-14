import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-baby-goats-black">
            BABY GOATS
          </Link>
        </div>

        {/* Error Card */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">
              Authentication Error
            </CardTitle>
            <CardDescription>
              There was a problem with your authentication link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2">
              <p>This could happen if:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>The magic link has expired</li>
                <li>The link has already been used</li>
                <li>The link was corrupted or incomplete</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link href="/login" className="block">
                <Button variant="babygoats" className="w-full">
                  Request New Magic Link
                </Button>
              </Link>
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>
                Still having trouble?{' '}
                <a href="mailto:support@babygoats.com" className="text-baby-goats-red hover:underline">
                  Contact Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}