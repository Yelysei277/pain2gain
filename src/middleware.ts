import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/db-types';
import { NextResponse, type NextRequest } from 'next/server';

function buildRedirectUrl(request: NextRequest): URL {
  const redirectUrl = new URL('/auth', request.url);
  const returnPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  redirectUrl.searchParams.set('redirect', returnPath || '/');
  return redirectUrl;
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.redirect(buildRedirectUrl(request));
  }

  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value;
      },
      set(name, value, options) {
        response.cookies.set(name, value, options);
      },
      remove(name, options) {
        response.cookies.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.redirect(buildRedirectUrl(request));
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/app/:path*',
    '/api/ideas/:path*',
    '/api/generate/:path*',
    '/api/subscriptions/:path*',
    '/api/notifications/:path*',
  ],
};

