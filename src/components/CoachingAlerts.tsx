'use client';

import React, { useState } from 'react';

interface Alert {
  id: string;
  metricType: string;
  actualValue: number;
  thresholdValue: number;
  triggeredAt: string;
  acknowledgedAt?: string;
  notes?: string;
}

interface CoachingAlertsProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string, notes?: string) => Promise<void>;
}

export function CoachingAlerts({ alerts, onAcknowledge }: CoachingAlertsProps) {
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  const handleAcknowledge = async (alertId: string) => {
    if (!onAcknowledge) return;
    
    setAcknowledging(alertId);
    try {
      await onAcknowledge(alertId, notes[alertId]);
      setNotes((prev) => ({ ...prev, [alertId]: '' }));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    } finally {
      setAcknowledging(null);
    }
  };

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledgedAt);
  const acknowledgedAlerts = alerts.filter((a) => a.acknowledgedAt);

  const getMetricLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      LEADS_TO_CONSULT_RATE: 'Leads → Consults Rate',
      LEADS_TO_SALE_RATE: 'Leads → Sales Rate',
      ROAS: 'Return on Ad Spend',
    };
    return labels[type] || type;
  };

  const getMetricFormat = (type: string, value: number) => {
    if (type === 'ROAS') {
      return value.toFixed(2);
    }
    return (value * 100).toFixed(1) + '%';
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
        <p className="text-slate-600">No coaching alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Unacknowledged Alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Active Alerts</h3>
          {unacknowledgedAlerts.map((alert) => (
            <div
              key={alert.id}
              className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">
                    {getMetricLabel(alert.metricType)} Below Threshold
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Current: <span className="font-semibold">{getMetricFormat(alert.metricType, alert.actualValue)}</span> | Threshold: <span className="font-semibold">{getMetricFormat(alert.metricType, alert.thresholdValue)}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(alert.triggeredAt).toLocaleString()}
                  </p>
                  <textarea
                    value={notes[alert.id] || ''}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [alert.id]: e.target.value }))
                    }
                    placeholder="Add notes (optional)..."
                    className="w-full mt-3 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={2}
                  />
                </div>
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  disabled={acknowledging === alert.id}
                  className="flex-shrink-0 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white text-sm font-medium rounded transition-colors"
                >
                  {acknowledging === alert.id ? 'Acknowledging...' : 'Acknowledge'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Acknowledged Alerts */}
      {acknowledgedAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Acknowledged</h3>
          {acknowledgedAlerts.map((alert) => (
            <div
              key={alert.id}
              className="border-l-4 border-green-500 bg-green-50 rounded-lg p-4"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {getMetricLabel(alert.metricType)}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Current: <span className="font-semibold">{getMetricFormat(alert.metricType, alert.actualValue)}</span> | Threshold: <span className="font-semibold">{getMetricFormat(alert.metricType, alert.thresholdValue)}</span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Acknowledged {new Date(alert.acknowledgedAt || '').toLocaleString()}
                </p>
                {alert.notes && (
                  <p className="text-sm text-slate-600 mt-2 p-2 bg-white rounded border border-green-200">
                    {alert.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
