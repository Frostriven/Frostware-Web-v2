import { auth, db } from '../../js/firebase.js';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc, query, serverTimestamp } from 'firebase/firestore';

let allDatabases = [];
let allProducts = [];
let selectedDatabase = null;
let allQuestions = [];
let filteredQuestions = [];
let currentPage = 1;
const questionsPerPage = 20;

export async function renderDatabaseManagementView() {
  const root = document.getElementById('spa-root');
  if (!root) return;

  // Check admin access
  if (!auth?.currentUser) {
    window.location.hash = '#/auth';
    return;
  }

  root.innerHTML = `
    <style>
      .db-management-container {
        min-height: 100vh;
        background: #f9fafb;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      /* Header */
      .db-header {
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 24px 32px;
      }

      .db-header-content {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .db-header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .db-back-btn {
        background: transparent;
        border: 1px solid #e5e7eb;
        color: #6b7280;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
      }

      .db-back-btn:hover {
        border-color: #22a7d0;
        color: #22a7d0;
      }

      .db-title {
        font-size: 24px;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }

      .db-header-actions {
        display: flex;
        gap: 12px;
      }

      .btn-primary {
        background: #22a7d0;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
      }

      .btn-primary:hover {
        background: #1e96bc;
      }

      .btn-secondary {
        background: white;
        color: #374151;
        border: 1px solid #e5e7eb;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
      }

      .btn-secondary:hover {
        border-color: #22a7d0;
        color: #22a7d0;
      }

      /* Main Layout */
      .db-layout {
        max-width: 1400px;
        margin: 0 auto;
        padding: 32px;
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 32px;
      }

      /* Sidebar */
      .db-sidebar {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        height: fit-content;
        position: sticky;
        top: 32px;
      }

      .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .sidebar-title {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
      }

      .sidebar-count {
        font-size: 14px;
        color: #6b7280;
        background: #f3f4f6;
        padding: 2px 8px;
        border-radius: 12px;
      }

      .sidebar-search {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 14px;
        margin-bottom: 16px;
        outline: none;
        transition: all 0.2s;
      }

      .sidebar-search:focus {
        border-color: #22a7d0;
        box-shadow: 0 0 0 3px rgba(34, 167, 208, 0.1);
      }

      .database-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .database-item {
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .database-item:hover {
        border-color: #22a7d0;
        background: #f0f9ff;
      }

      .database-item.selected {
        border-color: #22a7d0;
        background: #e0f2fe;
      }

      .db-item-name {
        font-size: 14px;
        font-weight: 500;
        color: #111827;
        margin-bottom: 4px;
      }

      .db-item-id {
        font-size: 12px;
        color: #6b7280;
        font-family: 'Monaco', monospace;
        margin-bottom: 8px;
      }

      .db-item-stats {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: #6b7280;
      }

      .db-item-stat {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .stat-badge {
        background: #f3f4f6;
        color: #374151;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 500;
      }

      /* Main Content */
      .db-content {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        min-height: 600px;
      }

      .db-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 20px;
        text-align: center;
      }

      .empty-icon {
        width: 80px;
        height: 80px;
        background: #f3f4f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        font-size: 32px;
        color: #9ca3af;
      }

      .empty-title {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 8px;
      }

      .empty-text {
        font-size: 14px;
        color: #6b7280;
      }

      /* Database Header */
      .database-header {
        padding: 24px 32px;
        border-bottom: 1px solid #e5e7eb;
      }

      .database-header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
      }

      .database-info h2 {
        font-size: 20px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 4px 0;
      }

      .database-id {
        font-size: 13px;
        color: #6b7280;
        font-family: 'Monaco', monospace;
        background: #f3f4f6;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      .database-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .stat-card {
        padding: 16px;
        background: #f9fafb;
        border-radius: 6px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: #22a7d0;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 13px;
        color: #6b7280;
      }

      /* Questions Controls */
      .questions-controls {
        padding: 20px 32px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .controls-left {
        display: flex;
        gap: 12px;
        flex: 1;
        min-width: 300px;
      }

      .control-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
      }

      .control-input:focus {
        border-color: #22a7d0;
        box-shadow: 0 0 0 3px rgba(34, 167, 208, 0.1);
      }

      .control-select {
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 14px;
        background: white;
        cursor: pointer;
        outline: none;
      }

      /* Questions List */
      .questions-list {
        padding: 24px 32px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .question-card {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        transition: all 0.2s;
      }

      .question-card:hover {
        border-color: #22a7d0;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }

      .question-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .question-topic {
        font-size: 12px;
        font-weight: 500;
        color: #22a7d0;
        background: #e0f2fe;
        padding: 4px 8px;
        border-radius: 4px;
      }

      .question-actions {
        display: flex;
        gap: 8px;
      }

      .question-btn {
        background: transparent;
        border: 1px solid #e5e7eb;
        color: #374151;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .question-btn:hover {
        border-color: #22a7d0;
        color: #22a7d0;
      }

      .question-btn.danger {
        color: #dc2626;
      }

      .question-btn.danger:hover {
        border-color: #dc2626;
        background: #fef2f2;
      }

      .question-text {
        font-size: 15px;
        color: #111827;
        margin-bottom: 12px;
        line-height: 1.6;
      }

      .question-options {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin-bottom: 12px;
      }

      .question-option {
        font-size: 13px;
        color: #374151;
        padding: 8px 12px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
      }

      .question-option.correct {
        border-color: #22a7d0;
        background: #e0f2fe;
        color: #0369a1;
        font-weight: 500;
      }

      .question-meta {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: #9ca3af;
        padding-top: 12px;
        border-top: 1px solid #f3f4f6;
      }

      /* Pagination */
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        padding: 24px;
        border-top: 1px solid #e5e7eb;
      }

      .pagination-btn {
        background: white;
        border: 1px solid #e5e7eb;
        color: #374151;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .pagination-btn:hover:not(:disabled) {
        border-color: #22a7d0;
        color: #22a7d0;
      }

      .pagination-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .pagination-info {
        font-size: 14px;
        color: #6b7280;
      }

      /* Modal Overlay */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }

      .modal-overlay.active {
        display: flex;
      }

      .modal {
        background: white;
        border-radius: 12px;
        max-width: 800px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }

      .modal-header {
        padding: 24px 32px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-title {
        font-size: 20px;
        font-weight: 600;
        color: #111827;
      }

      .modal-close {
        background: transparent;
        border: none;
        color: #9ca3af;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s;
      }

      .modal-close:hover {
        background: #f3f4f6;
        color: #374151;
      }

      .modal-body {
        padding: 24px 32px;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 8px;
      }

      .form-input,
      .form-textarea,
      .form-select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
        font-family: inherit;
        transition: all 0.2s;
      }

      .form-textarea {
        min-height: 100px;
        resize: vertical;
      }

      .form-input:focus,
      .form-textarea:focus,
      .form-select:focus {
        border-color: #22a7d0;
        box-shadow: 0 0 0 3px rgba(34, 167, 208, 0.1);
      }

      .form-hint {
        font-size: 13px;
        color: #6b7280;
        margin-top: 4px;
      }

      .options-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .option-row {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .option-radio {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: #22a7d0;
      }

      .option-input {
        flex: 1;
      }

      .option-remove {
        background: transparent;
        border: 1px solid #e5e7eb;
        color: #dc2626;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .option-remove:hover {
        border-color: #dc2626;
        background: #fef2f2;
      }

      .add-option-btn {
        width: 100%;
        background: transparent;
        border: 1px dashed #d1d5db;
        color: #6b7280;
        padding: 10px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 12px;
      }

      .add-option-btn:hover {
        border-color: #22a7d0;
        color: #22a7d0;
        background: #f0f9ff;
      }

      .modal-footer {
        padding: 20px 32px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .modal-btn {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .modal-btn-cancel {
        background: white;
        border: 1px solid #e5e7eb;
        color: #374151;
      }

      .modal-btn-cancel:hover {
        border-color: #d1d5db;
        background: #f9fafb;
      }

      .modal-btn-primary {
        background: #22a7d0;
        border: none;
        color: white;
      }

      .modal-btn-primary:hover {
        background: #1e96bc;
      }

      /* Toast */
      .toast {
        position: fixed;
        top: 24px;
        right: 24px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px 20px;
        font-size: 14px;
        color: #111827;
        z-index: 2000;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 400px;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .toast.success {
        border-left: 4px solid #22c55e;
      }

      .toast.error {
        border-left: 4px solid #ef4444;
      }

      .toast-icon {
        font-size: 20px;
      }

      /* Loading State */
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: #6b7280;
        font-size: 14px;
      }

      /* Responsive */
      @media (max-width: 1024px) {
        .db-layout {
          grid-template-columns: 1fr;
          padding: 16px;
        }

        .db-sidebar {
          position: static;
        }

        .question-options {
          grid-template-columns: 1fr;
        }

        .database-stats {
          grid-template-columns: 1fr;
        }
      }
    </style>

    <div class="db-management-container">
      <!-- Header -->
      <div class="db-header">
        <div class="db-header-content">
          <div class="db-header-left">
            <button class="db-back-btn" onclick="window.location.hash='#/admin'">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Volver
            </button>
            <h1 class="db-title">Gestión de Bases de Datos</h1>
          </div>
          <div class="db-header-actions">
            <button class="btn-primary" id="new-database-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Nueva Base de Datos
            </button>
          </div>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="db-layout">
        <!-- Sidebar -->
        <div class="db-sidebar">
          <div class="sidebar-header">
            <span class="sidebar-title">Bases de Datos</span>
            <span class="sidebar-count" id="db-count">0</span>
          </div>
          <input
            type="text"
            class="sidebar-search"
            id="search-databases"
            placeholder="Buscar bases de datos..."
          />
          <div class="database-list" id="database-list">
            <div class="loading">Cargando...</div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="db-content" id="db-content">
          <div class="db-empty-state">
            <div class="empty-icon">📊</div>
            <div class="empty-title">Selecciona una base de datos</div>
            <div class="empty-text">Elige una base de datos de la lista para ver y gestionar sus preguntas</div>
          </div>
        </div>
      </div>

      <!-- Edit Question Modal -->
      <div class="modal-overlay" id="edit-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Editar Pregunta</h3>
            <button class="modal-close" id="close-edit-modal">×</button>
          </div>
          <div class="modal-body">
            <form id="edit-question-form">
              <input type="hidden" id="edit-question-id">

              <div class="form-group">
                <label class="form-label">Texto de la Pregunta</label>
                <textarea class="form-textarea" id="edit-question-text" required></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Tema</label>
                <input type="text" class="form-input" id="edit-question-topic" required />
              </div>

              <div class="form-group">
                <label class="form-label">Opciones (selecciona la respuesta correcta)</label>
                <div class="options-list" id="edit-options-list"></div>
                <button type="button" class="add-option-btn" id="add-option-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  Agregar Opción
                </button>
              </div>

              <div class="form-group">
                <label class="form-label">Explicación (opcional)</label>
                <textarea class="form-textarea" id="edit-question-explanation"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="modal-btn modal-btn-cancel" type="button" id="cancel-edit">Cancelar</button>
            <button class="modal-btn modal-btn-primary" type="submit" form="edit-question-form">Guardar Cambios</button>
          </div>
        </div>
      </div>

      <!-- New Database Modal -->
      <div class="modal-overlay" id="new-database-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Crear Nueva Base de Datos</h3>
            <button class="modal-close" id="close-new-db-modal">×</button>
          </div>
          <div class="modal-body">
            <form id="new-database-form">
              <div class="form-group">
                <label class="form-label">Producto</label>
                <select class="form-select" id="new-db-product" required>
                  <option value="">Selecciona un producto...</option>
                </select>
                <p class="form-hint">Selecciona el producto al que pertenecerá esta base de datos</p>
              </div>

              <div class="form-group">
                <label class="form-label">ID de Base de Datos</label>
                <input type="text" class="form-input" id="new-db-id" required pattern="[a-z0-9-]+" />
                <p class="form-hint">Solo letras minúsculas, números y guiones. Ejemplo: nat-ops-questions</p>
              </div>

              <div class="form-group">
                <label class="form-label">Preguntas Iniciales (JSON opcional)</label>
                <textarea class="form-textarea" id="new-db-questions" rows="10" placeholder='[{"question": "...", "options": [...], "correctAnswer": 0, "topic": "..."}]'></textarea>
                <p class="form-hint">Puedes agregar preguntas después si lo prefieres</p>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="modal-btn modal-btn-cancel" type="button" id="cancel-new-db">Cancelar</button>
            <button class="modal-btn modal-btn-primary" type="submit" form="new-database-form">Crear Base de Datos</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Initialize
  await loadProducts();
  await loadDatabases();
  initializeEvents();
}

async function loadProducts() {
  try {
    const productsSnapshot = await getDocs(collection(db, 'products'));
    allProducts = [];

    productsSnapshot.forEach(doc => {
      allProducts.push({
        id: doc.id,
        ...doc.data()
      });
    });
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

async function loadDatabases() {
  try {
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const databases = [];

    for (const productDoc of productsSnapshot.docs) {
      const product = productDoc.data();
      if (product.databaseId) {
        const questionsSnapshot = await getDocs(collection(db, product.databaseId));

        let lastUpdated = null;
        questionsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.updatedAt && (!lastUpdated || data.updatedAt.toDate() > lastUpdated)) {
            lastUpdated = data.updatedAt.toDate();
          }
        });

        // Ensure name is a string, not an object
        const productName = typeof product.name === 'string' ? product.name : productDoc.id;

        databases.push({
          id: product.databaseId,
          name: productName,
          productId: productDoc.id,
          questionCount: questionsSnapshot.size,
          lastUpdated: lastUpdated
        });
      }
    }

    allDatabases = databases;
    document.getElementById('db-count').textContent = databases.length;
    renderDatabaseList();
  } catch (error) {
    console.error('Error loading databases:', error);
    showToast('Error al cargar bases de datos', 'error');
  }
}

function renderDatabaseList(searchTerm = '') {
  const listEl = document.getElementById('database-list');

  const filtered = allDatabases.filter(db =>
    db.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    db.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="loading">No se encontraron bases de datos</div>';
    return;
  }

  listEl.innerHTML = filtered.map(db => `
    <div class="database-item ${selectedDatabase?.id === db.id ? 'selected' : ''}" data-db-id="${db.id}">
      <div class="db-item-name">${db.name}</div>
      <div class="db-item-id">${db.id}</div>
      <div class="db-item-stats">
        <div class="db-item-stat">
          <span>Preguntas:</span>
          <span class="stat-badge">${db.questionCount}</span>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.database-item').forEach(item => {
    item.addEventListener('click', () => {
      const dbId = item.dataset.dbId;
      selectDatabase(dbId);
    });
  });
}

