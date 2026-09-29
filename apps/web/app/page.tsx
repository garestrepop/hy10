export default function Home() {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-4">Bienvenido a hy10</h1>
        <p className="text-gray-600 mb-6">
          Sistema de gestión de citas, agendas y cobros para tu negocio.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="/dashboard"
            className="block p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          >
            <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
            <p className="text-gray-600">
              Ve la ocupación del negocio y métricas de rendimiento
            </p>
          </a>
          
          <a
            href="/schedules"
            className="block p-6 bg-green-50 rounded-lg hover:bg-green-100 transition"
          >
            <h2 className="text-xl font-semibold mb-2">Agendas</h2>
            <p className="text-gray-600">
              Gestiona la disponibilidad y horarios del staff
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
