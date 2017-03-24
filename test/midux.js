import 'jsdom-global/register'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import m from 'mithril'
import mq from 'mithril-query'

import {
  defaultMapStateToProps,
  connectStore,
  configureStore,
} from '../src/midux'

const UPDATE_TITLE = 'UPDATE_TITLE'
const UPDATE_MESSAGE = 'UPDATE_MESSAGE'

const testAction = (title) => {
  return {
    type: UPDATE_TITLE,
    title,
  };
}

const testNestedAction = (id, message) => {
  return {
    type: UPDATE_MESSAGE,
    id,
    message,
  };
}

const messageReducer = (state = [], message) => {
  return [
    ...state,
    message
  ]
}

const testReducer = (state = { messages: {}, title: 'default title' }, action) => {
  switch (action.type) {
    case UPDATE_TITLE:
      return {
        ...state,
        title: action.title,
      };
    case UPDATE_MESSAGE:
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.id]: messageReducer(state.messages[action.id], action.message),
        },
      };
    default:
      return state;
  }
}

const testMiddleware = store => next => action => {
  console.log('dispatching', action)
  let result = next(action)
  console.log('next state', store.getState())
  return result
}

const testComponent = {
  view(vnode) {
     const { actions, title } = vnode.attrs

     return m('.testComponent', [
       m('p.title', title),
       m('button#updateTitle', { onclick: () => actions.testAction('updated title') })
     ])
  }
}

const testComponentProps = {
  view(vnode) {
     const { actions, messages, chatId } = vnode.attrs
     return m('.container', [
       m('button#addMessage', { onclick: () => actions.testNestedAction(chatId, 'this is a message') }),
       m('ul', messages.map(msg => m('li.message', msg))),
     ])
  }
}

describe('midux', () => {
  describe('configureStore', () => {
    it('can initialize store with reducers', () => {
      const store = configureStore({
        page: testReducer
      })
      expect(store).to.have.property('dispatch')
      expect(store).to.have.property('subscribe')
    })
    it('can initialize store with middleware', () => {
      const store = configureStore({
        page: testReducer
      }, [
        testMiddleware
      ])
      expect(store).to.have.property('dispatch')
      expect(store).to.have.property('subscribe')
    })
  })
  describe('connectStore', () => {
    it('can initialize store connection', () => {
      const store = configureStore({
        page: testReducer
      }, [
        testMiddleware
      ])
      const connect = connectStore(store)
      expect(connect).to.be.a('function')
    })
    it('can connect component to store', () => {
      const store = configureStore({
        page: testReducer
      }, [
        testMiddleware
      ])
      const connect = connectStore(store)
      const component = connect((state) => state.page)(testComponent)
      const output = mq(m(component));

      expect(output.first('.title')).to.have.property('text').and.equal('default title')
    })
    it('can connect component with action and successfully dispatch an update', () => {
      const store = configureStore({
        page: testReducer
      }, [
        testMiddleware
      ])
      const connect = connectStore(store)
      const component = connect((state) => state.page, { testAction })(testComponent)
      const output = mq(m(component));

      expect(output.first('.title')).to.have.property('text').and.equal('default title')
      output.click('#updateTitle')
      expect(output.first('.title')).to.have.property('text').and.equal('updated title')
    })
    it('can connect nested component with own props that scopes bound data', () => {
      const store = configureStore({
        page: testReducer
      }, [
        testMiddleware
      ])
      const connect = connectStore(store)
      const component = connect((state, props) => {
        console.log(props)
        const messages = state.page.messages[props.chatId] || []
        return {
          messages
        }
      }, { testNestedAction })(testComponentProps)
      const output = mq(m(component, { chatId: 1 }));

      output.should.have(0, '.message');
      output.click('#addMessage')
      output.should.have(1, '.message');

      expect(output.first('.message')).to.have.property('text').and.equal('this is a message')
    })
  })
})