async function selectDatabase(dbId) {
  selectedDatabase = allDatabases.find(db => db.id === dbId);
  if (!selectedDatabase) return;

  renderDatabaseList(document.getElementById('search-databases').value);
  await loadQuestions(dbId);
}

async function loadQuestions(dbId) {
  const contentEl = document.getElementById('db-content');
  contentEl.innerHTML = '<div class="loading">Cargando preguntas...</div>';

  try {
    const questionsSnapshot = await getDocs(collection(db, dbId));
    allQuestions = [];

    questionsSnapshot.forEach(doc => {
      allQuestions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    allQuestions.sort((a, b) => {
      const dateA = a.updatedAt?.toDate() || a.createdAt?.toDate() || new Date(0);
      const dateB = b.updatedAt?.toDate() || b.createdAt?.toDate() || new Date(0);
      return dateB - dateA;
    });

    filteredQuestions = [...allQuestions];
    currentPage = 1;
    renderQuestions();
  } catch (error) {
    console.error('Error loading questions:', error);
    showToast('Error al cargar preguntas', 'error');
    contentEl.innerHTML = '<div class="db-empty-state"><div class="empty-title">Error al cargar preguntas</div></div>';
  }
}

function renderQuestions() {
  const contentEl = document.getElementById('db-content');

  const topics = [...new Set(allQuestions.map(q => q.topic))].filter(Boolean);

  const startIdx = (currentPage - 1) * questionsPerPage;
  const endIdx = startIdx + questionsPerPage;
  const pageQuestions = filteredQuestions.slice(startIdx, endIdx);

  contentEl.innerHTML = `
    <div class="database-header">
      <div class="database-header-top">
        <div class="database-info">
          <h2>${selectedDatabase.name}</h2>
          <span class="database-id">${selectedDatabase.id}</span>
        </div>
      </div>
      <div class="database-stats">
        <div class="stat-card">
          <div class="stat-value">${allQuestions.length}</div>
          <div class="stat-label">Total Preguntas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${topics.length}</div>
          <div class="stat-label">Temas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${selectedDatabase.lastUpdated ? formatDate(selectedDatabase.lastUpdated) : 'N/A'}</div>
          <div class="stat-label">Última Actualización</div>
        </div>
      </div>
    </div>

    <div class="questions-controls">
      <div class="controls-left">
        <input
          type="text"
          class="control-input"
          id="search-questions"
          placeholder="Buscar preguntas..."
        />
        <select class="control-select" id="filter-topic">
          <option value="">Todos los temas</option>
          ${topics.map(topic => `<option value="${topic}">${topic}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="questions-list">
      ${pageQuestions.map(question => `
        <div class="question-card">
          <div class="question-header">
            <div class="question-topic">${question.topic || 'Sin tema'}</div>
            <div class="question-actions">
              <button class="question-btn" data-action="edit" data-question-id="${question.id}">Editar</button>
              <button class="question-btn danger" data-action="delete" data-question-id="${question.id}">Eliminar</button>
            </div>
          </div>
          <div class="question-text">${question.question}</div>
          <div class="question-options">
            ${question.options?.map((option, idx) => `
              <div class="question-option ${idx === question.correctAnswer ? 'correct' : ''}">
                ${String.fromCharCode(65 + idx)}. ${option}
              </div>
            `).join('') || ''}
          </div>
          <div class="question-meta">
            <span>ID: ${question.id.substring(0, 8)}...</span>
            ${question.updatedAt ? `<span>Actualizado: ${formatDate(question.updatedAt.toDate())}</span>` :
              question.createdAt ? `<span>Creado: ${formatDate(question.createdAt.toDate())}</span>` : ''}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="pagination">
      <button class="pagination-btn" id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>
        Anterior
      </button>
      <span class="pagination-info">
        Página ${currentPage} de ${Math.ceil(filteredQuestions.length / questionsPerPage)}
      </span>
      <button class="pagination-btn" id="next-page" ${endIdx >= filteredQuestions.length ? 'disabled' : ''}>
        Siguiente
      </button>
    </div>
  `;

  document.getElementById('search-questions')?.addEventListener('input', filterQuestions);
  document.getElementById('filter-topic')?.addEventListener('change', filterQuestions);
  document.getElementById('prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderQuestions();
    }
  });
  document.getElementById('next-page')?.addEventListener('click', () => {
    if (currentPage < Math.ceil(filteredQuestions.length / questionsPerPage)) {
      currentPage++;
      renderQuestions();
    }
  });

  document.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const questionId = btn.dataset.questionId;
      editQuestion(questionId);
    });
  });

  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const questionId = btn.dataset.questionId;
      deleteQuestion(questionId);
    });
  });
}

