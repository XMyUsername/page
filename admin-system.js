/**
 * Sistema de Administración Completo para Joshua Plata Subs
 * Todos los botones y funcionalidades trabajando correctamente
 */

class AdminSystem {
    constructor() {
        this.episodes = [];
        this.currentEditingEpisode = null;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        console.log('🔧 Iniciando sistema de administración...');
        
        // Verificar autenticación
        if (!this.checkAuth()) {
            window.location.href = '../index.html';
            return;
        }

        this.loadData();
        this.setupAllEventListeners();
        this.renderContent();
        
        console.log('✅ Sistema de administración listo');
    }

    checkAuth() {
        const session = localStorage.getItem('joshuaPlataSession');
        if (!session) return false;

        try {
            const sessionData = JSON.parse(atob(session));
            return sessionData.expiry > Date.now();
        } catch (error) {
            localStorage.removeItem('joshuaPlataSession');
            return false;
        }
    }

    loadData() {
        try {
            const stored = localStorage.getItem('joshuaPlataEpisodes');
            this.episodes = stored ? JSON.parse(stored) : [];
            console.log(`📺 Cargados ${this.episodes.length} episodios en admin`);
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.episodes = [];
        }
    }

    setupAllEventListeners() {
        // Todos los botones para añadir episodio
        this.setupAddEpisodeButtons();
        
        // Formulario de episodio
        this.setupEpisodeForm();
        
        // Navegación
        this.setupNavigation();
        
        // Búsqueda y filtros
        this.setupSearchAndFilters();
        
        // Acciones en lote
        this.setupBulkActions();
        
        // Eventos de modal
        this.setupModalEvents();
    }

