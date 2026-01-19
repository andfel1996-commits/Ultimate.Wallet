$(document).ready(function() {
    // --- GESTIÓN DE SESIÓN ---
    let emailActivo = localStorage.getItem('usuario_sesion_activa');
    let listaGlobal = JSON.parse(localStorage.getItem('usuarios_registrados')) || [];
    let user = listaGlobal.find(u => u.email === emailActivo);

    // Protección: Si no hay usuario, expulsar
    if (!user && window.location.pathname.includes('menu.html')) {
        window.location.href = 'index.html';
    }

    function sync() {
        const idx = listaGlobal.findIndex(u => u.email === emailActivo);
        listaGlobal[idx] = user;
        localStorage.setItem('usuarios_registrados', JSON.stringify(listaGlobal));
        $('#saldo-monto').text(user.saldo.toLocaleString('es-CL'));
        $('#nombre-usuario').text(user.nombre);
    }

    // --- LÓGICA DE LOGIN/REGISTRO (Solo para index.html) ---
    $('#btn-registrar').click(function() {
        const nuevo = {
            nombre: $('#reg-nombre').val(),
            email: $('#reg-email').val(),
            password: $('#reg-password').val(),
            saldo: 0,
            movimientos: []
        };
        listaGlobal.push(nuevo);
        localStorage.setItem('usuarios_registrados', JSON.stringify(listaGlobal));
        alert("¡Registro exitoso!");
        location.reload();
    });

    $('#btn-ingresar').click(function() {
        const e = $('#loginEmail').val();
        const p = $('#loginPassword').val();
        const encontrado = listaGlobal.find(u => u.email === e && u.password === p);
        if (encontrado) {
            localStorage.setItem('usuario_sesion_activa', e);
            window.location.href = 'menu.html';
        } else {
            alert("Datos incorrectos");
        }
    });

    // --- LÓGICA DE MENÚ (Toggles) ---
    function mostrar(id) {
        $('.hidden-section').not(id).slideUp();
        $(id).slideToggle();
    }

    $('#nav-depositar').click(() => mostrar('#sec-depositar'));
    $('#nav-retirar').click(() => mostrar('#sec-retirar'));
    $('#nav-enviar').click(() => mostrar('#sec-enviar'));
    $('#nav-historial').click(() => {
        renderHistorial();
        mostrar('#sec-historial');
    });

    // --- OPERACIONES ---
    $('#do-deposito').click(function() {
        let m = parseFloat($('#in-deposito').val());
        if (m > 0) {
            user.saldo += m;
            user.movimientos.unshift({ fecha: new Date().toLocaleDateString(), desc: "Depósito", monto: m });
            sync();
            $('#in-deposito').val('');
            $('#sec-depositar').slideUp();
        }
    });

// --- LÓGICA DE RETIRO ---
$('#do-retiro').click(function () {
    let monto = parseFloat($('#in-retiro').val());
    
    // Validación estricta
    if (isNaN(monto) || monto <= 0) {
        alert("Por favor, ingresa un monto válido.");
        return;
    }

    if (monto <= user.saldo) {
        user.saldo -= monto;
        user.movimientos.unshift({
            fecha: new Date().toLocaleDateString(),
            desc: "Retiro de efectivo",
            monto: -monto
        });
        
        sync(); // Guarda cambios y actualiza pantalla
        $('#in-retiro').val('');
        $('#sec-retirar').slideUp();
        alert("Retiro exitoso.");
    } else {
        alert("Saldo insuficiente.");
    }
});

// --- LÓGICA DE ENVÍO (TRANSFERENCIA ENTRE CUENTAS) ---
$('#do-envio').click(function () {
    let monto = parseFloat($('#in-monto-envio').val());
    let destinatarioEmail = $('#in-destinatario').val().trim();

    if (isNaN(monto) || monto <= 0 || destinatarioEmail === "") {
        alert("Completa todos los campos con datos válidos.");
        return;
    }

    if (monto > user.saldo) {
        alert("No tienes saldo suficiente.");
        return;
    }

    // 1. BUSCAR AL DESTINATARIO EN LA LISTA GLOBAL
    // Lo buscamos por email porque es el dato único
    let cuentaDestino = listaGlobal.find(u => u.email === destinatarioEmail);

    if (cuentaDestino) {
        if (confirm(`¿Seguro que quieres enviar $${monto} a ${cuentaDestino.nombre}?`)) {
            // A. Restar al que envía (Cuenta Activa)
            user.saldo -= monto;
            user.movimientos.unshift({
                fecha: new Date().toLocaleDateString(),
                desc: `Envío a ${cuentaDestino.nombre}`,
                monto: -monto
            });

            // B. Sumar al que recibe (Cuenta Destino)
            cuentaDestino.saldo += monto;
            if(!cuentaDestino.movimientos) cuentaDestino.movimientos = [];
            cuentaDestino.movimientos.unshift({
                fecha: new Date().toLocaleDateString(),
                desc: `Recibiste de ${user.nombre}`,
                monto: monto
            });

            // 2. GUARDAR TODO
            sync(); 
            $('.form-control').val('');
            $('.hidden-section').slideUp();
            alert("¡Transferencia realizada con éxito!");
        }
    } else {
        alert("Error: El usuario con el correo " + destinatarioEmail + " no existe en Alke Wallet.");
    }
});

    function renderHistorial() {
        let h = user.movimientos.map(m => `
            <tr><td>${m.fecha}</td><td>${m.desc}</td><td class="${m.monto > 0 ? 'text-success' : 'text-danger'}">$${m.monto}</td></tr>
        `).join('');
        $('#lista-movimientos').html(h || '<tr><td colspan="3">Sin movimientos</td></tr>');
    }

    // Toggle de vistas en index
    $('#link-ir-registro').click(() => { $('#login-block').hide(); $('#register-block').fadeIn(); });
    $('#link-ir-login').click(() => { $('#register-block').hide(); $('#login-block').fadeIn(); });
    $('#btn-logout').click(() => { localStorage.removeItem('usuario_sesion_activa'); window.location.href = 'index.html'; });

    if (user) sync();
});