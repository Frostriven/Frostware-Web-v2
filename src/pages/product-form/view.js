import { auth, db } from '../../js/firebase.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { isUserAdmin, isAdminEmail, getProductsFromFirebase } from '../../js/userProfile.js';

let currentProduct = null;
let processedQuestions = null;
let previewUpdateTimeout = null;
let activeTab = 'basic';

// Helper function to get icon SVG
function getIconSVG(icon) {
  const icons = {
    radio: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2" fill="currentColor"/><path d="M10 2v3M10 15v3M2 10h3M15 10h3" stroke="currentColor" stroke-width="2"/></svg>',
    map: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 5l5-2 6 2 5-2v12l-5 2-6-2-5 2V5z" stroke="currentColor" stroke-width="2"/></svg>',
    cloud: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14 13a4 4 0 001-7.8A5.5 5.5 0 004.5 9H4a3 3 0 000 6h10a3 3 0 100-6z" stroke="currentColor" stroke-width="2"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L2 16h16L10 2z" stroke="currentColor" stroke-width="2"/><path d="M10 8v4M10 14h.01" stroke="currentColor" stroke-width="2"/></svg>',
    certificate: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="2"/></svg>',
    lightning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M11 2L4 12h6l-1 6 7-10h-6l1-6z" stroke="currentColor" stroke-width="2"/></svg>',
    shield: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L3 5v5c0 4 3 7 7 9 4-2 7-5 7-9V5l-7-3z" stroke="currentColor" stroke-width="2"/></svg>',
    star: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2l2.4 5.8 6.1.6-4.6 4L15 19l-5-3.2L5 19l1.1-6.6-4.6-4 6.1-.6L10 2z"/></svg>',
    globe: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/><path d="M2 10h16M10 2a8 8 0 018 8M10 18a8 8 0 01-8-8" stroke="currentColor" stroke-width="2"/></svg>',
    rocket: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 2l6 6-4 4-6-6 4-4zM6 8l-4 4 6 6 4-4-6-6z" stroke="currentColor" stroke-width="2"/></svg>'
  };
  return icons[icon] || icons.radio;
}

export async function renderProductFormView(productId = null) {
  const root = document.getElementById('spa-root');
  if (!root) return;

  // Check auth
  if (!auth?.currentUser) {
    window.location.hash = '#/auth';
    return;
  }

  const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);
  if (!userIsAdmin) {
    window.location.hash = '#/admin';
    return;
  }

  // Reset currentProduct
  currentProduct = null;

  // Get product ID from parameter or URL
  if (!productId) {
    const hash = window.location.hash;
    productId = hash.includes('?id=') ? hash.split('?id=')[1] : null;
  }

  if (productId) {
    // Load existing product
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (productDoc.exists()) {
        const data = productDoc.data();
        currentProduct = {
          id: productDoc.id,
          ...data,
          // Ensure strings are actual strings, not objects
          name: typeof data.name === 'string' ? data.name : '',
          description: typeof data.description === 'string' ? data.description : '',
          title: typeof data.title === 'string' ? data.title : (typeof data.name === 'string' ? data.name : ''),
        };
        console.log('Loaded product:', currentProduct);
      } else {
        console.error('Product not found:', productId);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    }
  }

  root.innerHTML = await renderProductFormPage();
  await initializeProductForm();
  injectStyles();
}

