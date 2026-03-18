import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  activateProduct,
} from "../store/slices/productsSlice";
import {
  Button,
  Modal,
  Form,
  Badge,
  InputGroup,
  FormControl,
  Row,
  Col,
  Card,
  Table,
  Container,
} from "react-bootstrap";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaBox,
  FaDollarSign,
  FaWarehouse,
  FaToggleOn,
  FaBalanceScale,
  FaThLarge,
  FaTable,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "./ProductosPage.css";
import { productoSchema } from "../schemas/schemasProducts/products.schemas";
import { updateProductSchema } from "../schemas/schemasProducts/updateProduct.schemas";

const ProductosPage = () => {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.products);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("tabla");

  const [formData, setFormData] = useState({
    nombre: "",
    precio: 0,
    stock: 0,
    unidad_medida: "UNIDAD",
    activo: 1,
  });

  useEffect(() => {
    if (status === "idle") dispatch(fetchProducts());
  }, [status, dispatch]);

  // --- Handlers y Lógica (Se mantienen igual a tu original) ---
  const handleOpenModal = useCallback((product = null) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({ ...product, precio: Number(product.precio), stock: Number(product.stock) });
    } else {
      setCurrentProduct(null);
      setFormData({ nombre: "", precio: 0, stock: 0, unidad_medida: "UNIDAD", activo: 1 });
    }
    setShowModal(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const schema = currentProduct ? updateProductSchema : productoSchema;
    const dataToValidate = { ...formData, precio: Number(formData.precio), stock: Number(formData.stock) };
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const errorList = result.error.issues.map((issue) => `<li>${issue.message}</li>`);
      return Swal.fire({
        title: "Campos obligatorios",
        html: `<ul style="text-align: left;">${errorList.join("")}</ul>`,
        icon: "error",
      });
    }

    try {
      if (currentProduct) {
        await dispatch(updateProduct({ id: currentProduct.id_producto, data: result.data })).unwrap();
        Swal.fire("¡Éxito!", "Producto actualizado", "success");
      } else {
        await dispatch(createProduct(result.data)).unwrap();
        Swal.fire("¡Éxito!", "Producto creado", "success");
      }
      setShowModal(false);
    } catch (error) {
      Swal.fire("Error", error.message || "Error de servidor", "error");
    }
  };

  const filteredItems = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    return items ? items.filter((i) => i.nombre.toLowerCase().includes(search)) : [];
  }, [items, searchTerm]);

  const stats = useMemo(() => {
    const base = { total: 0, active: 0, lowStock: 0, totalValue: 0 };
    if (!items) return base;
    return items.reduce((acc, item) => {
      acc.total++;
      if (item.activo) acc.active++;
      if (item.stock < 10) acc.lowStock++;
      acc.totalValue += Number(item.precio) * Number(item.stock);
      return acc;
    }, base);
  }, [items]);

  return (
    <Container fluid className="py-4 px-4 bg-light min-vh-100">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary text-white p-3 rounded-3 shadow">
            <FaBox size={24} />
          </div>
          <div>
            <h2 className="fw-bold mb-0 text-dark">Inventario</h2>
            <p className="text-muted mb-0">Control de existencias y valorización</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="white" 
            className="shadow-sm border d-flex align-items-center gap-2"
            onClick={() => setViewMode(viewMode === "grid" ? "tabla" : "grid")}
          >
            {viewMode === "grid" ? <FaTable /> : <FaThLarge />}
            <span className="d-none d-md-inline">{viewMode === "grid" ? "Ver Tabla" : "Ver Cuadrícula"}</span>
          </Button>
          <Button variant="primary" className="shadow-sm d-flex align-items-center gap-2 px-4" onClick={() => handleOpenModal()}>
            <FaPlus /> Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <StatCard color="primary" icon={<FaBox />} label="Total Productos" value={stats.total} />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard color="success" icon={<FaToggleOn />} label="Activos" value={stats.active} />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard color="warning" icon={<FaWarehouse />} label="Stock Bajo" value={stats.lowStock} />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard color="dark" icon={<FaDollarSign />} label="Valor Inventario" value={`$${stats.totalValue.toLocaleString()}`} />
        </Col>
      </Row>

      {/* Search & Content */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Body className="p-0">
          <div className="p-3 border-bottom bg-white">
            <InputGroup className="bg-light rounded-3 border-0">
              <InputGroup.Text className="bg-transparent border-0 ps-3">
                <FaSearch className="text-muted" />
              </InputGroup.Text>
              <FormControl
                placeholder="Buscar por nombre de producto..."
                className="bg-transparent border-0 py-2 no-focus"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="p-0">
            {viewMode === "tabla" ? (
              <div className="table-responsive">
                <Table hover align="middle" className="mb-0">
                  <thead className="bg-light">
                    <tr className="text-muted small text-uppercase">
                      <th className="ps-4">Producto</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>U. Medida</th>
                      <th>Estado</th>
                      <th className="text-end pe-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id_producto}>
                        <td className="ps-4 fw-bold">{item.nombre}</td>
                        <td>${Number(item.precio).toFixed(2)}</td>
                        <td>
                           <span className={item.stock < 10 ? "text-danger fw-bold" : ""}>
                            {item.stock}
                           </span>
                        </td>
                        <td><Badge bg="info" className="fw-normal">{item.unidad_medida}</Badge></td>
                        <td>
                          <Badge pill bg={item.activo ? "success" : "secondary"}>
                            {item.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="text-end pe-4">
                          <Button variant="link" className="text-primary p-1" onClick={() => handleOpenModal(item)}><FaEdit /></Button>
                          <Button 
                            variant="link" 
                            className={item.activo ? "text-danger p-1" : "text-success p-1"}
                            onClick={() => item.activo ? handleDelete(item.id_producto) : handleToggleActive(item.id_producto)}
                          >
                            {item.activo ? <FaTrash /> : <FaToggleOn />}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <Row xs={1} md={2} xl={4} className="g-3 p-4">
                {filteredItems.map((item) => (
                   <Col key={item.id_producto}>
                      <Card className="h-100 border shadow-sm hover-card">
                        <Card.Body>
                          <div className="d-flex justify-content-between mb-2">
                             <Badge bg={item.activo ? "success" : "secondary"}>{item.activo ? "Activo" : "Inactivo"}</Badge>
                             <small className="text-muted">ID: #{item.id_producto}</small>
                          </div>
                          <h6 className="fw-bold">{item.nombre}</h6>
                          <div className="mt-3">
                            <div className="d-flex justify-content-between small mb-1">
                               <span>Precio:</span><span className="fw-bold">${item.precio}</span>
                            </div>
                            <div className="d-flex justify-content-between small mb-1">
                               <span>Stock:</span>
                               <span className={item.stock < 10 ? "text-danger fw-bold" : "fw-bold"}>
                                 {item.stock} {item.unidad_medida}
                               </span>
                            </div>
                          </div>
                        </Card.Body>
                        <Card.Footer className="bg-transparent border-top-0 d-flex gap-2">
                           <Button variant="outline-primary" size="sm" className="w-100" onClick={() => handleOpenModal(item)}><FaEdit /> Editar</Button>
                           <Button 
                             variant={item.activo ? "outline-danger" : "outline-success"} 
                             size="sm" 
                             className="w-100"
                             onClick={() => item.activo ? handleDelete(item.id_producto) : handleToggleActive(item.id_producto)}
                           >
                             {item.activo ? <FaTrash /> : "Activar"}
                           </Button>
                        </Card.Footer>
                      </Card>
                   </Col>
                ))}
              </Row>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Modal Re-estilizado */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="md">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{currentProduct ? "Editar" : "Nuevo"} Producto</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4 px-4 pb-4">
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Nombre del Producto</Form.Label>
              <Form.Control
                className="py-2 border-2 no-focus"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Precio ($)</Form.Label>
                  <Form.Control
                    type="number" step="0.01" className="py-2 border-2 no-focus"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Stock Inicial</Form.Label>
                  <Form.Control
                    type="number" className="py-2 border-2 no-focus"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold">Unidad de Medida</Form.Label>
              <Form.Select
                className="py-2 border-2 no-focus"
                value={formData.unidad_medida}
                onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
              >
                <option value="UNIDAD">Unidad (U)</option>
                <option value="KG">Kilogramos (KG)</option>
                <option value="LITRO">Litros (L)</option>
              </Form.Select>
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100 py-2 fw-bold shadow-sm">
              {currentProduct ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

// Sub-componentes
const StatCard = ({ icon, label, value, color }) => (
  <Card className="border-0 shadow-sm rounded-4 h-100">
    <Card.Body className="d-flex align-items-center gap-3">
      <div className={`bg-${color} bg-opacity-10 text-${color} p-3 rounded-circle`}>
        {icon}
      </div>
      <div>
        <h5 className="fw-bold mb-0">{value}</h5>
        <small className="text-muted">{label}</small>
      </div>
    </Card.Body>
  </Card>
);

export default ProductosPage;