'use client';

import { useRouter } from 'next/navigation';
import './ContactSection.css';

const ContactSection = () => {
  const router = useRouter();

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <div className="section-header">
          <h2>Готовы начать?</h2>
          <p>Присоединяйтесь к юристам, которые уже используют ИИ в своей работе</p>
        </div>
        <div className="contact-content">
          <div className="bg-card border border-border" style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '3rem',
            borderRadius: '1rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 className="text-card-foreground" style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem' }}>
              Получить доступ к системе
            </h3>
            <p className="text-muted-foreground" style={{ marginBottom: '2rem', fontSize: '1.125rem', lineHeight: '1.7' }}>
              Доступ к jHelper предоставляется после короткой консультации. 
              Запишитесь на звонок — обсудим ваши задачи и покажем возможности системы.
            </p>
            <button
              onClick={() => window.open('https://calendly.com/glebtuzov/30-minute-call-with-tuzov-gleb-opencv', '_blank')}
              className="bg-primary text-primary-foreground hover:opacity-90"
              style={{
                padding: '1rem 3rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px rgba(16, 130, 166, 0.4)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 130, 166, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 130, 166, 0.4)';
              }}
            >
              Записаться на звонок
            </button>
            <p className="text-muted-foreground" style={{ marginTop: '1rem', fontSize: '0.95rem' }}>
              Консультация бесплатная, ~30 минут
            </p>
            
            <div className="border-t border-border" style={{ 
              marginTop: '2.5rem', 
              paddingTop: '2rem', 
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2rem'
            }}>
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📞</div>
                <div className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>Бесплатная<br/>консультация</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
                <div className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>Безопасность<br/>данных</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💼</div>
                <div className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>Персональный<br/>подход</div>
              </div>
            </div>
          </div>
          
          <div className="contact-info" style={{ marginTop: '3rem' }}>
            <div className="contact-links">
              <a 
                href="https://calendly.com/glebtuzov/30-minute-call-with-tuzov-gleb-opencv"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <span className="contact-icon">📅</span>
                <div>
                  <strong>Calendly</strong>
                  <p>Выберите удобное время для звонка</p>
                </div>
              </a>
              <a 
                href="https://t.me/tuzovgleb"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <span className="contact-icon">📱</span>
                <div>
                  <strong>Telegram</strong>
                  <p>Задайте вопрос напрямую</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;




