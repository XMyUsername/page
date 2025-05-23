/**
 * Sistema de Administración Completo para Joshua Plata Subs
 * TODAS las funcionalidades trabajando perfectamente
 */

class AdminSystemComplete {
    constructor() {
        this.episodes = [];
        this.currentEditingEpisode = null;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        console.log('🔧 Iniciando sistema de administración completo...');
        
        // Verificar autenticación PRIMERO
        if (!this.checkAuth()) {
            this.redirectToLogin();
            return;
        }

        // Cargar datos
        this.loadData();
        
        // Configurar TODOS los event listeners
        this.setupAllEventListeners();
        
        // Renderizar contenido
        this.renderAllContent();
        
        // Crear modal si no existe
        this.ensureModalExists();
        
        console.log('✅ Sistema de administración completamente inicializado');
    }

    checkAuth() {
        const session = localStorage.getItem('joshuaPlataSession');
        if (!session) return false;

        try {
            const sessionData = JSON.parse(atob(session));
            const isValid = sessionData.expiry > Date.now();
            
            if (isValid) {
                // Actualizar información del usuario
                const adminNameEl = document.getElementById('adminName');
                if (adminNameEl) {
                    adminNameEl.textContent = sessionData.username || 'Joshua Plata';
                }
            }
            
            return isValid;
        } catch (error) {
            console.error('Error verificando sesión:', error);
            localStorage.removeItem('joshuaPlataSession');
            return false;
        }
    }

    redirectToLogin() {
        Swal.fire({
            title: 'Sesión expirada',
            text: 'Necesitas iniciar sesión para acceder al panel',
            icon: 'warning',
            confirmButtonText: 'Ir al inicio'
        }).then(() => {
            window.location.href = '../index.html';
        });
    }

    loadData() {
        try {
            const stored = localStorage.getItem('joshuaPlataEpisodes');
            this.episodes = stored ? JSON.parse(stored) : this.getDefaultEpisodes();
            console.log(`📺 Cargados ${this.episodes.length} episodios en admin`);
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.episodes = this.getDefaultEpisodes();
        }
    }

    setupAllEventListeners() {
        console.log('🎯 Configurando todos los event listeners...');
        
        // TODOS los botones para añadir episodio
        this.setupAddEpisodeButtons();
        
        // Navegación y UI
        this.setupNavigation();
        
        // Formularios
        this.setupForms();
        
        // Event delegation para elementos dinámicos
        this.setupEventDelegation();
        
        console.log('✅ Todos los event listeners configurados');
    }