function filterQuestions() {
  const searchTerm = document.getElementById('search-questions')?.value.toLowerCase() || '';
  const topicFilter = document.getElementById('filter-topic')?.value || '';

  filteredQuestions = allQuestions.filter(q => {
    const matchesSearch = q.question?.toLowerCase().includes(searchTerm) ||
                         q.topic?.toLowerCase().includes(searchTerm);
    const matchesTopic = !topicFilter || q.topic === topicFilter;
    return matchesSearch && matchesTopic;
  });

  currentPage = 1;
  renderQuestions();
}

function editQuestion(questionId) {
  const question = allQuestions.find(q => q.id === questionId);
  if (!question) return;

  document.getElementById('edit-question-id').value = questionId;
  document.getElementById('edit-question-text').value = question.question;
  document.getElementById('edit-question-topic').value = question.topic || '';
  document.getElementById('edit-question-explanation').value = question.explanation || '';

  renderEditOptions(question.options || [], question.correctAnswer || 0);

  document.getElementById('edit-modal').classList.add('active');
}

function renderEditOptions(options, correctAnswer) {
  const listEl = document.getElementById('edit-options-list');

  listEl.innerHTML = options.map((option, idx) => `
    <div class="option-row">
      <input
        type="radio"
        name="correct-answer"
        class="option-radio"
        value="${idx}"
        ${idx === correctAnswer ? 'checked' : ''}
      />
      <input
        type="text"
        class="form-input option-input"
        value="${option}"
        data-option-idx="${idx}"
      />
      ${options.length > 2 ? `
        <button type="button" class="option-remove" data-remove-idx="${idx}">×</button>
      ` : ''}
    </div>
  `).join('');

  listEl.querySelectorAll('.option-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const inputs = Array.from(listEl.querySelectorAll('.option-input')).map(inp => inp.value);
      const correctIdx = Array.from(listEl.querySelectorAll('.option-radio')).findIndex(r => r.checked);

      const removeIdx = parseInt(btn.dataset.removeIdx);
      inputs.splice(removeIdx, 1);

      let newCorrectIdx = correctIdx;
      if (removeIdx === correctIdx) newCorrectIdx = 0;
      else if (removeIdx < correctIdx) newCorrectIdx--;

      renderEditOptions(inputs, newCorrectIdx);
    });
  });
}

