import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const trimmedQuery = q.trim();

    if (trimmedQuery.length < 3) {
      return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
    }

    const apiKey = process.env.LOCATIONIQ_API_KEY;
    const baseUrl = process.env.LOCATIONIQ_FORWARD_URL;

    if (!apiKey || !baseUrl) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const targetUrl = new URL(baseUrl);
    targetUrl.searchParams.append('key', apiKey);
    targetUrl.searchParams.append('q', trimmedQuery);
    targetUrl.searchParams.append('format', 'json');
    targetUrl.searchParams.append('countrycodes', 'id');
    targetUrl.searchParams.append('accept-language', 'id');
    targetUrl.searchParams.append('addressdetails', '1');
    targetUrl.searchParams.append('normalizeaddress', '1');
    targetUrl.searchParams.append('limit', '5');

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
    
    if (!Array.isArray(data)) {
       return NextResponse.json({ error: 'Invalid data received' }, { status: 500 });
    }

    const sanitizedOutput = data.map((item: any) => ({
      placeId: item.place_id,
      displayName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon)
    })).filter((item: any) => !isNaN(item.latitude) && !isNaN(item.longitude));

    return NextResponse.json(sanitizedOutput);

  } catch (err) {
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
