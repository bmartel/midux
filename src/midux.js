import m from 'mithril';
import { bindActionCreators } from 'redux';

export * from './store';

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
