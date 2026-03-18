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
  Card,
  Container,
  Stack,
} from "react-bootstrap";
import {
  FaShoppingCart,
  FaSearch,
  FaMoneyBill,
  FaCreditCard,
  FaStore,
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

  const cartTotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.subtotal, 0),
    [cart],
  );
  const cartItemsCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.cantidad, 0),
    [cart],
  );

  const changeAmount = useMemo(() => {
    const received = parseFloat(cashReceived) || 0;
    return received > 0 ? received - cartTotal : 0;
  }, [cashReceived, cartTotal]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const active = products.filter((p) => p.activo);
    if (!searchTerm.trim()) return active;
    return active.filter((p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [products, searchTerm]);

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
      }
      return [
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
    <Container fluid className="px-4 bg-light min-vh-70">
      {/* Header Estilo Dashboard */}
      <Card className="border-0 shadow-sm mb-4 overflow-hidden">
        <Card.Body className="px-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary text-white p-3 rounded-3 shadow-sm">
                <FaStore size={24} />
              </div>
              <div>
                <h4 className="mb-0 fw-bold text-dark">Punto de Venta</h4>
                <small className="text-muted">Orbita POS v1.0</small>
              </div>
            </div>

            <Badge
              pill
              bg={cajaStatus === "open" ? "success" : "danger"}
              className="px-3 py-2 fw-semibold shadow-sm"
            >
              <span className="me-2">•</span>
              {cajaStatus === "open" ? "CAJA ABIERTA" : "CAJA CERRADA"}
            </Badge>
          </div>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {/* Sección de Productos */}
        <Col lg={8}>
          <div className="mb-4">
            <InputGroup className="shadow-sm border-0 bg-white rounded-pill overflow-hidden px-3">
              <InputGroup.Text className="bg-white border-0 text-muted">
                <FaSearch />
              </InputGroup.Text>
              <FormControl
                placeholder="Busca por nombre o código de barras..."
                className="border-0 py-3 no-focus"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="product-grid-container">
            {filteredProducts.length > 0 ? (
              <Row xs={1} md={2} xl={3} className="g-3">
                {filteredProducts.map((product) => (
                  <Col key={product.id_producto}>
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center py-5 opacity-50">
                <FaSearch size={50} className="mb-3" />
                <h5>No se encontraron productos</h5>
              </div>
            )}
          </div>
        </Col>

        {/* Sección del Carrito */}
        <Col lg={4}>
          <Card
            className="border-0 shadow sticky-top"
            style={{ top: "2rem", height: "calc(100vh - 100px)" }}
          >
            <Card.Header className="bg-white border-bottom-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <FaShoppingCart className="text-primary" /> Carrito
                </h5>
                <Badge bg="primary" pill>
                  {cartItemsCount} items
                </Badge>
              </div>
            </Card.Header>

            <Card.Body className="overflow-auto py-0">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <CartItem
                    key={item.id_producto}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveFromCart}
                  />
                ))
              ) : (
                <div className="text-center mt-5 opacity-25">
                  <FaShoppingCart size={80} />
                  <p className="mt-2 fw-bold text-uppercase">Carrito Vacío</p>
                </div>
              )}
            </Card.Body>

            <Card.Footer className="bg-white border-top-0 p-4">
              <Stack gap={3}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted h6 mb-0">Total a pagar:</span>
                  <span className="h3 fw-bold text-success mb-0">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>

                <div className="d-flex gap-2">
                  <Button
                    variant={
                      paymentMethod === "EFECTIVO"
                        ? "primary"
                        : "outline-primary"
                    }
                    className="w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                    onClick={() => handlePaymentMethodChange("EFECTIVO")}
                  >
                    <FaMoneyBill /> Efectivo
                  </Button>
                  <Button
                    variant={
                      paymentMethod === "TRANSFERENCIA"
                        ? "primary"
                        : "outline-primary"
                    }
                    className="w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                    onClick={() => handlePaymentMethodChange("TRANSFERENCIA")}
                  >
                    <FaCreditCard /> Transf.
                  </Button>
                </div>

                {paymentMethod === "EFECTIVO" && (
                  <div className="bg-light p-3 rounded-3">
                    <Form.Group className="mb-2">
                      <Form.Label className="small fw-bold text-muted">
                        Monto Recibido
                      </Form.Label>
                      <InputGroup size="lg">
                        <InputGroup.Text className="bg-white border-end-0 text-success fw-bold">
                          $
                        </InputGroup.Text>
                        <FormControl
                          type="number"
                          className="border-start-0 no-focus"
                          placeholder="0.00"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small fw-bold text-muted">Vuelto:</span>
                      <span
                        className={`fw-bold h5 mb-0 ${changeAmount >= 0 ? "text-primary" : "text-danger"}`}
                      >
                        ${changeAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  variant="success"
                  size="lg"
                  className="w-100 py-3 fw-bold shadow mt-2"
                  onClick={handleProcessSale}
                  disabled={
                    loadingPay || cart.length === 0 || cajaStatus !== "open"
                  }
                >
                  {loadingPay ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    "FINALIZAR VENTA"
                  )}
                </Button>
              </Stack>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VentasPage;
