import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slices/productsSlice';
import cashReducer from './slices/cashSlice';
import expensesReducer from './slices/expensesSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    cash: cashReducer,
    expenses: expensesReducer,
  },
});
