import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
    }

    const apiKey = process.env.LOCATIONIQ_API_KEY;
    const baseUrl = process.env.LOCATIONIQ_REVERSE_URL;

    if (!apiKey || !baseUrl) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const targetUrl = new URL(baseUrl);
    targetUrl.searchParams.append('key', apiKey);
    targetUrl.searchParams.append('lat', lat);
    targetUrl.searchParams.append('lon', lon);
    targetUrl.searchParams.append('format', 'json');
    targetUrl.searchParams.append('accept-language', 'id');
    targetUrl.searchParams.append('addressdetails', '1');
    targetUrl.searchParams.append('normalizeaddress', '1');

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
      return NextResponse.json({ error: 'Failed to fetch location data' }, { status: 502 });
    }

    const data = await response.json();
    
    if (data.error) {
       return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({
      placeId: data.place_id,
      displayName: data.display_name,
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon)
    });

  } catch (err) {
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
