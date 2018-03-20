export function isLoaded(state, path, location) {
  if (typeof state.loading !== 'undefined' && state.loading[path]) {
    return state.loading[path].loaded;
  }

  return false;
}

export function isLoading(state, path, location) {
  if (typeof state.loading !== 'undefined' && state.loading[path]) {
    return state.loading[path].loading;
  }

  return false;
}

export function exists(state, path, location) {
  if (typeof state.loading !== 'undefined' && state.loading[path]) {
    return !state.loading[path].nonexisting;
  }

  return false;
}