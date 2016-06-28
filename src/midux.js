import m from 'mithril';
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
* Configure store to use reducers/middleware
*/
export const configureStore = (reducers, middleware=[]) => {

  /**
   * Configure app middleware based on environment
   */
  const createStoreWithMiddleware = applyMiddleware(...middleware)(createStore);

  /**
   * Build app state defined by data reducers
   */
  const appState = combineReducers(reducers);

  /**
   * Create data store from the defined data shape
   */
  return createStoreWithMiddleware(appState);
}
