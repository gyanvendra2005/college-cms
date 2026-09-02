import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';

interface DashboardMetrics {
  totalRevenue: number;
  activeCustomers: number;
  lowStockCount: number;
  draftChallans: number;
}

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await dashboardService.getMetrics();
        setMetrics(res.data.metrics);
      } catch (error) {
        console.error('Failed to fetch dashboard metrics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return <div className="p-6 text-slate-500">Loading live data from Neon DB...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-slate-900">
            ${metrics?.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Active Customers</h3>
          <p className="text-2xl font-bold text-slate-900">{metrics?.activeCustomers || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Low Stock Alerts</h3>
          <p className="text-2xl font-bold text-red-600">{metrics?.lowStockCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Pending Challans</h3>
          <p className="text-2xl font-bold text-amber-600">{metrics?.draftChallans || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Operations Overview</h2>
        <p className="text-slate-600 mb-4">
          Review daily performance metrics, track inventory thresholds, and manage recent sales challans from this dashboard. Ensure all pending drafts are reviewed before end of day.
        </p>
      </div>
    </div>
  );
};
