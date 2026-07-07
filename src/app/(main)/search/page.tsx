import type { Metadata } from 'next';
import { SearchPageView } from '@/components/product/SearchPageView';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: params.q ? `Search: "${params.q}"` : 'Search',
    description: 'Search for wall posters and earrings at JD Store',
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  return <SearchPageView initialQuery={params.q || ''} />;
}

export const dynamic = 'force-dynamic';
