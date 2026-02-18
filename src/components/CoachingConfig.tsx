'use client';

import React, { useState } from 'react';

interface Config {
  id: string;
  metricType: string;
  thresholdValue: number;
  enabled: boolean;
}

interface CoachingConfigProps {
  clientId: string;
  configs: Config[];
  onSave?: (clientId: string, configs: Config[]) => Promise<void>;
}

const METRIC_LABELS: { [key: string]: { name: string; unit: string } } = {
  LEADS_TO_CONSULT_RATE: { name: 'Leads → Consults Conversion Rate', unit: '%' },
  LEADS_TO_SALE_RATE: { name: 'Leads → Sales Conversion Rate', unit: '%' },
  ROAS: { name: 'Return on Ad Spend (ROAS)', unit: 'x' },
};

export function CoachingConfig({ clientId, configs, onSave }: CoachingConfigProps) {
  const [values, setValues] = useState<{ [key: string]: number }>(
    configs.reduce((acc, c) => ({ ...acc, [c.metricType]: c.thresholdValue }), {})
  );
  const [enabled, setEnabled] = useState<{ [key: string]: boolean }>(
    configs.reduce((acc, c) => ({ ...acc, [c.metricType]: c.enabled }), {})
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      const updatedConfigs = configs.map((c) => ({
        ...c,
        thresholdValue: values[c.metricType],
        enabled: enabled[c.metricType],
      }));
      await onSave(clientId, updatedConfigs);
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Coaching Alert Thresholds</h3>
      <p className="text-sm text-slate-600 mb-6">
        Alerts will trigger when metrics fall below these thresholds
      </p>

      <div className="space-y-4">
        {configs.map((config) => {
          const label = METRIC_LABELS[config.metricType] || { name: config.metricType, unit: '' };
          const isPercent = config.metricType !== 'ROAS';

          return (
            <div key={config.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    {label.name}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={values[config.metricType] || 0}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [config.metricType]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      step={isPercent ? 0.01 : 0.1}
                      min="0"
                      className="px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
                    />
                    <span className="text-sm text-slate-600">{label.unit}</span>
                    {isPercent && (
                      <span className="text-xs text-slate-500 ml-2">
                        ({((values[config.metricType] || 0) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled[config.metricType] !== false}
                      onChange={(e) =>
                        setEnabled((prev) => ({
                          ...prev,
                          [config.metricType]: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">Enabled</span>
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium rounded transition-colors"
      >
        {saving ? 'Saving...' : 'Save Configuration'}
      </button>
    </div>
  );
}
