import React from 'react';
import { Button } from 'react-bootstrap';
import { FaMinus, FaPlus, FaTrash } from 'react-icons/fa';

const CartItem = React.memo(({ item, onQuantityChange, onRemove }) => {
  const handleDecrease = () => {
    onQuantityChange(item.id_producto, item.cantidad - 1);
  };

  const handleIncrease = () => {
    onQuantityChange(item.id_producto, item.cantidad + 1);
  };

  const handleRemove = () => {
    onRemove(item.id_producto);
  };

  return (
    <div className="orbita-card mb-2 cart-item">
      <div className="orbita-card-body">
        <div className="orbita-flex-between">
          <div className="item-info">
            <h6 className="orbita-card-title mb-1">{item.nombre}</h6>
            <p className="orbita-text-secondary mb-0">${item.precio.toFixed(2)} c/u</p>
          </div>
          
          <div className="item-controls">
            <div className="orbita-flex-center gap-2 mb-2">
              <Button
                size="sm"
                className="orbita-btn orbita-btn-outline"
                onClick={handleDecrease}
                disabled={item.cantidad <= 1}
                aria-label="Disminuir cantidad"
              >
                <FaMinus />
              </Button>
              <span className="orbita-text-primary fw-bold px-2">{item.cantidad}</span>
              <Button
                size="sm"
                className="orbita-btn orbita-btn-outline"
                onClick={handleIncrease}
                aria-label="Aumentar cantidad"
              >
                <FaPlus />
              </Button>
            </div>
            
            <div className="orbita-flex-between">
              <span className="orbita-text-success fw-bold">${item.subtotal.toFixed(2)}</span>
              <Button
                size="sm"
                className="orbita-btn orbita-btn-danger"
                onClick={handleRemove}
                aria-label={`Eliminar ${item.nombre} del carrito`}
              >
                <FaTrash />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

export default CartItem;
