import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export async function crawlUrl(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const doc = new JSDOM(html, { url });
    
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Failed to parse article content from the URL');
    }

    // Try to extract favicon
    let faviconUrl = '';
    const iconLink = doc.window.document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (iconLink) {
      const href = iconLink.getAttribute('href');
      if (href) {
        faviconUrl = new URL(href, url).toString();
      }
    }

    return {
      title: article.title,
      textContent: article.textContent?.trim() || '',
      siteName: article.siteName,
      byline: article.byline,
      faviconUrl,
      htmlContent: html,
    };
  } catch (error) {
    console.error(`Error crawling URL ${url}:`, error);
    throw error;
  }
}
