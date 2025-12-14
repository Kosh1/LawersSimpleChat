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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show loading while redirecting (fallback)
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Переход в рабочее пространство...</p>
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="App">
      <Header />
      <Introduction />
      <FeaturesSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
