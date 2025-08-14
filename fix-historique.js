// Fonction corrigée pour l'historique des avis des membres
function chargerHistoriqueAvis() {
  console.log("=== CHARGEMENT HISTORIQUE AVIS MEMBRE ===");
  
  const user = currentUser();
  if (!user || user.role !== 'member') {
    console.log("Utilisateur non membre, arrêt");
    return;
  }
  
  const container = document.getElementById('historique-container') || document.getElementById('archive');
  if (!container) {
    console.log("Container historique non trouvé");
    return;
  }
  
  try {
    const avisData = getAvisData();
    console.log("Données avis:", avisData);
    
    // Filtrer les avis de cet utilisateur uniquement
    const mesAvis = avisData.filter(avis => avis.email === user.email);
    console.log("Mes avis:", mesAvis);
    
    if (mesAvis.length === 0) {
      container.innerHTML = '<div class="section-card"><p>Vous n\u0027avez pas encore donné d\u0027avis.</p></div>';
      return;
    }
    
    // Grouper par date
    const avisParDate = {};
    mesAvis.forEach(avis => {
      if (!avisParDate[avis.date]) {
        avisParDate[avis.date] = [];
      }
      avisParDate[avis.date].push(avis);
    });
    
    // Trier par date décroissante
    const dates = Object.keys(avisParDate).sort((a, b) => b.localeCompare(a));
    
    let html = '<div class="historique-avis">';
    
    dates.forEach(date => {
      const avis = avisParDate[date];
      const dateFormatted = new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      html += '<div class="section-card" style="margin-bottom: 1rem;">';
      html += '<h3>' + dateFormatted + '</h3>';
      
      avis.forEach(a => {
        const etoiles = '★'.repeat(a.note) + '☆'.repeat(5 - a.note);
        html += '<div class="avis-item" style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 6px;">';
        html += '<div class="avis-rating" style="font-size: 1.2rem; margin-bottom: 0.5rem;">' + etoiles + ' (' + a.note + '/5)</div>';
        html += '<div class="avis-comment" style="margin-bottom: 0.5rem; font-style: italic;">"' + a.comment + '"</div>';
        html += '<div class="avis-date" style="font-size: 0.9rem; color: #666;">Donné le ' + new Date(a.timestamp).toLocaleDateString('fr-FR') + ' à ' + new Date(a.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) + '</div>';
        html += '</div>';
      });
      
      html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    console.log("Historique avis affiché avec succès");
    
  } catch (e) {
    console.error("Erreur chargement historique:", e);
    container.innerHTML = '<div class="section-card"><p style="color: red;">Erreur lors du chargement de l\u0027historique.</p></div>';
  }
}

// Fonction moyenne corrigée
function moyenne(avis = []) {
  if (!avis.length) return 0;
  return (avis.reduce((s, a) => s + (a.note || 0), 0) / avis.length).toFixed(1);
}

// Export global
window.chargerHistoriqueAvis = chargerHistoriqueAvis;
window.moyenne = moyenne;