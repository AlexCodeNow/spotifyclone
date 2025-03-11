import { NextRequest, NextResponse } from 'next/server';
import queryString from 'query-string';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }
  
  try {
    const tokenResponse = await exchangeCodeForTokens(code);
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }
    
    const tokens = await tokenResponse.json();
    
    const redirectUrl = new URL('/auth/callback', new URL(request.url).origin);
    redirectUrl.search = queryString.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
    });
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error during authentication:', error);
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }
}

async function exchangeCodeForTokens(code: string) {
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
  
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing required environment variables');
  }
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirectUri);
  
  return fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: params,
  });
}