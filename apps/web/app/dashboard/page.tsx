'use client';

import { useEffect, useState } from 'react';
import { apiClient, OccupancyData } from '@/lib/api-client';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function DashboardPage() {
  const [occupancy, setOccupancy] = useState<OccupancyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOccupancy();
  }, []);

  async function loadOccupancy() {
    try {
      setLoading(true);
      setError(null);
      
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      const endDate = today;

      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const data = await apiClient.getOccupancy(start, end);
      setOccupancy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load occupancy data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error loading dashboard</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadOccupancy}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!occupancy) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard de Ocupación</h1>
        <p className="text-gray-600">
          Período: {occupancy.start_date} - {occupancy.end_date}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Citas</div>
          <div className="text-3xl font-bold">{occupancy.total_appointments}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Ingresos Totales</div>
          <div className="text-3xl font-bold">
            {formatCurrency(occupancy.total_revenue)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Staff Activo</div>
          <div className="text-3xl font-bold">
            {occupancy.staff_occupancy.length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Ocupación por Staff</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Citas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Próximas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas Totales
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {occupancy.staff_occupancy.map((staff) => (
                <tr key={staff.staff_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{staff.staff_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {staff.total_appointments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {staff.upcoming_appointments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {staff.completed_appointments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {staff.total_hours.toFixed(1)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {occupancy.staff_occupancy.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No hay datos de staff activo
          </div>
        )}
      </div>
    </div>
  );
}
