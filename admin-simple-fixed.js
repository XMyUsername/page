/**
 * Sistema Admin SIMPLE Y FUNCIONAL - VERSIÓN CORREGIDA
 * Botón de añadir episodio GARANTIZADO que funciona
 */

console.log('🚀 Cargando sistema admin corregido...');

// Variables globales
let episodes = [];
let currentEditingEpisode = null;

// Función DIRECTA para mostrar modal - SIN COMPLICACIONES
function showAddEpisodeModal() {
    console.log('🎬 showAddEpisodeModal ejecutada CORRECTAMENTE');
    
    // Verificar si existe el modal, si no, crearlo
    let modal = document.getElementById('episodeModal');
    if (!modal) {
        console.log('📝 Creando modal...');
        createModal();
        modal = document.getElementById('episodeModal');
    }
    
    if (!modal) {
        console.error('❌ No se pudo crear el modal');
        alert('Error: No se pudo crear el formulario');
        return;
    }
    
    // Limpiar formulario
    resetForm();
    
    // Mostrar modal
    try {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        console.log('✅ Modal mostrado correctamente');
    } catch (error) {
        console.error('❌ Error mostrando modal:', error);
        alert('Error mostrando el formulario');
    }
}

// Crear modal dinámicamente
function createModal() {
    console.log('🔨 Creando modal HTML...');
    
    const modalHTML = `
        <div class="modal fade" id="episodeModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-plus-circle me-2"></i>
                            Añadir Nuevo Episodio
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="episodeForm">
                            <div class="row mb-3">
                                <div class="col-md-8">
                                    <label class="form-label">
                                        <i class="fas fa-heading me-1"></i>
                                        Título del Episodio *
                                    </label>
                                    <input type="text" class="form-control" id="title" required 
                                           placeholder="Ej: ¡Shin-chan y las travesuras en el parque!">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">
                                        <i class="fas fa-calendar me-1"></i>
                                        Fecha de Subtitulado
                                    </label>
                                    <input type="date" class="form-control" id="subtitleDate">
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="fas fa-align-left me-1"></i>
                                    Descripción *
                                </label>
                                <textarea class="form-control" id="description" rows="3" required
                                          placeholder="Describe brevemente lo que pasa en este episodio..."></textarea>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">
                                        <i class="fas fa-link me-1"></i>
                                        URL del Video *
                                    </label>
                                    <input type="url" class="form-control" id="videoUrl" required 
                                           placeholder="https://youtube.com/watch?v=... o https://dai.ly/...">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">
                                        <i class="fas fa-layer-group me-1"></i>
                                        Temporada *
                                    </label>
                                    <input type="number" class="form-control" id="season" value="1" min="1" required>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">
                                        <i class="fas fa-hashtag me-1"></i>
                                        Episodio *
                                    </label>
                                    <input type="number" class="form-control" id="episode" value="1" min="1" required>
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="published" checked>
                                        <label class="form-check-label">
                                            <i class="fas fa-eye me-1"></i>
                                            Publicado (visible en el sitio)
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="featured">
                                        <label class="form-check-label">
                                            <i class="fas fa-star me-1"></i>
                                            Destacado (aparece en portada)
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                <strong>Formatos soportados:</strong> YouTube, Dailymotion (dai.ly), Vimeo
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="saveEpisode()">
                            <i class="fas fa-save me-1"></i>
                            Guardar Episodio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('✅ Modal HTML creado');
}

// Función DIRECTA para guardar episodio
function saveEpisode() {
    console.log('💾 Iniciando guardado de episodio...');
    
    // Obtener datos del formulario
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const season = parseInt(document.getElementById('season').value);
    const episodeNum = parseInt(document.getElementById('episode').value);
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const subtitleDate = document.getElementById('subtitleDate').value || new Date().toISOString().split('T')[0];
    const published = document.getElementById('published').checked;
    const featured = document.getElementById('featured').checked;
    
    console.log('📋 Datos recopilados:', { title, season, episodeNum, published, featured });
    
    // Validar campos requeridos
    if (!title || !description || !videoUrl || !season || !episodeNum) {
        Swal.fire({
            title: 'Error',
            text: 'Todos los campos marcados con * son obligatorios',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
        return;
    }
    
    // Validar duplicados
    const duplicate = episodes.find(ep => 
        ep.title.toLowerCase() === title.toLowerCase() ||
        (ep.season === season && ep.number === episodeNum)
    );
    
    if (duplicate) {
        Swal.fire({
            title: 'Episodio duplicado',
            text: 'Ya existe un episodio con ese título o número de temporada/episodio',
            icon: 'warning',
            confirmButtonText: 'Entendido'
        });
        return;
    }
    
    // Crear episodio
    const newEpisode = {
        id: 'ep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        title: title,
        description: description,
        season: season,
        number: episodeNum,
        videoUrl: videoUrl,
        embedUrl: processVideoUrl(videoUrl),
        thumbnail: generateThumbnail(videoUrl) || 'img/thumbnail-placeholder.jpg',
        subtitleDate: subtitleDate,
        published: published,
        featured: featured,
        views: 0,
        likes: 0,
        creator: 'Joshua Plata',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    console.log('🎬 Episodio creado:', newEpisode);
    
    // Añadir a la lista (al principio)
    episodes.unshift(newEpisode);
    
    // Guardar en localStorage
    try {
        localStorage.setItem('joshuaPlataEpisodes', JSON.stringify(episodes));
        console.log('💾 Episodio guardado en localStorage');
    } catch (error) {
        console.error('❌ Error guardando en localStorage:', error);
        Swal.fire('Error', 'No se pudo guardar el episodio', 'error');
        return;
    }
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('episodeModal'));
    if (modal) modal.hide();
    
    // Mostrar éxito
    Swal.fire({
        title: '¡Episodio guardado!',
        text: `"${title}" se añadió correctamente`,
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
    }).then(() => {
        // Recargar la página actual para mostrar cambios
        window.location.reload();
    });
    
    console.log('✅ Proceso de guardado completado');
}

// Funciones auxiliares mejoradas
function processVideoUrl(url) {
    console.log('🔗 Procesando URL:', url);
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (youtubeMatch) {
        const embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}?enablejsapi=1&rel=0`;
        console.log('📺 YouTube detectado:', embedUrl);
        return embedUrl;
    }
    
    // Dailymotion (dai.ly URLs)
    if (url.includes('dai.ly')) {
        const dailyId = url.split('/').pop();
        const embedUrl = `https://www.dailymotion.com/embed/video/${dailyId}`;
        console.log('📺 Dailymotion (dai.ly) detectado:', embedUrl);
        return embedUrl;
    }
    
    // Dailymotion directo
    const dailymotionMatch = url.match(/(?:dailymotion\.com\/video\/)([a-zA-Z0-9]+)/i);
    if (dailymotionMatch) {
        const embedUrl = `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`;
        console.log('📺 Dailymotion directo detectado:', embedUrl);
        return embedUrl;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)([0-9]+)/i);
    if (vimeoMatch) {
        const embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        console.log('📺 Vimeo detectado:', embedUrl);
        return embedUrl;
    }
    
    console.log('🔗 URL sin procesar:', url);
    return url;
}

