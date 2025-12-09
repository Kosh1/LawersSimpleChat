import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  const path = params.path ? params.path.join('/') : '';
  const targetUrl = `https://j-helper-usefullpage-nais54ukg-kosh1s-projects.vercel.app/usefull/${path}`;
  
  // Копируем query параметры
  const searchParams = request.nextUrl.searchParams.toString();
  const fullUrl = searchParams ? `${targetUrl}?${searchParams}` : targetUrl;

  try {
    const response = await fetch(fullUrl, {
      headers: {
        // Копируем важные заголовки
        'User-Agent': request.headers.get('user-agent') || '',
        'Accept': request.headers.get('accept') || '*/*',
        'Accept-Language': request.headers.get('accept-language') || 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || 'text/html';
    let body: string | ArrayBuffer;

    // Для текстового контента делаем замену ссылок
    if (contentType.includes('text/html') || contentType.includes('text/css') || contentType.includes('application/javascript')) {
      body = await response.text();
      
      // Заменяем абсолютные ссылки на относительные
      body = body.replace(
        /https:\/\/j-helper-usefullpage-nais54ukg-kosh1s-projects\.vercel\.app\/usefull/g,
        '/usefull'
      );
      
      // Также заменяем ссылки без https (на случай если есть protocol-relative URLs)
      body = body.replace(
        /\/\/j-helper-usefullpage-nais54ukg-kosh1s-projects\.vercel\.app\/usefull/g,
        '/usefull'
      );
    } else {
      // Для бинарного контента (изображения, шрифты и т.д.)
      body = await response.arrayBuffer();
    }

    // Создаем заголовки ответа
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    
    // Копируем важные заголовки из оригинального ответа
    const headersToCopy = ['cache-control', 'etag', 'last-modified', 'content-encoding'];
    headersToCopy.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    // Если cache-control не установлен, добавляем дефолтный
    if (!responseHeaders.has('cache-control')) {
      responseHeaders.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    }

    return new NextResponse(body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Error fetching content', { status: 500 });
  }
}

// Поддержка POST запросов
export async function POST(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  const path = params.path ? params.path.join('/') : '';
  const targetUrl = `https://j-helper-usefullpage-nais54ukg-kosh1s-projects.vercel.app/usefull/${path}`;
  
  const searchParams = request.nextUrl.searchParams.toString();
  const fullUrl = searchParams ? `${targetUrl}?${searchParams}` : targetUrl;

  try {
    const body = await request.text();
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': request.headers.get('user-agent') || '',
      },
      body: body,
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('Proxy POST error:', error);
    return new NextResponse('Error forwarding request', { status: 500 });
  }
}

