// @flow

import type { ThunkAction } from '../flow';

export const uploadFile = (file: Object, opts): ThunkAction =>
  async (dispatch, getState, { firebase }) => {
    const {
      onPause = null,
      onProgressChanged = null,
      uploadPath = null,
      metadata = {},
    } = opts;
    const storageRef = firebase.storage().ref();
    return new Promise((resolve, reject) => {
      const uploadTask = storageRef.child(uploadPath).put(file, metadata);
      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          // TODO: inefficient
          if (onProgressChanged) {
            onProgressChanged(progress, snapshot.totalBytes, snapshot.bytesTransferred);
          }
          switch (snapshot.state) {
            case firebase.storage.TaskState.PAUSED: // or 'paused'
              if (onPause) onPause();
              break;
            case firebase.storage.TaskState.RUNNING: // or 'running'
              break;
          }
        },
        error => {
          reject(error);
        },
        () => {
          uploadTask.snapshot.ref.getDownloadURL()
            .then(downloadURL => resolve(downloadURL));
        },
      );
    });
  };