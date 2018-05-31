import * as types from './types';
import * as selectors from './selectors';
import * as initSelectors from '../initialization/selectors';
import { logError } from '../errors/actions';
import { logLoading, clearLoading } from '../loadings/actions';

export const valueChanged = (value, location, path, locationValue) => {
  return {
    type: types.VALUE_CHANGED,
    payload: value,
    path,
    location,
    locationValue,
  };
};

export const startWatch = (location, path, locationValue) => {
  return {
    type: types.WATCH_START,
    path,
    location,
    locationValue,
  };
};

export const getStart = (location, path) => {
  return {
    type: types.GET_START,
    path,
    location,
  };
};

export const getError = (location, path, error) => {
  return {
    type: types.GET_ERROR,
    path,
    location,
    error,
  };
};

export const getSuccess = (location, path, payload) => {
  return {
    type: types.GET_SUCCESS,
    path,
    location,
    payload,
  };
};

export const startWatchNonexisting = (location, path, locationValue) => {
  return {
    type: types.WATCH_NONEXISTING,
    path,
    location,
    locationValue,
  };
};

export const destroy = (location) => {
  return {
    type: types.DESTROY,
    location,
  };
};

export const unWatch = (path) => {
  return {
    type: types.UNWATCH,
    path,
  };
};

const getRef = (firebaseApp, path) => {
  if (typeof path === 'string' || path instanceof String) {
    return firebaseApp.firestore().doc(path);
  }
  else {
    return path;
  }
};

const getLocation = (firebaseApp, path) => {
  if (typeof path === 'string' || path instanceof String) {
    return path;
  } else {
    try {
      return path.path;
    }
    catch (error) {
      // TODO: check path
      throw new Error('Invalid path');
    }
  }
};

const defaultWatchOpts = { reduxPath: null, unwatchIfNotExist: false };

export function watchDoc(firebasePath, opts) {
  const nextOpts = { ...defaultWatchOpts, ...opts };
  const { reduxPath, unwatchIfNotExist } = nextOpts;

  return (dispatch, getState, { firebase }) => {
    const ref = getRef(firebase, firebasePath);
    const { path } = ref;
    const location = reduxPath || getLocation(firebase, firebasePath);

    const isInitialized = initSelectors.isInitialised(getState(), location);

    dispatch(startWatch(location, path));

    return new Promise((resolve) => {
      if (!isInitialized) {
        dispatch(logLoading(location));
        const unsub = ref.onSnapshot(doc => {
              if (doc.exists) {
                dispatch(valueChanged(doc.data(), location, path, unsub));
                resolve(doc.data());
              }
              else {
                if (unwatchIfNotExist) {
                  unwatchDoc(firebaseApp, path, { reduxPath });
                }
                dispatch(startWatchNonexisting(location, path, unsub));
                dispatch(clearLoading(location));
              }
              resolve(null);
            },
            error => {
              console.log(error);
              dispatch(logError(location, error));
            });
      }
      else {
        resolve();
      }
    });
  };
}

export function destroyDoc(firebaseApp, path, reduxPath = false) {
  const location = reduxPath || path;

  // TODO: location and path?
  return dispatch => {
    unwatchDoc(firebaseApp, path, { reduxPath });
    dispatch(unWatch(path));
    dispatch(destroy(location));
  };
}

export function unwatchAllDocs(firebaseApp) {
  return (dispatch, getState) => {
    const allInitializations = selectors.getAllInitializations(getState());

    Object.keys(allInitializations).forEach(key => {
      dispatch(unwatchDoc(firebaseApp, key));
    });
  };
}

export function destroyAllDocs(firebaseApp) {
  return dispatch => {
    dispatch(unwatchAllDocs(firebaseApp));
    dispatch({ type: types.DESTROY_ALL });
  };
}


export function getDoc(firebaseApp, firebasePath, opts) {
  const nextOpts = { ...defaultWatchOpts, ...opts };
  const { reduxPath } = nextOpts;
  const ref = getRef(firebaseApp, firebasePath);
  const { path } = ref;
  const location = reduxPath || getLocation(firebaseApp, firebasePath);

  return (dispatch, getState) => {
    dispatch(getStart(location, path));
    return ref.get()
        .then(doc => {
          if (doc.exists) {
            dispatch(getSuccess(location, path, doc.data()));
          }
          else {
            dispatch(getError(location, path, 'Document not found'));
          }
        })
        .catch(error => dispatch(getError(location, path, error)));
  };
}

export function unwatchDoc(firebaseApp, path, opts) {

  let reduxPath;

  if (opts) {
    reduxPath = opts.reduxPath;
  }

  return (dispatch, getState) => {
    // const location = reduxPath ? reduxPath : path;
    const location = path;
    const allInitializations = selectors.getAllInitializations(getState());
    const unsubs = allInitializations[path];

    // TODO: this will unload all watcher under a path!
    if (unsubs) {
      Object.keys(unsubs).map((key) => {
        const unsub = unsubs[key];
        if (typeof unsub === 'function') {
          unsub();
        }
        dispatch(unWatch(location));
      });
    }
  };
}
