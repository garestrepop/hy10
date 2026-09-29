'use client';

import { useState } from 'react';
import {
  StaffSchedule,
  StaffScheduleBlock,
  StaffException,
} from '@/lib/api-client';

const DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

interface ScheduleEditorProps {
  schedule: StaffSchedule;
  onSave: (blocks: Omit<StaffScheduleBlock, 'id' | 'staff_id'>[]) => void;
  onAddException: (exception: {
    date: string;
    start_time: string;
    end_time: string;
    type: 'block' | 'opening';
    reason?: string;
  }) => void;
  onCancel: () => void;
}

export function ScheduleEditor({
  schedule,
  onSave,
  onAddException,
  onCancel,
}: ScheduleEditorProps) {
  const [blocks, setBlocks] = useState<
    Omit<StaffScheduleBlock, 'id' | 'staff_id'>[]
  >(
    schedule.blocks.map((b) => ({
      day_of_week: b.day_of_week,
      start_time: b.start_time,
      end_time: b.end_time,
    })),
  );

  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exceptionForm, setExceptionForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    type: 'block' as 'block' | 'opening',
    reason: '',
  });

  const staffName =
    schedule.staff.first_name && schedule.staff.last_name
      ? `${schedule.staff.first_name} ${schedule.staff.last_name}`
      : schedule.staff.email;

  function addBlock() {
    setBlocks([
      ...blocks,
      {
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
      },
    ]);
  }

  function removeBlock(index: number) {
    setBlocks(blocks.filter((_, i) => i !== index));
  }

  function updateBlock(
    index: number,
    field: keyof Omit<StaffScheduleBlock, 'id' | 'staff_id'>,
    value: string | number,
  ) {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], [field]: value };
    setBlocks(newBlocks);
  }

  function handleSubmitException(e: React.FormEvent) {
    e.preventDefault();
    onAddException(exceptionForm);
    setExceptionForm({
      date: '',
      start_time: '',
      end_time: '',
      type: 'block',
      reason: '',
    });
    setShowExceptionForm(false);
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Editar Agenda: {staffName}</h2>
      </div>

      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Bloques Semanales</h3>
            <button
              onClick={addBlock}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Agregar Bloque
            </button>
          </div>

          <div className="space-y-3">
            {blocks.map((block, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded"
              >
                <select
                  value={block.day_of_week}
                  onChange={(e) =>
                    updateBlock(index, 'day_of_week', Number(e.target.value))
                  }
                  className="border rounded px-3 py-2"
                >
                  {DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  value={block.start_time}
                  onChange={(e) =>
                    updateBlock(index, 'start_time', e.target.value)
                  }
                  className="border rounded px-3 py-2"
                />

                <span className="text-gray-600">a</span>

                <input
                  type="time"
                  value={block.end_time}
                  onChange={(e) =>
                    updateBlock(index, 'end_time', e.target.value)
                  }
                  className="border rounded px-3 py-2"
                />

                <button
                  onClick={() => removeBlock(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>
            ))}

            {blocks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay bloques configurados. Haz clic en "Agregar Bloque" para
                comenzar.
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Excepciones</h3>
            <button
              onClick={() => setShowExceptionForm(!showExceptionForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {showExceptionForm ? 'Cancelar' : '+ Agregar Excepción'}
            </button>
          </div>

          {showExceptionForm && (
            <form
              onSubmit={handleSubmitException}
              className="mb-4 p-4 bg-gray-50 rounded space-y-3"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={exceptionForm.date}
                  onChange={(e) =>
                    setExceptionForm({ ...exceptionForm, date: e.target.value })
                  }
                  className="border rounded px-3 py-2 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    required
                    value={exceptionForm.start_time}
                    onChange={(e) =>
                      setExceptionForm({
                        ...exceptionForm,
                        start_time: e.target.value,
                      })
                    }
                    className="border rounded px-3 py-2 w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    required
                    value={exceptionForm.end_time}
                    onChange={(e) =>
                      setExceptionForm({
                        ...exceptionForm,
                        end_time: e.target.value,
                      })
                    }
                    className="border rounded px-3 py-2 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={exceptionForm.type}
                  onChange={(e) =>
                    setExceptionForm({
                      ...exceptionForm,
                      type: e.target.value as 'block' | 'opening',
                    })
                  }
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="block">Bloqueo (No disponible)</option>
                  <option value="opening">Apertura (Disponible extra)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Razón (opcional)
                </label>
                <input
                  type="text"
                  value={exceptionForm.reason}
                  onChange={(e) =>
                    setExceptionForm({
                      ...exceptionForm,
                      reason: e.target.value,
                    })
                  }
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Ej: Vacaciones, Emergencia, etc."
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar Excepción
              </button>
            </form>
          )}

          <div className="space-y-2">
            {schedule.exceptions.map((exception) => (
              <div
                key={exception.id}
                className="p-4 bg-gray-50 rounded flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">
                    {exception.date} | {exception.start_time} -{' '}
                    {exception.end_time}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span
                      className={
                        exception.type === 'block'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }
                    >
                      {exception.type === 'block' ? 'Bloqueo' : 'Apertura'}
                    </span>
                    {exception.reason && ` - ${exception.reason}`}
                  </div>
                </div>
              </div>
            ))}

            {schedule.exceptions.length === 0 && !showExceptionForm && (
              <div className="text-center py-4 text-gray-500">
                No hay excepciones configuradas
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => onSave(blocks)}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Guardar Cambios
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
