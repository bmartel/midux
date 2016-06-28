import * as ud from 'ud';
import { createStore, applyMiddleware, combineReducers } from 'redux';

let module;

export function initModule (m) {
  module = m;
}

export function defn (...args) {
  return ud.defn.apply(ud, [module, ...args]);
}

export function defonce (...args) {
  return ud.defonce.apply(ud, [module, ...args]);
}

export function applyUDMiddleware (...middlewares) {
  const udMiddlwares = middlewares.map(
      (m, i) => defn(m, `applyUDMiddleware:${i}`));
  return applyMiddleware.apply(applyMiddleware, udMiddlwares);
}

export function configureUDStore ({middleware, reducers, state}) {
  const createStoreFromMiddleware =
    defn(middleware, 'createStoreFromMiddleware')(createStore);
  const udReducers = combineUDReducers(reducers);
  const store = createStoreFromMiddleware(udReducers, state);
  return defonce(() => store);
}

function combineUDReducers (reducers) {
  const udReducers = {};
  const keys = Object.keys(reducers);
  let i = keys.length;

  while(i--) {
    const name = keys[i];
    udReducers[name] = defn(reducers[name], `combineUDReducers:${name}`);
  }

  return combineReducers(udReducers);
}
