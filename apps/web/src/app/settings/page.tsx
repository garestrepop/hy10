'use client';

import { useEffect, useState } from 'react';
import { settingsApi, Settings, UpdateSettingsDto } from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.get();
      setSettings(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('No tienes permiso para ver la configuración. Solo los Administradores pueden acceder.');
      } else {
        setError('Error al cargar la configuración');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData(e.currentTarget);
      const updateData: UpdateSettingsDto = {
        timezone: formData.get('timezone') as string,
        model_identifier: formData.get('model_identifier') as string || null,
        conversation_session_ttl_minutes: parseInt(formData.get('conversation_session_ttl_minutes') as string),
        handoff_ambiguity_attempts: parseInt(formData.get('handoff_ambiguity_attempts') as string),
        staff_upcoming_notice_minutes: parseInt(formData.get('staff_upcoming_notice_minutes') as string),
        voice_note_max_seconds: parseInt(formData.get('voice_note_max_seconds') as string),
        allow_cancel: formData.get('allow_cancel') === 'on',
        allow_reschedule: formData.get('allow_reschedule') === 'on',
        cancel_min_hours: formData.get('cancel_min_hours') ? parseInt(formData.get('cancel_min_hours') as string) : null,
        reschedule_min_hours: formData.get('reschedule_min_hours') ? parseInt(formData.get('reschedule_min_hours') as string) : null,
        max_reschedules: formData.get('max_reschedules') ? parseInt(formData.get('max_reschedules') as string) : null,
      };

      const updated = await settingsApi.update(updateData);
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('No tienes permiso para modificar la configuración. Solo los Administradores pueden hacerlo.');
      } else {
        setError(err.response?.data?.message || 'Error al guardar la configuración');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Configuración del Negocio</h1>
            <p className="mt-1 text-sm text-gray-600">
              Configura los parámetros operativos de tu negocio
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                Configuración guardada exitosamente. Los cambios han sido auditados.
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">General</h2>
              
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                  Zona Horaria
                </label>
                <input
                  type="text"
                  id="timezone"
                  name="timezone"
                  defaultValue={settings.timezone}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="model_identifier" className="block text-sm font-medium text-gray-700">
                  Identificador del Modelo LLM
                </label>
                <input
                  type="text"
                  id="model_identifier"
                  name="model_identifier"
                  defaultValue={settings.model_identifier || ''}
                  placeholder="ej: gpt-4, claude-3-opus"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  La clave del proveedor no se muestra por seguridad
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Tiempos de Conversación</h2>
              
              <div>
                <label htmlFor="conversation_session_ttl_minutes" className="block text-sm font-medium text-gray-700">
                  TTL de Sesión (minutos)
                </label>
                <input
                  type="number"
                  id="conversation_session_ttl_minutes"
                  name="conversation_session_ttl_minutes"
                  defaultValue={settings.conversation_session_ttl_minutes}
                  min="1"
                  max="1440"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="handoff_ambiguity_attempts" className="block text-sm font-medium text-gray-700">
                  Umbral de Handoff (intentos)
                </label>
                <input
                  type="number"
                  id="handoff_ambiguity_attempts"
                  name="handoff_ambiguity_attempts"
                  defaultValue={settings.handoff_ambiguity_attempts}
                  min="1"
                  max="10"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="staff_upcoming_notice_minutes" className="block text-sm font-medium text-gray-700">
                  Aviso al Staff (minutos antes)
                </label>
                <input
                  type="number"
                  id="staff_upcoming_notice_minutes"
                  name="staff_upcoming_notice_minutes"
                  defaultValue={settings.staff_upcoming_notice_minutes}
                  min="0"
                  max="1440"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="voice_note_max_seconds" className="block text-sm font-medium text-gray-700">
                  Duración Máxima de Nota de Voz (segundos)
                </label>
                <input
                  type="number"
                  id="voice_note_max_seconds"
                  name="voice_note_max_seconds"
                  defaultValue={settings.voice_note_max_seconds}
                  min="10"
                  max="300"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Políticas</h2>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allow_cancel"
                  name="allow_cancel"
                  defaultChecked={settings.allow_cancel}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allow_cancel" className="ml-2 block text-sm text-gray-700">
                  Permitir cancelación
                </label>
              </div>

              <div>
                <label htmlFor="cancel_min_hours" className="block text-sm font-medium text-gray-700">
                  Horas mínimas para cancelar
                </label>
                <input
                  type="number"
                  id="cancel_min_hours"
                  name="cancel_min_hours"
                  defaultValue={settings.cancel_min_hours || ''}
                  min="0"
                  placeholder="Dejar vacío para usar valor global"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allow_reschedule"
                  name="allow_reschedule"
                  defaultChecked={settings.allow_reschedule}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allow_reschedule" className="ml-2 block text-sm text-gray-700">
                  Permitir reprogramación
                </label>
              </div>

              <div>
                <label htmlFor="reschedule_min_hours" className="block text-sm font-medium text-gray-700">
                  Horas mínimas para reprogramar
                </label>
                <input
                  type="number"
                  id="reschedule_min_hours"
                  name="reschedule_min_hours"
                  defaultValue={settings.reschedule_min_hours || ''}
                  min="0"
                  placeholder="Dejar vacío para usar valor global"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="max_reschedules" className="block text-sm font-medium text-gray-700">
                  Máximo de reprogramaciones
                </label>
                <input
                  type="number"
                  id="max_reschedules"
                  name="max_reschedules"
                  defaultValue={settings.max_reschedules || ''}
                  min="0"
                  placeholder="Dejar vacío para usar valor global"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
