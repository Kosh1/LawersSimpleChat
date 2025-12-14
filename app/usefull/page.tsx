'use client';

import Header from '@/components/usefull/Header';
import Introduction from '@/components/usefull/Introduction';
import ProductsSection from '@/components/usefull/ProductsSection';
import ContactSection from '@/components/usefull/ContactSection';
import Footer from '@/components/usefull/Footer';
import '@/components/usefull/App.css';
import './index.css';

export default function UsefullPage() {
  return (
    <div className="App">
      <Header />
      <Introduction />
      <ProductsSection />
      <ContactSection />
      <Footer />
    </div>
  );
}




