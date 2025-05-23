// (Mantén el mismo código que ya tienes, pero añade esta función al final)

// Función para procesar mejor las URLs de Dailymotion
function processVideoUrl(url) {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Dailymotion (dai.ly URLs)
    if (url.includes('dai.ly')) {
        const dailyId = url.split('/').pop();
        return `https://www.dailymotion.com/embed/video/${dailyId}`;
    }
    
    // Dailymotion directo
    const dailymotionMatch = url.match(/(?:dailymotion\.com\/video\/)([a-zA-Z0-9]+)/i);
    if (dailymotionMatch) {
        return `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`;
    }
    
    return url;
}

function generateThumbnail(videoUrl) {
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (youtubeMatch) {
        return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    
    // Para Dailymotion, usar placeholder personalizado
    if (videoUrl.includes('dai.ly') || videoUrl.includes('dailymotion')) {
        return 'img/dailymotion-placeholder.jpg';
    }
    
    return null;
}

console.log('✅ Sistema actualizado con soporte para Dailymotion');