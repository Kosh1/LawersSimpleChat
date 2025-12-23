'use client';

import './ExampleWithAnalysis.css';

interface Example {
  id: string;
  prompt: string;
  analysis?: {
    structure: string[];
    purpose: string;
    tips: string[];
  };
  resultImage?: string;
  resultImage2?: string;
}

interface ExampleWithAnalysisProps {
  example: Example;
}

const ExampleWithAnalysis = ({ example }: ExampleWithAnalysisProps) => {
  const openFullscreen = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    
    // Создаем контейнер для fullscreen
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      cursor: pointer;
    `;
    
    const fullscreenImg = document.createElement('img');
    fullscreenImg.src = img.src;
    fullscreenImg.alt = img.alt;
    fullscreenImg.style.cssText = `
      max-width: 100%;
      max-height: 100vh;
      object-fit: contain;
      user-select: none;
      -webkit-user-drag: none;
    `;
    
    container.appendChild(fullscreenImg);
    document.body.appendChild(container);
    
    // Закрытие по клику
    const closeFullscreen = () => {
      document.body.removeChild(container);
      document.removeEventListener('keydown', handleEscape);
    };
    
    container.addEventListener('click', closeFullscreen);
    
    // Закрытие по ESC
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFullscreen();
      }
    };
    document.addEventListener('keydown', handleEscape);
  };

  return (
    <>
      <div className="example-with-analysis">
        <div className="example-prompt">
          <h4>Пример запроса</h4>
          <div className="prompt-text">
            <code>{example.prompt}</code>
          </div>
        </div>

        {example.analysis && (
          <div className="prompt-analysis">
            <div className="analysis-section">
              <h5>Структура промпта:</h5>
              <ul>
                {example.analysis.structure.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            
            <div className="analysis-section">
              <h5>Зачем это сделано:</h5>
              <p>{example.analysis.purpose}</p>
            </div>

            <div className="analysis-section">
              <h5>Практические советы:</h5>
              <ul className="tips-list">
                {example.analysis.tips.map((tip, idx) => (
                  <li key={idx}>💡 {tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {example.resultImage && (
          <div className="example-result">
            <h5>Результат выполнения запроса:</h5>
            <div className={`result-images ${example.resultImage2 && example.resultImage2 !== example.resultImage ? 'has-two-images' : 'has-one-image'}`}>
              <div className="result-image-wrapper">
                <img 
                  src={example.resultImage} 
                  alt="Результат запроса"
                  loading="lazy"
                  onClick={openFullscreen}
                  className="clickable-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const placeholder = target.nextElementSibling as HTMLElement;
                    if (placeholder) {
                      target.style.display = 'none';
                      placeholder.style.display = 'block';
                    }
                  }}
                />
                <div className="image-placeholder" style={{ display: 'none' }}>
                  <p>Изображение не найдено</p>
                  <p className="image-path">{example.resultImage}</p>
                </div>
              </div>
              {example.resultImage2 && example.resultImage2 !== example.resultImage && (
                <div className="result-image-wrapper">
                  <img 
                    src={example.resultImage2} 
                    alt="Результат запроса (часть 2)"
                    loading="lazy"
                    onClick={openFullscreen}
                    className="clickable-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const placeholder = target.nextElementSibling as HTMLElement;
                      if (placeholder) {
                        target.style.display = 'none';
                        placeholder.style.display = 'block';
                      }
                    }}
                  />
                  <div className="image-placeholder" style={{ display: 'none' }}>
                    <p>Изображение не найдено</p>
                    <p className="image-path">{example.resultImage2}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ExampleWithAnalysis;













