import React from 'react';
import { Button } from 'react-bootstrap';
import { FaBox, FaTag, FaPlus } from 'react-icons/fa';

const ProductCard = React.memo(({ product, onAddToCart }) => {
  const handleClick = () => {
    onAddToCart(product);
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  return (
    <div
      className="product-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="product-header">
        <div className="product-icon">
          <FaBox />
        </div>
        <div className="product-price">
          <FaTag className="price-icon" />
          <span>${Number(product.precio).toFixed(2)}</span>
        </div>
      </div>
      
      <div className="product-body">
        <h5 className="product-name">{product.nombre}</h5>
        
        <div className="product-stock">
          <span className={`stock-badge ${product.stock > 5 ? 'in-stock' : 'low-stock'}`}>
            {product.stock > 5 ? '✓' : '⚠'} {product.stock} unidades
          </span>
        </div>
      </div>
      
      <div className="product-footer">
        <Button
          className="add-to-cart-btn"
          onClick={handleButtonClick}
          disabled={!product.activo || product.stock <= 0}
          aria-label={`Agregar ${product.nombre} al carrito`}
        >
          <FaPlus /> Agregar
        </Button>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
