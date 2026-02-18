'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KPICard } from '@/components/KPICard';
import { MetricsCharts } from '@/components/MetricsCharts';
import { CoachingAlerts } from '@/components/CoachingAlerts';

interface Metric {
  date: string;
  medium?: string;
  source?: string;
  campaign?: string;
  location?: string;
  user?: string;
  servicePerson?: string;
  leads: number;
  consults: number;
  sales: number;
  spend: number;
  roas: number;
  leadsToConsultRate: number;
  leadsToSaleRate: number;
}

interface Alert {
  id: string;
  metricType: string;
  actualValue: number;
  thresholdValue: number;
  triggeredAt: string;
  acknowledgedAt?: string;
  notes?: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Set default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Fetch clients if admin
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetch('/api/admin/clients')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setClients(data.data);
            if (data.data.length > 0) {
              setSelectedClientId(data.data[0].id);
            }
          }
        })
        .catch((err) => console.error('Error fetching clients:', err));
    }
  }, [session]);

  // Fetch metrics and alerts
  useEffect(() => {
    if (!session) return;

    const clientId = selectedClientId || session.user?.clientId;
    if (!clientId) {
      setError('No client selected');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (session.user?.role === 'ADMIN') {
      params.append('client_id', clientId);
    }
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    // Fetch metrics
    fetch(`/api/metrics?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMetrics(data.data || []);
        } else {
          setError(data.error || 'Failed to fetch metrics');
        }
      })
      .catch((err) => {
        setError(err.message);
        console.error('Error fetching metrics:', err);
      });

    // Fetch alerts for admin
    if (session.user?.role === 'ADMIN') {
      fetch(`/api/admin/coaching-alerts?client_id=${clientId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAlerts(data.data || []);
          }
        })
        .catch((err) => console.error('Error fetching alerts:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session, selectedClientId, startDate, endDate]);

  // Calculate KPI metrics from data
  const calculateKPIs = () => {
    if (metrics.length === 0) {
      return {
        totalLeads: 0,
        totalConsults: 0,
        totalSales: 0,
        avgROAS: 0,
      };
    }

    const totalLeads = metrics.reduce((sum, m) => sum + m.leads, 0);
    const totalConsults = metrics.reduce((sum, m) => sum + m.consults, 0);
    const totalSales = metrics.reduce((sum, m) => sum + m.sales, 0);
    const avgROAS = metrics.reduce((sum, m) => sum + m.roas, 0) / metrics.length;

    return {
      totalLeads,
      totalConsults,
      totalSales,
      avgROAS: avgROAS || 0,
    };
  };

  const kpis = calculateKPIs();

  // Handle alert acknowledgement
  const handleAcknowledgeAlert = async (alertId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/coaching-alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        // Refresh alerts
        const clientId = selectedClientId || session?.user?.clientId;
        if (clientId) {
          const data = await fetch(`/api/admin/coaching-alerts?client_id=${clientId}`).then((r) =>
            r.json()
          );
          if (data.success) {
            setAlerts(data.data || []);
          }
        }
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  };

  if (!session) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">View your consulting metrics</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {session.user?.role === 'ADMIN' && clients.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {clients.map((client: any) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Metrics Display */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-slate-600">Loading metrics...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {/* KPI Cards */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Total Leads"
                value={kpis.totalLeads}
                icon={<span className="text-2xl">📊</span>}
              />
              <KPICard
                label="Total Consults"
                value={kpis.totalConsults}
                icon={<span className="text-2xl">📞</span>}
              />
              <KPICard
                label="Total Sales"
                value={kpis.totalSales}
                icon={<span className="text-2xl">💰</span>}
              />
              <KPICard
                label="Avg ROAS"
                value={kpis.avgROAS.toFixed(2)}
                icon={<span className="text-2xl">📈</span>}
              />
            </div>
          )}

          {/* Coaching Alerts (Admin Only) */}
          {session?.user?.role === 'ADMIN' && alerts.length > 0 && (
            <div>
              <h2 className="font-semibold text-slate-900 mb-4">Coaching Alerts</h2>
              <CoachingAlerts alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />
            </div>
          )}

          {/* Charts */}
          {metrics.length > 0 && (
            <div>
              <h2 className="font-semibold text-slate-900 mb-4">Visualizations</h2>
              <MetricsCharts metrics={metrics} />
            </div>
          )}

          {/* Detailed Metrics Table */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Detailed Metrics</h2>

            {metrics.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No metrics found for selected period</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-4 font-semibold text-slate-900">Date</th>
                      <th className="text-left py-2 px-4 font-semibold text-slate-900">Medium</th>
                      <th className="text-left py-2 px-4 font-semibold text-slate-900">Source</th>
                      <th className="text-right py-2 px-4 font-semibold text-slate-900">Leads</th>
                      <th className="text-right py-2 px-4 font-semibold text-slate-900">Consults</th>
                      <th className="text-right py-2 px-4 font-semibold text-slate-900">Sales</th>
                      <th className="text-right py-2 px-4 font-semibold text-slate-900">Spend</th>
                      <th className="text-right py-2 px-4 font-semibold text-slate-900">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((metric, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-900">
                          {new Date(metric.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{metric.medium || '-'}</td>
                        <td className="py-3 px-4 text-slate-600">{metric.source || '-'}</td>
                        <td className="py-3 px-4 text-right text-slate-900 font-medium">{metric.leads}</td>
                        <td className="py-3 px-4 text-right text-slate-900 font-medium">{metric.consults}</td>
                        <td className="py-3 px-4 text-right text-slate-900 font-medium">{metric.sales}</td>
                        <td className="py-3 px-4 text-right text-slate-900 font-medium">
                          ${parseFloat(metric.spend.toString()).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-900 font-medium">
                          {parseFloat(metric.roas.toString()).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
