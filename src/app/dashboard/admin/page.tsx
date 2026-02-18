'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && session.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, router]);

  if (!session) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (session.user?.role !== 'ADMIN') {
    return <div className="text-center py-8">Access denied</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-600 mt-2">Manage clients, sync settings, and coaching alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Clients</h2>
          <p className="text-slate-600 mb-4">View and manage consulting clients</p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
            Manage Clients
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Coaching Alerts</h2>
          <p className="text-slate-600 mb-4">Configure alert thresholds per client</p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
            Configure Alerts
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Data Sync</h2>
          <p className="text-slate-600 mb-4">View sync status and trigger manual syncs</p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
            View Sync Status
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Audit Logs</h2>
          <p className="text-slate-600 mb-4">Review PII stripping and sync operations</p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
            View Logs
          </button>
        </div>
      </div>
    </div>
  );
}
