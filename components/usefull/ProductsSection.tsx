import ProductCard from './ProductCard';
import { products } from '@/lib/usefull/data/products';
import { examples } from '@/lib/usefull/data/examples';
import './ProductsSection.css';
import './retro-landing.css';

const ProductsSection = () => {
  return (
    <section id="products" className="retro-section">
      <div>
        <h2 className="retro-section-title">ОБЗОР ИНСТРУМЕНТОВ</h2>
        <p className="retro-section-subtitle">Выберите инструмент для оптимизации работы</p>
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              examplesData={examples}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;









