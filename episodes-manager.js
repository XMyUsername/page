/**
 * Gestor Avanzado de Episodios para Shin Chan Subs
 * Sistema completo de administración con funciones automáticas
 */

class EpisodesManager {
    constructor() {
        this.episodes = this.loadEpisodes();
        this.templates = this.loadTemplates();
        this.currentEditingEpisode = null;
        this.bulkUploadQueue = [];
        this.autoDetectionEnabled = true;
        
        this.initializeManager();
    }

    // Constantes para plataformas de video
    static VIDEO_PLATFORMS = {
        YOUTUBE: {
            pattern: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
            embedUrl: (url) => {
                const match = url.match(EpisodesManager.VIDEO_PLATFORMS.YOUTUBE.pattern);
                const videoId = match ? match[1] : null;
                return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1` : null;
            },
            thumbnailUrl: (url) => {
                const match = url.match(EpisodesManager.VIDEO_PLATFORMS.YOUTUBE.pattern);
                const videoId = match ? match[1] : null;
                return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
            },
            getVideoInfo: async (url) => {
                const match = url.match(EpisodesManager.VIDEO_PLATFORMS.YOUTUBE.pattern);
                const videoId = match ? match[1] : null;
                if (!videoId) return null;
                
                try {
                    // Simulación de obtención de info (en producción usarías YouTube API)
                    return {
                        title: `Video de YouTube ${videoId}`,
                        duration: '00:24:30',
                        description: 'Descripción automática del video'
                    };
                } catch (error) {
                    console.error('Error obteniendo info de YouTube:', error);
                    return null;
                }
            }
        },
        VIMEO: {
            pattern: /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?))/i,
            embedUrl: (url) => {
                const match = url.match(EpisodesManager.VIDEO_PLATFORMS.VIMEO.pattern);
                const videoId = match ? match[3] : null;
                return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
            },
            thumbnailUrl: null,
            getVideoInfo: async (url) => {
                const match = url.match(EpisodesManager.VIDEO_PLATFORMS.VIMEO.pattern);
                const videoId = match ? match[3] : null;
                if (!videoId) return null;
                
                try {
                    const response = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
                    const data = await response.json();
                    return {
                        title: data.title,
                        duration: this.formatDuration(data.duration),
                        description: data.description || '',
                        thumbnail: data.thumbnail_url
                    };
                } catch (error) {
                    console.error('Error obteniendo info de Vimeo:', error);
                    return null;
                }
            }
        },
        DAILYMOTION: {
            pattern: /(?:dailymotion\.com\/(?:embed\/video\/|video\/|hub\/([^\/]*)\/video\/|))?([a-zA-Z0-9]+)(?:_[\w_-]+)?/i,
            embedUrl: (url) => {
                const match = url.match(EpisodesManager.VIDEO_PLATFORMS.DAILYMOTION.pattern);
                const videoId = match ? match[2] : null;
                return videoId ? `https://www.dailymotion.com/embed/video/${videoId}` : null;
            },
            thumbnailUrl: (url) => {
                const match = url.match(EpisodesManager.VIDEO_PLATFORMS.DAILYMOTION.pattern);
                const videoId = match ? match[2] : null;
                return videoId ? `https://www.dailymotion.com/thumbnail/video/${videoId}` : null;
            },
            getVideoInfo: async (url) => {
                const match = url.match(EpisodesManager.VIDEO_PLATFORMS.DAILYMOTION.pattern);
                const videoId = match ? match[2] : null;
                if (!videoId) return null;
                
                try {
                    const response = await fetch(`https://www.dailymotion.com/services/oembed?url=${encodeURIComponent(url)}&format=json`);
                    const data = await response.json();
                    return {
                        title: data.title,
                        duration: this.formatDuration(data.duration),
                        description: data.description || ''
                    };
                } catch (error) {
                    console.error('Error obteniendo info de Dailymotion:', error);
                    return null;
                }
            }
        },
        GOOGLE_DRIVE: {
            pattern: /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/file\/d\/([^\/\?&]+)/i,
            embedUrl: (url) => {
                const match = url.match(EpisodesManager.VIDEO_PLATFORMS.GOOGLE_DRIVE.pattern);
                const fileId = match ? match[1] : null;
                return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
            },
            thumbnailUrl: null,
            getVideoInfo: async (url) => {
                return {
                    title: 'Video de Google Drive',
                    duration: 'N/A',
                    description: 'Video alojado en Google Drive'
                };
            }
        },
        ARCHIVE: {
            pattern: /(?:https?:\/\/)?(?:www\.)?archive\.org\/(?:details|embed)\/([^\/\?&]+)/i,
            embedUrl: (url) => {
                const match = url.match(EpisodesManager.VIDEO_PLATFORMS.ARCHIVE.pattern);
                const itemId = match ? match[1] : null;
                return itemId ? `https://archive.org/embed/${itemId}` : null;
            },
            thumbnailUrl: null,
            getVideoInfo: async (url) => {
                return {
                    title: 'Video de Archive.org',
                    duration: 'N/A',
                    description: 'Video alojado en Archive.org'
                };
            }
        }
    };

