'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import Header from '@/components/usefull/Header';
import Introduction from '@/components/usefull/Introduction';
import FeaturesSection from '@/components/usefull/FeaturesSection';
import ContactSection from '@/components/usefull/ContactSection';
import Footer from '@/components/usefull/Footer';
import '@/components/usefull/App.css';
import '@/app/usefull/index.css';
import '@/components/usefull/retro-landing.css';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Fallback redirect in case middleware doesn't catch it
  useEffect(() => {
    if (!loading && user) {
      router.replace('/workspace');
    }
  }, [user, loading, router]);

  // Show loading while checking auth (fallback)
  if (loading) {
    return (
      <div className="retro-landing flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-4a4a4a border-r-transparent" />
          <p className="mt-4" style={{ color: '#000', fontFamily: "'Courier New', 'Monaco', monospace", fontWeight: 'bold', letterSpacing: '2px' }}>ЗАГРУЗКА...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show loading while redirecting (fallback)
  if (user) {
    return (
      <div className="retro-landing flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-4a4a4a border-r-transparent" />
          <p className="mt-4" style={{ color: '#000', fontFamily: "'Courier New', 'Monaco', monospace", fontWeight: 'bold', letterSpacing: '2px' }}>ПЕРЕХОД В РАБОЧЕЕ ПРОСТРАНСТВО...</p>
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="App retro-landing">
      <Header />
      <Introduction />
      <FeaturesSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
