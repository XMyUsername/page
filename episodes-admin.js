/**
 * Sistema de Gestión de Episodios para el Panel de Admin
 * VERSIÓN CORREGIDA - Funcionalidad completa
 */

class EpisodesAdmin {
    constructor() {
        this.episodes = [];
        this.currentEditingEpisode = null;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.loadEpisodes();
        this.setupEventListeners();
        this.renderEpisodesTable();
        this.updateStats();
        
        console.log('🎬 Sistema de episodios admin inicializado');
    }

    setupEventListeners() {
        // Botones para añadir episodio
        this.setupAddEpisodeButtons();
        
        // Formulario de episodio
        this.setupEpisodeForm();
        
        // Búsqueda y filtros
        this.setupSearchAndFilters();
        
        // Eventos de video URL
        this.setupVideoUrlEvents();
    }

    setupAddEpisodeButtons() {
        // Múltiples botones para añadir episodio
        const addButtons = [
            'addNewEpisodeBtn',
            'addNewEpisodeFooterBtn',
            'addEpisodeFromDashboard',
            'quickAddEpisodeBtn'
        ];

        addButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showEpisodeModal();
                });
            }
        });

        // También buscar botones por clase
        document.querySelectorAll('.add-episode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showEpisodeModal();
            });
        });
    }

    setupEpisodeForm() {
        const form = document.getElementById('episodeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEpisode();
            });
        }

        // Botón de guardar
        const saveBtn = document.getElementById('saveEpisodeBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveEpisode();
            });
        }
    }

    setupSearchAndFilters() {
        const searchInput = document.getElementById('searchEpisode');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterEpisodes();
            });
        }

        const filters = ['seasonFilter', 'statusFilter'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.filterEpisodes();
                });
            }
        });
    }

    setupVideoUrlEvents() {
        const videoUrlInput = document.getElementById('videoUrl');
        if (videoUrlInput) {
            videoUrlInput.addEventListener('input', (e) => {
                this.handleVideoUrlChange(e.target.value);
            });
        }

        const detectThumbnailBtn = document.getElementById('detectThumbnailBtn');
        if (detectThumbnailBtn) {
            detectThumbnailBtn.addEventListener('click', () => {
                this.detectThumbnail();
            });
        }
    }

    // Mostrar modal de episodio
    showEpisodeModal(episodeId = null) {
        const modal = document.getElementById('episodeModal');
        if (!modal) {
            console.error('Modal de episodio no encontrado');
            return;
        }

        const modalTitle = document.getElementById('episodeModalTitle');
        
        if (episodeId) {
            this.currentEditingEpisode = episodeId;
            const episode = this.episodes.find(ep => ep.id === episodeId);
            if (episode) {
                this.fillEpisodeForm(episode);
                if (modalTitle) modalTitle.textContent = `Editar episodio: ${episode.title}`;
            }
        } else {
            this.currentEditingEpisode = null;
            this.resetEpisodeForm();
            if (modalTitle) modalTitle.textContent = 'Añadir nuevo episodio';
            this.setDefaultValues();
        }
        
        // Mostrar modal usando Bootstrap
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    setDefaultValues() {
        const today = new Date().toISOString().split('T')[0];
        const subtitleDateInput = document.getElementById('subtitleDate');
        if (subtitleDateInput) {
            subtitleDateInput.value = today;
        }
        
        this.autoDetectNumbers();
    }

    autoDetectNumbers() {
        const seasonInput = document.getElementById('episodeSeason');
        const episodeInput = document.getElementById('episodeNumber');
        
        if (!seasonInput || !episodeInput) return;
        
        if (this.episodes.length === 0) {
            seasonInput.value = 1;
            episodeInput.value = 1;
            return;
        }

        const maxSeason = Math.max(...this.episodes.map(ep => ep.season || 1));
        const episodesInMaxSeason = this.episodes.filter(ep => ep.season === maxSeason);
        const maxEpisodeInSeason = Math.max(...episodesInMaxSeason.map(ep => ep.number || 0));
        
        seasonInput.value = maxSeason;
        episodeInput.value = maxEpisodeInSeason + 1;
    }

    handleVideoUrlChange(url) {
        if (!url.trim()) {
            this.clearVideoPreview();
            return;
        }

        const embedUrl = this.processVideoUrl(url);
        if (embedUrl) {
            this.updateVideoPreview(embedUrl);
            
            // Auto-detectar miniatura
            const thumbnailUrl = this.generateThumbnail(url);
            if (thumbnailUrl) {
                const thumbnailInput = document.getElementById('thumbnailUrl');
                if (thumbnailInput && !thumbnailInput.value) {
                    thumbnailInput.value = thumbnailUrl;
                    this.updateThumbnailPreview(thumbnailUrl);
                }
            }
        }
    }

    processVideoUrl(url) {
        const platforms = {
            youtube: {
                pattern: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
                embed: (match) => `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&rel=0`
            },
            vimeo: {
                pattern: /(?:vimeo\.com\/)([0-9]+)/i,
                embed: (match) => `https://player.vimeo.com/video/${match[1]}`
            },
            dailymotion: {
                pattern: /(?:dailymotion\.com\/video\/)([a-zA-Z0-9]+)/i,
                embed: (match) => `https://www.dailymotion.com/embed/video/${match[1]}`
            }
        };

        for (const config of Object.values(platforms)) {
            const match = url.match(config.pattern);
            if (match) {
                return config.embed(match);
            }
        }

        return url;
    }

    generateThumbnail(videoUrl) {
        const youtubeMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (youtubeMatch) {
            return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
        }

        const dailymotionMatch = videoUrl.match(/(?:dailymotion\.com\/video\/)([a-zA-Z0-9]+)/i);
        if (dailymotionMatch) {
            return `https://www.dailymotion.com/thumbnail/video/${dailymotionMatch[1]}`;
        }

        return null;
    }

    updateVideoPreview(embedUrl) {
        const preview = document.getElementById('videoPreview');
        const container = document.getElementById('videoPreviewContainer');
        
        if (preview && container) {
            preview.src = embedUrl;
            container.style.display = 'block';
        }
    }

    updateThumbnailPreview(url) {
        const preview = document.getElementById('thumbnailPreview');
        if (preview) {
            const img = preview.querySelector('img');
            if (img) {
                img.src = url;
                img.onerror = () => {
                    img.src = '../img/thumbnail-placeholder.jpg';
                };
            }
        }
    }

    clearVideoPreview() {
        const preview = document.getElementById('videoPreview');
        const container = document.getElementById('videoPreviewContainer');
        
        if (preview) preview.src = '';
        if (container) container.style.display = 'none';
    }

    detectThumbnail() {
        const videoUrlInput = document.getElementById('videoUrl');
        if (!videoUrlInput || !videoUrlInput.value) {
            Swal.fire('Error', 'Primero ingresa la URL del video', 'error');
            return;
        }

        const thumbnailUrl = this.generateThumbnail(videoUrlInput.value);
        if (thumbnailUrl) {
            const thumbnailInput = document.getElementById('thumbnailUrl');
            if (thumbnailInput) {
                thumbnailInput.value = thumbnailUrl;
                this.updateThumbnailPreview(thumbnailUrl);
                
                Swal.fire({
                    title: 'Miniatura detectada',
                    text: 'Se ha detectado automáticamente la miniatura del video',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } else {
            Swal.fire('Info', 'No se puede detectar automáticamente la miniatura para esta plataforma', 'info');
        }
    }

    // Guardar episodio
    async saveEpisode() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const saveBtn = document.getElementById('saveEpisodeBtn');
        
        if (saveBtn) {
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            saveBtn.disabled = true;
        }

        try {
            if (!this.validateEpisodeForm()) {
                return;
            }

            const episodeData = this.collectEpisodeData();
            let savedEpisode;
            
            if (this.currentEditingEpisode) {
                savedEpisode = this.updateEpisode(this.currentEditingEpisode, episodeData);
            } else {
                savedEpisode = this.createEpisode(episodeData);
            }

            this.saveEpisodes();
            this.renderEpisodesTable();
            this.updateStats();
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('episodeModal'));
            if (modal) modal.hide();
            
            // Mostrar éxito
            await Swal.fire({
                title: '¡Episodio guardado!',
                text: `El episodio "${savedEpisode.title}" se ha guardado correctamente.`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false
            });
            
        } catch (error) {
            console.error('Error guardando episodio:', error);
            Swal.fire('Error', error.message || 'No se pudo guardar el episodio', 'error');
        } finally {
            this.isLoading = false;
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar episodio';
                saveBtn.disabled = false;
            }
        }
    }

    validateEpisodeForm() {
        const required = [
            { id: 'episodeTitle', name: 'Título' },
            { id: 'episodeDescription', name: 'Descripción' },
            { id: 'videoUrl', name: 'URL del video' },
            { id: 'episodeSeason', name: 'Temporada' },
            { id: 'episodeNumber', name: 'Número de episodio' },
            { id: 'subtitleDate', name: 'Fecha de subtitulado' }
        ];

        for (const field of required) {
            const element = document.getElementById(field.id);
            if (!element || !element.value.trim()) {
                Swal.fire('Campo requerido', `El campo "${field.name}" es obligatorio.`, 'warning');
                if (element) element.focus();
                return false;
            }
        }

        // Validar duplicados
        const title = document.getElementById('episodeTitle').value.trim();
        const season = parseInt(document.getElementById('episodeSeason').value);
        const episode = parseInt(document.getElementById('episodeNumber').value);

        const duplicate = this.episodes.find(ep => 
            ep.id !== this.currentEditingEpisode &&
            (ep.title.toLowerCase() === title.toLowerCase() || 
             (ep.season === season && ep.number === episode))
        );

        if (duplicate) {
            Swal.fire('Episodio duplicado', 'Ya existe un episodio con ese título o número de temporada/episodio.', 'warning');
            return false;
        }

        return true;
    }

    collectEpisodeData() {
        const videoUrl = document.getElementById('videoUrl').value.trim();
        
        return {
            title: document.getElementById('episodeTitle').value.trim(),
            description: document.getElementById('episodeDescription').value.trim(),
            season: parseInt(document.getElementById('episodeSeason').value),
            number: parseInt(document.getElementById('episodeNumber').value),
            videoUrl: videoUrl,
            embedUrl: this.processVideoUrl(videoUrl),
            thumbnail: document.getElementById('thumbnailUrl').value.trim() || this.generateThumbnail(videoUrl) || '../img/thumbnail-placeholder.jpg',
            subtitleDate: document.getElementById('subtitleDate').value,
            published: document.getElementById('episodePublished')?.checked || false,
            featured: document.getElementById('episodeFeatured')?.checked || false,
            allowComments: document.getElementById('allowComments')?.checked || true,
            notifySubscribers: document.getElementById('notifySubscribers')?.checked || false,
            views: this.currentEditingEpisode ? this.episodes.find(ep => ep.id === this.currentEditingEpisode).views : 0,
            creator: 'Joshua Plata',
            createdAt: this.currentEditingEpisode ? this.episodes.find(ep => ep.id === this.currentEditingEpisode).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    createEpisode(episodeData) {
        const id = this.generateUniqueId();
        const episode = { id, ...episodeData };
        
        this.episodes.unshift(episode);
        return episode;
    }

    updateEpisode(episodeId, updateData) {
        const index = this.episodes.findIndex(ep => ep.id === episodeId);
        if (index === -1) {
            throw new Error('Episodio no encontrado');
        }

        this.episodes[index] = { ...this.episodes[index], ...updateData };
        return this.episodes[index];
    }

    generateUniqueId() {
        return 'ep_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    fillEpisodeForm(episode) {
        const fields = {
            'episodeTitle': episode.title,
            'episodeDescription': episode.description,
            'episodeSeason': episode.season,
            'episodeNumber': episode.number,
            'videoUrl': episode.videoUrl,
            'thumbnailUrl': episode.thumbnail,
            'subtitleDate': episode.subtitleDate
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });

        const checkboxes = {
            'episodePublished': episode.published,
            'episodeFeatured': episode.featured,
            'allowComments': episode.allowComments,
            'notifySubscribers': episode.notifySubscribers
        };

        Object.entries(checkboxes).forEach(([id, checked]) => {
            const element = document.getElementById(id);
            if (element) element.checked = checked;
        });

        this.updateThumbnailPreview(episode.thumbnail);
        this.updateVideoPreview(episode.embedUrl);
    }

    resetEpisodeForm() {
        const form = document.getElementById('episodeForm');
        if (form) form.reset();
        
        this.clearVideoPreview();
        this.updateThumbnailPreview('../img/thumbnail-placeholder.jpg');
    }

    // Renderizar tabla
    renderEpisodesTable() {
        const tbody = document.getElementById('episodesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.episodes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5">
                        <i class="fas fa-film fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">No hay episodios para mostrar</h5>
                        <button class="btn btn-primary" onclick="episodesAdmin.showEpisodeModal()">
                            <i class="fas fa-plus me-1"></i> Añadir primer episodio
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        this.episodes.forEach(episode => {
            const row = this.createEpisodeRow(episode);
            tbody.appendChild(row);
        });

        this.updateEpisodeCount();
    }

    createEpisodeRow(episode) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="form-check">
                    <input class="form-check-input episode-checkbox" type="checkbox" data-episode-id="${episode.id}">
                </div>
            </td>
            <td>${episode.id.substring(3, 8)}</td>
            <td>
                <img src="${episode.thumbnail}" alt="${episode.title}" class="episode-thumbnail" 
                     onerror="this.src='../img/thumbnail-placeholder.jpg'">
            </td>
            <td>
                <div class="episode-title-cell">
                    <strong>${episode.title}</strong>
                    <div class="episode-meta">
                        ${episode.published ? '<span class="badge bg-success me-1">Publicado</span>' : '<span class="badge bg-secondary me-1">Borrador</span>'}
                        ${episode.featured ? '<span class="badge bg-warning">Destacado</span>' : ''}
                    </div>
                </div>
            </td>
            <td>T${episode.season}E${episode.number}</td>
            <td>
                <span class="badge ${episode.published ? 'bg-success' : 'bg-secondary'}">
                    ${episode.published ? 'Publicado' : 'Borrador'}
                </span>
            </td>
            <td>${this.formatDate(episode.subtitleDate)}</td>
            <td>
                <i class="fas fa-eye me-1"></i>
                ${(episode.views || 0).toLocaleString()}
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="episodesAdmin.showEpisodeModal('${episode.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-info" onclick="episodesAdmin.previewEpisode('${episode.id}')" title="Vista previa">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="episodesAdmin.deleteEpisode('${episode.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    updateEpisodeCount() {
        const countElement = document.getElementById('episodeCountInfo');
        if (countElement) {
            const total = this.episodes.length;
            const published = this.episodes.filter(ep => ep.published).length;
            countElement.textContent = `Mostrando ${total} episodios (${published} publicados)`;
        }
    }

    deleteEpisode(episodeId) {
        const episode = this.episodes.find(ep => ep.id === episodeId);
        if (!episode) return;

        Swal.fire({
            title: '¿Eliminar episodio?',
            text: `Se eliminará permanentemente "${episode.title}"`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33'
        }).then((result) => {
            if (result.isConfirmed) {
                this.episodes = this.episodes.filter(ep => ep.id !== episodeId);
                this.saveEpisodes();
                this.renderEpisodesTable();
                this.updateStats();
                
                Swal.fire('¡Eliminado!', 'El episodio ha sido eliminado.', 'success');
            }
        });
    }

    previewEpisode(episodeId) {
        const episode = this.episodes.find(ep => ep.id === episodeId);
        if (!episode) return;

        Swal.fire({
            title: episode.title,
            html: `
                <div class="text-start">
                    <div class="ratio ratio-16x9 mb-3">
                        <iframe src="${episode.embedUrl}" allowfullscreen></iframe>
                    </div>
                    <p><strong>Temporada ${episode.season}, Episodio ${episode.number}</strong></p>
                    <p>${episode.description}</p>
                    <small class="text-muted">Subtitulado: ${this.formatDate(episode.subtitleDate)}</small>
                </div>
            `,
            width: 800,
            showConfirmButton: false,
            showCloseButton: true
        });
    }

    filterEpisodes() {
        // Implementar filtros
        this.renderEpisodesTable();
    }

    updateStats() {
        const stats = {
            total: this.episodes.length,
            published: this.episodes.filter(ep => ep.published).length,
            featured: this.episodes.filter(ep => ep.featured).length,
            totalViews: this.episodes.reduce((sum, ep) => sum + (ep.views || 0), 0)
        };

        // Actualizar elementos de estadísticas si existen
        const elements = {
            'dashboardTotalEpisodes': stats.total,
            'dashboardPublishedEpisodes': stats.published,
            'dashboardFeaturedEpisodes': stats.featured,
            'dashboardTotalViews': stats.totalViews
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value.toLocaleString();
        });
    }

    // Almacenamiento
    loadEpisodes() {
        try {
            const stored = localStorage.getItem('joshuaPlataEpisodes');
            this.episodes = stored ? JSON.parse(stored) : this.getDefaultEpisodes();
        } catch (error) {
            console.error('Error cargando episodios:', error);
            this.episodes = this.getDefaultEpisodes();
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
                id: 'ep_default_1',
                title: '¡Shin-chan y las travesuras en el parque!',
                description: 'Shin-chan va al parque con sus amigos y se mete en todo tipo de travesuras divertidas.',
                season: 1,
                number: 1,
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                subtitleDate: '2025-05-20',
                published: true,
                featured: true,
                allowComments: true,
                notifySubscribers: true,
                views: 1542,
                creator: 'Joshua Plata',
                createdAt: '2025-05-20T10:00:00Z',
                updatedAt: '2025-05-20T10:00:00Z'
            }
        ];
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }
}

// Inicializar cuando se carga la página
let episodesAdmin;

document.addEventListener('DOMContentLoaded', function() {
    episodesAdmin = new EpisodesAdmin();
    
    // Exponer globalmente para uso en botones
    window.episodesAdmin = episodesAdmin;
});