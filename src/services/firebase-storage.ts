

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Task, SubTask } from '@/types';

export async function uploadFile(
  file: File,
  crn: string,
  task: Task,
  subTask: SubTask
): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // Create a more organized path: crn/task/subtask/filename
  const filePath = `${crn}/${task}/${subTask}/${file.name}`;
  const storageRef = ref(storage, filePath);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const snapshot = await uploadBytes(storageRef, arrayBuffer, {
      contentType: file.type,
    });
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file to Firebase Storage:', error);
    throw new Error('Could not upload file.');
  }
}
