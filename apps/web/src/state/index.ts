import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { updateVersion } from "./global/actions";
import { sentryEnhancer } from "./logging";
import reducer from "./reducer";
import { quickRouteApi } from "./routing/quickRouteSlice";
import { routingApi } from "./routing/slice";

// Configure which parts of the state to persist
const persistConfig = {
  key: "root",
  storage,
  // Only persist essential state slices
  whitelist: ["user", "lists", "connection"],
  // Configure blacklist to exclude large transient data
  blacklist: [
    "routing",
    "logs",
    "swap",
    "burn",
    "mint",
    "wallets",
    "transactions",
  ],
  // Throttle storage writes to prevent performance issues
  throttle: 1000,
};

const persistedReducer = persistReducer(persistConfig, reducer);

export function createDefaultStore() {
  return configureStore({
    reducer: persistedReducer,
    enhancers: (defaultEnhancers) => defaultEnhancers.concat(sentryEnhancer),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: true,
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          warnAfter: 128,
          ignoredActionPaths: [
            "meta.arg",
            "meta.baseQueryMeta",
            "payload.trade",
          ],
          ignoredPaths: [
            routingApi.reducerPath,
            quickRouteApi.reducerPath,
            "logs",
            "lists",
            "transactions.transactions",
          ],
        },
        immutableCheck:
          process.env.NODE_ENV === "test"
            ? false
            : {
                warnAfter: 128,
                ignoredPaths: [routingApi.reducerPath, "logs", "lists"],
              },
      })
        .concat(routingApi.middleware)
        .concat(quickRouteApi.middleware),
  });
}

const store = createDefaultStore();
export const persistor = persistStore(store);

// Add garbage collection for the Redux store
// Clear memory-intensive parts of the state periodically
const REDUX_CLEANUP_INTERVAL = 600000; // 10 minutes
setInterval(() => {
  try {
    // Don't purge the entire store, just clean up transient data
    store.dispatch({
      type: "app/cleanupTransientState",
      payload: { timestamp: Date.now() },
    });
  } catch (e) {
    console.error("Error during Redux state cleanup:", e);
  }
}, REDUX_CLEANUP_INTERVAL);

setupListeners(store.dispatch);

store.dispatch(updateVersion());

export default store;
