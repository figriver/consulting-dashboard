'use client';

import React, { useEffect, useState } from 'react';

interface Client {
  id: string;
  name: string;
  isMedical: boolean;
}

interface SheetConfig {
  id: string;
  clientId: string;
  sheetId: string;
  sheetName: string;
  tabNames: string[];
  lastSyncedAt?: string;
  syncStatus: 'PENDING' | 'SYNCING' | 'SUCCESS' | 'FAILED';
  lastError?: string;
  client?: {
    name: string;
    isMedical: boolean;
  };
}

interface DataSourcesProps {
  selectedClientId?: string;
  onConfigCreated?: () => void;
}

export function DataSources({ selectedClientId, onConfigCreated }: DataSourcesProps) {
  const [configs, setConfigs] = useState<SheetConfig[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    clientId: selectedClientId || '',
    sheetId: '',
    sheetName: '',
    tabNames: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch configs
  useEffect(() => {
    fetchConfigs();
    // Refresh every 5 seconds (for sync status updates)
    const interval = setInterval(fetchConfigs, 5000);
    return () => clearInterval(interval);
  }, [selectedClientId]);

  async function fetchClients() {
    try {
      const res = await fetch('/api/admin/clients');
      const data = await res.json();
      if (data.success && data.data) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }

  async function fetchConfigs() {
    try {
      const url = selectedClientId
        ? `/api/admin/sheets-config?client_id=${selectedClientId}`
        : '/api/admin/sheets-config';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setConfigs(data.data);
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (!formData.clientId) {
        throw new Error('Please select a client');
      }
      if (!formData.sheetId) {
        throw new Error('Please enter a Google Sheet ID');
      }
      if (!formData.tabNames.trim()) {
        throw new Error('Please enter at least one tab name');
      }

      const tabNames = formData.tabNames
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await fetch('/api/admin/sheets-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: formData.clientId,
          sheetId: formData.sheetId,
          sheetName: formData.sheetName || formData.sheetId,
          tabNames,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create sheet config');
      }

      // Reset form
      setFormData({
        clientId: selectedClientId || '',
        sheetId: '',
        sheetName: '',
        tabNames: '',
      });
      setShowForm(false);

      // Refresh list
      await fetchConfigs();
      onConfigCreated?.();
    } catch (error) {
      setFormError(String(error));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleManualSync(configId: string, clientId: string) {
    setSyncing(configId);
    try {
      const res = await fetch(`/api/admin/sync-all?client_id=${clientId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger sync');
      }

      // Refresh configs to show updated status
      await fetchConfigs();
    } catch (error) {
      console.error('Sync failed:', error);
      alert(`Sync failed: ${String(error)}`);
    } finally {
      setSyncing(null);
    }
  }

  async function handleDelete(configId: string, clientId: string) {
    if (!confirm('Delete this sheet configuration? Data already synced will remain.')) {
      return;
    }

    setDeleting(configId);
    try {
      const res = await fetch(`/api/admin/sheets-config?id=${configId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete');
      }

      // Refresh list
      await fetchConfigs();
    } catch (error) {
      console.error('Delete failed:', error);
      alert(`Delete failed: ${String(error)}`);
    } finally {
      setDeleting(null);
    }
  }

  function getSyncStatusColor(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'SYNCING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Sheet Form */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-900">Add Data Source</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            {showForm ? 'Hide Form' : 'Add Sheet'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Client *
              </label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                    {client.isMedical ? ' (Medical - PII will be stripped)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Google Sheet ID *
              </label>
              <input
                type="text"
                name="sheetId"
                value={formData.sheetId}
                onChange={handleInputChange}
                placeholder="e.g., 1a2b3c4d5e6f7g8h9i..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sheet Name (optional)
              </label>
              <input
                type="text"
                name="sheetName"
                value={formData.sheetName}
                onChange={handleInputChange}
                placeholder="Human-readable name for this sheet"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tab Names * (comma-separated)
              </label>
              <input
                type="text"
                name="tabNames"
                value={formData.tabNames}
                onChange={handleInputChange}
                placeholder="e.g., January, February, March"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter the exact names of the tabs/sheets in your Google Sheet
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {formError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium rounded transition-colors"
              >
                {formLoading ? 'Creating...' : 'Add Sheet'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Existing Sheets List */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Data Sources</h3>

        {loading ? (
          <p className="text-slate-600 text-center py-8">Loading...</p>
        ) : configs.length === 0 ? (
          <p className="text-slate-600 text-center py-8">
            No data sources configured{selectedClientId ? ' for this client' : ''}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-4 font-semibold text-slate-900">Client</th>
                  <th className="text-left py-2 px-4 font-semibold text-slate-900">Sheet Name</th>
                  <th className="text-left py-2 px-4 font-semibold text-slate-900">Tabs</th>
                  <th className="text-left py-2 px-4 font-semibold text-slate-900">Status</th>
                  <th className="text-left py-2 px-4 font-semibold text-slate-900">Last Synced</th>
                  <th className="text-right py-2 px-4 font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((config) => (
                  <tr key={config.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-900 font-medium">{config.client?.name}</td>
                    <td className="py-3 px-4 text-slate-600">{config.sheetName}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {config.tabNames.join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getSyncStatusColor(
                            config.syncStatus
                          )}`}
                        >
                          {config.syncStatus}
                        </span>
                        {config.lastError && (
                          <div className="text-xs text-red-700 bg-red-50 p-1 rounded max-w-xs">
                            {config.lastError.substring(0, 100)}
                            {config.lastError.length > 100 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {config.lastSyncedAt
                        ? new Date(config.lastSyncedAt).toLocaleString()
                        : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleManualSync(config.id, config.clientId)}
                        disabled={syncing === config.id || config.syncStatus === 'SYNCING'}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white text-xs font-medium rounded transition-colors"
                      >
                        {syncing === config.id ? 'Syncing...' : 'Sync'}
                      </button>
                      <button
                        onClick={() => handleDelete(config.id, config.clientId)}
                        disabled={deleting === config.id}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white text-xs font-medium rounded transition-colors"
                      >
                        {deleting === config.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
