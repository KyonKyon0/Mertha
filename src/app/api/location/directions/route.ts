import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromLat = searchParams.get('fromLat');
    const fromLon = searchParams.get('fromLon');
    const toLat = searchParams.get('toLat');
    const toLon = searchParams.get('toLon');

    if (!fromLat || !fromLon || !toLat || !toLon) {
      return NextResponse.json({ error: 'fromLat, fromLon, toLat, and toLon are required' }, { status: 400 });
    }

    const apiKey = process.env.LOCATIONIQ_API_KEY;
    const baseUrl = process.env.LOCATIONIQ_DIRECTIONS_URL;

    if (!apiKey || !baseUrl) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const coordinates = `${fromLon},${fromLat};${toLon},${toLat}`;
    const targetUrl = new URL(`${baseUrl}/driving/${coordinates}`);
    targetUrl.searchParams.append('key', apiKey);
    targetUrl.searchParams.append('steps', 'true');
    targetUrl.searchParams.append('alternatives', 'true');
    targetUrl.searchParams.append('geometries', 'geojson');
    targetUrl.searchParams.append('overview', 'full');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const onAbort = () => controller.abort();
    request.signal.addEventListener('abort', onAbort);

    let response;
    try {
      response = await fetch(targetUrl.toString(), {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      request.signal.removeEventListener('abort', onAbort);
      
      if (request.signal.aborted) {
        return new Response(null, { status: 204 });
      }
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
      }
      return NextResponse.json({ error: 'Network error occurred' }, { status: 502 });
    }

    clearTimeout(timeoutId);
    request.signal.removeEventListener('abort', onAbort);

    if (request.signal.aborted) {
      return new Response(null, { status: 204 });
    }

    if (response.status === 429) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch directions' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (err) {
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
