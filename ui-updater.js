/**
 * Sistema de Actualización Automática de la UI para Joshua Plata Subs
 */

class UIUpdater {
    constructor() {
        this.dataManager = window.dataManager;
        this.currentPage = this.detectCurrentPage();
        this.updateQueue = [];
        this.isUpdating = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAutoRefresh();
        console.log(`🎨 UI Updater inicializado para página: ${this.currentPage}`);
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        
        if (path.includes('admin')) {
            if (path.includes('dashboard')) return 'admin-dashboard';
            if (path.includes('episodios')) return 'admin-episodes';
            if (path.includes('stats')) return 'admin-stats';
            return 'admin';
        }
        
        if (path.includes('episodios')) return 'episodes';
        if (path.includes('acerca')) return 'about';
        
        return 'home';
    }

    setupEventListeners() {
        // Escuchar eventos del DataManager
        this.dataManager.on('episodeAdded', (e) => this.handleEpisodeAdded(e.detail));
        this.dataManager.on('episodeUpdated', (e) => this.handleEpisodeUpdated(e.detail));
        this.dataManager.on('episodeDeleted', (e) => this.handleEpisodeDeleted(e.detail));
        this.dataManager.on('statsUpdated', (e) => this.handleStatsUpdated(e.detail));
        this.dataManager.on('dataUpdated', (e) => this.handleDataUpdated(e.detail));
        this.dataManager.on('viewIncremented', (e) => this.handleViewIncremented(e.detail));
    }

