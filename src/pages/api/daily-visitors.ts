import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const serverUrl = import.meta.env.PUBLIC_UMAMI_SERVER_URL;
  const websiteId = import.meta.env.PUBLIC_UMAMI_WEBSITE_ID;
  const username = import.meta.env.UMAMI_USERNAME;
  const password = import.meta.env.UMAMI_PASSWORD;

  if (!serverUrl || !websiteId || !username || !password) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Authenticate with Umami to get a fresh JWT token
    const loginRes = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!loginRes.ok) {
      console.error('Umami Auth Failed:', loginRes.status, await loginRes.text());
      return new Response(JSON.stringify({ error: 'Failed to authenticate with Umami' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { token } = await loginRes.json();

    // 2. Calculate start and end of day timestamps
    // const now = new Date();
    // const startAt = startOfDay.getTime();
    // const endAt = now.getTime();
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startAt = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const endAt = now.getTime();

    // 3. Fetch visitor stats using the dynamic Bearer token
    const statsRes = await fetch(
      `${serverUrl}/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!statsRes.ok) {
      console.error('Umami Stats Fetch Failed:', statsRes.status, await statsRes.text());
      return new Response(JSON.stringify({ error: 'Failed to fetch stats from Umami' }), {
        status: statsRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const statsData = await statsRes.json();
    console.log(statsData);

    return new Response(
      JSON.stringify({ visitors: statsData.visitors ?? 0 }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Cache the response on Netlify CDN for 60 seconds to avoid spamming logins
          'Cache-Control': 'public, max-age=60, s-maxage=60',
        },
      }
    );
  } catch (e) {
    console.error('Umami Proxy Error:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};