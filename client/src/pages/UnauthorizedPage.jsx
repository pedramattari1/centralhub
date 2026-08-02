import { useClerk } from '@clerk/clerk-react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

// Intentionally reveals no detail about the admin or internal system.
export default function UnauthorizedPage() {
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gray-50 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
        <ShieldAlert className="h-7 w-7" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-xl font-semibold text-gray-900">You don&apos;t have access to CentralHub</h1>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Contact your administrator to request access.
        </p>
      </div>
      <Button variant="secondary" onClick={() => signOut({ redirectUrl: '/sign-in' })}>
        Sign out
      </Button>
    </div>
  );
}
