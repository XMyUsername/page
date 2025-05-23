/**
 * Joshua Plata Subs - Sistema Principal Unificado
 * Solución completa y funcional
 */

class JoshuaPlataSubs {
    constructor() {
        this.episodes = [];
        this.isLoading = true;
        this.isAdmin = false;
        
        this.init();
    }

    init() {
        console.log('🎬 Iniciando Joshua Plata Subs...');
        
        // Forzar ocultación del preloader después de 2 segundos máximo
        this.setupPreloaderTimeout();
        
        // Cargar datos
        this.loadData();
        
        // Inicializar componentes después de un breve delay
        setTimeout(() => {
            this.initializeComponents();
            this.hidePreloader();
        }, 1000);
    }

    setupPreloaderTimeout() {
        // Forzar ocultación después de 3 segundos sin excepciones
        setTimeout(() => {
            this.forceHidePreloader();
        }, 3000);
    }

    forceHidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.display = 'none';
            document.body.style.overflow = 'auto';
            console.log('✅ Preloader forzadamente ocultado');
        }
    }

    hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader && preloader.style.display !== 'none') {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
            
            setTimeout(() => {
                preloader.style.display = 'none';
                document.body.style.overflow = 'auto';
                this.revealContent();
            }, 500);
        }
    }

    revealContent() {
        document.body.style.opacity = '1';
        const mainContent = document.querySelector('main, .hero-section, .container');
        if (mainContent) {
            mainContent.style.transition = 'all 0.8s ease';
            mainContent.style.opacity = '1';
            mainContent.style.transform = 'translateY(0)';
        }
        console.log('✅ Contenido revelado');
    }

    loadData() {
        try {
            const stored = localStorage.getItem('joshuaPlataEpisodes');
            this.episodes = stored ? JSON.parse(stored) : this.getDefaultEpisodes();
            console.log(`📺 Cargados ${this.episodes.length} episodios`);
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.episodes = this.getDefaultEpisodes();
        }
    }

    initializeComponents() {
        this.initNavigation();
        this.initModals();
        this.initContent();
        this.initAdminAccess();
        this.initSearch();
        this.initAnimations();
        this.initCounters();
        this.initForms();
        
        this.isLoading = false;
        console.log('🎉 Joshua Plata Subs completamente inicializado');
    }

    initNavigation() {
        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                if (window.scrollY > 100) {
                    navbar.classList.add('navbar-scrolled');
                } else {
                    navbar.classList.remove('navbar-scrolled');
                }
            }
        });

        // Nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.getAttribute('href')?.startsWith('#')) {
                    e.preventDefault();
                    this.smoothScrollTo(link.getAttribute('href'));
                }
            });
        });
    }

    smoothScrollTo(target) {
        const element = document.querySelector(target);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    initModals() {
        // Modal de episodios
        document.addEventListener('click', (e) => {
            if (e.target.matches('.play-btn') || e.target.closest('.play-btn')) {
                const btn = e.target.closest('.play-btn');
                const episodeId = btn?.getAttribute('data-episode-id');
                if (episodeId) {
                    this.showEpisodeModal(episodeId);
                }
            }
        });

        // Modal de admin
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAdminModal();
            });
        }
    }

    showEpisodeModal(episodeId) {
        const episode = this.episodes.find(ep => ep.id == episodeId);
        if (!episode) return;

        Swal.fire({
            title: episode.title,
            html: `
                <div class="text-start">
                    <div class="ratio ratio-16x9 mb-3">
                        <iframe src="${episode.embedUrl || episode.videoUrl}" allowfullscreen></iframe>
                    </div>
                    <p><strong>Temporada ${episode.season}, Episodio ${episode.number}</strong></p>
                    <p>${episode.description}</p>
                    <small class="text-muted">
                        <i class="fas fa-user-circle me-1"></i>
                        Subtitulado por <strong>Joshua Plata</strong> el ${this.formatDate(episode.subtitleDate)}
                    </small>
                </div>
            `,
            width: 800,
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                container: 'episode-modal-container'
            }
        });

        // Incrementar vistas
        this.incrementViews(episodeId);
    }

    showAdminModal() {
        Swal.fire({
            title: '🎭 Acceso de Administrador',
            html: `
                <form id="adminLoginFormModal" class="text-start">
                    <div class="mb-3">
                        <label for="adminUsernameModal" class="form-label">Usuario</label>
                        <input type="text" class="form-control" id="adminUsernameModal" value="XMyUsername" required>
                    </div>
                    <div class="mb-3">
                        <label for="adminPasswordModal" class="form-label">Contraseña</label>
                        <input type="password" class="form-control" id="adminPasswordModal" value="admin123" required>
                    </div>
                </form>
            `,
            showCancelButton: true,
            confirmButtonText: 'Ingresar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const username = document.getElementById('adminUsernameModal').value;
                const password = document.getElementById('adminPasswordModal').value;
                
                if (username === 'XMyUsername' && password === 'admin123') {
                    return { username, password };
                } else {
                    Swal.showValidationMessage('Credenciales incorrectas');
                    return false;
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.loginAdmin(result.value);
            }
        });
    }

    async loginAdmin(credentials) {
        try {
            // Guardar sesión
            localStorage.setItem('joshuaPlataSession', btoa(JSON.stringify({
                username: credentials.username,
                loginTime: Date.now(),
                expiry: Date.now() + (24 * 60 * 60 * 1000)
            })));

            await Swal.fire({
                title: '¡Bienvenido Joshua!',
                text: 'Redirigiendo al panel de administración...',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            
            window.location.href = 'admin/';
            
        } catch (error) {
            Swal.fire('Error', 'No se pudo iniciar sesión', 'error');
        }
    }

    initContent() {
        this.loadFeaturedEpisodes();
        this.updateCounters();
    }

    loadFeaturedEpisodes() {
        const container = document.querySelector('.featured-episodes');
        if (!container) return;

        const featured = this.episodes
            .filter(ep => ep.featured && ep.published)
            .slice(0, 6);

        container.innerHTML = '';

        if (featured.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-film fa-4x text-muted mb-3"></i>
                    <h4 class="text-muted">Próximamente nuevos episodios</h4>
                    <p class="text-muted">Joshua está preparando contenido increíble para ti.</p>
                </div>
            `;
            return;
        }

        featured.forEach((episode, index) => {
            const card = this.createEpisodeCard(episode);
            container.appendChild(card);
            
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 200);
        });
    }

    createEpisodeCard(episode) {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4 animate-child';
        
        col.innerHTML = `
            <div class="card episode-card h-100">
                <div class="position-relative">
                    <img src="${episode.thumbnail}" 
                         class="card-img-top" 
                         alt="${episode.title}"
                         style="height: 200px; object-fit: cover;"
                         onerror="this.src='img/thumbnail-placeholder.jpg'">
                    <div class="episode-overlay">
                        <button class="btn btn-light play-btn" data-episode-id="${episode.id}">
                            <i class="fas fa-play-circle me-1"></i> Ver ahora
                        </button>
                    </div>
                    ${episode.featured ? '<span class="badge bg-warning position-absolute top-0 start-0 m-2"><i class="fas fa-star me-1"></i>Destacado</span>' : ''}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${episode.title}</h5>
                    <p class="card-text text-muted">${episode.description.substring(0, 100)}...</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>
                            ${this.formatDate(episode.subtitleDate)}
                        </small>
                        <span class="badge bg-primary">
                            T${episode.season}E${episode.number}
                        </span>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">
                            <i class="fas fa-user-circle me-1"></i>
                            Por <strong>Joshua Plata</strong>
                            <span class="ms-2">
                                <i class="fas fa-eye me-1"></i>
                                ${(episode.views || 0).toLocaleString()}
                            </span>
                        </small>
                    </div>
                </div>
            </div>
        `;

        return col;
    }

    updateCounters() {
        const stats = {
            episodes: this.episodes.length,
            seasons: new Set(this.episodes.map(ep => ep.season)).size,
            views: this.episodes.reduce((sum, ep) => sum + (ep.views || 0), 0)
        };

        this.animateCounter('episodeCounter', stats.episodes);
        this.animateCounter('seasonCounter', stats.seasons);
        this.animateCounter('viewCounter', stats.views);
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.setAttribute('data-count', targetValue);
        
        let current = 0;
        const increment = targetValue / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= targetValue) {
                current = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 30);
    }

    initAdminAccess() {
        // Verificar si ya está logueado
        this.checkAdminSession();
    }

    checkAdminSession() {
        const session = localStorage.getItem('joshuaPlataSession');
        if (session) {
            try {
                const sessionData = JSON.parse(atob(session));
                if (sessionData.expiry > Date.now()) {
                    this.isAdmin = true;
                    // Mostrar elementos de admin si existen
                    document.querySelectorAll('.admin-only').forEach(el => {
                        el.style.display = 'block';
                    });
                }
            } catch (error) {
                localStorage.removeItem('joshuaPlataSession');
            }
        }
    }

    initSearch() {
        const searchInput = document.getElementById('quickSearch');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });
        }
    }

    performSearch(query) {
        const cards = document.querySelectorAll('.featured-episodes .col');
        const searchTerm = query.toLowerCase().trim();

        cards.forEach(card => {
            const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.card-text')?.textContent.toLowerCase() || '';
            
            if (searchTerm === '' || title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
                card.style.opacity = '1';
            } else {
                card.style.display = 'none';
            }
        });
    }

    initAnimations() {
        // Intersection Observer para animaciones
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

        // Animaciones de hover para tarjetas
        document.addEventListener('mouseenter', (e) => {
            if (e.target.matches('.episode-card') || e.target.closest('.episode-card')) {
                const card = e.target.closest('.episode-card') || e.target;
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.transition = 'all 0.3s ease';
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target.matches('.episode-card') || e.target.closest('.episode-card')) {
                const card = e.target.closest('.episode-card') || e.target;
                card.style.transform = 'translateY(0) scale(1)';
            }
        }, true);
    }

    initCounters() {
        const counterElements = document.querySelectorAll('.counter-value');
        
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.getAttribute('data-count')) || 0;
                    this.animateCounter(entry.target.id, target);
                    counterObserver.unobserve(entry.target);
                }
            });
        });

        counterElements.forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    initForms() {
        // Newsletter form
        const newsletterForm = document.getElementById('newsletterForm');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = newsletterForm.querySelector('#emailInput')?.value;
                if (!email) return;

                const submitBtn = newsletterForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Suscribiendo...';
                submitBtn.disabled = true;

                try {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    await Swal.fire({
                        title: '¡Gracias por suscribirte!',
                        text: 'Te notificaremos cuando Joshua suba nuevos episodios.',
                        icon: 'success',
                        confirmButtonText: 'Perfecto'
                    });
                    
                    newsletterForm.reset();
                    
                } catch (error) {
                    Swal.fire('Error', 'No se pudo procesar la suscripción.', 'error');
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }

    incrementViews(episodeId) {
        const episode = this.episodes.find(ep => ep.id == episodeId);
        if (episode) {
            episode.views = (episode.views || 0) + 1;
            this.saveEpisodes();
        }
    }

    saveEpisodes() {
        try {
            localStorage.setItem('joshuaPlataEpisodes', JSON.stringify(this.episodes));
        } catch (error) {
            console.error('Error guardando episodios:', error);
        }
    }

    getDefaultEpisodes() {
        return [
            {
                id: 1,
                title: "¡Shin-chan y las travesuras en el parque!",
                season: 1,
                number: 1,
                description: "Shin-chan va al parque con sus amigos y se mete en todo tipo de travesuras divertidas. Episodio subtitulado con amor por Joshua Plata.",
                thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                subtitleDate: "2025-05-20",
                featured: true,
                published: true,
                views: 1542
            },
            {
                id: 2,
                title: "¡Mamá Misae está muy enfadada!",
                season: 1,
                number: 2,
                description: "Shin-chan hace de las suyas en casa y Misae pierde la paciencia. Una situación cómica que todos conocemos, subtitulada con cariño.",
                thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                subtitleDate: "2025-05-21",
                featured: true,
                published: true,
                views: 1203
            },
            {
                id: 3,
                title: "¡El primer día de escuela!",
                season: 1,
                number: 3,
                description: "Shin-chan comienza un nuevo año escolar y conoce nuevos compañeros. Las aventuras en el jardín de infancia nunca fueron tan divertidas.",
                thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                subtitleDate: "2025-05-22",
                featured: true,
                published: true,
                views: 876
            },
            {
                id: 4,
                title: "¡Shin-chan conoce a Action Kamen!",
                season: 1,
                number: 4,
                description: "El héroe favorito de Shin-chan aparece y nuestro protagonista no puede contener su emoción. ¡Diversión garantizada!",
                thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                subtitleDate: "2025-05-23",
                featured: true,
                published: true,
                views: 654
            },
            {
                id: 5,
                title: "¡Un día en el supermercado!",
                season: 1,
                number: 5,
                description: "Shin-chan acompaña a su madre de compras y convierte una simple visita al supermercado en toda una aventura.",
                thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                subtitleDate: "2025-05-23",
                featured: true,
                published: true,
                views: 432
            },
            {
                id: 6,
                title: "¡La visita de los abuelos!",
                season: 1,
                number: 6,
                description: "Los abuelos de Shin-chan vienen de visita y traen consigo historias divertidas y nuevas travesuras para toda la familia.",
                thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                subtitleDate: "2025-05-23",
                featured: false,
                published: true,
                views: 321
            }
        ];
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación...');
    window.joshuaPlataSubs = new JoshuaPlataSubs();
});

// Funciones globales para uso en HTML
window.playEpisode = function(episodeId) {
    if (window.joshuaPlataSubs) {
        window.joshuaPlataSubs.showEpisodeModal(episodeId);
    }
};

// Función de respaldo para ocultar preloader
window.addEventListener('load', function() {
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader && preloader.style.display !== 'none') {
            preloader.style.display = 'none';
            document.body.style.overflow = 'auto';
            console.log('⚡ Preloader ocultado por window.load');
        }
    }, 1000);
});