function initializeEvents() {
  document.getElementById('search-databases')?.addEventListener('input', (e) => {
    renderDatabaseList(e.target.value);
  });

  document.getElementById('add-option-btn')?.addEventListener('click', () => {
    const listEl = document.getElementById('edit-options-list');
    const inputs = Array.from(listEl.querySelectorAll('.option-input')).map(inp => inp.value);
    const correctIdx = Array.from(listEl.querySelectorAll('.option-radio')).findIndex(r => r.checked);

    inputs.push('');
    renderEditOptions(inputs, correctIdx);
  });

  document.getElementById('close-edit-modal')?.addEventListener('click', closeEditModal);
  document.getElementById('cancel-edit')?.addEventListener('click', closeEditModal);

  document.getElementById('edit-question-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveQuestion();
  });

  // New database modal
  document.getElementById('new-database-btn')?.addEventListener('click', openNewDatabaseModal);
  document.getElementById('close-new-db-modal')?.addEventListener('click', closeNewDatabaseModal);
  document.getElementById('cancel-new-db')?.addEventListener('click', closeNewDatabaseModal);

  document.getElementById('new-database-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await createNewDatabase();
  });

  // Auto-generate database ID from product selection
  document.getElementById('new-db-product')?.addEventListener('change', (e) => {
    const productId = e.target.value;
    if (productId) {
      const suggestedId = `${productId}-questions`;
      document.getElementById('new-db-id').value = suggestedId;
    }
  });
}

