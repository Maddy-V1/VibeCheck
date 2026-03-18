import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ reachable: false })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'VibeCheck-URLValidator/1.0',
        },
      })

      clearTimeout(timeoutId)

      return NextResponse.json({
        reachable: response.ok,
        status: response.status,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      return NextResponse.json({ reachable: false })
    }
  } catch (error) {
    return NextResponse.json({ reachable: false })
  }
}
