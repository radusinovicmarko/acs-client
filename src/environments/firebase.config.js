// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCE3EbJaX3hfMBf1BdQCu_MySleYT_dbuQ",
  authDomain: "sni-acs.firebaseapp.com",
  projectId: "sni-acs",
  storageBucket: "sni-acs.appspot.com",
  messagingSenderId: "390802275050",
  appId: "1:390802275050:web:1cd3a1e2e72ff64771f593",
  measurementId: "G-GG2CDSV6KM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export default storage;
