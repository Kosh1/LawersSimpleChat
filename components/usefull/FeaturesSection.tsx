'use client';

import { useState } from 'react';
import { features, useCases, security } from '@/lib/usefull/data/features';
import './ProductsSection.css';
import './retro-landing.css';

const FeaturesSection = () => {
  const [expandedCard, setExpandedCard] = useState<number | null>(0);
  
  // Цвета для заголовков карточек (приглушенные)
  const cardColors = ['#a01a2a', '#b84d1f', '#b88a2f', '#253d5f', '#a01a2a', '#b84d1f'];
  
  return (
    <>
      <section id="products" className="retro-section">
        <div>
          <h2 className="retro-section-title">ВОЗМОЖНОСТИ СИСТЕМЫ</h2>
          <p className="retro-section-subtitle">Комплексные инструменты для эффективной юридической работы</p>
          <div className="retro-card-stack">
            <div className="retro-stack-headers">
              {features.map((feature, idx) => {
                const isExpanded = expandedCard === idx;
                const cardColor = cardColors[idx];
                
                return (
                  <div 
                    key={feature.id} 
                    className={`retro-stack-header ${isExpanded ? 'expanded' : ''}`}
                    style={{ 
                      backgroundColor: cardColor
                    }}
                    onClick={() => setExpandedCard(idx)}
                  >
                    <h3 className="retro-stack-header-title">
                      {feature.name.toUpperCase()}
                    </h3>
                  </div>
                );
              })}
            </div>
            <div className="retro-stack-content">
              {expandedCard !== null && (
                <div className="retro-stack-card-expanded" style={{ backgroundColor: cardColors[expandedCard] }}>
                  <div className="retro-stack-card-content">
                    <p className="retro-card-text" style={{ marginBottom: '1rem', color: '#fff' }}>
                      {features[expandedCard].description}
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {features[expandedCard].benefits.map((benefit, benefitIdx) => (
                        <li key={benefitIdx} className="retro-card-text" style={{ 
                          padding: '0.5rem 0', 
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          color: '#fff'
                        }}>
                          <span style={{ marginRight: '0.5rem', fontWeight: '700', color: '#fff' }}>✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="retro-section" style={{ background: '#f0f0eb' }}>
        <div>
          <h2 className="retro-section-title">КАК ЭТО РАБОТАЕТ</h2>
          <p className="retro-section-subtitle">Примеры использования в реальной практике</p>
          <div className="retro-use-cases-grid">
            {useCases.map((useCase, idx) => (
              <div key={idx} className="retro-card">
                <h3 className="retro-card-title">
                  {useCase.title.toUpperCase()}
                </h3>
                <p className="retro-card-text">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="retro-section">
        <div>
          <h2 className="retro-section-title">{security.title.toUpperCase()}</h2>
          <p className="retro-section-subtitle">Ваши данные под надёжной защитой</p>
          <div className="retro-security-grid">
            {security.items.map((item, idx) => (
              <div key={idx} className="retro-card" style={{ textAlign: 'center' }}>
                <h3 className="retro-card-title" style={{ fontSize: '1rem' }}>
                  {item.title.toUpperCase()}
                </h3>
                <p className="retro-card-text">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturesSection;





