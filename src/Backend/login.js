// Importar Firebase y las funciones necesarias
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDl_TT0BmD5F1iBQO7kiy9O8FN4ig6dBz0",
  authDomain: "sistema-parqueos.firebaseapp.com",
  projectId: "sistema-parqueos",
  storageBucket: "sistema-parqueos.appspot.com",
  messagingSenderId: "105950355460",
  appId: "1:105950355460:web:a691a1760bf194038f5551"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Función para limpiar el formulario de inicio de sesión
function resetLoginForm() {
  document.getElementById('login-form').reset();
}

// Función para verificar rol del usuario y redirigir
async function checkUserRole(uid) {
  const userDoc = await getDoc(doc(db, "Usuarios", uid));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    switch (userData.rol) {
      case 1: // Admin
        alert("Bienvenido Administrador");
        window.location.href = "../Frontend/Admin.html";
        break;
      case 2: // Guarda
        alert("Bienvenido Guarda");
        window.location.href = "../Frontend/Guarda.html";
        break;
      case 3: // Usuario
        alert("Bienvenido Usuario");
        window.location.href = "../Frontend/Usuario.html";
        break;
      default:
        alert("Rol no reconocido. Contacte al administrador del sistema.");
        await signOut(auth);
    }
  } else {
    alert("Usuario no encontrado en el sistema.");
    await signOut(auth);
  }
}

// Manejar inicio de sesión con correo y contraseña
document.getElementById('login-form').addEventListener('submit', async function(event) {
  event.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await checkUserRole(user.uid); // Verificar rol después de iniciar sesión
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      alert('Correo no registrado. Verifique sus credenciales.');
    } else if (error.code === 'auth/wrong-password') {
      alert('Contraseña incorrecta. Inténtelo de nuevo.');
    } else {
      alert('Error al iniciar sesión: ' + error.message);
    }
    resetLoginForm(); // Limpiar el formulario en caso de error
  }
});
