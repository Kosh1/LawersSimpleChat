'use client';

import ProductsSection from '@/components/usefull/ProductsSection';
import ContactSection from '@/components/usefull/ContactSection';
import Footer from '@/components/usefull/Footer';
import '@/components/usefull/retro-landing.css';
import './index.css';

export default function UsefullPage() {
  return (
    <div className="App retro-landing">
      <ProductsSection />
      <ContactSection />
      <Footer />
    </div>
  );
}









