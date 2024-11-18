// Importar las funciones necesarias
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, addDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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

// Función para registrar cualquier tipo de usuario
async function registrarUsuario(rol, nombre, cedula, correo, password) {
    try {
        // Crear el usuario en Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, correo, password);
        const user = userCredential.user;

        // Usar el UID como el ID del documento en Firestore
        const docRef = doc(db, "Usuarios", user.uid); // El UID de Firebase Authentication como ID del documento

        // Agregar la información del usuario a Firestore sin agregar el UID como campo
        await setDoc(docRef, {
            nombre: nombre,
            cedula: cedula,
            correo: correo,
            password: password, // Asegúrate de encriptar la contraseña en producción
            rol: rol
            // El UID ya es el ID del documento, por lo que no es necesario incluirlo como campo
        });

        console.log(`${rol} registrado con ID:`, user.uid);
        alert(`${rol} registrado correctamente.`);
    } catch (error) {
        console.error("Error al registrar el usuario: ", error);
        alert("Hubo un error al registrar el usuario. Intente nuevamente.");
    }
}

// Obtener los formularios y agregar eventos
document.getElementById('form-admin').addEventListener('submit', function(event) {
    event.preventDefault();
    const nombre = document.getElementById('nombre-admin').value;
    const cedula = document.getElementById('cedula-admin').value;
    const correo = document.getElementById('correo-admin').value;
    const password = document.getElementById('password-admin').value;
    registrarUsuario(1, nombre, cedula, correo, password);
});

document.getElementById('form-guarda').addEventListener('submit', function(event) {
    event.preventDefault();
    const nombre = document.getElementById('nombre-guarda').value;
    const cedula = document.getElementById('cedula-guarda').value;
    const correo = document.getElementById('correo-guarda').value;
    const password = document.getElementById('password-guarda').value;
    registrarUsuario(2, nombre, cedula, correo, password);
});

document.getElementById('form-usuario').addEventListener('submit', function(event) {
    event.preventDefault();
    const nombre = document.getElementById('nombre-usuario').value;
    const cedula = document.getElementById('cedula-usuario').value;
    const correo = document.getElementById('correo-usuario').value;
    const password = document.getElementById('password-usuario').value;
    registrarUsuario(3, nombre, cedula, correo, password);
});

document.getElementById('form-vehiculo').addEventListener('submit', function(event) {
    event.preventDefault();
    const placa = document.getElementById('placa').value;
    const cedula = document.getElementById('cedula-vehiculo').value;
    const carnet = document.getElementById('carnet-vehiculo').value;
    addVehiculo(placa, cedula, carnet);
});

// Función para registrar un vehículo
async function addVehiculo(placa, cedula, carnet) {
    try {
        const docRef = await addDoc(collection(db, "vehiculos"), {
            placa: placa,
            cedula: cedula,
            carnet: carnet
        });
        console.log("Vehículo registrado con ID:", docRef.id);
        alert("Vehículo registrado correctamente.");
    } catch (error) {
        console.error("Error al registrar el vehículo: ", error);
        alert("Hubo un error al registrar el vehículo.");
    }
}

// Función para alternar la visibilidad de los menús desplegables
function toggleDropdown(dropdownId) {
    const dropdownMenu = document.getElementById(dropdownId);
    const isVisible = dropdownMenu.style.display === 'block';

    // Ocultar todos los menús desplegables
    const allDropdowns = document.querySelectorAll('.dropdown-menu');
    allDropdowns.forEach(menu => {
        menu.style.display = 'none';
    });

    // Mostrar el menú seleccionado si no estaba visible
    if (!isVisible) {
        dropdownMenu.style.display = 'block';
    }
}

// Cerrar el menú desplegable si se hace clic fuera de él
document.addEventListener('click', function(event) {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    dropdowns.forEach(dropdown => {
        if (!dropdown.contains(event.target) && !event.target.closest('.dropdown')) {
            dropdown.style.display = 'none';
        }
    });
});
