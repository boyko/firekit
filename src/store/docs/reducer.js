import setWith from 'lodash/setWith';
import omit from 'lodash/omit';
import * as types from './types';

export default function docs(state = {}, action) {
  const { location } = action;

  switch (action.type) {
    case types.GET_SUCCESS:
    case types.VALUE_CHANGED:
      return setWith(state, location.replace('/', '.'), action.payload);

    case types.DESTROY:
      return omit(state, location.replace('/', '.'), action.payload);
    // const { [location]: omitData, ...rest } = state;
    // return { ...rest };

    case types.DESTROY_ALL:
      return {};

    default:
      return state;
  }
}
