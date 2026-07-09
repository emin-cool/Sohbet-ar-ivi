import { MetadataRoute } from 'next';
import { getSohbetSluglari, getKavramlar } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sohbetarsivi.com'; // Burayı gerçek domain ile değiştirin

  // Statik Sayfalar
  const routes = ['', '/sohbetler', '/kavramlar', '/ayetler', '/arama', '/hakkinda'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  // Sohbet Sayfaları
  const sohbetler = getSohbetSluglari().map((slug) => ({
    url: `${baseUrl}/sohbet/${slug}`,
    lastModified: new Date(),
  }));

  // Kavram Sayfaları
  const kavramlar = getKavramlar().map((kavram) => ({
    url: `${baseUrl}/kavram/${kavram.slug}`,
    lastModified: new Date(),
  }));

  return [...routes, ...sohbetler, ...kavramlar];
}
