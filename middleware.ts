import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/recuperar-senha')

  // O Supabase salva os cookies de sessão começando com 'sb-'
  const hasSupabaseSession = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

  // 1. Se não tem sessão e tenta acessar página protegida -> Manda pro login
  if (!hasSupabaseSession && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Se tem sessão e tenta acessar páginas de login/cadastro -> Manda pra home
  if (hasSupabaseSession && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. Segurança do Admin: O middleware não consegue ler o e-mail sem o cliente,
  // mas não se preocupe! A página /admin e o banco de dados (RLS) fazem essa verificação.
  // Se um não-admin entrar no /admin, a página vai redirecionar ele sozinha.

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
