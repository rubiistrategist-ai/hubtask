import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Coloque o MESMO e-mail admin que você colocou na página /admin
const ADMIN_EMAIL = "rubiistrategist@gmail.com"; // <-- Mude para o SEU e-mail

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const path = request.nextUrl.pathname

  // Se não estiver logado e tentar acessar uma página protegida
  if (!session && !path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se estiver logado e tentar ir para o login, manda para a home
  if (session && path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // SEGURANÇA ADMIN: Se tentar acessar /admin e não for o e-mail admin, joga pra Home
  if (path.startsWith('/admin') && session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}