/* eslint-disable */
import m from 'mithril'
import prop from 'mithril/stream'
import {
  createStore,
  applyMiddleware,
  combineReducers,
  bindActionCreators
} from 'redux'

/**
 * Generates a new action creator for dispatching requests.
 *
 * @param type
 * @param argNames
 * @returns {Function}
 */
export const makeActionCreator = (type, ...argNames) => (...args) => {
  let action = { type }
  argNames.forEach((arg, index) => {
    action[argNames[index]] = args[index]
  })
  return action
}

/**
 *  Generates a new reducer for handling action requests
 *
 * @param initialState
 * @param handlers
 * @returns {Function}
 */
export const createReducer = (initialState, handlers) => (state = initialState, action) => {
  if (handlers.hasOwnProperty(action.type)) {
    return handlers[action.type](state, action)
  } else {
    return state
  }
}

/**
 * Default prop to store mapping
 *
 * @param state
 * @param props
 */
export const defaultMapStateToProps = (state, props) => state

/**
 * Connect container component to redux store
 *
 * @param store
 */
export const connectStore = (store) =>
  (mapStateToProps, mapActionCreators = {}) => (component) => {
  return {
    oninit(vnode) {
      this.store = store
      this.componentState = prop({})
      this.unsubscribe = null
      this.actions = bindActionCreators(mapActionCreators, this.store.dispatch)

      this.isSubscribed = () => typeof this.unsubscribe === 'function'

      this.trySubscribe = () => {
        if (!this.isSubscribed()) {
          this.unsubscribe = this.store.subscribe(this.handleUpdate.bind(this, vnode))
          this.handleUpdate(vnode)
        }
      }

      this.tryUnsubscribe = () => {
        if (this.isSubscribed()) {
          this.unsubscribe()
          this.unsubscribe = null
        }
      }

      this.handleUpdate = (vnode) => {
        if (!this.isSubscribed()) return true
        const ownProps = vnode.attrs || {}
        const storeState = mapStateToProps(this.store.getState(), ownProps)

        this.componentState(storeState)
      }

      this.trySubscribe()
    },

    onremove(vnode) {
      this.actions = null
      this.store = null
      this.componentState = null
      this.tryUnsubscribe()
    },

    view (vnode, children) {
      const actions = this.actions
      const storeProps = this.componentState()

      return m(component, { actions, ...storeProps, ...vnode.attrs}, children)
    }
  }
}

/**
 * Configure store to use reducers/middleware
 *
 * @param reducers
 * @param initialState
 * @param middleware
 * @returns {Store<S>}
 */
export const configureStore = (reducers, initialState = {}, middleware = []) => {
  /**
   * Create data store from the defined data shape
   */
  return createStore(
    combineReducers(reducers),
    initialState,
    applyMiddleware(...middleware)
  )
}
