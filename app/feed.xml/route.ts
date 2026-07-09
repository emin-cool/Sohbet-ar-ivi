import { getSohbetMetalar } from '@/lib/content';
import { NextResponse } from 'next/server';

export async function GET() {
  const sohbetler = getSohbetMetalar();
  const baseUrl = 'https://sohbetarsivi.com';

  const items = sohbetler.map((sohbet) => {
    return `
      <item>
        <title><![CDATA[${sohbet.baslik}]]></title>
        <link>${baseUrl}/sohbet/${sohbet.slug}</link>
        <guid>${baseUrl}/sohbet/${sohbet.slug}</guid>
        <pubDate>${new Date(sohbet.tarihIso).toUTCString()}</pubDate>
        <description><![CDATA[${sohbet.ozet || ''}]]></description>
      </item>
    `;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>Sohbet Arşivi</title>
        <link>${baseUrl}</link>
        <description>İslami sohbet kayıtları, transkriptler ve kavramlar sözlüğü.</description>
        <language>tr</language>
        ${items}
      </channel>
    </rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=86400, stale-while-revalidate',
    },
  });
}
