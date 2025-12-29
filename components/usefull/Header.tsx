'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './Header.css';
import './retro-landing.css';

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

  const handleLogin = () => {
    router.push('/auth');
  };

  return (
    <header className={`retro-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="retro-header-container">
        <div className="retro-logo">
          ДЖИХЕЛПЕР
        </div>
        <nav className="retro-nav">
          <button 
            onClick={handleLogin}
            className="retro-button"
          >
            ВОЙТИ
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
