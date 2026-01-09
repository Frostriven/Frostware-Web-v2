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
          <form id="product-form" class="product-form">

            <!-- Section 1: Basic Info -->
            <section class="form-section" data-section="basic">
              <div class="section-header">
                <div class="section-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </div>
                <div>
                  <h2 class="section-title">Información Básica</h2>
                  <p class="section-description">Nombre, descripción y categorización del producto</p>
                </div>
              </div>

              <div class="section-content">
                <div class="form-group">
                  <label class="form-label" for="product-name">
                    Nombre del Producto
                    <span class="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="product-name"
                    class="form-input form-input-large"
                    placeholder="NAT OPS - North Atlantic Operations Guide"
                    value="${currentProduct?.name || ''}"
                    required
                  />
                  <p class="form-hint">Nombre completo que se mostrará en el catálogo</p>
                </div>

                <div class="form-group">
                  <label class="form-label" for="product-description">
                    Descripción
                    <span class="required">*</span>
                  </label>
                  <textarea
                    id="product-description"
                    class="form-textarea"
                    rows="4"
                    placeholder="Guía completa de operaciones en el Atlántico Norte con preguntas interactivas..."
                    required
                  >${currentProduct?.description || ''}</textarea>
                  <p class="form-hint">Describe el producto y sus beneficios principales</p>
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
                  <label class="form-label" for="product-offer">
                    Oferta Asociada
                  </label>
                  <select id="product-offer" class="form-select">
                    <option value="">Sin oferta</option>
                    ${offers.map(offer => `
                      <option value="${offer.id}" ${currentProduct?.offerId === offer.id ? 'selected' : ''}>
                        ${offer.description} (${offer.discountPrice > 0 ? '$' + offer.discountPrice : 'GRATIS'})
                      </option>
                    `).join('')}
                  </select>
                  <p class="form-hint">Las ofertas se gestionan en la sección de Ofertas del panel admin</p>
                </div>
              </div>
            </section>

            <!-- Section 2: Pricing -->
            <section class="form-section" data-section="pricing">
              <div class="section-header">
                <div class="section-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <div>
                  <h2 class="section-title">Precio y Valoración</h2>
                  <p class="section-description">Configura el precio y rating del producto</p>
                </div>
              </div>

              <div class="section-content">
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
                        value="${currentProduct?.price || ''}"
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
                        value="${currentProduct?.originalPrice || ''}"
                      />
                    </div>
                    <p class="form-hint">Opcional, para mostrar descuento</p>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">
                      Rating
                    </label>
                    <div class="rating-container">
                      <div class="star-rating" id="star-rating">
                        ${[1, 2, 3, 4, 5].map(star => `
                          <button type="button" class="star ${(currentProduct?.rating || 4.5) >= star ? 'active' : ''}" data-rating="${star}">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                            </svg>
                          </button>
                        `).join('')}
                      </div>
                      <div class="rating-display" id="rating-display">${currentProduct?.rating || 4.5} / 5</div>
                    </div>
                    <input type="hidden" id="product-rating" value="${currentProduct?.rating || 4.5}">
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
                      value="${currentProduct?.reviews || Math.floor(Math.random() * 400) + 50}"
                    />
                  </div>
                </div>
              </div>
            </section>

            <!-- Section 3: Media -->
            <section class="form-section" data-section="media">
              <div class="section-header">
                <div class="section-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h2 class="section-title">Medios y Enlaces</h2>
                  <p class="section-description">Imágenes y URLs del producto</p>
                </div>
              </div>

              <div class="section-content">
                <div class="form-group">
                  <label class="form-label" for="product-image">
                    URL de Imagen
                  </label>
                  <input
                    type="url"
                    id="product-image"
                    class="form-input"
                    placeholder="https://example.com/image.jpg"
                    value="${currentProduct?.imageURL || currentProduct?.image || ''}"
                  />
                  <div class="image-preview" id="image-preview">
                    ${currentProduct?.imageURL || currentProduct?.image ?
                      `<img src="${currentProduct.imageURL || currentProduct.image}" alt="Preview" />` :
                      '<div class="no-image">Sin imagen</div>'
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="product-app-url">
                    URL de App/Guía (Post-Compra)
                  </label>
                  <input
                    type="url"
                    id="product-app-url"
                    class="form-input"
                    placeholder="https://apps.frostware.com/nat-ops/"
                    value="${currentProduct?.appUrl || ''}"
                  />
                  <p class="form-hint">URL donde el usuario accederá después de comprar</p>
                </div>
              </div>
            </section>

            <!-- Section 4: Questions Database -->
            <section class="form-section expandable" data-section="database">
              <div class="section-header clickable" data-toggle="database">
                <div class="section-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 5C21 6.65685 16.9706 8 12 8C7.02944 8 3 6.65685 3 5M21 5C21 3.34315 16.9706 2 12 2C7.02944 2 3 3.34315 3 5M21 5V19C21 20.6569 16.9706 22 12 22C7.02944 22 3 20.6569 3 19V5" stroke="currentColor" stroke-width="2"/>
                    <path d="M3 12C3 13.6569 7.02944 15 12 15C16.9706 15 21 13.6569 21 12" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </div>
                <div class="section-header-content">
                  <h2 class="section-title">Base de Datos de Preguntas</h2>
                  <p class="section-description">Gestiona el ID y las preguntas del producto</p>
                </div>
                <button type="button" class="expand-toggle">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>

              <div class="section-content" style="display: none;">
                <div class="form-group">
                  <label class="form-label" for="product-database-id">
                    ID de Base de Datos
                  </label>
                  <input
                    type="text"
                    id="product-database-id"
                    class="form-input"
                    placeholder="nat-ops-questions"
                    value="${currentProduct?.databaseId || ''}"
                  />
                  <p class="form-hint">Identificador único para la colección de preguntas en Firestore</p>
                </div>

                <div class="database-stats">
                  <div class="stat-card">
                    <div class="stat-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </div>
                    <div class="stat-content">
                      <p class="stat-label">Preguntas Actuales</p>
                      <p class="stat-value" id="current-db-count">-</p>
                    </div>
                  </div>
                </div>

                <!-- Questions Manager -->
                <div class="questions-manager">
                  <button type="button" class="btn-expand" id="expand-questions-btn">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 5V15M5 10H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Agregar Preguntas desde JSON
                  </button>

                  <div class="questions-form" id="questions-form" style="display: none;">
                    <div class="info-banner">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M10 14V10M10 7H10.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                      <div>
                        <p class="banner-title">Formato del JSON</p>
                        <p class="banner-text">Array con: <code>question</code>, <code>options</code>, <code>correctAnswer</code>, <code>topic</code></p>
                      </div>
                    </div>

                    <div class="stats-row-inline">
                      <div class="stat-mini">
                        <span class="stat-mini-label">En DB</span>
                        <span class="stat-mini-value" id="current-count-inline">-</span>
                      </div>
                      <div class="stat-mini">
                        <span class="stat-mini-label">Detectadas</span>
                        <span class="stat-mini-value accent" id="detected-count">-</span>
                      </div>
                    </div>

                    <div class="form-group">
                      <textarea
                        id="questions-json"
                        class="form-textarea code-textarea"
                        rows="8"
                        placeholder='[{"question":"¿...?","options":["A","B","C","D"],"correctAnswer":0,"topic":"Tema"}]'
                      ></textarea>
                    </div>

                    <div id="validation-msg" class="validation-msg"></div>

                    <div class="button-row">
                      <button type="button" class="btn-secondary" id="process-json-btn">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M16 5L7.5 13.5L4 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Procesar JSON
                      </button>
                      <button type="button" class="btn-success" id="insert-questions-btn" disabled>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 4V16M10 4L6 8M10 4L14 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Insertar a Firebase
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Section 5: Settings -->
            <section class="form-section" data-section="settings">
              <div class="section-header">
                <div class="section-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <div>
                  <h2 class="section-title">Configuración</h2>
                  <p class="section-description">Opciones adicionales y metadatos</p>
                </div>
              </div>

              <div class="section-content">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="product-homepage" ${currentProduct?.showOnHomepage ? 'checked' : ''} />
                    <span class="checkbox-custom"></span>
                    <span class="checkbox-text">
                      Mostrar en página principal
                      <small>El producto aparecerá en la sección destacada del homepage</small>
                    </span>
                  </label>
                </div>

                ${currentProduct ? `
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
            </section>

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
  initializeStarRating();
  initializeImagePreview();
  initializeLivePreview();
  initializeExpandableSections();
  initializeQuestionsManager();
  initializeSaveButton();

  // Load current questions count if editing
  if (currentProduct?.databaseId) {
    await loadCurrentQuestionsCount(currentProduct.databaseId);
  }

  // Monitor for changes
  const form = document.getElementById('product-form');
  form.addEventListener('input', () => {
    updateSaveStatus('unsaved');
    updateLivePreview();
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

function initializeLivePreview() {
  updateLivePreview();
}

function updateLivePreview() {
  if (previewUpdateTimeout) clearTimeout(previewUpdateTimeout);

  previewUpdateTimeout = setTimeout(() => {
    const name = document.getElementById('product-name').value || 'Nombre del Producto';
    const description = document.getElementById('product-description').value || 'Descripción del producto';
    const price = document.getElementById('product-price').value || '99';
    const originalPrice = document.getElementById('product-original-price').value;
    const rating = document.getElementById('product-rating').value || '4.5';
    const image = document.getElementById('product-image').value;
    const badge = document.getElementById('product-badge').value;

    const preview = document.getElementById('product-preview');

    // Get badge name
    const badgeSelect = document.getElementById('product-badge');
    const badgeName = badgeSelect.options[badgeSelect.selectedIndex]?.text || '';

    preview.innerHTML = `
      <div class="preview-image">
        ${image ?
          `<img src="${image}" alt="${name}" onerror="this.style.display='none'" />` :
          '<div class="preview-no-image">Sin imagen</div>'
        }
        ${badge && badgeName !== 'Sin badge' ? `<span class="preview-badge">${badgeName}</span>` : ''}
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
    `;
  }, 300);
}

function initializeExpandableSections() {
  const toggles = document.querySelectorAll('[data-toggle]');

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const section = toggle.closest('.form-section');
      const content = section.querySelector('.section-content');
      const isExpanded = content.style.display !== 'none';

      content.style.display = isExpanded ? 'none' : 'block';
      section.classList.toggle('expanded', !isExpanded);
    });
  });
}

function initializeQuestionsManager() {
  const expandBtn = document.getElementById('expand-questions-btn');
  const questionsForm = document.getElementById('questions-form');
  const processBtn = document.getElementById('process-json-btn');
  const insertBtn = document.getElementById('insert-questions-btn');
  const dbIdInput = document.getElementById('product-database-id');

  expandBtn?.addEventListener('click', () => {
    const isHidden = questionsForm.style.display === 'none';
    questionsForm.style.display = isHidden ? 'block' : 'none';
    expandBtn.innerHTML = isHidden ?
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Ocultar Formulario' :
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 5V15M5 10H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Agregar Preguntas desde JSON';
  });

  dbIdInput?.addEventListener('blur', async () => {
    const dbId = dbIdInput.value.trim();
    if (dbId) {
      await loadCurrentQuestionsCount(dbId);
    }
  });

  processBtn?.addEventListener('click', processQuestionsJSON);
  insertBtn?.addEventListener('click', insertQuestionsToFirebase);
}

async function loadCurrentQuestionsCount(databaseId) {
  try {
    const questionsRef = collection(db, databaseId);
    const snapshot = await getDocs(questionsRef);
    const count = snapshot.size;

    document.getElementById('current-db-count').textContent = count;
    document.getElementById('current-count-inline').textContent = count;
  } catch (error) {
    console.error('Error loading questions count:', error);
    document.getElementById('current-db-count').textContent = 'Error';
    document.getElementById('current-count-inline').textContent = '-';
  }
}

function processQuestionsJSON() {
  const textarea = document.getElementById('questions-json');
  const validationMsg = document.getElementById('validation-msg');
  const detectedCount = document.getElementById('detected-count');
  const insertBtn = document.getElementById('insert-questions-btn');

  try {
    const jsonText = textarea.value.trim();
    if (!jsonText) throw new Error('El campo está vacío');

    const questions = JSON.parse(jsonText);
    if (!Array.isArray(questions)) throw new Error('El JSON debe ser un array');
    if (questions.length === 0) throw new Error('El array está vacío');

    // Validate
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
    validationMsg.className = 'validation-msg success';
    validationMsg.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M6 10L9 13L14 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <div>
        <strong>✓ ${questions.length} preguntas válidas</strong>
        <p>Temas: ${topics.join(', ')}</p>
      </div>
    `;

    insertBtn.disabled = false;
    showToast('JSON procesado correctamente', 'success');
  } catch (error) {
    processedQuestions = null;
    detectedCount.textContent = '0';

    validationMsg.className = 'validation-msg error';
    validationMsg.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 6V10M10 13H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <div>
        <strong>✗ Error en el JSON</strong>
        <p>${error.message}</p>
      </div>
    `;

    insertBtn.disabled = true;
    showToast('Error al procesar JSON', 'error');
  }
}

async function insertQuestionsToFirebase() {
  if (!processedQuestions) {
    showToast('Primero procesa el JSON', 'error');
    return;
  }

  const databaseId = document.getElementById('product-database-id').value.trim();
  if (!databaseId) {
    showToast('Especifica un ID de base de datos', 'error');
    return;
  }

  try {
    const insertBtn = document.getElementById('insert-questions-btn');
    insertBtn.disabled = true;
    insertBtn.innerHTML = '<span class="spinner"></span> Insertando...';

    const questionsRef = collection(db, databaseId);
    const promises = processedQuestions.map(q =>
      addDoc(questionsRef, {
        ...q,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );

    await Promise.all(promises);

    showToast(`✓ ${processedQuestions.length} preguntas insertadas`, 'success');

    // Reset
    document.getElementById('questions-json').value = '';
    document.getElementById('detected-count').textContent = '-';
    document.getElementById('validation-msg').innerHTML = '';
    processedQuestions = null;
    insertBtn.disabled = true;
    insertBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4V16M10 4L6 8M10 4L14 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Insertar a Firebase';

    // Reload count
    await loadCurrentQuestionsCount(databaseId);
  } catch (error) {
    console.error('Error inserting questions:', error);
    showToast('Error al insertar: ' + error.message, 'error');
  }
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

    const productData = {
      name: document.getElementById('product-name').value,
      description: document.getElementById('product-description').value,
      title: document.getElementById('product-name').value,
      shortDescription: document.getElementById('product-description').value,
      category: document.getElementById('product-category').value,
      badge: document.getElementById('product-badge').value || null,
      offerId: document.getElementById('product-offer').value || null,
      price: parseFloat(document.getElementById('product-price').value),
      originalPrice: parseFloat(document.getElementById('product-original-price').value) || null,
      rating: parseFloat(document.getElementById('product-rating').value),
      reviews: parseInt(document.getElementById('product-reviews').value) || 0,
      image: document.getElementById('product-image').value,
      imageURL: document.getElementById('product-image').value,
      appUrl: document.getElementById('product-app-url').value,
      databaseId: document.getElementById('product-database-id').value || null,
      showOnHomepage: document.getElementById('product-homepage').checked,
      features: [],
      tags: [document.getElementById('product-category').value],
      updatedAt: serverTimestamp()
    };

    if (currentProduct) {
      // Update
      await setDoc(doc(db, 'products', currentProduct.id), {
        ...productData,
        id: currentProduct.id,
        createdAt: currentProduct.createdAt
      });
      showToast('✓ Producto actualizado exitosamente', 'success');
    } else {
      // Create
      const newId = productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await setDoc(doc(db, 'products', newId), {
        ...productData,
        id: newId,
        createdAt: serverTimestamp()
      });
      showToast('✓ Producto creado exitosamente', 'success');

      // Redirect to edit mode
      setTimeout(() => {
        window.location.hash = `#/admin/product/${newId}`;
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
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Work+Sans:wght@400;500;600;700&display=swap');

    .product-form-page {
      min-height: 100vh;
      background: #fafbfc;
      font-family: 'Work Sans', sans-serif;
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
