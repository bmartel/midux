import m from 'mithril';
import * as ud from 'ud';
import { createStore, applyMiddleware, combineReducers, bindActionCreators } from 'redux';

export const defaultMapStateToProps = (state, props) => state;

/**
 * Connect container component to redux store
 *
 * @param selector
 * @returns {*}
 */
export const connectStore = (store) =>
  (mapStateToProps, mapActionCreators={}) => (component) => {
  return {
    controller(props) {
      this.store = store;
      this.state = m.prop({});
      this.unsubscribe = null;
      this.actions = bindActionCreators(mapActionCreators, this.store.dispatch);
      this.config = (el, init, ctx) => {
        if (!init) {
          ctx.onunload = () => {
            console.log('unloading');
            this.actions = null;
            this.store = null;
            this.state = null;
            this.tryUnsubscribe();
          }
        }
      };

      const originalController = component.controller;

      component.controller = (props) => {
        let controllerData = {};

        if (originalController) {
          controllerData = originalController.call(component, props);
        }

        return {
          ...controllerData,
          config: this.config
        }
      };

      this.isSubscribed = () => typeof this.unsubscribe === 'function';

      this.trySubscribe = () => {
        if (!this.isSubscribed()) {
          this.unsubscribe = this.store.subscribe(this.handleUpdate.bind(this, props));
          this.handleUpdate(props);
        }
      };

      this.tryUnsubscribe = () => {
        if (this.isSubscribed()) {
          this.unsubscribe();
          this.unsubscribe = null;
        }
      };

      this.handleUpdate = (props) => {
        if (!this.isSubscribed()) return true;
        const ownProps = props || {};
        const storeState = mapStateToProps(this.store.getState(), ownProps);

        this.state(storeState);
      };

      this.trySubscribe();
    },

    view (ctrl, props, children) {
      const {config, actions, state} = ctrl;
      const storeProps = state();

      return m(component, {config, actions, ...props, ...storeProps}, children);
    }
  }
}


/**
 * Store intializers
 */
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
