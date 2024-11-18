import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, query, where, updateDoc } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
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

// Función para obtener los vehículos registrados
async function obtenerVehiculos() {
    const vehiculosCollection = collection(db, "vehiculos");
    const vehiculosSnapshot = await getDocs(vehiculosCollection);
    const vehiculosSelect = document.getElementById('placa-ingreso'); 

    if (vehiculosSelect) {
        vehiculosSnapshot.forEach(doc => {
            const vehiculo = doc.data();
            const option = document.createElement('option');
            option.value = vehiculo.placa;
            option.textContent = vehiculo.placa;
            vehiculosSelect.appendChild(option);
        });
    } else {
        console.error('El elemento con id "placa-ingreso" no se encontró en el DOM');
    }
}

// Función para obtener los parqueos disponibles
async function obtenerParqueos() {
    const parqueosCollection = collection(db, "parqueos");
    const parqueosSnapshot = await getDocs(parqueosCollection);
    const parqueosSelect = document.getElementById('parqueo-id-ingreso'); 

    if (parqueosSelect) {
        parqueosSnapshot.forEach(doc => {
            const parqueo = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = parqueo.nombre;
            parqueosSelect.appendChild(option);
        });
    } else {
        console.error('El elemento con id "parqueo-id-ingreso" no se encontró en el DOM');
    }
}

// Función para registrar un ingreso de vehículo
async function registrarIngreso(placa, parqueoId) {
    try {
        // Consultar si el vehículo está registrado
        const vehiculosCollection = collection(db, "vehiculos");
        const q = query(vehiculosCollection, where("placa", "==", placa));
        const vehiculosSnapshot = await getDocs(q);

        if (vehiculosSnapshot.empty) {
            alert("El vehículo no está registrado en la base de datos.");
            return;
        }

        // Verificar la disponibilidad del parqueo
        const parqueosCollection = collection(db, "parqueos");
        const parqueoDocRef = doc(db, "parqueos", parqueoId);
        const parqueoSnapshot = await getDoc(parqueoDocRef);

        if (!parqueoSnapshot.exists()) {
            alert("El parqueo no existe.");
            return;
        }

        const parqueoData = parqueoSnapshot.data();
        console.log("Datos del parqueo:", parqueoData);  // Ver los datos del parqueo

        const capacidad = parqueoData.capacidad;
        let ocupados = parqueoData.ocupados;

        // Verificar si hay espacio disponible
        if (ocupados >= capacidad) {
            alert("No hay espacio disponible en este parqueo.");
            return;
        }

        // Registrar el ingreso en la colección "entradas" con el parqueoId
        const ingresoDocRef = await addDoc(collection(db, "entradas"), {
            placa: placa,
            parqueoId: parqueoId,  // Guardamos el parqueoId en la entrada
            tipo: "entrada",
            fecha: new Date()
        });

        console.log("Ingreso registrado con ID:", ingresoDocRef.id);

        // Actualizar la ocupación del parqueo
        if (typeof ocupados === 'number' && ocupados < capacidad) {
            // Incrementamos el número de ocupados
            const nuevaOcupacion = ocupados + 1;
            await updateDoc(parqueoDocRef, {
                ocupados: nuevaOcupacion
            });

            console.log("Ocupación del parqueo actualizada:", nuevaOcupacion);
        } else {
            console.error("El campo 'ocupados' no es un número válido o ya está lleno.");
            alert("Hubo un error al actualizar la ocupación del parqueo.");
            return;
        }

        alert("Ingreso registrado correctamente.");
    } catch (error) {
        console.error("Error al registrar ingreso: ", error.message);
        alert("Hubo un error al registrar el ingreso.");
    }
}

// Función para registrar la salida de un vehículo
async function registrarSalida(placa) {
    try {
        // Consultar la entrada del vehículo para obtener el parqueo donde está
        const entradasCollection = collection(db, "entradas");
        const qEntradas = query(entradasCollection, where("placa", "==", placa), where("tipo", "==", "entrada"));
        const entradasSnapshot = await getDocs(qEntradas);

        if (entradasSnapshot.empty) {
            alert("El vehículo no tiene una entrada registrada.");
            return;
        }

        let parqueoId;
        entradasSnapshot.forEach(doc => {
            parqueoId = doc.data().parqueoId;  // Obtener el parqueoId
        });

        // Verificar la existencia del parqueo
        const parqueoDocRef = doc(db, "parqueos", parqueoId);
        const parqueoSnapshot = await getDoc(parqueoDocRef);
        
        if (!parqueoSnapshot.exists()) {
            alert("El parqueo no existe.");
            return;
        }

        const parqueoData = parqueoSnapshot.data();
        let ocupados = parqueoData.ocupados;

        // Eliminar la entrada del vehículo
        entradasSnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
            console.log("Entrada eliminada:", doc.id);
        });

        // Actualizar la ocupación del parqueo
        if (typeof ocupados === 'number' && ocupados > 0) {
            const nuevaOcupacion = ocupados - 1;
            await updateDoc(parqueoDocRef, { ocupados: nuevaOcupacion });
            console.log("Ocupación del parqueo actualizada:", nuevaOcupacion);
        }

        // Registrar la salida
        const salidaDocRef = await addDoc(collection(db, "salidas"), {
            placa: placa,
            parqueoId: parqueoId,
            tipo: "salida",
            fecha: new Date()
        });

        console.log("Salida registrada con ID:", salidaDocRef.id);
        alert("Salida registrada correctamente.");
    } catch (error) {
        console.error("Error al registrar salida: ", error.message);
        alert("Hubo un error al registrar la salida.");
    }
}

// Función para obtener las placas de vehículos que han ingresado
async function obtenerPlacasSalida() {
    const entradasCollection = collection(db, "entradas");
    const entradasSnapshot = await getDocs(entradasCollection);
    const placasSelect = document.getElementById('placa-salida'); 

    if (placasSelect) {
        placasSelect.innerHTML = '<option value="">Selecciona una placa</option>'; // Limpiar las opciones previas
        entradasSnapshot.forEach(doc => {
            const entrada = doc.data();
            const option = document.createElement('option');
            option.value = entrada.placa;
            option.textContent = entrada.placa;
            placasSelect.appendChild(option);
        });
    } else {
        console.error('El elemento con id "placa-salida" no se encontró en el DOM');
    }
}

// Función para alternar la visibilidad de los menús desplegables
function toggleDropdown(dropdownId) {
    const dropdownMenu = document.getElementById(dropdownId);
    const isVisible = dropdownMenu.style.display === 'block';

    const allDropdowns = document.querySelectorAll('.dropdown-menu');
    allDropdowns.forEach(menu => {
        menu.style.display = 'none';
    });

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

// Obtener los formularios y agregar eventos
document.getElementById('form-ingreso').addEventListener('submit', function(event) {
    event.preventDefault();
    const placa = document.getElementById('placa-ingreso').value;
    const parqueoId = document.getElementById('parqueo-id-ingreso').value;
    registrarIngreso(placa, parqueoId);
});

document.getElementById('form-salida').addEventListener('submit', function(event) {
    event.preventDefault();
    const placa = document.getElementById('placa-salida').value;
    const parqueoId = document.getElementById('parqueo-id-salida').value;
    registrarSalida(placa, parqueoId);
});

// Espera a que el DOM esté completamente cargado antes de ejecutar cualquier función
document.addEventListener('DOMContentLoaded', () => {
    obtenerVehiculos();
    obtenerParqueos();
});