async function renderProductFormPage() {
  const isEditing = !!currentProduct;
  const title = isEditing ? `Editar: ${currentProduct.name}` : 'Nuevo Producto';

  // Load categories and badges
  const categories = await getCategoriesFromFirebase();
  const badges = await getBadgesFromFirebase();
  const offers = await getOffersFromFirebase();

  // Helper functions to get current values
  const getValue = (field, subfield = null, lang = null) => {
    if (!currentProduct) return '';
    if (lang && subfield) {
      return currentProduct[field]?.[lang]?.[subfield] || '';
    }
    if (lang) {
      return currentProduct[field]?.[lang] || '';
    }
    return currentProduct[field] || '';
  };

  const getArrayValue = (field) => {
    if (!currentProduct) return [];
    return currentProduct[field] || [];
  };

  return `
    <div class="product-form-page">
      <!-- Floating Save Bar -->
      <div class="floating-save-bar" id="save-bar">
        <div class="save-bar-content">
          <div class="save-bar-left">
            <div class="status-indicator" id="save-status">
              <div class="status-dot"></div>
              <span>Sin cambios</span>
            </div>
          </div>
          <div class="save-bar-right">
            <a href="#/admin" class="btn-ghost-bar">Cancelar</a>
            <button class="btn-primary-bar" id="save-product-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16 5L7.5 13.5L4 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              ${isEditing ? 'Actualizar' : 'Crear'} Producto
            </button>
          </div>
        </div>
      </div>

      <!-- Header -->
      <header class="form-header">
        <div class="breadcrumb">
          <a href="#/admin" class="breadcrumb-link">Panel Admin</a>
          <span class="breadcrumb-sep">→</span>
          <a href="#/admin" class="breadcrumb-link">Productos</a>
          <span class="breadcrumb-sep">→</span>
          <span class="breadcrumb-current">${title}</span>
        </div>
        <h1 class="form-title">${isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}</h1>
        <p class="form-subtitle">
          ${isEditing ? 'Modifica la información del producto y gestiona su base de datos de preguntas' : 'Completa los campos para crear un nuevo producto en el catálogo'}
        </p>
      </header>

      <!-- Main Content: Two Column Layout -->
      <div class="form-layout">
        <!-- Left Column: Form -->
        <div class="form-column">
          <!-- Tabs Navigation -->
          <div class="tabs-navigation">
            <button type="button" class="tab-btn active" data-tab="basic">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Información Básica
            </button>
            <button type="button" class="tab-btn" data-tab="multilingual">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="2"/>
                <path d="M2 10h16M10 2a8 8 0 018 8M10 18a8 8 0 01-8-8" stroke="currentColor" stroke-width="2"/>
              </svg>
              Multilingüe
            </button>
            <button type="button" class="tab-btn" data-tab="visual">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 4h12v12H4z" stroke="currentColor" stroke-width="2"/>
                <circle cx="7" cy="7" r="1" fill="currentColor"/>
              </svg>
              Visuales
            </button>
            <button type="button" class="tab-btn" data-tab="features">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l3 3 9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Features
            </button>
            <button type="button" class="tab-btn" data-tab="pricing">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="2"/>
                <path d="M10 6v4l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Precios
            </button>
            <button type="button" class="tab-btn" data-tab="advanced">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="2" stroke="currentColor" stroke-width="2"/>
                <path d="M10 1v2M10 17v2M1 10h2M17 10h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Avanzado
            </button>
          </div>

          <form id="product-form" class="product-form">

            <!-- Tab Content: Basic -->
            <div class="tab-content active" data-tab-content="basic">
              <div class="form-group">
                <label class="form-label" for="product-id">
                  ID del Producto
                  ${isEditing ? '' : '<span class="required">*</span>'}
                </label>
                <input
                  type="text"
                  id="product-id"
                  class="form-input"
                  placeholder="nat-ops-guide"
                  value="${getValue('id')}"
                  ${isEditing ? 'readonly' : ''}
                />
                <p class="form-hint">ID único para Firestore ${isEditing ? '(no se puede modificar)' : '(se generará automáticamente si está vacío)'}</p>
              </div>

              <div class="form-group">
                <label class="form-label" for="product-name-simple">
                  Nombre del Producto (Simple)
                  <span class="required">*</span>
                </label>
                <input
                  type="text"
                  id="product-name-simple"
                  class="form-input form-input-large"
                  placeholder="NAT OPS Guide"
                  value="${typeof currentProduct?.name === 'string' ? currentProduct.name : ''}"
                  required
                />
                <p class="form-hint">Nombre simple del producto (para compatibilidad)</p>
              </div>

              <div class="form-group">
                <label class="form-label" for="product-description-simple">
                  Descripción (Simple)
                  <span class="required">*</span>
                </label>
                <textarea
                  id="product-description-simple"
                  class="form-textarea"
                  rows="3"
                  placeholder="Guía completa de operaciones en el Atlántico Norte..."
                  required
                >${typeof currentProduct?.description === 'string' ? currentProduct.description : ''}</textarea>
                <p class="form-hint">Descripción simple (para compatibilidad)</p>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="product-category">
                    Categoría
                    <span class="required">*</span>
                  </label>
                  <select id="product-category" class="form-select" required>
                    <option value="">Seleccionar categoría</option>
                    ${categories.map(cat => `
                      <option value="${cat.id}" ${currentProduct?.category === cat.id ? 'selected' : ''}>
                        ${cat.name}
                      </option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="product-badge">
                    Badge
                  </label>
                  <select id="product-badge" class="form-select">
                    <option value="">Sin badge</option>
                    ${badges.map(badge => `
                      <option value="${badge.id}" ${currentProduct?.badge === badge.id ? 'selected' : ''}>
                        ${badge.name}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="product-badge-color">
                  Color del Badge
                </label>
                <div class="color-input-group">
                  <input
                    type="color"
                    id="product-badge-color"
                    class="color-picker"
                    value="${getValue('badgeColor') || '#22a7d0'}"
                  />
                  <input
                    type="text"
                    class="form-input color-hex"
                    id="product-badge-color-hex"
                    placeholder="#22a7d0"
                    value="${getValue('badgeColor') || '#22a7d0'}"
                  />
                  <div class="color-preview" style="background: ${getValue('badgeColor') || '#22a7d0'}"></div>
                </div>
              </div>
            </div>

            <!-- Tab Content: Multilingual -->
            <div class="tab-content" data-tab-content="multilingual">
              <div class="lang-section">
                <h3 class="lang-title">
                  <img src="https://flagcdn.com/es.svg" alt="ES" class="lang-flag" />
                  Español (ES)
                </h3>

                <div class="form-group">
                  <label class="form-label">Nombre (ES)</label>
                  <input type="text" id="name-es" class="form-input" placeholder="NAT OPS - Guía de Operaciones" value="${getValue('name', null, 'es')}" />
                </div>

                <div class="form-group">
                  <label class="form-label">Título (ES)</label>
                  <input type="text" id="title-es" class="form-input" placeholder="Operaciones en el Atlántico Norte" value="${getValue('title', null, 'es')}" />
                </div>

                <div class="form-group">
                  <label class="form-label">Descripción Corta (ES)</label>
                  <textarea id="shortDescription-es" class="form-textarea" rows="2" placeholder="Descripción breve...">${getValue('shortDescription', null, 'es')}</textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Descripción (ES)</label>
                  <textarea id="description-es" class="form-textarea" rows="3" placeholder="Descripción completa...">${getValue('description', null, 'es')}</textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Descripción Larga (ES)</label>
                  <textarea id="longDescription-es" class="form-textarea" rows="5" placeholder="Descripción detallada del producto...">${getValue('longDescription', null, 'es')}</textarea>
                </div>
              </div>

              <div class="lang-section">
                <h3 class="lang-title">
                  <img src="https://flagcdn.com/us.svg" alt="EN" class="lang-flag" />
                  English (EN)
                </h3>

                <div class="form-group">
                  <label class="form-label">Name (EN)</label>
                  <input type="text" id="name-en" class="form-input" placeholder="NAT OPS - Operations Guide" value="${getValue('name', null, 'en')}" />
                </div>

                <div class="form-group">
                  <label class="form-label">Title (EN)</label>
                  <input type="text" id="title-en" class="form-input" placeholder="North Atlantic Operations" value="${getValue('title', null, 'en')}" />
                </div>

                <div class="form-group">
                  <label class="form-label">Short Description (EN)</label>
                  <textarea id="shortDescription-en" class="form-textarea" rows="2" placeholder="Brief description...">${getValue('shortDescription', null, 'en')}</textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Description (EN)</label>
                  <textarea id="description-en" class="form-textarea" rows="3" placeholder="Full description...">${getValue('description', null, 'en')}</textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Long Description (EN)</label>
                  <textarea id="longDescription-en" class="form-textarea" rows="5" placeholder="Detailed product description...">${getValue('longDescription', null, 'en')}</textarea>
                </div>
              </div>
            </div>

            <!-- Tab Content: Visual -->
            <div class="tab-content" data-tab-content="visual">
              <div class="form-group">
                <label class="form-label" for="product-image">
                  URL de Imagen Principal
                </label>
                <input
                  type="url"
                  id="product-image"
                  class="form-input"
                  placeholder="https://example.com/image.jpg"
                  value="${getValue('imageURL') || getValue('image')}"
                />
                <div class="image-preview" id="image-preview">
                  ${getValue('imageURL') || getValue('image') ?
                    `<img src="${getValue('imageURL') || getValue('image')}" alt="Preview" />` :
                    '<div class="no-image">Sin imagen</div>'
                  }
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Colores del Producto</label>
                <p class="form-hint">Paleta de colores que representa el producto</p>
                <div id="colors-list" class="colors-list">
                  ${getArrayValue('colors').map((color, idx) => `
                    <div class="color-item" data-index="${idx}">
                      <input type="color" class="color-picker" value="${color}" data-color-index="${idx}" />
                      <input type="text" class="form-input color-hex-input" value="${color}" data-color-hex="${idx}" />
                      <div class="color-preview-small" style="background: ${color}"></div>
                      <button type="button" class="btn-remove-color" data-remove-color="${idx}">×</button>
                    </div>
                  `).join('')}
                </div>
                <button type="button" class="btn-add-item" id="add-color-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  Agregar Color
                </button>
              </div>

              <div class="form-group">
                <label class="form-label">Colores del Gradiente (Detalle)</label>
                <p class="form-hint">Gradiente usado en la página de detalle</p>
                <div id="gradient-colors-list" class="colors-list">
                  ${getArrayValue('detailGradientColors').map((color, idx) => `
                    <div class="color-item" data-index="${idx}">
                      <input type="color" class="color-picker" value="${color}" data-gradient-index="${idx}" />
                      <input type="text" class="form-input color-hex-input" value="${color}" data-gradient-hex="${idx}" />
                      <div class="color-preview-small" style="background: ${color}"></div>
                      <button type="button" class="btn-remove-color" data-remove-gradient="${idx}">×</button>
                    </div>
                  `).join('')}
                </div>
                <button type="button" class="btn-add-item" id="add-gradient-color-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  Agregar Color Gradiente
                </button>
              </div>

              <div class="gradient-preview" id="gradient-preview">
                <div class="gradient-preview-box" style="background: linear-gradient(135deg, ${getArrayValue('detailGradientColors').join(', ') || '#22a7d0, #1a8fb8'})"></div>
                <p class="form-hint">Vista previa del gradiente</p>
              </div>
            </div>

            <!-- Tab Content: Features -->
            <div class="tab-content" data-tab-content="features">
              <div class="form-group">
                <label class="form-label">Features Simples</label>
                <p class="form-hint">Lista de características breves del producto</p>
                <div id="features-list" class="features-list">
                  ${getArrayValue('features').map((feature, idx) => `
                    <div class="feature-item">
                      <input type="text" class="form-input" value="${feature}" data-feature-index="${idx}" placeholder="Característica del producto" />
                      <button type="button" class="btn-remove-feature" data-remove-feature="${idx}">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </button>
                    </div>
                  `).join('')}
                </div>
                <button type="button" class="btn-add-item" id="add-feature-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  Agregar Feature
                </button>
              </div>

              <div class="form-group">
                <label class="form-label">Features Detalladas</label>
                <p class="form-hint">Features con ícono, título y descripción multilingüe</p>
                <div id="detailed-features-list" class="detailed-features-list">
                  ${getArrayValue('detailedFeatures').map((feature, idx) => `
                    <div class="detailed-feature-item" data-detailed-index="${idx}">
                      <div class="detailed-feature-header">
                        <h4>Feature ${idx + 1}</h4>
                        <button type="button" class="btn-remove-detailed" data-remove-detailed="${idx}">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                        </button>
                      </div>

                      <div class="form-group-inline">
                        <label class="form-label-small">Ícono</label>
                        <select id="detailed-feature-icon-${idx}" class="form-select-small" data-detailed-icon="${idx}">
                          ${['radio', 'map', 'cloud', 'warning', 'certificate', 'lightning', 'shield', 'star', 'globe', 'rocket'].map(icon => `
                            <option value="${icon}" ${feature.icon === icon ? 'selected' : ''}>${icon}</option>
                          `).join('')}
                        </select>
                        <div class="icon-preview" data-icon-preview="${idx}" style="${feature.iconColor ? `color: ${feature.iconColor}` : ''}">${getIconSVG(feature.icon || 'radio')}</div>
                      </div>

                      <div class="form-group-inline">
                        <label class="form-label-small">Color del Ícono</label>
                        <div class="color-picker-group">
                          <input type="color" id="detailed-feature-color-${idx}" class="icon-color-picker" value="${feature.iconColor || ''}" data-detailed-color="${idx}" />
                          <input type="text" id="detailed-feature-color-hex-${idx}" class="form-input-small color-hex-input" placeholder="Por defecto" value="${feature.iconColor || ''}" data-detailed-color-hex="${idx}" maxlength="7" />
                          ${feature.iconColor ? `<button type="button" class="btn-reset-color" data-reset-color="${idx}" title="Usar color por defecto">↺</button>` : ''}
                        </div>
                        <p class="form-hint-tiny">Deja vacío para usar el color por defecto del ícono</p>
                      </div>

                      <div class="form-group-inline">
                        <label class="form-label-small">Título (ES)</label>
                        <input id="detailed-feature-title-es-${idx}" type="text" class="form-input-small" placeholder="Título" value="${feature.title?.es || ''}" data-detailed-title-es="${idx}" />
                      </div>

                      <div class="form-group-inline">
                        <label class="form-label-small">Título (EN)</label>
                        <input id="detailed-feature-title-en-${idx}" type="text" class="form-input-small" placeholder="Title" value="${feature.title?.en || ''}" data-detailed-title-en="${idx}" />
                      </div>

                      <div class="form-group-inline">
                        <label class="form-label-small">Descripción (ES)</label>
                        <textarea id="detailed-feature-desc-es-${idx}" class="form-textarea-small" rows="2" placeholder="Descripción..." data-detailed-desc-es="${idx}">${feature.description?.es || ''}</textarea>
                      </div>

                      <div class="form-group-inline">
                        <label class="form-label-small">Descripción (EN)</label>
                        <textarea id="detailed-feature-desc-en-${idx}" class="form-textarea-small" rows="2" placeholder="Description..." data-detailed-desc-en="${idx}">${feature.description?.en || ''}</textarea>
                      </div>
                    </div>
                  `).join('')}
                </div>
                <button type="button" class="btn-add-item" id="add-detailed-feature-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  Agregar Feature Detallada
                </button>
              </div>
            </div>

            <!-- Tab Content: Pricing -->
            <div class="tab-content" data-tab-content="pricing">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="product-price">
                    Precio Actual
                    <span class="required">*</span>
                  </label>
                  <div class="input-with-icon">
                    <span class="input-icon">$</span>
                    <input
                      type="number"
                      id="product-price"
                      class="form-input"
                      placeholder="299"
                      step="0.01"
                      min="0"
                      value="${getValue('price')}"
                      required
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="product-original-price">
                    Precio Original
                  </label>
                  <div class="input-with-icon">
                    <span class="input-icon">$</span>
                    <input
                      type="number"
                      id="product-original-price"
                      class="form-input"
                      placeholder="399"
                      step="0.01"
                      min="0"
                      value="${getValue('originalPrice')}"
                    />
                  </div>
                  <p class="form-hint">Opcional, para mostrar descuento</p>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="product-offer">
                  Oferta Asociada
                </label>
                <select id="product-offer" class="form-select">
                  <option value="">Sin oferta</option>
                  ${offers.map(offer => `
                    <option value="${offer.id}" ${getValue('offerId') === offer.id ? 'selected' : ''}>
                      ${offer.description} (${offer.discountPrice > 0 ? '$' + offer.discountPrice : 'GRATIS'})
                    </option>
                  `).join('')}
                </select>
                <p class="form-hint">Las ofertas se gestionan en la sección de Ofertas del panel admin</p>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">
                    Rating
                  </label>
                  <div class="rating-container">
                    <div class="star-rating" id="star-rating">
                      ${[1, 2, 3, 4, 5].map(star => `
                        <button type="button" class="star ${(getValue('rating') || 4.5) >= star ? 'active' : ''}" data-rating="${star}">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                          </svg>
                        </button>
                      `).join('')}
                    </div>
                    <div class="rating-display" id="rating-display">${getValue('rating') || 4.5} / 5</div>
                  </div>
                  <input type="hidden" id="product-rating" value="${getValue('rating') || 4.5}">
                  <p class="form-hint">Selecciona las estrellas para cambiar el rating</p>
                </div>

                <div class="form-group">
                  <label class="form-label" for="product-reviews">
                    Número de Reviews
                  </label>
                  <input
                    type="number"
                    id="product-reviews"
                    class="form-input"
                    placeholder="342"
                    min="0"
                    value="${getValue('reviews') || Math.floor(Math.random() * 400) + 50}"
                  />
                </div>
              </div>
            </div>

            <!-- Tab Content: Advanced -->
            <div class="tab-content" data-tab-content="advanced">
              <div class="form-group">
                <label class="form-label" for="product-app-url">
                  URL de App/Guía (Post-Compra)
                </label>
                <input
                  type="url"
                  id="product-app-url"
                  class="form-input"
                  placeholder="https://apps.frostware.com/nat-ops/"
                  value="${getValue('appUrl')}"
                />
                <p class="form-hint">URL donde el usuario accederá después de comprar</p>
              </div>

              <div class="form-group">
                <label class="form-label" for="product-database-id">
                  ID de Base de Datos
                </label>
                <input
                  type="text"
                  id="product-database-id"
                  class="form-input"
                  placeholder="nat-ops-questions"
                  value="${getValue('databaseId')}"
                />
                <p class="form-hint">Identificador único para la colección de preguntas en Firestore</p>
              </div>

              <div class="form-group">
                <label class="form-label">Tags</label>
                <p class="form-hint">Etiquetas para búsqueda y filtrado</p>
                <div id="tags-list" class="tags-list">
                  ${getArrayValue('tags').map((tag, idx) => `
                    <div class="tag-chip">
                      <span>${tag}</span>
                      <button type="button" class="tag-remove" data-remove-tag="${idx}">×</button>
                    </div>
                  `).join('')}
                </div>
                <div class="tag-input-group">
                  <input type="text" id="tag-input" class="form-input" placeholder="Agregar tag..." />
                  <button type="button" class="btn-add-tag" id="add-tag-btn">Agregar</button>
                </div>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="product-homepage" ${getValue('showOnHomepage') ? 'checked' : ''} />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">
                    Mostrar en página principal
                    <small>El producto aparecerá en la sección destacada del homepage</small>
                  </span>
                </label>
              </div>

              ${isEditing ? `
                <div class="metadata-grid">
                  <div class="metadata-item">
                    <label>Fecha de Creación</label>
                    <p>${currentProduct.createdAt ? new Date(currentProduct.createdAt.seconds * 1000).toLocaleString('es-ES') : 'N/A'}</p>
                  </div>
                  <div class="metadata-item">
                    <label>Última Actualización</label>
                    <p>${currentProduct.updatedAt ? new Date(currentProduct.updatedAt.seconds * 1000).toLocaleString('es-ES') : 'N/A'}</p>
                  </div>
                </div>
              ` : ''}
            </div>

          </form>
        </div>

        <!-- Right Column: Live Preview -->
        <div class="preview-column">
          <div class="preview-sticky">
            <h3 class="preview-title">Vista Previa</h3>
            <p class="preview-subtitle">Así se verá el producto en el catálogo</p>

            <div class="product-preview-card" id="product-preview">
              <!-- Dynamic preview -->
            </div>

            <div class="preview-tips">
              <p class="tip-title">💡 Consejos</p>
              <ul class="tips-list">
                <li>Usa nombres descriptivos pero concisos</li>
                <li>Las imágenes deben ser de alta calidad</li>
                <li>El precio debe reflejar el valor del contenido</li>
                <li>El rating inicial puede ajustarse después</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast Container -->
      <div class="toast-container" id="toast-container"></div>
    </div>
  `;
}

async function initializeProductForm() {
  // Initialize all interactions
  initializeTabs();
  initializeStarRating();
  initializeImagePreview();
  initializeLivePreview();
  initializeColorPickers();
  initializeArrayManagers();
  initializeSaveButton();

  // Monitor for changes
  const form = document.getElementById('product-form');
  form.addEventListener('input', () => {
    updateSaveStatus('unsaved');
    updateLivePreview();
  });
  form.addEventListener('change', (e) => {
    updateSaveStatus('unsaved');
    updateLivePreview();

    // Si cambió un select de icono, actualizar el preview del icono
    if (e.target.id && e.target.id.startsWith('detailed-feature-icon-')) {
      const idx = e.target.id.split('-').pop();
      const iconPreview = document.querySelector(`[data-icon-preview="${idx}"]`);
      if (iconPreview) {
        iconPreview.innerHTML = getIconSVG(e.target.value);
      }
    }
  });
}

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;

      // Update active button
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active content
      tabContents.forEach(content => {
        if (content.dataset.tabContent === tabName) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });

      activeTab = tabName;
    });
  });
}

