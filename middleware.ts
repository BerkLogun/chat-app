import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the token from cookies
  const token = request.cookies.get('auth-storage')?.value;
  
  // Parse auth data from the cookie if it exists
  const authData = token ? JSON.parse(decodeURIComponent(token)) : null;
  const isAuthenticated = authData?.state?.isAuthenticated || false;
  
  // Define public routes that don't require authentication
  const isPublicRoute = 
    request.nextUrl.pathname.startsWith('/auth') || 
    request.nextUrl.pathname === '/';
  
  // Redirect logic
  if (!isAuthenticated && !isPublicRoute) {
    // Redirect to login if accessing protected route without authentication
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  if (isAuthenticated && request.nextUrl.pathname.startsWith('/auth')) {
    // Redirect to chat if authenticated user tries to access auth pages
    return NextResponse.redirect(new URL('/chat', request.url));
  }
  
  return NextResponse.next();
}

// Configure which routes should be handled by the middleware
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 