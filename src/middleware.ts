import { NextRequest, NextResponse } from 'next/server';
import { hash2 } from './utils/Utils';

export const config = {
  matcher: ['/', '/index'],
}

// https://github.com/vercel/examples/blob/main/edge-functions/basic-auth-password/middleware.ts
export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // clear in chrome://settings/passwords
    if (hash2(user) === -877169473 && hash2(pwd) === -1361217365) {
      return NextResponse.next();
    }
  }

  url.pathname = '/api/auth';

  return NextResponse.rewrite(url);
}