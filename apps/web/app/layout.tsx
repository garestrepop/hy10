import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'hy10 - Admin Dashboard',
  description: 'Sistema de gestión de citas y agendas',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-100">
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <a href="/" className="text-xl font-bold text-gray-900">
                    hy10
                  </a>
                </div>
                <div className="ml-6 flex space-x-8">
                  <a
                    href="/dashboard"
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/schedules"
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  >
                    Agendas
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
