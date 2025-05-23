/**
 * Sistema de Notificaciones para Shinchaneros
 */

class NotificationSystem {
    constructor() {
        this.notifications = this.loadNotifications();
        this.subscribers = this.loadSubscribers();
        this.settings = this.loadNotificationSettings();
        this.init();
    }

    init() {
        this.createNotificationContainer();
        this.setupServiceWorker();
        this.checkForNewEpisodes();
        this.initVisitorNotifications();
        this.setupNotificationPermissions();
    }

    // Crear contenedor de notificaciones
    createNotificationContainer() {
        if (document.getElementById('shinchan-notifications')) return;

        const container = document.createElement('div');
        container.id = 'shinchan-notifications';
        container.className = 'notification-container';
        container.innerHTML = `
            <div class="notification-header">
                <div class="shinchan-avatar">
                    <img src="img/shin-chan-face.png" alt="Shin-chan">
                </div>
                <div class="notification-content">
                    <h6>¡Hola Shinchanero!</h6>
                    <p id="notification-message">Bienvenido a la mejor web de Shin-chan</p>
                </div>
                <button class="notification-close" onclick="notificationSystem.hideNotification()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-actions" id="notification-actions" style="display: none;">
                <button class="btn btn-primary btn-sm" onclick="notificationSystem.subscribeToNotifications()">
                    <i class="fas fa-bell me-1"></i> ¡Quiero notificaciones!
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="notificationSystem.hideNotification()">
                    Ahora no
                </button>
            </div>
        `;
        document.body.appendChild(container);
    }

    // Mostrar notificación de bienvenida personalizada
    initVisitorNotifications() {
        const lastVisit = localStorage.getItem('lastShinchanVisit');
        const isFirstVisit = !lastVisit;
        const daysSinceLastVisit = lastVisit ? Math.floor((Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24)) : 0;

        setTimeout(() => {
            if (isFirstVisit) {
                this.showWelcomeNotification();
            } else if (daysSinceLastVisit > 7) {
                this.showWelcomeBackNotification(daysSinceLastVisit);
            } else {
                this.checkForNewContent();
            }
            
            localStorage.setItem('lastShinchanVisit', Date.now().toString());
        }, 2000);
    }

    // Notificación de bienvenida
    showWelcomeNotification() {
        const messages = [
            "¡Bienvenido al mundo de Shin-chan! 🎉",
            "¡Hola futuro Shinchanero! 👋",
            "¡Prepárate para reír como nunca! 😂",
            "¡Has llegado al lugar correcto para Shin-chan! ⭐"
        ];

        const message = messages[Math.floor(Math.random() * messages.length)];
        
        this.showNotification({
            message: message,
            submessage: "Descubre episodios subtitulados de alta calidad",
            type: 'welcome',
            actions: true,
            duration: 8000
        });
    }

    // Notificación de regreso
    showWelcomeBackNotification(days) {
        const messages = [
            `¡Hola de nuevo, Shinchanero! Han pasado ${days} días 😊`,
            `¡Te extrañamos! ${days} días sin Shin-chan es mucho tiempo 🥺`,
            `¡Bienvenido de vuelta! Hay nuevas aventuras esperándote 🎭`
        ];

        const message = messages[Math.floor(Math.random() * messages.length)];
        
        this.showNotification({
            message: message,
            submessage: "Echa un vistazo a los nuevos episodios",
            type: 'welcome-back',
            duration: 6000
        });
    }

    // Verificar nuevo contenido
    checkForNewContent() {
        const episodes = JSON.parse(localStorage.getItem('shinChanEpisodes') || '[]');
        const lastNotificationCheck = localStorage.getItem('lastNotificationCheck') || '0';
        
        const newEpisodes = episodes.filter(ep => 
            new Date(ep.createdAt || ep.subtitleDate).getTime() > parseInt(lastNotificationCheck)
        );

        if (newEpisodes.length > 0) {
            this.showNewEpisodeNotification(newEpisodes);
        }

        localStorage.setItem('lastNotificationCheck', Date.now().toString());
    }

    // Notificación de nuevos episodios
    showNewEpisodeNotification(episodes) {
        const count = episodes.length;
        const latestEpisode = episodes[0];
        
        const message = count === 1 
            ? `¡Nuevo episodio disponible! 🎬`
            : `¡${count} nuevos episodios disponibles! 🎬✨`;
            
        const submessage = count === 1 
            ? latestEpisode.title
            : `Incluyendo: ${latestEpisode.title}`;

        this.showNotification({
            message: message,
            submessage: submessage,
            type: 'new-episode',
            action: {
                text: count === 1 ? '¡Ver episodio!' : '¡Ver episodios!',
                link: 'episodios.html'
            },
            duration: 10000
        });

        // Enviar notificación push si está permitido
        this.sendPushNotification(message, submessage);
    }

