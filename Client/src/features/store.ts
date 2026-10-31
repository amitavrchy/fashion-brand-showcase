import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { CartLine, Product, User } from '@/lib/types';

const cart = createSlice({
  name: 'cart',
  initialState: { items: [] as CartLine[], open: false },
  reducers: {
    hydrateCart(state, action: PayloadAction<CartLine[]>) {
      state.items = action.payload;
    },
    reconcileCart(state, action: PayloadAction<Product[]>) {
      for (const item of state.items) {
        const product = action.payload.find((p) => p.id === item.productId);
        const variant = product?.variants.find((v) => v.id === item.variantId);
        item.stock = variant?.stock ?? 0;
        if (product) {
          item.price = Number(product.price);
          item.name = product.name;
          item.slug = product.slug;
          item.image = product.media[0]?.url ?? item.image;
        }
        if (variant) {
          item.color = variant.colorName;
          item.size = variant.size;
        }
      }
    },
    addItem(state, action: PayloadAction<CartLine>) {
      const item = state.items.find((i) => i.variantId === action.payload.variantId);
      if (item)
        item.quantity = Math.min(item.quantity + action.payload.quantity, action.payload.stock, 10);
      else state.items.push(action.payload);
      state.open = true;
    },
    setQuantity(state, action: PayloadAction<{ variantId: string; quantity: number }>) {
      const item = state.items.find((i) => i.variantId === action.payload.variantId);
      if (item) item.quantity = Math.max(1, Math.min(action.payload.quantity, item.stock, 10));
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.variantId !== action.payload);
    },
    clearCart(state) {
      state.items = [];
      state.open = false;
    },
    consumeOrder(state, action: PayloadAction<{ variantId: string; quantity: number }[]>) {
      for (const purchased of action.payload) {
        const line = state.items.find((i) => i.variantId === purchased.variantId);
        if (line) line.quantity -= purchased.quantity;
      }
      state.items = state.items.filter((i) => i.quantity > 0);
      state.open = false;
    },
    setCartOpen(state, action: PayloadAction<boolean>) {
      state.open = action.payload;
    },
  },
});
const wishlist = createSlice({
  name: 'wishlist',
  initialState: { ids: [] as string[] },
  reducers: {
    setWishlist(state, action: PayloadAction<string[]>) {
      state.ids = [...new Set(action.payload)];
    },
    toggleWishlist(state, action: PayloadAction<string>) {
      state.ids = state.ids.includes(action.payload)
        ? state.ids.filter((id) => id !== action.payload)
        : [...state.ids, action.payload];
    },
  },
});
const auth = createSlice({
  name: 'auth',
  initialState: { user: null as User | null, ready: false },
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.ready = true;
    },
  },
});
export const {
  hydrateCart,
  reconcileCart,
  addItem,
  setQuantity,
  removeItem,
  clearCart,
  consumeOrder,
  setCartOpen,
} = cart.actions;
export const { setWishlist, toggleWishlist } = wishlist.actions;
export const { setUser } = auth.actions;
export const makeStore = () =>
  configureStore({
    reducer: { cart: cart.reducer, wishlist: wishlist.reducer, auth: auth.reducer },
  });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export const useAppDispatch = useDispatch.withTypes<AppStore['dispatch']>();
export const useAppSelector = useSelector.withTypes<RootState>();
