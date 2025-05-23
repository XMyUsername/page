/**
 * Joshua Plata Subs - Sistema Principal Corregido
 * Solucionando problemas de carga y funcionalidad
 */

class JoshuaPlataSubs {
    constructor() {
        this.episodes = [];
        this.config = {};
        this.stats = {};
        this.isLoading = true;
        
        this.init();
    }

    // Inicialización completa del sistema
    init() {
        // Cargar datos primero
        this.loadAllData();
        
        // Luego inicializar componentes
        setTimeout(() => {
            this.initComponents();
            this.hidePreloader();
            this.isLoading = false;
        }, 1500); // Dar tiempo para cargar todo
    }

    initComponents() {
        this.initTheme();
        this.initNavigation();
        this.initAnimations();
        this.initSearch();
        this.initModals();
        this.initCounters();
        this.initNewsletterForm();
        this.initBackToTop();
        this.loadContent();
        this.initAdminAccess();
        this.trackVisit();
        
        console.log('🎉 Joshua Plata Subs inicializado correctamente');
    }

    // Ocultar preloader SIEMPRE después de 2 segundos máximo
    hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
            
            setTimeout(() => {
                preloader.style.display = 'none';
                this.revealContent();
            }, 500);
        }
    }

    // Revelar contenido con animación
    revealContent() {
        const body = document.body;
        body.style.overflow = 'auto'; // Permitir scroll
        
        const mainContent = document.querySelector('main, .container, .hero-section');
        if (mainContent) {
            mainContent.style.opacity = '0';
            mainContent.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                mainContent.style.transition = 'all 0.8s ease';
                mainContent.style.opacity = '1';
                mainContent.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    // Cargar todos los datos
    loadAllData() {
        try {
            this.episodes = this.loadEpisodes();
            this.config = this.loadConfig();
            this.stats = this.loadStats();
        } catch (error) {
            console.error('Error cargando datos:', error);
            // Usar datos por defecto si falla
            this.episodes = this.getDefaultEpisodes();
            this.config = this.getDefaultConfig();
            this.stats = this.getDefaultStats();
        }
    }

    // Sistema de temas
    initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('joshuaPlataTheme') || 'light';
        
        this.applyTheme(savedTheme);
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                this.applyTheme(newTheme);
            });
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('joshuaPlataTheme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    // Navegación
    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    this.smoothScrollTo(link.getAttribute('href'));
                }
                
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        this.initNavbarScroll();
    }

    initNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });
    }

    smoothScrollTo(target) {
        const element = document.querySelector(target);
        if (element) {
            const offsetTop = element.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    // Animaciones
    initAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

        this.initCardAnimations();
    }

    initCardAnimations() {
        const cards = document.querySelectorAll('.card, .episode-card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '0 6px 15px rgba(0,0,0,0.1)';
            });
        });
    }

    // Búsqueda
    initSearch() {
        const searchInput = document.getElementById('quickSearch');
        if (!searchInput) return;

        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.toLowerCase().trim();
            
            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });
    }

    performSearch(query) {
        const episodeCards = document.querySelectorAll('.featured-episodes .col');
        let visibleCount = 0;

        episodeCards.forEach((card, index) => {
            const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.card-text')?.textContent.toLowerCase() || '';
            
            const matches = query === '' || title.includes(query) || description.includes(query);
            
            if (matches) {
                this.showCard(card, index * 100);
                visibleCount++;
            } else {
                this.hideCard(card);
            }
        });
    }

    showCard(card, delay = 0) {
        setTimeout(() => {
            card.style.display = 'block';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, delay);
    }

    hideCard(card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            card.style.display = 'none';
        }, 300);
    }

    // Modales
    initModals() {
        // Modal de episodios
        const episodeModal = document.getElementById('episodeModal');
        if (episodeModal) {
            episodeModal.addEventListener('show.bs.modal', (e) => {
                const button = e.relatedTarget;
                const episodeId = button?.getAttribute('data-episode-id');
                
                if (episodeId) {
                    this.loadEpisodeModal(episodeId);
                }
            });
        }

        // Modal de admin
        this.initAdminModal();
    }

    loadEpisodeModal(episodeId) {
        const episode = this.episodes.find(ep => ep.id == episodeId);
        if (!episode) return;

        document.getElementById('episodeTitle').textContent = episode.title;
        document.getElementById('episodeDescription').textContent = episode.description;
        document.getElementById('episodeNumber').textContent = `Episodio ${episode.number}`;
        document.getElementById('episodeSeason').textContent = `Temporada ${episode.season}`;
        document.getElementById('episodeDate').textContent = `Subtitulado: ${this.formatDate(episode.subtitleDate)}`;

        const videoFrame = document.getElementById('videoFrame');
        if (videoFrame && episode.embedUrl) {
            videoFrame.src = episode.embedUrl;
        }

        this.incrementViews(episodeId);
    }

    initAdminModal() {
        const form = document.getElementById('adminLoginForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin(form);
            });
        }
    }

    async handleAdminLogin(form) {
        const username = form.querySelector('#adminUsername').value;
        const password = form.querySelector('#adminPassword').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Verificando...';
        submitBtn.disabled = true;

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (username === 'XMyUsername' && password === 'admin123') {
                localStorage.setItem('joshuaPlataSession', btoa(JSON.stringify({
                    username: username,
                    loginTime: Date.now(),
                    expiry: Date.now() + (24 * 60 * 60 * 1000)
                })));

                await Swal.fire({
                    title: '¡Bienvenido Joshua!',
                    text: 'Acceso concedido. Redirigiendo al panel...',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                window.location.href = 'admin/dashboard.html';
            } else {
                throw new Error('Credenciales incorrectas');
            }
        } catch (error) {
            const errorAlert = document.getElementById('loginError');
            if (errorAlert) {
                errorAlert.classList.remove('d-none');
                setTimeout(() => errorAlert.classList.add('d-none'), 3000);
            }
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Contadores
    initCounters() {
        const counters = document.querySelectorAll('.counter-value');
        
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-count')) || 0;
        const duration = 2000;
        const step = target / (duration / 20);
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                element.textContent = Math.ceil(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target.toLocaleString();
            }
        };

        updateCounter();
    }

    // Newsletter
    initNewsletterForm() {
        const form = document.getElementById('newsletterForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = form.querySelector('#emailInput').value;
            const submitBtn = form.querySelector('button[type="submit"]');
            
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Suscribiendo...';
            submitBtn.disabled = true;

            try {
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                await Swal.fire({
                    title: '¡Gracias por suscribirte!',
                    text: 'Te avisaremos cuando subamos nuevos episodios.',
                    icon: 'success',
                    confirmButtonText: 'Genial'
                });
                
                form.reset();
                
            } catch (error) {
                await Swal.fire('Error', 'No se pudo procesar la suscripción. Inténtalo de nuevo.', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Back to top
    initBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) return;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Cargar contenido
    loadContent() {
        this.loadFeaturedEpisodes();
        this.updateCounters();
    }

    loadFeaturedEpisodes() {
        const container = document.querySelector('.featured-episodes');
        if (!container) return;

        const featured = this.episodes
            .filter(ep => ep.featured && ep.published)
            .slice(0, 6);

        if (featured.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-film fa-4x text-muted mb-3"></i>
                    <h4 class="text-muted">No hay episodios destacados</h4>
                    <p class="text-muted">Los episodios aparecerán aquí cuando estén disponibles.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        featured.forEach((episode, index) => {
            const card = this.createEpisodeCard(episode);
            container.appendChild(card);
            
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 150);
        });
    }

    createEpisodeCard(episode) {
        const col = document.createElement('div');
        col.className = 'col animate-child';
        
        col.innerHTML = `
            <div class="card episode-card h-100">
                <div class="position-relative">
                    <img src="${episode.thumbnail}" 
                         class="card-img-top" 
                         alt="${episode.title}"
                         loading="lazy">
                    <div class="episode-overlay">
                        <button class="btn btn-sm btn-light play-btn" 
                                data-bs-toggle="modal" 
                                data-bs-target="#episodeModal"
                                data-episode-id="${episode.id}">
                            <i class="fas fa-play-circle"></i> Ver ahora
                        </button>
                    </div>
                    ${episode.featured ? '<span class="badge bg-warning position-absolute top-0 start-0 m-2"><i class="fas fa-star me-1"></i>Destacado</span>' : ''}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${episode.title}</h5>
                    <p class="card-text text-muted small">${episode.description.substring(0, 100)}...</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>
                            ${this.formatDate(episode.subtitleDate)}
                        </small>
                        <div class="d-flex gap-2">
                            <span class="badge bg-primary">
                                <i class="fas fa-film me-1"></i>
                                T${episode.season}E${episode.number}
                            </span>
                            <span class="badge bg-secondary">
                                <i class="fas fa-eye me-1"></i>
                                ${episode.views || 0}
                            </span>
                        </div>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted d-flex align-items-center">
                            <i class="fas fa-user-circle me-1"></i>
                            Subtitulado por <strong class="ms-1">Joshua Plata</strong>
                        </small>
                    </div>
                </div>
            </div>
        `;

        return col;
    }

    updateCounters() {
        const totalEpisodes = this.episodes.length;
        const uniqueSeasons = new Set(this.episodes.map(ep => ep.season)).size;
        const totalViews = this.episodes.reduce((sum, ep) => sum + (ep.views || 0), 0);

        this.setCounterValue('episodeCounter', totalEpisodes);
        this.setCounterValue('seasonCounter', uniqueSeasons);
        this.setCounterValue('viewCounter', totalViews);
    }

    setCounterValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.setAttribute('data-count', value);
        }
    }

    // Acceso de administrador
    initAdminAccess() {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
                modal.show();
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

    trackVisit() {
        let visits = parseInt(localStorage.getItem('joshuaPlataVisits') || '0');
        visits++;
        localStorage.setItem('joshuaPlataVisits', visits.toString());
        localStorage.setItem('joshuaPlataLastVisit', new Date().toISOString());
    }

    // Almacenamiento
    loadEpisodes() {
        const stored = localStorage.getItem('joshuaPlataEpisodes');
        return stored ? JSON.parse(stored) : this.getDefaultEpisodes();
    }

    saveEpisodes() {
        localStorage.setItem('joshuaPlataEpisodes', JSON.stringify(this.episodes));
    }

    loadConfig() {
        const stored = localStorage.getItem('joshuaPlataConfig');
        return stored ? JSON.parse(stored) : this.getDefaultConfig();
    }

    loadStats() {
        const stored = localStorage.getItem('joshuaPlataStats');
        return stored ? JSON.parse(stored) : this.getDefaultStats();
    }

    getDefaultEpisodes() {
        return [
            {
                id: 1,
                title: "¡Shin-chan y las travesuras en el parque!",
                season: 1,
                number: 1,
                description: "Shin-chan va al parque con sus amigos y se mete en todo tipo de travesuras divertidas. ¡Prepárate para reír sin parar!",
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
                description: "Shin-chan hace de las suyas en casa y Misae pierde la paciencia. Una situación cómica que todos conocemos.",
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
                description: "Shin-chan comienza un nuevo año escolar y conoce nuevos compañeros. Las aventuras en el jardín de infancia.",
                thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                subtitleDate: "2025-05-22",
                featured: true,
                published: true,
                views: 876
            }
        ];
    }

    getDefaultConfig() {
        return {
            siteName: "Joshua Plata Subs",
            adminUser: "Joshua Plata",
            theme: "light"
        };
    }

    getDefaultStats() {
        return {
            totalEpisodes: 0,
            totalViews: 0,
            uniqueSeasons: 0
        };
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }
}

// Inicializar la aplicación
let joshuaPlataSubs;

document.addEventListener('DOMContentLoaded', function() {
    joshuaPlataSubs = new JoshuaPlataSubs();
    
    // Forzar ocultación del preloader después de 3 segundos máximo
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader && preloader.style.display !== 'none') {
            preloader.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }, 3000);
});

// Exponer funciones globales
window.joshuaPlataSubs = joshuaPlataSubs;