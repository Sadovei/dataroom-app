import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header, Footer } from '@/components/layout';
import { DataRoomAppSupabase } from '@/components/dataroom';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <DataRoomAppSupabase />
      </main>
      <Footer />
    </div>
  );
}
