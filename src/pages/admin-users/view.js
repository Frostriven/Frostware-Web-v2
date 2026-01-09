import { auth, db } from '../../js/firebase.js';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where
} from 'firebase/firestore';
import { isUserAdmin, isAdminEmail } from '../../js/userProfile.js';

export async function renderAdminUsersView() {
  const root = document.getElementById('spa-root');
  if (!root) return;

  // Check authentication and admin access
  if (!auth?.currentUser) {
    window.location.hash = '#/auth';
    return;
  }

  const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);
  if (!userIsAdmin) {
    window.location.hash = '#/admin';
    return;
  }

  root.innerHTML = await renderUsersManagementPage();
  await initializeUsersManagement();
  injectStyles();
}

async function renderUsersManagementPage() {
  return `
    <div class="admin-users-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="breadcrumb">
            <a href="#/admin" class="breadcrumb-link">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6.5 12L2.5 8L6.5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Panel Admin
            </a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">Gestión de Usuarios</span>
          </div>

          <div class="header-title-section">
            <div class="logo-mark">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="8" fill="url(#logo-gradient)"/>
                <path d="M12 20L20 12L28 20L20 28L12 20Z" fill="white" fill-opacity="0.9"/>
                <defs>
                  <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40">
                    <stop stop-color="#22a7d0"/>
                    <stop offset="1" stop-color="#1a8fb8"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div class="title-group">
              <h1 class="page-title">Gestión de Usuarios</h1>
              <p class="page-subtitle">Administra usuarios, productos y bases de datos de preguntas</p>
            </div>
          </div>

          <div class="header-actions">
            <button class="btn-icon" id="refresh-users" title="Recargar">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C11.5719 3 13.0239 3.52375 14.1922 4.41753" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M14 3V5.5H11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="btn-primary" id="new-user-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 5V15M5 10H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Nuevo Usuario
            </button>
          </div>
        </div>
      </header>

      <!-- Search and Filters -->
      <section class="filters-section">
        <div class="search-box">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12.5 12.5L16.5 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            type="text"
            id="search-users"
            placeholder="Buscar por nombre, email o empresa..."
            autocomplete="off"
          />
        </div>

        <div class="filter-group">
          <div class="filter-item">
            <label>Rol</label>
            <select id="filter-role">
              <option value="all">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="user">Usuarios</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Estado</label>
            <select id="filter-status">
              <option value="all">Todos los estados</option>
              <option value="active">Suscripción activa</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          <button class="btn-ghost" id="clear-filters">
            Limpiar filtros
          </button>
        </div>
      </section>

      <!-- Users Table -->
      <section class="users-table-section">
        <div class="table-header">
          <div class="results-count" id="results-count">
            Cargando usuarios...
          </div>
        </div>

        <div class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th class="col-user">Usuario</th>
                <th class="col-role">Rol</th>
                <th class="col-products">Productos</th>
                <th class="col-activity">Última Actividad</th>
                <th class="col-subscription">Suscripción</th>
                <th class="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              <!-- Users loaded here -->
            </tbody>
          </table>
        </div>
      </section>

      <!-- User Details Slide Panel -->
      <aside class="slide-panel" id="user-details-panel">
        <div class="slide-panel-overlay"></div>
        <div class="slide-panel-content">
          <div class="panel-header">
            <button class="panel-close" id="close-user-panel">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="panel-title">
              <div class="user-avatar-large" id="panel-user-avatar">U</div>
              <div>
                <h2 id="panel-user-name">Usuario</h2>
                <p id="panel-user-email">email@example.com</p>
              </div>
            </div>
          </div>

          <div class="panel-body" id="user-panel-body">
            <!-- Dynamic content loaded here -->
          </div>
        </div>
      </aside>

      <!-- Questions Management Modal -->
      <div class="modal" id="questions-modal">
        <div class="modal-overlay"></div>
        <div class="modal-content modal-large">
          <div class="modal-header">
            <div>
              <h2 class="modal-title" id="questions-modal-title">Gestión de Preguntas</h2>
              <p class="modal-subtitle" id="questions-modal-subtitle">Producto • Usuario</p>
            </div>
            <button class="modal-close" id="close-questions-modal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-tabs">
            <button class="tab-btn active" data-tab="database">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M17 5C17 6.65685 13.866 8 10 8C6.13401 8 3 6.65685 3 5M17 5C17 3.34315 13.866 2 10 2C6.13401 2 3 3.34315 3 5M17 5V15C17 16.6569 13.866 18 10 18C6.13401 18 3 16.6569 3 15V5" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              Base de Datos
            </button>
            <button class="tab-btn" data-tab="add">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 5V15M5 10H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Agregar Preguntas
            </button>
          </div>

          <div class="modal-body">
            <!-- Database Tab -->
            <div class="tab-content active" id="tab-database">
              <div class="form-group">
                <label class="form-label">ID de Base de Datos</label>
                <input
                  type="text"
                  class="form-input"
                  id="database-id-input"
                  placeholder="ej: nat-ops-questions"
                />
                <p class="form-hint">Identificador único para la colección de preguntas en Firebase</p>
              </div>

              <div class="stats-row">
                <div class="stat-card stat-primary">
                  <div class="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div class="stat-content">
                    <p class="stat-label">Preguntas Actuales</p>
                    <p class="stat-value" id="current-questions-db">-</p>
                  </div>
                </div>
              </div>

              <div class="questions-list-section">
                <h3 class="section-title">Preguntas en la Base de Datos</h3>
                <div class="questions-list" id="questions-preview">
                  <!-- Questions loaded here -->
                </div>
              </div>
            </div>

            <!-- Add Questions Tab -->
            <div class="tab-content" id="tab-add">
              <div class="info-banner">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M10 14V10M10 7H10.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <div>
                  <p class="banner-title">Formato del JSON de preguntas</p>
                  <p class="banner-text">El JSON debe ser un array con objetos que contengan: <code>question</code>, <code>options</code> (array), <code>correctAnswer</code> (índice), <code>topic</code>, <code>explanation</code> (opcional)</p>
                </div>
              </div>

              <div class="stats-row">
                <div class="stat-card">
                  <p class="stat-label">Actuales en DB</p>
                  <p class="stat-value stat-value-accent" id="current-questions-count">-</p>
                </div>
                <div class="stat-card">
                  <p class="stat-label">Detectadas en JSON</p>
                  <p class="stat-value stat-value-success" id="detected-questions-count">-</p>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">JSON de Preguntas</label>
                <textarea
                  id="questions-json-textarea"
                  class="form-textarea code-textarea"
                  rows="12"
                  placeholder='[{"question": "¿Pregunta?", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "topic": "Tema"}]'
                ></textarea>
              </div>

              <div id="validation-message" class="validation-message"></div>

              <div class="action-buttons">
                <button class="btn-secondary btn-lg" id="process-json-btn">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M16 5L7.5 13.5L4 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Procesar JSON
                </button>
                <button class="btn-success btn-lg" id="insert-firebase-btn" disabled>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4V16M10 4L6 8M10 4L14 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Insertar a Firebase
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast Notifications -->
      <div class="toast-container" id="toast-container"></div>
    </div>
  `;
}

