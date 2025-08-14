/********************
 *  AUTH (démo)
 ********************/
const USERS = {
  "ayesh.admin@orif.ch": { role: "admin",  password: "0000", name: "Ayesh Admin"  },
  "ayesh.benef@orif.ch": { role: "member", password: "0000", name: "Ayesh Benef" }
};

const USER_KEY = "orifUser";
const DATA_KEY = "orif_menu_local"; // une seule clé locale pour les menus

function login(email, password) {
  const u = USERS[email?.toLowerCase()];
  if (!u || u.password !== password) return null;
  const session = { email: email.toLowerCase(), role: u.role, name: u.name };
  localStorage.setItem(USER_KEY, JSON.stringify(session));
  return session;
}

function currentUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); }
  catch { return null; }
}

function logout() {
  localStorage.removeItem(USER_KEY);
}

/** Construit un href qui marche en file:// et http(s) */
function href(path) {
  const clean = String(path || "").replace(/^\//, "");
  if (location.protocol === "file:") {
    const base = location.pathname.replace(/[^/]+$/, "");
    return base + clean;
  }
  return "/" + clean;
}

/** Exige une connexion ; redirige vers login.html?redirect=<retour> */
function requireLogin(redirectTo = href("index.html")) {
  const url = new URL(href("login.html"), location.href);
  url.searchParams.set("redirect", redirectTo);
  window.location.href = url.toString();
  return false;
}

/** Exige un rôle (admin par défaut) — FIX: retiré la parenthèse en trop */
function requireRole(role = "admin", redirectTo = href("admin.html")) {
  const u = currentUser();
  if (!u) return requireLogin(redirectTo);
  if (u.role !== role) {
    alert("Accès réservé à l'administrateur.");
    window.location.href = href("index.html");
    return false;
  }
  return true;
}

/** Zone compte dans le header (affichage dynamique) */
function renderAccountArea() {
  const box = document.getElementById("account-area");
  if (!box) return;
  const u = currentUser();

  if (!u) {
    const back = location.pathname; // fonctionne en file:// aussi
    box.innerHTML = `
      <a class="btn" href="${href('login.html') + '?redirect=' + encodeURIComponent(back)}">Se connecter</a>
    `;
    return;
  }

  const isAdmin = u.role === "admin";
  box.innerHTML = `
    <span class="user-chip">${u.email} (${u.role})</span>
    ${isAdmin ? `<a class="btn" href="${href('admin.html')}">Admin</a>` : ""}
    <button id="btn-logout" class="btn btn-outline">Se déconnecter</button>
  `;
  document.getElementById("btn-logout").addEventListener("click", () => {
    logout();
    window.location.href = href("index.html");
  });
}

/********************
 *  DONNÉES (démo)
 ********************/

/** Charge le JSON de base (public/data/menus.json). En file://, fetch peut échouer : on protège. */
async function loadBaseData() {
  try {
    const res = await fetch(href("public/data/menus.json"), { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    return await res.json();
  } catch {
    // fallback minimal
    return { today: null, archive: [] };
  }
}

/** Charge l’overlay local (ce que l’admin modifie) */
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(DATA_KEY)) || null; }
  catch { return null; }
}

/** Sauvegarde l’overlay local */
function saveLocal(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

/** Fusionne base + overlay local (overlay prioritaire) */
async function getData() {
  const base = await loadBaseData();     // { today, archive }
  const local = loadLocal();             // { today, archive }
  if (!local) return base;

  return {
    today: local.today ?? base.today ?? null,
    archive: Array.isArray(local.archive) ? local.archive
          : Array.isArray(base.archive) ? base.archive
          : []
  };
}

/** Ajoute un avis pour une date ISO (stocké en local uniquement) */
function addAvis(dateISO, avis) {
  const data = loadLocal() || { today: null, archive: [] };

  if (data.today?.date === dateISO) {
    data.today.avis ??= [];
    data.today.avis.push(avis);
  } else {
    data.archive ??= [];
    const existing = data.archive.find(x => x.date === dateISO);
    if (existing) {
      existing.avis ??= [];
      existing.avis.push(avis);
    } else {
      data.archive.push({ date: dateISO, avis: [avis] });
    }
  }
  saveLocal(data);
}

/** Met à jour la section "today" (overlay local) */
function updateToday(payload) {
  const data = loadLocal() || { today: null, archive: [] };
  data.today = { ...(data.today || {}), ...payload };
  saveLocal(data);
}

/** Convertit un fichier image en DataURL (pour la démo) */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/** Sauvegarde complète du menu du jour (démo : dans localStorage) */
async function saveMenuToday(payload) {
  // payload attendu :
  // { date, platName, platDesc, platImg, platVeg, platAllergens[], dessertText, dessertAllergens[], selfItems[], saladItems[] }
  const base = await getData(); // pour conserver les avis existants
  const local = loadLocal() || { today: null, archive: [] };

  local.today = {
    date: payload.date,
    plat: {
      name: payload.platName || "",
      description: payload.platDesc || "",
      img: payload.platImg || "",     // DataURL en démo
      veg: !!payload.platVeg,
      allergens: payload.platAllergens || []
    },
    dessert: {
      text: payload.dessertText || "",
      allergens: payload.dessertAllergens || []
    },
    self: payload.selfItems || [],
    saladbar: payload.saladItems || [],
    avis: base.today?.avis || []      // on conserve les avis existants
  };

  saveLocal(local);
  return local.today;
}

/********************
 *  Exposition globale (débogage / appels inline)
 ********************/
window.login = login;
window.logout = logout;
window.currentUser = currentUser;
window.href = href;
window.requireLogin = requireLogin;
window.requireRole = requireRole;
window.renderAccountArea = renderAccountArea;

window.getData = getData;
window.addAvis = addAvis;
window.updateToday = updateToday;
window.fileToDataURL = fileToDataURL;
window.saveMenuToday = saveMenuToday;
