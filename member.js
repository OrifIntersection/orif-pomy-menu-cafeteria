// Fonctions pour les membres (bénéficiaires)
const AVIS_KEY = "orif_avis_data";

function getAvisData() {
  try {
    const data = localStorage.getItem(AVIS_KEY);
    console.log("Données brutes récupérées:", data);
    const parsed = JSON.parse(data) || [];
    console.log("Données parsées:", parsed);
    return parsed;
  } catch (e) {
    console.log("Erreur lors de la lecture des avis:", e);
    return [];
  }
}

function saveAvisData(avisArray) {
  console.log("Sauvegarde des avis:", avisArray);
  try {
    localStorage.setItem(AVIS_KEY, JSON.stringify(avisArray));
    console.log("Avis sauvegardés avec succès");
    // Vérification immédiate
    const verification = localStorage.getItem(AVIS_KEY);
    console.log("Vérification post-sauvegarde:", verification);
  } catch (e) {
    console.error("Erreur lors de la sauvegarde:", e);
  }
}

// Ajouter un avis
function ajouterAvis(note, comment) {
  const user = currentUser();
  console.log("Ajout d'avis - utilisateur:", user);
  
  if (!user) {
    alert("Vous devez être connecté pour donner votre avis.");
    return false;
  }

  const nouvelAvis = {
    id: Date.now(),
    email: user.email,
    name: user.name,
    note: parseInt(note),
    comment: comment.trim(),
    date: new Date().toISOString().slice(0, 10),
    timestamp: new Date().toISOString()
  };

  console.log("Nouvel avis:", nouvelAvis);

  const avisExistants = getAvisData();
  console.log("Avis existants:", avisExistants);
  
  // Vérifier si l'utilisateur a déjà donné un avis aujourd'hui
  const avisAujourdhui = avisExistants.find(a => 
    a.email === user.email && a.date === nouvelAvis.date
  );

  if (avisAujourdhui) {
    const confirmer = confirm("Vous avez déjà donné votre avis aujourd'hui. Voulez-vous le modifier ?");
    if (confirmer) {
      // Remplacer l'avis existant
      const index = avisExistants.findIndex(a => a.id === avisAujourdhui.id);
      avisExistants[index] = nouvelAvis;
      console.log("Avis modifié");
    } else {
      return false;
    }
  } else {
    // Ajouter le nouvel avis
    avisExistants.push(nouvelAvis);
    console.log("Nouvel avis ajouté");
  }

  saveAvisData(avisExistants);
  console.log("Avis sauvegardés:", getAvisData());
  
  // Recharger l'affichage des avis immédiatement
  setTimeout(() => {
    chargerAvis();
    // Mettre à jour la moyenne
    updateMoyenneAffichage();
  }, 100);
  
  return true;
}

// Charger et afficher les avis
function chargerAvis() {
  const avisContainer = document.getElementById('avis-list');
  if (!avisContainer) return;

  const avisData = getAvisData();
  const today = new Date().toISOString().slice(0, 10);
  
  console.log("Chargement des avis - data:", avisData);
  console.log("Date du jour:", today);
  
  // Filtrer les avis d'aujourd'hui
  const avisAujourdhui = avisData.filter(a => a.date === today);
  console.log("Avis d'aujourd'hui:", avisAujourdhui);
  
  avisContainer.innerHTML = '';
  
  if (avisAujourdhui.length === 0) {
    avisContainer.innerHTML = '<li style="color:#666;font-style:italic;">Aucun avis pour aujourd\u0027hui</li>';
    return;
  }

  avisAujourdhui.forEach(avis => {
    const li = document.createElement('li');
    const currentUser = window.currentUser && window.currentUser();
    const isOwnAvis = currentUser && currentUser.email === avis.email;
    
    const etoiles = '★'.repeat(avis.note) + '☆'.repeat(5 - avis.note);
    li.innerHTML = `
      <div class="avis-header">
        <div class="avis-rating">
          <span class="stars">${etoiles}</span>
          <span>(${avis.note}/5)</span>
        </div>
        <div class="avis-author">— ${avis.name || 'Membre'}</div>
      </div>
      <div class="avis-comment">${avis.comment}</div>
      <div class="avis-footer">
        <div class="avis-date">${new Date(avis.timestamp).toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'long', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}</div>
        ${isOwnAvis ? `
          <div class="avis-actions">
            <button class="btn-mini btn-edit-avis" onclick="modifierAvis(${avis.id})">✏️</button>
            <button class="btn-mini btn-delete-avis" onclick="supprimerAvis(${avis.id})">🗑️</button>
          </div>
        ` : ''}
      </div>
    `;
    avisContainer.appendChild(li);
  });
}

