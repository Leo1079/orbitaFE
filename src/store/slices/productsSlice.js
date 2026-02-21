import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios.js";

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async () => {
    const response = await api.get("/productos");
    return response.data;
  },
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData) => {
    const response = await api.post("/productos", productData);
    return response.data;
  },
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, data }) => {
    const { nombre, precio, stock, unidad_medida, activo } = data;

    const cleanData = {
      nombre,
      precio,
      stock,
      unidad_medida,
      activo,
    };
    const response = await api.patch(`/productos/${id}`, cleanData);
    return response.data;
  },
);
export const activateProduct = createAsyncThunk(
  "products/activateProduct",
  async (id) => {
    const id_producto = id;
    await api.patch(`/productos/activate/${id_producto}`);
    return { id_producto, activo: 1 };
  },
);
export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id) => {
    await api.delete(`/productos/${id}`);
    return id;
  },
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    status: "idle", // idle, loading, succeeded, failed
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (p) => p.id_producto === action.payload.id_producto,
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(activateProduct.fulfilled, (state, action) => {
        state.items.find(
          (p) => p.id_producto === action.payload.id_producto,
        ).activo = action.payload.activo;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (p) => p.id_producto !== action.payload,
        );
      });
  },
});

export default productsSlice.reducer;
