import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    const response = await refreshAccessToken(refreshToken);
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'Failed to refresh token', details: errorData },
        { status: response.status }
      );
    }
    
    const tokenData = await response.json();
    return NextResponse.json(tokenData);
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing required environment variables');
  }
  
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  
  return fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: params,
  });
}