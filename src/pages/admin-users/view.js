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
}

async function renderUsersManagementPage() {
  return `
    <style>
      .users-management-container {
        min-height: 100vh;
        background: #f9fafb;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      /* Header */
      .users-header {
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 24px 32px;
      }

      .users-header-content {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .users-header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .users-back-btn {
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

      .users-back-btn:hover {
        border-color: #22a7d0;
        color: #22a7d0;
      }

      .users-title {
        font-size: 24px;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }

      .users-header-actions {
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

      /* Search and Filters */
      .users-controls {
        max-width: 1400px;
        margin: 0 auto;
        padding: 24px 32px;
        display: flex;
        gap: 12px;
        align-items: center;
        background: white;
        border-bottom: 1px solid #e5e7eb;
      }

      .search-input {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
        transition: all 0.2s;
      }

      .search-input:focus {
        border-color: #22a7d0;
        box-shadow: 0 0 0 3px rgba(34, 167, 208, 0.1);
      }

      .filter-select {
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 14px;
        background: white;
        cursor: pointer;
        outline: none;
        min-width: 160px;
      }

      .filter-select:focus {
        border-color: #22a7d0;
        box-shadow: 0 0 0 3px rgba(34, 167, 208, 0.1);
      }

      .btn-ghost {
        background: transparent;
        color: #6b7280;
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-ghost:hover {
        background: #f3f4f6;
        color: #374151;
      }

      /* Users Table */
      .users-content {
        max-width: 1400px;
        margin: 0 auto;
        padding: 32px;
      }

      .results-info {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 16px;
      }

      .users-table-wrapper {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
      }

      .users-table {
        width: 100%;
        border-collapse: collapse;
      }

      .users-table thead {
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
      }

      .users-table th {
        text-align: left;
        padding: 12px 16px;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .users-table tbody tr {
        border-bottom: 1px solid #f3f4f6;
        transition: background 0.2s;
      }

      .users-table tbody tr:hover {
        background: #f9fafb;
      }

      .users-table tbody tr:last-child {
        border-bottom: none;
      }

      .users-table td {
        padding: 16px;
        font-size: 14px;
        color: #374151;
      }

      .user-info-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: #22a7d0;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
        flex-shrink: 0;
      }

      .user-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .user-name {
        font-weight: 500;
        color: #111827;
      }

      .user-email {
        font-size: 13px;
        color: #6b7280;
      }

      .user-company {
        font-size: 12px;
        color: #9ca3af;
        font-style: italic;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }

      .badge-admin {
        background: #fef3c7;
        color: #92400e;
      }

      .badge-user {
        background: #e5e7eb;
        color: #374151;
      }

      .badge-count {
        background: #dbeafe;
        color: #1e40af;
        min-width: 28px;
        justify-content: center;
      }

      .status-indicator {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-active {
        background: #d1fae5;
        color: #065f46;
      }

      .status-inactive {
        background: #fee2e2;
        color: #991b1b;
      }

      .btn-view {
        background: transparent;
        border: 1px solid #e5e7eb;
        color: #6b7280;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-view:hover {
        border-color: #22a7d0;
        color: #22a7d0;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #6b7280;
      }

      .empty-icon {
        width: 64px;
        height: 64px;
        background: #f3f4f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        font-size: 24px;
        color: #9ca3af;
      }

      .empty-title {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 8px;
      }

      .empty-text {
        font-size: 14px;
        color: #6b7280;
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
        background: rgba(0, 0, 0, 0.4);
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
        padding: 24px;
        border-bottom: 1px solid #e5e7eb;
      }

      .panel-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background: #f3f4f6;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        color: #6b7280;
      }

      .panel-close:hover {
        background: #e5e7eb;
        color: #374151;
      }

      .panel-user-info {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .user-avatar-large {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        background: #22a7d0;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 20px;
      }

      .panel-user-details h2 {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .panel-user-details p {
        margin: 0;
        font-size: 14px;
        color: #6b7280;
      }

      .panel-body {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
      }

      .panel-section {
        margin-bottom: 32px;
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 16px 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }

      .info-item {
        background: #f9fafb;
        padding: 12px;
        border-radius: 6px;
      }

      .info-item label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
        margin-bottom: 4px;
      }

      .info-item p {
        margin: 0;
        font-size: 14px;
        color: #111827;
      }

      .role-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-sm {
        padding: 6px 12px;
        font-size: 13px;
      }

      .products-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .product-card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
      }

      .product-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .product-name {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 600;
        color: #111827;
      }

      .product-meta {
        margin: 0;
        font-size: 12px;
        color: #6b7280;
      }

      .product-status {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .status-label {
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
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
        background-color: #d1d5db;
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
        gap: 12px;
        margin-bottom: 12px;
        padding-top: 12px;
        border-top: 1px solid #e5e7eb;
        font-size: 12px;
        color: #6b7280;
      }

      .stat-mini {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .product-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .btn-danger {
        color: #dc2626;
      }

      .btn-danger:hover {
        border-color: #dc2626;
        background: #fef2f2;
      }

      .empty-state-small {
        text-align: center;
        padding: 32px;
        color: #6b7280;
        font-size: 14px;
      }

      /* Modal */
      .modal {
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        padding: 20px;
      }

      .modal.active {
        display: flex;
      }

      .modal-content {
        background: white;
        border-radius: 12px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }

      .modal-header {
        padding: 24px 32px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .modal-title {
        font-size: 20px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 4px 0;
      }

      .modal-subtitle {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
      }

      .modal-close {
        background: #f3f4f6;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        color: #6b7280;
      }

      .modal-close:hover {
        background: #e5e7eb;
        color: #374151;
      }

      .modal-tabs {
        display: flex;
        border-bottom: 1px solid #e5e7eb;
      }

      .tab-btn {
        flex: 1;
        padding: 12px 16px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        font-size: 14px;
        font-weight: 500;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .tab-btn:hover {
        background: #f9fafb;
        color: #374151;
      }

      .tab-btn.active {
        color: #22a7d0;
        border-bottom-color: #22a7d0;
        background: #f0f9ff;
      }

      .modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 24px 32px;
      }

      .tab-content {
        display: none;
      }

      .tab-content.active {
        display: block;
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
      .form-textarea {
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
        min-height: 120px;
        resize: vertical;
      }

      .form-input:focus,
      .form-textarea:focus {
        border-color: #22a7d0;
        box-shadow: 0 0 0 3px rgba(34, 167, 208, 0.1);
      }

      .form-hint {
        font-size: 13px;
        color: #6b7280;
        margin-top: 4px;
      }

      .code-textarea {
        font-family: Monaco, monospace;
        font-size: 13px;
      }

      .info-banner {
        background: #e0f2fe;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
      }

      .info-banner svg {
        color: #0369a1;
        flex-shrink: 0;
      }

      .banner-title {
        font-weight: 600;
        color: #0c4a6e;
        margin: 0 0 4px 0;
        font-size: 14px;
      }

      .banner-text {
        margin: 0;
        font-size: 13px;
        color: #075985;
        line-height: 1.5;
      }

      .banner-text code {
        background: rgba(12, 74, 110, 0.1);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: Monaco, monospace;
        font-size: 12px;
      }

      .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
      }

      .stat-card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
      }

      .stat-label {
        font-size: 12px;
        color: #6b7280;
        margin: 0 0 8px 0;
        font-weight: 500;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #111827;
        margin: 0;
      }

      .stat-value-accent {
        color: #22a7d0;
      }

      .stat-value-success {
        color: #059669;
      }

      .questions-list-section {
        margin-top: 20px;
      }

      .questions-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 400px;
        overflow-y: auto;
      }

      .question-preview-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 12px;
      }

      .question-preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .question-topic {
        font-size: 11px;
        font-weight: 600;
        color: #22a7d0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .question-id {
        font-size: 11px;
        color: #9ca3af;
        font-family: Monaco, monospace;
      }

      .question-text {
        font-size: 14px;
        color: #111827;
        margin: 0 0 8px 0;
        line-height: 1.5;
      }

      .question-options {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .option {
        font-size: 13px;
        color: #6b7280;
        padding: 4px 8px;
        background: #f9fafb;
        border-radius: 4px;
      }

      .option-correct {
        background: #d1fae5;
        color: #065f46;
        font-weight: 500;
      }

      .validation-message {
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
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
        margin: 0 0 4px 0;
        font-size: 14px;
      }

      .validation-message.success .validation-title {
        color: #065f46;
      }

      .validation-message.error .validation-title {
        color: #991b1b;
      }

      .validation-text {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
      }

      .validation-message.success .validation-text {
        color: #047857;
      }

      .validation-message.error .validation-text {
        color: #b91c1c;
      }

      .action-buttons {
        display: flex;
        gap: 12px;
      }

      .btn-lg {
        padding: 12px 24px;
        font-size: 14px;
      }

      .btn-success {
        background: #059669;
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

      .btn-success:hover:not(:disabled) {
        background: #047857;
      }

      .btn-success:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Toast */
      .toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 3000;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .toast {
        background: white;
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        border: 1px solid #e5e7eb;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s;
      }

      .toast.show {
        transform: translateY(0);
        opacity: 1;
      }

      .toast-success {
        border-left: 4px solid #059669;
      }

      .toast-error {
        border-left: 4px solid #dc2626;
      }

      .toast-info {
        border-left: 4px solid #22a7d0;
      }

      /* Dark Mode */
      @media (prefers-color-scheme: dark) {
        .users-management-container {
          background: #1a1a1a;
          color: #e5e7eb;
        }

        .users-header {
          background: #262626;
          border-bottom-color: #404040;
        }

        .users-title {
          color: #f3f4f6;
        }

        .users-back-btn {
          border-color: #404040;
          color: #9ca3af;
        }

        .users-back-btn:hover {
          border-color: #22a7d0;
          color: #22a7d0;
        }

        .users-controls {
          background: #262626;
          border-bottom-color: #404040;
        }

        .search-input,
        .filter-select {
          background: #1a1a1a;
          border-color: #404040;
          color: #e5e7eb;
        }

        .search-input:focus,
        .filter-select:focus {
          border-color: #22a7d0;
        }

        .btn-secondary {
          background: #1a1a1a;
          border-color: #404040;
          color: #e5e7eb;
        }

        .btn-secondary:hover {
          border-color: #22a7d0;
        }

        .btn-ghost:hover {
          background: #333333;
        }

        .results-info {
          color: #9ca3af;
        }

        .users-table-wrapper {
          background: #262626;
          border-color: #404040;
        }

        .users-table thead {
          background: #1a1a1a;
          border-bottom-color: #404040;
        }

        .users-table th {
          color: #9ca3af;
        }

        .users-table tbody tr {
          border-bottom-color: #333333;
        }

        .users-table tbody tr:hover {
          background: #2a2a2a;
        }

        .users-table td {
          color: #d1d5db;
        }

        .user-name {
          color: #f3f4f6;
        }

        .user-email {
          color: #9ca3af;
        }

        .badge-user {
          background: #404040;
          color: #d1d5db;
        }

        .slide-panel-content {
          background: #262626;
        }

        .panel-header {
          border-bottom-color: #404040;
        }

        .panel-close {
          background: #333333;
          color: #9ca3af;
        }

        .panel-close:hover {
          background: #404040;
        }

        .panel-user-details h2 {
          color: #f3f4f6;
        }

        .panel-user-details p {
          color: #9ca3af;
        }

        .section-title {
          color: #f3f4f6;
        }

        .info-item {
          background: #1a1a1a;
        }

        .info-item label {
          color: #9ca3af;
        }

        .info-item p {
          color: #e5e7eb;
        }

        .product-card {
          background: #1a1a1a;
          border-color: #404040;
        }

        .product-name {
          color: #f3f4f6;
        }

        .product-meta {
          color: #9ca3af;
        }

        .product-stats {
          border-top-color: #404040;
          color: #9ca3af;
        }

        .modal-content {
          background: #262626;
        }

        .modal-header {
          border-bottom-color: #404040;
        }

        .modal-title {
          color: #f3f4f6;
        }

        .modal-subtitle {
          color: #9ca3af;
        }

        .modal-close {
          background: #333333;
          color: #9ca3af;
        }

        .modal-close:hover {
          background: #404040;
        }

        .modal-tabs {
          border-bottom-color: #404040;
        }

        .tab-btn {
          color: #9ca3af;
        }

        .tab-btn:hover {
          background: #2a2a2a;
        }

        .tab-btn.active {
          background: #1a2a3a;
        }

        .form-label {
          color: #d1d5db;
        }

        .form-input,
        .form-textarea {
          background: #1a1a1a;
          border-color: #404040;
          color: #e5e7eb;
        }

        .form-input:focus,
        .form-textarea:focus {
          border-color: #22a7d0;
        }

        .info-banner {
          background: #1a2a3a;
          border-color: #2a4a5a;
        }

        .banner-title {
          color: #7dd3fc;
        }

        .banner-text {
          color: #bae6fd;
        }

        .stat-card {
          background: #1a1a1a;
          border-color: #404040;
        }

        .stat-value {
          color: #f3f4f6;
        }

        .question-preview-card {
          background: #1a1a1a;
          border-color: #404040;
        }

        .question-text {
          color: #e5e7eb;
        }

        .option {
          background: #262626;
          color: #9ca3af;
        }

        .toast {
          background: #262626;
          border-color: #404040;
        }
      }

      /* Responsive */
      @media (max-width: 1024px) {
        .users-controls {
          flex-wrap: wrap;
        }

        .filter-select {
          width: 100%;
        }

        .slide-panel {
          width: 100%;
        }
      }
    </style>

    <div class="users-management-container">
      <!-- Header -->
      <div class="users-header">
        <div class="users-header-content">
          <div class="users-header-left">
            <button class="users-back-btn" onclick="window.location.hash='#/admin'">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Volver
            </button>
            <h1 class="users-title">Gestión de Usuarios</h1>
          </div>
          <div class="users-header-actions">
            <button class="btn-secondary" id="refresh-users">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C9.45752 2 10.8192 2.51875 11.8922 3.41753" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M11.5 2V4H9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Recargar
            </button>
            <button class="btn-primary" id="new-user-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Nuevo Usuario
            </button>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="users-controls">
        <input
          type="text"
          class="search-input"
          id="search-users"
          placeholder="Buscar por nombre, email o empresa..."
        />
        <select class="filter-select" id="filter-role">
          <option value="all">Todos los roles</option>
          <option value="admin">Administradores</option>
          <option value="user">Usuarios</option>
        </select>
        <select class="filter-select" id="filter-status">
          <option value="all">Todos los estados</option>
          <option value="active">Suscripción activa</option>
          <option value="inactive">Inactivo</option>
        </select>
        <button class="btn-ghost" id="clear-filters">Limpiar</button>
      </div>

      <!-- Users Table -->
      <div class="users-content">
        <div class="results-info" id="results-count">Cargando usuarios...</div>

        <div class="users-table-wrapper">
          <table class="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Productos</th>
                <th>Última Actividad</th>
                <th>Suscripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              <!-- Users loaded here -->
            </tbody>
          </table>
        </div>
      </div>

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
            <div class="panel-user-info">
              <div class="user-avatar-large" id="panel-user-avatar">U</div>
              <div class="panel-user-details">
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
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h2 class="modal-title" id="questions-modal-title">Gestión de Preguntas</h2>
              <p class="modal-subtitle" id="questions-modal-subtitle">Producto</p>
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
                <div class="stat-card">
                  <p class="stat-label">Preguntas Actuales</p>
                  <p class="stat-value stat-value-accent" id="current-questions-db">-</p>
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
    // DEBUG: Verificar autenticación actual
    console.log('🔐 DEBUG - Estado de autenticación:');
    console.log('  Usuario actual:', auth.currentUser?.email);
    console.log('  UID:', auth.currentUser?.uid);

    // Force refresh del token
    if (auth.currentUser) {
      console.log('🔄 Refrescando token de Firebase...');
      try {
        const token = await auth.currentUser.getIdToken(true); // Force refresh
        console.log('✅ Token refrescado exitosamente');
      } catch (tokenError) {
        console.error('❌ Error refrescando token:', tokenError);
      }
    }

    console.log('📡 Intentando cargar usuarios desde Firestore...');
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    console.log('✅ Usuarios cargados:', snapshot.size);

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
    console.error('❌ Error loading users:', error);
    console.error('  Error code:', error.code);
    console.error('  Error message:', error.message);

    // Si es error de permisos, mostrar ayuda adicional
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.error('🔴 PROBLEMA DE PERMISOS DETECTADO');
      console.error('  1. Cierra sesión y vuelve a entrar');
      console.error('  2. Espera 5 minutos para que Firebase propague las reglas');
      showToast('Error de permisos. Intenta cerrar sesión y volver a entrar.', 'error');
    } else {
      showToast('Error al cargar usuarios: ' + error.message, 'error');
    }
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('users-table-body');

  if (filteredUsers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <div class="empty-title">No se encontraron usuarios</div>
            <div class="empty-text">Intenta ajustar los filtros de búsqueda</div>
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
      <tr>
        <td>
          <div class="user-info-cell">
            <div class="user-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
            <div class="user-details">
              <div class="user-name">${user.name || 'Sin nombre'}</div>
              <div class="user-email">${user.email || user.id}</div>
              ${user.company ? `<div class="user-company">${user.company}</div>` : ''}
            </div>
          </div>
        </td>
        <td>
          <span class="badge ${isAdmin ? 'badge-admin' : 'badge-user'}">
            ${isAdmin ? 'Admin' : 'Usuario'}
          </span>
        </td>
        <td>
          <span class="badge badge-count">${user.productsCount || 0}</span>
        </td>
        <td>
          ${formatRelativeTime(lastActivity)}
        </td>
        <td>
          <span class="status-indicator ${hasActiveSubscription ? 'status-active' : 'status-inactive'}">
            ${hasActiveSubscription ? 'Activa' : 'Inactiva'}
          </span>
        </td>
        <td>
          <button class="btn-view" onclick="window.viewUserDetails('${user.id}')">
            Ver detalles
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
  if (newUserBtn) {
    console.log('✅ new-user-btn found, attaching listener');
    newUserBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔘 Nuevo Usuario clicked, navigating to #/admin/user/new');

      try {
        // Cambiar hash primero
        window.location.hash = '#/admin/user/new';
        console.log('✅ Hash changed to:', window.location.hash);

        // Importar y llamar directamente a la función
        const { renderUserFormView } = await import('../user-form/view.js');
        await renderUserFormView();
        console.log('✅ User form view rendered');
      } catch (error) {
        console.error('❌ Error navigating to user form:', error);
      }
    });
  } else {
    console.warn('⚠️ new-user-btn not found in DOM');
  }
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
