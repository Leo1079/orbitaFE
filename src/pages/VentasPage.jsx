import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../store/slices/productsSlice";
import { getActiveCash } from "../store/slices/cashSlice";
import api from "../api/axios";
import {
  Button,
  Form,
  InputGroup,
  FormControl,
  Row,
  Col,
  Badge,
  Spinner,
} from "react-bootstrap";
import {
  FaShoppingCart,
  FaSearch,
  FaMoneyBill,
  FaCreditCard,
  FaStore,
  FaCalculator,
} from "react-icons/fa";
import Swal from "sweetalert2";
import ProductCard from "../components/ProductCard";
import CartItem from "../components/CartItem";
import "./VentasPage.css";

const VentasPage = () => {
  const dispatch = useDispatch();
  const { items: products } = useSelector((state) => state.products);
  const { status: cajaStatus, currentCajaId } = useSelector(
    (state) => state.cash,
  );

  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [loadingPay, setLoadingPay] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [showCashInput, setShowCashInput] = useState(true);

  // --- CÁLCULOS MEMOIZADOS ---
  const cartTotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.subtotal, 0),
    [cart],
  );

  const cartItemsCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.cantidad, 0),
    [cart],
  );

  // CORRECCIÓN: Definición de changeAmount
  const changeAmount = useMemo(() => {
    const received = parseFloat(cashReceived) || 0;
    return received > 0 ? received - cartTotal : 0;
  }, [cashReceived, cartTotal]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return products.filter((p) => p.activo);
    return products.filter(
      (p) => p.activo && p.nombre.toLowerCase().includes(searchLower),
    );
  }, [products, searchTerm]);

  // --- CALLBACKS ---
  const handleAddToCart = useCallback((product) => {
    if (!product.activo || product.stock <= 0)
      return Swal.fire("Stock", "Producto sin stock o inactivo", "warning");

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.id_producto === product.id_producto,
      );
      if (existingItem) {
        if (existingItem.cantidad >= product.stock) {
          Swal.fire("Stock", "No hay suficiente stock", "warning");
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id_producto === product.id_producto
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precio,
              }
            : item,
        );
      }      return [
        ...prevCart,
        {
          id_producto: product.id_producto,
          nombre: product.nombre,
          precio: Number(product.precio),
          cantidad: 1,
          subtotal: Number(product.precio),
        },
      ];
    });
  }, []);


  const handleRemoveFromCart = useCallback((id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id_producto !== id));
  }, []);

  const handleQuantityChange = useCallback(
    (id, newQty) => {
      if (newQty < 1) return;
      const product = products?.find((p) => p.id_producto === id);
      if (product && newQty > product.stock) {
        return Swal.fire(
          "Stock",
          `Solo quedan ${product.stock} unidades`,
          "warning",
        );
      }
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id_producto === id
            ? { ...item, cantidad: newQty, subtotal: newQty * item.precio }
            : item,
        ),
      );
    },
    [products],
  );

  const handlePaymentMethodChange = useCallback((method) => {
    setPaymentMethod(method);
    setShowCashInput(method === "EFECTIVO");
    setCashReceived("");
  }, []);

  const handleProcessSale = useCallback(async () => {
    if (cajaStatus !== "open")
      return Swal.fire("Caja Cerrada", "Debe abrir la caja", "error");
    if (cart.length === 0)
      return Swal.fire("Carrito Vacío", "Agregue productos", "warning");

    if (paymentMethod === "EFECTIVO") {
      const received = parseFloat(cashReceived) || 0;
      if (received < cartTotal) {
        return Swal.fire(
          "Monto Insuficiente",
          `Faltan $${(cartTotal - received).toFixed(2)}`,
          "warning",
        );
      }
    }

    setLoadingPay(true);
    try {
      if (!currentCajaId) throw new Error("No hay una caja identificada.");

      const saleData = {
        id_caja: currentCajaId,
        metodo_pago: paymentMethod,
        detalles: cart.map((item) => ({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
        })),
      };

      const response = await api.post("/ventas", saleData);

      let successMessage = `Total: $${Number(response.data.total).toFixed(2)}`;
      if (paymentMethod === "EFECTIVO" && changeAmount > 0) {
        successMessage += `\nVuelto: $${changeAmount.toFixed(2)}`;
      }

      Swal.fire({
        title: "Venta Exitosa",
        text: successMessage,
        icon: "success",
      });
      setCart([]);
      setCashReceived("");
      dispatch(fetchProducts());
    } catch (error) {
      Swal.fire(
        "Error",
        error.message || "No se pudo procesar la venta",
        "error",
      );
    } finally {
      setLoadingPay(false);
    }
  }, [
    cajaStatus,
    cart,
    currentCajaId,
    paymentMethod,
    cashReceived,
    changeAmount,
    cartTotal,
    dispatch,
  ]);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(getActiveCash());
  }, [dispatch]);

  return (
    <div className="ventas-page animate-fade-in">
      <div className="ventas-header mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="icon-wrapper bg-primary">
              <FaStore className="text-white" />
            </div>
            <div>
              <h1 className="h3 mb-0 fw-bold text-white">Punto de Venta</h1>
              <p className="text-white mb-0">Gestión de facturación rápida</p>
            </div>
          </div>
          <Badge
            bg={cajaStatus === "open" ? "success" : "danger"}
            className="p-2 px-3"
          >
            {cajaStatus === "open" ? "CAJA ABIERTA" : "● CAJA CERRADA"}
          </Badge>
        </div>
      </div>

      <Row className="g-4">
        <Col lg={8}>
          <div className="search-container mb-3">
            <InputGroup className="glass-input-group">
              <InputGroup.Text className="bg-transparent border-0 text-white">
                <FaSearch />
              </InputGroup.Text>
              <FormControl
                placeholder="Buscar por nombre de producto..."
                className="bg-transparent text-white border-0 shadow-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="products-grid-scroll">
            {filteredProducts.length > 0 ? (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id_producto}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-white">
                No se encontraron productos
              </div>
            )}
          </div>
        </Col>

        <Col lg={4}>
          <div className="cart-panel glass-panel">
            <div className="cart-header-compact d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 text-white">
                <FaShoppingCart className="me-2" />
                Carrito
              </h5>
              <Badge pill bg="primary">
                {cartItemsCount}
              </Badge>
            </div>

            <div className="cart-items-list mb-3">
              {cart.map((item) => (
                <CartItem
                  key={item.id_producto}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveFromCart}
                />
              ))}
              {cart.length === 0 && (
                <p className="text-center text-white py-4">Carrito vacío</p>
              )}
            </div>

            <div className="cart-summary p-3 rounded bg-dark-soft">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-white">Total a pagar:</span>
                <h4 className="text-success mb-0">${cartTotal.toFixed(2)}</h4>
              </div>

              <div className="payment-toggle d-flex gap-2 mb-3">
                <Button
                  variant={
                    paymentMethod === "EFECTIVO"
                      ? "primary"
                      : "outline-secondary"
                  }
                  className="flex-grow-1 btn-sm"
                  onClick={() => handlePaymentMethodChange("EFECTIVO")}
                >
                  <FaMoneyBill className="me-1" /> Efectivo
                </Button>
                <Button
                  variant={
                    paymentMethod === "TRANSFERENCIA"
                      ? "primary"
                      : "outline-secondary"
                  }
                  className="flex-grow-1 btn-sm"
                  onClick={() => handlePaymentMethodChange("TRANSFERENCIA")}
                >
                  <FaCreditCard className="me-1" /> Transf.
                </Button>
              </div>

              {showCashInput && (
                <div className="cash-calculation p-2 rounded bg-black-20 mb-3">
                  <Form.Label className="small text-white mb-1">
                    Monto Recibido
                  </Form.Label>
                  <InputGroup size="sm" className="mb-2">
                    <InputGroup.Text className="bg-transparent border-secondary text-white">
                      $
                    </InputGroup.Text>
                    <FormControl
                      type="number"
                      className="bg-transparent text-white border-secondary"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                    />
                  </InputGroup>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="small text-white">Vuelto:</span>
                    <span
                      className={`fw-bold ${changeAmount >= 0 ? "text-info" : "text-danger"}`}
                    >
                      ${changeAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <Button
                variant="success"
                className="w-100 py-2 fw-bold"
                onClick={handleProcessSale}
                disabled={
                  loadingPay || cart.length === 0 || cajaStatus !== "open"
                }
              >
                {loadingPay ? <Spinner size="sm" /> : "FINALIZAR VENTA"}
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default VentasPage;
