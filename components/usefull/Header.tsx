'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
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
    }
  };

  const handleLogin = () => {
    router.push('/auth');
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <div className="header-logo text-foreground" style={{ fontWeight: '700', fontSize: '1.25rem' }}>
          jHelper
        </div>
        <nav className="nav">
          <button onClick={() => scrollToSection('introduction')}>О системе</button>
          <button onClick={() => scrollToSection('products')}>Возможности</button>
          <button onClick={() => scrollToSection('contact')}>Контакты</button>
          <button 
            onClick={handleLogin}
            className="bg-primary text-primary-foreground hover:opacity-90"
            style={{
              padding: '0.5rem 1.5rem',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Войти
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;




