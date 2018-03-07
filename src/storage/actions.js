// TODO: rethink using mime...
// import mime from 'mime/lite';

export const uploadFile = ({ firebase, path, file, metadata, onProgress }) => {
  return new Promise((resolve, reject) => {
    const storageRef = firebase.storage().ref();
    const uploadTask = storageRef.child(path).put(file, metadata);
    uploadTask.on(
      'state_changed',
      snapshot => {
        if (onProgress) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress, snapshot.totalBytes, snapshot.bytesTransferred);
        }

        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED: // or 'paused'
            console.log('Upload is paused');
            break;
          case firebase.storage.TaskState.RUNNING: // or 'running'
            console.log('Upload is running');
            break;
        }
      },
      error => reject(error),
      () => {
        // Handle successful uploads on complete
        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
        const { downloadURL } = uploadTask.snapshot;
        resolve(downloadURL);
      },
    );
  });
};
