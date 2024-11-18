// Importar las funciones necesarias
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, addDoc, setDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
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
    try {
        const vehiculosCollection = collection(db, "vehiculos");
        const vehiculosSnapshot = await getDocs(vehiculosCollection);
        const vehiculosSelect = document.getElementById('placa-ingreso');

        if (vehiculosSelect) {
            vehiculosSelect.innerHTML = '<option value="">Selecciona una placa</option>';
            vehiculosSnapshot.forEach(doc => {
                const vehiculo = doc.data();
                const option = document.createElement('option');
                option.value = vehiculo.placa;
                option.textContent = vehiculo.placa;
                vehiculosSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error al obtener vehículos:", error);
    }
}

// Función para obtener los parqueos disponibles
async function obtenerParqueos() {
    try {
        const parqueosCollection = collection(db, "parqueos");
        const parqueosSnapshot = await getDocs(parqueosCollection);
        const parqueosSelect = document.getElementById('parqueo-id-ingreso');

        if (parqueosSelect) {
            parqueosSelect.innerHTML = '<option value="">Selecciona un parqueo</option>';
            parqueosSnapshot.forEach(doc => {
                const parqueo = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = parqueo.nombre;
                parqueosSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error al obtener parqueos:", error);
    }
}

async function registrarIngreso(placa, parqueoId) {
    try {
        const usosCollection = collection(db, "Usos");

        // Verificar si ya hay una entrada sin salida registrada para esa placa
        const q = query(
            usosCollection,
            where("placa", "==", placa),
            where("tipo", "==", "entrada"),
            where("fechaSalida", "==", 0)  // Salida pendiente
        );
        const usosSnapshot = await getDocs(q);

        if (!usosSnapshot.empty) {
            showAlert("La placa ya se encuentra dentro de algún parqueo.", "danger");
            return;
        }

        // Obtener el UID del usuario relacionado con la placa
        const vehiculosCollection = collection(db, "vehiculos");
        const qVehiculo = query(vehiculosCollection, where("placa", "==", placa));
        const vehiculosSnapshot = await getDocs(qVehiculo);

        if (vehiculosSnapshot.empty) {
            showAlert("El vehículo no está registrado en la base de datos.", "danger");
            return;
        }

        const vehiculoData = vehiculosSnapshot.docs[0].data();
        const uidUsuario = vehiculoData.uidUsuario; // Obtener el UID del usuario

        const parqueoDocRef = doc(db, "parqueos", parqueoId);
        const parqueoSnapshot = await getDoc(parqueoDocRef);

        if (!parqueoSnapshot.exists()) {
            showAlert("El parqueo no existe.", "danger");
            return;
        }

        const parqueoData = parqueoSnapshot.data();
        const capacidad = parqueoData.capacidad;
        let ocupados = parqueoData.ocupados;

        if (ocupados >= capacidad) {
            showAlert("No hay espacio disponible en este parqueo.", "danger");
            return;
        }

        // Registrar el ingreso con el UID del usuario
        await addDoc(collection(db, "Usos"), {
            placa: placa,
            parqueoId: parqueoId,
            tipo: "entrada",
            fechaEntrada: new Date(),
            fechaSalida: 0,
            uidUsuario: uidUsuario  // Guardar el UID del usuario
        });

        if (typeof ocupados === 'number' && ocupados < capacidad) {
            const nuevaOcupacion = ocupados + 1;
            await updateDoc(parqueoDocRef, { ocupados: nuevaOcupacion });
        }

        showAlert("Ingreso registrado correctamente.", "success");
    } catch (error) {
        console.error("Error al registrar ingreso: ", error.message);
        showAlert("Hubo un error al registrar el ingreso.", "danger");
    }
}


function showAlert(message, type) {
    const container = document.getElementById('alert-container');

    // Limpiar las alertas anteriores antes de agregar una nueva
    container.innerHTML = '';

    const alertContainer = document.createElement('div');
    alertContainer.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
    alertContainer.setAttribute('role', 'alert');
    alertContainer.innerHTML = `
        <strong>${type === 'success' ? 'Éxito!' : 'Error!'}</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Agregar la alerta al contenedor del DOM
    container.appendChild(alertContainer);

    // Desaparecer la alerta después de 5 segundos
    setTimeout(() => {
        alertContainer.classList.remove('show');
        alertContainer.classList.add('fade');
    }, 5000);
}


// Función para registrar la salida de un vehículo
async function registrarSalida(placa) {
    try {
        const usosCollection = collection(db, "Usos");
        const q = query(usosCollection, 
                        where("placa", "==", placa), 
                        where("tipo", "==", "entrada"),
                        where("fechaSalida", "==", 0));

        const usosSnapshot = await getDocs(q);

        if (usosSnapshot.empty) {
            alert("El vehículo no tiene una entrada registrada o ya tiene registrada la salida.");
            return;
        }

        const entradaDoc = usosSnapshot.docs[0];
        const parqueoId = entradaDoc.data().parqueoId;

        const parqueoDocRef = doc(db, "parqueos", parqueoId);
        const parqueoSnapshot = await getDoc(parqueoDocRef);

        if (!parqueoSnapshot.exists()) {
            alert("El parqueo no existe.");
            return;
        }

        const parqueoData = parqueoSnapshot.data();
        let ocupados = parqueoData.ocupados;

        if (ocupados > 0) {
            const nuevaOcupacion = ocupados - 1;
            await updateDoc(parqueoDocRef, { ocupados: nuevaOcupacion });
        }

        await updateDoc(entradaDoc.ref, {
            fechaSalida: new Date()
        });

        alert("Salida registrada correctamente.");
    } catch (error) {
        console.error("Error al registrar salida:", error);
        alert("Hubo un error al registrar la salida.");
    }
}

async function obtenerPlacasSalida() {
    try {
        const usosCollection = collection(db, "Usos");
        const q = query(
            usosCollection, 
            where("fechaSalida", "==", 0)  // Solo las entradas sin salida registrada
        );
        const usosSnapshot = await getDocs(q);
        const placasSelect = document.getElementById('placa-salida');

        if (placasSelect) {
            placasSelect.innerHTML = '<option value="">Selecciona una placa</option>';
            usosSnapshot.forEach(doc => {
                const entrada = doc.data();
                const option = document.createElement('option');
                option.value = entrada.placa;
                option.textContent = entrada.placa;
                placasSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error al obtener placas de salida:", error);
    }
}

async function mostrarParqueo(placa) {
    try {
        const usosCollection = collection(db, "Usos");
        const q = query(
            usosCollection, 
            where("placa", "==", placa), 
            where("tipo", "==", "entrada"), 
            where("fechaSalida", "==", 0)
        );
        const usosSnapshot = await getDocs(q);

        if (usosSnapshot.empty) {
            document.getElementById('parqueo-salida').textContent = "El vehículo no tiene una entrada registrada o ya tiene registrada la salida.";
            return;
        }

        const entradaDoc = usosSnapshot.docs[0];
        const parqueoId = entradaDoc.data().parqueoId;

        const parqueoDocRef = doc(db, "parqueos", parqueoId);
        const parqueoSnapshot = await getDoc(parqueoDocRef);

        if (!parqueoSnapshot.exists()) {
            document.getElementById('parqueo-salida').textContent = "El parqueo no existe.";
            return;
        }

        const parqueoData = parqueoSnapshot.data();
        const parqueoNombre = parqueoData.nombre;

        const parqueoDisplay = document.getElementById('parqueo-salida');
        if (parqueoDisplay) {
            parqueoDisplay.textContent = `El vehículo está en el parqueo: ${parqueoNombre} (ID: ${parqueoId})`;
        }
    } catch (error) {
        console.error("Error al mostrar el parqueo:", error);
        const parqueoDisplay = document.getElementById('parqueo-salida');
        if (parqueoDisplay) {
            parqueoDisplay.textContent = "Ocurrió un error al obtener la información del parqueo.";
        }
    }
}


async function agregarUsuario(nombre, cedula, correo, carnet, password) {
    try {
        // Verificar si ya existe un usuario con la misma cédula, correo o carnet
        const usuariosCollection = collection(db, "Usuarios");

        const qCedula = query(usuariosCollection, where("cedula", "==", cedula));
        const qCorreo = query(usuariosCollection, where("correo", "==", correo));
        const qCarnet = query(usuariosCollection, where("carnet", "==", carnet));

        const [cedulaSnapshot, correoSnapshot, carnetSnapshot] = await Promise.all([
            getDocs(qCedula),
            getDocs(qCorreo),
            getDocs(qCarnet),
        ]);

        if (!cedulaSnapshot.empty) {
            showAlert("La cédula ya está registrada.", "danger");
            return;
        }

        if (!correoSnapshot.empty) {
            showAlert("El correo ya está registrado.", "danger");
            return;
        }

        if (!carnetSnapshot.empty) {
            showAlert("El carnet ya está registrado.", "danger");
            return;
        }

        // Crear el usuario en Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, correo, password);
        const user = userCredential.user; // Obtiene el usuario recién creado con su UID

        // Guardar el usuario en la colección "Usuarios" en Firestore
        const usuarioDocRef = doc(db, "Usuarios", user.uid); // Utiliza el UID de Firebase Authentication
        await setDoc(usuarioDocRef, {
            nombre: nombre,
            cedula: cedula,
            correo: correo,
            carnet: carnet,
            rol: 3 // Rol fijo como se mencionó
        });

        showAlert("Usuario agregado correctamente.", "success");
    } catch (error) {
        console.error("Error al agregar usuario:", error.message);
        showAlert("Hubo un error al agregar el usuario.", "danger");
    }
}

async function registrarVehiculo(placa, cedula, carnet) {
    try {
        const vehiculosCollection = collection(db, "vehiculos");

        // Verificar si la placa ya está registrada
        const qPlaca = query(vehiculosCollection, where("placa", "==", placa));
        const placaSnapshot = await getDocs(qPlaca);

        if (!placaSnapshot.empty) {
            showAlert("La placa ya está registrada.", "danger");
            return;
        }

        // Verificar si existe un usuario con la cédula y carnet proporcionados
        const usuariosCollection = collection(db, "Usuarios");
        const qUsuario = query(
            usuariosCollection,
            where("cedula", "==", cedula),
            where("carnet", "==", carnet)
        );

        const usuariosSnapshot = await getDocs(qUsuario);

        if (usuariosSnapshot.empty) {
            showAlert("No se encontró un usuario con esta cédula y carnet.", "danger");
            return;
        }

        // Obtener el UID del usuario encontrado
        const usuarioDoc = usuariosSnapshot.docs[0];
        const uidUsuario = usuarioDoc.id; // UID del usuario

        // Registrar el vehículo junto con el UID del usuario
        await addDoc(vehiculosCollection, {
            placa: placa,
            cedula: cedula,
            carnet: carnet,
            uidUsuario: uidUsuario  // Guardar el UID del usuario en el documento del vehículo
        });

        showAlert("Vehículo registrado correctamente.", "success");
    } catch (error) {
        console.error("Error al registrar vehículo:", error.message);
        showAlert("Hubo un error al registrar el vehículo.", "danger");
    }
}


// Manejo del evento submit para el formulario de registrar vehículo
document.getElementById('form-vehiculo').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Capturar los valores de los inputs
    const placa = document.getElementById('placa-vehiculo').value;
    const cedula = document.getElementById('cedula-vehiculo').value;
    const carnet = document.getElementById('carnet-vehiculo').value;

    // Validar que los campos no estén vacíos
    if (placa && cedula && carnet) {
        await registrarVehiculo(placa, cedula, carnet);
    } else {
        alert("Por favor, completa todos los campos.");
    }
});

// Manejo del evento submit para el formulario de agregar usuario
document.getElementById('form-agregar-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Capturar los valores de los inputs
    const nombre = document.getElementById('nombre-usuario').value;
    const cedula = document.getElementById('cedula-usuario').value;
    const correo = document.getElementById('correo-usuario').value;
    const carnet = document.getElementById('carnet-usuario').value;
    const password = document.getElementById('password-usuario').value;

    // Validar que los campos no estén vacíos
    if (nombre && cedula && correo && carnet && password) {
        await agregarUsuario(nombre, cedula, correo, carnet, password);
    } else {
        alert("Por favor, completa todos los campos.");
    }
});

// Escuchar el cambio de la placa seleccionada y mostrar el parqueo
document.getElementById('placa-salida').addEventListener('change', (event) => {
    const placaSeleccionada = event.target.value;
    if (placaSeleccionada) {
        mostrarParqueo(placaSeleccionada);
    } else {
        document.getElementById('parqueo-salida').textContent = "";
    }
});

document.getElementById('form-ingreso').addEventListener('submit', async (e) => {
    e.preventDefault();
    const placa = document.getElementById('placa-ingreso').value;
    const parqueoId = document.getElementById('parqueo-id-ingreso').value;

    if (placa && parqueoId) {
        await registrarIngreso(placa, parqueoId);
    } else {
        alert("Por favor, selecciona una placa y un parqueo.");
    }
});

document.getElementById('form-salida').addEventListener('submit', async (e) => {
    e.preventDefault();
    const placa = document.getElementById('placa-salida').value;

    if (placa) {
        await registrarSalida(placa);
    } else {
        alert("Por favor, selecciona una placa.");
    }
});

// Llamar a las funciones de obtener vehículos y parqueos al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    await obtenerVehiculos();
    await obtenerParqueos();
    await obtenerPlacasSalida();
});