function initializeStarRating() {
  const stars = document.querySelectorAll('.star');
  const ratingInput = document.getElementById('product-rating');
  const ratingDisplay = document.getElementById('rating-display');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      const rating = parseFloat(star.dataset.rating);
      ratingInput.value = rating;

      // Update display
      if (ratingDisplay) {
        ratingDisplay.textContent = `${rating} / 5`;
      }

      stars.forEach((s, idx) => {
        s.classList.toggle('active', idx < rating);
      });

      updateSaveStatus('unsaved');
      updateLivePreview();
    });
  });
}

function initializeImagePreview() {
  const imageInput = document.getElementById('product-image');
  const preview = document.getElementById('image-preview');

  imageInput.addEventListener('blur', () => {
    const url = imageInput.value.trim();
    if (url) {
      preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'>Error al cargar imagen</div>'" />`;
    } else {
      preview.innerHTML = '<div class="no-image">Sin imagen</div>';
    }
  });
}

function initializeColorPickers() {
  // Badge color sync
  const badgeColorPicker = document.getElementById('product-badge-color');
  const badgeColorHex = document.getElementById('product-badge-color-hex');

  if (badgeColorPicker && badgeColorHex) {
    badgeColorPicker.addEventListener('input', (e) => {
      badgeColorHex.value = e.target.value;
      updateSaveStatus('unsaved');
    });

    badgeColorHex.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        badgeColorPicker.value = e.target.value;
        updateSaveStatus('unsaved');
      }
    });
  }

  // Product colors sync
  document.addEventListener('input', (e) => {
    if (e.target.dataset.colorIndex !== undefined) {
      const idx = e.target.dataset.colorIndex;
      const hexInput = document.querySelector(`[data-color-hex="${idx}"]`);
      const preview = e.target.closest('.color-item').querySelector('.color-preview-small');
      if (hexInput) hexInput.value = e.target.value;
      if (preview) preview.style.background = e.target.value;
      updateSaveStatus('unsaved');
    } else if (e.target.dataset.colorHex !== undefined) {
      const idx = e.target.dataset.colorHex;
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        const colorPicker = document.querySelector(`[data-color-index="${idx}"]`);
        const preview = e.target.closest('.color-item').querySelector('.color-preview-small');
        if (colorPicker) colorPicker.value = e.target.value;
        if (preview) preview.style.background = e.target.value;
        updateSaveStatus('unsaved');
      }
    } else if (e.target.dataset.gradientIndex !== undefined) {
      const idx = e.target.dataset.gradientIndex;
      const hexInput = document.querySelector(`[data-gradient-hex="${idx}"]`);
      const preview = e.target.closest('.color-item').querySelector('.color-preview-small');
      if (hexInput) hexInput.value = e.target.value;
      if (preview) preview.style.background = e.target.value;
      updateGradientPreview();
      updateSaveStatus('unsaved');
    } else if (e.target.dataset.gradientHex !== undefined) {
      const idx = e.target.dataset.gradientHex;
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        const colorPicker = document.querySelector(`[data-gradient-index="${idx}"]`);
        const preview = e.target.closest('.color-item').querySelector('.color-preview-small');
        if (colorPicker) colorPicker.value = e.target.value;
        if (preview) preview.style.background = e.target.value;
        updateGradientPreview();
        updateSaveStatus('unsaved');
      }
    }
    // Icon color pickers
    else if (e.target.dataset.detailedColor !== undefined) {
      const idx = e.target.dataset.detailedColor;
      const hexInput = document.getElementById(`detailed-feature-color-hex-${idx}`);
      const iconPreview = document.querySelector(`[data-icon-preview="${idx}"]`);
      if (hexInput) hexInput.value = e.target.value;
      if (iconPreview) {
        iconPreview.style.color = e.target.value;
        iconPreview.style.background = `${e.target.value}20`; // 20 = 12.5% opacity
      }
      updateSaveStatus('unsaved');
      updateLivePreview();
    } else if (e.target.dataset.detailedColorHex !== undefined) {
      const idx = e.target.dataset.detailedColorHex;
      const value = e.target.value.trim();

      // Si está vacío, resetear al color por defecto
      if (value === '') {
        const colorPicker = document.getElementById(`detailed-feature-color-${idx}`);
        const iconPreview = document.querySelector(`[data-icon-preview="${idx}"]`);
        if (colorPicker) colorPicker.value = '';
        if (iconPreview) {
          iconPreview.style.color = '';
          iconPreview.style.background = '';
        }
        updateSaveStatus('unsaved');
        updateLivePreview();
      }
      // Si es un color hex válido
      else if (/^#[0-9A-F]{6}$/i.test(value)) {
        const colorPicker = document.getElementById(`detailed-feature-color-${idx}`);
        const iconPreview = document.querySelector(`[data-icon-preview="${idx}"]`);
        if (colorPicker) colorPicker.value = value;
        if (iconPreview) {
          iconPreview.style.color = value;
          iconPreview.style.background = `${value}20`;
        }
        updateSaveStatus('unsaved');
        updateLivePreview();
      }
    }
  });

  // Botones de reset de color
  document.addEventListener('click', (e) => {
    if (e.target.dataset.resetColor !== undefined) {
      const idx = e.target.dataset.resetColor;
      const colorPicker = document.getElementById(`detailed-feature-color-${idx}`);
      const hexInput = document.getElementById(`detailed-feature-color-hex-${idx}`);
      const iconPreview = document.querySelector(`[data-icon-preview="${idx}"]`);

      if (colorPicker) colorPicker.value = '';
      if (hexInput) hexInput.value = '';
      if (iconPreview) {
        iconPreview.style.color = '';
        iconPreview.style.background = '';
      }

      // Remover el botón de reset
      e.target.remove();

      updateSaveStatus('unsaved');
      updateLivePreview();
    }
  });
}

