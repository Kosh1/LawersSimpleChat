'use client';

import './Footer.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div>
            <h3 className="text-foreground" style={{ fontWeight: '700', fontSize: '1.25rem', marginBottom: '1rem' }}>
              jHelper
            </h3>
            <p className="text-muted-foreground" style={{ lineHeight: '1.6' }}>
              Искусственный интеллект для российских юристов. 
              Современные технологии для повышения эффективности юридической работы.
            </p>
          </div>
          
          <div>
            <h4 className="text-foreground" style={{ fontWeight: '600', marginBottom: '1rem' }}>
              Платформа
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/auth" className="text-muted-foreground hover:text-primary transition-colors" style={{ textDecoration: 'none' }}>
                  Войти
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/auth" className="text-muted-foreground hover:text-primary transition-colors" style={{ textDecoration: 'none' }}>
                  Регистрация
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-foreground" style={{ fontWeight: '600', marginBottom: '1rem' }}>
              Поддержка
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="https://t.me/tuzovgleb" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" style={{ textDecoration: 'none' }}>
                  Telegram
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="mailto:support@legal-ai.ru" className="text-muted-foreground hover:text-primary transition-colors" style={{ textDecoration: 'none' }}>
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border" style={{
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <p className="text-muted-foreground" style={{ margin: 0 }}>
            © {currentYear} jHelper. Все права защищены.
          </p>
          <button onClick={scrollToTop} className="scroll-top">
            ↑ Наверх
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