    // Mostrar notificación genérica
    showNotification(config) {
        const container = document.getElementById('shinchan-notifications');
        const messageEl = document.getElementById('notification-message');
        const actionsEl = document.getElementById('notification-actions');
        
        if (!container || !messageEl) return;

        // Configurar mensaje
        messageEl.innerHTML = `
            <strong>${config.message}</strong>
            ${config.submessage ? `<br><small>${config.submessage}</small>` : ''}
        `;

        // Configurar acciones
        if (config.actions) {
            actionsEl.style.display = 'flex';
        } else if (config.action) {
            actionsEl.innerHTML = `
                <button class="btn btn-primary btn-sm" onclick="window.location.href='${config.action.link}'">
                    <i class="fas fa-play me-1"></i> ${config.action.text}
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="notificationSystem.hideNotification()">
                    Cerrar
                </button>
            `;
            actionsEl.style.display = 'flex';
        } else {
            actionsEl.style.display = 'none';
        }

        // Mostrar con animación
        container.style.display = 'block';
        setTimeout(() => {
            container.classList.add('show');
        }, 100);

        // Auto-ocultar
        if (config.duration) {
            setTimeout(() => {
                this.hideNotification();
            }, config.duration);
        }

        // Sonido de notificación (opcional)
        this.playNotificationSound(config.type);
    }

    // Ocultar notificación
    hideNotification() {
        const container = document.getElementById('shinchan-notifications');
        if (container) {
            container.classList.remove('show');
            setTimeout(() => {
                container.style.display = 'none';
            }, 300);
        }
    }

    // Suscribirse a notificaciones
    async subscribeToNotifications() {
        try {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                
                if (permission === 'granted') {
                    // Guardar suscripción
                    this.settings.browserNotifications = true;
                    this.saveNotificationSettings();
                    
                    // Mostrar confirmación
                    this.showNotification({
                        message: "¡Genial! Ya estás suscrito 🎉",
                        submessage: "Te avisaremos cuando haya nuevos episodios",
                        type: 'success',
                        duration: 4000
                    });
                    
                    // Notificación de prueba
                    setTimeout(() => {
                        new Notification('¡Shinchaneros.com!', {
                            body: 'Notificaciones activadas correctamente 🎭',
                            icon: 'img/logo.png',
                            tag: 'shinchan-welcome'
                        });
                    }, 1000);
                    
                } else {
                    this.showNotification({
                        message: "Notificaciones deshabilitadas",
                        submessage: "Puedes activarlas desde la configuración del navegador",
                        type: 'info',
                        duration: 5000
                    });
                }
            }
        } catch (error) {
            console.error('Error suscribiendo a notificaciones:', error);
        }
        
        this.hideNotification();
    }

    // Enviar notificación push
    sendPushNotification(title, body) {
        if (!this.settings.browserNotifications) return;
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'img/shin-chan-face.png',
                badge: 'img/favicon.ico',
                tag: 'shinchan-episode',
                requireInteraction: true,
                actions: [
                    {
                        action: 'view',
                        title: '¡Ver ahora!'
                    },
                    {
                        action: 'close',
                        title: 'Cerrar'
                    }
                ]
            });
        }
    }

    // Reproducir sonido de notificación
    playNotificationSound(type) {
        if (!this.settings.sounds) return;
        
        try {
            const sounds = {
                'welcome': 'sounds/shin-chan-hello.mp3',
                'new-episode': 'sounds/shin-chan-excited.mp3',
                'success': 'sounds/shin-chan-yeah.mp3'
            };
            
            const soundFile = sounds[type];
            if (soundFile) {
                const audio = new Audio(soundFile);
                audio.volume = 0.3;
                audio.play().catch(() => {}); // Ignorar errores de autoplay
            }
        } catch (error) {
            console.log('No se pudo reproducir el sonido de notificación');
        }
    }

    // Service Worker para notificaciones
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker registrado:', registration);
            } catch (error) {
                console.log('Error registrando Service Worker:', error);
            }
        }
    }

    // Configurar permisos de notificación
    setupNotificationPermissions() {
        // Verificar si ya se pidieron permisos
        const permissionAsked = localStorage.getItem('notificationPermissionAsked');
        
        if (!permissionAsked && 'Notification' in window && Notification.permission === 'default') {
            // Preguntar después de un tiempo en la página
            setTimeout(() => {
                if (!document.hidden) {
                    this.askForNotificationPermission();
                }
            }, 30000); // 30 segundos después
        }
    }

    // Pedir permisos de notificación
    askForNotificationPermission() {
        this.showNotification({
            message: "¿Quieres ser un verdadero Shinchanero? 🎭",
            submessage: "Activa las notificaciones para enterarte de nuevos episodios",
            type: 'permission',
            actions: true,
            duration: 15000
        });
        
        localStorage.setItem('notificationPermissionAsked', 'true');
    }

    // Almacenamiento
    loadNotifications() {
        const stored = localStorage.getItem('shinchanNotifications');
        return stored ? JSON.parse(stored) : [];
    }

    saveNotifications() {
        localStorage.setItem('shinchanNotifications', JSON.stringify(this.notifications));
    }

    loadSubscribers() {
        const stored = localStorage.getItem('shinchanSubscribers');
        return stored ? JSON.parse(stored) : [];
    }

    loadNotificationSettings() {
        const stored = localStorage.getItem('shinchanNotificationSettings');
        return stored ? JSON.parse(stored) : {
            browserNotifications: false,
            sounds: true,
            emailNotifications: false
        };
    }

    saveNotificationSettings() {
        localStorage.setItem('shinchanNotificationSettings', JSON.stringify(this.settings));
    }
}

// Inicializar sistema de notificaciones
let notificationSystem;

document.addEventListener('DOMContentLoaded', function() {
    notificationSystem = new NotificationSystem();
});