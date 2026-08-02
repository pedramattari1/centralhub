import { useCallback, useEffect, useState } from 'react';
import { Ban } from 'lucide-react';
import { useApi } from '@/lib/api';
import { useAppData } from '@/hooks/useAppData.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { Card } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';

export default function AdminUsersPage() {
  const api = useApi();
  const { user: currentUser } = useAppData();
  const { toast } = useToast();
  const [users, setUsers] = useState(null);

  const load = useCallback(async () => {
    const { users } = await api.get('/admin/users');
    setUsers(users);
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeRole(u, role) {
    try {
      await api.put(`/admin/users/${u.id}/role`, { role });
      toast({ message: `${u.email} set to ${role.toLowerCase()}` });
      load();
    } catch {
      toast({ message: 'Could not change role.', variant: 'error' });
    }
  }

  async function deactivate(u) {
    if (!window.confirm(`Deactivate ${u.email}? They lose access on their next request.`)) return;
    try {
      await api.del(`/admin/users/${u.id}`);
      toast({ message: `${u.email} deactivated` });
      load();
    } catch (err) {
      toast({ message: err.message || 'Could not deactivate user.', variant: 'error' });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          Invite and remove users in the Clerk dashboard - this reflects their state here.
        </p>
      </div>

      {users === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.displayName || '-'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value)}
                        disabled={isSelf}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm disabled:opacity-50"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          u.isActive
                            ? 'rounded-full bg-accent-50 px-2 py-0.5 text-xs text-accent-700'
                            : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500'
                        }
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.isActive && !isSelf && (
                        <Button variant="ghost" size="sm" onClick={() => deactivate(u)}>
                          <Ban className="h-4 w-4 text-red-500" aria-hidden="true" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
