'use client';

import React, { useState } from 'react';

interface Client {
  id: string;
  name: string;
  isMedical: boolean;
  createdAt: string;
  lastSyncedAt?: string;
  syncStatus?: string;
}

interface AdminClientsProps {
  clients: Client[];
  onSync?: (clientId: string) => Promise<void>;
}

export function AdminClients({ clients, onSync }: AdminClientsProps) {
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = async (clientId: string) => {
    if (!onSync) return;

    setSyncing(clientId);
    try {
      await onSync(clientId);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Clients</h3>

      {clients.length === 0 ? (
        <p className="text-slate-600 text-center py-8">No clients configured</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-4 font-semibold text-slate-900">Client Name</th>
                <th className="text-left py-2 px-4 font-semibold text-slate-900">Type</th>
                <th className="text-left py-2 px-4 font-semibold text-slate-900">Last Synced</th>
                <th className="text-left py-2 px-4 font-semibold text-slate-900">Status</th>
                <th className="text-right py-2 px-4 font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-900 font-medium">{client.name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        client.isMedical
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {client.isMedical ? 'Medical' : 'Non-Medical'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {client.lastSyncedAt
                      ? new Date(client.lastSyncedAt).toLocaleString()
                      : 'Never'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        client.syncStatus === 'SUCCESS'
                          ? 'bg-green-100 text-green-800'
                          : client.syncStatus === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : client.syncStatus === 'SYNCING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {client.syncStatus || 'PENDING'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleSync(client.id)}
                      disabled={syncing === client.id}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs font-medium rounded transition-colors"
                    >
                      {syncing === client.id ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
