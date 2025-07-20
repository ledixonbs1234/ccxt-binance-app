import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Temporarily disable middleware to avoid Redis import issues in Edge Runtime
// The queue system will be initialized on first API call instead

export async function middleware(request: NextRequest) {
  // Skip initialization in middleware due to Edge Runtime compatibility issues
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
