import { MetadataRoute } from 'next';
import { getSohbetSluglari, getKavramlar } from '@/lib/content';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sohbetarsivi.com'; // Burayı gerçek domain ile değiştirin

  // Statik Sayfalar
  const routes = ['', '/sohbetler', '/kavramlar', '/ayetler', '/arama', '/hakkinda'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  // Sohbet Sayfaları
  const sohbetler = (await getSohbetSluglari()).map((slug) => ({
    url: `${baseUrl}/sohbet/${slug}`,
    lastModified: new Date(),
  }));

  // Kavram Sayfaları
  const kavramlar = (await getKavramlar()).map((kavram) => ({
    url: `${baseUrl}/kavram/${kavram.slug}`,
    lastModified: new Date(),
  }));

  return [...routes, ...sohbetler, ...kavramlar];
}
