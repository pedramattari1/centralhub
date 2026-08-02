import { useClerk } from '@clerk/clerk-react';
import { LogOut } from 'lucide-react';
import { useAppData } from '@/hooks/useAppData.jsx';
import { Card } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';

export default function SettingsPage() {
  const { user } = useAppData();
  const { signOut } = useClerk();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Your profile and account.</p>
      </div>

      <Card className="divide-y divide-gray-100">
        <Row label="Name" value={user?.displayName || '—'} />
        <Row label="Email" value={user?.email || '—'} />
        <Row label="Role" value={user?.isAdmin ? 'Administrator' : 'Member'} />
      </Card>

      <Button variant="secondary" onClick={() => signOut({ redirectUrl: '/sign-in' })}>
        <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
      </Button>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
