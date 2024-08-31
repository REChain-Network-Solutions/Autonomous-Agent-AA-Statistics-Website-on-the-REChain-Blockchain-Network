import {
  AnyAction,
  combineReducers,
  configureStore,
  ThunkDispatch,
} from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { aastatsAPI } from './AAstats';
import { ModalStackReducer } from './ModalStack';
import { rechainApi, REChainReducer } from './REChain';
import { SnackStackReducer } from './SnackStack';
import { UIReducer } from './UI';

const UIPersistConfig = {
  key: 'ui',
  storage,
  whitelist: ['darkMode', 'homeLayouts', 'agentLayouts'],
};

const REChainPersistConfig = {
  key: 'rechain',
  storage,
  whitelist: ['assetsCache', 'agentsCache'],
};

const rootReducer = combineReducers({
  modalStack: ModalStackReducer,
  snackStack: SnackStackReducer,
  ui: persistReducer(UIPersistConfig, UIReducer),
  rechain: persistReducer(REChainPersistConfig, REChainReducer),
  [aastatsAPI.reducerPath]: aastatsAPI.reducer,
  [rechainApi.reducerPath]: rechainApi.reducer,
});

const appStore = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      aastatsAPI.middleware,
      rechainApi.middleware
    ),
});

export const persistor = persistStore(appStore);
export type TRootState = ReturnType<typeof appStore.getState>;
export type AppStore = typeof appStore;
export type TAppDispatch = ThunkDispatch<TRootState, null, AnyAction>;
export const useAppDispatch = (): TAppDispatch => useDispatch<TAppDispatch>();
export const useAppSelector: TypedUseSelectorHook<TRootState> = useSelector;
export default appStore;
