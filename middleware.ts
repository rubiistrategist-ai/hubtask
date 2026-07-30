import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_EMAIL = "rubiistrategist@gmail.com"; // Coloque seu e-mail real aqui

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  try {
    // Verifica se as variáveis de ambiente existem para evitar crash
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase env variables");
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      }
    )

    // Tenta buscar a sessão
    const { data: { session } } = await supabase.auth.getSession()

    const path = request.nextUrl.pathname

    // Se não estiver logado e tentar acessar uma página protegida
    if (!session && !path.startsWith('/login') && !path.startsWith('/recuperar-senha') && !path.startsWith('/signup')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Se estiver logado e tentar ir para o login, manda para a home
    if (session && (path.startsWith('/login') || path.startsWith('/signup'))) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // SEGURANÇA ADMIN: Bloqueia acesso não autorizado
    if (path.startsWith('/admin') && session?.user?.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/', request.url))
    }

  } catch (error) {
    // Se algo der errado (ex: Supabase fora do ar), deixa a página carregar 
    // para não dar tela branca 500.
    console.error('Middleware error:', error)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
