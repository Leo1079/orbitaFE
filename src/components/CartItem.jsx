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
    <div className="cart-item">
      <div className="item-info">
        <h6 className="item-name">{item.nombre}</h6>
        <p className="item-price">${item.precio.toFixed(2)} c/u</p>
      </div>
      
      <div className="item-controls">
        <div className="quantity-controls">
          <Button
            size="sm"
            variant="outline-secondary"
            className="quantity-btn"
            onClick={handleDecrease}
            disabled={item.cantidad <= 1}
            aria-label="Disminuir cantidad"
          >
            <FaMinus />
          </Button>
          <span className="quantity-display">{item.cantidad}</span>
          <Button
            size="sm"
            variant="outline-secondary"
            className="quantity-btn"
            onClick={handleIncrease}
            aria-label="Aumentar cantidad"
          >
            <FaPlus />
          </Button>
        </div>
        
        <div className="item-total">
          <span className="total-amount">${item.subtotal.toFixed(2)}</span>
          <Button
            size="sm"
            variant="outline-danger"
            className="remove-btn"
            onClick={handleRemove}
            aria-label={`Eliminar ${item.nombre} del carrito`}
          >
            <FaTrash />
          </Button>
        </div>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

export default CartItem;
