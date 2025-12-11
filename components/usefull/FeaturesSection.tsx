'use client';

import { features, useCases, security } from '@/lib/usefull/data/features';
import './ProductsSection.css';

const FeaturesSection = () => {
  return (
    <>
      <section id="products" className="products-section">
        <div className="container">
          <div className="section-header">
            <h2>Возможности системы</h2>
            <p>Комплексные инструменты для эффективной юридической работы</p>
          </div>
          <div className="products-grid">
            {features.map((feature) => (
              <div key={feature.id} className="feature-card bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="feature-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  {feature.icon}
                </div>
                <h3 className="feature-title text-card-foreground" style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                  {feature.name}
                </h3>
                <p className="feature-description text-muted-foreground" style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
                  {feature.description}
                </p>
                <ul className="feature-benefits" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="text-muted-foreground" style={{ 
                      padding: '0.5rem 0', 
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}>
                      <span className="text-primary" style={{ marginRight: '0.5rem', fontWeight: '700' }}>✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="products-section bg-secondary/50">
        <div className="container">
          <div className="section-header">
            <h2>Как это работает</h2>
            <p>Примеры использования в реальной практике</p>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem',
            marginTop: '2rem'
          }}>
            {useCases.map((useCase, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-8 hover:shadow-md transition-shadow">
                <h3 className="text-card-foreground" style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                  {useCase.title}
                </h3>
                <p className="text-muted-foreground" style={{ lineHeight: '1.6' }}>
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <h2>{security.title}</h2>
            <p>Ваши данные под надёжной защитой</p>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '2rem',
            marginTop: '2rem'
          }}>
            {security.items.map((item, idx) => (
              <div key={idx} className="text-center p-6">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  {item.icon}
                </div>
                <h3 className="text-card-foreground" style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                <p className="text-muted-foreground" style={{ lineHeight: '1.6' }}>
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
