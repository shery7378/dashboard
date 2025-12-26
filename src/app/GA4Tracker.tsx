'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function GA4Tracker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!id) return;
    if (typeof window === 'undefined' || typeof (window as any).gtag !== 'function') return;

    const query = searchParams?.toString();
    const page_path = query ? `${pathname}?${query}` : pathname;
    (window as any).gtag('config', id, { page_path });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
