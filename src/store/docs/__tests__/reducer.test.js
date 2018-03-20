import { expect } from 'chai';
import reducer from '../reducer';
import * as actions from '../actions';
import types from '../types';

const initialState = {};

describe('docs reducer', () => {
  it('should return the initial state', () => {
    const initialState = reducer(undefined, { type: 'INIT' });
    expect(Object.keys(initialState)).to.have.length(0);
  });
  it('handles VALUE_CHANGED', () => {
    const changeAction = {
      type: types.VALUE_CHANGED,
      location: 'test/some_key',
      payload: 'test_payload',
    };
    const state = reducer(undefined, changeAction);
    expect(state).to.have.property('test');
    expect(state.test).to.have.property('some_key', 'test_payload');
  });
  it('handles DESTROY', () => {
    const changeAction0 = {
      type: types.VALUE_CHANGED,
      location: 'test/some_key',
      payload: 'test_payload',
    };
    const changeAction1 = {
      type: types.VALUE_CHANGED,
      location: 'test/some_key1',
      payload: 'test_payload1',
    };
    let state = reducer(undefined, changeAction0);
    state = reducer(state, changeAction1);

    const destroyAction = {
      type: types.DESTROY,
      location: 'test/some_key',
    };

    const nextState = reducer(state, destroyAction);
    expect(nextState).to.have.property('test');
    expect(nextState.test).to.have.property('some_key1');
    expect(nextState.test).to.not.have.property('some_key');
  });
});
