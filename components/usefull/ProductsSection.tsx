import ProductCard from './ProductCard';
import { products } from '@/lib/usefull/data/products';
import { examples } from '@/lib/usefull/data/examples';
import './ProductsSection.css';

const ProductsSection = () => {
  return (
    <section id="products" className="products-section">
      <div className="container">
        <div className="section-header">
          <h2>Обзор инструментов</h2>
          <p>Выберите инструмент для оптимизации работы</p>
        </div>
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




