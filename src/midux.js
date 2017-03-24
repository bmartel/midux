/* eslint-disable */
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
  return {
    oninit(vnode) {
      this.store = store;
      this.componentState = prop({});
      this.unsubscribe = null;
      this.actions = bindActionCreators(mapActionCreators, this.store.dispatch);

      this.isSubscribed = () => typeof this.unsubscribe === 'function';

      this.trySubscribe = () => {
        if (!this.isSubscribed()) {
          this.unsubscribe = this.store.subscribe(this.handleUpdate.bind(this, vnode));
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

        this.componentState(storeState);
      };

      this.trySubscribe();
    },

    onremove(vnode) {
      this.actions = null;
      this.store = null;
      this.componentState = null;
      this.tryUnsubscribe();
    },

    view (vnode, children) {
      const actions = this.actions;
      const storeProps = this.componentState();

      return m(component, { actions, ...storeProps, ...vnode.attrs}, children);
    }
  }
}

/**
* Configure store to use reducers/middleware
*/
export const configureStore = (reducers, middleware = []) => {
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
