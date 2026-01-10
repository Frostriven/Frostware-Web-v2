import { auth, db, initializeFirebase } from '../../js/firebase.js';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc, query, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

let allDatabases = [];
let allProducts = [];
let selectedDatabase = null;
let allQuestions = [];
let filteredQuestions = [];
let currentPage = 1;
const questionsPerPage = 20;

// Helper function to wait for auth to be ready
function waitForAuth() {
  return new Promise((resolve, reject) => {
    // Check if auth is already available
    if (auth?.currentUser) {
      console.log('Auth already ready, user:', auth.currentUser.email);
      resolve(auth.currentUser);
      return;
    }

    // Otherwise wait for auth state change
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        console.log('Auth ready after state change, user:', user.email);
        resolve(user);
      } else {
        reject(new Error('No authenticated user'));
      }
    }, reject);
  });
}

export async function renderDatabaseManagementView() {
  const root = document.getElementById('spa-root');
  if (!root) return;

  // Ensure Firebase is initialized
  await initializeFirebase();

  // Wait for auth state to be ready
  try {
    const user = await waitForAuth();
    // Get fresh ID token to ensure Firestore has the auth context
    await user.getIdToken(true);
    console.log('Auth token refreshed');
  } catch (error) {
    console.error('Auth not ready:', error);
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

      .database-actions {
        display: flex;
        gap: 12px;
        margin-top: 16px;
      }

      .btn-danger {
        background: #dc2626;
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

      .btn-danger:hover {
        background: #b91c1c;
      }

      .btn-success {
        background: #16a34a;
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

      .btn-success:hover {
        background: #15803d;
      }

      .json-upload-area {
        border: 2px dashed #d1d5db;
        border-radius: 8px;
        padding: 24px;
        text-align: center;
        background: #f9fafb;
        cursor: pointer;
        transition: all 0.2s;
      }

      .json-upload-area:hover {
        border-color: #22a7d0;
        background: #f0f9ff;
      }

      .json-analysis {
        background: #f0f9ff;
        border: 1px solid #22a7d0;
        border-radius: 8px;
        padding: 20px;
        margin-top: 16px;
      }

      .analysis-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .analysis-icon {
        width: 40px;
        height: 40px;
        background: #22a7d0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
      }

      .analysis-title {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .analysis-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 20px;
      }

      .analysis-stat {
        padding: 12px;
        background: white;
        border-radius: 6px;
        text-align: center;
      }

      .analysis-stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #22a7d0;
      }

      .analysis-stat-label {
        font-size: 12px;
        color: #6b7280;
        margin-top: 4px;
      }

      .analysis-details {
        background: white;
        border-radius: 6px;
        padding: 16px;
        max-height: 300px;
        overflow-y: auto;
      }

      .analysis-questions-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .analysis-question-item {
        padding: 12px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 14px;
        color: #374151;
      }

      .analysis-question-item:last-child {
        border-bottom: none;
      }

      .analysis-question-meta {
        display: flex;
        gap: 12px;
        margin-top: 4px;
        font-size: 12px;
        color: #9ca3af;
      }

      .warning-box {
        background: #fef2f2;
        border: 1px solid #fca5a5;
        border-radius: 8px;
        padding: 16px;
        margin-top: 16px;
      }

      .warning-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .warning-icon {
        color: #dc2626;
        font-size: 24px;
      }

      .warning-title {
        font-size: 16px;
        font-weight: 600;
        color: #dc2626;
      }

      .warning-text {
        font-size: 14px;
        color: #991b1b;
        line-height: 1.5;
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

      <!-- Process JSON Modal -->
      <div class="modal-overlay" id="process-json-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Procesar JSON de Preguntas</h3>
            <button class="modal-close" id="close-process-json-modal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Pega tu JSON aquí</label>
              <textarea class="form-textarea" id="json-input" rows="15" placeholder='{"questions": [...]}'></textarea>
              <p class="form-hint">Formato esperado: objeto con array "questions" o array directo de preguntas</p>
            </div>

            <button type="button" class="btn-primary" id="analyze-json-btn" style="width: 100%;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 5v3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Analizar JSON
            </button>

            <div id="json-analysis-result"></div>
          </div>
          <div class="modal-footer" id="json-modal-footer">
            <button class="modal-btn modal-btn-cancel" type="button" id="cancel-process-json">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Delete Database Modal -->
      <div class="modal-overlay" id="delete-database-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Eliminar Base de Datos</h3>
            <button class="modal-close" id="close-delete-db-modal">×</button>
          </div>
          <div class="modal-body">
            <div class="warning-box">
              <div class="warning-header">
                <span class="warning-icon">⚠️</span>
                <span class="warning-title">¡Advertencia de Seguridad!</span>
              </div>
              <p class="warning-text">
                Estás a punto de eliminar <strong id="delete-db-name"></strong> que contiene
                <strong id="delete-question-count"></strong> preguntas.
              </p>
              <p class="warning-text" style="margin-top: 12px;">
                Esta acción es <strong>irreversible</strong> y eliminará permanentemente todas las preguntas
                de esta base de datos. El producto seguirá existiendo pero sin preguntas asociadas.
              </p>
            </div>

            <div class="form-group" style="margin-top: 20px;">
              <label class="form-label">Para confirmar, escribe "ELIMINAR" en mayúsculas:</label>
              <input type="text" class="form-input" id="delete-confirmation-input" placeholder="ELIMINAR" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="modal-btn modal-btn-cancel" type="button" id="cancel-delete-db">Cancelar</button>
            <button class="modal-btn btn-danger" type="button" id="confirm-delete-db" disabled>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M5.5 4V2.5A1.5 1.5 0 0 1 7 1h2a1.5 1.5 0 0 1 1.5 1.5V4m2 0v9.5A1.5 1.5 0 0 1 11 15H5a1.5 1.5 0 0 1-1.5-1.5V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Eliminar Base de Datos
            </button>
          </div>
        </div>
      </div>

      <!-- Reset Statistics Modal -->
      <div class="modal-overlay" id="reset-stats-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Restablecer Estadísticas</h3>
            <button class="modal-close" id="close-reset-stats-modal">×</button>
          </div>
          <div class="modal-body">
            <div class="warning-box">
              <div class="warning-header">
                <span class="warning-icon">⚠️</span>
                <span class="warning-title">¡Advertencia!</span>
              </div>
              <p class="warning-text">
                Estás a punto de restablecer todas las estadísticas de los usuarios para el producto
                <strong id="reset-stats-product-name"></strong>.
              </p>
              <p class="warning-text" style="margin-top: 12px;">
                Esta acción eliminará:
              </p>
              <ul class="warning-text" style="margin-top: 8px; padding-left: 20px;">
                <li>Todas las sesiones de práctica y examen</li>
                <li>Estadísticas acumuladas (puntuaciones, tiempo, rachas)</li>
                <li>Estadísticas por tema</li>
                <li>Preguntas marcadas como difíciles</li>
              </ul>
              <p class="warning-text" style="margin-top: 12px; color: #ef4444; font-weight: 600;">
                Esta acción es <strong>irreversible</strong> y afectará a todos los usuarios que tengan este producto.
              </p>
            </div>

            <div class="form-group" style="margin-top: 20px;">
              <label class="form-label">Para confirmar, escribe "RESTABLECER" en mayúsculas:</label>
              <input type="text" class="form-input" id="reset-stats-confirmation-input" placeholder="RESTABLECER" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="modal-btn modal-btn-cancel" type="button" id="cancel-reset-stats">Cancelar</button>
            <button class="modal-btn" type="button" id="confirm-reset-stats" disabled style="background-color: #f59e0b; border-color: #f59e0b;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 8c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5v3l4-4-4-4v3c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Restablecer Estadísticas
            </button>
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
    // Log auth state for debugging
    console.log('Loading databases with auth state:', {
      isAuthenticated: !!auth?.currentUser,
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email
    });

    // Ensure we have a fresh token before making Firestore calls
    if (auth?.currentUser) {
      try {
        await auth.currentUser.getIdToken(true);
        console.log('Token refreshed before loading databases');
      } catch (tokenError) {
        console.error('Error refreshing token:', tokenError);
      }
    }

    const productsSnapshot = await getDocs(collection(db, 'products'));
    const databases = [];

    // Helper to get localized text
    const getText = (value, lang = 'es') => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'object') {
        return value[lang] || value['es'] || value['en'] || Object.values(value)[0] || '';
      }
      return String(value);
    };

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

        // Get localized product name
        const productName = getText(product.name) || getText(product.title) || productDoc.id;

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
    console.error('Error details:', error.message, error.stack);
    showToast('Error al cargar bases de datos: ' + error.message, 'error');
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
      <div class="database-actions">
        <button class="btn-success" id="process-json-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Procesar JSON
        </button>
        <button class="btn-warning" id="reset-stats-btn" style="background-color: #f59e0b; border-color: #f59e0b;">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5v3l4-4-4-4v3c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Restablecer Estadísticas
        </button>
        <button class="btn-danger" id="delete-database-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M5.5 4V2.5A1.5 1.5 0 0 1 7 1h2a1.5 1.5 0 0 1 1.5 1.5V4m2 0v9.5A1.5 1.5 0 0 1 11 15H5a1.5 1.5 0 0 1-1.5-1.5V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Eliminar Base de Datos
        </button>
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
      ${pageQuestions.map(question => {
        const questionText = getLocalizedText(question.question);
        const topic = getLocalizedText(question.topic) || 'Sin tema';

        return `
        <div class="question-card">
          <div class="question-header">
            <div class="question-topic">${topic}</div>
            <div class="question-actions">
              <button class="question-btn" data-action="edit" data-question-id="${question.id}">Editar</button>
              <button class="question-btn danger" data-action="delete" data-question-id="${question.id}">Eliminar</button>
            </div>
          </div>
          <div class="question-text">${questionText}</div>
          <div class="question-options">
            ${question.options?.map((option, idx) => {
              const optionText = getLocalizedText(option);
              return `
                <div class="question-option ${idx === question.correctAnswer ? 'correct' : ''}">
                  ${String.fromCharCode(65 + idx)}. ${optionText}
                </div>
              `;
            }).join('') || ''}
          </div>
          <div class="question-meta">
            <span>ID: ${question.id.substring(0, 8)}...</span>
            ${question.updatedAt ? `<span>Actualizado: ${formatDate(question.updatedAt.toDate())}</span>` :
              question.createdAt ? `<span>Creado: ${formatDate(question.createdAt.toDate())}</span>` : ''}
          </div>
        </div>
      `;
      }).join('')}
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

  // Process JSON, Reset Stats and Delete Database buttons
  document.getElementById('process-json-btn')?.addEventListener('click', openProcessJsonModal);
  document.getElementById('reset-stats-btn')?.addEventListener('click', openResetStatsModal);
  document.getElementById('delete-database-btn')?.addEventListener('click', openDeleteDatabaseModal);
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

  // Handle multilingual or simple text
  const questionText = getLocalizedText(question.question);
  const topic = getLocalizedText(question.topic);
  const explanation = getLocalizedText(question.explanation);

  document.getElementById('edit-question-text').value = questionText;
  document.getElementById('edit-question-topic').value = topic || '';
  document.getElementById('edit-question-explanation').value = explanation || '';

  // Process options to handle multilingual format
  const processedOptions = (question.options || []).map(opt => getLocalizedText(opt));

  renderEditOptions(processedOptions, question.correctAnswer || 0);

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
    productsWithoutDB.map(p => {
      // Handle both string and object name formats
      const displayName = typeof p.name === 'string'
        ? p.name
        : (p.name?.es || p.name?.en || p.title?.es || p.title?.en || p.id);
      return `<option value="${p.id}">${displayName}</option>`;
    }).join('');

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
      let parsed = JSON.parse(questionsJSON);
      let questions = [];

      // Handle both formats: {questions: [...]} or [...]
      if (Array.isArray(parsed)) {
        questions = parsed;
      } else if (parsed.questions && Array.isArray(parsed.questions)) {
        questions = parsed.questions;
      } else {
        throw new Error('Formato inválido. Se esperaba un array o un objeto con propiedad "questions"');
      }

      if (questions.length === 0) {
        throw new Error('No se encontraron preguntas en el JSON');
      }

      for (const question of questions) {
        await setDoc(doc(collection(db, databaseId)), {
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          topic: question.topic,
          explanation: question.explanation || null,
          image: question.image || null,
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

// Helper function to get localized text (for multilingual support)
function getLocalizedText(value, lang = 'es') {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[lang] || value['es'] || value['en'] || Object.values(value)[0] || '';
  }
  return String(value);
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

// Process JSON Modal Functions
let analyzedQuestions = [];

function openProcessJsonModal() {
  document.getElementById('json-input').value = '';
  document.getElementById('json-analysis-result').innerHTML = '';
  document.getElementById('json-modal-footer').innerHTML = `
    <button class="modal-btn modal-btn-cancel" type="button" id="cancel-process-json">Cancelar</button>
  `;
  document.getElementById('process-json-modal').classList.add('active');

  // Event listeners for modal
  document.getElementById('close-process-json-modal').addEventListener('click', closeProcessJsonModal);
  document.getElementById('cancel-process-json').addEventListener('click', closeProcessJsonModal);
  document.getElementById('analyze-json-btn').addEventListener('click', analyzeJSON);
}

function closeProcessJsonModal() {
  document.getElementById('process-json-modal').classList.remove('active');
  analyzedQuestions = [];
}

function analyzeJSON() {
  const jsonInput = document.getElementById('json-input').value.trim();
  const resultDiv = document.getElementById('json-analysis-result');

  if (!jsonInput) {
    resultDiv.innerHTML = `
      <div class="warning-box" style="margin-top: 16px;">
        <div class="warning-header">
          <span class="warning-icon">⚠️</span>
          <span class="warning-title">Error</span>
        </div>
        <p class="warning-text">Por favor ingresa un JSON válido</p>
      </div>
    `;
    return;
  }

  try {
    let parsed = JSON.parse(jsonInput);
    let questions = [];

    // Handle both formats: {questions: [...]} or [...]
    if (Array.isArray(parsed)) {
      questions = parsed;
    } else if (parsed.questions && Array.isArray(parsed.questions)) {
      questions = parsed.questions;
    } else {
      throw new Error('Formato inválido. Se esperaba un array o un objeto con propiedad "questions"');
    }

    if (questions.length === 0) {
      throw new Error('No se encontraron preguntas en el JSON');
    }

    // Validate questions structure
    const errors = [];
    const topicCounts = {};
    const languageCounts = { multiLanguage: 0, singleLanguage: 0 };

    questions.forEach((q, idx) => {
      // Check for multilingual format
      const isMultiLang = typeof q.question === 'object' && (q.question.en || q.question.es);

      if (isMultiLang) {
        languageCounts.multiLanguage++;
      } else {
        languageCounts.singleLanguage++;
      }

      // Get question text for display
      const questionText = isMultiLang
        ? (q.question.es || q.question.en)
        : q.question;

      if (!questionText) {
        errors.push(`Pregunta ${idx + 1}: falta el campo "question"`);
      }
      if (!q.options || !Array.isArray(q.options)) {
        errors.push(`Pregunta ${idx + 1}: falta el campo "options" o no es un array`);
      }
      if (q.correctAnswer === undefined || q.correctAnswer === null) {
        errors.push(`Pregunta ${idx + 1}: falta el campo "correctAnswer"`);
      }
      if (!q.topic) {
        errors.push(`Pregunta ${idx + 1}: falta el campo "topic"`);
      } else {
        const topic = typeof q.topic === 'object' ? (q.topic.es || q.topic.en) : q.topic;
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    });

    if (errors.length > 0) {
      resultDiv.innerHTML = `
        <div class="warning-box" style="margin-top: 16px;">
          <div class="warning-header">
            <span class="warning-icon">⚠️</span>
            <span class="warning-title">Errores de Validación</span>
          </div>
          <ul style="margin: 12px 0 0 20px; color: #991b1b;">
            ${errors.map(err => `<li>${err}</li>`).join('')}
          </ul>
        </div>
      `;
      return;
    }

    // Store analyzed questions
    analyzedQuestions = questions;

    // Display analysis
    const topics = Object.keys(topicCounts);
    const formatInfo = languageCounts.multiLanguage > 0
      ? `Multiidioma (${languageCounts.multiLanguage} preguntas)`
      : 'Idioma único';

    resultDiv.innerHTML = `
      <div class="json-analysis">
        <div class="analysis-header">
          <div class="analysis-icon">✓</div>
          <div class="analysis-title">JSON Válido - Listo para Insertar</div>
        </div>

        <div class="analysis-stats">
          <div class="analysis-stat">
            <div class="analysis-stat-value">${questions.length}</div>
            <div class="analysis-stat-label">Preguntas Detectadas</div>
          </div>
          <div class="analysis-stat">
            <div class="analysis-stat-value">${topics.length}</div>
            <div class="analysis-stat-label">Temas Diferentes</div>
          </div>
          <div class="analysis-stat">
            <div class="analysis-stat-value">${formatInfo}</div>
            <div class="analysis-stat-label">Formato</div>
          </div>
        </div>

        <div class="analysis-details">
          <h4 style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 12px;">Vista Previa de Preguntas:</h4>
          <ul class="analysis-questions-list">
            ${questions.slice(0, 5).map((q, idx) => {
              const questionText = typeof q.question === 'object'
                ? (q.question.es || q.question.en)
                : q.question;
              const topic = typeof q.topic === 'object'
                ? (q.topic.es || q.topic.en)
                : q.topic;
              return `
                <li class="analysis-question-item">
                  <strong>${idx + 1}.</strong> ${questionText.substring(0, 80)}${questionText.length > 80 ? '...' : ''}
                  <div class="analysis-question-meta">
                    <span>Tema: ${topic}</span>
                    <span>${q.options?.length || 0} opciones</span>
                    ${typeof q.question === 'object' ? '<span>🌐 Multiidioma</span>' : ''}
                  </div>
                </li>
              `;
            }).join('')}
            ${questions.length > 5 ? `<li class="analysis-question-item" style="text-align: center; color: #6b7280;">... y ${questions.length - 5} preguntas más</li>` : ''}
          </ul>
        </div>

        <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px;">
          <p style="font-size: 13px; color: #92400e; margin: 0;">
            <strong>📝 Nota:</strong> Las preguntas se insertarán en la base de datos "${selectedDatabase.id}".
            Las opciones se aleatorizarán automáticamente al cargar en el modo práctica.
          </p>
        </div>
      </div>
    `;

    // Update footer with insert button
    document.getElementById('json-modal-footer').innerHTML = `
      <button class="modal-btn modal-btn-cancel" type="button" id="cancel-process-json-after">Cancelar</button>
      <button class="modal-btn btn-success" type="button" id="insert-questions-btn">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Insertar ${questions.length} Preguntas
      </button>
    `;

    document.getElementById('cancel-process-json-after').addEventListener('click', closeProcessJsonModal);
    document.getElementById('insert-questions-btn').addEventListener('click', insertQuestionsFromJSON);

  } catch (error) {
    resultDiv.innerHTML = `
      <div class="warning-box" style="margin-top: 16px;">
        <div class="warning-header">
          <span class="warning-icon">⚠️</span>
          <span class="warning-title">Error al Procesar JSON</span>
        </div>
        <p class="warning-text">${error.message}</p>
      </div>
    `;
  }
}

async function insertQuestionsFromJSON() {
  if (analyzedQuestions.length === 0) {
    showToast('No hay preguntas para insertar', 'error');
    return;
  }

  const insertBtn = document.getElementById('insert-questions-btn');
  insertBtn.disabled = true;
  insertBtn.textContent = 'Insertando...';

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const question of analyzedQuestions) {
      try {
        await setDoc(doc(collection(db, selectedDatabase.id)), {
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          topic: question.topic,
          explanation: question.explanation || null,
          image: question.image || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        successCount++;
      } catch (err) {
        console.error('Error inserting question:', err);
        errorCount++;
      }
    }

    if (errorCount === 0) {
      showToast(`${successCount} preguntas insertadas exitosamente`, 'success');
    } else {
      showToast(`${successCount} insertadas, ${errorCount} con errores`, 'error');
    }

    closeProcessJsonModal();
    await loadQuestions(selectedDatabase.id);
    await loadDatabases(); // Refresh counts

  } catch (error) {
    console.error('Error inserting questions:', error);
    showToast('Error al insertar preguntas: ' + error.message, 'error');
    insertBtn.disabled = false;
    insertBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Insertar ${analyzedQuestions.length} Preguntas
    `;
  }
}

// Delete Database Modal Functions
function openDeleteDatabaseModal() {
  document.getElementById('delete-db-name').textContent = selectedDatabase.name;
  document.getElementById('delete-question-count').textContent = `${allQuestions.length}`;
  document.getElementById('delete-confirmation-input').value = '';
  document.getElementById('confirm-delete-db').disabled = true;

  document.getElementById('delete-database-modal').classList.add('active');

  // Event listeners
  document.getElementById('close-delete-db-modal').addEventListener('click', closeDeleteDatabaseModal);
  document.getElementById('cancel-delete-db').addEventListener('click', closeDeleteDatabaseModal);

  const confirmInput = document.getElementById('delete-confirmation-input');
  confirmInput.addEventListener('input', () => {
    document.getElementById('confirm-delete-db').disabled = confirmInput.value !== 'ELIMINAR';
  });

  document.getElementById('confirm-delete-db').addEventListener('click', deleteDatabase);
}

function closeDeleteDatabaseModal() {
  document.getElementById('delete-database-modal').classList.remove('active');
}

async function deleteDatabase() {
  const confirmBtn = document.getElementById('confirm-delete-db');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Eliminando...';

  try {
    // Delete all questions from the database
    const questionsSnapshot = await getDocs(collection(db, selectedDatabase.id));

    const deletePromises = questionsSnapshot.docs.map(questionDoc =>
      deleteDoc(doc(db, selectedDatabase.id, questionDoc.id))
    );

    await Promise.all(deletePromises);

    // Update product to remove databaseId reference
    const productRef = doc(db, 'products', selectedDatabase.productId);
    await updateDoc(productRef, {
      databaseId: null,
      updatedAt: serverTimestamp()
    });

    showToast(`Base de datos "${selectedDatabase.name}" eliminada exitosamente`, 'success');

    closeDeleteDatabaseModal();
    selectedDatabase = null;
    await loadProducts();
    await loadDatabases();

    // Show empty state
    const contentEl = document.getElementById('db-content');
    contentEl.innerHTML = `
      <div class="db-empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-title">Selecciona una base de datos</div>
        <div class="empty-text">Elige una base de datos de la lista para ver y gestionar sus preguntas</div>
      </div>
    `;

  } catch (error) {
    console.error('Error deleting database:', error);
    showToast('Error al eliminar la base de datos: ' + error.message, 'error');
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M5.5 4V2.5A1.5 1.5 0 0 1 7 1h2a1.5 1.5 0 0 1 1.5 1.5V4m2 0v9.5A1.5 1.5 0 0 1 11 15H5a1.5 1.5 0 0 1-1.5-1.5V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Eliminar Base de Datos
    `;
  }
}

function openResetStatsModal() {
  const productName = typeof selectedDatabase.name === 'string'
    ? selectedDatabase.name
    : (selectedDatabase.name?.es || selectedDatabase.name?.en || selectedDatabase.productId);

  document.getElementById('reset-stats-product-name').textContent = productName;
  document.getElementById('reset-stats-confirmation-input').value = '';
  document.getElementById('confirm-reset-stats').disabled = true;

  document.getElementById('reset-stats-modal').classList.add('active');

  // Event listeners
  document.getElementById('close-reset-stats-modal').addEventListener('click', closeResetStatsModal);
  document.getElementById('cancel-reset-stats').addEventListener('click', closeResetStatsModal);

  const confirmInput = document.getElementById('reset-stats-confirmation-input');
  confirmInput.addEventListener('input', () => {
    document.getElementById('confirm-reset-stats').disabled = confirmInput.value !== 'RESTABLECER';
  });

  document.getElementById('confirm-reset-stats').addEventListener('click', resetStatistics);
}

function closeResetStatsModal() {
  document.getElementById('reset-stats-modal').classList.remove('active');
}

async function resetStatistics() {
  const confirmBtn = document.getElementById('confirm-reset-stats');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Restableciendo...';

  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let deletedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Delete stats document for this product
      const statsRef = doc(db, 'users', userId, 'stats', selectedDatabase.productId);
      const statsSnap = await getDoc(statsRef);
      if (statsSnap.exists()) {
        await deleteDoc(statsRef);
        deletedCount++;
      }

      // Delete all sessions for this product
      const sessionsSnapshot = await getDocs(collection(db, 'users', userId, 'sessions'));
      const sessionDeletePromises = sessionsSnapshot.docs
        .filter(sessionDoc => sessionDoc.data().productId === selectedDatabase.productId)
        .map(sessionDoc => deleteDoc(doc(db, 'users', userId, 'sessions', sessionDoc.id)));

      await Promise.all(sessionDeletePromises);
    }

    showToast(`Estadísticas restablecidas para ${deletedCount} usuario(s)`, 'success');

    closeResetStatsModal();
  } catch (error) {
    console.error('Error resetting statistics:', error);
    showToast('Error al restablecer estadísticas: ' + error.message, 'error');
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M13 8c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5v3l4-4-4-4v3c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Restablecer Estadísticas
    `;
  }
}
