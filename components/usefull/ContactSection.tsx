'use client';

import { useRouter } from 'next/navigation';
import './ContactSection.css';
import './retro-landing.css';

const ContactSection = () => {
  const router = useRouter();

  return (
    <section id="contact" className="retro-section">
      <div>
        <h2 className="retro-section-title">ГОТОВЫ НАЧАТЬ?</h2>
        <p className="retro-section-subtitle">Присоединяйтесь к юристам, которые уже используют ИИ в своей работе</p>
        
        <div className="retro-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h3 className="retro-card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            ПОЛУЧИТЬ ДОСТУП К СИСТЕМЕ
          </h3>
          <p className="retro-card-text" style={{ marginBottom: '2rem', fontSize: '1rem' }}>
            Доступ к Джихелпер предоставляется после короткой консультации. 
            Запишитесь на звонок — обсудим ваши задачи и покажем возможности системы.
          </p>
          <button
            onClick={() => window.open('https://calendly.com/glebtuzov/30-minute-call-with-tuzov-gleb-opencv', '_blank')}
            className="retro-button"
            style={{ padding: '1rem 3rem', fontSize: '1rem' }}
          >
            ЗАПИСАТЬСЯ НА ЗВОНОК
          </button>
          <p className="retro-card-text" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            Консультация бесплатная, ~30 минут
          </p>
          
          <div className="retro-contact-features">
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📞</div>
              <div className="retro-card-text" style={{ fontSize: '0.875rem' }}>БЕСПЛАТНАЯ<br/>КОНСУЛЬТАЦИЯ</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
              <div className="retro-card-text" style={{ fontSize: '0.875rem' }}>БЕЗОПАСНОСТЬ<br/>ДАННЫХ</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💼</div>
              <div className="retro-card-text" style={{ fontSize: '0.875rem' }}>ПЕРСОНАЛЬНЫЙ<br/>ПОДХОД</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;






