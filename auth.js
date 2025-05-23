// Archivo auth.js - Sistema de autenticación básico para panel de administrador

// Credenciales preestablecidas (en una aplicación real, esto estaría en el servidor)
const ADMIN_CREDENTIALS = {
    username: 'XMyUsername',
    password: 'admin123' // Cambiar a una contraseña segura en producción
};

// Comprobar si hay una sesión activa
function checkSession() {
    const sessionToken = localStorage.getItem('adminSession');
    if (sessionToken) {
        try {
            const session = JSON.parse(atob(sessionToken));
            // Verificar si la sesión es válida y no ha expirado
            if (session.username === ADMIN_CREDENTIALS.username && 
                session.expiry > Date.now()) {
                return true;
            }
        } catch (e) {
            console.error("Error al verificar la sesión:", e);
        }
    }
    return false;
}

// Redirigir según estado de autenticación
function handleAuth() {
    const isAdminDashboard = window.location.pathname.includes('/admin/') && 
                            !window.location.pathname.includes('/admin/index.html');
    
    if (isAdminDashboard && !checkSession()) {
        // Si está en un área protegida sin autenticación, redirigir al login
        window.location.href = 'index.html';
    } else if (window.location.pathname.includes('/admin/index.html') && checkSession()) {
        // Si está en el login pero ya tiene sesión, redirigir al dashboard
        window.location.href = 'dashboard.html';
    }
}

// Iniciar sesión
function login(username, password, rememberMe = false) {
    if (username === ADMIN_CREDENTIALS.username && 
        password === ADMIN_CREDENTIALS.password) {
        
        // Crear sesión (24 horas por defecto, 30 días si "recordarme" está activo)
        const expiryTime = rememberMe ? 
            Date.now() + (30 * 24 * 60 * 60 * 1000) : // 30 días
            Date.now() + (24 * 60 * 60 * 1000);       // 24 horas
        
        const session = {
            username: username,
            loginTime: Date.now(),
            expiry: expiryTime
        };
        
        // Guardar sesión encriptada básica
        localStorage.setItem('adminSession', btoa(JSON.stringify(session)));
        
        // Registrar última sesión
        localStorage.setItem('lastLogin', new Date().toISOString());
        
        return true;
    }
    return false;
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('adminSession');
    window.location.href = 'index.html';
}

// Configurar formulario de login
function setupLoginForm() {
    const loginForm = document.getElementById('adminLoginForm');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username') || document.getElementById('adminUsername');
        const password = document.getElementById('password') || document.getElementById('adminPassword');
        const rememberMe = document.getElementById('rememberMe');
        
        const success = login(
            username.value,
            password.value,
            rememberMe && rememberMe.checked
        );
        
        if (success) {
            // En modal dentro de la página principal
            if (window.location.pathname.includes('/index.html')) {
                window.location.href = 'admin/dashboard.html';
            } 
            // En página de login de admin
            else {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Mostrar error
            const errorAlert = document.getElementById('loginAlert') || document.getElementById('loginError');
            if (errorAlert) {
                errorAlert.classList.remove('d-none');
                setTimeout(() => {
                    errorAlert.classList.add('d-none');
                }, 3000);
            }
        }
    });
    
    // Toggle para mostrar/ocultar contraseña
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordField = document.getElementById('password') || document.getElementById('adminPassword');
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            
            // Cambiar ícono
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    handleAuth();
    setupLoginForm();
    
    // Setup del botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Mostrar información de la sesión
    if (checkSession()) {
        const sessionData = JSON.parse(atob(localStorage.getItem('adminSession')));
        const lastLogin = localStorage.getItem('lastLogin');
        
        // Actualizar nombre de usuario en elementos de la interfaz
        const adminNameElements = document.querySelectorAll('#adminName, #welcomeUser');
        adminNameElements.forEach(element => {
            if (element) element.textContent = sessionData.username;
        });
        
        // Actualizar fecha de último inicio de sesión
        const lastLoginElement = document.getElementById('lastLogin');
        if (lastLoginElement && lastLogin) {
            const date = new Date(lastLogin);
            lastLoginElement.textContent = date.toLocaleString('es-ES');
        }
    }
});