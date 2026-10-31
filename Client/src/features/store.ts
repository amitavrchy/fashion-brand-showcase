import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { CartLine, User } from '@/lib/types';

const cart = createSlice({ name: 'cart', initialState: { items: [] as CartLine[], open: false }, reducers: {
  hydrateCart(state, action: PayloadAction<CartLine[]>) { state.items = action.payload; },
  addItem(state, action: PayloadAction<CartLine>) {
    const item = state.items.find(i => i.variantId === action.payload.variantId);
    if (item) item.quantity = Math.min(item.quantity + action.payload.quantity, action.payload.stock, 10);
    else state.items.push(action.payload);
    state.open = true;
  },
  setQuantity(state, action: PayloadAction<{ variantId: string; quantity: number }>) {
    const item = state.items.find(i => i.variantId === action.payload.variantId);
    if (item) item.quantity = Math.max(1, Math.min(action.payload.quantity, item.stock, 10));
  },
  removeItem(state, action: PayloadAction<string>) { state.items = state.items.filter(i => i.variantId !== action.payload); },
  clearCart(state) { state.items = []; state.open = false; },
  setCartOpen(state, action: PayloadAction<boolean>) { state.open = action.payload; },
} });
const wishlist = createSlice({ name: 'wishlist', initialState: { ids: [] as string[] }, reducers: {
  setWishlist(state, action: PayloadAction<string[]>) { state.ids = [...new Set(action.payload)]; },
  toggleWishlist(state, action: PayloadAction<string>) { state.ids = state.ids.includes(action.payload) ? state.ids.filter(id => id !== action.payload) : [...state.ids, action.payload]; },
} });
const auth = createSlice({ name: 'auth', initialState: { user: null as User | null, ready: false }, reducers: {
  setUser(state, action: PayloadAction<User | null>) { state.user = action.payload; state.ready = true; },
} });
export const { hydrateCart, addItem, setQuantity, removeItem, clearCart, setCartOpen } = cart.actions;
export const { setWishlist, toggleWishlist } = wishlist.actions;
export const { setUser } = auth.actions;
export const makeStore = () => configureStore({ reducer: { cart: cart.reducer, wishlist: wishlist.reducer, auth: auth.reducer } });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export const useAppDispatch = useDispatch.withTypes<AppStore['dispatch']>();
export const useAppSelector = useSelector.withTypes<RootState>();