    // Inicializar el gestor
    initializeManager() {
        this.setupEventListeners();
        this.loadEpisodeTemplates();
        this.renderEpisodesTable();
        this.updateStatistics();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botones principales
        document.getElementById('addNewEpisodeBtn')?.addEventListener('click', () => this.showEpisodeModal());
        document.getElementById('addNewEpisodeFooterBtn')?.addEventListener('click', () => this.showEpisodeModal());
        document.getElementById('saveEpisodeBtn')?.addEventListener('click', () => this.saveEpisode());
        
        // URL del video - detección automática
        document.getElementById('videoUrl')?.addEventListener('input', (e) => this.handleVideoUrlChange(e.target.value));
        document.getElementById('detectThumbnailBtn')?.addEventListener('click', () => this.detectThumbnail());
        
        // Plantillas
        document.getElementById('useTemplateBtn')?.addEventListener('click', () => this.showTemplateSelector());
        document.getElementById('saveAsTemplateBtn')?.addEventListener('click', () => this.saveAsTemplate());
        
        // Subida por lotes
        document.getElementById('bulkUploadBtn')?.addEventListener('click', () => this.showBulkUploadModal());
        document.getElementById('importEpisodesBtn')?.addEventListener('click', () => this.showImportModal());
        
        // Filtros y búsqueda
        document.getElementById('applyFiltersBtn')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('resetFiltersBtn')?.addEventListener('click', () => this.resetFilters());
        document.getElementById('searchEpisode')?.addEventListener('input', (e) => this.searchEpisodes(e.target.value));
        
        // Acciones en lote
        document.querySelectorAll('.bulk-action').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleBulkAction(e.target.dataset.action));
        });
        
        // Select all checkbox
        document.getElementById('selectAllEpisodes')?.addEventListener('change', (e) => this.selectAllEpisodes(e.target.checked));
        
        // Miniatura preview
        document.getElementById('thumbnailUrl')?.addEventListener('input', (e) => this.updateThumbnailPreview(e.target.value));
        
        // Auto-complete para títulos
        document.getElementById('episodeTitle')?.addEventListener('input', (e) => this.handleTitleAutocomplete(e.target.value));
        
        // Sugerencias de descripción
        document.getElementById('generateDescriptionBtn')?.addEventListener('click', () => this.generateDescription());
        
        // Detección automática de temporada/episodio
        document.getElementById('autoDetectNumberBtn')?.addEventListener('click', () => this.autoDetectNumbers());
    }

    // Mostrar modal de episodio
    showEpisodeModal(episodeId = null) {
        const modal = new bootstrap.Modal(document.getElementById('episodeModal'));
        const modalTitle = document.getElementById('episodeModalTitle');
        
        if (episodeId) {
            this.currentEditingEpisode = episodeId;
            const episode = this.episodes.find(ep => ep.id === episodeId);
            if (episode) {
                this.fillEpisodeForm(episode);
                modalTitle.textContent = `Editar episodio: ${episode.title}`;
            }
        } else {
            this.currentEditingEpisode = null;
            this.resetEpisodeForm();
            modalTitle.textContent = 'Añadir nuevo episodio';
            this.setDefaultValues();
        }
        
        modal.show();
    }

    // Establecer valores por defecto inteligentes
    setDefaultValues() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('subtitleDate').value = today;
        
        // Auto-sugerir siguiente número de episodio
        this.autoDetectNumbers();
        
        // Configurar fecha automática
        this.setupAutoDate();
    }

    // Auto-detectar números de temporada y episodio
    autoDetectNumbers() {
        const seasonInput = document.getElementById('episodeSeason');
        const episodeInput = document.getElementById('episodeNumber');
        
        if (this.episodes.length === 0) {
            seasonInput.value = 1;
            episodeInput.value = 1;
            return;
        }

        // Encontrar la temporada más alta
        const maxSeason = Math.max(...this.episodes.map(ep => ep.season));
        
        // Encontrar el episodio más alto de la temporada más alta
        const episodesInMaxSeason = this.episodes.filter(ep => ep.season === maxSeason);
        const maxEpisodeInSeason = Math.max(...episodesInMaxSeason.map(ep => ep.number));
        
        seasonInput.value = maxSeason;
        episodeInput.value = maxEpisodeInSeason + 1;
    }

    // Manejar cambio de URL del video
    async handleVideoUrlChange(url) {
        if (!url.trim()) {
            this.clearVideoPreview();
            return;
        }

        const platform = this.detectVideoPlatform(url);
        if (!platform) {
            this.showVideoError('Plataforma de video no soportada');
            return;
        }

        this.showLoadingVideo();
        
        try {
            // Obtener embed URL
            const embedUrl = platform.embedUrl(url);
            if (embedUrl) {
                this.updateVideoPreview(embedUrl);
            }

            // Auto-detectar miniatura
            if (this.autoDetectionEnabled) {
                const thumbnailUrl = platform.thumbnailUrl ? platform.thumbnailUrl(url) : null;
                if (thumbnailUrl) {
                    document.getElementById('thumbnailUrl').value = thumbnailUrl;
                    this.updateThumbnailPreview(thumbnailUrl);
                }
            }

            // Obtener información del video si está disponible
            if (platform.getVideoInfo) {
                const videoInfo = await platform.getVideoInfo(url);
                if (videoInfo && this.autoDetectionEnabled) {
                    this.suggestVideoInfo(videoInfo);
                }
            }

        } catch (error) {
            console.error('Error procesando URL del video:', error);
            this.showVideoError('Error al procesar la URL del video');
        }
    }

    // Detectar plataforma de video
    detectVideoPlatform(url) {
        for (const [name, platform] of Object.entries(EpisodesManager.VIDEO_PLATFORMS)) {
            if (platform.pattern.test(url)) {
                return platform;
            }
        }
        return null;
    }

    // Sugerir información del video detectada automáticamente
    suggestVideoInfo(videoInfo) {
        const titleInput = document.getElementById('episodeTitle');
        const descriptionInput = document.getElementById('episodeDescription');
        
        // Solo sugerir si los campos están vacíos
        if (!titleInput.value.trim() && videoInfo.title) {
            this.showSuggestion('title', videoInfo.title, titleInput);
        }
        
        if (!descriptionInput.value.trim() && videoInfo.description) {
            this.showSuggestion('description', videoInfo.description, descriptionInput);
        }
        
        if (videoInfo.thumbnail && !document.getElementById('thumbnailUrl').value) {
            document.getElementById('thumbnailUrl').value = videoInfo.thumbnail;
            this.updateThumbnailPreview(videoInfo.thumbnail);
        }
    }

    // Mostrar sugerencia con opción de aceptar
    showSuggestion(type, value, input) {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'suggestion-banner alert alert-info alert-dismissible fade show mt-2';
        suggestionDiv.innerHTML = `
            <i class="fas fa-lightbulb me-2"></i>
            <strong>Sugerencia detectada:</strong> ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}
            <button type="button" class="btn btn-sm btn-outline-primary ms-2" onclick="this.closest('.suggestion-banner').nextElementSibling.value='${value.replace(/'/g, "\\'")}'; this.closest('.suggestion-banner').remove();">
                Usar
            </button>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        input.parentNode.insertBefore(suggestionDiv, input.nextSibling);
        
        // Auto-remover después de 10 segundos
        setTimeout(() => {
            if (suggestionDiv.parentNode) {
                suggestionDiv.remove();
            }
        }, 10000);
    }

    // Actualizar preview del video
    updateVideoPreview(embedUrl) {
        const preview = document.getElementById('videoPreview');
        if (preview) {
            preview.src = embedUrl;
            document.getElementById('videoPreviewContainer').style.display = 'block';
        }
    }

    // Limpiar preview del video
    clearVideoPreview() {
        const preview = document.getElementById('videoPreview');
        if (preview) {
            preview.src = '';
            document.getElementById('videoPreviewContainer').style.display = 'none';
        }
    }

    // Mostrar loading en video
    showLoadingVideo() {
        const container = document.getElementById('videoPreviewContainer');
        container.innerHTML = `
            <div class="d-flex align-items-center justify-content-center h-100">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando video...</span>
                </div>
            </div>
        `;
        container.style.display = 'block';
    }

    // Mostrar error en video
    showVideoError(message) {
        const container = document.getElementById('videoPreviewContainer');
        container.innerHTML = `
            <div class="d-flex align-items-center justify-content-center h-100 bg-light">
                <div class="text-center text-muted">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>${message}</p>
                </div>
            </div>
        `;
        container.style.display = 'block';
    }

    // Detectar miniatura automáticamente
    detectThumbnail() {
        const videoUrl = document.getElementById('videoUrl').value;
        if (!videoUrl) {
            Swal.fire('Error', 'Primero ingresa la URL del video', 'error');
            return;
        }

        const platform = this.detectVideoPlatform(videoUrl);
        if (!platform || !platform.thumbnailUrl) {
            Swal.fire('Info', 'No se puede detectar automáticamente la miniatura para esta plataforma', 'info');
            return;
        }

        const thumbnailUrl = platform.thumbnailUrl(videoUrl);
        if (thumbnailUrl) {
            document.getElementById('thumbnailUrl').value = thumbnailUrl;
            this.updateThumbnailPreview(thumbnailUrl);
            
            Swal.fire({
                title: 'Miniatura detectada',
                text: 'Se ha detectado automáticamente la miniatura del video',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }
    }

    // Actualizar preview de miniatura
    updateThumbnailPreview(url) {
        const preview = document.getElementById('thumbnailPreview');
        if (preview && url) {
            const img = preview.querySelector('img');
            if (img) {
                img.src = url;
                img.onerror = () => {
                    img.src = '../img/thumbnail-placeholder.jpg';
                };
            }
        }
    }

    // Auto-completar títulos basado en patrones
    handleTitleAutocomplete(title) {
        if (!title.trim() || title.length < 3) return;

        const suggestions = this.generateTitleSuggestions(title);
        if (suggestions.length > 0) {
            this.showTitleSuggestions(suggestions);
        }
    }

    // Generar sugerencias de títulos
    generateTitleSuggestions(partialTitle) {
        const commonPatterns = [
            '¡{title}!',
            '¡Shin-chan y {title}!',
            '¡{title} con Shin-chan!',
            '¡La aventura de {title}!',
            '¡Shin-chan en {title}!',
            '¡{title} - Diversión garantizada!',
            '¡Un día de {title}!',
            '¡{title} y más travesuras!'
        ];

        return commonPatterns.map(pattern => 
            pattern.replace('{title}', partialTitle.toLowerCase())
        ).slice(0, 3);
    }

    // Mostrar sugerencias de títulos
    showTitleSuggestions(suggestions) {
        const titleInput = document.getElementById('episodeTitle');
        
        // Remover sugerencias previas
        const existingSuggestions = titleInput.parentNode.querySelector('.title-suggestions');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }

        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'title-suggestions list-group mt-1';
        
        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('button');
            suggestionItem.type = 'button';
            suggestionItem.className = 'list-group-item list-group-item-action small';
            suggestionItem.textContent = suggestion;
            suggestionItem.onclick = () => {
                titleInput.value = suggestion;
                suggestionsDiv.remove();
            };
            suggestionsDiv.appendChild(suggestionItem);
        });

        titleInput.parentNode.appendChild(suggestionsDiv);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (suggestionsDiv.parentNode) {
                suggestionsDiv.remove();
            }
        }, 5000);
    }

    // Generar descripción automática
    generateDescription() {
        const title = document.getElementById('episodeTitle').value;
        const season = document.getElementById('episodeSeason').value;
        const episode = document.getElementById('episodeNumber').value;
        
        if (!title.trim()) {
            Swal.fire('Error', 'Primero ingresa el título del episodio', 'error');
            return;
        }

        const templates = [
            `En este episodio, ${title.toLowerCase().replace(/[¡!]/g, '')}. Shin-chan nos trae sus travesuras más divertidas mientras...`,
            `¡Prepárate para reír! En "${title}", Shin-chan se mete en líos increíbles. No te pierdas las aventuras más disparatadas de nuestro protagonista favorito.`,
            `Nuevo episodio subtitulado en español. ${title} nos muestra una vez más por qué Shin-chan es el niño más travieso y divertido del anime.`,
            `¡Episodio imperdible! ${title}. Disfruta de la traducción cuidada y los subtítulos de alta calidad para esta nueva aventura de Shin-chan.`
        ];

        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        
        Swal.fire({
            title: 'Descripción generada',
            html: `
                <div class="text-start">
                    <p><strong>Descripción sugerida:</strong></p>
                    <div class="border p-3 bg-light rounded">
                        ${randomTemplate}
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Usar esta descripción',
            cancelButtonText: 'Generar otra',
            width: 600
        }).then((result) => {
            if (result.isConfirmed) {
                document.getElementById('episodeDescription').value = randomTemplate;
            } else if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
                this.generateDescription(); // Generar otra
            }
        });
    }

    // Guardar episodio
    async saveEpisode() {
        if (!this.validateEpisodeForm()) {
            return;
        }

        const episodeData = this.collectEpisodeData();
        
        try {
            let savedEpisode;
            
            if (this.currentEditingEpisode) {
                // Actualizar episodio existente
                savedEpisode = this.updateEpisode(this.currentEditingEpisode, episodeData);
            } else {
                // Crear nuevo episodio
                savedEpisode = this.createEpisode(episodeData);
            }

            this.saveEpisodes();
            this.renderEpisodesTable();
            this.updateStatistics();
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('episodeModal'));
            modal.hide();
            
            // Mostrar éxito
            Swal.fire({
                title: '¡Episodio guardado!',
                text: `El episodio "${savedEpisode.title}" se ha guardado correctamente.`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false
            });
            
            // Preguntar si quiere añadir otro episodio
            if (!this.currentEditingEpisode) {
                setTimeout(() => {
                    Swal.fire({
                        title: '¿Añadir otro episodio?',
                        text: '¿Quieres añadir otro episodio ahora?',
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, añadir otro',
                        cancelButtonText: 'No, terminar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            this.showEpisodeModal();
                        }
                    });
                }, 3500);
            }
            
        } catch (error) {
            console.error('Error guardando episodio:', error);
            Swal.fire('Error', 'No se pudo guardar el episodio. Inténtalo de nuevo.', 'error');
        }
    }

    // Validar formulario de episodio
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
            if (!element.value.trim()) {
                Swal.fire('Campo requerido', `El campo "${field.name}" es obligatorio.`, 'warning');
                element.focus();
                return false;
            }
        }

        // Validar URL del video
        const videoUrl = document.getElementById('videoUrl').value;
        if (!this.detectVideoPlatform(videoUrl)) {
            Swal.fire('URL inválida', 'La URL del video no es de una plataforma soportada.', 'warning');
            document.getElementById('videoUrl').focus();
            return false;
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

    // Recopilar datos del formulario
    collectEpisodeData() {
        const videoUrl = document.getElementById('videoUrl').value.trim();
        const platform = this.detectVideoPlatform(videoUrl);
        
        return {
            id: this.currentEditingEpisode || this.generateEpisodeId(),
            title: document.getElementById('episodeTitle').value.trim(),
            description: document.getElementById('episodeDescription').value.trim(),
            season: parseInt(document.getElementById('episodeSeason').value),
            number: parseInt(document.getElementById('episodeNumber').value),
            videoUrl: videoUrl,
            embedUrl: platform.embedUrl(videoUrl),
            thumbnail: document.getElementById('thumbnailUrl').value.trim() || platform.thumbnailUrl?.(videoUrl) || '../img/thumbnail-placeholder.jpg',
            subtitleDate: document.getElementById('subtitleDate').value,
            published: document.getElementById('episodePublished')?.checked || false,
            featured: document.getElementById('episodeFeatured')?.checked || false,
            allowComments: document.getElementById('allowComments')?.checked || true,
            notifySubscribers: document.getElementById('notifySubscribers')?.checked || false,
            views: this.currentEditingEpisode ? this.episodes.find(ep => ep.id === this.currentEditingEpisode).views : 0,
            likes: this.currentEditingEpisode ? this.episodes.find(ep => ep.id === this.currentEditingEpisode).likes : 0,
            createdAt: this.currentEditingEpisode ? this.episodes.find(ep => ep.id === this.currentEditingEpisode).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    // Crear nuevo episodio
    createEpisode(episodeData) {
        this.episodes.push(episodeData);
        return episodeData;
    }

    // Actualizar episodio existente
    updateEpisode(episodeId, episodeData) {
        const index = this.episodes.findIndex(ep => ep.id === episodeId);
        if (index !== -1) {
            this.episodes[index] = { ...this.episodes[index], ...episodeData };
            return this.episodes[index];
        }
        throw new Error('Episodio no encontrado');
    }

    // Generar ID único para episodio
    generateEpisodeId() {
        return 'ep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Renderizar tabla de episodios
    renderEpisodesTable() {
        const tbody = document.getElementById('episodesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.episodes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <i class="fas fa-film fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No hay episodios para mostrar</p>
                        <button class="btn btn-primary" onclick="episodesManager.showEpisodeModal()">
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

    // Crear fila de episodio
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
                <img src="${episode.thumbnail}" alt="${episode.title}" class="episode-thumbnail">
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
                ${episode.views?.toLocaleString() || '0'}
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="episodesManager.showEpisodeModal('${episode.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-info" onclick="episodesManager.previewEpisode('${episode.id}')" title="Vista previa">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="episodesManager.duplicateEpisode('${episode.id}')" title="Duplicar">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="episodesManager.deleteEpisode('${episode.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    // Vista previa de episodio
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

    // Duplicar episodio
    duplicateEpisode(episodeId) {
        const episode = this.episodes.find(ep => ep.id === episodeId);
        if (!episode) return;

        Swal.fire({
            title: '¿Duplicar episodio?',
            text: `Se creará una copia de "${episode.title}"`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, duplicar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const duplicatedEpisode = {
                    ...episode,
                    id: this.generateEpisodeId(),
                    title: `${episode.title} (Copia)`,
                    number: episode.number + 1,
                    published: false,
                    featured: false,
                    views: 0,
                    likes: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                this.episodes.push(duplicatedEpisode);
                this.saveEpisodes();
                this.renderEpisodesTable();
                
                Swal.fire('¡Duplicado!', 'El episodio ha sido duplicado correctamente.', 'success');
            }
        });
    }

    // Eliminar episodio
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
                this.updateStatistics();
                
                Swal.fire('¡Eliminado!', 'El episodio ha sido eliminado.', 'success');
            }
        });
    }

    // Actualizar contador de episodios
    updateEpisodeCount() {
        const countElement = document.getElementById('episodeCountInfo');
        if (countElement) {
            const total = this.episodes.length;
            const published = this.episodes.filter(ep => ep.published).length;
            countElement.textContent = `Mostrando ${total} episodios (${published} publicados)`;
        }
    }

    // Actualizar estadísticas
    updateStatistics() {
        const totalEpisodesElement = document.getElementById('dashboardTotalEpisodes');
        const totalSeasonsElement = document.getElementById('dashboardTotalSeasons');
        const totalViewsElement = document.getElementById('dashboardTotalViews');

        if (totalEpisodesElement) {
            totalEpisodesElement.textContent = this.episodes.length;
        }

        if (totalSeasonsElement) {
            const uniqueSeasons = new Set(this.episodes.map(ep => ep.season));
            totalSeasonsElement.textContent = uniqueSeasons.size;
        }

        if (totalViewsElement) {
            const totalViews = this.episodes.reduce((sum, ep) => sum + (ep.views || 0), 0);
            totalViewsElement.textContent = totalViews.toLocaleString();
        }
    }

    // Formatear fecha
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    }

    // Cargar episodios desde localStorage
    loadEpisodes() {
        const stored = localStorage.getItem('shinChanEpisodes');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error('Error cargando episodios:', error);
            }
        }
        return this.getDefaultEpisodes();
    }

    // Guardar episodios en localStorage
    saveEpisodes() {
        localStorage.setItem('shinChanEpisodes', JSON.stringify(this.episodes));
    }

    // Episodios por defecto
    getDefaultEpisodes() {
        return [
            {
                id: 'ep_default_1',
                title: '¡Shin-chan y el crayón mágico!',
                description: 'Shin-chan encuentra un crayón que parece tener poderes mágicos y comienza a usarlo para dibujar cosas que cobran vida.',
                season: 1,
                number: 1,
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                subtitleDate: '2025-01-15',
                published: true,
                featured: true,
                allowComments: true,
                notifySubscribers: true,
                views: 1342,
                likes: 89,
                createdAt: '2025-01-15T10:00:00Z',
                updatedAt: '2025-01-15T10:00:00Z'
            },
            {
                id: 'ep_default_2',
                title: '¡Mamá está enfadada!',
                description: 'Shin-chan hace travesuras en casa y su madre, Misae, se enfada mucho con él. Shin-chan intenta reconciliarse con ella.',
                season: 1,
                number: 2,
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                subtitleDate: '2025-01-22',
                published: true,
                featured: true,
                allowComments: true,
                notifySubscribers: true,
                views: 843,
                likes: 67,
                createdAt: '2025-01-22T14:30:00Z',
                updatedAt: '2025-01-22T14:30:00Z'
            }
        ];
    }

    // Llenar formulario con datos de episodio
    fillEpisodeForm(episode) {
        document.getElementById('episodeId').value = episode.id;
        document.getElementById('episodeTitle').value = episode.title;
        document.getElementById('episodeDescription').value = episode.description;
        document.getElementById('episodeSeason').value = episode.season;
        document.getElementById('episodeNumber').value = episode.number;
        document.getElementById('videoUrl').value = episode.videoUrl;
        document.getElementById('thumbnailUrl').value = episode.thumbnail;
        document.getElementById('subtitleDate').value = episode.subtitleDate;
        document.getElementById('episodePublished').checked = episode.published;
        document.getElementById('episodeFeatured').checked = episode.featured;
        document.getElementById('allowComments').checked = episode.allowComments;
        document.getElementById('notifySubscribers').checked = episode.notifySubscribers;

        this.updateThumbnailPreview(episode.thumbnail);
        this.updateVideoPreview(episode.embedUrl);
    }

    // Resetear formulario
    resetEpisodeForm() {
        document.getElementById('episodeForm').reset();
        document.getElementById('episodeId').value = '';
        this.clearVideoPreview();
        this.updateThumbnailPreview('../img/thumbnail-placeholder.jpg');
    }
}

// Inicializar el gestor cuando se carga la página
let episodesManager;

document.addEventListener('DOMContentLoaded', function() {
    episodesManager = new EpisodesManager();
});