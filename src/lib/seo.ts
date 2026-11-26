import { marked } from 'marked';

const plain = (md: string) =>
  (marked.parse(md) as string)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: plain(q.answer) },
    })),
  };
}

export function personJsonLd(site: { ownerName: string; role: string; email: string; socials: { url: string }[] }, url: string, image?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.ownerName,
    jobTitle: site.role,
    email: `mailto:${site.email}`,
    url,
    image,
    sameAs: site.socials.map((s) => s.url),
  };
}

export function creativeWorkJsonLd(p: { title: string; summary: string; year: number; category: string; client?: string }, url: string, image: string, author: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    description: p.summary,
    dateCreated: String(p.year),
    genre: p.category,
    url,
    image,
    author: { '@type': 'Person', name: author },
    ...(p.client ? { sourceOrganization: { '@type': 'Organization', name: p.client } } : {}),
  };
}

export const absolute = (path: string, site: URL | string | undefined) => (path ? new URL(path, site).href : undefined);
