'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

interface Metric {
  date: string;
  leads: number;
  consults: number;
  sales: number;
  spend: number;
  roas: number;
  [key: string]: any;
}

interface MetricsChartsProps {
  metrics: Metric[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function MetricsCharts({ metrics }: MetricsChartsProps) {
  // Group metrics by date for trend line
  const trendData = metrics.reduce((acc: any[], metric) => {
    const existing = acc.find((m) => m.date === metric.date);
    if (existing) {
      existing.leads += metric.leads;
      existing.consults += metric.consults;
      existing.sales += metric.sales;
      existing.spend += Number(metric.spend);
      existing.roas = existing.spend > 0 ? (existing.sales / existing.spend) : 0;
    } else {
      acc.push({
        date: new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        leads: metric.leads,
        consults: metric.consults,
        sales: metric.sales,
        spend: Number(metric.spend),
        roas: metric.roas,
      });
    }
    return acc;
  }, []);

  // Calculate funnel data (aggregate metrics)
  const totalLeads = metrics.reduce((sum, m) => sum + m.leads, 0);
  const totalConsults = metrics.reduce((sum, m) => sum + m.consults, 0);
  const totalSales = metrics.reduce((sum, m) => sum + m.sales, 0);

  const funnelData = [
    { name: 'Leads', value: totalLeads, percentage: 100 },
    {
      name: 'Consults',
      value: totalConsults,
      percentage: totalLeads > 0 ? ((totalConsults / totalLeads) * 100).toFixed(1) : 0,
    },
    {
      name: 'Sales',
      value: totalSales,
      percentage: totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : 0,
    },
  ];

  // Calculate spend by medium
  const spendByMedium = metrics.reduce((acc: any, metric) => {
    const medium = metric.medium || 'Unknown';
    const existing = acc.find((m: any) => m.name === medium);
    if (existing) {
      existing.value += Number(metric.spend);
    } else {
      acc.push({ name: medium, value: Number(metric.spend) });
    }
    return acc;
  }, []);

  if (metrics.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-slate-600">
          No data available for selected period
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* ROAS Trend Line */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">ROAS Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}
              formatter={(value: any) => value.toFixed(2)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="roas"
              stroke="#3B82F6"
              dot={{ fill: '#3B82F6' }}
              name="ROAS"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel Chart (Leads → Consults → Sales) */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Conversion Funnel</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={funnelData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}
              formatter={(value: any) => [value, 'Count']}
            />
            <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]}>
              {funnelData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {funnelData.map((item, idx) => (
            <div key={idx} className="text-center">
              <p className="text-sm font-medium text-slate-600">{item.name}</p>
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="text-xs text-slate-500 mt-1">{item.percentage}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spend by Medium (Pie Chart) */}
      {spendByMedium.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Spend by Medium</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={spendByMedium}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }: any) => `${name}: $${value.toFixed(0)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {spendByMedium.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {spendByMedium.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></div>
                  <span className="text-sm font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
