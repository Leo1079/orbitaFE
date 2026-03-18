import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Button,
  Badge,
  Form,
  InputGroup,
  FormControl,
  Modal,
  Spinner,
  Container,
  Row,
  Col,
  Card,
  Table,
} from "react-bootstrap";
import {
  FaSearch,
  FaTrash,
  FaEye,
  FaBan,
  FaReceipt,
  FaCalendarAlt,
  FaDollarSign,
  FaCreditCard,
  FaMoneyBill,
  FaChartLine,
  FaFilter,
  FaArrowLeft,
  FaBox,
} from "react-icons/fa";
import api from "../api/axios";
import Swal from "sweetalert2";
import "./HistorialVentasPage.css";

const HistorialVentasPage = () => {
  const [sales, setSales] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [filterMethod, setFilterMethod] = useState("all");

  // --- Lógica de Negocio (Memoized) ---
  const stats = useMemo(() => {
    if (!sales?.length) return { total: 0, today: 0, completed: 0, annulled: 0 };
    
    const todayStr = new Date().toDateString();
    return sales.reduce((acc, sale) => {
      const saleTotal = Number(sale.total);
      acc.total += saleTotal;
      if (new Date(sale.fecha).toDateString() === todayStr) acc.today += saleTotal;
      sale.anulada ? acc.annulled++ : acc.completed++;
      return acc;
    }, { total: 0, today: 0, completed: 0, annulled: 0 });
  }, [sales]);

  const processedSales = useMemo(() => {
    let filtered = [...sales];
    if (filterMethod !== "all") {
      filtered = filtered.filter(s => s.metodo_pago === filterMethod);
    }
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(sale => 
        sale.id_venta.toString().includes(s) || 
        sale.metodo_pago?.toLowerCase().includes(s)
      );
    }
    return filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [sales, searchTerm, filterMethod]);

  // --- Handlers ---
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/ventas");
      setSales(data);
    } catch (error) {
      Swal.fire("Error", "No se pudo sincronizar el historial", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const handleAnnul = async (id) => {
    const result = await Swal.fire({
      title: "¿Anular Venta?",
      text: "Se revertirá el stock y los montos. Esta acción es irreversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Sí, anular venta",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/ventas/${id}`);
        Swal.fire("¡Hecho!", "Venta anulada correctamente", "success");
        fetchSales();
      } catch (e) {
        Swal.fire("Error", "No se pudo anular la venta", "error");
      }
    }
  };

  const handleViewDetails = async (sale) => {
    setSelectedSale(sale);
    setShowDetails(true);
    setLoadingDetails(true);
    try {
      const { data } = await api.get(`/ventas/${sale.id_venta}/detalles`);
      setSelectedProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <Container fluid className="py-4 px-4 bg-light min-vh-100">
      {/* Header */}
      <header className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-dark text-white p-3 rounded-3 shadow-sm">
            <FaReceipt size={22} />
          </div>
          <div>
            <h2 className="fw-bold mb-0 text-dark">Historial de Ventas</h2>
            <p className="text-muted mb-0">Gestión y auditoría de transacciones</p>
          </div>
        </div>
        <Button variant="white" className="border shadow-sm px-3" onClick={fetchSales}>
          Sincronizar
        </Button>
      </header>

      {/* Stats Section */}
      <Row className="g-3 mb-4">
        <Col md={3}><StatCard label="Total General" value={`$${stats.total.toLocaleString()}`} icon={<FaDollarSign />} color="primary" /></Col>
        <Col md={3}><StatCard label="Ventas de Hoy" value={`$${stats.today.toLocaleString()}`} icon={<FaCalendarAlt />} color="success" /></Col>
        <Col md={3}><StatCard label="Completadas" value={stats.completed} icon={<FaChartLine />} color="info" /></Col>
        <Col md={3}><StatCard label="Anuladas" value={stats.annulled} icon={<FaBan />} color="danger" /></Col>
      </Row>

      {/* Filters Card */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-3">
          <Row className="align-items-center g-3">
            <Col lg={5}>
              <InputGroup className="bg-light rounded-3 border-0">
                <InputGroup.Text className="bg-transparent border-0 ps-3">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <FormControl
                  placeholder="Buscar por ID de venta o método..."
                  className="bg-transparent border-0 py-2 no-focus"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col lg={7} className="d-flex justify-content-lg-end gap-2">
              <FilterBtn active={filterMethod === "all"} onClick={() => setFilterMethod("all")} label="Todas" icon={<FaFilter />} />
              <FilterBtn active={filterMethod === "efectivo"} onClick={() => setFilterMethod("efectivo")} label="Efectivo" icon={<FaMoneyBill />} />
              <FilterBtn active={filterMethod === "transferencia"} onClick={() => setFilterMethod("transferencia")} label="Transferencia" icon={<FaCreditCard />} />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Sales Table */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <Table hover align="middle" className="mb-0 custom-table">
            <thead className="bg-light">
              <tr className="text-muted small text-uppercase">
                <th className="ps-4">ID Venta</th>
                <th>Fecha y Hora</th>
                <th>Método</th>
                <th>Total</th>
                <th>Estado</th>
                <th className="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
              ) : processedSales.map(sale => (
                <tr key={sale.id_venta} className={sale.anulada ? "opacity-50" : ""}>
                  <td className="ps-4 fw-bold">#{sale.id_venta}</td>
                  <td className="text-muted small">{new Date(sale.fecha).toLocaleString()}</td>
                  <td>
                    <Badge bg="light" text="dark" className="border fw-normal">
                      {sale.metodo_pago === "efectivo" ? <FaMoneyBill className="me-1 text-success"/> : <FaCreditCard className="me-1 text-primary"/>}
                      {sale.metodo_pago}
                    </Badge>
                  </td>
                  <td className="fw-bold">${Number(sale.total).toFixed(2)}</td>
                  <td>
                    <Badge pill bg={sale.anulada ? "danger" : "success"}>
                      {sale.anulada ? "ANULADA" : "COMPLETADA"}
                    </Badge>
                  </td>
                  <td className="text-end pe-4">
                    <Button variant="light" size="sm" className="me-2" onClick={() => handleViewDetails(sale)}><FaEye /></Button>
                    {!sale.anulada && (
                      <Button variant="outline-danger" size="sm" onClick={() => handleAnnul(sale.id_venta)}><FaBan /></Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} centered size="lg" contentClassName="border-0 shadow rounded-4">
        <Modal.Header closeButton className="bg-light border-0 px-4">
          <Modal.Title className="fw-bold"><FaReceipt className="me-2"/> Detalle de Venta #{selectedSale?.id_venta}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedSale && (
            <>
              <Row className="mb-4 text-center">
                <Col xs={6} className="border-end">
                  <p className="text-muted small mb-0 text-uppercase">Monto Total</p>
                  <h3 className={`fw-bold ${selectedSale.anulada ? 'text-danger' : 'text-primary'}`}>
                    ${Number(selectedSale.total).toFixed(2)}
                  </h3>
                </Col>
                <Col xs={6}>
                  <p className="text-muted small mb-0 text-uppercase">Método de Pago</p>
                  <h4 className="fw-semibold text-capitalize">{selectedSale.metodo_pago}</h4>
                </Col>
              </Row>

              <div className="bg-light rounded-3 p-3 mb-4">
                <h6 className="fw-bold mb-3"><FaBox className="me-2"/> Artículos</h6>
                {loadingDetails ? <div className="text-center py-3"><Spinner size="sm" animation="border" /></div> : (
                  <Table borderless size="sm" className="mb-0">
                    <thead>
                      <tr className="small text-muted border-bottom">
                        <th>Producto</th>
                        <th className="text-center">Cant.</th>
                        <th className="text-end">Precio</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.map((p, i) => (
                        <tr key={i} className="small">
                          <td className="py-2 fw-semibold">{p.nombre_producto || p.nombre}</td>
                          <td className="py-2 text-center">{p.cantidad}</td>
                          <td className="py-2 text-end">${Number(p.precio_unitario).toFixed(2)}</td>
                          <td className="py-2 text-end fw-bold">${(p.cantidad * p.precio_unitario).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light">
          <Button variant="secondary" onClick={() => setShowDetails(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

// Componentes Auxiliares
const StatCard = ({ label, value, icon, color }) => (
  <Card className="border-0 shadow-sm rounded-4">
    <Card.Body className="d-flex align-items-center gap-3">
      <div className={`bg-${color} bg-opacity-10 text-${color} p-3 rounded-circle`}>{icon}</div>
      <div><h5 className="fw-bold mb-0">{value}</h5><small className="text-muted">{label}</small></div>
    </Card.Body>
  </Card>
);

const FilterBtn = ({ active, onClick, label, icon }) => (
  <Button 
    variant={active ? "dark" : "outline-secondary"} 
    className="rounded-pill px-3 py-1 border-0 shadow-sm d-flex align-items-center gap-2"
    onClick={onClick}
  >
    {icon} {label}
  </Button>
);

export default HistorialVentasPage;