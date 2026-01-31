// Configuración de Firebase - ¡REEMPLAZA CON TUS PROPIAS CREDENCIALES!
const firebaseConfig = {
  apiKey: "AIzaSyDFS0rFpwMlVib7PpUo4FDw-L_fs9fOGxM",
  authDomain: "emerald-star.firebaseapp.com",
  projectId: "emerald-star",
  storageBucket: "emerald-star.firebasestorage.app",
  messagingSenderId: "247848581120",
  appId: "1:247848581120:web:f2e69ab283c40a48b040e5",
  measurementId: "G-PKRBZX6ZQ4"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Referencias a las colecciones
const reservaCollection = db.collection("reserva");
const diasReservaDoc = reservaCollection.doc("diasdereservas");

console.log("Firebase configurado correctamente");