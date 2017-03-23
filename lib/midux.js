'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.configureStore = exports.connectStore = exports.defaultMapStateToProps = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _mithril = require('mithril');

var _mithril2 = _interopRequireDefault(_mithril);

var _stream = require('mithril/stream');

var _stream2 = _interopRequireDefault(_stream);

var _redux = require('redux');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var defaultMapStateToProps = exports.defaultMapStateToProps = function defaultMapStateToProps(state, props) {
  return state;
};

/**
 * Connect container component to redux store
 *
 * @param selector
 * @returns {*}
 */
var connectStore = exports.connectStore = function connectStore(store) {
  return function (mapStateToProps) {
    var mapActionCreators = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    return function (component) {
      return {
        oninit: function oninit(vnode) {
          var _this = this;

          this.store = store;
          this.state = (0, _stream2.default)({});
          this.unsubscribe = null;
          this.actions = (0, _redux.bindActionCreators)(mapActionCreators, this.store.dispatch);

          var originalOninit = component.oninit;

          component.oninit = function (vnode) {
            var controllerData = {};

            if (originalOninit) {
              controllerData = originalOninit.call(component, vnode);
            }

            return _extends({}, controllerData);
          };

          this.isSubscribed = function () {
            return typeof _this.unsubscribe === 'function';
          };

          this.trySubscribe = function () {
            if (!_this.isSubscribed()) {
              _this.unsubscribe = _this.store.subscribe(_this.handleUpdate.bind(_this, vnode.attrs));
              _this.handleUpdate(vnode);
            }
          };

          this.tryUnsubscribe = function () {
            if (_this.isSubscribed()) {
              _this.unsubscribe();
              _this.unsubscribe = null;
            }
          };

          this.handleUpdate = function (vnode) {
            if (!_this.isSubscribed()) return true;
            var ownProps = vnode.attrs || {};
            var storeState = mapStateToProps(_this.store.getState(), ownProps);

            _this.state(storeState);
          };

          this.trySubscribe();
        },
        onremove: function onremove(vnode) {
          this.actions = null;
          this.store = null;
          this.state = null;
          this.tryUnsubscribe();
        },
        view: function view(vnode, children) {
          var _vnode$state = vnode.state;
          var config = _vnode$state.config;
          var actions = _vnode$state.actions;
          var state = _vnode$state.state;

          var storeProps = state();

          return (0, _mithril2.default)(component, _extends({ config: config, actions: actions }, storeProps, vnode.attrs), children);
        }
      };
    };
  };
};

/**
* Configure store to use reducers/middleware
*/
var configureStore = exports.configureStore = function configureStore(reducers) {
  var middleware = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  /**
   * Build app state defined by data reducers shape
   */
  var initialState = window.__INITIAL_STATE__ || {};

  /**
   * Create data store from the defined data shape
   */
  return (0, _redux.createStore)((0, _redux.combineReducers)(reducers), initialState, _redux.applyMiddleware.apply(undefined, _toConsumableArray(middleware)));
};