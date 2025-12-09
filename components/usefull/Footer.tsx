'use client';

import './Footer.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <button onClick={scrollToTop} className="scroll-top">
          ↑ Наверх
        </button>
      </div>
    </footer>
  );
};

export default Footer;

