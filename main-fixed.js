/**
 * Joshua Plata Subs - Sistema Principal COMPLETO
 * Solución definitiva con reproductor funcional
 */

(function() {
    'use strict';
    
    console.log('🚀 Iniciando Joshua Plata Subs...');
    
    // FORZAR ocultación del preloader
    function hidePreloaderForce() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.display = 'none';
            document.body.style.overflow = 'auto';
            document.body.classList.add('loaded');
            console.log('✅ Preloader ocultado');
        }
    }
    
    // Ocultar después de 1 segundo máximo
    setTimeout(hidePreloaderForce, 1000);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(hidePreloaderForce, 500);
        });
    } else {
        hidePreloaderForce();
    }
    
    window.addEventListener('load', hidePreloaderForce);
    
    class JoshuaPlataSubs {
        constructor() {
            this.episodes = this.loadEpisodes();
            this.init();
        }
        
        init() {
            hidePreloaderForce();
            setTimeout(() => {
                this.initComponents();
            }, 200);
        }
        
        initComponents() {
            this.initContent();
            this.initModals();
            this.initNavigation();
            this.initSearch();
            this.initAnimations();
            this.initForms();
            
            console.log('🎉 Joshua Plata Subs inicializado');
        }
        
        initContent() {
            this.loadFeaturedEpisodes();
            this.loadAllEpisodes(); // NUEVA: Cargar TODOS los episodios publicados
            this.updateCounters();
        }
        
        loadFeaturedEpisodes() {
            const container = document.querySelector('.featured-episodes');
            if (!container) return;

            // Primero buscar episodios destacados
            let featured = this.episodes.filter(ep => ep.featured && ep.published);
            
            // Si no hay destacados, mostrar los más recientes
            if (featured.length === 0) {
                featured = this.episodes
                    .filter(ep => ep.published)
                    .sort((a, b) => new Date(b.createdAt || b.subtitleDate) - new Date(a.createdAt || a.subtitleDate))
                    .slice(0, 6);
            }

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
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
            
            console.log(`📺 Cargados ${featured.length} episodios destacados`);
        }
        
        loadAllEpisodes() {
            // Buscar si existe un contenedor para todos los episodios
            const allEpisodesContainer = document.querySelector('.all-episodes, #allEpisodes');
            if (!allEpisodesContainer) return;

            const allPublished = this.episodes
                .filter(ep => ep.published)
                .sort((a, b) => new Date(b.createdAt || b.subtitleDate) - new Date(a.createdAt || a.subtitleDate));

            allEpisodesContainer.innerHTML = '';

            if (allPublished.length === 0) {
                allEpisodesContainer.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="fas fa-film fa-4x text-muted mb-3"></i>
                        <h4 class="text-muted">No hay episodios disponibles</h4>
                        <p class="text-muted">Los episodios aparecerán aquí cuando estén listos.</p>
                    </div>
                `;
                return;
            }

            allPublished.forEach((episode, index) => {
                const card = this.createEpisodeCard(episode);
                allEpisodesContainer.appendChild(card);
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 50);
            });
        }
        
        createEpisodeCard(episode) {
            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6 mb-4';
            col.style.opacity = '0';
            col.style.transform = 'translateY(20px)';
            col.style.transition = 'all 0.5s ease';
            
            col.innerHTML = `
                <div class="card episode-card h-100" style="border: none; border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); overflow: hidden;">
                    <div class="position-relative">
                        <img src="${episode.thumbnail}" 
                             class="card-img-top" 
                             alt="${episode.title}"
                             style="height: 200px; object-fit: cover;"
                             onerror="this.src='img/thumbnail-placeholder.jpg'">
                        <div class="episode-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                             style="background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); opacity: 0; transition: opacity 0.3s ease;">
                            <button class="btn btn-light play-btn" onclick="playEpisode('${episode.id}')">
                                <i class="fas fa-play-circle me-1"></i> Ver ahora
                            </button>
                        </div>
                        ${episode.featured ? '<span class="badge bg-warning position-absolute top-0 start-0 m-2"><i class="fas fa-star me-1"></i>Destacado</span>' : ''}
                        ${this.isNewEpisode(episode) ? '<span class="badge bg-success position-absolute top-0 end-0 m-2">¡NUEVO!</span>' : ''}
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

            // Hover effects
            const card = col.querySelector('.episode-card');
            const overlay = col.querySelector('.episode-overlay');
            
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
                overlay.style.opacity = '1';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                overlay.style.opacity = '0';
            });

            return col;
        }
        
        isNewEpisode(episode) {
            const episodeDate = new Date(episode.createdAt || episode.subtitleDate);
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            return episodeDate > threeDaysAgo;
        }
        
        updateCounters() {
            const stats = {
                episodes: this.episodes.filter(ep => ep.published).length,
                seasons: new Set(this.episodes.filter(ep => ep.published).map(ep => ep.season)).size,
                views: this.episodes.reduce((sum, ep) => sum + (ep.views || 0), 0)
            };

            this.animateCounter('episodeCounter', stats.episodes);
            this.animateCounter('seasonCounter', stats.seasons);
            this.animateCounter('viewCounter', stats.views);
            
            console.log('📊 Stats actualizadas:', stats);
        }
        
        animateCounter(elementId, targetValue) {
            const element = document.getElementById(elementId);
            if (!element) return;

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
        
        initModals() {
            const adminLink = document.getElementById('adminLink');
            if (adminLink) {
                adminLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showAdminLogin();
                });
            }
        }
        
        showAdminLogin() {
            Swal.fire({
                title: '🎭 Acceso de Administrador',
                html: `
                    <div class="text-start">
                        <div class="mb-3">
                            <label class="form-label">Usuario</label>
                            <input type="text" class="form-control" id="adminUser" value="XMyUsername">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Contraseña</label>
                            <input type="password" class="form-control" id="adminPass" value="admin123">
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Ingresar',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    const user = document.getElementById('adminUser').value;
                    const pass = document.getElementById('adminPass').value;
                    
                    if (user === 'XMyUsername' && pass === 'admin123') {
                        return { user, pass };
                    } else {
                        Swal.showValidationMessage('Credenciales incorrectas');
                        return false;
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.setItem('joshuaPlataSession', btoa(JSON.stringify({
                        username: result.value.user,
                        loginTime: Date.now(),
                        expiry: Date.now() + (24 * 60 * 60 * 1000)
                    })));
                    
                    Swal.fire({
                        title: '¡Bienvenido Joshua!',
                        text: 'Redirigiendo al panel...',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = 'admin/';
                    });
                }
            });
        }
        
        initNavigation() {
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
        }
        
        initSearch() {
            const searchInput = document.getElementById('quickSearch');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.performSearch(e.target.value);
                });
            }
        }
        
        performSearch(query) {
            const cards = document.querySelectorAll('.featured-episodes .col, .all-episodes .col');
            const searchTerm = query.toLowerCase().trim();

            cards.forEach(card => {
                const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
                const description = card.querySelector('.card-text')?.textContent.toLowerCase() || '';
                
                if (searchTerm === '' || title.includes(searchTerm) || description.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
        
        initAnimations() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            });

            document.querySelectorAll('.animate-on-scroll').forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'all 0.8s ease';
                observer.observe(el);
            });
        }
        
        initForms() {
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
        
        loadEpisodes() {
            try {
                const stored = localStorage.getItem('joshuaPlataEpisodes');
                const episodes = stored ? JSON.parse(stored) : [];
                console.log(`📺 Cargados ${episodes.length} episodios desde localStorage`);
                return episodes;
            } catch (error) {
                console.error('Error cargando episodios:', error);
                return [];
            }
        }
        
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        }
    }
    
    // Función GLOBAL para reproducir episodios
    window.playEpisode = function(episodeId) {
        console.log('🎬 Reproduciendo episodio:', episodeId);
        
        const episodes = JSON.parse(localStorage.getItem('joshuaPlataEpisodes') || '[]');
        const episode = episodes.find(ep => ep.id === episodeId);
        
        if (!episode) {
            Swal.fire('Error', 'Episodio no encontrado', 'error');
            return;
        }

        // Incrementar vistas
        episode.views = (episode.views || 0) + 1;
        localStorage.setItem('joshuaPlataEpisodes', JSON.stringify(episodes));

        // Procesar URL para embed
        let embedUrl = episode.embedUrl || episode.videoUrl;
        
        // Procesar Dailymotion
        if (episode.videoUrl.includes('dai.ly')) {
            const dailyId = episode.videoUrl.split('/').pop();
            embedUrl = `https://www.dailymotion.com/embed/video/${dailyId}`;
        }
        
        // Mostrar reproductor
        Swal.fire({
            title: episode.title,
            html: `
                <div class="text-start">
                    <div class="ratio ratio-16x9 mb-3">
                        <iframe src="${embedUrl}" 
                                allowfullscreen 
                                frameborder="0"
                                allow="autoplay; encrypted-media"></iframe>
                    </div>
                    <div class="episode-info">
                        <p><strong>Temporada ${episode.season}, Episodio ${episode.number}</strong></p>
                        <p class="text-muted">${episode.description}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="fas fa-user-circle me-1"></i>
                                Subtitulado por <strong>Joshua Plata</strong>
                            </small>
                            <small class="text-muted">
                                <i class="fas fa-eye me-1"></i>
                                ${episode.views.toLocaleString()} visualizaciones
                            </small>
                        </div>
                        <small class="text-muted d-block mt-2">
                            <i class="fas fa-calendar me-1"></i>
                            ${new Date(episode.subtitleDate).toLocaleDateString('es-ES')}
                        </small>
                    </div>
                </div>
            `,
            width: 900,
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                container: 'episode-modal-container'
            }
        });
        
        console.log('✅ Reproductor mostrado para:', episode.title);
    };
    
    // Inicializar aplicación
    function initialize() {
        console.log('🎬 Inicializando Joshua Plata Subs...');
        window.joshuaPlataSubs = new JoshuaPlataSubs();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();