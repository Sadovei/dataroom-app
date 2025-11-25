import { Header, Footer } from '@/components/layout';
import { DataRoomAppSupabase } from '@/components/dataroom';

export default function Home() {
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