function openNewDatabaseModal() {
  const modal = document.getElementById('new-database-modal');
  const productSelect = document.getElementById('new-db-product');

  // Populate products dropdown - only products without databaseId
  const productsWithoutDB = allProducts.filter(p => !p.databaseId);

  productSelect.innerHTML = '<option value="">Selecciona un producto...</option>' +
    productsWithoutDB.map(p => `<option value="${p.id}">${p.name || p.id}</option>`).join('');

  if (productsWithoutDB.length === 0) {
    productSelect.innerHTML = '<option value="">Todos los productos ya tienen base de datos</option>';
    productSelect.disabled = true;
  } else {
    productSelect.disabled = false;
  }

  document.getElementById('new-db-id').value = '';
  document.getElementById('new-db-questions').value = '';

  modal.classList.add('active');
}

function closeNewDatabaseModal() {
  document.getElementById('new-database-modal').classList.remove('active');
}

async function createNewDatabase() {
  const productId = document.getElementById('new-db-product').value;
  const databaseId = document.getElementById('new-db-id').value.trim();
  const questionsJSON = document.getElementById('new-db-questions').value.trim();

  if (!productId || !databaseId) {
    showToast('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  // Validate database ID format
  if (!/^[a-z0-9-]+$/.test(databaseId)) {
    showToast('El ID debe contener solo letras minúsculas, números y guiones', 'error');
    return;
  }

  try {
    // Update product with databaseId
    await updateDoc(doc(db, 'products', productId), {
      databaseId: databaseId,
      updatedAt: serverTimestamp()
    });

    // If questions provided, insert them
    if (questionsJSON) {
      const questions = JSON.parse(questionsJSON);
      if (!Array.isArray(questions)) {
        throw new Error('El JSON debe ser un array');
      }

      for (const question of questions) {
        await setDoc(doc(collection(db, databaseId)), {
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          topic: question.topic,
          explanation: question.explanation || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      showToast(`Base de datos creada con ${questions.length} preguntas`, 'success');
    } else {
      showToast('Base de datos creada exitosamente', 'success');
    }

    closeNewDatabaseModal();
    await loadProducts();
    await loadDatabases();
  } catch (error) {
    console.error('Error creating database:', error);
    showToast('Error al crear la base de datos: ' + error.message, 'error');
  }
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('active');
}

async function saveQuestion() {
  try {
    const questionId = document.getElementById('edit-question-id').value;
    const questionText = document.getElementById('edit-question-text').value;
    const topic = document.getElementById('edit-question-topic').value;
    const explanation = document.getElementById('edit-question-explanation').value;

    const listEl = document.getElementById('edit-options-list');
    const options = Array.from(listEl.querySelectorAll('.option-input')).map(inp => inp.value);
    const correctAnswer = Array.from(listEl.querySelectorAll('.option-radio')).findIndex(r => r.checked);

    if (correctAnswer === -1) {
      showToast('Por favor selecciona una respuesta correcta', 'error');
      return;
    }

    const questionData = {
      question: questionText,
      options,
      correctAnswer,
      topic,
      explanation: explanation || null,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, selectedDatabase.id, questionId), questionData);

    showToast('Pregunta actualizada exitosamente', 'success');
    closeEditModal();

    await loadQuestions(selectedDatabase.id);
  } catch (error) {
    console.error('Error saving question:', error);
    showToast('Error al guardar la pregunta', 'error');
  }
}

async function deleteQuestion(questionId) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta pregunta? Esta acción no se puede deshacer.')) {
    return;
  }

  try {
    await deleteDoc(doc(db, selectedDatabase.id, questionId));
    showToast('Pregunta eliminada exitosamente', 'success');
    await loadQuestions(selectedDatabase.id);
  } catch (error) {
    console.error('Error deleting question:', error);
    showToast('Error al eliminar la pregunta', 'error');
  }
}

function formatDate(date) {
  if (!date) return 'N/A';

  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days}d`;
  if (days < 30) return `Hace ${Math.floor(days / 7)}sem`;

  return date.toLocaleDateString('es-ES');
}

function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '✓' : '✕';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
