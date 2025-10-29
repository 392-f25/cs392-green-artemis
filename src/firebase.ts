// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1iTvVrU_5oQFXE-QXr-KVC9ni3BCmgz4",
  authDomain: "artemis-cs392.firebaseapp.com",
  projectId: "artemis-cs392",
  storageBucket: "artemis-cs392.firebasestorage.app",
  messagingSenderId: "325023164643",
  appId: "1:325023164643:web:b3bd753fdccc2ce0acfdd6"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();