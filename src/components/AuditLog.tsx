'use client';

import React from 'react';

interface AuditLogEntry {
  id: string;
  action: string;
  details?: any;
  createdAt: string;
}

interface AuditLogProps {
  logs: AuditLogEntry[];
  loading?: boolean;
}

const ACTION_LABELS: { [key: string]: { label: string; color: string; icon: string } } = {
  PII_STRIPPED: { label: 'PII Stripped', color: 'orange', icon: '🔒' },
  SYNC_SUCCESS: { label: 'Sync Successful', color: 'green', icon: '✓' },
  SYNC_FAILED: { label: 'Sync Failed', color: 'red', icon: '✕' },
  SYNC_STARTED: { label: 'Sync Started', color: 'blue', icon: '⟳' },
  CONFIG_UPDATED: { label: 'Config Updated', color: 'purple', icon: '⚙️' },
  ALERT_CREATED: { label: 'Alert Created', color: 'red', icon: '🔔' },
  ALERT_ACKNOWLEDGED: { label: 'Alert Acknowledged', color: 'green', icon: '✓' },
};

export function AuditLog({ logs, loading = false }: AuditLogProps) {
  const getActionInfo = (action: string) => {
    return (
      ACTION_LABELS[action] || { label: action, color: 'slate', icon: '📋' }
    );
  };

  const getColorClass = (color: string) => {
    const colors: { [key: string]: string } = {
      green: 'bg-green-50 border-green-200 text-green-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      slate: 'bg-slate-50 border-slate-200 text-slate-800',
    };
    return colors[color] || colors.slate;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Audit Log</h3>

      {loading ? (
        <p className="text-slate-600 text-center py-8">Loading audit logs...</p>
      ) : logs.length === 0 ? (
        <p className="text-slate-600 text-center py-8">No audit logs</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const actionInfo = getActionInfo(log.action);
            const colorClass = getColorClass(actionInfo.color);

            return (
              <div
                key={log.id}
                className={`border border-l-4 rounded-lg p-3 ${colorClass}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">
                      {actionInfo.icon} {actionInfo.label}
                    </p>
                    {log.details && (
                      <p className="text-sm mt-1 opacity-90">
                        {typeof log.details === 'string'
                          ? log.details
                          : JSON.stringify(log.details).slice(0, 100)}
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-medium whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
