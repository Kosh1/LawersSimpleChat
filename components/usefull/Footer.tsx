'use client';

import './Footer.css';
import './retro-landing.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="retro-footer">
      <div className="retro-footer-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div>
            <h3 className="retro-footer-title">
              ДЖИХЕЛПЕР
            </h3>
            <p className="retro-footer-text">
              Искусственный интеллект для российских юристов. 
              Современные технологии для повышения эффективности юридической работы.
            </p>
          </div>
          
          <div>
            <h4 className="retro-footer-title" style={{ fontSize: '1rem' }}>
              ПЛАТФОРМА
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/auth" className="retro-footer-link">
                  ВОЙТИ
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/auth" className="retro-footer-link">
                  РЕГИСТРАЦИЯ
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="retro-footer-title" style={{ fontSize: '1rem' }}>
              ПОДДЕРЖКА
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="https://t.me/tuzovgleb" target="_blank" rel="noopener noreferrer" className="retro-footer-link">
                  TELEGRAM
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="mailto:support@legal-ai.ru" className="retro-footer-link">
                  EMAIL
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div style={{
          paddingTop: '2rem',
          borderTop: '2px solid #2a2a2a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <p className="retro-footer-text" style={{ margin: 0 }}>
            © {currentYear} ДЖИХЕЛПЕР. ВСЕ ПРАВА ЗАЩИЩЕНЫ.
          </p>
          <button onClick={scrollToTop} className="retro-scroll-top">
            ↑ НАВЕРХ
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;






