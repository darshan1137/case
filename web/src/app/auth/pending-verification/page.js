'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@/components/ui';

export default function PendingVerificationPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  
  const isContractor = type === 'contractor';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center">
            <span className="text-4xl">⏳</span>
          </div>
          <CardTitle className="text-2xl">Registration Submitted</CardTitle>
          <CardDescription>
            Your registration is pending verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            {isContractor ? (
              <>
                Thank you for registering as a contractor. Your application will be 
                reviewed by a municipal officer. You will receive an email notification 
                once your account has been verified and activated.
              </>
            ) : (
              <>
                Thank you for registering as an officer. Your application will be 
                reviewed by a Class A officer (Commissioner). You will receive an email 
                notification once your account has been verified and activated.
              </>
            )}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your details will be verified against official records</li>
              <li>• You may be contacted for additional documentation</li>
              <li>• Verification typically takes 1-3 business days</li>
              <li>• You'll receive an email once approved</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Link href="/auth/login" className="w-full">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="ghost" className="w-full">
              Go to Homepage
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
