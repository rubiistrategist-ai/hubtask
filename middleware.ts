import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_EMAIL = "rubiistrategist@gmail.com" // Coloque seu e-mail real aqui

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  try {
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
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      }
    )

    // getUser() é mais seguro e evita crashes na Vercel
    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // Se não estiver logado e tentar acessar uma página protegida
    if (!user && !path.startsWith('/login') && !path.startsWith('/signup') && !path.startsWith('/recuperar-senha')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Se estiver logado e tentar ir para o login, manda para a home
    if (user && (path.startsWith('/login') || path.startsWith('/signup'))) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // SEGURANÇA ADMIN: Bloqueia acesso não autorizado
    if (path.startsWith('/admin') && user?.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/', request.url))
    }

  } catch (e) {
    console.error('Middleware Error:', e)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
