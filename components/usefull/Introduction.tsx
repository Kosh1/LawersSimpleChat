import './Introduction.css';

const Introduction = () => {
  return (
    <section id="introduction" className="introduction">
      <div className="container">
        <div className="introduction-content">
          <h1 className="introduction-title">
            ИИ-инструменты для юридической практики
          </h1>
          
          <div className="introduction-text">
            <p className="lead">
              Нейросети упрощают и ускоряют работу юриста. 
              Здесь собраны инструменты и подходы для решения повседневных задач.
            </p>
            
            <div className="introduction-sections">
              <div className="intro-block">
                <h2>Что здесь</h2>
                <p>
                  Обзор ИИ-инструментов для юридической работы: 
                  от исследования правовых вопросов до подготовки документов и проверки рекламы.
                </p>
              </div>
              
              <div className="intro-block">
                <h2>Как использовать</h2>
                <p>
                  Каждый инструмент решает конкретные задачи. 
                  Узнаете, когда применять сервис, его преимущества и ограничения, 
                  увидите примеры использования.
                </p>
              </div>
              
              <div className="intro-block">
                <h2>Принципы работы</h2>
                <p>
                  ИИ — помощник, не замена профессионального суждения. 
                  Все результаты требуют проверки, особенно в процессуально значимых документах. 
                  Рассмотрим риски и правила безопасной работы.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Introduction;

