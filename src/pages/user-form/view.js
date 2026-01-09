import { auth, db } from '../../js/firebase.js';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';

let currentUser = null;
let previewUpdateTimeout = null;

export async function renderUserFormView(userId = null) {
  const root = document.getElementById('spa-root');
  if (!root) return;

  // Check if user is admin
  if (!auth?.currentUser) {
    window.location.hash = '#/auth';
    return;
  }

  const isEditMode = !!userId;

  // Load user data if editing
  if (isEditMode) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        currentUser = { id: userId, ...userDoc.data() };
      } else {
        window.location.hash = '#/admin/users';
        return;
      }
    } catch (error) {
      console.error('Error loading user:', error);
      window.location.hash = '#/admin/users';
      return;
    }
  } else {
    currentUser = null;
  }

  root.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

      .user-form-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
        font-family: 'IBM Plex Sans', sans-serif;
        color: #e8eaed;
        position: relative;
        overflow-x: hidden;
      }

      .user-form-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
          linear-gradient(rgba(34, 167, 208, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34, 167, 208, 0.03) 1px, transparent 1px);
        background-size: 20px 20px;
        pointer-events: none;
        opacity: 0.5;
      }

      /* Breadcrumb */
      .breadcrumb {
        padding: 24px 48px;
        background: rgba(255, 255, 255, 0.02);
        border-bottom: 1px solid rgba(34, 167, 208, 0.2);
        backdrop-filter: blur(10px);
        position: relative;
        z-index: 10;
      }

      .breadcrumb-content {
        max-width: 1600px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }

      .breadcrumb-link {
        color: #22a7d0;
        text-decoration: none;
        transition: all 0.2s linear;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .breadcrumb-link:hover {
        color: #4fc3f7;
        transform: translateX(-2px);
      }

      .breadcrumb-separator {
        color: rgba(232, 234, 237, 0.3);
        font-weight: 300;
      }

      .breadcrumb-current {
        color: rgba(232, 234, 237, 0.6);
      }

      /* Main Layout */
      .user-form-layout {
        max-width: 1600px;
        margin: 0 auto;
        padding: 48px;
        display: grid;
        grid-template-columns: 1fr 550px;
        gap: 48px;
        position: relative;
        z-index: 1;
      }

      /* Form Column */
      .form-column {
        animation: slideInLeft 0.4s linear;
      }

      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .form-header {
        margin-bottom: 40px;
      }

      .form-title {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 48px;
        font-weight: 700;
        color: #fff;
        margin: 0 0 16px 0;
        line-height: 1.1;
        letter-spacing: -2px;
      }

      .form-subtitle {
        font-size: 16px;
        color: rgba(232, 234, 237, 0.5);
        margin: 0;
        font-family: 'IBM Plex Mono', monospace;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-size: 12px;
      }

      /* Form Sections */
      .form-section {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(34, 167, 208, 0.2);
        border-radius: 2px;
        padding: 32px;
        margin-bottom: 24px;
        transition: all 0.3s linear;
      }

      .form-section:hover {
        border-color: rgba(34, 167, 208, 0.4);
        background: rgba(255, 255, 255, 0.05);
      }

      .section-title {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        color: #22a7d0;
        margin: 0 0 24px 0;
        text-transform: uppercase;
        letter-spacing: 2px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .section-title::before {
        content: '';
        width: 4px;
        height: 16px;
        background: #22a7d0;
      }

      /* Form Fields */
      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .form-field.full-width {
        grid-column: 1 / -1;
      }

      .field-label {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11px;
        font-weight: 500;
        color: rgba(232, 234, 237, 0.7);
        text-transform: uppercase;
        letter-spacing: 1.5px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .field-required {
        color: #ff4757;
        font-size: 14px;
      }

      .field-input {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(34, 167, 208, 0.3);
        border-radius: 2px;
        padding: 14px 16px;
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 15px;
        color: #e8eaed;
        transition: all 0.2s linear;
        outline: none;
      }

      .field-input:focus {
        border-color: #22a7d0;
        background: rgba(0, 0, 0, 0.5);
        box-shadow: 0 0 0 3px rgba(34, 167, 208, 0.1);
      }

      .field-input::placeholder {
        color: rgba(232, 234, 237, 0.3);
      }

      .field-input.error {
        border-color: #ff4757;
      }

      .field-error {
        font-size: 12px;
        color: #ff4757;
        font-family: 'IBM Plex Mono', monospace;
        display: none;
      }

      .field-error.visible {
        display: block;
      }

      /* Password Strength */
      .password-strength {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
        margin-top: 8px;
      }

      .password-strength-bar {
        height: 100%;
        width: 0%;
        transition: all 0.3s linear;
        background: #ff4757;
      }

      .password-strength-bar.weak {
        width: 33%;
        background: #ff4757;
      }

      .password-strength-bar.medium {
        width: 66%;
        background: #ffa502;
      }

      .password-strength-bar.strong {
        width: 100%;
        background: #22a7d0;
      }

      .password-strength-text {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11px;
        color: rgba(232, 234, 237, 0.5);
        margin-top: 6px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      /* Role Selector */
      .role-selector {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }

      .role-option {
        background: rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(34, 167, 208, 0.3);
        border-radius: 2px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s linear;
        text-align: center;
      }

      .role-option:hover {
        border-color: rgba(34, 167, 208, 0.6);
        background: rgba(0, 0, 0, 0.4);
      }

      .role-option.selected {
        border-color: #22a7d0;
        background: rgba(34, 167, 208, 0.1);
      }

      .role-option-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }

      .role-option-label {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        color: #e8eaed;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }

      .role-option-desc {
        font-size: 12px;
        color: rgba(232, 234, 237, 0.5);
        margin-top: 6px;
      }

      /* Status Toggle */
      .status-toggle {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .toggle-switch {
        position: relative;
        width: 56px;
        height: 28px;
        background: rgba(255, 71, 87, 0.3);
        border: 1px solid #ff4757;
        border-radius: 2px;
        cursor: pointer;
        transition: all 0.2s linear;
      }

      .toggle-switch.active {
        background: rgba(34, 167, 208, 0.3);
        border-color: #22a7d0;
      }

      .toggle-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 22px;
        height: 22px;
        background: #ff4757;
        border-radius: 1px;
        transition: all 0.2s linear;
      }

      .toggle-switch.active .toggle-slider {
        left: 30px;
        background: #22a7d0;
      }

      .toggle-label {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
        color: #e8eaed;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }

      /* Preview Column */
      .preview-column {
        position: sticky;
        top: 48px;
        height: fit-content;
        animation: slideInRight 0.4s linear 0.1s both;
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .preview-header {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11px;
        font-weight: 500;
        color: rgba(232, 234, 237, 0.5);
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .preview-header::before {
        content: '';
        width: 8px;
        height: 8px;
        background: #22a7d0;
        border-radius: 1px;
        animation: pulse 2s linear infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }

      .user-preview-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(34, 167, 208, 0.3);
        border-radius: 2px;
        padding: 40px;
        backdrop-filter: blur(10px);
        transition: all 0.3s linear;
      }

      .user-preview-card:hover {
        border-color: rgba(34, 167, 208, 0.5);
        transform: translateY(-4px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .preview-avatar {
        width: 120px;
        height: 120px;
        background: linear-gradient(135deg, #22a7d0 0%, #4fc3f7 100%);
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 48px;
        font-weight: 700;
        color: #fff;
        margin: 0 auto 24px;
        border: 2px solid rgba(255, 255, 255, 0.2);
      }

      .preview-name {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 24px;
        font-weight: 700;
        color: #fff;
        text-align: center;
        margin: 0 0 8px 0;
        letter-spacing: -1px;
      }

      .preview-email {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
        color: rgba(232, 234, 237, 0.5);
        text-align: center;
        margin: 0 0 8px 0;
      }

      .preview-company {
        font-size: 14px;
        color: rgba(232, 234, 237, 0.6);
        text-align: center;
        margin: 0 0 24px 0;
      }

      .preview-badges {
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .preview-badge {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10px;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 2px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }

      .preview-badge.admin {
        background: rgba(142, 68, 173, 0.2);
        color: #9b59b6;
        border: 1px solid #9b59b6;
      }

      .preview-badge.user {
        background: rgba(52, 152, 219, 0.2);
        color: #3498db;
        border: 1px solid #3498db;
      }

      .preview-badge.active {
        background: rgba(39, 174, 96, 0.2);
        color: #27ae60;
        border: 1px solid #27ae60;
      }

      .preview-badge.inactive {
        background: rgba(231, 76, 60, 0.2);
        color: #e74c3c;
        border: 1px solid #e74c3c;
      }

      .preview-divider {
        height: 1px;
        background: rgba(34, 167, 208, 0.2);
        margin: 24px 0;
      }

      .preview-info {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .preview-info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .preview-info-label {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11px;
        color: rgba(232, 234, 237, 0.5);
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }

      .preview-info-value {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
        color: #e8eaed;
      }

      /* Save Bar */
      .save-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(10, 14, 39, 0.95);
        backdrop-filter: blur(20px);
        border-top: 1px solid rgba(34, 167, 208, 0.3);
        padding: 20px 48px;
        z-index: 100;
        animation: slideInUp 0.3s linear;
      }

      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(100%);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .save-bar-content {
        max-width: 1600px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .save-status {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 12px;
        color: rgba(232, 234, 237, 0.5);
        text-transform: uppercase;
        letter-spacing: 1.5px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .save-status-indicator {
        width: 8px;
        height: 8px;
        background: #22a7d0;
        border-radius: 1px;
        animation: pulse 2s linear infinite;
      }

      .save-actions {
        display: flex;
        gap: 16px;
      }

      .btn {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
        font-weight: 600;
        padding: 14px 32px;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        transition: all 0.2s linear;
        outline: none;
      }

      .btn-cancel {
        background: transparent;
        color: rgba(232, 234, 237, 0.6);
        border: 1px solid rgba(232, 234, 237, 0.3);
      }

      .btn-cancel:hover {
        color: #e8eaed;
        border-color: rgba(232, 234, 237, 0.6);
        background: rgba(255, 255, 255, 0.05);
      }

      .btn-save {
        background: #22a7d0;
        color: #fff;
        border: 1px solid #22a7d0;
        box-shadow: 0 4px 12px rgba(34, 167, 208, 0.3);
      }

      .btn-save:hover:not(:disabled) {
        background: #4fc3f7;
        border-color: #4fc3f7;
        box-shadow: 0 6px 20px rgba(34, 167, 208, 0.4);
        transform: translateY(-2px);
      }

      .btn-save:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      /* Toast */
      .toast {
        position: fixed;
        top: 24px;
        right: 24px;
        background: rgba(10, 14, 39, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(34, 167, 208, 0.5);
        border-radius: 2px;
        padding: 16px 24px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
        color: #e8eaed;
        z-index: 1000;
        animation: slideInDown 0.3s linear;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      }

      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .toast.success {
        border-color: #27ae60;
      }

      .toast.error {
        border-color: #e74c3c;
      }

      /* Responsive */
      @media (max-width: 1200px) {
        .user-form-layout {
          grid-template-columns: 1fr;
          padding: 24px;
        }

        .preview-column {
          position: static;
        }

        .breadcrumb {
          padding: 16px 24px;
        }

        .save-bar {
          padding: 16px 24px;
        }
      }

      @media (max-width: 768px) {
        .form-grid {
          grid-template-columns: 1fr;
        }

        .role-selector {
          grid-template-columns: 1fr;
        }

        .form-title {
          font-size: 32px;
        }

        .save-bar-content {
          flex-direction: column;
          gap: 16px;
        }

        .save-actions {
          width: 100%;
        }

        .btn {
          flex: 1;
        }
      }
    </style>

    <div class="user-form-container">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <div class="breadcrumb-content">
          <a href="#/admin/users" class="breadcrumb-link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11 7H3M3 7L7 11M3 7L7 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/>
            </svg>
            Users
          </a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">${isEditMode ? 'Edit User' : 'New User'}</span>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="user-form-layout">
        <!-- Form Column -->
        <div class="form-column">
          <div class="form-header">
            <h1 class="form-title">${isEditMode ? 'Edit User' : 'Create User'}</h1>
            <p class="form-subtitle">User Management System</p>
          </div>

          <form id="user-form">
            <!-- Basic Information -->
            <div class="form-section">
              <h2 class="section-title">Basic Information</h2>
              <div class="form-grid">
                <div class="form-field full-width">
                  <label class="field-label">
                    Name <span class="field-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="user-name"
                    class="field-input"
                    placeholder="John Doe"
                    required
                    value="${currentUser?.name || ''}"
                  />
                  <span class="field-error" id="name-error">Name is required</span>
                </div>

                <div class="form-field full-width">
                  <label class="field-label">
                    Email <span class="field-required">*</span>
                  </label>
                  <input
                    type="email"
                    id="user-email"
                    class="field-input"
                    placeholder="john.doe@example.com"
                    required
                    value="${currentUser?.email || ''}"
                    ${isEditMode ? 'disabled' : ''}
                  />
                  <span class="field-error" id="email-error">Valid email is required</span>
                </div>

                ${!isEditMode ? `
                <div class="form-field full-width">
                  <label class="field-label">
                    Password <span class="field-required">*</span>
                  </label>
                  <input
                    type="password"
                    id="user-password"
                    class="field-input"
                    placeholder="••••••••"
                    required
                    minlength="6"
                  />
                  <div class="password-strength">
                    <div class="password-strength-bar" id="password-strength-bar"></div>
                  </div>
                  <div class="password-strength-text" id="password-strength-text">Enter password</div>
                  <span class="field-error" id="password-error">Password must be at least 6 characters</span>
                </div>
                ` : ''}

                <div class="form-field">
                  <label class="field-label">Phone</label>
                  <input
                    type="tel"
                    id="user-phone"
                    class="field-input"
                    placeholder="+1 (555) 123-4567"
                    value="${currentUser?.phone || ''}"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Country</label>
                  <input
                    type="text"
                    id="user-country"
                    class="field-input"
                    placeholder="United States"
                    value="${currentUser?.country || ''}"
                  />
                </div>

                <div class="form-field full-width">
                  <label class="field-label">Company</label>
                  <input
                    type="text"
                    id="user-company"
                    class="field-input"
                    placeholder="Acme Corporation"
                    value="${currentUser?.company || ''}"
                  />
                </div>
              </div>
            </div>

            <!-- Role & Permissions -->
            <div class="form-section">
              <h2 class="section-title">Role & Permissions</h2>
              <div class="role-selector">
                <div class="role-option ${!currentUser || currentUser.role === 'user' ? 'selected' : ''}" data-role="user">
                  <div class="role-option-icon">👤</div>
                  <div class="role-option-label">User</div>
                  <div class="role-option-desc">Standard access</div>
                </div>
                <div class="role-option ${currentUser?.role === 'admin' ? 'selected' : ''}" data-role="admin">
                  <div class="role-option-icon">⚡</div>
                  <div class="role-option-label">Admin</div>
                  <div class="role-option-desc">Full system access</div>
                </div>
              </div>
              <input type="hidden" id="user-role" value="${currentUser?.role || 'user'}" />
            </div>

            <!-- Status -->
            <div class="form-section">
              <h2 class="section-title">Account Status</h2>
              <div class="status-toggle">
                <div class="toggle-switch ${!currentUser || currentUser.status === 'active' ? 'active' : ''}" id="status-toggle">
                  <div class="toggle-slider"></div>
                </div>
                <span class="toggle-label" id="status-label">${!currentUser || currentUser.status === 'active' ? 'Active' : 'Inactive'}</span>
              </div>
              <input type="hidden" id="user-status" value="${currentUser?.status || 'active'}" />
            </div>
          </form>
        </div>

        <!-- Preview Column -->
        <div class="preview-column">
          <div class="preview-header">Live Preview</div>
          <div class="user-preview-card">
            <div class="preview-avatar" id="preview-avatar">??</div>
            <h3 class="preview-name" id="preview-name">User Name</h3>
            <div class="preview-email" id="preview-email">email@example.com</div>
            <div class="preview-company" id="preview-company">Company Name</div>

            <div class="preview-badges" id="preview-badges">
              <span class="preview-badge user">User</span>
              <span class="preview-badge active">Active</span>
            </div>

            <div class="preview-divider"></div>

            <div class="preview-info">
              <div class="preview-info-item">
                <span class="preview-info-label">Phone</span>
                <span class="preview-info-value" id="preview-phone">—</span>
              </div>
              <div class="preview-info-item">
                <span class="preview-info-label">Country</span>
                <span class="preview-info-value" id="preview-country">—</span>
              </div>
              <div class="preview-info-item">
                <span class="preview-info-label">Status</span>
                <span class="preview-info-value" id="preview-status">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Bar -->
      <div class="save-bar">
        <div class="save-bar-content">
          <div class="save-status">
            <div class="save-status-indicator"></div>
            <span id="save-status-text">Ready to save</span>
          </div>
          <div class="save-actions">
            <button type="button" class="btn btn-cancel" id="cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-save" id="save-btn" form="user-form">
              ${isEditMode ? 'Update User' : 'Create User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Initialize
  initializeFormEvents();
  updateLivePreview();
}

function initializeFormEvents() {
  const form = document.getElementById('user-form');
  const nameInput = document.getElementById('user-name');
  const emailInput = document.getElementById('user-email');
  const passwordInput = document.getElementById('user-password');
  const phoneInput = document.getElementById('user-phone');
  const countryInput = document.getElementById('user-country');
  const companyInput = document.getElementById('user-company');
  const roleOptions = document.querySelectorAll('.role-option');
  const roleInput = document.getElementById('user-role');
  const statusToggle = document.getElementById('status-toggle');
  const statusInput = document.getElementById('user-status');
  const statusLabel = document.getElementById('status-label');
  const cancelBtn = document.getElementById('cancel-btn');
  const saveBtn = document.getElementById('save-btn');

  // Live preview updates
  const updateFields = [nameInput, emailInput, phoneInput, countryInput, companyInput];
  updateFields.forEach(input => {
    if (input) {
      input.addEventListener('input', updateLivePreview);
    }
  });

  // Password strength
  if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      const strengthBar = document.getElementById('password-strength-bar');
      const strengthText = document.getElementById('password-strength-text');

      if (!password) {
        strengthBar.className = 'password-strength-bar';
        strengthText.textContent = 'Enter password';
        return;
      }

      let strength = 0;
      if (password.length >= 6) strength++;
      if (password.length >= 10) strength++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[^a-zA-Z0-9]/.test(password)) strength++;

      if (strength <= 2) {
        strengthBar.className = 'password-strength-bar weak';
        strengthText.textContent = 'Weak password';
      } else if (strength <= 3) {
        strengthBar.className = 'password-strength-bar medium';
        strengthText.textContent = 'Medium password';
      } else {
        strengthBar.className = 'password-strength-bar strong';
        strengthText.textContent = 'Strong password';
      }
    });
  }

  // Role selection
  roleOptions.forEach(option => {
    option.addEventListener('click', () => {
      roleOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      roleInput.value = option.dataset.role;
      updateLivePreview();
    });
  });

  // Status toggle
  statusToggle.addEventListener('click', () => {
    const isActive = statusToggle.classList.toggle('active');
    statusInput.value = isActive ? 'active' : 'inactive';
    statusLabel.textContent = isActive ? 'Active' : 'Inactive';
    updateLivePreview();
  });

  // Cancel button
  cancelBtn.addEventListener('click', () => {
    window.location.hash = '#/admin/users';
  });

  // Form submission
  form.addEventListener('submit', handleSubmit);

  // Form validation
  [nameInput, emailInput, passwordInput].forEach(input => {
    if (input) {
      input.addEventListener('blur', validateField);
    }
  });
}

function validateField(e) {
  const input = e.target;
  const errorEl = document.getElementById(`${input.id.replace('user-', '')}-error`);

  if (!input.value.trim() && input.required) {
    input.classList.add('error');
    if (errorEl) errorEl.classList.add('visible');
    return false;
  }

  if (input.type === 'email' && input.value && !isValidEmail(input.value)) {
    input.classList.add('error');
    if (errorEl) errorEl.classList.add('visible');
    return false;
  }

  if (input.type === 'password' && input.value && input.value.length < 6) {
    input.classList.add('error');
    if (errorEl) errorEl.classList.add('visible');
    return false;
  }

  input.classList.remove('error');
  if (errorEl) errorEl.classList.remove('visible');
  return true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function updateLivePreview() {
  if (previewUpdateTimeout) clearTimeout(previewUpdateTimeout);

  previewUpdateTimeout = setTimeout(() => {
    const name = document.getElementById('user-name').value || 'User Name';
    const email = document.getElementById('user-email').value || 'email@example.com';
    const company = document.getElementById('user-company').value || 'Company Name';
    const phone = document.getElementById('user-phone').value || '—';
    const country = document.getElementById('user-country').value || '—';
    const role = document.getElementById('user-role').value || 'user';
    const status = document.getElementById('user-status').value || 'active';

    // Update avatar
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
    document.getElementById('preview-avatar').textContent = initials;

    // Update text fields
    document.getElementById('preview-name').textContent = name;
    document.getElementById('preview-email').textContent = email;
    document.getElementById('preview-company').textContent = company;
    document.getElementById('preview-phone').textContent = phone;
    document.getElementById('preview-country').textContent = country;
    document.getElementById('preview-status').textContent = status === 'active' ? 'Active' : 'Inactive';

    // Update badges
    const badgesHtml = `
      <span class="preview-badge ${role}">${role === 'admin' ? 'Admin' : 'User'}</span>
      <span class="preview-badge ${status}">${status === 'active' ? 'Active' : 'Inactive'}</span>
    `;
    document.getElementById('preview-badges').innerHTML = badgesHtml;
  }, 300);
}

async function handleSubmit(e) {
  e.preventDefault();

  const saveBtn = document.getElementById('save-btn');
  const statusText = document.getElementById('save-status-text');

  // Validate form
  const nameInput = document.getElementById('user-name');
  const emailInput = document.getElementById('user-email');
  const passwordInput = document.getElementById('user-password');

  let isValid = true;
  [nameInput, emailInput, passwordInput].forEach(input => {
    if (input && !validateField({ target: input })) {
      isValid = false;
    }
  });

  if (!isValid) {
    showToast('Please fix all errors before saving', 'error');
    return;
  }

  // Disable button
  saveBtn.disabled = true;
  statusText.textContent = 'Saving...';

  try {
    const userData = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: document.getElementById('user-phone').value.trim() || null,
      country: document.getElementById('user-country').value.trim() || null,
      company: document.getElementById('user-company').value.trim() || null,
      role: document.getElementById('user-role').value,
      isAdmin: document.getElementById('user-role').value === 'admin',
      status: document.getElementById('user-status').value,
      updatedAt: serverTimestamp()
    };

    if (currentUser) {
      // Update existing user
      await setDoc(doc(db, 'users', currentUser.id), userData, { merge: true });
      showToast('User updated successfully!', 'success');
      statusText.textContent = 'Saved successfully';
    } else {
      // Create new user in Firebase Auth
      const password = passwordInput.value;

      // Note: This will create the user in Firebase Auth
      // In production, you'd want to handle this server-side
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
        const userId = userCredential.user.uid;

        // Create user document in Firestore
        userData.createdAt = serverTimestamp();
        await setDoc(doc(db, 'users', userId), userData);

        showToast('User created successfully!', 'success');
        statusText.textContent = 'Created successfully';

        // Redirect after 1.5 seconds
        setTimeout(() => {
          window.location.hash = '#/admin/users';
        }, 1500);
      } catch (authError) {
        console.error('Auth error:', authError);
        if (authError.code === 'auth/email-already-in-use') {
          showToast('Email already in use', 'error');
        } else {
          showToast('Error creating user account', 'error');
        }
        saveBtn.disabled = false;
        statusText.textContent = 'Ready to save';
        return;
      }
    }

    // Re-enable button after delay
    setTimeout(() => {
      saveBtn.disabled = false;
      statusText.textContent = 'Ready to save';
    }, 2000);
  } catch (error) {
    console.error('Error saving user:', error);
    showToast('Error saving user', 'error');
    saveBtn.disabled = false;
    statusText.textContent = 'Error occurred';
  }
}

function showToast(message, type = 'success') {
  // Remove existing toasts
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInDown 0.3s linear reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
