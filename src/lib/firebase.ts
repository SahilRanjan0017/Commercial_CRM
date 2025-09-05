// This file is intentionally left blank. 
// After running the generator, it will be populated with your Firebase project's configuration.
// It is used to initialize the Firebase client-side SDK.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "flowtrack-ib0q9",
  "appId": "1:650640906018:web:1e46b0849803c143a3b77b",
  "storageBucket": "flowtrack-ib0q9.appspot.com",
  "apiKey": "AIzaSyBOWI-qxMaSjHo7ycrSncvuwBiLTUJcAIs",
  "authDomain": "flowtrack-ib0q9.firebaseapp.com",
  "measurementId": "G-5512S52P1B",
  "messagingSenderId": "650640906018"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(app);

export { app, storage };