// Initialize page functionality
async function initializeUsersManagement() {
  await loadAllUsers();
  initializeFilters();
  initializeUserPanel();
  initializeQuestionsModal();
}

// Load users from Firebase
let allUsers = [];
let filteredUsers = [];

async function loadAllUsers() {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    allUsers = [];
    for (const userDoc of snapshot.docs) {
      try {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Get purchased products with error handling
        let productsSnap = { size: 0, docs: [] };
        try {
          const productsRef = collection(db, 'users', userId, 'purchasedProducts');
          productsSnap = await getDocs(productsRef);
        } catch (prodError) {
          console.warn(`Could not load products for user ${userId}:`, prodError);
        }

        allUsers.push({
          id: userId,
          ...userData,
          productsCount: productsSnap.size,
          products: productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        });
      } catch (userError) {
        console.error(`Error processing user ${userDoc.id}:`, userError);
      }
    }

    filteredUsers = [...allUsers];
    renderUsersTable();
    updateResultsCount();
  } catch (error) {
    console.error('Error loading users:', error);
    showToast('Error al cargar usuarios: ' + error.message, 'error');
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('users-table-body');

  if (filteredUsers.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-state">
        <td colspan="6">
          <div class="empty-state-content">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" opacity="0.2"/>
              <path d="M24 16V24M24 28H24.02" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p>No se encontraron usuarios</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredUsers.map(user => {
    const isAdmin = user.isAdmin || user.role === 'admin';
    const hasActiveSubscription = user.products?.some(p => p.status === 'active');
    const lastActivity = user.updatedAt?.toDate?.() || user.createdAt?.toDate?.() || new Date();

    return `
      <tr class="user-row" data-user-id="${user.id}">
        <td class="col-user">
          <div class="user-cell">
            <div class="user-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
            <div class="user-info">
              <p class="user-name">${user.name || 'Sin nombre'}</p>
              <p class="user-email">${user.email || user.id}</p>
              ${user.company ? `<p class="user-company">${user.company}</p>` : ''}
            </div>
          </div>
        </td>
        <td class="col-role">
          <span class="badge ${isAdmin ? 'badge-admin' : 'badge-user'}">
            ${isAdmin ? 'Admin' : 'Usuario'}
          </span>
        </td>
        <td class="col-products">
          <span class="badge badge-count">${user.productsCount || 0}</span>
        </td>
        <td class="col-activity">
          <span class="activity-date">${formatRelativeTime(lastActivity)}</span>
        </td>
        <td class="col-subscription">
          <span class="status-indicator ${hasActiveSubscription ? 'status-active' : 'status-inactive'}">
            ${hasActiveSubscription ? 'Activa' : 'Inactiva'}
          </span>
        </td>
        <td class="col-actions">
          <button class="btn-icon-sm" onclick="window.viewUserDetails('${user.id}')" title="Ver detalles">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 5.5C9.38071 5.5 10.5 6.61929 10.5 8C10.5 9.38071 9.38071 10.5 8 10.5C6.61929 10.5 5.5 9.38071 5.5 8C5.5 6.61929 6.61929 5.5 8 5.5Z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M14 8C14 8 11.5 12 8 12C4.5 12 2 8 2 8C2 8 4.5 4 8 4C11.5 4 14 8 14 8Z" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateResultsCount() {
  const countEl = document.getElementById('results-count');
  countEl.textContent = `${filteredUsers.length} usuario${filteredUsers.length !== 1 ? 's' : ''} encontrado${filteredUsers.length !== 1 ? 's' : ''}`;
}

// Filters
function initializeFilters() {
  const searchInput = document.getElementById('search-users');
  const roleFilter = document.getElementById('filter-role');
  const statusFilter = document.getElementById('filter-status');
  const clearBtn = document.getElementById('clear-filters');
  const refreshBtn = document.getElementById('refresh-users');

  searchInput.addEventListener('input', applyFilters);
  roleFilter.addEventListener('change', applyFilters);
  statusFilter.addEventListener('change', applyFilters);

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    roleFilter.value = 'all';
    statusFilter.value = 'all';
    applyFilters();
  });

  refreshBtn.addEventListener('click', loadAllUsers);

  // New user button
  const newUserBtn = document.getElementById('new-user-btn');
  newUserBtn.addEventListener('click', () => {
    window.location.hash = '#/admin/user/new';
  });
}

function applyFilters() {
  const searchTerm = document.getElementById('search-users').value.toLowerCase();
  const roleFilter = document.getElementById('filter-role').value;
  const statusFilter = document.getElementById('filter-status').value;

  filteredUsers = allUsers.filter(user => {
    // Search filter
    const matchesSearch = !searchTerm ||
      user.name?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm) ||
      user.company?.toLowerCase().includes(searchTerm);

    // Role filter
    const isAdmin = user.isAdmin || user.role === 'admin';
    const matchesRole = roleFilter === 'all' ||
      (roleFilter === 'admin' && isAdmin) ||
      (roleFilter === 'user' && !isAdmin);

    // Status filter
    const hasActiveSubscription = user.products?.some(p => p.status === 'active');
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && hasActiveSubscription) ||
      (statusFilter === 'inactive' && !hasActiveSubscription);

    return matchesSearch && matchesRole && matchesStatus;
  });

  renderUsersTable();
  updateResultsCount();
}

// User Details Panel
function initializeUserPanel() {
  const panel = document.getElementById('user-details-panel');
  const closeBtn = document.getElementById('close-user-panel');
  const overlay = panel.querySelector('.slide-panel-overlay');

  closeBtn.addEventListener('click', closeUserPanel);
  overlay.addEventListener('click', closeUserPanel);

  // Make viewUserDetails global
  window.viewUserDetails = viewUserDetails;
}

async function viewUserDetails(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;

  const panel = document.getElementById('user-details-panel');
  const avatar = document.getElementById('panel-user-avatar');
  const name = document.getElementById('panel-user-name');
  const email = document.getElementById('panel-user-email');
  const body = document.getElementById('user-panel-body');

  // Update header
  avatar.textContent = (user.name || 'U').charAt(0).toUpperCase();
  name.textContent = user.name || 'Sin nombre';
  email.textContent = user.email || user.id;

  // Render body content
  body.innerHTML = await renderUserPanelContent(user);

  // Show panel
  panel.classList.add('active');

  // Initialize panel interactions
  initializePanelInteractions(user);
}

async function renderUserPanelContent(user) {
  const isAdmin = user.isAdmin || user.role === 'admin';

  // Get all available products
  const productsRef = collection(db, 'products');
  const productsSnap = await getDocs(productsRef);
  const allProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return `
    <div class="panel-section">
      <h3 class="section-title">Información del Usuario</h3>
      <div class="info-grid">
        <div class="info-item">
          <label>País</label>
          <p>${user.country || 'No especificado'}</p>
        </div>
        <div class="info-item">
          <label>Empresa</label>
          <p>${user.company || 'No especificado'}</p>
        </div>
        <div class="info-item">
          <label>Teléfono</label>
          <p>${user.phone || 'No especificado'}</p>
        </div>
        <div class="info-item">
          <label>Rol</label>
          <div class="role-toggle">
            <span class="badge ${isAdmin ? 'badge-admin' : 'badge-user'}">${isAdmin ? 'Admin' : 'Usuario'}</span>
            <button class="btn-ghost btn-sm" onclick="window.toggleUserRole('${user.id}')">
              Cambiar a ${isAdmin ? 'Usuario' : 'Admin'}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-header">
        <h3 class="section-title">Productos (${user.products?.length || 0})</h3>
        <button class="btn-primary btn-sm" onclick="window.addProductToUser('${user.id}')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 4V12M4 8H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Agregar Producto
        </button>
      </div>

      ${user.products?.length > 0 ? `
        <div class="products-list">
          ${user.products.map(product => `
            <div class="product-card">
              <div class="product-header">
                <div class="product-info">
                  <h4 class="product-name">${product.name || 'Producto'}</h4>
                  <p class="product-meta">
                    Comprado: ${product.purchaseDate ? new Date(product.purchaseDate.seconds * 1000).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
                </div>
                <div class="product-status">
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      ${product.status === 'active' ? 'checked' : ''}
                      onchange="window.toggleProductStatus('${user.id}', '${product.id}', this.checked)"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="status-label">${product.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>

              <div class="product-stats">
                <div class="stat-mini">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M8 5V8L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <span>Sesiones: <strong>-</strong></span>
                </div>
                <div class="stat-mini">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2L9.5 6H13.5L10.5 8.5L11.5 12.5L8 10L4.5 12.5L5.5 8.5L2.5 6H6.5L8 2Z" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  <span>Score: <strong>-</strong></span>
                </div>
                <div class="stat-mini">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 2H10M6 14H10M3 5H13M3 8H13M3 11H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <span>Preguntas: <strong>-</strong></span>
                </div>
              </div>

              <div class="product-actions">
                <button
                  class="btn-secondary btn-sm"
                  onclick="window.manageProductQuestions('${user.id}', '${product.id}', '${product.name}')"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M8 11V11.5M8 5V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  Gestionar Preguntas
                </button>
                <button
                  class="btn-ghost btn-sm btn-danger"
                  onclick="window.removeProductFromUser('${user.id}', '${product.id}')"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state-small">
          <p>Este usuario no tiene productos asignados</p>
        </div>
      `}
    </div>

    <!-- Add Product Dropdown (hidden initially) -->
    <div class="dropdown-overlay" id="add-product-dropdown" style="display: none;">
      <div class="dropdown-content">
        <h4>Seleccionar Producto</h4>
        <div class="products-dropdown-list">
          ${allProducts.map(p => `
            <button
              class="dropdown-item"
              onclick="window.assignProduct('${user.id}', '${p.id}')"
            >
              ${p.name}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function initializePanelInteractions(user) {
  // Make functions global
  window.toggleUserRole = toggleUserRole;
  window.toggleProductStatus = toggleProductStatus;
  window.manageProductQuestions = manageProductQuestions;
  window.removeProductFromUser = removeProductFromUser;
  window.addProductToUser = addProductToUser;
  window.assignProduct = assignProduct;
}

async function toggleUserRole(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const isCurrentlyAdmin = userData.isAdmin || userData.role === 'admin';

    await updateDoc(userRef, {
      role: isCurrentlyAdmin ? 'user' : 'admin',
      isAdmin: !isCurrentlyAdmin
    });

    showToast(`Rol actualizado a ${isCurrentlyAdmin ? 'Usuario' : 'Admin'}`, 'success');
    await loadAllUsers();
    await viewUserDetails(userId);
  } catch (error) {
    console.error('Error toggling role:', error);
    showToast('Error al cambiar el rol', 'error');
  }
}

async function toggleProductStatus(userId, productId, isActive) {
  try {
    const productRef = doc(db, 'users', userId, 'purchasedProducts', productId);
    await updateDoc(productRef, {
      status: isActive ? 'active' : 'inactive'
    });

    showToast(`Producto ${isActive ? 'activado' : 'desactivado'}`, 'success');
    await loadAllUsers();
  } catch (error) {
    console.error('Error toggling status:', error);
    showToast('Error al cambiar el estado', 'error');
  }
}

function closeUserPanel() {
  const panel = document.getElementById('user-details-panel');
  panel.classList.remove('active');
}

// Questions Modal
let currentQuestionData = {
  userId: null,
  productId: null,
  productName: null,
  databaseId: null
};

let processedQuestions = null;

function initializeQuestionsModal() {
  const modal = document.getElementById('questions-modal');
  const closeBtn = document.getElementById('close-questions-modal');
  const overlay = modal.querySelector('.modal-overlay');

  closeBtn.addEventListener('click', closeQuestionsModal);
  overlay.addEventListener('click', closeQuestionsModal);

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Database ID input
  const dbInput = document.getElementById('database-id-input');
  dbInput.addEventListener('blur', async (e) => {
    const dbId = e.target.value.trim();
    if (dbId) {
      currentQuestionData.databaseId = dbId;
      await loadQuestionsFromDB(dbId);
    }
  });

  // Process JSON button
  document.getElementById('process-json-btn').addEventListener('click', processQuestionsJSON);

  // Insert to Firebase button
  document.getElementById('insert-firebase-btn').addEventListener('click', insertQuestionsToFirebase);
}

async function manageProductQuestions(userId, productId, productName) {
  currentQuestionData = { userId, productId, productName, databaseId: null };

  // Update modal title
  document.getElementById('questions-modal-title').textContent = 'Gestión de Preguntas';
  document.getElementById('questions-modal-subtitle').textContent = `${productName}`;

  // Get product to check if it has a databaseId
  const productsRef = collection(db, 'products');
  const productsSnap = await getDocs(productsRef);
  const product = productsSnap.docs.find(d => d.id === productId);

  if (product?.data().databaseId) {
    const dbId = product.data().databaseId;
    currentQuestionData.databaseId = dbId;
    document.getElementById('database-id-input').value = dbId;
    await loadQuestionsFromDB(dbId);
  }

  // Show modal
  document.getElementById('questions-modal').classList.add('active');
  switchTab('database');
}

function switchTab(tabName) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
}

async function loadQuestionsFromDB(databaseId) {
  try {
    const questionsRef = collection(db, databaseId);
    const snapshot = await getDocs(questionsRef);

    const count = snapshot.size;
    document.getElementById('current-questions-db').textContent = count;
    document.getElementById('current-questions-count').textContent = count;

    // Render questions preview
    const preview = document.getElementById('questions-preview');
    if (count === 0) {
      preview.innerHTML = '<p class="empty-state-text">No hay preguntas en esta base de datos</p>';
    } else {
      const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      preview.innerHTML = questions.map(q => `
        <div class="question-preview-card">
          <div class="question-preview-header">
            <span class="question-topic">${q.topic}</span>
            <span class="question-id">#${q.id.slice(0, 8)}</span>
          </div>
          <p class="question-text">${q.question}</p>
          <div class="question-options">
            ${q.options?.map((opt, idx) => `
              <span class="option ${idx === q.correctAnswer ? 'option-correct' : ''}">
                ${String.fromCharCode(65 + idx)}. ${opt}
              </span>
            `).join('')}
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading questions:', error);
    document.getElementById('current-questions-db').textContent = 'Error';
    document.getElementById('questions-preview').innerHTML = '<p class="error-state-text">Error al cargar preguntas</p>';
  }
}

function processQuestionsJSON() {
  const textarea = document.getElementById('questions-json-textarea');
  const validationEl = document.getElementById('validation-message');
  const detectedCount = document.getElementById('detected-questions-count');
  const insertBtn = document.getElementById('insert-firebase-btn');

  try {
    const jsonText = textarea.value.trim();
    if (!jsonText) throw new Error('El campo está vacío');

    const questions = JSON.parse(jsonText);
    if (!Array.isArray(questions)) throw new Error('El JSON debe ser un array');
    if (questions.length === 0) throw new Error('El array está vacío');

    // Validate each question
    const errors = [];
    questions.forEach((q, i) => {
      if (!q.question) errors.push(`Pregunta ${i + 1}: falta 'question'`);
      if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`Pregunta ${i + 1}: 'options' inválido`);
      if (typeof q.correctAnswer !== 'number') errors.push(`Pregunta ${i + 1}: 'correctAnswer' inválido`);
      if (!q.topic) errors.push(`Pregunta ${i + 1}: falta 'topic'`);
    });

    if (errors.length > 0) throw new Error(errors.join('\n'));

    // Success
    processedQuestions = questions;
    detectedCount.textContent = questions.length;

    const topics = [...new Set(questions.map(q => q.topic))];
    validationEl.className = 'validation-message success';
    validationEl.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" fill="currentColor" opacity="0.1"/>
        <path d="M6 10L9 13L14 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <div>
        <p class="validation-title">✓ JSON válido - ${questions.length} preguntas detectadas</p>
        <p class="validation-text">Temas: ${topics.join(', ')}</p>
      </div>
    `;

    insertBtn.disabled = false;
    insertBtn.classList.remove('disabled');

    showToast(`${questions.length} preguntas procesadas correctamente`, 'success');
  } catch (error) {
    processedQuestions = null;
    detectedCount.textContent = '0';

    validationEl.className = 'validation-message error';
    validationEl.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" fill="currentColor" opacity="0.1"/>
        <path d="M10 6V10M10 13H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <div>
        <p class="validation-title">✗ Error en el JSON</p>
        <p class="validation-text">${error.message}</p>
      </div>
    `;

    insertBtn.disabled = true;
    insertBtn.classList.add('disabled');

    showToast('Error al procesar JSON', 'error');
  }
}

async function insertQuestionsToFirebase() {
  if (!processedQuestions) {
    showToast('Primero debes procesar el JSON', 'error');
    return;
  }

  const databaseId = currentQuestionData.databaseId || document.getElementById('database-id-input').value.trim();
  if (!databaseId) {
    showToast('Especifica un ID de base de datos', 'error');
    return;
  }

  try {
    const questionsRef = collection(db, databaseId);

    // Insert all questions
    const promises = processedQuestions.map(q =>
      addDoc(questionsRef, {
        ...q,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    );

    await Promise.all(promises);

    // Update product with databaseId if needed
    if (currentQuestionData.productId) {
      const productRef = doc(db, 'products', currentQuestionData.productId);
      await setDoc(productRef, { databaseId }, { merge: true });
    }

    showToast(`✓ ${processedQuestions.length} preguntas insertadas exitosamente`, 'success');

    // Reset
    document.getElementById('questions-json-textarea').value = '';
    document.getElementById('detected-questions-count').textContent = '-';
    document.getElementById('validation-message').innerHTML = '';
    processedQuestions = null;

    // Reload questions
    await loadQuestionsFromDB(databaseId);
    switchTab('database');
  } catch (error) {
    console.error('Error inserting questions:', error);
    showToast('Error al insertar preguntas: ' + error.message, 'error');
  }
}

function closeQuestionsModal() {
  document.getElementById('questions-modal').classList.remove('active');
  processedQuestions = null;
}

// Helper functions
async function addProductToUser(userId) {
  // This would show a dropdown - simplified version
  showToast('Funcionalidad en desarrollo', 'info');
}

async function assignProduct(userId, productId) {
  // Assign product to user
  showToast('Producto asignado', 'success');
}

async function removeProductFromUser(userId, productId) {
  if (!confirm('¿Eliminar este producto del usuario?')) return;

  try {
    const productRef = doc(db, 'users', userId, 'purchasedProducts', productId);
    await deleteDoc(productRef);

    showToast('Producto eliminado', 'success');
    await loadAllUsers();
    await viewUserDetails(userId);
  } catch (error) {
    console.error('Error removing product:', error);
    showToast('Error al eliminar producto', 'error');
  }
}

function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

// Toast notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '<path d="M6 10L9 13L14 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    error: '<path d="M10 6V10M10 13H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    info: '<circle cx="10" cy="10" r="1" fill="currentColor"/><path d="M10 6V9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  };

  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      ${icons[type] || icons.info}
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Inject styles
function injectStyles() {
  if (document.getElementById('admin-users-styles')) return;

  const style = document.createElement('style');
  style.id = 'admin-users-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

    .admin-users-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8f9fb 0%, #ffffff 100%);
      font-family: 'DM Sans', -apple-system, sans-serif;
      color: #1a1f36;
      padding: 0;
    }

    /* Header */
    .page-header {
      background: white;
      border-bottom: 1px solid #e3e8ef;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.95);
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem 2rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      color: #697386;
    }

    .breadcrumb-link {
      color: #697386;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: color 0.2s;
    }

    .breadcrumb-link:hover {
      color: #22a7d0;
    }

    .breadcrumb-current {
      color: #1a1f36;
      font-weight: 500;
    }

    .header-title-section {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .logo-mark {
      flex-shrink: 0;
    }

    .page-title {
      font-family: 'Newsreader', Georgia, serif;
      font-size: 2.5rem;
      font-weight: 600;
      margin: 0;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #1a1f36 0%, #22a7d0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .page-subtitle {
      margin: 0.5rem 0 0 0;
      color: #697386;
      font-size: 1rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    /* Buttons */
    .btn-primary {
      background: linear-gradient(135deg, #22a7d0 0%, #1a8fb8 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(34, 167, 208, 0.2);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(34, 167, 208, 0.3);
    }

    .btn-secondary {
      background: #f6f8fa;
      color: #1a1f36;
      border: 1px solid #e3e8ef;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #e3e8ef;
      border-color: #cbd2d9;
    }

    .btn-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .btn-success:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-success:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-ghost {
      background: transparent;
      color: #697386;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-ghost:hover {
      background: #f6f8fa;
      color: #1a1f36;
    }

    .btn-icon {
      background: white;
      border: 1px solid #e3e8ef;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      color: #697386;
    }

    .btn-icon:hover {
      background: #f6f8fa;
      border-color: #cbd2d9;
      color: #1a1f36;
    }

    .btn-icon-sm {
      background: transparent;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      color: #697386;
    }

    .btn-icon-sm:hover {
      background: #f6f8fa;
      color: #1a1f36;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .btn-lg {
      padding: 1rem 2rem;
      font-size: 1rem;
    }

    .btn-danger {
      color: #ef4444;
    }

    .btn-danger:hover {
      background: #fef2f2;
      color: #dc2626;
    }

    /* Filters Section */
    .filters-section {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      align-items: flex-end;
    }

    .search-box {
      flex: 1;
      min-width: 300px;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .search-box svg {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #697386;
      pointer-events: none;
    }

    .search-box input {
      width: 100%;
      padding: 0.875rem 1rem 0.875rem 3rem;
      border: 1px solid #e3e8ef;
      border-radius: 10px;
      font-size: 0.9375rem;
      background: white;
      transition: all 0.2s;
      font-family: 'DM Sans', sans-serif;
    }

    .search-box input:focus {
      outline: none;
      border-color: #22a7d0;
      box-shadow: 0 0 0 3px rgba(34, 167, 208, 0.1);
    }

    .filter-group {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-item label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #697386;
    }

    .filter-item select {
      padding: 0.875rem 1rem;
      border: 1px solid #e3e8ef;
      border-radius: 10px;
      background: white;
      font-size: 0.9375rem;
      cursor: pointer;
      min-width: 200px;
      font-family: 'DM Sans', sans-serif;
    }

    .filter-item select:focus {
      outline: none;
      border-color: #22a7d0;
      box-shadow: 0 0 0 3px rgba(34, 167, 208, 0.1);
    }

    /* Users Table */
    .users-table-section {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem 2rem;
    }

    .table-header {
      margin-bottom: 1.5rem;
    }

    .results-count {
      font-size: 0.875rem;
      color: #697386;
      font-weight: 500;
    }

    .users-table-container {
      background: white;
      border-radius: 12px;
      border: 1px solid #e3e8ef;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
    }

    .users-table thead {
      background: #f6f8fa;
      border-bottom: 1px solid #e3e8ef;
    }

    .users-table th {
      padding: 1rem 1.5rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 700;
      color: #697386;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .users-table tbody tr {
      border-bottom: 1px solid #f6f8fa;
      transition: background-color 0.2s;
    }

    .users-table tbody tr:hover {
      background: #fafbfc;
    }

    .users-table tbody tr:last-child {
      border-bottom: none;
    }

    .users-table td {
      padding: 1.25rem 1.5rem;
      vertical-align: middle;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-avatar {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: linear-gradient(135deg, #22a7d0 0%, #1a8fb8 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.125rem;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .user-name {
      font-weight: 600;
      font-size: 0.9375rem;
      color: #1a1f36;
      margin: 0;
    }

    .user-email {
      font-size: 0.875rem;
      color: #697386;
      margin: 0;
    }

    .user-company {
      font-size: 0.8125rem;
      color: #8896a4;
      margin: 0;
      font-style: italic;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .badge-admin {
      background: #f3e8ff;
      color: #7c3aed;
    }

    .badge-user {
      background: #e3e8ef;
      color: #697386;
    }

    .badge-count {
      background: #e8f4f8;
      color: #22a7d0;
      min-width: 32px;
      justify-content: center;
    }

    .activity-date {
      color: #697386;
      font-size: 0.875rem;
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .status-active {
      background: #d1fae5;
      color: #065f46;
    }

    .status-inactive {
      background: #fee2e2;
      color: #991b1b;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-state-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: #697386;
    }

    .empty-state-content svg {
      opacity: 0.4;
    }

    /* Slide Panel */
    .slide-panel {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 600px;
      z-index: 1000;
      pointer-events: none;
    }

    .slide-panel.active {
      pointer-events: all;
    }

    .slide-panel-overlay {
      position: absolute;
      inset: 0;
      background: rgba(26, 31, 54, 0.4);
      backdrop-filter: blur(2px);
      opacity: 0;
      transition: opacity 0.3s;
    }

    .slide-panel.active .slide-panel-overlay {
      opacity: 1;
    }

    .slide-panel-content {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      background: white;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
    }

    .slide-panel.active .slide-panel-content {
      transform: translateX(0);
    }

    .panel-header {
      padding: 2rem;
      border-bottom: 1px solid #e3e8ef;
      flex-shrink: 0;
    }

    .panel-close {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      background: #f6f8fa;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      color: #697386;
    }

    .panel-close:hover {
      background: #e3e8ef;
      color: #1a1f36;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-avatar-large {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #22a7d0 0%, #1a8fb8 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.5rem;
    }

    .panel-title h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a1f36;
    }

    .panel-title p {
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
      color: #697386;
    }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }

    .panel-section {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1a1f36;
      margin: 0 0 1rem 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .info-item label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #697386;
      margin-bottom: 0.375rem;
    }

    .info-item p {
      margin: 0;
      font-size: 0.9375rem;
      color: #1a1f36;
    }

    .role-toggle {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .products-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .product-card {
      background: #f6f8fa;
      border: 1px solid #e3e8ef;
      border-radius: 10px;
      padding: 1.25rem;
    }

    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .product-name {
      margin: 0 0 0.25rem 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1a1f36;
    }

    .product-meta {
      margin: 0;
      font-size: 0.8125rem;
      color: #697386;
    }

    .product-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #697386;
    }

    /* Toggle Switch */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: #cbd2d9;
      transition: 0.3s;
      border-radius: 24px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    input:checked + .toggle-slider {
      background-color: #22a7d0;
    }

    input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }

    .product-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e3e8ef;
    }

    .stat-mini {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #697386;
    }

    .stat-mini svg {
      color: #22a7d0;
    }

    .stat-mini strong {
      color: #1a1f36;
    }

    .product-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .empty-state-small {
      text-align: center;
      padding: 2rem;
      color: #697386;
      font-size: 0.875rem;
    }

    /* Modal */
    .modal {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
    }

    .modal.active {
      opacity: 1;
      pointer-events: all;
    }

    .modal-overlay {
      position: absolute;
      inset: 0;
      background: rgba(26, 31, 54, 0.6);
      backdrop-filter: blur(4px);
    }

    .modal-content {
      position: relative;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      transform: scale(0.95);
      transition: transform 0.3s;
    }

    .modal.active .modal-content {
      transform: scale(1);
    }

    .modal-large {
      max-width: 1000px;
    }

    .modal-header {
      padding: 2rem;
      border-bottom: 1px solid #e3e8ef;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-shrink: 0;
    }

    .modal-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      font-family: 'Newsreader', Georgia, serif;
      color: #1a1f36;
    }

    .modal-subtitle {
      margin: 0.5rem 0 0 0;
      font-size: 0.875rem;
      color: #697386;
    }

    .modal-close {
      background: #f6f8fa;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      color: #697386;
    }

    .modal-close:hover {
      background: #e3e8ef;
      color: #1a1f36;
    }

    .modal-tabs {
      display: flex;
      border-bottom: 1px solid #e3e8ef;
      flex-shrink: 0;
    }

    .tab-btn {
      flex: 1;
      padding: 1rem 1.5rem;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: 0.9375rem;
      font-weight: 500;
      color: #697386;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .tab-btn:hover {
      background: #fafbfc;
      color: #1a1f36;
    }

    .tab-btn.active {
      color: #22a7d0;
      border-bottom-color: #22a7d0;
      background: #f8fcfd;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
      animation: fadeIn 0.3s;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Forms */
    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1a1f36;
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 1px solid #e3e8ef;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-family: 'DM Sans', sans-serif;
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #22a7d0;
      box-shadow: 0 0 0 3px rgba(34, 167, 208, 0.1);
    }

    .form-textarea {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 1px solid #e3e8ef;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-family: 'DM Sans', sans-serif;
      resize: vertical;
      min-height: 120px;
      transition: all 0.2s;
    }

    .form-textarea:focus {
      outline: none;
      border-color: #22a7d0;
      box-shadow: 0 0 0 3px rgba(34, 167, 208, 0.1);
    }

    .code-textarea {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.8125rem;
    }

    .form-hint {
      font-size: 0.8125rem;
      color: #697386;
      margin-top: 0.375rem;
    }

    /* Info Banner */
    .info-banner {
      background: #e8f4f8;
      border: 1px solid #b8dce5;
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .info-banner svg {
      color: #22a7d0;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .banner-title {
      font-weight: 600;
      color: #1a1f36;
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
    }

    .banner-text {
      margin: 0;
      font-size: 0.8125rem;
      color: #3e5463;
      line-height: 1.5;
    }

    .banner-text code {
      background: rgba(34, 167, 208, 0.1);
      padding: 0.125rem 0.375rem;
      border-radius: 3px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.75rem;
    }

    /* Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: #f6f8fa;
      border: 1px solid #e3e8ef;
      border-radius: 10px;
      padding: 1.25rem;
    }

    .stat-primary {
      background: linear-gradient(135deg, #e8f4f8 0%, #f8fcfd 100%);
      border-color: #b8dce5;
    }

    .stat-card.stat-primary .stat-icon {
      background: rgba(34, 167, 208, 0.1);
      color: #22a7d0;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: #e3e8ef;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .stat-content {
    }

    .stat-label {
      font-size: 0.8125rem;
      color: #697386;
      margin: 0 0 0.5rem 0;
      font-weight: 500;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1f36;
      margin: 0;
      font-family: 'Newsreader', Georgia, serif;
    }

    .stat-value-accent {
      color: #22a7d0;
    }

    .stat-value-success {
      color: #10b981;
    }

    /* Questions List */
    .questions-list-section {
      margin-top: 1.5rem;
    }

    .questions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    .questions-list::-webkit-scrollbar {
      width: 6px;
    }

    .questions-list::-webkit-scrollbar-track {
      background: #f6f8fa;
      border-radius: 3px;
    }

    .questions-list::-webkit-scrollbar-thumb {
      background: #cbd2d9;
      border-radius: 3px;
    }

    .question-preview-card {
      background: white;
      border: 1px solid #e3e8ef;
      border-radius: 8px;
      padding: 1rem;
    }

    .question-preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .question-topic {
      font-size: 0.75rem;
      font-weight: 600;
      color: #22a7d0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .question-id {
      font-size: 0.75rem;
      color: #8896a4;
      font-family: 'SF Mono', Monaco, monospace;
    }

    .question-text {
      font-size: 0.875rem;
      color: #1a1f36;
      margin: 0 0 0.75rem 0;
      line-height: 1.5;
    }

    .question-options {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .option {
      font-size: 0.8125rem;
      color: #697386;
      padding: 0.375rem 0.5rem;
      background: #f6f8fa;
      border-radius: 4px;
    }

    .option-correct {
      background: #d1fae5;
      color: #065f46;
      font-weight: 500;
    }

    .empty-state-text {
      text-align: center;
      color: #697386;
      font-size: 0.875rem;
      padding: 2rem;
    }

    .error-state-text {
      text-align: center;
      color: #ef4444;
      font-size: 0.875rem;
      padding: 2rem;
    }

    /* Validation Message */
    .validation-message {
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .validation-message.success {
      background: #d1fae5;
      border: 1px solid #6ee7b7;
    }

    .validation-message.success svg {
      color: #059669;
    }

    .validation-message.error {
      background: #fee2e2;
      border: 1px solid #fecaca;
    }

    .validation-message.error svg {
      color: #dc2626;
    }

    .validation-title {
      font-weight: 600;
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
    }

    .validation-message.success .validation-title {
      color: #065f46;
    }

    .validation-message.error .validation-title {
      color: #991b1b;
    }

    .validation-text {
      margin: 0;
      font-size: 0.8125rem;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .validation-message.success .validation-text {
      color: #047857;
    }

    .validation-message.error .validation-text {
      color: #b91c1c;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 1rem;
    }

    /* Toast */
    .toast-container {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 3000;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: flex-end;
    }

    .toast {
      background: white;
      border-radius: 10px;
      padding: 1rem 1.25rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 300px;
      border: 1px solid #e3e8ef;
      transform: translateX(400px);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast.show {
      transform: translateX(0);
    }

    .toast svg {
      flex-shrink: 0;
    }

    .toast-success {
      border-left: 3px solid #10b981;
    }

    .toast-success svg {
      color: #10b981;
    }

    .toast-error {
      border-left: 3px solid #ef4444;
    }

    .toast-error svg {
      color: #ef4444;
    }

    .toast-info {
      border-left: 3px solid #22a7d0;
    }

    .toast-info svg {
      color: #22a7d0;
    }

    .toast span {
      font-size: 0.875rem;
      color: #1a1f36;
      font-weight: 500;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        padding: 1rem;
      }

      .header-title-section {
        flex-direction: column;
        align-items: flex-start;
      }

      .page-title {
        font-size: 1.75rem;
      }

      .filters-section {
        padding: 1rem;
      }

      .filter-group {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
      }

      .filter-item select {
        width: 100%;
      }

      .users-table-container {
        overflow-x: auto;
      }

      .slide-panel {
        width: 100%;
      }

      .modal-content {
        width: 95%;
        max-height: 95vh;
      }

      .toast-container {
        left: 1rem;
        right: 1rem;
      }

      .toast {
        min-width: auto;
        width: 100%;
      }
    }
  `;

  document.head.appendChild(style);
}
