import * as docsTypes from './types';


export default function uploads(state = {}, action) {
  const { path, id } = action;

  switch (action.type) {
    case docsTypes.UPLOAD_START:
      return {
        ...state,
        [action.payload.id]: {
          progress: 0,
          success: null,
          error: null,
        },
      };
    case docsTypes.UPLOAD_PROGRESS:
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          progress: payload.progress,
        },
      };
    case docsTypes.UPLOAD_SUCCESS:
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          progress: 100,
          success: true,
        },
      };
    case docsTypes.UPLOAD_ERROR:
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          error: action.error,
        },
      };
    case docsTypes.UPLOAD_REMOVE: {
      const {
        [action.payload.id]: omit,
        ...rest,
      } = state;
      return rest;
    }
    default:
      return state;
  }
}
