import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Escape rápido para arquivos estáticos
  if (request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname === '/favicon.ico') {
    return supabaseResponse
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Se as variáveis não existirem na Vercel, deixa passar para não derrubar o site
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase env vars missing in middleware!");
      return supabaseResponse
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    // getSession() apenas lê o cookie local (não faz requisição de rede, evitando timeout na Vercel)
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    const path = request.nextUrl.pathname
    const isAuthPage = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/recuperar-senha')

    if (!user && !isAuthPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && isAuthPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Coloque seu e-mail de admin aqui
    const ADMIN_EMAIL = "seu-email-admin@gmail.com"
    if (path.startsWith('/admin') && user?.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/', request.url))
    }

  } catch (error) {
    console.error('Middleware Error:', error)
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
