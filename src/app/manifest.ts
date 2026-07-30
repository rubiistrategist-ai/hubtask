import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HubTask Academy',
    short_name: 'HubTask',
    description: 'Aprenda, execute e lucre com a HubTask.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A192F',
    theme_color: '#00C853',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      }
    ],
  }
}