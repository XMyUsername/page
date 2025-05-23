/**
 * Efectos especiales estilo Shin-chan
 * Hace que todo sea más divertido y kawaii
 */

class ShinChanEffects {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupParticleSystem();
        this.setupSoundEffects();
        this.setupKawaiiCursor();
        this.setupSpecialAnimations();
        this.setupEasterEggs();
        
        console.log('🎭 Efectos Shin-chan activados!');
    }
    
    setupParticleSystem() {
        // Sistema de partículas mejorado
        this.createFloatingElements();
        this.setupClickEffects();
    }
    
    createFloatingElements() {
        const container = document.createElement('div');
        container.id = 'particle-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        document.body.appendChild(container);
        
        const emojis = ['🎭', '😂', '🤣', '😄', '🎬', '🍿', '⭐', '✨', '💫', '🌟'];
        
        setInterval(() => {
            if (Math.random() < 0.3) {
                this.createFloatingEmoji(container, emojis);
            }
        }, 2000);
    }
    
    createFloatingEmoji(container, emojis) {
        const emoji = document.createElement('div');
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        emoji.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 20 + 20}px;
            left: ${Math.random() * 100}%;
            top: 100%;
            animation: floatUp ${Math.random() * 5 + 8}s linear forwards;
            opacity: 0.7;
            pointer-events: none;
        `;
        
        container.appendChild(emoji);
        
        setTimeout(() => {
            emoji.remove();
        }, 13000);
    }
    
    setupClickEffects() {
        document.addEventListener('click', (e) => {
            this.createClickExplosion(e.clientX, e.clientY);
        });
    }
    
    createClickExplosion(x, y) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
        const particles = 8;
        
        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            const angle = (360 / particles) * i;
            const velocity = Math.random() * 100 + 50;
            
            particle.style.cssText = `
                position: fixed;
                width: 6px;
                height: 6px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                z-index: 9999;
                animation: particleExplode 0.8s ease-out forwards;
                transform: rotate(${angle}deg) translateX(${velocity}px);
            `;
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 800);
        }
    }
    
    setupSoundEffects() {
        // Simulación de efectos de sonido
        const playSound = (type) => {
            if (navigator.vibrate) {
                switch (type) {
                    case 'hover':
                        navigator.vibrate(30);
                        break;
                    case 'click':
                        navigator.vibrate([50, 30, 50]);
                        break;
                    case 'success':
                        navigator.vibrate([100, 50, 100, 50, 100]);
                        break;
                }
            }
        };
        
        // Agregar efectos a elementos
        document.querySelectorAll('.btn, .nav-link, .episode-card').forEach(el => {
            el.addEventListener('mouseenter', () => playSound('hover'));
            el.addEventListener('click', () => playSound('click'));
        });
    }
    
    setupKawaiiCursor() {
        let isMoving = false;
        let moveTimeout;
        
        document.addEventListener('mousemove', () => {
            if (!isMoving) {
                document.body.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text x="8" y="24" font-size="24">🏃</text></svg>') 16 16, auto`;
                isMoving = true;
            }
            
            clearTimeout(moveTimeout);
            moveTimeout = setTimeout(() => {
                document.body.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text x="8" y="24" font-size="24">🎭</text></svg>') 16 16, auto`;
                isMoving = false;
            }, 500);
        });
    }
    
    setupSpecialAnimations() {
        // Animación especial al cargar la página
        window.addEventListener('load', () => {
            this.showWelcomeAnimation();
        });
        
        // Animaciones de scroll
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScrollEffects();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    showWelcomeAnimation() {
        const welcome = document.createElement('div');
        welcome.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 4rem;
            z-index: 10000;
            animation: welcomeAnimation 3s ease-in-out forwards;
            pointer-events: none;
        `;
        welcome.textContent = '🎭';
        
        document.body.appendChild(welcome);
        
        setTimeout(() => {
            welcome.remove();
        }, 3000);
    }
    
    handleScrollEffects() {
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        
        // Cambiar el emoji del cursor según el scroll
        if (scrollPercent > 0.8) {
            document.body.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text x="8" y="24" font-size="24">🔚</text></svg>') 16 16, auto`;
        } else if (scrollPercent > 0.5) {
            document.body.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text x="8" y="24" font-size="24">📖</text></svg>') 16 16, auto`;
        }
    }
    
    setupEasterEggs() {
        // Konami code easter egg
        let konamiCode = [];
        const konamiSequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑↑↓↓←→←→BA
        
        document.addEventListener('keydown', (e) => {
            konamiCode.push(e.keyCode);
            if (konamiCode.length > konamiSequence.length) {
                konamiCode.shift();
            }
            
            if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
                this.activateKonamiEasterEgg();
                konamiCode = [];
            }
        });
        
        // Click en logo easter egg
        let clickCount = 0;
        const logo = document.querySelector('.brand-text');
        if (logo) {
            logo.addEventListener('click', () => {
                clickCount++;
                if (clickCount >= 5) {
                    this.activateLogoEasterEgg();
                    clickCount = 0;
                }
            });
        }
    }
    
    activateKonamiEasterEgg() {
        // Lluvia de Shin-chans
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(container);
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const shinChan = document.createElement('div');
                shinChan.textContent = '🕺';
                shinChan.style.cssText = `
                    position: absolute;
                    font-size: 3rem;
                    left: ${Math.random() * 100}%;
                    top: -50px;
                    animation: konamiFall 3s linear forwards;
                `;
                container.appendChild(shinChan);
                
                setTimeout(() => {
                    shinChan.remove();
                }, 3000);
            }, i * 100);
        }
        
        setTimeout(() => {
            container.remove();
        }, 8000);
        
        // Mostrar mensaje
        Swal.fire({
            title: '🎉 ¡Easter Egg Activado!',
            text: '¡Has encontrado el código secreto de Shin-chan!',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
        });
    }
    
    activateLogoEasterEgg() {
        // Efecto de explosión de colores
        document.body.style.animation = 'rainbow 2s ease-in-out';
        
        setTimeout(() => {
            document.body.style.animation = '';
        }, 2000);
        
        Swal.fire({
            title: '🎭 ¡Modo Fiesta Activado!',
            text: '¡Joshua Plata está bailando!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
    }
}

// Agregar estilos para las animaciones
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes floatUp {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 0.8;
        }
        90% {
            opacity: 0.8;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes particleExplode {
        0% {
            opacity: 1;
            transform: scale(1);
        }
        100% {
            opacity: 0;
            transform: scale(0);
        }
    }
    
    @keyframes welcomeAnimation {
        0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.5) rotate(180deg);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(0) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes konamiFall {
        0% {
            transform: translateY(-50px) rotate(0deg);
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
        }
    }
    
    @keyframes rainbow {
        0%, 100% { filter: hue-rotate(0deg); }
        25% { filter: hue-rotate(90deg); }
        50% { filter: hue-rotate(180deg); }
        75% { filter: hue-rotate(270deg); }
    }
`;
document.head.appendChild(animationStyles);

// Inicializar los efectos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ShinChanEffects();
});