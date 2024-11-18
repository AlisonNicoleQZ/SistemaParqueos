import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import { 
    getFirestore, collection, getDocs, query, where, doc, getDoc
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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

// Selección de elementos
const vehiculosContainer = document.querySelector("#vehiculos-container");
const historialContainer = document.querySelector("#historial-container tbody");

// Función para cargar los vehículos asociados al usuario
async function cargarVehiculos(usuario) {
    try {
        if (!usuario) {
            vehiculosContainer.innerHTML = '<div class="alert alert-warning">Por favor, inicia sesión para ver tus vehículos.</div>';
            return;
        }

        // Usar UID directamente para consultar los vehículos (campo uidUsuario)
        const vehiculosQuery = query(
            collection(db, "vehiculos"),
            where("uidUsuario", "==", usuario.uid) // Filtra por uidUsuario
        );

        const vehiculosSnapshot = await getDocs(vehiculosQuery);

        // Limpiar contenedor de vehículos
        vehiculosContainer.innerHTML = '';

        // Si no hay vehículos registrados
        if (vehiculosSnapshot.empty) {
            vehiculosContainer.innerHTML = '<div class="alert alert-info">No tienes vehículos registrados.</div>';
            return;
        }

        // Mostrar vehículos
        vehiculosSnapshot.forEach((vehiculoDoc) => { 
            const vehiculo = vehiculoDoc.data();
            const vehiculoElement = `
                <div class="vehiculo-card">
                    <h5>Placa: ${vehiculo.placa}</h5>
                    <p>Cédula: ${vehiculo.cedula}</p>
                    <p>Carnet: ${vehiculo.carnet}</p>
                </div>
            `;
            vehiculosContainer.innerHTML += vehiculoElement;
        });
    } catch (error) {
        console.error("Error al cargar los vehículos:", error);
        vehiculosContainer.innerHTML = `<div class="alert alert-danger">Error al cargar los vehículos. Por favor, intenta nuevamente.</div>`;
    }
}

// Función para cargar el historial de entradas y salidas
async function cargarHistorial(usuario) {
    try {
        if (!usuario) {
            historialContainer.innerHTML = '<tr><td colspan="5" class="text-center text-warning">Por favor, inicia sesión para ver el historial.</td></tr>';
            return;
        }

        // Usar UID directamente para consultar el historial (campo uidUsuario)
        const usosQuery = query(
            collection(db, "Usos"),
            where("uidUsuario", "==", usuario.uid) // Filtra por uidUsuario
        );

        const historialSnapshot = await getDocs(usosQuery);

        // Limpiar la tabla antes de agregar nuevos datos
        historialContainer.innerHTML = '';

        // Si no hay historial
        if (historialSnapshot.empty) {
            historialContainer.innerHTML = '<tr><td colspan="5" class="text-center text-info">No hay registros de entradas o salidas.</td></tr>';
            return;
        }

        // Mostrar historial
        for (const historialDoc of historialSnapshot.docs) {
            const registro = historialDoc.data();
            const fechaEntrada = new Date(registro.fechaEntrada.seconds * 1000).toLocaleString("es-CR");

            // Verificar si fechaSalida existe y no es igual a 0
            let fechaSalida = "Aún no registrado";
            if (registro.fechaSalida && registro.fechaSalida !== 0) {
                fechaSalida = new Date(registro.fechaSalida.seconds * 1000).toLocaleString("es-CR");
            }

            // Obtener el nombre del parqueo utilizando el parqueoId desde la colección 'parqueos'
            const parqueoDoc = await getDoc(doc(db, "parqueos", registro.parqueoId)); // Consulta al parqueo
            const parqueoNombre = parqueoDoc.exists() ? parqueoDoc.data().nombre : "Desconocido";

            const fila = `
                <tr>
                    <td>${registro.placa}</td>
                    <td>${fechaEntrada}</td>
                    <td>${fechaSalida}</td>
                    <td>${parqueoNombre}</td> <!-- Mostrar el nombre del parqueo -->
                </tr>
            `;
            historialContainer.innerHTML += fila;
        }
    } catch (error) {
        console.error("Error al cargar el historial:", error);
        historialContainer.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar el historial. Por favor, intenta nuevamente.</td></tr>';
    }
}

// Llamar a las funciones cuando el estado de la autenticación cambie
onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
        // El usuario está autenticado, cargar los datos
        cargarVehiculos(usuario); // Cargar los vehículos del usuario
        cargarHistorial(usuario); // Cargar el historial de entradas y salidas
    } else {
        // El usuario no está autenticado, mostrar mensaje
        vehiculosContainer.innerHTML = '<div class="alert alert-warning">Por favor, inicia sesión para ver tus vehículos.</div>';
        historialContainer.innerHTML = '<tr><td colspan="5" class="text-center text-warning">Por favor, inicia sesión para ver el historial.</td></tr>';
    }
});
