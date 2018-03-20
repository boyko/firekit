import * as collectionTypes from '../collections/types';

// TODO: handle destruction?

export default function snapshots(state = {}, action) {
  const { location } = action;
  switch (action.type) {
    case(collectionTypes.SNAPSHOT_CHANGE):
      return {
        ...state,
        [location]: action.snapshot,
      };
    default:
      return state;
  }
}