'use client';

import { useEffect, useState } from 'react';
import {
  apiClient,
  StaffSchedule,
  StaffScheduleBlock,
  StaffException,
} from '@/lib/api-client';
import { ScheduleEditor } from '@/components/schedule-editor';

const DAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  async function loadSchedules() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getAllStaffSchedules();
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSchedule(
    staffId: string,
    blocks: Omit<StaffScheduleBlock, 'id' | 'staff_id'>[],
  ) {
    try {
      await apiClient.replaceStaffSchedule(staffId, blocks);
      await loadSchedules();
      setSelectedStaff(null);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Failed to save schedule',
      );
    }
  }

  async function handleAddException(
    staffId: string,
    exception: {
      date: string;
      start_time: string;
      end_time: string;
      type: 'block' | 'opening';
      reason?: string;
    },
  ) {
    try {
      await apiClient.addException({ staff_id: staffId, ...exception });
      await loadSchedules();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Failed to add exception',
      );
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading schedules...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">
            Error loading schedules
          </h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadSchedules}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const selectedSchedule = schedules.find((s) => s.staff.id === selectedStaff);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Agendas del Staff</h1>
        <p className="text-gray-600">
          Gestiona la disponibilidad y excepciones de cada miembro del equipo
        </p>
      </div>

      {selectedSchedule ? (
        <div>
          <button
            onClick={() => setSelectedStaff(null)}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Volver a la lista
          </button>

          <ScheduleEditor
            schedule={selectedSchedule}
            onSave={(blocks) =>
              handleSaveSchedule(selectedSchedule.staff.id, blocks)
            }
            onAddException={(exception) =>
              handleAddException(selectedSchedule.staff.id, exception)
            }
            onCancel={() => setSelectedStaff(null)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => {
            const staffName =
              schedule.staff.first_name && schedule.staff.last_name
                ? `${schedule.staff.first_name} ${schedule.staff.last_name}`
                : schedule.staff.email;

            const blocksByDay = schedule.blocks.reduce(
              (acc, block) => {
                if (!acc[block.day_of_week]) {
                  acc[block.day_of_week] = [];
                }
                acc[block.day_of_week].push(block);
                return acc;
              },
              {} as Record<number, StaffScheduleBlock[]>,
            );

            return (
              <div
                key={schedule.staff.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{staffName}</h3>
                    {!schedule.staff.is_active && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                        Inactivo
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-sm font-medium text-gray-700">
                      Bloques semanales:
                    </div>
                    {Object.keys(blocksByDay).length === 0 ? (
                      <div className="text-sm text-gray-500">
                        Sin bloques configurados
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(blocksByDay)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([day, blocks]) => (
                            <div key={day} className="text-sm">
                              <span className="font-medium">
                                {DAYS[Number(day)]}:
                              </span>{' '}
                              {blocks
                                .map(
                                  (b) => `${b.start_time}-${b.end_time}`,
                                )
                                .join(', ')}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-sm font-medium text-gray-700">
                      Excepciones activas:
                    </div>
                    {schedule.exceptions.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        Sin excepciones
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {schedule.exceptions.length} excepción(es)
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedStaff(schedule.staff.id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Editar Agenda
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {schedules.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No hay staff activo configurado
        </div>
      )}
    </div>
  );
}