// Calculer la moyenne des notes
function calculerMoyenne() {
  const avisData = getAvisData();
  const today = new Date().toISOString().slice(0, 10);
  const avisAujourdhui = avisData.filter(a => a.date === today);
  
  if (avisAujourdhui.length === 0) return 0;
  
  const somme = avisAujourdhui.reduce((total, avis) => total + avis.note, 0);
  return (somme / avisAujourdhui.length).toFixed(1);
}

// Mettre à jour l'affichage de la moyenne
function updateMoyenneAffichage() {
  const moyenneNote = calculerMoyenne();
  const moyenneElement = document.getElementById('moyenne-note');
  const moyenneContainer = document.getElementById('moyenne-avis');
  
  if (moyenneElement && moyenneContainer) {
    moyenneElement.textContent = moyenneNote;
    if (moyenneNote > 0) {
      moyenneContainer.style.display = 'block';
      moyenneContainer.style.color = '#4CAF50';
    } else {
      moyenneContainer.style.display = 'block';
      moyenneContainer.style.color = '#666';
    }
  }
}

// Initialiser les fonctions pour les membres
function initMemberFeatures() {
  const user = currentUser();
  const avisForm = document.getElementById('avis-form');
  const avisHint = document.getElementById('avis-hint');
  
  if (avisHint) {
    if (user) {
      if (user.role === "member") {
        avisHint.textContent = `Connecté en tant que ${user.name}. Vous pouvez donner votre avis sur le menu du jour.`;
        avisHint.style.color = "#27ae60";
      } else {
        avisHint.textContent = `Connecté en tant que ${user.name} (${user.role}).`;
      }
    } else {
      avisHint.textContent = "Pour poster un avis, connectez-vous avec votre email @orif.ch.";
      avisHint.style.color = "#e74c3c";
    }
  }

  if (avisForm) {
    avisForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (!user) {
        alert("Vous devez être connecté pour donner votre avis.");
        window.location.href = "login.html";
        return;
      }

      const note = document.getElementById('note').value;
      const comment = document.getElementById('comment').value;

      if (!comment.trim()) {
        alert("Veuillez laisser un commentaire.");
        return;
      }

      if (ajouterAvis(note, comment)) {
        alert("Merci pour votre avis !");
        avisForm.reset();
        chargerAvis(); // Recharger les avis
        
        // Afficher la nouvelle moyenne
        const moyenne = calculerMoyenne();
        const moyenneElement = document.getElementById('moyenne-avis');
        if (moyenneElement) {
          moyenneElement.textContent = `Moyenne: ${moyenne}/5`;
        }
      }
    });
  }

  // Charger les avis existants
  chargerAvis();
}

// Modifier un avis
function modifierAvis(avisId) {
  const user = currentUser();
  if (!user || user.role !== 'member') return;

  let avis = getAvisData();
  const avisIndex = avis.findIndex(a => a.id === avisId && a.email === user.email);
  
  if (avisIndex === -1) {
    alert('Vous ne pouvez modifier que vos propres avis.');
    return;
  }

  const avisActuel = avis[avisIndex];
  const nouvelleNote = prompt(`Nouvelle note (1-5) :`, avisActuel.note);
  if (nouvelleNote === null) return;

  const noteNum = parseInt(nouvelleNote);
  if (isNaN(noteNum) || noteNum < 1 || noteNum > 5) {
    alert('La note doit être entre 1 et 5.');
    return;
  }

  const nouveauCommentaire = prompt(`Nouveau commentaire :`, avisActuel.comment);
  if (nouveauCommentaire === null) return;

  avis[avisIndex].note = noteNum;
  avis[avisIndex].comment = nouveauCommentaire.trim();
  avis[avisIndex].dateModification = new Date().toISOString();

  saveAvisData(avis);
  chargerAvis();
  alert('Avis modifié avec succès !');
}

// Supprimer un avis
function supprimerAvis(avisId) {
  const user = currentUser();
  if (!user || user.role !== 'member') return;

  let avis = getAvisData();
  const avisIndex = avis.findIndex(a => a.id === avisId && a.email === user.email);
  
  if (avisIndex === -1) {
    alert('Vous ne pouvez supprimer que vos propres avis.');
    return;
  }

  if (confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
    avis.splice(avisIndex, 1);
    saveAvisData(avis);
    chargerAvis();
    alert('Avis supprimé avec succès !');
  }
}

// Rendre les fonctions accessibles globalement
window.ajouterAvis = ajouterAvis;
window.chargerAvis = chargerAvis;
window.calculerMoyenne = calculerMoyenne;
window.updateMoyenneAffichage = updateMoyenneAffichage;
window.initMemberFeatures = initMemberFeatures;
window.modifierAvis = modifierAvis;
window.supprimerAvis = supprimerAvis;