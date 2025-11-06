import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { createServerComponentClient } from '@/lib/supabase-server';

export default async function AppLayout({ children }: { children: ReactNode }) {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      redirect('/auth');
    }

    return <>{children}</>;
  } catch {
    redirect('/auth');
  }
}