    setupAutoRefresh() {
        // Actualizar cada 60 segundos si la página está visible
        setInterval(() => {
            if (!document.hidden) {
                this.refreshCurrentPageData();
            }
        }, 60000);

        // Actualizar cuando la página vuelve a ser visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshCurrentPageData();
            }
        });
    }

    // =============== MANEJADORES DE EVENTOS ===============

    handleEpisodeAdded(data) {
        this.queueUpdate(() => {
            switch (this.currentPage) {
                case 'home':
                    this.updateFeaturedEpisodes();
                    this.updateCounters();
                    this.showNewEpisodeNotification(data.episode);
                    break;
                    
                case 'episodes':
                    this.updateEpisodesList();
                    this.updateFilters();
                    break;
                    
                case 'admin-dashboard':
                    this.updateDashboardStats();
                    this.updateRecentEpisodes();
                    break;
                    
                case 'admin-episodes':
                    this.updateAdminEpisodesTable();
                    break;
            }
        });
    }

    handleEpisodeUpdated(data) {
        this.queueUpdate(() => {
            switch (this.currentPage) {
                case 'home':
                    this.updateFeaturedEpisodes();
                    this.updateCounters();
                    break;
                    
                case 'episodes':
                    this.updateEpisodeCard(data.episode.id);
                    break;
                    
                case 'admin-episodes':
                    this.updateAdminEpisodeRow(data.episode.id);
                    break;
            }
        });
    }

    handleEpisodeDeleted(data) {
        this.queueUpdate(() => {
            switch (this.currentPage) {
                case 'home':
                    this.updateFeaturedEpisodes();
                    this.updateCounters();
                    break;
                    
                case 'episodes':
                    this.removeEpisodeCard(data.episode.id);
                    break;
                    
                case 'admin-episodes':
                    this.removeAdminEpisodeRow(data.episode.id);
                    break;
            }
        });
    }

    handleStatsUpdated(stats) {
        this.queueUpdate(() => {
            this.updateCounters();
            if (this.currentPage.includes('admin')) {
                this.updateDashboardStats();
            }
        });
    }

    handleDataUpdated(data) {
        this.queueUpdate(() => {
            this.refreshCurrentPageData();
        });
    }

    handleViewIncremented(data) {
        this.queueUpdate(() => {
            this.updateViewCount(data.episodeId, data.views);
        });
    }

    // =============== SISTEMA DE COLA DE ACTUALIZACIONES ===============

    queueUpdate(updateFunction) {
        this.updateQueue.push(updateFunction);
        this.processUpdateQueue();
    }

    async processUpdateQueue() {
        if (this.isUpdating || this.updateQueue.length === 0) return;
        
        this.isUpdating = true;
        
        try {
            while (this.updateQueue.length > 0) {
                const update = this.updateQueue.shift();
                await update();
                
                // Pequeña pausa para evitar bloquear la UI
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        } catch (error) {
            console.error('Error procesando actualizaciones:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    // =============== ACTUALIZACIONES ESPECÍFICAS POR PÁGINA ===============

    // Página Principal
    updateFeaturedEpisodes() {
        const container = document.querySelector('.featured-episodes');
        if (!container) return;

        const featured = this.dataManager.getFeaturedEpisodes(6);
        
        if (featured.length === 0) {
            container.innerHTML = this.getEmptyState('episodios');
            return;
        }

        // Animación de salida
        container.style.opacity = '0';
        
        setTimeout(() => {
            container.innerHTML = '';
            
            featured.forEach((episode, index) => {
                const card = this.createEpisodeCard(episode);
                container.appendChild(card);
                
                // Animación de entrada escalonada
                setTimeout(() => {
                    card.classList.add('animate-in');
                }, index * 100);
            });
            
            container.style.opacity = '1';
        }, 300);
    }

    updateCounters() {
        const stats = this.dataManager.stats;
        
        this.animateCounter('episodeCounter', stats.totalEpisodes || 0);
        this.animateCounter('seasonCounter', stats.uniqueSeasons || 0);
        this.animateCounter('viewCounter', stats.totalViews || 0);
    }

    // Página de Episodios
    updateEpisodesList() {
        const container = document.getElementById('episodesContainer');
        if (!container) return;

        const episodes = this.dataManager.getEpisodes({ published: true });
        
        container.style.opacity = '0';
        
        setTimeout(() => {
            container.innerHTML = '';
            
            if (episodes.length === 0) {
                container.innerHTML = this.getEmptyState('episodios');
            } else {
                episodes.forEach((episode, index) => {
                    const card = this.createEpisodeCard(episode);
                    container.appendChild(card);
                    
                    setTimeout(() => {
                        card.classList.add('animate-in');
                    }, index * 50);
                });
            }
            
            container.style.opacity = '1';
        }, 300);
    }

    updateEpisodeCard(episodeId) {
        const episode = this.dataManager.episodes.find(ep => ep.id === episodeId);
        if (!episode) return;

        const existingCard = document.querySelector(`[data-episode-id="${episodeId}"]`);
        if (existingCard) {
            const newCard = this.createEpisodeCard(episode);
            existingCard.replaceWith(newCard);
            
            setTimeout(() => {
                newCard.classList.add('animate-in');
            }, 100);
        }
    }

    removeEpisodeCard(episodeId) {
        const card = document.querySelector(`[data-episode-id="${episodeId}"]`);
        if (card) {
            card.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                card.remove();
            }, 300);
        }
    }

    // Admin Dashboard
    updateDashboardStats() {
        const stats = this.dataManager.stats;
        
        this.updateElement('dashboardTotalEpisodes', stats.totalEpisodes || 0);
        this.updateElement('dashboardPublishedEpisodes', stats.publishedEpisodes || 0);
        this.updateElement('dashboardTotalViews', (stats.totalViews || 0).toLocaleString());
        this.updateElement('dashboardTotalLikes', (stats.totalLikes || 0).toLocaleString());
        this.updateElement('dashboardUniqueSeasons', stats.uniqueSeasons || 0);
        this.updateElement('dashboardRecentEpisodes', stats.recentEpisodes || 0);
    }

    updateRecentEpisodes() {
        const container = document.getElementById('recentEpisodesTable');
        if (!container) return;

        const recent = this.dataManager.getRecentEpisodes(5);
        
        container.innerHTML = '';
        
        recent.forEach(episode => {
            const row = this.createEpisodeTableRow(episode);
            container.appendChild(row);
        });
    }

    // Admin Episodios
    updateAdminEpisodesTable() {
        const tbody = document.getElementById('episodesTableBody');
        if (!tbody) return;

        const episodes = this.dataManager.episodes;
        
        tbody.style.opacity = '0';
        
        setTimeout(() => {
            tbody.innerHTML = '';
            
            if (episodes.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center py-5">
                            <i class="fas fa-film fa-3x text-muted mb-3 d-block"></i>
                            <p class="text-muted">No hay episodios para mostrar</p>
                            <button class="btn btn-primary" onclick="showEpisodeModal()">
                                <i class="fas fa-plus me-1"></i> Añadir primer episodio
                            </button>
                        </td>
                    </tr>
                `;
            } else {
                episodes.forEach(episode => {
                    const row = this.createAdminEpisodeRow(episode);
                    tbody.appendChild(row);
                });
            }
            
            tbody.style.opacity = '1';
            this.updateEpisodeCount();
        }, 300);
    }

    updateAdminEpisodeRow(episodeId) {
        const episode = this.dataManager.episodes.find(ep => ep.id === episodeId);
        if (!episode) return;

        const existingRow = document.querySelector(`tr[data-episode-id="${episodeId}"]`);
        if (existingRow) {
            const newRow = this.createAdminEpisodeRow(episode);
            existingRow.replaceWith(newRow);
        }
    }

    removeAdminEpisodeRow(episodeId) {
        const row = document.querySelector(`tr[data-episode-id="${episodeId}"]`);
        if (row) {
            row.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                row.remove();
                this.updateEpisodeCount();
            }, 300);
        }
    }

    updateEpisodeCount() {
        const countElement = document.getElementById('episodeCountInfo');
        if (countElement) {
            const total = this.dataManager.episodes.length;
            const published = this.dataManager.episodes.filter(ep => ep.published).length;
            countElement.textContent = `Mostrando ${total} episodios (${published} publicados)`;
        }
    }

    // =============== UTILIDADES DE ACTUALIZACIÓN ===============

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            if (element.textContent !== value.toString()) {
                element.style.transition = 'all 0.3s ease';
                element.style.transform = 'scale(1.1)';
                element.textContent = value;
                
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 150);
            }
        }
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const currentValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const steps = 30;
        const stepValue = (targetValue - currentValue) / steps;
        const stepDuration = duration / steps;

        let current = currentValue;
        let step = 0;

        const updateStep = () => {
            if (step < steps) {
                current += stepValue;
                element.textContent = Math.round(current).toLocaleString();
                step++;
                setTimeout(updateStep, stepDuration);
            } else {
                element.textContent = targetValue.toLocaleString();
            }
        };

        updateStep();
    }

    updateViewCount(episodeId, newCount) {
        const viewElements = document.querySelectorAll(`[data-episode-id="${episodeId}"] .view-count`);
        viewElements.forEach(element => {
            element.textContent = newCount.toLocaleString();
            element.style.animation = 'pulse 0.5s ease-in-out';
        });
    }

    // =============== CREACIÓN DE ELEMENTOS ===============

    createEpisodeCard(episode) {
        const col = document.createElement('div');
        col.className = 'col animate-child';
        col.setAttribute('data-episode-id', episode.id);
        
        col.innerHTML = `
            <div class="card episode-card h-100">
                <div class="position-relative">
                    <img src="${episode.thumbnail}" 
                         class="card-img-top" 
                         alt="${episode.title}"
                         loading="lazy"
                         onerror="this.src='img/thumbnail-placeholder.jpg'">
                    <div class="episode-overlay">
                        <button class="btn btn-sm btn-light play-btn" 
                                onclick="playEpisode('${episode.id}')">
                            <i class="fas fa-play-circle"></i> Ver ahora
                        </button>
                    </div>
                    ${episode.featured ? '<span class="badge bg-warning position-absolute top-0 start-0 m-2"><i class="fas fa-star me-1"></i>Destacado</span>' : ''}
                    ${episode.status === 'new' ? '<span class="badge bg-success position-absolute top-0 end-0 m-2">¡NUEVO!</span>' : ''}
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
                            <span class="badge bg-secondary view-count">
                                <i class="fas fa-eye me-1"></i>
                                ${episode.views || 0}
                            </span>
                        </div>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted d-flex align-items-center">
                            <img src="img/joshua-avatar.png" width="20" height="20" class="rounded-circle me-1" alt="Joshua">
                            Subtitulado por <strong class="ms-1">Joshua Plata</strong>
                        </small>
                    </div>
                </div>
            </div>
        `;

        return col;
    }

    createAdminEpisodeRow(episode) {
        const row = document.createElement('tr');
        row.setAttribute('data-episode-id', episode.id);
        
        row.innerHTML = `
            <td>
                <div class="form-check">
                    <input class="form-check-input episode-checkbox" type="checkbox" data-episode-id="${episode.id}">
                </div>
            </td>
            <td>
                <span class="badge bg-secondary">${episode.id.substring(3, 8)}</span>
            </td>
            <td>
                <img src="${episode.thumbnail}" alt="${episode.title}" class="episode-thumbnail" 
                     onerror="this.src='img/thumbnail-placeholder.jpg'">
            </td>
            <td>
                <div class="episode-title-cell">
                    <strong>${episode.title}</strong>
                    <div class="episode-meta mt-1">
                        ${episode.published ? '<span class="badge bg-success me-1">Publicado</span>' : '<span class="badge bg-secondary me-1">Borrador</span>'}
                        ${episode.featured ? '<span class="badge bg-warning">Destacado</span>' : ''}
                        ${episode.quality ? `<span class="badge bg-info">${episode.quality}</span>` : ''}
                    </div>
                </div>
            </td>
            <td>
                <span class="badge bg-primary">T${episode.season}E${episode.number}</span>
            </td>
            <td>
                <span class="badge ${episode.published ? 'bg-success' : 'bg-secondary'}">
                    ${episode.published ? 'Publicado' : 'Borrador'}
                </span>
            </td>
            <td>
                <small>${this.formatDate(episode.subtitleDate)}</small>
            </td>
            <td>
                <div class="d-flex align-items-center view-count">
                    <i class="fas fa-eye me-1 text-muted"></i>
                    <span>${(episode.views || 0).toLocaleString()}</span>
                </div>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editEpisode('${episode.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-info" onclick="previewEpisode('${episode.id}')" title="Vista previa">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="duplicateEpisode('${episode.id}')" title="Duplicar">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteEpisode('${episode.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    createEpisodeTableRow(episode) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <span class="badge bg-secondary">${episode.id.substring(3, 8)}</span>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${episode.thumbnail}" width="40" height="22" class="rounded me-2" 
                         alt="${episode.title}" onerror="this.src='img/thumbnail-placeholder.jpg'">
                    <div>
                        <div class="fw-bold">${episode.title}</div>
                        <small class="text-muted">T${episode.season}E${episode.number}</small>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge bg-primary">T${episode.season}</span>
            </td>
            <td>
                <span class="badge bg-info">${episode.number}</span>
            </td>
            <td>
                <small>${this.formatDate(episode.subtitleDate)}</small>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <i class="fas fa-eye me-1 text-muted"></i>
                    <span>${(episode.views || 0).toLocaleString()}</span>
                </div>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary btn-sm" onclick="editEpisode('${episode.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-info btn-sm" onclick="previewEpisode('${episode.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    // =============== NOTIFICACIONES ===============

    showNewEpisodeNotification(episode) {
        if (window.notificationSystem) {
            window.notificationSystem.showNotification({
                message: `¡Nuevo episodio disponible! 🎬`,
                submessage: episode.title,
                type: 'new-episode',
                action: {
                    text: '¡Ver ahora!',
                    callback: () => this.playEpisode(episode.id)
                },
                duration: 8000
            });
        }
    }

    playEpisode(episodeId) {
        // Incrementar vistas
        this.dataManager.incrementViews(episodeId);
        
        // Mostrar modal o redirigir
        const episode = this.dataManager.episodes.find(ep => ep.id === episodeId);
        if (episode) {
            // Aquí puedes implementar la lógica de reproducción
            window.location.href = `episodios.html?play=${episodeId}`;
        }
    }

    // =============== UTILIDADES ===============

    formatDate(dateString) {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    getEmptyState(type) {
        const states = {
            episodios: `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-film fa-4x text-muted mb-3"></i>
                    <h4 class="text-muted">No hay episodios disponibles</h4>
                    <p class="text-muted">Los nuevos episodios aparecerán aquí cuando estén listos.</p>
                </div>
            `
        };
        
        return states[type] || states.episodios;
    }

    refreshCurrentPageData() {
        switch (this.currentPage) {
            case 'home':
                this.updateFeaturedEpisodes();
                this.updateCounters();
                break;
                
            case 'episodes':
                this.updateEpisodesList();
                break;
                
            case 'admin-dashboard':
                this.updateDashboardStats();
                this.updateRecentEpisodes();
                break;
                
            case 'admin-episodes':
                this.updateAdminEpisodesTable();
                break;
        }
    }
}

// Inicializar cuando el DataManager esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que el DataManager esté disponible
    const initUIUpdater = () => {
        if (window.dataManager) {
            window.uiUpdater = new UIUpdater();
        } else {
            setTimeout(initUIUpdater, 100);
        }
    };
    
    initUIUpdater();
});

// CSS para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.8); }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(-100%); opacity: 0; }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    .animate-child {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease;
    }
    
    .animate-child.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .episode-thumbnail {
        width: 60px;
        height: 34px;
        object-fit: cover;
        border-radius: 4px;
    }
    
    .episode-title-cell strong {
        display: block;
        margin-bottom: 0.25rem;
    }
    
    .episode-meta {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
    }
`;
document.head.appendChild(style);