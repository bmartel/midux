import m from 'mithril';
import prop from 'mithril/stream';
import {
  createStore,
  applyMiddleware,
  combineReducers,
  bindActionCreators
} from 'redux';

export const defaultMapStateToProps = (state, props) => state;

/**
 * Connect container component to redux store
 *
 * @param selector
 * @returns {*}
 */
export const connectStore = (store) =>
  (mapStateToProps, mapActionCreators = {}) => (component) => {
  console.log('MIDUX:connectStore store %o, component %o', store, component);
  return {
    oninit(vnode) {
      console.log('MIDUX:connectStore oninit vnode %o', vnode);
      this.store = store;
      this.state = prop({});
      this.unsubscribe = null;
      this.actions = bindActionCreators(mapActionCreators, this.store.dispatch);

      const originalOninit = component.oninit;

      component.oninit = (vnode) => {
        let controllerData = {};

        if (originalOninit) {
          controllerData = originalOninit.call(component, vnode);
        }

        return {
          ...controllerData
        }
      };

      this.isSubscribed = () => typeof this.unsubscribe === 'function';

      this.trySubscribe = () => {
        if (!this.isSubscribed()) {
          this.unsubscribe = this.store.subscribe(this.handleUpdate.bind(this, vnode.attrs));
          this.handleUpdate(vnode);
        }
      };

      this.tryUnsubscribe = () => {
        if (this.isSubscribed()) {
          this.unsubscribe();
          this.unsubscribe = null;
        }
      };

      this.handleUpdate = (vnode) => {
        if (!this.isSubscribed()) return true;
        const ownProps = vnode.attrs || {};
        const storeState = mapStateToProps(this.store.getState(), ownProps);

        this.state(storeState);
      };

      this.trySubscribe();
    },

    onremove(vnode) {
      this.actions = null;
      this.store = null;
      this.state = null;
      this.tryUnsubscribe();
    },

    view (vnode, children) {
      console.log('MIDUX:connectStore view vnode %o', vnode);
      const { config, actions, state } = vnode.state;
      const storeProps = state();

      return m(component, { config, actions, ...storeProps, ...vnode.attrs}, children);
    }
  }
}

/**
* Configure store to use reducers/middleware
*/
export const configureStore = (reducers, middleware = []) => {
  console.log('MIDUX:configureStore store reducers %o, middleware %o', reducers, middleware);
  /**
   * Build app state defined by data reducers shape
   */
  const initialState = window.__INITIAL_STATE__ || {};

  /**
   * Create data store from the defined data shape
   */
  return createStore(
    combineReducers(reducers),
    initialState,
    applyMiddleware(...middleware)
  );
}
