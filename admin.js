// Vérification des droits d'accès admin
function requireAdminAccess() {
  const user = currentUser();
  if (!user) {
    alert("Connexion requise pour accéder à cette page.");
    window.location.href = "login.html";
    return false;
  }
  if (user.role !== "admin") {
    alert("Accès réservé aux administrateurs.");
    window.location.href = "index.html";
    return false;
  }
  return true;
}

// Stockage local des menus (démo)
const MENU_KEY = "orif_menu_data";

function getMenuData() {
  try {
    return JSON.parse(localStorage.getItem(MENU_KEY)) || {
      today: null,
      archive: []
    };
  } catch {
    return { today: null, archive: [] };
  }
}

function saveMenuData(data) {
  localStorage.setItem(MENU_KEY, JSON.stringify(data));
  
  // Sauvegarder aussi dans l'historique pour l'agenda
  saveMenuToHistory(data);
}

// Nouvelle fonction pour sauvegarder l'historique des menus pour l'agenda
function saveMenuToHistory(menuData) {
  const HISTORY_KEY = "orif_menu_history";
  let history = [];
  
  try {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    history = [];
  }
  
  if (menuData.today) {
    const todayMenu = {
      date: menuData.today.date,
      platName: menuData.today.plat?.name || "Plat non défini",
      timestamp: new Date().toISOString()
    };
    
    // Éviter les doublons pour la même date
    history = history.filter(item => item.date !== todayMenu.date);
    history.unshift(todayMenu);
    
    // Garder seulement les 30 derniers menus
    history = history.slice(0, 30);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
}

// Fonction pour récupérer l'historique des menus
function getMenuHistory() {
  const HISTORY_KEY = "orif_menu_history";
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

// Conversion d'image en DataURL
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Fonction d'initialisation appelée après vérification de l'accès
function initAdminPage() {
  console.log("Initialisation de la page admin");
  
  // Vérifier si une date spécifique est demandée via URL
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  
  if (dateParam) {
    // Charger le menu pour cette date
    document.getElementById('date').value = dateParam;
    chargerMenuPourDate(dateParam);
  } else {
    // Pré-remplir la date du jour
    document.getElementById('date').value = new Date().toISOString().slice(0,10);
    // Charger les données existantes si on modifie un menu
    chargerMenuExistant();
  }

  // Gestion de l'aperçu de l'image
  const fileInput = document.getElementById('platImg');
  const imgPreview = document.getElementById('imgPreview');
  const imgTag = document.getElementById('imgTag');
  let imgDataURL = '';

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) {
      imgDataURL = '';
      imgPreview.style.display = 'none';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      imgDataURL = e.target.result;
      imgTag.src = imgDataURL;
      imgPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  // Gestion du formulaire de menu
  const form = document.getElementById('menu-form');
  if (!form) {
    console.error('Formulaire menu-form non trouvé');
    return;
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Formulaire soumis, début du traitement...');

    const date = document.getElementById('date').value;
    const platName = document.getElementById('platName').value.trim();
    const platDesc = document.getElementById('platDesc').value.trim();
    const platVeg = document.getElementById('platVeg').checked;
    
    console.log('Données collectées:', { date, platName, platDesc, platVeg });

    const platAllergens = [...document.querySelectorAll('.a-plat:checked')].map(c => c.value);
    const dessertText = document.getElementById('dessertText').value.trim();
    const dessertAllergens = [...document.querySelectorAll('.a-dessert:checked')].map(c => c.value);

    const selfItems = document.getElementById('selfItems').value
      .split('\n').map(s => s.trim()).filter(Boolean);
    const saladItems = document.getElementById('saladItems').value
      .split('\n').map(s => s.trim()).filter(Boolean);
    const vegText = document.getElementById('vegText').value.trim();

    // Créer l'objet menu
    const menuData = getMenuData();
    
    menuData.today = {
      date: date,
      plat: {
        name: platName,
        description: platDesc,
        img: imgDataURL || 'plat_jour.jpg',
        veg: platVeg,
        allergens: platAllergens
      },
      dessert: {
        text: dessertText,
        allergens: dessertAllergens
      },
      self: selfItems,
      saladbar: saladItems,
      vegetarien: vegText,
      avis: menuData.today?.avis || []
    };

    try {
      // Ajouter à l'historique AVANT de sauvegarder
      const historyItem = {
        id: Date.now(),
        date: date,
        platName: platName,
        platDesc: platDesc,
        platImg: imgDataURL || 'plat_jour.jpg',
        platVeg: platVeg,
        platAllergens: platAllergens,
        dessertText: dessertText,
        dessertAllergens: dessertAllergens,
        selfItems: selfItems,
        saladItems: saladItems,
        vegText: vegText,
        timestamp: new Date().toISOString()
      };

      console.log('Ajout à l\u0027historique:', historyItem);
      
      const history = getMenuHistory();
      console.log('Historique actuel:', history);
      
      // Supprimer l'ancien menu pour cette date s'il existe
      const filteredHistory = history.filter(item => item.date !== date);
      filteredHistory.unshift(historyItem);
      localStorage.setItem('orif_menu_history', JSON.stringify(filteredHistory));
      
      console.log('Nouvel historique:', JSON.parse(localStorage.getItem('orif_menu_history')));

      // Sauvegarder
      console.log('Sauvegarde des données menu:', menuData);
      saveMenuData(menuData);
      console.log('Données sauvegardées avec succès');
      
      // Message de confirmation détaillé
      const formatDate = new Date(date).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const confirmationMessage = '✅ Menu enregistré avec succès !\n\n📅 Date : ' + formatDate + '\n🍽️ Plat : ' + platName + '\n📝 Description : ' + (platDesc || 'Aucune description') + '\n\nLe menu apparaît maintenant dans l\u0027agenda de la page principale.\nConsultez la page publique pour voir les modifications.';
      
      console.log('Affichage du message de confirmation');
      
      // Afficher une popup de confirmation stylée
      showConfirmationPopup(confirmationMessage, () => {
        // Demander si l'utilisateur veut voir la page principale
        if (confirm('Voulez-vous voir le résultat sur la page principale ?')) {
          window.location.href = 'index.html';
        }
      });
      // Actualiser l'affichage du menu
      updateMenuStatus();
      resetForm();
    } catch (error) {
      console.error('Erreur lors de l\u0027enregistrement:', error);
      alert('❌ Erreur lors de l\u0027enregistrement du menu. Veuillez réessayer.');
    }
  });
}

// Popup de confirmation stylée
function showConfirmationPopup(message, callback) {
  // Créer l'overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
    background: rgba(0,0,0,0.7); z-index: 10000; display: flex; 
    justify-content: center; align-items: center;
  `;
  
  // Créer la popup
  const popup = document.createElement('div');
  popup.style.cssText = `
    background: #424549; border-radius: 12px; padding: 2rem; 
    max-width: 500px; margin: 1rem; color: white; text-align: center; 
    box-shadow: 0 4px 25px rgba(0,0,0,0.5);
  `;
  
  popup.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
    <h3 style="margin: 0 0 1rem 0; color: #4CAF50;">Menu enregistré avec succès !</h3>
    <p style="line-height: 1.6; margin-bottom: 2rem;">${message.replace(/\n/g, '<br>')}</p>
    <button onclick="this.closest('.overlay').remove(); if(window.confirmCallback) window.confirmCallback();" style="
      background: #7289da; color: white; border: none; padding: 0.8rem 2rem; 
      border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1rem;
    ">Fermer</button>
  `;
  
  overlay.className = 'overlay';
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  
  // Stocker le callback
  window.confirmCallback = callback;
  
  // Fermer avec Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      if (callback) callback();
      window.confirmCallback = null;
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

function updateMenuStatus() {
  const today = formatTodaysDate();
  const menuData = getMenuData();
  
  const dateDisplay = document.getElementById('date-display');
  const menuStatus = document.getElementById('menu-status');
  
  if (dateDisplay) {
    dateDisplay.textContent = new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  if (menuStatus) {
    if (menuData.today && menuData.today.date === today) {
      menuStatus.textContent = `📅 Menu publié pour aujourd'hui : ${menuData.today.plat.name}`;
      menuStatus.style.color = '#4CAF50';
    } else {
      menuStatus.textContent = '📝 Aucun menu publié pour aujourd\'hui';
      menuStatus.style.color = '#FFA726';
    }
  }
}

function resetForm() {
  const form = document.getElementById('menu-form');
  if (form) {
    form.reset();
    
    // Remettre la date à aujourd'hui
    const dateInput = document.getElementById('date');
    if (dateInput) {
      dateInput.value = formatTodaysDate();
    }
    
    // Vider l'aperçu image
    const imgPreview = document.getElementById('imgPreview');
    if (imgPreview) {
      imgPreview.style.display = 'none';
    }
    
    imgDataURL = null;
  }
}

// Charger le menu existant pour modification
function chargerMenuExistant() {
  const menuData = getMenuData();
  if (menuData.today) {
    // Remplir le formulaire avec les données existantes
    const dateField = document.getElementById('date');
    const platNameField = document.getElementById('platName');
    const platDescField = document.getElementById('platDesc');
    const platVegField = document.getElementById('platVeg');
    const dessertTextField = document.getElementById('dessertText');
    const selfItemsField = document.getElementById('selfItems');
    const saladItemsField = document.getElementById('saladItems');
    const vegTextField = document.getElementById('vegText');
    
    if (dateField) dateField.value = menuData.today.date || '';
    if (platNameField) platNameField.value = menuData.today.plat?.name || '';
    if (platDescField) platDescField.value = menuData.today.plat?.description || '';
    if (platVegField) platVegField.checked = menuData.today.plat?.veg || false;
    if (dessertTextField) dessertTextField.value = menuData.today.dessert?.text || '';
    if (selfItemsField && menuData.today.self) {
      selfItemsField.value = menuData.today.self.join('\n');
    }
    if (saladItemsField && menuData.today.saladbar) {
      saladItemsField.value = menuData.today.saladbar.join('\n');
    }
    if (vegTextField) vegTextField.value = menuData.today.vegetarien || '';
    
    // Cocher les allergènes existants
    if (menuData.today.plat?.allergens) {
      menuData.today.plat.allergens.forEach(allergen => {
        const checkbox = document.querySelector(`.a-plat[value="${allergen}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
    
    if (menuData.today.dessert?.allergens) {
      menuData.today.dessert.allergens.forEach(allergen => {
        const checkbox = document.querySelector(`.a-dessert[value="${allergen}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
  }
}

// Charger un menu spécifique pour une date (depuis l'historique)
function chargerMenuPourDate(date) {
  const history = JSON.parse(localStorage.getItem('orif_menu_history') || '[]');
  const menuPourDate = history.find(menu => menu.date === date);
  
  if (menuPourDate) {
    // Remplir le formulaire avec les données de ce menu
    const dateField = document.getElementById('date');
    const platNameField = document.getElementById('platName');
    const platDescField = document.getElementById('platDesc');
    const platVegField = document.getElementById('platVeg');
    const dessertTextField = document.getElementById('dessertText');
    const selfItemsField = document.getElementById('selfItems');
    const saladItemsField = document.getElementById('saladItems');
    const vegTextField = document.getElementById('vegText');
    
    if (dateField) dateField.value = menuPourDate.date;
    if (platNameField) platNameField.value = menuPourDate.platName || '';
    if (platDescField) platDescField.value = menuPourDate.platDesc || '';
    if (platVegField) platVegField.checked = menuPourDate.platVeg || false;
    if (dessertTextField) dessertTextField.value = menuPourDate.dessertText || '';
    if (selfItemsField && menuPourDate.selfItems) {
      selfItemsField.value = menuPourDate.selfItems.join('\n');
    }
    if (saladItemsField && menuPourDate.saladItems) {
      saladItemsField.value = menuPourDate.saladItems.join('\n');
    }
    if (vegTextField) vegTextField.value = menuPourDate.vegText || '';
    
    // Cocher les allergènes existants
    if (menuPourDate.platAllergens) {
      menuPourDate.platAllergens.forEach(allergen => {
        const checkbox = document.querySelector(`.a-plat[value="${allergen}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
    
    if (menuPourDate.dessertAllergens) {
      menuPourDate.dessertAllergens.forEach(allergen => {
        const checkbox = document.querySelector(`.a-dessert[value="${allergen}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
    
    console.log('Menu chargé pour modification:', menuPourDate);
  }
}

// Rendre les fonctions accessibles globalement
window.requireAdminAccess = requireAdminAccess;
window.getMenuData = getMenuData;
window.saveMenuData = saveMenuData;
window.getMenuHistory = getMenuHistory;
window.initAdminPage = initAdminPage;
window.chargerMenuExistant = chargerMenuExistant;
window.chargerMenuPourDate = chargerMenuPourDate;

// ===== GESTION DU CHEF =====
function chargerInfoChef() {
  const chefInfo = JSON.parse(localStorage.getItem('orif_chef_info') || '{}');
  const chef = {
    nom: chefInfo.nom || "Monsieur Philippe Etchebest",
    description: chefInfo.description || "Chef passionné par la cuisine du monde et la valorisation des produits locaux. Présent à l'ORIF depuis 8 ans.",
    photo: chefInfo.photo || "Philippe_Etchebest.jpg"
  };
  
  const nomField = document.getElementById('chef-nom');
  const descField = document.getElementById('chef-description');
  const photoField = document.getElementById('chef-photo');
  
  if (nomField) nomField.value = chef.nom;
  if (descField) descField.value = chef.description;
  if (photoField) photoField.value = chef.photo;
  
  mettreAJourPreviewChef();
}

function mettreAJourPreviewChef() {
  const nom = document.getElementById('chef-nom')?.value || "Monsieur Philippe Etchebest";
  const description = document.getElementById('chef-description')?.value || "Description...";
  const photo = document.getElementById('chef-photo')?.value || "Philippe_Etchebest.jpg";
  
  const previewNom = document.getElementById('chef-preview-nom');
  const previewDesc = document.getElementById('chef-preview-desc');
  const previewImg = document.getElementById('chef-preview-img');
  
  if (previewNom) previewNom.textContent = nom;
  if (previewDesc) previewDesc.textContent = description;
  if (previewImg) previewImg.src = photo;
}

function enregistrerChef() {
  const nom = document.getElementById('chef-nom')?.value.trim();
  const description = document.getElementById('chef-description')?.value.trim();
  const photo = document.getElementById('chef-photo')?.value;
  
  if (!nom || !description) {
    alert('Veuillez remplir le nom et la description du chef.');
    return false;
  }
  
  const chefInfo = { nom, description, photo };
  
  try {
    localStorage.setItem('orif_chef_info', JSON.stringify(chefInfo));
    console.log('✅ Chef enregistré:', chefInfo);
    
    alert('👨‍🍳 Chef "' + nom + '" enregistré avec succès !\n\nVa voir la page principale pour voir les modifications.');
    
    return true;
  } catch (e) {
    console.error('❌ Erreur sauvegarde chef:', e);
    alert('Erreur lors de la sauvegarde du chef: ' + e.message);
    return false;
  }
}

function genererPhotoChef() {
  const nom = document.getElementById('chef-nom')?.value || 'Chef professionnel';
  alert('Génération d\u0027une photo pour "' + nom + '" (fonctionnalité à implémenter avec l\u0027IA)');
}

// Initialisation chef
// Fonctions utilitaires pour la modification
function afficherDateActuelle() {
  const dateDisplay = document.getElementById('date-display');
  const menuStatus = document.getElementById('menu-status');
  
  if (dateDisplay) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    dateDisplay.textContent = '📅 ' + dateStr;
    
    // Vérifier s'il y a déjà un menu pour aujourd'hui
    const menuData = getMenuData();
    const todayISO = today.toISOString().slice(0, 10);
    
    if (menuStatus) {
      if (menuData.today && menuData.today.date === todayISO) {
        menuStatus.innerHTML = '✅ Menu existant : "' + menuData.today.platName + '"';
      } else {
        menuStatus.innerHTML = '⚠️ Aucun menu pour cette date';
      }
    }
  }
}

function verifierParametresURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  
  if (dateParam) {
    console.log('Date spécifiée dans URL:', dateParam);
    chargerMenuPourDate(dateParam);
    
    // Mettre à jour l'affichage de la date
    const dateDisplay = document.getElementById('date-display');
    const menuStatus = document.getElementById('menu-status');
    
    if (dateDisplay) {
      const date = new Date(dateParam);
      const dateStr = date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      dateDisplay.textContent = '📅 Modification : ' + dateStr;
    }
    
    if (menuStatus) {
      menuStatus.innerHTML = '🔧 Mode modification activé';
    }
  }
}

function chargerMenuPourDate(dateISO) {
  console.log('Chargement du menu pour:', dateISO);
  
  try {
    const menuData = getMenuData();
    const history = getMenuHistory();
    const menuHistorique = history.find(item => item.date === dateISO);
    
    let menuToLoad = null;
    
    if (menuData.today && menuData.today.date === dateISO) {
      menuToLoad = menuData.today;
    } else if (menuHistorique) {
      menuToLoad = menuHistorique;
    }
    
    if (menuToLoad) {
      remplirFormulaire(menuToLoad);
    } else {
      const dateField = document.getElementById('date');
      if (dateField) dateField.value = dateISO;
    }
    
  } catch (e) {
    console.error('Erreur lors du chargement du menu:', e);
  }
}

function remplirFormulaire(menuData) {
  console.log('Remplissage du formulaire avec:', menuData);
  
  try {
    // Date
    const dateField = document.getElementById('date');
    if (dateField && menuData.date) {
      dateField.value = menuData.date;
    }
    
    // Plat principal
    const platNameField = document.getElementById('platName');
    if (platNameField && menuData.platName) {
      platNameField.value = menuData.platName;
    }
    
    const platDescField = document.getElementById('platDesc');
    if (platDescField && menuData.platDesc) {
      platDescField.value = menuData.platDesc;
    }
    
    const platVegField = document.getElementById('platVeg');
    if (platVegField) {
      platVegField.checked = menuData.platVeg || false;
    }
    
    // Dessert
    const dessertTextField = document.getElementById('dessertText');
    if (dessertTextField && menuData.dessertText) {
      dessertTextField.value = menuData.dessertText;
    }
    
    // Self-service
    const selfItemsField = document.getElementById('selfItems');
    if (selfItemsField && menuData.selfItems) {
      const selfText = menuData.selfItems.map(item => 
        typeof item === 'string' ? item : item.name
      ).join('\n');
      selfItemsField.value = selfText;
    }
    
    // Salades
    const saladItemsField = document.getElementById('saladItems');
    if (saladItemsField && menuData.saladItems) {
      const saladText = menuData.saladItems.map(item => 
        typeof item === 'string' ? item : item.name
      ).join('\n');
      saladItemsField.value = saladText;
    }
    
    // Végétarien
    const vegTextField = document.getElementById('vegText');
    if (vegTextField && (menuData.vegetarien || menuData.vegText)) {
      vegTextField.value = menuData.vegetarien || menuData.vegText || '';
    }
    
    // Allergènes plat
    if (menuData.platAllergens) {
      menuData.platAllergens.forEach(allergen => {
        const checkbox = document.querySelector(`input.a-plat[value="${allergen}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
    
    // Allergènes dessert  
    if (menuData.dessertAllergens) {
      menuData.dessertAllergens.forEach(allergen => {
        const checkbox = document.querySelector(`input.a-dessert[value="${allergen}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
    
    console.log('Formulaire rempli avec succès');
    
  } catch (e) {
    console.error('Erreur lors du remplissage du formulaire:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialiser l'affichage admin
  renderAccountArea();
  
  // Attendre que le DOM soit prêt avant d'afficher la date
  setTimeout(() => {
    // D'abord vérifier les paramètres URL (priorité sur l'affichage)
    verifierParametresURL();
    // Puis afficher la date actuelle si aucune date spécifique
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('date')) {
      afficherDateActuelle();
      chargerMenuExistant();
    }
  }, 100);
  
  if (document.getElementById('chef-nom')) {
    setTimeout(() => {
      chargerInfoChef();
      
      // Event listeners pour preview
      document.getElementById('chef-nom')?.addEventListener('input', mettreAJourPreviewChef);
      document.getElementById('chef-description')?.addEventListener('input', mettreAJourPreviewChef);
      document.getElementById('chef-photo')?.addEventListener('change', mettreAJourPreviewChef);
    }, 500); // Petit délai pour s'assurer que le DOM est prêt
  }
});

// Fonctions globales chef
window.enregistrerChef = enregistrerChef;
window.genererPhotoChef = genererPhotoChef;
window.chargerInfoChef = chargerInfoChef;