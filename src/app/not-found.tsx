import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Image
          src="/logos/Triada-logo-mono-green.png"
          alt="Triada Logo"
          width={200}
          height={67}
          className="mx-auto mb-8"
        />
        
        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-[#a4c639]/20">
          <h1 className="text-6xl font-bold text-[#a4c639] mb-4">404</h1>
          <h2 className="text-2xl font-bold text-[#1a5744] mb-4">
            Página no encontrada
          </h2>
          <p className="text-gray-600 mb-6">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
          
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full bg-[#a4c639] text-white py-3 px-6 rounded-2xl font-bold hover:bg-[#8fb030] transition-colors"
            >
              Volver al inicio
            </Link>
            <Link
              href="/courses"
              className="block w-full bg-[#1a5744] text-white py-3 px-6 rounded-2xl font-bold hover:bg-[#134233] transition-colors"
            >
              Ver cursos
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