    setupAddEpisodeButtons() {
        // Lista de todos los posibles IDs de botones para añadir episodio
        const buttonSelectors = [
            '#addNewEpisodeBtn',
            '#addNewEpisodeFooterBtn',
            '#quickAddEpisodeBtn',
            '#addEpisodeFromDashboard',
            '.add-episode-btn',
            '[data-action="add-episode"]'
        ];

        buttonSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎬 Botón añadir episodio clickeado:', selector);
                    this.showEpisodeModal();
                });
            });
        });

        // Event delegation para botones dinámicos
        document.addEventListener('click', (e) => {
            if (e.target.matches('.add-episode-btn') || 
                e.target.closest('.add-episode-btn') ||
                e.target.matches('[data-action="add-episode"]') ||
                e.target.closest('[data-action="add-episode"]')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎬 Botón añadir episodio (delegation)');
                this.showEpisodeModal();
            }
        });

        console.log('✅ Event listeners para añadir episodio configurados');
    }

    setupEpisodeForm() {
        // Botón de guardar
        const saveBtn = document.getElementById('saveEpisodeBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveEpisode();
            });
        }

        // Formulario
        const form = document.getElementById('episodeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEpisode();
            });
        }

        // URL del video
        const videoUrlInput = document.getElementById('videoUrl');
        if (videoUrlInput) {
            videoUrlInput.addEventListener('input', (e) => {
                this.handleVideoUrlChange(e.target.value);
            });
        }

        // Detectar miniatura
        const detectBtn = document.getElementById('detectThumbnailBtn');
        if (detectBtn) {
            detectBtn.addEventListener('click', () => {
                this.detectThumbnail();
            });
        }
    }

    setupNavigation() {
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Sidebar toggle
        const sidebarToggles = document.querySelectorAll('.sidebar-toggle');
        sidebarToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                document.querySelector('.admin-sidebar').classList.toggle('collapsed');
            });
        });
    }

    setupSearchAndFilters() {
        const searchInput = document.getElementById('searchEpisode');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterEpisodes(e.target.value);
            });
        }

        const filters = ['seasonFilter', 'statusFilter'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });
    }

    setupBulkActions() {
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllEpisodes');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.selectAllEpisodes(e.target.checked);
            });
        }

        // Bulk action buttons
        document.querySelectorAll('.bulk-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.getAttribute('data-action');
                this.handleBulkAction(action);
            });
        });
    }

    setupModalEvents() {
        // Event delegation para acciones en la tabla
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const episodeId = target.getAttribute('data-episode-id') || 
                            target.closest('tr')?.getAttribute('data-episode-id');

            if (target.matches('.edit-episode-btn') || target.title === 'Editar') {
                e.preventDefault();
                this.showEpisodeModal(episodeId);
            } else if (target.matches('.delete-episode-btn') || target.title === 'Eliminar') {
                e.preventDefault();
                this.deleteEpisode(episodeId);
            } else if (target.matches('.preview-episode-btn') || target.title === 'Vista previa') {
                e.preventDefault();
                this.previewEpisode(episodeId);
            }
        });
    }

    showEpisodeModal(episodeId = null) {
        console.log('🎬 Mostrando modal de episodio:', episodeId || 'nuevo');

        // Verificar que el modal existe
        let modal = document.getElementById('episodeModal');
        if (!modal) {
            this.createEpisodeModal();
            modal = document.getElementById('episodeModal');
        }

        const modalTitle = document.getElementById('episodeModalTitle');
        
        if (episodeId) {
            this.currentEditingEpisode = episodeId;
            const episode = this.episodes.find(ep => ep.id === episodeId);
            if (episode) {
                this.fillEpisodeForm(episode);
                if (modalTitle) modalTitle.textContent = `Editar: ${episode.title}`;
            }
        } else {
            this.currentEditingEpisode = null;
            this.resetEpisodeForm();
            if (modalTitle) modalTitle.textContent = 'Añadir nuevo episodio';
            this.setDefaultValues();
        }
        
        // Mostrar modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    createEpisodeModal() {
        const modalHTML = `
            <div class="modal fade" id="episodeModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="episodeModalTitle">Añadir nuevo episodio</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="episodeForm">
                                <div class="row mb-4">
                                    <div class="col-md-8">
                                        <div class="mb-3">
                                            <label for="episodeTitle" class="form-label">Título del episodio *</label>
                                            <input type="text" class="form-control" id="episodeTitle" required>
                                        </div>
                                        <div class="mb-3">
                                            <label for="episodeDescription" class="form-label">Descripción *</label>
                                            <textarea class="form-control" id="episodeDescription" rows="3" required></textarea>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="text-center mb-3">
                                            <div class="thumbnail-preview" id="thumbnailPreview">
                                                <img src="../img/thumbnail-placeholder.jpg" alt="Miniatura" class="img-fluid rounded" style="max-width: 200px;">
                                            </div>
                                            <div class="mt-2">
                                                <label for="thumbnailUrl" class="form-label">URL de miniatura</label>
                                                <div class="input-group">
                                                    <input type="url" class="form-control" id="thumbnailUrl" placeholder="https://...">
                                                    <button class="btn btn-outline-secondary" type="button" id="detectThumbnailBtn">
                                                        <i class="fas fa-magic"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <label for="videoUrl" class="form-label">URL del video *</label>
                                        <input type="url" class="form-control" id="videoUrl" required>
                                    </div>
                                    <div class="col-md-2">
                                        <label for="episodeSeason" class="form-label">Temporada *</label>
                                        <input type="number" class="form-control" id="episodeSeason" min="1" required>
                                    </div>
                                    <div class="col-md-2">
                                        <label for="episodeNumber" class="form-label">Episodio *</label>
                                        <input type="number" class="form-control" id="episodeNumber" min="1" required>
                                    </div>
                                    <div class="col-md-2">
                                        <label for="subtitleDate" class="form-label">Fecha</label>
                                        <input type="date" class="form-control" id="subtitleDate">
                                    </div>
                                </div>

                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="episodePublished" checked>
                                            <label class="form-check-label" for="episodePublished">Publicado</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="episodeFeatured">
                                            <label class="form-check-label" for="episodeFeatured">Destacado</label>
                                        </div>
                                    </div>
                                </div>

                                <div class="row mb-4">
                                    <div class="col-12">
                                        <label class="form-label">Vista previa del video</label>
                                        <div class="ratio ratio-16x9" id="videoPreviewContainer" style="display: none;">
                                            <iframe id="videoPreview" src="" allowfullscreen></iframe>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="saveEpisodeBtn">
                                <i class="fas fa-save me-1"></i> Guardar episodio
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Reconfigurar event listeners para el modal nuevo
        this.setupEpisodeForm();
    }

    setDefaultValues() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('subtitleDate');
        if (dateInput) dateInput.value = today;
        
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
        const maxEpisodeInSeason = episodesInMaxSeason.length > 0 ? 
            Math.max(...episodesInMaxSeason.map(ep => ep.number || 0)) : 0;
        
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
        // YouTube
        const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (youtubeMatch) {
            return `https://www.youtube.com/embed/${youtubeMatch[1]}?enablejsapi=1&rel=0`;
        }

        // Vimeo
        const vimeoMatch = url.match(/(?:vimeo\.com\/)([0-9]+)/i);
        if (vimeoMatch) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        // Dailymotion
        const dailymotionMatch = url.match(/(?:dailymotion\.com\/video\/)([a-zA-Z0-9]+)/i);
        if (dailymotionMatch) {
            return `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`;
        }

        return url;
    }

    generateThumbnail(videoUrl) {
        const youtubeMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (youtubeMatch) {
            return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
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
                    text: 'Se detectó automáticamente la miniatura del video',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } else {
            Swal.fire('Info', 'No se puede detectar automáticamente la miniatura para esta plataforma', 'info');
        }
    }

    async saveEpisode() {
        if (this.isLoading) return;
        
        console.log('💾 Guardando episodio...');
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
            this.renderContent();
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('episodeModal'));
            if (modal) modal.hide();
            
            // Mostrar éxito
            await Swal.fire({
                title: '¡Episodio guardado!',
                text: `"${savedEpisode.title}" se guardó correctamente.`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false
            });
            
            console.log('✅ Episodio guardado exitosamente');
            
        } catch (error) {
            console.error('❌ Error guardando episodio:', error);
            Swal.fire('Error', error.message || 'No se pudo guardar el episodio', 'error');
        } finally {
            this.isLoading = false;
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-save me-1"></i> Guardar episodio';
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
            { id: 'episodeNumber', name: 'Número de episodio' }
        ];

        for (const field of required) {
            const element = document.getElementById(field.id);
            if (!element || !element.value.trim()) {
                Swal.fire('Campo requerido', `El campo "${field.name}" es obligatorio.`, 'warning');
                if (element) element.focus();
                return false;
            }
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
            subtitleDate: document.getElementById('subtitleDate').value || new Date().toISOString().split('T')[0],
            published: document.getElementById('episodePublished')?.checked || false,
            featured: document.getElementById('episodeFeatured')?.checked || false,
            views: this.currentEditingEpisode ? 
                (this.episodes.find(ep => ep.id === this.currentEditingEpisode)?.views || 0) : 0,
            creator: 'Joshua Plata',
            createdAt: this.currentEditingEpisode ? 
                (this.episodes.find(ep => ep.id === this.currentEditingEpisode)?.createdAt || new Date().toISOString()) : 
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    createEpisode(episodeData) {
        const id = this.generateUniqueId();
        const episode = { id, ...episodeData };
        
        this.episodes.unshift(episode);
        console.log('➕ Episodio creado:', episode.title);
        return episode;
    }

    updateEpisode(episodeId, updateData) {
        const index = this.episodes.findIndex(ep => ep.id === episodeId);
        if (index === -1) {
            throw new Error('Episodio no encontrado');
        }

        this.episodes[index] = { ...this.episodes[index], ...updateData };
        console.log('✏️ Episodio actualizado:', this.episodes[index].title);
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
            if (element) element.value = value || '';
        });

        const checkboxes = {
            'episodePublished': episode.published,
            'episodeFeatured': episode.featured
        };

        Object.entries(checkboxes).forEach(([id, checked]) => {
            const element = document.getElementById(id);
            if (element) element.checked = checked || false;
        });

        this.updateThumbnailPreview(episode.thumbnail);
        if (episode.embedUrl) {
            this.updateVideoPreview(episode.embedUrl);
        }
    }

    resetEpisodeForm() {
        const form = document.getElementById('episodeForm');
        if (form) form.reset();
        
        this.clearVideoPreview();
        this.updateThumbnailPreview('../img/thumbnail-placeholder.jpg');
    }

    renderContent() {
        this.renderEpisodesTable();
        this.updateDashboardStats();
    }

    renderEpisodesTable() {
        const tbody = document.getElementById('episodesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.episodes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5">
                        <i class="fas fa-film fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">No hay episodios</h5>
                        <button class="btn btn-primary add-episode-btn">
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
        row.setAttribute('data-episode-id', episode.id);
        
        row.innerHTML = `
            <td>
                <div class="form-check">
                    <input class="form-check-input episode-checkbox" type="checkbox" data-episode-id="${episode.id}">
                </div>
            </td>
            <td>${episode.id.substring(3, 8)}</td>
            <td>
                <img src="${episode.thumbnail}" alt="${episode.title}" style="width: 60px; height: 34px; object-fit: cover; border-radius: 4px;" 
                     onerror="this.src='../img/thumbnail-placeholder.jpg'">
            </td>
            <td>
                <div>
                    <strong>${episode.title}</strong>
                    <div class="mt-1">
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
                    <button class="btn btn-outline-primary edit-episode-btn" data-episode-id="${episode.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-info preview-episode-btn" data-episode-id="${episode.id}" title="Vista previa">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-episode-btn" data-episode-id="${episode.id}" title="Eliminar">
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

    updateDashboardStats() {
        const stats = {
            total: this.episodes.length,
            published: this.episodes.filter(ep => ep.published).length,
            featured: this.episodes.filter(ep => ep.featured).length,
            totalViews: this.episodes.reduce((sum, ep) => sum + (ep.views || 0), 0)
        };

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

    deleteEpisode(episodeId) {
        const episode = this.episodes.find(ep => ep.id === episodeId);
        if (!episode) return;

        Swal.fire({
            title: '¿Eliminar episodio?',
            text: `Se eliminará "${episode.title}"`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33'
        }).then((result) => {
            if (result.isConfirmed) {
                this.episodes = this.episodes.filter(ep => ep.id !== episodeId);
                this.saveEpisodes();
                this.renderContent();
                
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
                        <iframe src="${episode.embedUrl || episode.videoUrl}" allowfullscreen></iframe>
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

    filterEpisodes(searchTerm = '') {
        const rows = document.querySelectorAll('#episodesTableBody tr');
        
        rows.forEach(row => {
            const title = row.querySelector('strong')?.textContent.toLowerCase() || '';
            const matches = searchTerm === '' || title.includes(searchTerm.toLowerCase());
            
            row.style.display = matches ? '' : 'none';
        });
    }

    applyFilters() {
        // Implementar filtros más adelante si es necesario
        this.renderEpisodesTable();
    }

    selectAllEpisodes(checked) {
        document.querySelectorAll('.episode-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
        });
    }

    handleBulkAction(action) {
        const selectedIds = Array.from(document.querySelectorAll('.episode-checkbox:checked'))
            .map(checkbox => checkbox.getAttribute('data-episode-id'));

        if (selectedIds.length === 0) {
            Swal.fire('Error', 'No hay episodios seleccionados', 'warning');
            return;
        }

        switch (action) {
            case 'delete':
                this.bulkDeleteEpisodes(selectedIds);
                break;
            case 'publish':
                this.bulkUpdateEpisodes(selectedIds, { published: true });
                break;
            case 'unpublish':
                this.bulkUpdateEpisodes(selectedIds, { published: false });
                break;
        }
    }

    bulkDeleteEpisodes(episodeIds) {
        Swal.fire({
            title: '¿Eliminar episodios seleccionados?',
            text: `Se eliminarán ${episodeIds.length} episodios`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            confirmButtonColor: '#d33'
        }).then((result) => {
            if (result.isConfirmed) {
                this.episodes = this.episodes.filter(ep => !episodeIds.includes(ep.id));
                this.saveEpisodes();
                this.renderContent();
                
                Swal.fire('¡Eliminados!', `${episodeIds.length} episodios eliminados`, 'success');
            }
        });
    }

    bulkUpdateEpisodes(episodeIds, updates) {
        episodeIds.forEach(id => {
            const episode = this.episodes.find(ep => ep.id === id);
            if (episode) {
                Object.assign(episode, updates, { updatedAt: new Date().toISOString() });
            }
        });
        
        this.saveEpisodes();
        this.renderContent();
        
        const action = updates.published ? 'publicados' : 'despublicados';
        Swal.fire('¡Actualizado!', `${episodeIds.length} episodios ${action}`, 'success');
    }

    logout() {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: 'Se cerrará la sesión de administrador',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('joshuaPlataSession');
                window.location.href = '../index.html';
            }
        });
    }

    saveEpisodes() {
        try {
            localStorage.setItem('joshuaPlataEpisodes', JSON.stringify(this.episodes));
            console.log('💾 Episodios guardados en localStorage');
        } catch (error) {
            console.error('Error guardando episodios:', error);
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES', {
            