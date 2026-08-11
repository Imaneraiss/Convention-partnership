import api from './api'

// ============================================
// UPLOAD
// ============================================

// Upload fichier (convention, réunion ou budget)
export const uploadFichier = (formData) => {
    const conventionId = formData.get('convention_id');
    const reunionId = formData.get('reunion_id');
    const budgetId = formData.get('budget_id');
    const comiteId = formData.get('comite_id');
    
    console.log('📤 convention_id extrait:', conventionId);
    console.log('📤 reunion_id extrait:', reunionId);
    console.log('📤 budget_id extrait:', budgetId);
    console.log('📤 comite_id extrait:', comiteId);
    
    // Construire l'URL avec les paramètres
    let url = '/fichiers/upload?';
    const params = [];
    
    if (conventionId) params.push(`convention_id=${conventionId}`);
    if (reunionId) params.push(`reunion_id=${reunionId}`);
    if (budgetId) params.push(`budget_id=${budgetId}`);
    if (comiteId) params.push(`comite_id=${comiteId}`);
    
    url += params.join('&');
    
    // Si aucun paramètre, utiliser l'URL de base
    if (params.length === 0) {
        url = '/fichiers/upload';
    }
    
    return api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// ============================================
// RÉCUPÉRATION DES FICHIERS
// ============================================

// GET fichiers par convention
export const getFichiersByConvention = (convention_id) =>
    api.get(`/fichiers/convention/${convention_id}`)

// GET fichiers par réunion (déprécié - les réunions sont dans JSON)
export const getFichiersByReunion = (reunion_id) =>
    api.get(`/fichiers/reunion/${reunion_id}`)

// GET fichiers par budget
export const getFichiersByBudget = (budget_id) =>
    api.get(`/fichiers/budget/${budget_id}`)

// GET fichiers par comité
export const getFichiersByComite = (comite_id) =>
    api.get(`/fichiers/comite/${comite_id}`)

// GET tous les fichiers d'une convention (y compris les PV des comités)
export const getAllFichiersByConvention = async (convention_id) => {
    try {
        // Récupérer tous les fichiers de la convention
        const response = await getFichiersByConvention(convention_id);
        return response.data;
    } catch (error) {
        console.error('❌ Erreur récupération fichiers:', error);
        throw error;
    }
};

// ============================================
// TÉLÉCHARGEMENT
// ============================================

// ✅ Télécharger un fichier par son ID
export const downloadFile = async (fichierId, nomFichier) => {
    if (!fichierId) {
        throw new Error('ID du fichier manquant');
    }
    
    try {
        console.log('📥 Téléchargement du fichier:', fichierId, nomFichier);
        
        const response = await api.get(`/fichiers/${fichierId}`, {
            responseType: 'blob',
        });
        
        // Vérifier si la réponse est valide
        if (response.data.size === 0) {
            throw new Error('Le fichier est vide');
        }
        
        // Créer l'URL de téléchargement
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = nomFichier || `document_${fichierId}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Nettoyer l'URL après un délai
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 100);
        
        console.log('✅ Fichier téléchargé avec succès');
        return true;
    } catch (error) {
        console.error('❌ Erreur téléchargement:', error);
        throw error;
    }
};

// ✅ Fonction utilitaire pour télécharger depuis un bouton
export const handleDownload = async (fichierId, nomFichier) => {
    if (!fichierId) {
        alert('Fichier non trouvé');
        return;
    }
    
    try {
        await downloadFile(fichierId, nomFichier);
    } catch (error) {
        const message = error.response?.data?.detail || error.message || 'Erreur lors du téléchargement';
        alert(`❌ ${message}`);
    }
};

// ============================================
// SUPPRESSION
// ============================================

// Supprimer un fichier
export const deleteFichier = (id) =>
    api.delete(`/fichiers/${id}`)

// ============================================
// EXTRACTION OCR + GROQ
// ============================================

// Extraire les champs via OCR + Groq
export const extractConvention = (formData) =>
    api.post('/fichiers/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })

// ============================================
// UTILITAIRES
// ============================================

// Formater la taille d'un fichier
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Obtenir l'icône en fonction du type de fichier
export const getFileIcon = (type) => {
    if (!type) return '📄';
    if (type.includes('pdf')) return '📕';
    if (type.includes('word') || type.includes('document')) return '📘';
    if (type.includes('excel') || type.includes('sheet')) return '📗';
    if (type.includes('image')) return '🖼️';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📄';
};

// Vérifier si c'est un fichier image
export const isImageFile = (type) => {
    return type && type.startsWith('image/');
};

// Vérifier si c'est un PDF
export const isPDFFile = (type) => {
    return type === 'application/pdf';
};