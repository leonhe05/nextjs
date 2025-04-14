"use client"; // Mark this as a Client Component

import dynamic from 'next/dynamic';

// Perform the dynamic import with ssr: false *inside* a Client Component
const HomePageClient = dynamic(() => import('@/app/components/HomePageClient'), {
  ssr: false,
  // Optional: Add a loading component
  // loading: () => <p>Loading client component...</p>
});

export default function DynamicHomePageLoader() {
  // Render the dynamically imported component
  return <HomePageClient />;
}
