'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminClients } from '@/components/AdminClients';
import { CoachingConfig } from '@/components/CoachingConfig';
import { AuditLog } from '@/components/AuditLog';

interface Client {
  id: string;
  name: string;
  isMedical: boolean;
  createdAt: string;
  lastSyncedAt?: string;
  syncStatus?: string;
}

interface Config {
  id: string;
  metricType: string;
  thresholdValue: number;
  enabled: boolean;
}

interface AuditLogEntry {
  id: string;
  action: string;
  details?: any;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [coachingConfigs, setCoachingConfigs] = useState<Config[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'clients' | 'coaching' | 'logs'>('clients');

  // Check admin access
  useEffect(() => {
    if (session && session.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Fetch clients
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetch('/api/admin/clients')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setClients(data.data);
            if (data.data.length > 0) {
              setSelectedClientId(data.data[0].id);
            }
          }
        })
        .catch((err) => console.error('Error fetching clients:', err))
        .finally(() => setLoading(false));
    }
  }, [session]);

  // Fetch coaching config for selected client
  useEffect(() => {
    if (!selectedClientId || session?.user?.role !== 'ADMIN') return;

    fetch(`/api/admin/coaching-config?client_id=${selectedClientId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCoachingConfigs(data.data);
        }
      })
      .catch((err) => console.error('Error fetching config:', err));
  }, [selectedClientId, session]);

  // Fetch audit logs for selected client
  useEffect(() => {
    if (!selectedClientId || session?.user?.role !== 'ADMIN') return;

    fetch(`/api/admin/audit-logs?client_id=${selectedClientId}&limit=50`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAuditLogs(data.data);
        }
      })
      .catch((err) => console.error('Error fetching audit logs:', err));
  }, [selectedClientId, session]);

  const handleSync = async (clientId: string) => {
    try {
      const response = await fetch(`/api/sync/trigger?client_id=${clientId}`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Sync triggered:', data);
        
        // Refresh clients list to show updated sync status
        const clientsRes = await fetch('/api/admin/clients');
        const clientsData = await clientsRes.json();
        if (clientsData.success) {
          setClients(clientsData.data);
        }
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
    }
  };

  const handleSaveCoachingConfig = async (clientId: string, configs: Config[]) => {
    try {
      const response = await fetch('/api/admin/coaching-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          configs: configs.map((c) => ({
            metricType: c.metricType,
            thresholdValue: c.thresholdValue,
            enabled: c.enabled,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh config
          const configRes = await fetch(`/api/admin/coaching-config?client_id=${clientId}`);
          const configData = await configRes.json();
          if (configData.success) {
            setCoachingConfigs(configData.data);
          }
        }
      }
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  };

  if (!session) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (session.user?.role !== 'ADMIN') {
    return <div className="text-center py-8">Access denied</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-600 mt-2">Manage clients, sync settings, and coaching alerts</p>
      </div>

      {/* Client Selector */}
      {clients.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Client
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab('clients')}
          className={`py-2 px-4 font-medium border-b-2 transition-colors ${
            activeTab === 'clients'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Clients & Sync
        </button>
        <button
          onClick={() => setActiveTab('coaching')}
          className={`py-2 px-4 font-medium border-b-2 transition-colors ${
            activeTab === 'coaching'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Coaching Config
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-2 px-4 font-medium border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Loading...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'clients' && (
            <AdminClients clients={clients} onSync={handleSync} />
          )}

          {activeTab === 'coaching' && selectedClientId && coachingConfigs.length > 0 && (
            <CoachingConfig
              clientId={selectedClientId}
              configs={coachingConfigs}
              onSave={handleSaveCoachingConfig}
            />
          )}

          {activeTab === 'logs' && (
            <AuditLog logs={auditLogs} loading={loading} />
          )}

          {activeTab === 'coaching' && coachingConfigs.length === 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
              <p className="text-slate-600">
                {selectedClientId
                  ? 'No coaching configuration available for this client'
                  : 'Select a client to view coaching config'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
