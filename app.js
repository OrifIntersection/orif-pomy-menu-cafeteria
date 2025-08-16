// Comptes de démonstration
const USERS = {
  "ayesh.admin@orif.ch": { role: "admin", password: "0000", name: "Ayesh Admin" },
  "ayesh.benef@orif.ch": { role: "member", password: "0000", name: "Ayesh Benef" }
};

const USER_KEY = "orifUser";

// Fonctions d'authentification
function login(email, password) {
  console.log("Tentative de connexion:", email, password);
  const u = USERS[email?.toLowerCase()];
  console.log("Utilisateur trouvé:", u);
  if (!u || u.password !== password) {
    console.log("Échec de l'authentification");
    return null;
  }
  const session = { email: email.toLowerCase(), role: u.role, name: u.name };
  localStorage.setItem(USER_KEY, JSON.stringify(session));
  console.log("Session créée:", session);
  return session;
}

function currentUser() {
  try { 
    return JSON.parse(localStorage.getItem(USER_KEY)); 
  } catch { 
    return null; 
  }
}

function logout() {
  localStorage.removeItem(USER_KEY);
}

// Gestion de l'affichage du compte dans le header
function renderAccountArea() {
  const box = document.getElementById("account-area");
  if (!box) return;
  const u = currentUser();

  if (!u) {
    box.innerHTML = `<a class="btn" href="./login.html">Se connecter</a>`;
    return;
  }

  const isAdmin = u.role === "admin";
  const isMember = u.role === "member";
  
  box.innerHTML = `
    <span class="user-chip" style="color: white; background: rgba(255,255,255,0.2); padding: 0.5rem; border-radius: 5px; margin-right: 0.5rem;">Connecté: ${u.name}</span>
    ${isAdmin ? `<a class="btn" href="./admin.html">Gestion Menus</a>` : ""}
    <a class="btn" href="archive.html">${isMember ? "Historique de vos avis des menus" : "Historique"}</a>
    <button id="btn-logout" class="btn">Se déconnecter</button>
  `;
  
  // Gérer la déconnexion
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
      window.location.reload();
      window.location.href = "/";
    });
  }
}

// Initialiser l'affichage du compte au chargement de la page
document.addEventListener('DOMContentLoaded', renderAccountArea);

// Charger le menu du jour depuis le localStorage ou utiliser les données par défaut
function chargerMenuDuJour(dateSpecifique = null) {
  console.log('Chargement du menu du jour...');
  const menuData = JSON.parse(localStorage.getItem('orif_menu_data') || '{}');
  const dateAujourdhui = dateSpecifique || new Date().toISOString().slice(0, 10);
  
  console.log('Menu data:', menuData);
  console.log('Date recherchée:', dateAujourdhui);
  
  // Chercher d'abord dans l'historique pour la date spécifiée
  const history = JSON.parse(localStorage.getItem('orif_menu_history') || '[]');
  const menuPourDate = history.find(menu => menu.date === dateAujourdhui);
  
  let menuAfficher = null;
  
  if (menuPourDate) {
    // Menu trouvé dans l'historique pour cette date
    menuAfficher = menuPourDate;
    console.log('Menu trouvé dans l\u0027historique:', menuAfficher);
  } else if (!dateSpecifique && menuData.today) {
    // Menu du jour actuel si aucune date spécifique n'est demandée
    menuAfficher = menuData.today;
    console.log('Menu du jour actuel:', menuAfficher);
  }
  
  if (menuAfficher) {
    console.log('Affichage du menu:', menuAfficher);
    
    // Mettre à jour le nom et la description du plat
    const platNomEl = document.getElementById('plat-nom');
    const platDescEl = document.getElementById('plat-desc');
    const platImgEl = document.getElementById('plat-img');
    
    if (platNomEl) platNomEl.textContent = menuAfficher.platName || menuAfficher.plat?.name || 'Plat du jour';
    if (platDescEl) platDescEl.textContent = menuAfficher.platDesc || menuAfficher.plat?.description || 'Description non disponible';
    
    if (platImgEl && menuAfficher.platImg && menuAfficher.platImg !== 'plat_jour.jpg') {
      platImgEl.src = menuAfficher.platImg;
    } else if (platImgEl && menuAfficher.plat?.img && menuAfficher.plat.img !== 'plat_jour.jpg') {
      platImgEl.src = menuAfficher.plat.img;
    }
    
    // Mettre à jour les autres sections
    if (menuAfficher.dessertText || menuAfficher.dessert?.text) {
      updateSection('dessert-content', menuAfficher.dessertText || menuAfficher.dessert.text);
    }
    
    if (menuAfficher.selfItems || menuAfficher.self) {
      updateSectionList('self-list', menuAfficher.selfItems || menuAfficher.self);
    }
    
    if (menuAfficher.saladItems || menuAfficher.saladbar) {
      updateSectionList('salades-list', menuAfficher.saladItems || menuAfficher.saladbar);
    }
    
    if (menuAfficher.vegText || menuAfficher.vegetarien) {
      updateSection('veg-content', menuAfficher.vegText || menuAfficher.vegetarien);
    }
    
    // Ajouter boutons de gestion pour l'admin
    ajouterBoutonsGestionAdmin();
    
    console.log('Menu affiché avec succès');
  } else {
    console.log('Aucun menu trouvé pour cette date, affichage du menu par défaut');
  }
}

