'use client';

import { useState, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

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

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <nav className="nav">
          <button onClick={() => scrollToSection('introduction')}>О проекте</button>
          <button onClick={() => scrollToSection('products')}>Инструменты</button>
          <button onClick={() => scrollToSection('contact')}>Ресурсы</button>
        </nav>
      </div>
    </header>
  );
};

export default Header;

