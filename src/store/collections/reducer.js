import { update } from 'ramda';
import * as types from './types';

function collection(list = [], action) {
  const { payload, append } = action;
  switch (action.type) {

    case types.INITIALIZE:
      return append ? [...list, ...payload] : payload;

    case types.CHILD_ADDED:
      return [...list, payload];

    case types.CHILD_CHANGED:
      return list.map(child => payload.id === child.id ? payload : child);

    case types.CHILD_REMOVED:
      return list.filter(child => payload.id !== child.id);
    case types.CHILD_REMOVED_MARK: {
      console.log('CHILD REMOVED MARK');
      const removedChild = list.find(child => child.id === payload.id);
      const removedChildIdx = list.indexOf(removedChild);
      const nextList = update(removedChildIdx, payload, list);
      console.log(nextList);
      return nextList;
    }
    case types.GET_COLLECTION:
      return action.payload;

    default:
      return list;
  }
}

export default function collections(state = {}, action) {
  const { location } = action;

  switch (action.type) {
    case types.INITIALIZE:
      return {
        ...state,
        [location]: collection(state[action.location], action),
      };

    case types.CHILD_ADDED:
    case types.CHILD_CHANGED:
    case types.CHILD_REMOVED:
    case types.CHILD_REMOVED_MARK:
      return { ...state, [location]: collection(state[action.location], action) };

    case types.DESTROY:
      const { [location]: omitData, ...rest } = state;
      return { ...rest };

    case types.GET_COLLECTION:
      return { ...state, [location]: collection(state[action.location], action) };

    default:
      return state;
  }
}

