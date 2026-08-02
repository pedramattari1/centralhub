import { SignIn, useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { FullPageSpinner } from '@/components/ui/spinner.jsx';

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <FullPageSpinner />;
  if (isSignedIn) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Central<span className="text-accent-600">Hub</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">The Fay San Jose — team platform launchpad</p>
      </div>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-in" fallbackRedirectUrl="/" />
    </div>
  );
}
