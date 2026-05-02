import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares', {
      next: { revalidate: 900 }, // Cache for 15 minutes
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'No se pudo obtener la tasa de cambio' },
      { status: 503 }
    )
  }
}
