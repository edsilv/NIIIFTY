import { NextRequest, NextResponse } from 'next/server';
import { hash } from './utils/Utils';

export const config = {
  matcher: ['/', '/index'],
}

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // clear in chrome://settings/passwords
    if (hash(user) === -877169473 && hash(pwd) === -1361217365) {
      return NextResponse.next();
    }
  }

  url.pathname = '/api/auth';

  return NextResponse.rewrite(url);
}