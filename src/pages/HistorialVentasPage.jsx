import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Button,
  Badge,
  Form,
  InputGroup,
  FormControl,
  Modal,
  Spinner,
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
} from "react-icons/fa";
import api from "../api/axios";
import Swal from "sweetalert2";
import "./HistorialVentasPage.css";

const HistorialVentasPage = () => {
  const [sales, setSales] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [filterMethod, setFilterMethod] = useState("all");

  // Memoized stats
  const stats = useMemo(() => {
    if (!sales || sales.length === 0) {
      return {
        total: 0,
        today: 0,
        count: 0,
        completed: 0,
        annulled: 0,
        cash: 0,
        transfer: 0,
      };
    }

    const today = new Date().toDateString();
    const total = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const todaySales = sales
      .filter((sale) => new Date(sale.fecha).toDateString() === today)
      .reduce((sum, sale) => sum + Number(sale.total), 0);

    const completed = sales.filter((sale) => !sale.anulada).length;
    const annulled = sales.filter((sale) => sale.anulada).length;
    const cash = sales.filter(
      (sale) => sale.metodo_pago.toLowerCase() == "efectivo",
    ).length;
    const transfer = sales.filter(
      (sale) => sale.metodo_pago.toLowerCase() == "transferencia",
    ).length;
    console.log(sales.filter((sale) => sale.metodo_pago));
    return {
      total,
      today: todaySales,
      count: sales.length,
      completed,
      annulled,
      cash,
      transfer,
    };
  }, [sales]);

  // Memoized filtered sales
  const processedSales = useMemo(() => {
    if (!sales) return [];

    let filtered = sales;

    // Filter by payment method
    if (filterMethod !== "all") {
      filtered = filtered.filter((sale) => sale.metodo_pago === filterMethod);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (sale) =>
          sale.id_venta.toString().includes(lowerSearch) ||
          (sale.metodo_pago &&
            sale.metodo_pago.toLowerCase().includes(lowerSearch)),
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [sales, searchTerm, filterMethod]);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/ventas");
      setSales(response.data);
      setFilteredSales(response.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo cargar el historial", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleAnnul = useCallback(
    async (id) => {
      Swal.fire({
        title: "¿Anular Venta?",
        text: "Esta acción revertirá el stock y los montos. ¿Estás seguro?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, anular",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await api.delete(`/ventas/${id}`);
            Swal.fire("Anulada", "La venta ha sido anulada.", "success");
            fetchSales();
          } catch (error) {
            Swal.fire("Error", error.message || "No se pudo anular", "error");
          }
        }
      });
    },
    [fetchSales],
  );
  const handleViewDetails = useCallback(async (sale) => {
    setSelectedSale(sale);
    setShowDetails(true);
    setLoadingDetails(true);
    setSelectedProducts([]);
    try {
      const response = await api.get(`/ventas/${sale.id_venta}/detalles`);
      setSelectedProducts(response.data);
    } catch (error) {
      console.error("Error al obtener productos:", error);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleFilterChange = useCallback((method) => {
    setFilterMethod(method);
  }, []);

  return (
    <div className="historial-page">
      {/* Header */}
      <div className="page-header">
        <div className="d-flex align-items-center gap-3">
          <div className="icon-wrapper">
            <FaReceipt className="header-icon" />
          </div>
          <div>
            <h1 className="page-title">Historial de Ventas</h1>
            <p className="page-subtitle">
              Revisa todas tus transacciones realizadas
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <div className="stat-value">${stats.total.toFixed(2)}</div>
            <div className="stat-label">Total Ventas</div>
          </div>
        </div>

        <div className="stat-card today">
          <div className="stat-icon">
            <FaCalendarAlt />
          </div>
          <div className="stat-content">
            <div className="stat-value">${stats.today.toFixed(2)}</div>
            <div className="stat-label">Ventas de Hoy</div>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completadas</div>
          </div>
        </div>

        <div className="stat-card annulled">
          <div className="stat-icon">
            <FaBan />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.annulled}</div>
            <div className="stat-label">Anuladas</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-container">
          <InputGroup className="search-input-group">
            <InputGroup.Text className="search-icon">
              <FaSearch />
            </InputGroup.Text>
            <FormControl
              placeholder="Buscar por ID o método de pago..."
              className="search-input"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </InputGroup>
        </div>

        <div className="filter-buttons">
          <Button
            variant={filterMethod === "all" ? "primary" : "outline-secondary"}
            onClick={() => handleFilterChange("all")}
            className="filter-btn"
          >
            <FaFilter /> Todas
          </Button>
          <Button
            variant={
              filterMethod === "efectivo" ? "success" : "outline-secondary"
            }
            onClick={() => handleFilterChange("efectivo")}
            className="filter-btn"
          >
            <FaMoneyBill /> Efectivo
          </Button>
          <Button
            variant={
              filterMethod === "transferencia" ? "info" : "outline-secondary"
            }
            onClick={() => handleFilterChange("transferencia")}
            className="filter-btn"
          >
            <FaCreditCard /> Transferencia
          </Button>
        </div>
      </div>

      {/* Sales List */}
      <div className="sales-container">
        {loading ? (
          <div className="loading-state">
            <Spinner animation="border" className="loading-spinner" />
            <p>Cargando historial de ventas...</p>
          </div>
        ) : processedSales.length > 0 ? (
          <div className="sales-list">
            {processedSales.map((sale) => (
              <div
                key={sale.id_venta}
                className={`sale-item ${sale.anulada ? "annulled" : ""}`}
              >
                <div className="sale-header">
                  <div className="sale-info">
                    <div className="sale-id">#{sale.id_venta}</div>
                    <div className="sale-date">
                      <FaCalendarAlt className="me-1" />
                      {new Date(sale.fecha).toLocaleString()}
                    </div>
                  </div>
                  <div className="sale-status">
                    {sale.anulada ? (
                      <Badge bg="danger" className="status-badge annulled">
                        <FaBan /> ANULADA
                      </Badge>
                    ) : (
                      <Badge bg="success" className="status-badge completed">
                        COMPLETADA
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="sale-body">
                  <div className="sale-details">
                    <div className="detail-item">
                      <span className="detail-label">Método:</span>
                      <span className="detail-value method">
                        {sale.metodo_pago === "efectivo" ? (
                          <>
                            <FaMoneyBill /> Efectivo
                          </>
                        ) : (
                          <>
                            <FaCreditCard /> Transferencia
                          </>
                        )}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Caja:</span>
                      <span className="detail-value">#{sale.id_caja}</span>
                    </div>
                  </div>

                  <div className="sale-amount">
                    <span className="amount-value ${sale.anulada ? 'annulled' : 'positive'}">
                      ${Number(sale.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="sale-actions">
                  <Button
                    size="sm"
                    variant="outline-info"
                    onClick={() => handleViewDetails(sale)}
                    className="action-btn"
                  >
                    <FaEye /> Ver
                  </Button>
                  {!sale.anulada && (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleAnnul(sale.id_venta)}
                      className="action-btn"
                    >
                      <FaBan /> Anular
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FaReceipt />
            </div>
            <h4>No se encontraron ventas</h4>
            <p>
              {searchTerm || filterMethod !== "all"
                ? "Intenta con otros filtros o términos de búsqueda"
                : "No hay ventas registradas aún"}
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        show={showDetails}
        onHide={() => setShowDetails(false)}
        centered
        contentClassName="modern-modal"
        size="lg"
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="modal-title">
            <FaReceipt className="me-2" />
            Detalles de Venta #{selectedSale?.id_venta}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSale && (
            <div className="sale-details-modal">
              <div className="details-header">
                <div className="detail-row">
                  <span className="detail-label">Fecha y Hora:</span>
                  <span className="detail-value">
                    <FaCalendarAlt className="me-1" />
                    {new Date(selectedSale.fecha).toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Estado:</span>
                  <span className="detail-value">
                    {selectedSale.anulada ? (
                      <Badge bg="danger" className="status-badge">
                        <FaBan /> ANULADA
                      </Badge>
                    ) : (
                      <Badge bg="success" className="status-badge">
                        COMPLETADA
                      </Badge>
                    )}
                  </span>
                </div>
              </div>

              <div className="details-body">
                <div className="amount-section">
                  <div className="amount-label">Monto Total</div>
                  <div
                    className={`amount-amount ${selectedSale.anulada ? "annulled" : "positive"}`}
                  >
                    ${Number(selectedSale.total).toFixed(2)}
                  </div>
                </div>

                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-icon">
                      <FaMoneyBill />
                    </div>
                    <div className="info-content">
                      <div className="info-label">Método de Pago</div>
                      <div className="info-value">
                        {selectedSale.metodo_pago === "efectivo"
                          ? "Efectivo"
                          : "Transferencia"}
                      </div>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">
                      <FaReceipt />
                    </div>
                    <div className="info-content">
                      <div className="info-label">ID de Caja</div>
                      <div className="info-value">#{selectedSale.id_caja}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="details-footer">
                <div className="note-section">
                  <div className="note-title mb-3">
                    <FaReceipt className="me-2" />
                    Productos Vendidos
                  </div>

                  <div className="note-content">
                    {loadingDetails ? (
                      <div className="text-center py-4">
                        <Spinner
                          animation="border"
                          variant="primary"
                          size="sm"
                        />
                        <p className="mt-2 small text-muted">
                          Cargando productos...
                        </p>
                      </div>
                    ) : selectedProducts.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover table-sm align-middle">
                          <thead className="table-light">
                            <tr>
                              <th className="ps-3">Producto</th>
                              <th className="text-center">Cant.</th>
                              <th className="text-end">Precio</th>
                              <th className="text-end pe-3">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProducts.map((prod, index) => (
                              <tr key={index}>
                                <td className="ps-3 fw-bold">
                                  {prod.nombre_producto || prod.nombre}
                                </td>
                                <td className="text-center">
                                  <Badge bg="secondary" pill>
                                    {prod.cantidad}
                                  </Badge>
                                </td>
                                <td className="text-end">
                                  ${Number(prod.precio_unitario).toFixed(2)}
                                </td>
                                <td className="text-end pe-3 fw-bold">
                                  $
                                  {(
                                    prod.cantidad * prod.precio_unitario
                                  ).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="table-group-divider">
                            <tr>
                              <td colSpan="3" className="text-end fw-bold ps-3">
                                Total calculado:
                              </td>
                              <td className="text-end pe-3 fw-bold text-primary">
                                $
                                {selectedProducts
                                  .reduce(
                                    (acc, p) =>
                                      acc + p.cantidad * p.precio_unitario,
                                    0,
                                  )
                                  .toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-muted py-3">
                        <em>No se encontraron detalles para esta venta.</em>
                      </p>
                    )}
                  </div>
                </div>  
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-light"
            onClick={() => setShowDetails(false)}
            className="cancel-btn"
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HistorialVentasPage;
