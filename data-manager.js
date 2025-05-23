/**
 * Sistema de Gestión de Datos para Joshua Plata Subs
 * Maneja toda la lógica de episodios, sincronización y actualizaciones
 */

class DataManager {
    constructor() {
        this.episodes = [];
        this.subscribers = [];
        this.stats = {};
        this.config = {};
        this.eventListeners = new Map();
        
        this.init();
    }

    init() {
        this.loadAllData();
        this.setupEventSystem();
        this.startAutoSync();
        console.log('📊 Sistema de datos Joshua Plata Subs inicializado');
    }

    // =============== SISTEMA DE EVENTOS ===============
    setupEventSystem() {
        // Crear sistema de eventos personalizado
        this.eventTarget = new EventTarget();
    }

    on(event, callback) {
        this.eventTarget.addEventListener(event, callback);
    }

    emit(event, data = {}) {
        this.eventTarget.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    // =============== GESTIÓN DE EPISODIOS ===============
    
    // Añadir nuevo episodio
    addEpisode(episodeData) {
        try {
            // Validar datos
            if (!this.validateEpisodeData(episodeData)) {
                throw new Error('Datos de episodio inválidos');
            }

            // Generar ID único
            const id = this.generateUniqueId();
            
            // Crear episodio completo
            const episode = {
                id: id,
                title: episodeData.title,
                description: episodeData.description,
                season: parseInt(episodeData.season),
                number: parseInt(episodeData.number),
                videoUrl: episodeData.videoUrl,
                embedUrl: this.processVideoUrl(episodeData.videoUrl),
                thumbnail: episodeData.thumbnail || this.generateThumbnail(episodeData.videoUrl),
                subtitleDate: episodeData.subtitleDate || new Date().toISOString().split('T')[0],
                published: episodeData.published !== false,
                featured: episodeData.featured || false,
                allowComments: episodeData.allowComments !== false,
                notifySubscribers: episodeData.notifySubscribers !== false,
                views: 0,
                likes: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                creator: 'Joshua Plata',
                tags: episodeData.tags || [],
                quality: episodeData.quality || 'HD',
                language: 'Español (Subtitulado)',
                status: episodeData.published ? 'published' : 'draft'
            };

            // Añadir a la lista
            this.episodes.unshift(episode); // Añadir al principio
            
            // Guardar datos
            this.saveEpisodes();
            
            // Actualizar estadísticas
            this.updateStats();
            
            // Emitir evento
            this.emit('episodeAdded', { episode, total: this.episodes.length });
            
            // Notificar suscriptores si está configurado
            if (episode.notifySubscribers && episode.published) {
                this.notifyNewEpisode(episode);
            }
            
            // Sincronizar con todas las páginas abiertas
            this.syncWithOtherTabs('episodeAdded', episode);
            
            console.log(`✅ Episodio añadido: ${episode.title}`);
            return episode;
            
        } catch (error) {
            console.error('❌ Error añadiendo episodio:', error);
            throw error;
        }
    }

    // Actualizar episodio existente
    updateEpisode(episodeId, updateData) {
        try {
            const index = this.episodes.findIndex(ep => ep.id === episodeId);
            if (index === -1) {
                throw new Error('Episodio no encontrado');
            }

            const oldEpisode = { ...this.episodes[index] };
            
            // Actualizar datos
            this.episodes[index] = {
                ...this.episodes[index],
                ...updateData,
                id: episodeId, // Preservar ID
                updatedAt: new Date().toISOString()
            };

            // Si se actualiza la URL del video, regenerar embed
            if (updateData.videoUrl) {
                this.episodes[index].embedUrl = this.processVideoUrl(updateData.videoUrl);
                if (!updateData.thumbnail) {
                    this.episodes[index].thumbnail = this.generateThumbnail(updateData.videoUrl);
                }
            }

            const updatedEpisode = this.episodes[index];
            
            // Guardar
            this.saveEpisodes();
            this.updateStats();
            
            // Emitir evento
            this.emit('episodeUpdated', { 
                episode: updatedEpisode, 
                oldEpisode,
                changes: updateData 
            });
            
            // Sincronizar
            this.syncWithOtherTabs('episodeUpdated', { episodeId, updateData });
            
            console.log(`✏️ Episodio actualizado: ${updatedEpisode.title}`);
            return updatedEpisode;
            
        } catch (error) {
            console.error('❌ Error actualizando episodio:', error);
            throw error;
        }
    }

    // Eliminar episodio
    deleteEpisode(episodeId) {
        try {
            const index = this.episodes.findIndex(ep => ep.id === episodeId);
            if (index === -1) {
                throw new Error('Episodio no encontrado');
            }

            const deletedEpisode = this.episodes[index];
            this.episodes.splice(index, 1);
            
            // Guardar
            this.saveEpisodes();
            this.updateStats();
            
            // Emitir evento
            this.emit('episodeDeleted', { 
                episode: deletedEpisode, 
                total: this.episodes.length 
            });
            
            // Sincronizar
            this.syncWithOtherTabs('episodeDeleted', episodeId);
            
            console.log(`🗑️ Episodio eliminado: ${deletedEpisode.title}`);
            return deletedEpisode;
            
        } catch (error) {
            console.error('❌ Error eliminando episodio:', error);
            throw error;
        }
    }

    // =============== PROCESAMIENTO DE VIDEOS ===============
    
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
            },
            drive: {
                pattern: /(?:drive\.google\.com\/file\/d\/)([^\/\?&]+)/i,
                embed: (match) => `https://drive.google.com/file/d/${match[1]}/preview`
            },
            streamable: {
                pattern: /(?:streamable\.com\/)([a-zA-Z0-9]+)/i,
                embed: (match) => `https://streamable.com/e/${match[1]}`
            }
        };

        for (const [platform, config] of Object.entries(platforms)) {
            const match = url.match(config.pattern);
            if (match) {
                return config.embed(match);
            }
        }

        // Si no se reconoce la plataforma, devolver URL original
        return url;
    }

    generateThumbnail(videoUrl) {
        // YouTube thumbnail
        const youtubeMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (youtubeMatch) {
            return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
        }

        // Dailymotion thumbnail
        const dailymotionMatch = videoUrl.match(/(?:dailymotion\.com\/video\/)([a-zA-Z0-9]+)/i);
        if (dailymotionMatch) {
            return `https://www.dailymotion.com/thumbnail/video/${dailymotionMatch[1]}`;
        }

        // Placeholder por defecto
        return 'img/thumbnail-placeholder.jpg';
    }

    // =============== VALIDACIONES ===============
    
    validateEpisodeData(data) {
        const required = ['title', 'description', 'season', 'number', 'videoUrl'];
        
        for (const field of required) {
            if (!data[field] || data[field].toString().trim() === '') {
                console.error(`Campo requerido faltante: ${field}`);
                return false;
            }
        }

        // Validar números
        if (isNaN(data.season) || isNaN(data.number)) {
            console.error('Temporada y episodio deben ser números');
            return false;
        }

        // Validar URL
        try {
            new URL(data.videoUrl);
        } catch {
            console.error('URL de video inválida');
            return false;
        }

        // Verificar duplicados
        const duplicate = this.episodes.find(ep => 
            ep.title.toLowerCase() === data.title.toLowerCase() ||
            (ep.season === parseInt(data.season) && ep.number === parseInt(data.number))
        );

        if (duplicate) {
            console.error('Ya existe un episodio con ese título o número');
            return false;
        }

        return true;
    }

    // =============== NOTIFICACIONES ===============
    
    async notifyNewEpisode(episode) {
        try {
            // Notificar a suscriptores locales
            this.emit('newEpisodeNotification', episode);
            
            // Enviar notificaciones push si están habilitadas
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🎬 Joshua Plata Subs', {
                    body: `Nuevo episodio: ${episode.title}`,
                    icon: 'img/logo.png',
                    tag: 'new-episode',
                    requireInteraction: true
                });
            }

            // Actualizar contador de notificaciones
            this.stats.notificationsSent = (this.stats.notificationsSent || 0) + 1;
            this.saveStats();
            
        } catch (error) {
            console.error('Error enviando notificaciones:', error);
        }
    }

    // =============== SINCRONIZACIÓN ENTRE PESTAÑAS ===============
    
    syncWithOtherTabs(action, data) {
        try {
            const syncData = {
                action: action,
                data: data,
                timestamp: Date.now(),
                source: 'joshua-plata-subs'
            };
            
            localStorage.setItem('joshuaPlataSync', JSON.stringify(syncData));
            
            // Limpiar después de un momento para evitar acumulación
            setTimeout(() => {
                localStorage.removeItem('joshuaPlataSync');
            }, 1000);
            
        } catch (error) {
            console.error('Error sincronizando con otras pestañas:', error);
        }
    }

    startAutoSync() {
        // Escuchar cambios de otras pestañas
        window.addEventListener('storage', (e) => {
            if (e.key === 'joshuaPlataSync' && e.newValue) {
                try {
                    const syncData = JSON.parse(e.newValue);
                    
                    // Evitar bucles infinitos
                    if (syncData.source === 'joshua-plata-subs') {
                        this.handleSyncEvent(syncData);
                    }
                } catch (error) {
                    console.error('Error procesando sincronización:', error);
                }
            }
        });

        // Auto-sincronizar cada 30 segundos
        setInterval(() => {
            this.checkForUpdates();
        }, 30000);
    }

    handleSyncEvent(syncData) {
        switch (syncData.action) {
            case 'episodeAdded':
                this.loadEpisodes(); // Recargar para obtener el nuevo episodio
                this.emit('dataUpdated', { type: 'episode', action: 'added' });
                break;
                
            case 'episodeUpdated':
                this.loadEpisodes();
                this.emit('dataUpdated', { type: 'episode', action: 'updated' });
                break;
                
            case 'episodeDeleted':
                this.loadEpisodes();
                this.emit('dataUpdated', { type: 'episode', action: 'deleted' });
                break;
        }
    }

    checkForUpdates() {
        // Verificar si hay cambios en localStorage
        const currentData = localStorage.getItem('joshuaPlataEpisodes');
        const currentHash = this.hashData(currentData);
        
        if (this.lastDataHash && this.lastDataHash !== currentHash) {
            this.loadEpisodes();
            this.emit('dataUpdated', { type: 'auto-sync' });
        }
        
        this.lastDataHash = currentHash;
    }

    // =============== ESTADÍSTICAS ===============
    
    updateStats() {
        const totalEpisodes = this.episodes.length;
        const publishedEpisodes = this.episodes.filter(ep => ep.published).length;
        const featuredEpisodes = this.episodes.filter(ep => ep.featured).length;
        const totalViews = this.episodes.reduce((sum, ep) => sum + (ep.views || 0), 0);
        const totalLikes = this.episodes.reduce((sum, ep) => sum + (ep.likes || 0), 0);
        const uniqueSeasons = new Set(this.episodes.map(ep => ep.season)).size;
        
        const recentEpisodes = this.episodes.filter(ep => {
            const episodeDate = new Date(ep.createdAt || ep.subtitleDate);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return episodeDate > weekAgo;
        }).length;

        this.stats = {
            ...this.stats,
            totalEpisodes,
            publishedEpisodes,
            featuredEpisodes,
            totalViews,
            totalLikes,
            uniqueSeasons,
            recentEpisodes,
            lastUpdated: new Date().toISOString()
        };

        this.saveStats();
        this.emit('statsUpdated', this.stats);
    }

    incrementViews(episodeId) {
        const episode = this.episodes.find(ep => ep.id === episodeId);
        if (episode) {
            episode.views = (episode.views || 0) + 1;
            episode.lastViewed = new Date().toISOString();
            this.saveEpisodes();
            this.updateStats();
            
            this.emit('viewIncremented', { episodeId, views: episode.views });
        }
    }

    incrementLikes(episodeId) {
        const episode = this.episodes.find(ep => ep.id === episodeId);
        if (episode) {
            episode.likes = (episode.likes || 0) + 1;
            this.saveEpisodes();
            this.updateStats();
            
            this.emit('likeIncremented', { episodeId, likes: episode.likes });
        }
    }

    // =============== FILTROS Y BÚSQUEDAS ===============
    
    getEpisodes(filters = {}) {
        let filtered = [...this.episodes];

        // Filtro por estado
        if (filters.published !== undefined) {
            filtered = filtered.filter(ep => ep.published === filters.published);
        }

        // Filtro por destacados
        if (filters.featured !== undefined) {
            filtered = filtered.filter(ep => ep.featured === filters.featured);
        }

        // Filtro por temporada
        if (filters.season) {
            filtered = filtered.filter(ep => ep.season === parseInt(filters.season));
        }

        // Búsqueda por texto
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(ep => 
                ep.title.toLowerCase().includes(searchTerm) ||
                ep.description.toLowerCase().includes(searchTerm)
            );
        }

        // Ordenamiento
        if (filters.sortBy) {
            filtered.sort((a, b) => {
                switch (filters.sortBy) {
                    case 'newest':
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    case 'oldest':
                        return new Date(a.createdAt) - new Date(b.createdAt);
                    case 'mostViewed':
                        return (b.views || 0) - (a.views || 0);
                    case 'title':
                        return a.title.localeCompare(b.title);
                    case 'season':
                        return a.season - b.season || a.number - b.number;
                    default:
                        return 0;
                }
            });
        }

        // Límite
        if (filters.limit) {
            filtered = filtered.slice(0, filters.limit);
        }

        return filtered;
    }

    getFeaturedEpisodes(limit = 6) {
        return this.getEpisodes({ 
            published: true, 
            featured: true, 
            sortBy: 'newest', 
            limit 
        });
    }

    getRecentEpisodes(limit = 10) {
        return this.getEpisodes({ 
            published: true, 
            sortBy: 'newest', 
            limit 
        });
    }

    getPopularEpisodes(limit = 10) {
        return this.getEpisodes({ 
            published: true, 
            sortBy: 'mostViewed', 
            limit 
        });
    }

    // =============== ALMACENAMIENTO ===============
    
    loadAllData() {
        this.loadEpisodes();
        this.loadSubscribers();
        this.loadStats();
        this.loadConfig();
    }

    loadEpisodes() {
        try {
            const stored = localStorage.getItem('joshuaPlataEpisodes');
            this.episodes = stored ? JSON.parse(stored) : this.getDefaultEpisodes();
            console.log(`📺 Cargados ${this.episodes.length} episodios`);
        } catch (error) {
            console.error('Error cargando episodios:', error);
            this.episodes = this.getDefaultEpisodes();
        }
    }

    saveEpisodes() {
        try {
            localStorage.setItem('joshuaPlataEpisodes', JSON.stringify(this.episodes));
            console.log(`💾 Guardados ${this.episodes.length} episodios`);
        } catch (error) {
            console.error('Error guardando episodios:', error);
        }
    }

    loadSubscribers() {
        try {
            const stored = localStorage.getItem('joshuaPlataSubscribers');
            this.subscribers = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error cargando suscriptores:', error);
            this.subscribers = [];
        }
    }

    saveSubscribers() {
        localStorage.setItem('joshuaPlataSubscribers', JSON.stringify(this.subscribers));
    }

    loadStats() {
        try {
            const stored = localStorage.getItem('joshuaPlataStats');
            this.stats = stored ? JSON.parse(stored) : this.getDefaultStats();
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            this.stats = this.getDefaultStats();
        }
    }

    saveStats() {
        localStorage.setItem('joshuaPlataStats', JSON.stringify(this.stats));
    }

    loadConfig() {
        try {
            const stored = localStorage.getItem('joshuaPlataConfig');
            this.config = stored ? JSON.parse(stored) : this.getDefaultConfig();
        } catch (error) {
            console.error('Error cargando configuración:', error);
            this.config = this.getDefaultConfig();
        }
    }

    saveConfig() {
        localStorage.setItem('joshuaPlataConfig', JSON.stringify(this.config));
    }

    // =============== DATOS POR DEFECTO ===============
    
    getDefaultEpisodes() {
        return [
            {
                id: 'ep_001',
                title: '¡Shin-chan y las travesuras en el parque!',
                description: 'Shin-chan va al parque con sus amigos y se mete en todo tipo de travesuras divertidas. ¡Prepárate para reír sin parar!',
                season: 1,
                number: 1,
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1&rel=0',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                subtitleDate: '2025-05-20',
                published: true,
                featured: true,
                allowComments: true,
                notifySubscribers: true,
                views: 1542,
                likes: 127,
                createdAt: '2025-05-20T10:00:00Z',
                updatedAt: '2025-05-20T10:00:00Z',
                creator: 'Joshua Plata',
                tags: ['comedia', 'familia', 'aventuras'],
                quality: 'HD',
                language: 'Español (Subtitulado)',
                status: 'published'
            },
            {
                id: 'ep_002',
                title: '¡Mamá Misae está muy enfadada!',
                description: 'Shin-chan hace de las suyas en casa y Misae pierde la paciencia. Una situación cómica que todos conocemos.',
                season: 1,
                number: 2,
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1&rel=0',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                subtitleDate: '2025-05-21',
                published: true,
                featured: true,
                allowComments: true,
                notifySubscribers: true,
                views: 1203,
                likes: 98,
                createdAt: '2025-05-21T15:30:00Z',
                updatedAt: '2025-05-21T15:30:00Z',
                creator: 'Joshua Plata',
                tags: ['comedia', 'familia'],
                quality: 'HD',
                language: 'Español (Subtitulado)',
                status: 'published'
            },
            {
                id: 'ep_003',
                title: '¡El primer día de escuela!',
                description: 'Shin-chan comienza un nuevo año escolar y conoce nuevos compañeros. Las aventuras en el jardín de infancia.',
                season: 1,
                number: 3,
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1&rel=0',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                subtitleDate: '2025-05-22',
                published: true,
                featured: false,
                allowComments: true,
                notifySubscribers: true,
                views: 876,
                likes: 72,
                createdAt: '2025-05-22T12:00:00Z',
                updatedAt: '2025-05-22T12:00:00Z',
                creator: 'Joshua Plata',
                tags: ['escuela', 'amigos', 'comedia'],
                quality: 'HD',
                language: 'Español (Subtitulado)',
                status: 'published'
            }
        ];
    }

    getDefaultStats() {
        return {
            totalEpisodes: 0,
            publishedEpisodes: 0,
            featuredEpisodes: 0,
            totalViews: 0,
            totalLikes: 0,
            uniqueSeasons: 0,
            recentEpisodes: 0,
            visits: 0,
            subscribers: 0,
            notificationsSent: 0,
            lastUpdated: new Date().toISOString()
        };
    }

    getDefaultConfig() {
        return {
            siteName: 'Joshua Plata Subs',
            siteDescription: 'Los mejores subtítulos de Shin-chan por Joshua Plata',
            adminUser: 'Joshua',
            theme: 'light',
            episodesPerPage: 12,
            featuredCount: 6,
            enableNotifications: true,
            enableComments: true,
            autoPublish: false
        };
    }

    // =============== UTILIDADES ===============
    
    generateUniqueId() {
        return 'ep_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    hashData(data) {
        if (!data) return '';
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    // =============== EXPORTAR/IMPORTAR ===============
    
    exportData() {
        const exportData = {
            episodes: this.episodes,
            subscribers: this.subscribers,
            stats: this.stats,
            config: this.config,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `joshua-plata-subs-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    async importData(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            if (importData.episodes) {
                this.episodes = importData.episodes;
                this.saveEpisodes();
            }
            
            if (importData.subscribers) {
                this.subscribers = importData.subscribers;
                this.saveSubscribers();
            }
            
            if (importData.stats) {
                this.stats = importData.stats;
                this.saveStats();
            }
            
            if (importData.config) {
                this.config = importData.config;
                this.saveConfig();
            }
            
            this.emit('dataImported', importData);
            console.log('✅ Datos importados correctamente');
            
        } catch (error) {
            console.error('❌ Error importando datos:', error);
            throw error;
        }
    }

    // =============== MANTENIMIENTO ===============
    
    async performMaintenance() {
        console.log('🔧 Iniciando mantenimiento del sistema...');
        
        try {
            // Limpiar datos corruptos
            this.cleanCorruptedData();
            
            // Optimizar almacenamiento
            this.optimizeStorage();
            
            // Actualizar estadísticas
            this.updateStats();
            
            // Verificar integridad
            this.verifyDataIntegrity();
            
            console.log('✅ Mantenimiento completado');
            this.emit('maintenanceCompleted');
            
        } catch (error) {
            console.error('❌ Error durante el mantenimiento:', error);
            throw error;
        }
    }

    cleanCorruptedData() {
        // Remover episodios sin datos esenciales
        const initialCount = this.episodes.length;
        this.episodes = this.episodes.filter(ep => 
            ep.id && ep.title && ep.videoUrl
        );
        
        if (this.episodes.length !== initialCount) {
            console.log(`🧹 Removidos ${initialCount - this.episodes.length} episodios corruptos`);
            this.saveEpisodes();
        }
    }

    optimizeStorage() {
        // Remover propiedades innecesarias
        this.episodes.forEach(ep => {
            delete ep._temp;
            delete ep._cache;
        });
        
        this.saveEpisodes();
    }

    verifyDataIntegrity() {
        const issues = [];
        
        // Verificar IDs únicos
        const ids = this.episodes.map(ep => ep.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            issues.push('IDs duplicados encontrados');
        }
        
        // Verificar números de episodios
        const seasonEpisodes = {};
        this.episodes.forEach(ep => {
            const key = `S${ep.season}E${ep.number}`;
            if (seasonEpisodes[key]) {
                issues.push(`Episodio duplicado: ${key}`);
            }
            seasonEpisodes[key] = true;
        });
        
        if (issues.length > 0) {
            console.warn('⚠️ Problemas de integridad encontrados:', issues);
            this.emit('integrityIssues', issues);
        }
    }
}

// Instancia global
window.dataManager = new DataManager();