import * as listsTypes from '../lists/types';
import * as pathsTypes from '../paths/types';
import * as docsTypes from '../docs/types';
import * as collectionsTypes from '../collections/types';
import * as initializationTypes from '../initialization/types';


function locations(state = [], action, loadingState) {
  const { path, location, } = action;
  return {
    ...state, [location]: loadingState,
  };
}

export default function loading(state = {}, action) {
  const { path, location } = action;

  switch (action.type) {
    case docsTypes.WATCH_START:
      return {
        ...state,
        [path]: locations(state[path], action, { loading: true, nonexisting: false, loaded: false }),
      };
    case docsTypes.WATCH_NONEXISTING:
      return {
        ...state,
        [path]: locations(state[path], action, { loading: false, nonexisting: true, loaded: false }),
      };

    case docsTypes.VALUE_CHANGED:
      return {
        ...state,
        [path]: locations(state[path], action, { loading: false, nonexisting: false, loaded: true }),
      };

    case initializationTypes.CLEAR_INITIALIZATION:
      return {};

    case docsTypes.DESTROY:
    case docsTypes.UNWATCH:
      let { [path]: omit, ...rest } = state;
      return { ...rest };

    default:
      return state;
  }
}