function updateGradientPreview() {
  const gradientBox = document.querySelector('.gradient-preview-box');
  if (!gradientBox) return;

  const colors = [];
  document.querySelectorAll('[data-gradient-index]').forEach(input => {
    colors.push(input.value);
  });

  if (colors.length > 0) {
    gradientBox.style.background = `linear-gradient(135deg, ${colors.join(', ')})`;
  }
}

function initializeArrayManagers() {
  // Colors
  const addColorBtn = document.getElementById('add-color-btn');
  if (addColorBtn) {
    addColorBtn.addEventListener('click', () => {
      const colorsList = document.getElementById('colors-list');
      const idx = colorsList.children.length;
      const newColor = document.createElement('div');
      newColor.className = 'color-item';
      newColor.dataset.index = idx;
      newColor.innerHTML = `
        <input type="color" class="color-picker" value="#22a7d0" data-color-index="${idx}" />
        <input type="text" class="form-input color-hex-input" value="#22a7d0" data-color-hex="${idx}" />
        <div class="color-preview-small" style="background: #22a7d0"></div>
        <button type="button" class="btn-remove-color" data-remove-color="${idx}">×</button>
      `;
      colorsList.appendChild(newColor);
      updateSaveStatus('unsaved');
    });
  }

  // Gradient colors
  const addGradientBtn = document.getElementById('add-gradient-color-btn');
  if (addGradientBtn) {
    addGradientBtn.addEventListener('click', () => {
      const gradientList = document.getElementById('gradient-colors-list');
      const idx = gradientList.children.length;
      const newColor = document.createElement('div');
      newColor.className = 'color-item';
      newColor.dataset.index = idx;
      newColor.innerHTML = `
        <input type="color" class="color-picker" value="#22a7d0" data-gradient-index="${idx}" />
        <input type="text" class="form-input color-hex-input" value="#22a7d0" data-gradient-hex="${idx}" />
        <div class="color-preview-small" style="background: #22a7d0"></div>
        <button type="button" class="btn-remove-color" data-remove-gradient="${idx}">×</button>
      `;
      gradientList.appendChild(newColor);
      updateGradientPreview();
      updateSaveStatus('unsaved');
    });
  }

  // Remove colors
  document.addEventListener('click', (e) => {
    if (e.target.dataset.removeColor !== undefined) {
      e.target.closest('.color-item').remove();
      updateSaveStatus('unsaved');
    } else if (e.target.dataset.removeGradient !== undefined) {
      e.target.closest('.color-item').remove();
      updateGradientPreview();
      updateSaveStatus('unsaved');
    }
  });

  // Features
  const addFeatureBtn = document.getElementById('add-feature-btn');
  if (addFeatureBtn) {
    addFeatureBtn.addEventListener('click', () => {
      const featuresList = document.getElementById('features-list');
      const idx = featuresList.children.length;
      const newFeature = document.createElement('div');
      newFeature.className = 'feature-item';
      newFeature.innerHTML = `
        <input type="text" class="form-input" value="" data-feature-index="${idx}" placeholder="Característica del producto" />
        <button type="button" class="btn-remove-feature" data-remove-feature="${idx}">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      `;
      featuresList.appendChild(newFeature);
      updateSaveStatus('unsaved');
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-remove-feature]')) {
      e.target.closest('.feature-item').remove();
      updateSaveStatus('unsaved');
    }
  });

  // Detailed Features
  const addDetailedBtn = document.getElementById('add-detailed-feature-btn');
  if (addDetailedBtn) {
    addDetailedBtn.addEventListener('click', () => {
      const detailedList = document.getElementById('detailed-features-list');
      const idx = detailedList.children.length;
      const newFeature = document.createElement('div');
      newFeature.className = 'detailed-feature-item';
      newFeature.dataset.detailedIndex = idx;
      newFeature.innerHTML = `
        <div class="detailed-feature-header">
          <h4>Feature ${idx + 1}</h4>
          <button type="button" class="btn-remove-detailed" data-remove-detailed="${idx}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="form-group-inline">
          <label class="form-label-small">Ícono</label>
          <select class="form-select-small" data-detailed-icon="${idx}">
            <option value="radio">radio</option>
            <option value="map">map</option>
            <option value="cloud">cloud</option>
            <option value="warning">warning</option>
            <option value="certificate">certificate</option>
            <option value="lightning">lightning</option>
            <option value="shield">shield</option>
            <option value="star">star</option>
            <option value="globe">globe</option>
            <option value="rocket">rocket</option>
          </select>
        </div>
        <div class="form-group-inline">
          <label class="form-label-small">Título (ES)</label>
          <input type="text" class="form-input-small" placeholder="Título" value="" data-detailed-title-es="${idx}" />
        </div>
        <div class="form-group-inline">
          <label class="form-label-small">Título (EN)</label>
          <input type="text" class="form-input-small" placeholder="Title" value="" data-detailed-title-en="${idx}" />
        </div>
        <div class="form-group-inline">
          <label class="form-label-small">Descripción (ES)</label>
          <textarea class="form-textarea-small" rows="2" placeholder="Descripción..." data-detailed-desc-es="${idx}"></textarea>
        </div>
        <div class="form-group-inline">
          <label class="form-label-small">Descripción (EN)</label>
          <textarea class="form-textarea-small" rows="2" placeholder="Description..." data-detailed-desc-en="${idx}"></textarea>
        </div>
      `;
      detailedList.appendChild(newFeature);
      updateSaveStatus('unsaved');
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-remove-detailed]')) {
      e.target.closest('.detailed-feature-item').remove();
      updateSaveStatus('unsaved');
    }
  });

  // Tags
  const addTagBtn = document.getElementById('add-tag-btn');
  const tagInput = document.getElementById('tag-input');

  if (addTagBtn && tagInput) {
    const addTag = () => {
      const tagValue = tagInput.value.trim();
      if (!tagValue) return;

      const tagsList = document.getElementById('tags-list');
      const idx = tagsList.children.length;
      const newTag = document.createElement('div');
      newTag.className = 'tag-chip';
      newTag.innerHTML = `
        <span>${tagValue}</span>
        <button type="button" class="tag-remove" data-remove-tag="${idx}">×</button>
      `;
      tagsList.appendChild(newTag);
      tagInput.value = '';
      updateSaveStatus('unsaved');
    };

    addTagBtn.addEventListener('click', addTag);
    tagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-remove-tag]')) {
      e.target.closest('.tag-chip').remove();
      updateSaveStatus('unsaved');
    }
  });
}

