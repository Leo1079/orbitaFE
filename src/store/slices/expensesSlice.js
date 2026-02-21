import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios.js';

export const fetchExpenses = createAsyncThunk('expenses/fetchExpenses', async () => {
    const response = await api.get('/gastos');
    return response.data;
});

export const createExpense = createAsyncThunk('expenses/createExpense', async (data) => {
    const response = await api.post('/gastos', data);
    return response.data;
});

const expensesSlice = createSlice({
    name: 'expenses',
    initialState: {
        items: [],
        status: 'idle',
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchExpenses.fulfilled, (state, action) => {
                state.items = action.payload;
                state.status = 'succeeded';
            })
            .addCase(createExpense.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            });
    },
});

export default expensesSlice.reducer;
