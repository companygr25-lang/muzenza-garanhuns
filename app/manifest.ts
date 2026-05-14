import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MUZENZA Capoeira',
    short_name: 'MUZENZA',
    description: 'Aplicativo oficial do Grupo MUZENZA',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#D32F2F',
    icons: [
      {
        src: 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
        sizes: 'any',
        type: 'image/jpeg',
      },
      {
        src: 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  };
}
