// @flow

type Action = {
  type: string,
  payload?: any
}

type PromiseAction = Promise<Action>
type Dispatch = (action: Action | ThunkAction | PromiseAction) => any
type GetState = () => Object

type thunkExtra = {
  firebase: Object,
  callApi: (Object) => Promise<any>,
  client: Object,
}

export type ThunkAction = (dispatch: Dispatch, getState: GetState, extra: thunkExtra) => any