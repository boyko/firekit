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

export const childRemovedMark = (child, location) => {
  return {
    type: types.CHILD_REMOVED_MARK,
    payload: {
      ...child,
      __removed: true,
    },
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

export const getLocation = (firebaseApp, path) => {
  if (typeof path === 'string' || path instanceof String) {
    return path;
  } else {
    return getPath(firebaseApp, path);
  }
};


const defaultWatchColOpts = {
  reduxPath: false,
  append: false,
  query: null,
  overrideQuery: false,
  keepDeleted: true,
  preprocess: null,
};

export function watchCol(firebaseApp, firebasePath, opts = {}) {
  const nextOpts = { ...defaultWatchColOpts, ...opts };
  const { query, reduxPath, overrideQuery, keepDeleted, preprocess } = nextOpts;
  let ref = getRef(firebaseApp, firebasePath);
  const { path } = ref;

  if (query) {
    ref = query;
  }

  const location = reduxPath || getLocation(firebaseApp, firebasePath);

  return (dispatch, getState) => {
    const isInitialized = initSelectors.isInitialised(getState(), path, location);
    let initialized = false;
    // TODO: check override query!
    if (!isInitialized || overrideQuery) {
      if (isInitialized) {
        // TODO: check if this removes the query listener...
        isInitialized();
      }
      dispatch(logLoading(location));
      return new Promise((resolve, reject) => {
        const unsub = ref.onSnapshot(
          snapshot => {
            dispatch(snapshotChange(location, snapshot));
            dispatch(clearLoading(location));
            snapshot.docChanges().forEach(change => {
              if (change.type === 'added') {
                const data = preprocess ? preprocess(change.doc.data()) : change.doc.data();
                if (initialized) {
                  dispatch(childAdded({
                    id: change.doc.id,
                    data,
                  }, location));
                }
                else {
                  const data = preprocess ? preprocess(change.doc.data()) : change.doc.data();
                  initialized = true;
                  dispatch(initialize([{
                    id: change.doc.id,
                    data,
                  }], location, path, unsub));
                }
              }
              if (change.type === 'modified') {
                const data = preprocess ? preprocess(change.doc.data()) : change.doc.data();
                dispatch(childChanged({
                  id: change.doc.id,
                  data,
                }, location));
              }
              if (change.type === 'removed') {
                if (keepDeleted) {
                  const data = preprocess ? preprocess(change.doc.data()) : change.doc.data();
                  dispatch(childRemovedMark({
                    id: change.doc.id,
                    data,
                  }, location));
                }
                else {
                  const data = preprocess ? preprocess(change.doc.data()) : change.doc.data();
                  dispatch(childRemoved({
                    id: change.doc.id,
                    data: {
                      ...data,
                      __deleted: true,
                    },
                  }, location));
                }
              }
            });
            resolve();
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
    return ref.get(querySnapshot => {
        const data = [];
        querySnapshot.forEach(doc => {
          data.push({ id: doc.id, data: doc.data() });
        });
        dispatch({ type: types.GET_COLLECTION, payload: data, location, opts: nextOpts });
      },
      error => {
        console.log(error);
      },
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

    Object.keys(allColls).forEach(function (key, index) {
      unwatchCol(firebaseApp, key);
      dispatch(destroyCol(firebaseApp, allColls[index]));
    });
  };
}