// Mettre à jour une section de menu (texte simple)
function updateSection(elementId, text) {
  const element = document.getElementById(elementId);
  if (element && text) {
    element.textContent = text;
  }
}

// Mettre à jour une section de menu (liste)
function updateSectionList(listId, items) {
  const list = document.getElementById(listId);
  if (list && items && items.length > 0) {
    list.innerHTML = items.map(item => `<li>${item}</li>`).join('');
  }
}

// Ajouter les boutons de modification/suppression pour l'admin
function ajouterBoutonsGestionAdmin() {
  const user = currentUser();
  if (user && user.role === 'admin') {
    const platSection = document.getElementById('plat');
    if (platSection && !platSection.querySelector('.admin-controls')) {
      const adminControls = document.createElement('div');
      adminControls.className = 'admin-controls';
      adminControls.innerHTML = `
        <button class="btn btn-edit" onclick="modifierMenu()">✏️ Modifier</button>
        <button class="btn btn-delete" onclick="supprimerMenu()">🗑️ Supprimer</button>
      `;
      platSection.appendChild(adminControls);
    }
  }
}

// Modifier le menu (redirection vers admin avec date actuelle)
function modifierMenu() {
  const menuData = JSON.parse(localStorage.getItem('orif_menu_data') || '{}');
  if (menuData.today && menuData.today.date) {
    window.location.href = `admin.html?date=${menuData.today.date}`;
  } else {
    window.location.href = 'admin.html';
  }
}

// Supprimer le menu
function supprimerMenu() {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce menu ? Cette action est irréversible.')) {
    const menuData = { today: null, archive: [] };
    localStorage.setItem('orif_menu_data', JSON.stringify(menuData));
    
    // Supprimer aussi de l'historique
    const history = JSON.parse(localStorage.getItem('orif_menu_history') || '[]');
    const today = new Date().toISOString().slice(0, 10);
    const filteredHistory = history.filter(item => item.date !== today);
    localStorage.setItem('orif_menu_history', JSON.stringify(filteredHistory));
    
    alert('Menu supprimé avec succès.');
    location.reload();
  }
}

// Rendre les fonctions accessibles globalement
window.login = login;
window.logout = logout;
window.currentUser = currentUser;
window.renderAccountArea = renderAccountArea;
window.chargerMenuDuJour = chargerMenuDuJour;
window.modifierMenu = modifierMenu;
window.supprimerMenu = supprimerMenu;