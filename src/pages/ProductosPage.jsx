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
  FaToggleOff,
  FaBalanceScale,
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

  const handleSearch = useCallback((e) => setSearchTerm(e.target.value), []);

  const handleOpenModal = useCallback((product = null) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        ...product,
        precio: Number(product.precio),
        stock: Number(product.stock)
      });
    } else {
      setCurrentProduct(null);
      setFormData({
        nombre: "",
        precio: 0,
        stock: 0,
        unidad_medida: "UNIDAD",
        activo: 1,
      });
    }
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const schema = currentProduct ? updateProductSchema : productoSchema;

      // Convertimos a número antes de validar por si vienen como string del input
      const dataToValidate = {
        ...formData,
        precio: Number(formData.precio),
        stock: Number(formData.stock)
      };

      const result = schema.safeParse(dataToValidate);
      
      if (!result.success) {
        const errorList = result.error.issues.map((issue) => `<li>${issue.message}</li>`);
        return Swal.fire({
          title: "Campos obligatorios",
          html: `<ul style="text-align: left;">${errorList.join("")}</ul>`,
          icon: "error",
          confirmButtonColor: "#6366f1",
        });
      }

      try {
        if (currentProduct) {
          await dispatch(
            updateProduct({
              id: currentProduct.id_producto,
              data: result.data,
            }),
          ).unwrap();
          Swal.fire("Actualizado", "Producto actualizado con éxito", "success");
        } else {
          await dispatch(createProduct(result.data)).unwrap();
          Swal.fire("Creado", "Producto creado con éxito", "success");
        }
        setShowModal(false);
      } catch (error) {
        Swal.fire(
          "Error",
          error.message || "No se pudo conectar con el servidor",
          "error",
        );
      }
    },
    [currentProduct, formData, dispatch],
  );

  const handleDelete = useCallback(
    async (id) => {
      const result = await Swal.fire({
        title: "¿Desactivar producto?",
        text: "El producto ya no aparecerá en las ventas activas",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#f43f5e",
        cancelButtonColor: "#6366f1",
        confirmButtonText: "Sí, desactivar",
      });

      if (result.isConfirmed) {
        try {
          await dispatch(deleteProduct(id)).unwrap();
          Swal.fire("Éxito", "Producto desactivado", "success");
        } catch (error) {
          Swal.fire("Error", "No se pudo procesar", "error");
        }
      }
    },
    [dispatch],
  );

  const handleToggleActive = useCallback(
    async (id) => {
      const result = await Swal.fire({
        title: "¿Activar producto?",
        text: "El producto volverá a estar disponible",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#6366f1",
        confirmButtonText: "Sí, activar",
      });

      if (result.isConfirmed) {
        try {
          await dispatch(activateProduct(id)).unwrap();
          Swal.fire("Éxito", "Producto activado", "success");
        } catch (error) {
          Swal.fire("Error", "No se pudo procesar", "error");
        }
      }
    },
    [dispatch],
  );

  const filteredItems = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    return items
      ? items.filter((i) => i.nombre.toLowerCase().includes(search))
      : [];
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
    <div className="productos-page">
      <header className="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="icon-wrapper">
            <FaBox className="header-icon" />
          </div>
          <div>
            <h1 className="page-title">Inventario</h1>
            <p className="page-subtitle m-0">Control total de stock y precios</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-light"
            onClick={() => setViewMode(viewMode === "grid" ? "tabla" : "grid")}
          >
            {viewMode === "grid" ? "Vista Tabla" : "Vista Cuadrícula"}
          </Button>
          <Button onClick={() => handleOpenModal()} className="add-product-btn">
            <FaPlus /> Nuevo Producto
          </Button>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard icon={<FaBox />} label="Total" value={stats.total} type="total" />
        <StatCard icon={<FaToggleOn />} label="Activos" value={stats.active} type="active" />
        <StatCard icon={<FaWarehouse />} label="Stock Bajo" value={stats.lowStock} type="warning" />
        <StatCard icon={<FaDollarSign />} label="Valor Total" value={`$${stats.totalValue.toLocaleString()}`} type="value" />
      </section>

      <div className="search-section">
        <InputGroup className="search-input-group">
          <InputGroup.Text className="bg-transparent border-0 text-primary">
            <FaSearch />
          </InputGroup.Text>
          <FormControl
            placeholder="Buscar por nombre de producto..."
            className="search-input"
            value={searchTerm}
            onChange={handleSearch}
          />
        </InputGroup>
      </div>

      <main className="content-section">
        {viewMode === "grid" ? (
          <div className="products-grid">
            {filteredItems.map((item) => (
              <div key={item.id_producto} className="product-item-card">
                <div className="product-header mb-3">
                  <Badge bg={item.activo ? "success" : "secondary"}>
                    {item.activo ? "Activo" : "Inactivo"}
                  </Badge>
                  <div className="d-flex gap-2">
                    <button className="action-btn edit" onClick={() => handleOpenModal(item)}>
                      <FaEdit />
                    </button>
                    <button 
                      className="action-btn delete" 
                      onClick={() => item.activo ? handleDelete(item.id_producto) : handleToggleActive(item.id_producto)}
                    >
                      {item.activo ? <FaTrash /> : <FaToggleOn />}
                    </button>
                  </div>
                </div>
                <div className="product-body text-white">
                  <h5 className="product-name">{item.nombre}</h5>
                  <DetailItem label="Precio" value={`$${Number(item.precio).toFixed(2)}`} />
                  <DetailItem 
                    label="Stock" 
                    value={`${item.stock} ${item.unidad_medida}`} 
                    className={item.stock < 10 ? "stock low" : "stock"} 
                  />
                  <DetailItem label="Subtotal" value={`$${(item.precio * item.stock).toFixed(2)}`} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover m-0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>U. Medida</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id_producto}>
                    <td className="fw-bold">{item.nombre}</td>
                    <td>${Number(item.precio).toFixed(2)}</td>
                    <td className={item.stock < 10 ? "text-warning" : ""}>
                      {item.stock}
                    </td>
                    <td><Badge bg="info">{item.unidad_medida}</Badge></td>
                    <td>
                      <Badge bg={item.activo ? "success" : "secondary"}>
                        {item.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleOpenModal(item)}>
                          <FaEdit />
                        </button>
                        <button 
                          className={`btn btn-sm ${item.activo ? "btn-outline-danger" : "btn-outline-success"}`}
                          onClick={() => item.activo ? handleDelete(item.id_producto) : handleToggleActive(item.id_producto)}
                        >
                          {item.activo ? <FaTrash /> : <FaToggleOn />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal de Formulario */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="modern-modal">
        <Modal.Header closeButton closeVariant="white" className="border-0">
          <Modal.Title>{currentProduct ? "Editar" : "Nuevo"} Producto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Producto</Form.Label>
              <Form.Control
                className="form-control-modern"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </Form.Group>
            
            <div className="row">
              <Form.Group className="col-6 mb-3">
                <Form.Label>Precio ($)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  className="form-control-modern"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="col-6 mb-3">
                <Form.Label>Stock Inicial</Form.Label>
                <Form.Control
                  type="number"
                  className="form-control-modern"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </Form.Group>
            </div>

            <Form.Group className="mb-3">
              <Form.Label><FaBalanceScale className="me-2"/>Unidad de Medida</Form.Label>
              <Form.Select
                className="form-control-modern"
                value={formData.unidad_medida}
                onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
              >
                <option value="UNIDAD">Unidad (U)</option>
                <option value="KG">Kilogramos (KG)</option>
                <option value="METRO">Metros (M)</option>
                <option value="LITRO">Litros (L)</option>
                <option value="BOLSA">Bolsa</option>
              </Form.Select>
            </Form.Group>

            <Button type="submit" className="w-100 submit-btn mt-3">
              {currentProduct ? "Actualizar Producto" : "Registrar Producto"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

// Sub-componentes
const StatCard = ({ icon, label, value, type }) => (
  <div className="stat-card">
    <div className={`stat-icon ${type}`}>{icon}</div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const DetailItem = ({ label, value, className }) => (
  <div className= "detail-item">
    <span className="text-muted small text-white">{label}:</span>
    <span className={`detail-value ${className} fw-bold text-white`}>{value}</span>
  </div>
);

export default ProductosPage;