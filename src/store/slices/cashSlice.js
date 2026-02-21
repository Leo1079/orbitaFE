import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios.js";

export const getCashRegister = createAsyncThunk(
  "cash/getCashRegister",
  async (id) => {
    const response = await api.get(`/caja/${id}`);
    return response.data;
  },
);

export const openCashRegister = createAsyncThunk(
  "cash/openCash",
  async (data) => {
    const response = await api.post("/caja/abrir", data);
    return response.data; 
  },
);

export const closeCashRegister = createAsyncThunk(
  "cash/closeCash",
  async (data) => {
    const response = await api.post("/caja/cerrar", data);
    return response.data;
  },
);

export const getActiveCash = createAsyncThunk(
  "cash/getActiveCash",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/caja/activa");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const cashSlice = createSlice({
  name: "cash",
  initialState: {
    status: "unknown",
    data: null,
    currentCajaId: localStorage.getItem("currentCajaId") || null,
    loading: false,
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCashRegister.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        if (action.payload) {
          state.status = action.payload.estado === "ABIERTA" ? "open" : "closed";
          state.currentCajaId = action.payload.id_caja;
       
          if (state.status === "open") {
            localStorage.setItem("currentCajaId", action.payload.id_caja);
          }
        }
      })
      .addCase(getActiveCash.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        if (action.payload && action.payload.estado === "ABIERTA") {
          state.status = "open";
          state.currentCajaId = action.payload.id_caja;
      
          localStorage.setItem("currentCajaId", action.payload.id_caja);
        } else {
          state.status = "closed";
          state.currentCajaId = null;
          localStorage.removeItem("currentCajaId");
        }
      })
      .addCase(openCashRegister.fulfilled, (state, action) => {
        state.status = "open";

        const newId = action.payload.id_caja || action.payload;
        state.currentCajaId = newId;
      
        localStorage.setItem("currentCajaId", newId);
      })
      .addCase(closeCashRegister.fulfilled, (state) => {
        state.status = "closed";
        state.currentCajaId = null;
        state.data = null;
        localStorage.removeItem("currentCajaId");
      })
      .addCase(getActiveCash.rejected, (state) => {
        state.status = "closed";
        state.currentCajaId = null;
        localStorage.removeItem("currentCajaId");
      });
  },
});

export const { resetError } = cashSlice.actions;
export default cashSlice.reducer;