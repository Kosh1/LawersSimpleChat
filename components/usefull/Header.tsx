'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './Header.css';
import './retro-landing.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogin = () => {
    router.push('/auth');
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div 
          className="retro-mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <header className={`retro-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="retro-header-container">
          <div className="retro-logo">
            ДЖИХЕЛПЕР
          </div>
          <button 
            className="retro-mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Меню"
          >
            <span className={isMobileMenuOpen ? 'open' : ''}></span>
            <span className={isMobileMenuOpen ? 'open' : ''}></span>
            <span className={isMobileMenuOpen ? 'open' : ''}></span>
          </button>
          <nav className={`retro-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <button onClick={() => scrollToSection('introduction')}>О СИСТЕМЕ</button>
            <button onClick={() => scrollToSection('products')}>ВОЗМОЖНОСТИ</button>
            <button onClick={() => scrollToSection('contact')}>КОНТАКТЫ</button>
            <button 
              onClick={handleLogin}
              className="retro-button"
            >
              ВОЙТИ
            </button>
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;