function generateThumbnail(videoUrl) {
    // YouTube thumbnail
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (youtubeMatch) {
        return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    
    // Para Dailymotion, usar placeholder
    if (videoUrl.includes('dai.ly') || videoUrl.includes('dailymotion')) {
        return 'img/dailymotion-placeholder.jpg';
    }
    
    return null;
}

function resetForm() {
    const form = document.getElementById('episodeForm');
    if (form) {
        form.reset();
        
        // Establecer fecha actual
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('subtitleDate').value = today;
        
        // Auto-detectar números
        document.getElementById('season').value = '1';
        document.getElementById('episode').value = getNextEpisodeNumber();
        document.getElementById('published').checked = true;
        document.getElementById('featured').checked = false;
    }
}

function getNextEpisodeNumber() {
    if (episodes.length === 0) return 1;
    const maxEpisode = Math.max(...episodes.map(ep => ep.number || 0));
    return maxEpisode + 1;
}

// Función de logout
function logout() {
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

// INICIALIZACIÓN ROBUSTA
function initializeAdmin() {
    console.log('🚀 Inicializando admin...');
    
    // Verificar autenticación
    const session = localStorage.getItem('joshuaPlataSession');
    if (!session) {
        console.log('❌ Sin sesión, redirigiendo...');
        window.location.href = '../index.html';
        return;
    }
    
    try {
        const sessionData = JSON.parse(atob(session));
        if (sessionData.expiry <= Date.now()) {
            console.log('❌ Sesión expirada, redirigiendo...');
            localStorage.removeItem('joshuaPlataSession');
            window.location.href = '../index.html';
            return;
        }
        console.log('✅ Sesión válida para:', sessionData.username);
    } catch (error) {
        console.error('❌ Error verificando sesión:', error);
        localStorage.removeItem('joshuaPlataSession');
        window.location.href = '../index.html';
        return;
    }
    
    // Cargar episodios
    loadEpisodes();
    
    // Configurar TODOS los botones
    setupAllButtons();
    
    // Actualizar stats
    updateStats();
    
    console.log('✅ Admin inicializado correctamente');
}

function loadEpisodes() {
    try {
        const stored = localStorage.getItem('joshuaPlataEpisodes');
        episodes = stored ? JSON.parse(stored) : [];
        console.log(`📺 Cargados ${episodes.length} episodios`);
    } catch (error) {
        console.error('❌ Error cargando episodios:', error);
        episodes = [];
    }
}

function setupAllButtons() {
    console.log('🎯 Configurando TODOS los botones...');
    
    // Lista COMPLETA de IDs posibles
    const buttonIds = [
        'quickAddEpisodeBtn',
        'addEpisodeFromDashboard', 
        'addNewEpisodeBtn',
        'addNewEpisodeFooterBtn'
    ];
    
    let buttonsConfigured = 0;
    
    // Configurar cada botón por ID
    buttonIds.forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            // Limpiar eventos previos
            button.onclick = null;
            button.removeEventListener('click', showAddEpisodeModal);
            
            // Añadir evento
            button.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`🎬 Botón ${id} clickeado`);
                showAddEpisodeModal();
            };
            
            buttonsConfigured++;
            console.log(`✅ Botón ${id} configurado`);
        }
    });
    
    // Configurar botones por clase
    document.querySelectorAll('.add-episode-btn').forEach((button, index) => {
        button.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🎬 Botón clase ${index} clickeado`);
            showAddEpisodeModal();
        };
        buttonsConfigured++;
    });
    
    // Configurar quick actions
    document.querySelectorAll('.quick-action-card').forEach((card, index) => {
        if (card.textContent.includes('Nuevo Episodio') || 
            card.textContent.includes('Añadir') ||
            card.querySelector('.fa-plus-circle')) {
            card.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`🎬 Quick action ${index} clickeado`);
                showAddEpisodeModal();
            };
            buttonsConfigured++;
        }
    });
    
    // Configurar logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = logout;
        console.log('✅ Botón logout configurado');
    }
    
    console.log(`✅ Total de ${buttonsConfigured} botones configurados`);
}

function updateStats() {
    const stats = {
        total: episodes.length,
        published: episodes.filter(ep => ep.published).length,
        featured: episodes.filter(ep => ep.featured).length,
        views: episodes.reduce((sum, ep) => sum + (ep.views || 0), 0)
    };
    
    // Actualizar elementos si existen
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value.toLocaleString();
        }
    };
    
    updateElement('dashboardTotalEpisodes', stats.total);
    updateElement('dashboardPublishedEpisodes', stats.published);
    updateElement('dashboardFeaturedEpisodes', stats.featured);
    updateElement('dashboardTotalViews', stats.views);
    
    console.log('📊 Stats actualizadas:', stats);
}

// Event listeners para inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado, inicializando...');
    setTimeout(initializeAdmin, 100);
});

// Respaldo por si DOMContentLoaded ya pasó
if (document.readyState === 'loading') {
    console.log('⏳ Esperando DOM...');
} else {
    console.log('🚀 DOM ya listo, inicializando inmediatamente...');
    setTimeout(initializeAdmin, 100);
}

// Exponer funciones globalmente
window.showAddEpisodeModal = showAddEpisodeModal;
window.saveEpisode = saveEpisode;
window.logout = logout;

console.log('🎯 Sistema admin simple CORREGIDO cargado completamente');