    setupAddEpisodeButtons() {
        // Array de TODOS los posibles selectores para botones de añadir episodio
        const addEpisodeSelectors = [
            '#quickAddEpisodeBtn',
            '#addEpisodeFromDashboard',
            '#addNewEpisodeBtn',
            '#addNewEpisodeFooterBtn',
            '.add-episode-btn',
            '.quick-action-card',
            '[data-action="add-episode"]',
            'button[onclick*="showEpisodeModal"]'
        ];

        // Configurar cada selector
        addEpisodeSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(button => {
                // Remover listeners previos
                button.removeEventListener('click', this.handleAddEpisodeClick);
                
                // Añadir listener
                button.addEventListener('click', (e) => this.handleAddEpisodeClick(e));
                
                console.log(`✅ Listener añadido a: ${selector}`);
            });
        });

        // Event delegation para botones que se crean dinámicamente
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, .quick-action-card');
            if (!target) return;

            // Verificar si es un botón de añadir episodio
            const isAddButton = 
                target.id === 'quickAddEpisodeBtn' ||
                target.id === 'addEpisodeFromDashboard' ||
                target.classList.contains('add-episode-btn') ||
                target.getAttribute('data-action') === 'add-episode' ||
                (target.classList.contains('quick-action-card') && 
                 target.querySelector('.fas.fa-plus-circle'));

            if (isAddButton) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎬 Botón añadir episodio clickeado (delegation)');
                this.showEpisodeModal();
            }
        });

        console.log('✅ Configurados todos los botones de añadir episodio');
    }

    handleAddEpisodeClick(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎬 Botón añadir episodio clickeado directamente');
        this.showEpisodeModal();
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

        // Sidebar responsivo
        const sidebarToggles = document.querySelectorAll('.sidebar-toggle, .navbar-toggler');
        sidebarToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                document.querySelector('.admin-sidebar')?.classList.toggle('show');
            });
        });
    }

    setupForms() {
        // Cualquier formulario que pueda existir
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (form.id === 'episodeForm') {
                    this.saveEpisode();
                }
            });
        });
    }

    setupEventDelegation() {
        // Event delegation para acciones en tablas y elementos dinámicos
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const episodeId = target.getAttribute('data-episode-id') || 
                            target.closest('tr')?.getAttribute('data-episode-id');

            // Botones de acción en tabla
            if (target.classList.contains('edit-episode-btn') || target.title === 'Editar') {
                e.preventDefault();
                this.showEpisodeModal(episodeId);
            } else if (target.classList.contains('delete-episode-btn') || target.title === 'Eliminar') {
                e.preventDefault();
                this.deleteEpisode(episodeId);
            } else if (target.classList.contains('preview-episode-btn') || target.title === 'Vista previa') {
                e.preventDefault();
                this.previewEpisode(episodeId);
            }
        });
    }

    ensureModalExists() {
        let modal = document.getElementById('episodeModal');
        if (!modal) {
            console.log('📝 Creando modal de episodio...');
            this.createEpisodeModal();
            modal = document.getElementById('episodeModal');
        }
        
        // Configurar eventos del modal
        if (modal) {
            this.setupModalEvents(modal);
        }
    }

    createEpisodeModal() {
        const modalHTML = `
            <div class="modal fade" id="episodeModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="episodeModalTitle">
                                <i class="fas fa-film me-2"></i>Añadir Nuevo Episodio
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="episodeForm">
                                <div class="row mb-4">
                                    <div class="col-lg-8">
                                        <div class="mb-3">
                                            <label for="episodeTitle" class="form-label">
                                                <i class="fas fa-heading me-1"></i>Título del Episodio *
                                            </label>
                                            <input type="text" class="form-control" id="episodeTitle" 
                                                   placeholder="Ej: ¡Shin-chan y las travesuras en el parque!" required>
                                        </div>
                                        <div class="mb-3">
                                            <label for="episodeDescription" class="form-label">
                                                <i class="fas fa-align-left me-1"></i>Descripción *
                                            </label>
                                            <textarea class="form-control" id="episodeDescription" rows="4" 
                                                      placeholder="Describe brevemente lo que pasa en este episodio..." required></textarea>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6">
                                                <label for="videoUrl" class="form-label">
                                                    <i class="fas fa-link me-1"></i>URL del Video *
                                                </label>
                                                <input type="url" class="form-control" id="videoUrl" 
                                                       placeholder="https://youtube.com/watch?v=..." required>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="thumbnailUrl" class="form-label">
                                                    <i class="fas fa-image me-1"></i>URL de Miniatura
                                                </label>
                                                <div class="input-group">
                                                    <input type="url" class="form-control" id="thumbnailUrl" 
                                                           placeholder="Se detectará automáticamente">
                                                    <button class="btn btn-outline-secondary" type="button" id="detectThumbnailBtn">
                                                        <i class="fas fa-magic"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-4">
                                        <div class="text-center">
                                            <label class="form-label">Vista Previa de Miniatura</label>
                                            <div class="thumbnail-preview mb-3" id="thumbnailPreview">
                                                <img src="../img/thumbnail-placeholder.jpg" alt="Miniatura" 
                                                     class="img-fluid rounded" style="max-width: 100%; height: auto;">
                                            </div>
                                            <div class="video-preview" id="videoPreviewContainer" style="display: none;">
                                                <label class="form-label">Vista Previa del Video</label>
                                                <div class="ratio ratio-16x9">
                                                    <iframe id="videoPreview" src="" allowfullscreen></iframe>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row mb-4">
                                    <div class="col-md-3">
                                        <label for="episodeSeason" class="form-label">
                                            <i class="fas fa-layer-group me-1"></i>Temporada *
                                        </label>
                                        <input type="number" class="form-control" id="episodeSeason" min="1" value="1" required>
                                    </div>
                                    <div class="col-md-3">
                                        <label for="episodeNumber" class="form-label">
                                            <i class="fas fa-hashtag me-1"></i>Número de Episodio *
                                        </label>
                                        <input type="number" class="form-control" id="episodeNumber" min="1" value="1" required>
                                    </div>
                                    <div class="col-md-3">
                                        <label for="subtitleDate" class="form-label">
                                            <i class="fas fa-calendar me-1"></i>Fecha de Subtitulado
                                        </label>
                                        <input type="date" class="form-control" id="subtitleDate">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Estado</label>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="episodePublished" checked>
                                            <label class="form-check-label" for="episodePublished">Publicado</label>
                                        </div>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="episodeFeatured">
                                            <label class="form-check-label" for="episodeFeatured">Destacado</label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" id="saveEpisodeBtn">
                                <i class="fas fa-save me-1"></i>Guardar Episodio
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        console.log('✅ Modal de episodio creado');
    }

    setupModalEvents(modal) {
        // Botón de guardar
        const saveBtn = document.getElementById('saveEpisodeBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
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

        // Formulario
        const form = document.getElementById('episodeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEpisode();
            });
        }

        console.log('✅ Eventos del modal configurados');
    }

    showEpisodeModal(episodeId = null) {
        console.log('🎬 Mostrando modal de episodio:', episodeId || 'nuevo');

        // Asegurar que el modal existe
        this.ensureModalExists();

        const modal = document.getElementById('episodeModal');
        const modalTitle = document.getElementById('episodeModalTitle');
        
        if (!modal) {
            console.error('❌ No se pudo crear o encontrar el modal');
            Swal.fire('Error', 'No se pudo abrir el formulario de episodio', 'error');
            return;
        }

        if (episodeId) {
            this.currentEditingEpisode = episodeId;
            const episode = this.episodes.find(ep => ep.id === episodeId);
            if (episode) {
                this.fillEpisodeForm(episode);
                if (modalTitle) {
                    modalTitle.innerHTML = `<i class="fas fa-edit me-2"></i>Editar: ${episode.title}`;
                }
            }
        } else {
            this.currentEditingEpisode = null;
            this.resetEpisodeForm();
            if (modalTitle) {
                modalTitle.innerHTML = '<i class="fas fa-plus me-2"></i>Añadir Nuevo Episodio';
            }
            this.setDefaultValues();
        }
        
        // Mostrar modal
        try {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            console.log('✅ Modal mostrado correctamente');
        } catch (error) {
            console.error('❌ Error mostrando modal:', error);
            Swal.fire('Error', 'No se pudo abrir el formulario', 'error');
        }
    }

    setDefaultValues() {
        // Fecha actual
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('subtitleDate');
        if (dateInput) dateInput.value = today;
        
        // Auto-detectar números de temporada/episodio
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

        // Encontrar la temporada más alta
        const maxSeason = Math.max(...this.episodes.map(ep => ep.season || 1));
        
        // Encontrar episodios de esa temporada
        const episodesInMaxSeason = this.episodes.filter(ep => ep.season === maxSeason);
        
        // Encontrar el número más alto en esa temporada
        const maxEpisodeInSeason = episodesInMaxSeason.length > 0 ? 
            Math.max(...episodesInMaxSeason.map(ep => ep.number || 0)) : 0;
        
        seasonInput.value = maxSeason;
        episodeInput.value = maxEpisodeInSeason + 1;
        
        console.log(`🔢 Auto-detectado: T${maxSeason}E${maxEpisodeInSeason + 1}`);
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
        
        console.log('💾 Iniciando guardado de episodio...');
        this.isLoading = true;
        
        const saveBtn = document.getElementById('saveEpisodeBtn');
        let originalText = '';
        
        if (saveBtn) {
            originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            saveBtn.disabled = true;
        }

        try {
            // Validar formulario
            if (!this.validateEpisodeForm()) {
                return;
            }

            // Recopilar datos
            const episodeData = this.collectEpisodeData();
            let savedEpisode;
            
            if (this.currentEditingEpisode) {
                savedEpisode = this.updateEpisode(this.currentEditingEpisode, episodeData);
                console.log('✏️ Episodio actualizado:', savedEpisode.title);
            } else {
                savedEpisode = this.createEpisode(episodeData);
                console.log('➕ Episodio creado:', savedEpisode.title);
            }

            // Guardar en localStorage
            this.saveEpisodes();
            
            // Actualizar UI
            this.renderAllContent();
            
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
                saveBtn.innerHTML = originalText || '<i class="fas fa-save me-1"></i>Guardar Episodio';
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

        // Validar duplicados
        const title = document.getElementById('episodeTitle').value.trim();
        const season = parseInt(document.getElementById('episodeSeason').value);
        const episodeNum = parseInt(document.getElementById('episodeNumber').value);

        const duplicate = this.episodes.find(ep => 
            ep.id !== this.currentEditingEpisode &&
            (ep.title.toLowerCase() === title.toLowerCase() || 
             (ep.season === season && ep.number === episodeNum))
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
            thumbnail: document.getElementById('thumbnailUrl').value.trim() || 
                      this.generateThumbnail(videoUrl) || 
                      '../img/thumbnail-placeholder.jpg',
            subtitleDate: document.getElementById('subtitleDate').value || 
                         new Date().toISOString().split('T')[0],
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
        
        this.episodes.unshift(episode); // Añadir al principio
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

    renderAllContent() {
        this.renderDashboardStats();
        this.renderRecentEpisodes();
        this.renderEpisodesTable();
    }

    renderDashboardStats() {
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
            if (element) {
                this.animateCounter(element, value);
            }
        });

        console.log('📊 Stats actualizadas:', stats);
    }

    animateCounter(element, targetValue) {
        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const steps = 30;
        const stepValue = (targetValue - startValue) / steps;
        const stepDuration = duration / steps;

        let current = startValue;
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

    renderRecentEpisodes() {
        const tbody = document.getElementById('recentEpisodesTable');
        if (!tbody) return;

        const recent = this.episodes
            .sort((a, b) => new Date(b.createdAt || b.subtitleDate) - new Date(a.createdAt || a.subtitleDate))
            .slice(0, 5);

        tbody.innerHTML = '';

        if (recent.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="fas fa-film fa-2x text-muted mb-2"></i>
                        <p class="text-muted mb-0">No hay episodios para mostrar</p>
                    </td>
                </tr>
            `;
            return;
        }

        recent.forEach(episode => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="badge bg-secondary">${episode.id.substring(3, 8)}</span>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${episode.thumbnail}" class="episode-thumbnail me-2" 
                             alt="${episode.title}" onerror="this.src='../img/thumbnail-placeholder.jpg'">
                        <div>
                            <div class="fw-bold">${episode.title}</div>
                            <small class="text-muted">${episode.description.substring