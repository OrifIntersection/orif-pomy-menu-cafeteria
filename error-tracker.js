/**
 * Système de surveillance et diagnostic d'erreurs pour ORIF
 * Détecte automatiquement les erreurs JavaScript et problèmes de système
 */

class ORIFErrorTracker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.functionTests = [];
    this.isTracking = false;
    
    this.init();
  }

  init() {
    this.setupErrorListeners();
    this.trackConsoleErrors();
    this.performSystemCheck();
    
    console.log('🔍 ORIF Error Tracker initialisé');
  }

  setupErrorListeners() {
    // Capturer les erreurs JavaScript
    window.addEventListener('error', (e) => {
      this.logError({
        type: 'JavaScript Error',
        message: e.message,
        file: e.filename,
        line: e.lineno,
        column: e.colno,
        timestamp: new Date().toISOString()
      });
    });

    // Capturer les erreurs de promesses
    window.addEventListener('unhandledrejection', (e) => {
      this.logError({
        type: 'Unhandled Promise Rejection',
        message: e.reason,
        timestamp: new Date().toISOString()
      });
    });
  }

  trackConsoleErrors() {
    // Sauvegarder les méthodes console originales
    const originalError = console.error;
    const originalWarn = console.warn;

    // Intercepter console.error
    console.error = (...args) => {
      this.logError({
        type: 'Console Error',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      });
      originalError.apply(console, args);
    };

    // Intercepter console.warn
    console.warn = (...args) => {
      this.logWarning({
        type: 'Console Warning',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      });
      originalWarn.apply(console, args);
    };
  }

  logError(error) {
    this.errors.push(error);
    console.log('🚨 Erreur détectée:', error);
    
    // Limite le nombre d'erreurs stockées
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }
  }

  logWarning(warning) {
    this.warnings.push(warning);
    console.log('⚠️ Avertissement:', warning);
    
    if (this.warnings.length > 50) {
      this.warnings = this.warnings.slice(-50);
    }
  }

  performSystemCheck() {
    const checks = [
      this.checkAuthSystem,
      this.checkMenuSystem,
      this.checkRatingSystem,
      this.checkLocalStorage,
      this.checkDOMElements,
      this.checkJavaScriptFiles
    ];

    checks.forEach(check => {
      try {
        check.call(this);
      } catch (e) {
        this.logError({
          type: 'System Check Error',
          message: `Erreur lors du test ${check.name}: ${e.message}`,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  checkAuthSystem() {
    const result = {
      name: 'Système Authentification',
      status: 'unknown',
      details: []
    };

    try {
      // Test existence fonction currentUser
      if (typeof currentUser === 'function') {
        result.details.push('✅ Fonction currentUser disponible');
        
        const user = currentUser();
        if (user) {
          result.details.push(`✅ Utilisateur connecté: ${user.name} (${user.role})`);
          result.status = 'success';
        } else {
          result.details.push('⚠️ Aucun utilisateur connecté');
          result.status = 'warning';
        }
      } else {
        result.details.push('❌ Fonction currentUser manquante');
        result.status = 'error';
      }

      // Test fonction renderAccountArea
      if (typeof renderAccountArea === 'function') {
        result.details.push('✅ Fonction renderAccountArea disponible');
      } else {
        result.details.push('❌ Fonction renderAccountArea manquante');
        result.status = 'error';
      }

    } catch (e) {
      result.details.push(`❌ Erreur: ${e.message}`);
      result.status = 'error';
    }

    this.functionTests.push(result);
  }

  checkMenuSystem() {
    const result = {
      name: 'Système Gestion Menus',
      status: 'unknown',
      details: []
    };

    try {
      // Test fonction chargerMenuDuJour
      if (typeof chargerMenuDuJour === 'function') {
        result.details.push('✅ Fonction chargerMenuDuJour disponible');
        result.status = 'success';
      } else {
        result.details.push('❌ Fonction chargerMenuDuJour manquante');
        result.status = 'error';
      }

      // Test fonction saveMenu (admin)
      if (typeof saveMenu === 'function') {
        result.details.push('✅ Fonction saveMenu (admin) disponible');
      } else {
        result.details.push('⚠️ Fonction saveMenu non accessible (normal si pas admin)');
      }

      // Test historique des menus
      const menuHistory = JSON.parse(localStorage.getItem('orif_menu_history') || '[]');
      result.details.push(`📊 Menus en historique: ${menuHistory.length}`);

    } catch (e) {
      result.details.push(`❌ Erreur: ${e.message}`);
      result.status = 'error';
    }

    this.functionTests.push(result);
  }

  checkRatingSystem() {
    const result = {
      name: 'Système Avis',
      status: 'unknown',
      details: []
    };

    try {
      // Test fonction ajouterAvis
      if (typeof window.ajouterAvis === 'function') {
        result.details.push('✅ Fonction ajouterAvis disponible');
        result.status = 'success';
      } else {
        result.details.push('❌ Fonction ajouterAvis manquante');
        result.status = 'error';
      }

      // Test fonction chargerAvis
      if (typeof window.chargerAvis === 'function') {
        result.details.push('✅ Fonction chargerAvis disponible');
      } else {
        result.details.push('❌ Fonction chargerAvis manquante');
        result.status = 'error';
      }

      // Test bouton popup avis
      const ratingBtn = document.getElementById('open-rating-popup');
      if (ratingBtn) {
        result.details.push('✅ Bouton "Donner mon avis" trouvé');
      } else {
        result.details.push('❌ Bouton "Donner mon avis" introuvable');
        result.status = 'error';
      }

      // Test avis stockés
      const reviews = JSON.parse(localStorage.getItem('orif_reviews') || '[]');
      result.details.push(`📊 Avis stockés: ${reviews.length}`);

    } catch (e) {
      result.details.push(`❌ Erreur: ${e.message}`);
      result.status = 'error';
    }

    this.functionTests.push(result);
  }

  checkLocalStorage() {
    const result = {
      name: 'LocalStorage',
      status: 'unknown',
      details: []
    };

    try {
      // Test accessibilité localStorage
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      result.details.push('✅ LocalStorage accessible');

      // Vérifier les données ORIF
      const keys = ['orif_menu_history', 'orif_reviews', 'orif_chef_info', 'orif_current_user'];
      keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            result.details.push(`✅ ${key}: ${Array.isArray(parsed) ? parsed.length + ' entrées' : 'Configuré'}`);
          } catch {
            result.details.push(`⚠️ ${key}: Données non-JSON`);
          }
        } else {
          result.details.push(`⚠️ ${key}: Vide`);
        }
      });

      result.status = 'success';

    } catch (e) {
      result.details.push(`❌ Erreur localStorage: ${e.message}`);
      result.status = 'error';
    }

    this.functionTests.push(result);
  }

  checkDOMElements() {
    const result = {
      name: 'Éléments DOM Critiques',
      status: 'unknown',
      details: []
    };

    const criticalElements = [
      { id: 'open-rating-popup', name: 'Bouton Donner Avis' },
      { id: 'rating-popup', name: 'Popup Notation' },
      { id: 'account-area', name: 'Zone Compte' },
      { id: 'menu-today', name: 'Section Menu Jour' },
      { id: 'avis-section', name: 'Section Avis' }
    ];

    let foundElements = 0;
    criticalElements.forEach(element => {
      const domElement = document.getElementById(element.id);
      if (domElement) {
        result.details.push(`✅ ${element.name} (#${element.id})`);
        foundElements++;
      } else {
        result.details.push(`❌ ${element.name} (#${element.id}) - INTROUVABLE`);
      }
    });

    result.status = foundElements === criticalElements.length ? 'success' : 
                   foundElements > 0 ? 'warning' : 'error';

    this.functionTests.push(result);
  }

  checkJavaScriptFiles() {
    const result = {
      name: 'Fichiers JavaScript',
      status: 'unknown',
      details: []
    };

    const scripts = Array.from(document.querySelectorAll('script[src]'));
    result.details.push(`📁 Scripts chargés: ${scripts.length}`);

    const expectedScripts = ['app.js', 'admin.js', 'member.js', 'avis-system.js'];
    expectedScripts.forEach(expectedScript => {
      const found = scripts.some(script => script.src.includes(expectedScript));
      if (found) {
        result.details.push(`✅ ${expectedScript}`);
      } else {
        result.details.push(`❌ ${expectedScript} - NON CHARGÉ`);
      }
    });

    result.status = 'success';
    this.functionTests.push(result);
  }

  getReport() {
    return {
      errors: this.errors,
      warnings: this.warnings,
      functionTests: this.functionTests,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        totalTests: this.functionTests.length,
        successfulTests: this.functionTests.filter(t => t.status === 'success').length,
        failedTests: this.functionTests.filter(t => t.status === 'error').length
      }
    };
  }

  exportReport() {
    const report = this.getReport();
    const reportText = JSON.stringify(report, null, 2);
    
    const blob = new Blob([reportText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `orif-diagnostic-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  clearLogs() {
    this.errors = [];
    this.warnings = [];
    console.log('🧹 Logs effacés');
  }
}

// Initialiser le tracker au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
  if (!window.orifErrorTracker) {
    window.orifErrorTracker = new ORIFErrorTracker();
  }
});

// Exporter pour utilisation globale
window.ORIFErrorTracker = ORIFErrorTracker;