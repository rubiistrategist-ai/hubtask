import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/recuperar-senha')
  
  // Verifica se existe o cookie de sessão do Supabase
  const hasSession = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

  // Se não tem sessão e tenta acessar página protegida -> Manda pro login
  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se tem sessão e tenta acessar login -> Manda pra home
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
