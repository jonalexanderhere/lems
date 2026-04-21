import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (err) {
    console.error("Middleware Auth Error:", err);
  }

  const pathname = request.nextUrl.pathname;

  // Protect all /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Fetch role for authorized routes
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'student'

    // Admin protecting
    if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(role === 'teacher' ? '/dashboard/teacher' : '/dashboard', request.url))
    }

    // Teacher protecting
    if (pathname.startsWith('/dashboard/teacher') && role !== 'teacher' && role !== 'admin') {
      return NextResponse.redirect(new URL(role === 'admin' ? '/dashboard/admin' : '/dashboard', request.url))
    }
    
    // Ensure admin/teacher don't stay on student dashboard root if they navigate to /dashboard
    if (pathname === '/dashboard') {
       if (role === 'admin') return NextResponse.redirect(new URL('/dashboard/admin', request.url));
       if (role === 'teacher') return NextResponse.redirect(new URL('/dashboard/teacher', request.url));
    }
  }

  // Redirect if logged in and trying to access login/signup
  if ((pathname === '/login' || pathname === '/signup') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'student'
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url))
    }
    if (role === 'teacher') {
      return NextResponse.redirect(new URL('/dashboard/teacher', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
}
