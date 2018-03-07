import * as types from './types';
import * as selectors from './selectors';
import * as initSelectors from '../initialization/selectors';
import { logError } from '../errors/actions';
import { logLoading, clearLoading } from '../loadings/actions';

export const initialize = (list, location, path, locationValue, append) => {
  return {
    type: types.INITIALIZE,
    payload: list,
    path,
    location,
    append,
    locationValue,
  };
};

export const snapshotChange = (location, snapshot) => {
  return {
    type: types.SNAPSHOT_CHANGE,
    location,
    snapshot,
  };
};


export const childAdded = (child, location) => {
  return {
    type: types.CHILD_ADDED,
    payload: child,
    location,
  };
};

export const childChanged = (child, location) => {
  return {
    type: types.CHILD_CHANGED,
    payload: child,
    location,
  };
};

export const childRemoved = (child, location) => {
  return {
    type: types.CHILD_REMOVED,
    payload: child,
    location,
  };
};

export const destroy = location => {
  return {
    type: types.DESTROY,
    location,
  };
};

export const unWatch = path => {
  return {
    type: types.UNWATCH,
    path,
  };
};

const getPath = (firebaseApp, ref) => {
  return ref.path;
};

const getRef = (firebaseApp, path) => {
  if (typeof path === 'string' || path instanceof String) {
    return firebaseApp.firestore().collection(path);
  } else {
    return path;
  }
};

const getLocation = (firebaseApp, path) => {
  if (typeof path === 'string' || path instanceof String) {
    return path;
  } else {
    return getPath(firebaseApp, path);
  }
};


const defaultWatchColOpts = { reduxPath: false, append: false, query: null };

export function watchCol(firebaseApp, firebasePath, opts = {}) {
  const nextOpts = { ...defaultWatchColOpts, ...opts };
  const { query, reduxPath } = nextOpts;
  let ref = getRef(firebaseApp, firebasePath);
  const { path } = ref;

  if (query) {
    ref = query;
  }

  const location = reduxPath || getLocation(firebaseApp, firebasePath);

  return (dispatch, getState) => {
    const isInitialized = initSelectors.isInitialised(getState(), path, location);
    let initialized = false;
    if (!isInitialized) {
      dispatch(logLoading(location));
      return new Promise((resolve, reject) => {
        const unsub = ref.onSnapshot(
          snapshot => {
            dispatch(snapshotChange(location, snapshot));
            dispatch(clearLoading(location));
            snapshot.docChanges.forEach(change => {
              if (change.type === 'added') {
                if (initialized) {
                  dispatch(childAdded({
                    id: change.doc.id,
                    data: change.doc.data(),
                  }, location));
                }
                else {
                  initialized = true;
                  dispatch(initialize([{
                    id: change.doc.id,
                    data: change.doc.data(),
                  }], location, path, unsub));
                }
              }
              if (change.type === 'modified') {
                dispatch(childChanged({
                  id: change.doc.id,
                  data: change.doc.data(),
                }, location));
              }
              if (change.type === 'removed') {
                dispatch(childRemoved({
                  id: change.doc.id,
                  data: change.doc.data(),
                }, location));
              }
              resolve();
            });
          }
          ,
          error => {
            dispatch(logError(location, error));
            console.log(error);
            reject();
          },
        );
      });
    }
  };
}

export function getCol(firebaseApp, firebasePath, opts = {}) {
  const nextOpts = { ...defaultWatchColOpts, ...opts };
  const { query, reduxPath } = nextOpts;
  let ref = getRef(firebaseApp, firebasePath);
  const { path } = ref;

  if (query) {
    ref = query;
  }

  const location = reduxPath || getLocation(firebaseApp, firebasePath);

  return (dispatch, getState) => {
    const handleError = error => {
      console.log(error);
    };
    ref.get(
      querySnapshot => {

        const data = [];
        querySnapshot.forEach(doc => {
          data.push({ id: doc.id, data: doc.data() });
        });
        dispatch({ type: types.GET_COLLECTION, payload: data, location });
      },
      handleError,
    );
  };
}


export function unwatchCol(firebaseApp, firebasePath) {

  return (dispatch, getState) => {
    const location = firebasePath;
    const allInitializations = selectors.getAllInitializations(getState());
    const unsubs = allInitializations[location];

    if (unsubs) {
      Object.keys(unsubs).map(key => {
        const unsub = unsubs[key];
        if (typeof unsub === 'function') {
          unsub();
        }
        dispatch(unWatch(location));
      });
    }

  };
}

export function destroyCol(firebaseApp, firebasePath, reduxPath = false) {
  return (dispatch, getState) => {
    const location = reduxPath || getLocation(firebaseApp, firebasePath);
    const locations = getState().initialization[location];

    dispatch(unWatch(location));
    dispatch(destroy(location));

    if (reduxPath) {
      dispatch(destroy(reduxPath));
      unwatchCol(firebaseApp, reduxPath);
    } else if (locations) {
      Object.keys(locations).forEach(location => {
        unwatchCol(firebaseApp, location);
        dispatch(destroy(location));
      });
    }

  };
}


export function unwatchAllCol(firebaseApp, path) {
  return (dispatch, getState) => {
    const allLists = selectors.getAllCols(getState());

    Object.keys(allLists).forEach((key, index) => {
      unwatchCol(firebaseApp, key);
      dispatch(unWatch(key));
    });
  };
}

export function unwatchAllCols(firebaseApp, path) {
  return (dispatch, getState) => {
    const allColls = selectors.getAllCols(getState());

    Object.keys(allColls).forEach((key, index) => {
      unwatchCol(firebaseApp, key);
      dispatch(destroyCol(firebaseApp, allColls[index]));
    });
  };
}