function initializeLivePreview() {
  updateLivePreview();
}

function updateLivePreview() {
  if (previewUpdateTimeout) clearTimeout(previewUpdateTimeout);

  previewUpdateTimeout = setTimeout(() => {
    const name = document.getElementById('product-name-simple')?.value || 'Nombre del Producto';
    const description = document.getElementById('product-description-simple')?.value || 'Descripción del producto';
    const price = document.getElementById('product-price')?.value || '99';
    const originalPrice = document.getElementById('product-original-price')?.value;
    const rating = document.getElementById('product-rating')?.value || '4.5';
    const image = document.getElementById('product-image')?.value;
    const badge = document.getElementById('product-badge')?.value;

    const preview = document.getElementById('product-preview');
    if (!preview) return;

    // Get badge name and color
    const badgeSelect = document.getElementById('product-badge');
    const badgeName = badgeSelect?.options[badgeSelect.selectedIndex]?.text || '';
    const badgeColor = document.getElementById('product-badge-color')?.value || '#22a7d0';

    // Get colors
    const colors = Array.from(document.querySelectorAll('[data-color-index]')).map(input => input.value);
    const gradientColors = Array.from(document.querySelectorAll('[data-gradient-index]')).map(input => input.value);

    console.log('🎨 Preview Update - Colors:', colors);
    console.log('🎨 Preview Update - Gradient Colors:', gradientColors);

    // Get detailed features
    const detailedFeatures = [];
    document.querySelectorAll('.detailed-feature-item').forEach(item => {
      const idx = item.dataset.detailedIndex;
      const icon = document.getElementById(`detailed-feature-icon-${idx}`)?.value || 'radio';
      const iconColor = document.getElementById(`detailed-feature-color-hex-${idx}`)?.value || '';
      const titleEs = document.getElementById(`detailed-feature-title-es-${idx}`)?.value || '';
      const titleEn = document.getElementById(`detailed-feature-title-en-${idx}`)?.value || '';
      const descEs = document.getElementById(`detailed-feature-desc-es-${idx}`)?.value || '';

      if (titleEs || titleEn) {
        detailedFeatures.push({ icon, iconColor, titleEs, titleEn, descEs });
      }
    });

    console.log('✨ Preview Update - Features:', detailedFeatures);

    preview.innerHTML = `
      <div class="preview-image">
        ${image ?
          `<img src="${image}" alt="${name}" onerror="this.style.display='none'" />` :
          '<div class="preview-no-image">Sin imagen</div>'
        }
        ${badge && badgeName !== 'Sin badge' ? `<span class="preview-badge" style="background: ${badgeColor}">${badgeName}</span>` : ''}
      </div>
      <div class="preview-content">
        <h4 class="preview-product-name">${name}</h4>
        <p class="preview-description">${description.substring(0, 120)}${description.length > 120 ? '...' : ''}</p>
        <div class="preview-rating">
          ${'★'.repeat(Math.floor(parseFloat(rating)))}${'☆'.repeat(5 - Math.floor(parseFloat(rating)))}
          <span class="preview-rating-value">${rating}</span>
        </div>
        <div class="preview-price">
          ${originalPrice ? `
            <span class="preview-price-original">$${originalPrice}</span>
            <span class="preview-price-current">$${price}</span>
            <span class="preview-discount">-${Math.round(((originalPrice - price) / originalPrice) * 100)}%</span>
          ` : `
            <span class="preview-price-single">$${price}</span>
          `}
        </div>
      </div>

      ${colors.length > 0 ? `
        <div class="preview-section">
          <h5 class="preview-section-title">Paleta de Colores</h5>
          <div class="preview-colors">
            ${colors.map(color => `
              <div class="preview-color-swatch" style="background: ${color}" title="${color}"></div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${gradientColors.length > 0 ? `
        <div class="preview-section">
          <h5 class="preview-section-title">Gradiente</h5>
          <div class="preview-gradient" style="background: linear-gradient(135deg, ${gradientColors.join(', ')})"></div>
        </div>
      ` : ''}

      ${detailedFeatures.length > 0 ? `
        <div class="preview-section">
          <h5 class="preview-section-title">Features Detalladas</h5>
          <div class="preview-features">
            ${detailedFeatures.map(feature => `
              <div class="preview-feature-item">
                <div class="preview-feature-icon" data-icon="${feature.icon}" style="${feature.iconColor ? `color: ${feature.iconColor}; background: ${feature.iconColor}20;` : ''}">${getIconSVG(feature.icon)}</div>
                <div class="preview-feature-content">
                  <div class="preview-feature-title">${feature.titleEs || feature.titleEn}</div>
                  <div class="preview-feature-desc">${(feature.descEs || '').substring(0, 60)}${(feature.descEs || '').length > 60 ? '...' : ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }, 300);
}


function initializeSaveButton() {
  const saveBtn = document.getElementById('save-product-btn');
  saveBtn.addEventListener('click', saveProduct);
}

async function saveProduct(e) {
  e.preventDefault();

  const form = document.getElementById('product-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const saveBtn = document.getElementById('save-product-btn');
  const originalHTML = saveBtn.innerHTML;

  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner"></span> Guardando...';
    updateSaveStatus('saving');

    // Collect multilingual data
    const name = {
      es: document.getElementById('name-es')?.value || '',
      en: document.getElementById('name-en')?.value || ''
    };

    const title = {
      es: document.getElementById('title-es')?.value || '',
      en: document.getElementById('title-en')?.value || ''
    };

    const description = {
      es: document.getElementById('description-es')?.value || '',
      en: document.getElementById('description-en')?.value || ''
    };

    const shortDescription = {
      es: document.getElementById('shortDescription-es')?.value || '',
      en: document.getElementById('shortDescription-en')?.value || ''
    };

    const longDescription = {
      es: document.getElementById('longDescription-es')?.value || '',
      en: document.getElementById('longDescription-en')?.value || ''
    };

    // Collect colors
    const colors = [];
    document.querySelectorAll('[data-color-index]').forEach(input => {
      colors.push(input.value);
    });

    const detailGradientColors = [];
    document.querySelectorAll('[data-gradient-index]').forEach(input => {
      detailGradientColors.push(input.value);
    });

    // Collect features
    const features = [];
    document.querySelectorAll('[data-feature-index]').forEach(input => {
      if (input.value.trim()) features.push(input.value.trim());
    });

    // Collect detailed features
    const detailedFeatures = [];
    document.querySelectorAll('.detailed-feature-item').forEach(item => {
      const idx = item.dataset.detailedIndex;
      const iconColor = document.getElementById(`detailed-feature-color-hex-${idx}`)?.value || '';
      const feature = {
        icon: document.querySelector(`[data-detailed-icon="${idx}"]`)?.value || 'radio',
        title: {
          es: document.querySelector(`[data-detailed-title-es="${idx}"]`)?.value || '',
          en: document.querySelector(`[data-detailed-title-en="${idx}"]`)?.value || ''
        },
        description: {
          es: document.querySelector(`[data-detailed-desc-es="${idx}"]`)?.value || '',
          en: document.querySelector(`[data-detailed-desc-en="${idx}"]`)?.value || ''
        }
      };
      // Solo agregar iconColor si está definido
      if (iconColor) {
        feature.iconColor = iconColor;
      }
      if (feature.title.es || feature.title.en) {
        detailedFeatures.push(feature);
      }
    });

    // Collect tags
    const tags = [];
    document.querySelectorAll('.tag-chip span').forEach(span => {
      tags.push(span.textContent.trim());
    });

    // Product ID
    let productId = document.getElementById('product-id')?.value?.trim();
    if (!productId && !currentProduct) {
      // Generate from simple name
      const simpleName = document.getElementById('product-name-simple')?.value || 'product';
      productId = simpleName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    } else if (!productId && currentProduct) {
      productId = currentProduct.id;
    }

    // Simple string values for backward compatibility
    const simpleName = document.getElementById('product-name-simple')?.value || '';
    const simpleDescription = document.getElementById('product-description-simple')?.value || '';

    const productData = {
      id: productId,
      // Multilingual fields (primary)
      name: name,
      title: title,
      description: description,
      shortDescription: shortDescription,
      longDescription: longDescription,
      // Images and visual
      image: document.getElementById('product-image')?.value || '',
      imageURL: document.getElementById('product-image')?.value || '',
      colors: colors,
      detailGradientColors: detailGradientColors,
      // Category and badges
      category: document.getElementById('product-category')?.value || '',
      badge: document.getElementById('product-badge')?.value || null,
      badgeColor: document.getElementById('product-badge-color-hex')?.value || '#22a7d0',
      tags: tags,
      // Pricing
      price: parseFloat(document.getElementById('product-price')?.value) || 0,
      originalPrice: parseFloat(document.getElementById('product-original-price')?.value) || null,
      offerId: document.getElementById('product-offer')?.value || null,
      // Rating
      rating: parseFloat(document.getElementById('product-rating')?.value) || 4.5,
      reviews: parseInt(document.getElementById('product-reviews')?.value) || 0,
      // Features
      features: features,
      detailedFeatures: detailedFeatures,
      // Advanced
      appUrl: document.getElementById('product-app-url')?.value || '',
      databaseId: document.getElementById('product-database-id')?.value || null,
      showOnHomepage: document.getElementById('product-homepage')?.checked || false,
      // Timestamps
      updatedAt: serverTimestamp()
    };

    if (currentProduct) {
      // Update
      await setDoc(doc(db, 'products', productId), {
        ...productData,
        createdAt: currentProduct.createdAt
      });
      showToast('Producto actualizado exitosamente', 'success');
    } else {
      // Create
      await setDoc(doc(db, 'products', productId), {
        ...productData,
        createdAt: serverTimestamp()
      });
      showToast('Producto creado exitosamente', 'success');

      // Redirect to edit mode
      setTimeout(() => {
        window.location.hash = `#/admin/product/${productId}`;
      }, 1000);
    }

    updateSaveStatus('saved');
  } catch (error) {
    console.error('Error saving product:', error);
    showToast('Error al guardar: ' + error.message, 'error');
    updateSaveStatus('error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalHTML;
  }
}

function updateSaveStatus(status) {
  const indicator = document.getElementById('save-status');
  const dot = indicator.querySelector('.status-dot');
  const text = indicator.querySelector('span');

  indicator.className = 'status-indicator ' + status;

  const messages = {
    unsaved: 'Cambios sin guardar',
    saving: 'Guardando...',
    saved: 'Guardado',
    error: 'Error al guardar'
  };

  text.textContent = messages[status] || 'Sin cambios';
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '<path d="M6 10L9 13L14 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    error: '<path d="M10 6V10M10 13H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    info: '<circle cx="10" cy="10" r="1" fill="currentColor"/>'
  };

  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      ${icons[type]}
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

// Helper functions for categories, badges, offers
async function getCategoriesFromFirebase() {
  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

async function getBadgesFromFirebase() {
  try {
    const snapshot = await getDocs(collection(db, 'badges'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error loading badges:', error);
    return [];
  }
}

async function getOffersFromFirebase() {
  try {
    const snapshot = await getDocs(collection(db, 'offers'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(o => o.active);
  } catch (error) {
    console.error('Error loading offers:', error);
    return [];
  }
}

function injectStyles() {
  if (document.getElementById('product-form-styles')) return;

  const style = document.createElement('style');
  style.id = 'product-form-styles';
  style.textContent = `
    .product-form-page {
      min-height: 100vh;
      background: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding-bottom: 100px;
    }

    /* Floating Save Bar */
    .floating-save-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-top: 1px solid #e1e4e8;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
      z-index: 100;
      padding: 1rem 2rem;
    }

    .save-bar-content {
      max-width: 1600px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #8b949e;
      animation: pulse 2s infinite;
    }

    .status-indicator.unsaved .status-dot {
      background: #fb8500;
      animation: pulse 1s infinite;
    }

    .status-indicator.saving .status-dot {
      background: #0969da;
      animation: spin 1s linear infinite;
    }

    .status-indicator.saved .status-dot {
      background: #1a7f37;
      animation: none;
    }

    .status-indicator.error .status-dot {
      background: #cf222e;
      animation: none;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .save-bar-right {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .btn-ghost-bar {
      padding: 0.75rem 1.5rem;
      border: none;
      background: transparent;
      color: #57606a;
      font-weight: 600;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-block;
    }

    .btn-ghost-bar:hover {
      background: #f6f8fa;
      color: #24292f;
    }

    .btn-primary-bar {
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #22a7d0 0%, #1a8fb8 100%);
      color: white;
      border: none;
      font-weight: 600;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 2px 8px rgba(34, 167, 208, 0.25);
    }

    .btn-primary-bar:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(34, 167, 208, 0.35);
    }

    .btn-primary-bar:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Tabs Navigation */
    .tabs-navigation {
      display: flex;
      gap: 8px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 4px;
      margin-bottom: 24px;
      overflow-x: auto;
    }

    .tab-btn {
      flex: 1;
      min-width: fit-content;
      padding: 12px 16px;
      background: transparent;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab-btn svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .tab-btn:hover {
      background: #f3f4f6;
      color: #111827;
    }

    .tab-btn.active {
      background: #22a7d0;
      color: white;
    }

    .tab-content {
      display: none;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 32px;
    }

    .tab-content.active {
      display: block;
    }

    /* Header */
    .form-header {
      max-width: 1600px;
      margin: 0 auto;
      padding: 3rem 2rem 2rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #57606a;
      margin-bottom: 1.5rem;
    }

    .breadcrumb-link {
      color: #57606a;
      text-decoration: none;
      transition: color 0.2s;
    }

    .breadcrumb-link:hover {
      color: #22a7d0;
    }

    .breadcrumb-sep {
      color: #d0d7de;
    }

    .breadcrumb-current {
      color: #24292f;
      font-weight: 500;
    }

    .form-title {
      font-family: 'Playfair Display', serif;
      font-size: 3rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: #24292f;
      letter-spacing: -0.02em;
    }

    .form-subtitle {
      font-size: 1.125rem;
      color: #57606a;
      margin: 0;
      line-height: 1.6;
    }

    /* Layout */
    .form-layout {
      max-width: 1600px;
      margin: 0 auto;
      padding: 0 2rem;
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 3rem;
      align-items: start;
    }

    .form-column {
      min-width: 0;
    }

    .product-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Sections */
    .form-section {
      background: white;
      border: 1px solid #d0d7de;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s;
    }

    .form-section.expandable .section-header {
      cursor: pointer;
      user-select: none;
    }

    .form-section.expandable .section-header:hover {
      background: #f6f8fa;
    }

    .form-section.expanded .expand-toggle svg {
      transform: rotate(180deg);
    }

    .section-header {
      padding: 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      border-bottom: 1px solid #d0d7de;
    }

    .section-header.clickable {
      position: relative;
    }

    .section-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: linear-gradient(135deg, #e8f4f8 0%, #d4ebf2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #22a7d0;
      flex-shrink: 0;
    }

    .section-header-content {
      flex: 1;
    }

    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
      color: #24292f;
    }

    .section-description {
      font-size: 0.875rem;
      color: #57606a;
      margin: 0;
    }

    .expand-toggle {
      background: transparent;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #57606a;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .expand-toggle:hover {
      color: #22a7d0;
    }

    .expand-toggle svg {
      transition: transform 0.3s;
    }

    .section-content {
      padding: 2rem 1.5rem;
    }

    /* Form Elements */
    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-label {
      display: block;
      font-weight: 600;
      font-size: 0.875rem;
      color: #24292f;
      margin-bottom: 0.5rem;
    }

    .required {
      color: #cf222e;
      margin-left: 0.25rem;
    }

    .form-input,
    .form-select,
    .form-textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-family: 'Work Sans', sans-serif;
      transition: all 0.2s;
      background: white;
    }

    .form-input:focus,
    .form-select:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #22a7d0;
      box-shadow: 0 0 0 3px rgba(34, 167, 208, 0.1);
    }

    .form-input-large {
      font-size: 1.125rem;
      padding: 1rem 1.25rem;
      font-weight: 500;
    }

    .form-textarea {
      resize: vertical;
      min-height: 120px;
      line-height: 1.6;
    }

    .code-textarea {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.8125rem;
      line-height: 1.5;
    }

    .form-hint {
      font-size: 0.8125rem;
      color: #57606a;
      margin: 0.5rem 0 0 0;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .input-with-icon {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #57606a;
      font-weight: 600;
      pointer-events: none;
    }

    .input-with-icon .form-input {
      padding-left: 2.5rem;
    }

    /* Star Rating */
    .rating-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .star-rating {
      display: flex;
      gap: 0.5rem;
    }

    .rating-display {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem;
      font-weight: 600;
      color: #d4af37;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .star {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: #d0d7de;
      transition: all 0.2s;
    }

    .star:hover,
    .star.active {
      color: #fb8500;
      transform: scale(1.1);
    }

    /* Checkbox */
    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
      padding: 1rem;
      background: #f6f8fa;
      border-radius: 8px;
      transition: background 0.2s;
    }

    .checkbox-label:hover {
      background: #eaeef2;
    }

    .checkbox-label input[type="checkbox"] {
      display: none;
    }

    .checkbox-custom {
      width: 20px;
      height: 20px;
      border: 2px solid #d0d7de;
      border-radius: 4px;
      flex-shrink: 0;
      position: relative;
      transition: all 0.2s;
    }

    .checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
      background: #22a7d0;
      border-color: #22a7d0;
    }

    .checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 2px;
      width: 6px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .checkbox-text {
      flex: 1;
    }

    .checkbox-text small {
      display: block;
      color: #57606a;
      font-size: 0.8125rem;
      margin-top: 0.25rem;
    }

    /* Image Preview */
    .image-preview {
      margin-top: 1rem;
      border: 2px dashed #d0d7de;
      border-radius: 8px;
      overflow: hidden;
      aspect-ratio: 16/9;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f6f8fa;
    }

    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-image {
      color: #8b949e;
      font-size: 0.875rem;
    }

    /* Database Stats */
    .database-stats {
      margin: 1.5rem 0;
    }

    .stat-card {
      background: linear-gradient(135deg, #e8f4f8 0%, #d4ebf2 100%);
      border: 1px solid #b8dce5;
      border-radius: 10px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      background: rgba(34, 167, 208, 0.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #22a7d0;
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: 0.8125rem;
      color: #57606a;
      margin: 0 0 0.5rem 0;
      font-weight: 500;
    }

    .stat-value {
      font-family: 'Playfair Display', serif;
      font-size: 2rem;
      font-weight: 700;
      color: #24292f;
      margin: 0;
    }

    /* Questions Manager */
    .questions-manager {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #d0d7de;
    }

    .btn-expand {
      width: 100%;
      padding: 0.875rem;
      background: #f6f8fa;
      border: 1px solid #d0d7de;
      color: #24292f;
      font-weight: 600;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-expand:hover {
      background: #eaeef2;
      border-color: #afb8c1;
    }

    .questions-form {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #d0d7de;
    }

    .info-banner {
      background: #ddf4ff;
      border: 1px solid #54aeff;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .info-banner svg {
      color: #0969da;
      flex-shrink: 0;
    }

    .banner-title {
      font-weight: 600;
      color: #0a3069;
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
    }

    .banner-text {
      font-size: 0.8125rem;
      color: #0550ae;
      margin: 0;
    }

    .banner-text code {
      background: rgba(5, 80, 174, 0.1);
      padding: 0.125rem 0.375rem;
      border-radius: 3px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 0.75rem;
    }

    .stats-row-inline {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .stat-mini {
      flex: 1;
      background: #f6f8fa;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-mini-label {
      font-size: 0.75rem;
      color: #57606a;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-mini-value {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #24292f;
    }

    .stat-mini-value.accent {
      color: #1a7f37;
    }

    .validation-msg {
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .validation-msg.success {
      background: #dafbe1;
      border: 1px solid #4ac26b;
    }

    .validation-msg.success svg {
      color: #1a7f37;
    }

    .validation-msg.success strong {
      color: #0f4221;
    }

    .validation-msg.success p {
      color: #116329;
      font-size: 0.8125rem;
      margin: 0.25rem 0 0 0;
    }

    .validation-msg.error {
      background: #ffebe9;
      border: 1px solid #ff8182;
    }

    .validation-msg.error svg {
      color: #cf222e;
    }

    .validation-msg.error strong {
      color: #82071e;
    }

    .validation-msg.error p {
      color: #a0111f;
      font-size: 0.8125rem;
      margin: 0.25rem 0 0 0;
      white-space: pre-wrap;
    }

    .button-row {
      display: flex;
      gap: 1rem;
    }

    .btn-secondary,
    .btn-success {
      flex: 1;
      padding: 0.875rem 1.5rem;
      border: none;
      font-weight: 600;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-secondary {
      background: #6e40c9;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a32a3;
      transform: translateY(-1px);
    }

    .btn-success {
      background: #1a7f37;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #116329;
      transform: translateY(-1px);
    }

    .btn-success:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Metadata */
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      padding: 1rem;
      background: #f6f8fa;
      border-radius: 8px;
    }

    .metadata-item label {
      display: block;
      font-size: 0.75rem;
      color: #57606a;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .metadata-item p {
      font-size: 0.875rem;
      color: #24292f;
      margin: 0;
      font-family: 'SF Mono', Monaco, monospace;
    }

    /* Preview Column */
    .preview-column {
      position: relative;
    }

    .preview-sticky {
      position: sticky;
      top: 2rem;
    }

    .preview-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      color: #24292f;
    }

    .preview-subtitle {
      font-size: 0.875rem;
      color: #57606a;
      margin: 0 0 1.5rem 0;
    }

    .product-preview-card {
      background: white;
      border: 1px solid #d0d7de;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: transform 0.3s;
    }

    .product-preview-card:hover {
      transform: translateY(-2px);
    }

    .preview-image {
      position: relative;
      aspect-ratio: 16/9;
      background: linear-gradient(135deg, #e8f4f8 0%, #d4ebf2 100%);
    }

    .preview-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .preview-no-image {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #8b949e;
      font-size: 0.875rem;
    }

    .preview-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: white;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #22a7d0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .preview-content {
      padding: 1.5rem;
    }

    .preview-product-name {
      font-family: 'Playfair Display', serif;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      color: #24292f;
    }

    .preview-description {
      font-size: 0.875rem;
      color: #57606a;
      margin: 0 0 1rem 0;
      line-height: 1.6;
    }

    .preview-rating {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      color: #fb8500;
      font-size: 0.875rem;
    }

    .preview-rating-value {
      color: #24292f;
      font-weight: 600;
    }

    .preview-price {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .preview-price-single {
      font-family: 'Playfair Display', serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #24292f;
    }

    .preview-price-original {
      font-size: 1rem;
      color: #8b949e;
      text-decoration: line-through;
    }

    .preview-price-current {
      font-family: 'Playfair Display', serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a7f37;
    }

    .preview-discount {
      background: #dafbe1;
      color: #0f4221;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    /* Preview Sections */
    .preview-section {
      padding: 1.5rem;
      border-top: 1px solid #d0d7de;
    }

    .preview-section-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #24292f;
      margin: 0 0 1rem 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Colors Preview */
    .preview-colors {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .preview-color-swatch {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      border: 2px solid #d0d7de;
      cursor: help;
      transition: transform 0.2s;
    }

    .preview-color-swatch:hover {
      transform: scale(1.1);
      border-color: #22a7d0;
    }

    /* Gradient Preview */
    .preview-gradient {
      height: 80px;
      border-radius: 8px;
      border: 1px solid #d0d7de;
    }

    /* Features Preview */
    .preview-features {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .preview-feature-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f6f8fa;
      border-radius: 6px;
      border: 1px solid #d0d7de;
    }

    .preview-feature-icon {
      width: 32px;
      height: 32px;
      min-width: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 4px;
      color: #22a7d0;
    }

    /* Icon-specific colors */
    .preview-feature-icon[data-icon="radio"] { color: #8b5cf6; background: #f5f3ff; }
    .preview-feature-icon[data-icon="map"] { color: #10b981; background: #ecfdf5; }
    .preview-feature-icon[data-icon="cloud"] { color: #3b82f6; background: #eff6ff; }
    .preview-feature-icon[data-icon="warning"] { color: #f59e0b; background: #fffbeb; }
    .preview-feature-icon[data-icon="certificate"] { color: #14b8a6; background: #f0fdfa; }
    .preview-feature-icon[data-icon="lightning"] { color: #eab308; background: #fefce8; }
    .preview-feature-icon[data-icon="shield"] { color: #6366f1; background: #eef2ff; }
    .preview-feature-icon[data-icon="star"] { color: #f59e0b; background: #fffbeb; }
    .preview-feature-icon[data-icon="globe"] { color: #06b6d4; background: #ecfeff; }
    .preview-feature-icon[data-icon="rocket"] { color: #ec4899; background: #fdf2f8; }

    .preview-feature-icon svg {
      width: 18px;
      height: 18px;
    }

    .preview-feature-content {
      flex: 1;
    }

    .preview-feature-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #24292f;
      margin-bottom: 0.25rem;
    }

    .preview-feature-desc {
      font-size: 0.75rem;
      color: #57606a;
      line-height: 1.4;
    }

    .preview-tips {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #fff8e5;
      border: 1px solid #ffd33d;
      border-radius: 10px;
    }

    .tip-title {
      font-weight: 700;
      color: #6f4e00;
      margin: 0 0 1rem 0;
    }

    .tips-list {
      margin: 0;
      padding-left: 1.25rem;
      color: #735c0f;
      font-size: 0.875rem;
      line-height: 1.8;
    }

    .tips-list li {
      margin-bottom: 0.5rem;
    }

    /* Toast */
    .toast-container {
      position: fixed;
      bottom: 120px;
      right: 2rem;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .toast {
      background: white;
      border-radius: 10px;
      padding: 1rem 1.25rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 300px;
      border: 1px solid #d0d7de;
      transform: translateX(400px);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast.show {
      transform: translateX(0);
    }

    .toast-success {
      border-left: 3px solid #1a7f37;
    }

    .toast-success svg {
      color: #1a7f37;
    }

    .toast-error {
      border-left: 3px solid #cf222e;
    }

    .toast-error svg {
      color: #cf222e;
    }

    .toast span {
      font-size: 0.875rem;
      color: #24292f;
      font-weight: 500;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
    }

    /* Language Sections */
    .lang-section {
      margin-bottom: 32px;
      padding-bottom: 32px;
      border-bottom: 1px solid #e5e7eb;
    }

    .lang-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .lang-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 20px 0;
    }

    .lang-flag {
      width: 24px;
      height: 18px;
      border-radius: 3px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* Color Pickers */
    .color-input-group {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .color-picker {
      width: 60px;
      height: 40px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .color-picker:hover {
      border-color: #22a7d0;
    }

    .color-hex {
      flex: 1;
    }

    .color-preview {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
    }

    .colors-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .color-item {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }

    .color-hex-input {
      flex: 1;
      font-family: 'Monaco', monospace;
      font-size: 13px;
    }

    /* Icon color picker group */
    .color-picker-group {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .icon-color-picker {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: all 0.2s;
    }

    .icon-color-picker:hover {
      border-color: #22a7d0;
    }

    .btn-reset-color {
      width: 32px;
      height: 32px;
      background: #f3f4f6;
      color: #6b7280;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .btn-reset-color:hover {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }

    .form-hint-tiny {
      font-size: 11px;
      color: #8b949e;
      margin-top: 4px;
    }

    .color-preview-small {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
      flex-shrink: 0;
    }

    .btn-remove-color {
      width: 32px;
      height: 32px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .btn-remove-color:hover {
      background: #dc2626;
    }

    .btn-add-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      color: #374151;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-add-item:hover {
      border-color: #22a7d0;
      color: #22a7d0;
    }

    .gradient-preview {
      margin-top: 20px;
    }

    .gradient-preview-box {
      height: 100px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      margin-bottom: 8px;
    }

    /* Features */
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .feature-item {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .feature-item input {
      flex: 1;
    }

    .btn-remove-feature {
      width: 36px;
      height: 36px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .btn-remove-feature:hover {
      background: #dc2626;
    }

    /* Detailed Features */
    .detailed-features-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 16px;
    }

    .detailed-feature-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
    }

    .detailed-feature-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .detailed-feature-header h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .btn-remove-detailed {
      width: 32px;
      height: 32px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-remove-detailed:hover {
      background: #dc2626;
    }

    .form-group-inline {
      margin-bottom: 16px;
    }

    .form-group-inline:last-child {
      margin-bottom: 0;
    }

    .form-label-small {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    }

    .form-input-small,
    .form-select-small {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
      background: white;
    }

    .form-textarea-small {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
      background: white;
      resize: vertical;
      min-height: 60px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .icon-preview {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: #e0f2fe;
      color: #22a7d0;
      border-radius: 6px;
      margin-top: 8px;
    }

    /* Tags */
    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
      min-height: 40px;
      padding: 8px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }

    .tag-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
    }

    .tag-remove {
      background: transparent;
      border: none;
      color: #0369a1;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
      transition: all 0.2s;
    }

    .tag-remove:hover {
      background: rgba(3, 105, 161, 0.1);
    }

    .tag-input-group {
      display: flex;
      gap: 8px;
    }

    .tag-input-group input {
      flex: 1;
    }

    .btn-add-tag {
      padding: 10px 20px;
      background: #22a7d0;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-add-tag:hover {
      background: #1e96bc;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .form-layout {
        grid-template-columns: 1fr;
      }

      .preview-column {
        order: -1;
      }

      .preview-sticky {
        position: relative;
        top: 0;
      }
    }

    @media (max-width: 768px) {
      .form-title {
        font-size: 2rem;
      }

      .form-layout {
        padding: 0 1rem;
      }

      .form-header {
        padding: 2rem 1rem 1.5rem;
      }

      .floating-save-bar {
        padding: 0.75rem 1rem;
      }

      .save-bar-content {
        flex-direction: column;
        gap: 0.75rem;
      }

      .save-bar-right {
        width: 100%;
      }

      .btn-primary-bar {
        flex: 1;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .button-row {
        flex-direction: column;
      }

      .toast-container {
        left: 1rem;
        right: 1rem;
      }

      .toast {
        min-width: auto;
      }
    }
  `;

  document.head.appendChild(style);
}
