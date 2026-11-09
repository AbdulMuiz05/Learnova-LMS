import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthState {
  user: User | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  user: null,
  status: 'loading',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = 'authenticated';
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
    setGuest(state) {
      state.user = null;
      state.status = 'guest';
    },
    clearCredentials(state) {
      state.user = null;
      state.status = 'guest';
    },
  },
});

export const { setCredentials, updateUser, setGuest, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
