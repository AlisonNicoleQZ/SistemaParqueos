document.getElementById('form-ingreso').addEventListener('submit', function (e) {
    e.preventDefault();
    const placa = document.getElementById('placa-ingreso').value;
    const parqueo = document.getElementById('parqueo-ingreso').value;
    document.getElementById('resultado-ingreso').textContent = `Vehículo con placa ${placa} registrado en el parqueo ${parqueo}.`;
});

document.getElementById('form-egreso').addEventListener('submit', function (e) {
    e.preventDefault();
    const placa = document.getElementById('placa-egreso').value;
    const parqueo = document.getElementById('parqueo-egreso').value;
    document.getElementById('resultado-egreso').textContent = `Vehículo con placa ${placa} egresado del parqueo ${parqueo}.`;
});

document.getElementById('form-reporte').addEventListener('submit', function (e) {
    e.preventDefault();
    const parqueo = document.getElementById('parqueo-reporte').value;
    document.getElementById('resultado-reporte').textContent = `Generando reporte de uso para el parqueo ${parqueo}...`;
});
