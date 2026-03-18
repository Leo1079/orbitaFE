import React from 'react';
import { Card, Button, Badge, Stack } from 'react-bootstrap';
import { FaBox, FaPlus, FaShoppingCart } from 'react-icons/fa';

const ProductCard = React.memo(({ product, onAddToCart }) => {
  
  // Evitamos la duplicidad de lógica: una sola función para agregar
  const handleAdd = (e) => {
    if (e) e.stopPropagation(); // Evita que el clic en el botón active eventos del contenedor si los hubiera
    if (product.stock > 0 && product.activo) {
      onAddToCart(product);
    }
  };

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const outOfStock = product.stock <= 0 || !product.activo;

  return (
    <Card 
      className="h-100 shadow-sm border-0 transition-all product-hover-card" 
      style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
      onClick={handleAdd}
    >
      {/* Header con Badge de Precio */}
      <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center pt-3">
        <div 
          className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary"
          style={{ width: '40px', height: '40px' }}
        >
          <FaBox size={20} />
        </div>
        <Badge bg="dark" className="fs-6 fw-bold p-2 px-3 rounded-pill">
          ${Number(product.precio).toFixed(2)}
        </Badge>
      </Card.Header>

      <Card.Body>
        <Card.Title className="text-truncate fw-bold mb-2">
          {product.nombre}
        </Card.Title>
        
        <Stack direction="horizontal" gap={2}>
          <Badge 
            bg={outOfStock ? 'secondary' : isLowStock ? 'warning' : 'success'} 
            className="p-2"
          >
            {outOfStock ? 'Sin Stock' : isLowStock ? `¡Solo ${product.stock}! 🔥` : `Disponible: ${product.stock}`}
          </Badge>
          
          {!product.activo && (
            <Badge bg="danger">Inactivo</Badge>
          )}
        </Stack>
      </Card.Body>

      <Card.Footer className="bg-white border-0 pb-3">
        <Button
          variant={outOfStock ? "outline-secondary" : "primary"}
          className="w-100 fw-bold py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
          onClick={handleAdd}
          disabled={outOfStock}
          aria-label={`Agregar ${product.nombre} al carrito`}
        >
          {outOfStock ? (
            "No disponible"
          ) : (
            <>
              <FaPlus /> Agregar
            </>
          )}
        </Button>
      </Card.Footer>

      {/* CSS Inline para el efecto Hover opcional */}
      <style>{`
        .product-hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;