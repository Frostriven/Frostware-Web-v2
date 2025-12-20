import { auth } from './firebase.js';
import { t, i18n } from '../i18n/index.js';
import { getUserProducts } from './userProfile.js';

class ShoppingCart {
    constructor() {
        // CAPA 2: Sistema de recuperación de backup
        let savedCart = localStorage.getItem('cart');

        // Si el carrito está vacío, intentar recuperar del backup
        if (!savedCart || savedCart === '[]') {
            const backupCart = localStorage.getItem('cart_backup');
            const backupTimestamp = localStorage.getItem('cart_backup_timestamp');

            if (backupCart && backupTimestamp) {
                const timeDiff = Date.now() - parseInt(backupTimestamp);
                // Usar backup si es menor a 30 segundos (cambios de idioma recientes)
                if (timeDiff < 30000) {
                    savedCart = backupCart;
                    localStorage.setItem('cart', savedCart);
                    console.log('🔄 Cart restored from backup (age:', timeDiff, 'ms)');
                }
            }
        }

        this.cart = JSON.parse(savedCart) || [];

        this.userPurchasedProducts = new Set();
        this.initializeCart();

        // Force update cart count on initialization
        setTimeout(() => {
            this.updateCartCount();
        }, 200);
    }

    async initializeCart() {
        await this.loadUserPurchasedProducts();
        this.updateCartUI();
        // Wait for DOM elements to be available before binding events
        setTimeout(() => this.bindEvents(), 100);

        // Listen for language changes and update cart content
        window.addEventListener('languageChanged', () => {
            setTimeout(() => {
                this.updateCartUI();
                this.updateAllProductButtons();
                console.log('✅ Cart content and product buttons updated after language change');
            }, 150);
        });
    }

    async loadUserPurchasedProducts() {
        // CAPA 3: Protección múltiple contra borrado de carrito

        // Verificar si tenemos productos en el carrito antes de hacer cualquier cosa
        const hasCartItems = this.cart && this.cart.length > 0;

        // Wait for auth to be ready during page initialization
        let retries = 0;
        while (!auth?.currentUser && retries < 15) { // Aumenté a 15 intentos
            await new Promise(resolve => setTimeout(resolve, 200)); // Aumenté a 200ms
            retries++;
        }

        if (auth?.currentUser) {
            try {
                const userProducts = await getUserProducts(auth.currentUser.uid);
                const purchasedProductIds = userProducts.map(product => product.id);

                this.userPurchasedProducts = new Set(purchasedProductIds);
            } catch (error) {
                console.error('Error loading user products:', error);
                // Don't clear the set on error to prevent false positives
            }
        } else {
            // CAPA 3: NUNCA borrar carrito si tiene productos, sin importar el estado de auth
            if (hasCartItems) {
                console.log('🛡️ PROTECTION: Cart has items - preserving regardless of auth state');
                this.userPurchasedProducts = new Set(); // Solo limpiar productos comprados
                return; // NO borrar carrito
            }

            // Solo borrar si realmente no hay usuario Y no hay productos en carrito
            if (retries >= 15) {
                console.log('⚠️ No user found after extended wait - clearing empty cart');
                this.cart = [];
                localStorage.removeItem('cart');
                this.userPurchasedProducts = new Set();
            } else {
                console.log('🔄 Auth not ready yet - keeping cart intact');
            }
        }
    }

    bindEvents() {
        // Remove existing event listeners to prevent duplicates
        const existingCartButton = document.getElementById('cart-button');
        if (existingCartButton) {
            existingCartButton.replaceWith(existingCartButton.cloneNode(true));
        }

        // Botón del carrito en el header
        const cartButton = document.getElementById('cart-button');
        if (cartButton) {
            cartButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Cart button clicked');
                this.openCart();
            });
            console.log('Cart button event bound');
        } else {
            console.log('Cart button not found');
        }

        // Botón cerrar modal
        const closeButton = document.getElementById('cart-close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.closeCart());
        }

        // Limpiar carrito - Remove existing event listeners to prevent duplicates
        const existingClearButton = document.getElementById('clear-cart');
        if (existingClearButton) {
            existingClearButton.replaceWith(existingClearButton.cloneNode(true));
        }

        const clearButton = document.getElementById('clear-cart');
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearCart());
        }

        // Procesar pago - Remove existing event listeners to prevent duplicates
        const existingPayButton = document.getElementById('process-payment');
        if (existingPayButton) {
            existingPayButton.replaceWith(existingPayButton.cloneNode(true));
        }

        const payButton = document.getElementById('process-payment');
        if (payButton) {
            payButton.addEventListener('click', () => this.processPayment());
        }

        // Cerrar modal al hacer click fuera
        const modal = document.getElementById('cart-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeCart();
                }
            });
        }
    }

    addToCart(product) {
        // Verificar si el producto ya fue comprado
        if (this.userPurchasedProducts.has(product.id)) {
            this.showToast(t('cart.messages.alreadyOwned'), 'info');
            return false;
        }

        // Verificar si el producto ya está en el carrito
        const existingProduct = this.cart.find(item => item.id === product.id);
        if (existingProduct) {
            this.showToast(t('cart.messages.alreadyInCart'), 'info');
            return false;
        }

        // Agregar al carrito usando Firebase field names
        this.cart.push({
            id: product.id,
            title: product.title,
            price: product.price || 0,
            imageURL: product.imageURL,
            shortDescription: product.shortDescription
        });

        this.saveCart();
        this.updateCartUI();
        this.updateAllProductButtons();
        this.showToast(t('cart.messages.addedToCart'), 'success');
        return true;
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
        this.updateAllProductButtons();
        this.showToast(t('cart.messages.removedFromCart'), 'removed');
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
        this.updateAllProductButtons();
        this.showToast(t('cart.messages.cartCleared'), 'warning');
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));

        // CAPA 4: Sistema de vigilancia y auto-recuperación
        // Crear múltiples backups en diferentes claves
        if (this.cart.length > 0) {
            localStorage.setItem('cart_backup', JSON.stringify(this.cart));
            localStorage.setItem('cart_backup_timestamp', Date.now().toString());
            localStorage.setItem('cart_emergency_backup', JSON.stringify(this.cart));
        }

        // CAPA 4: Auto-vigilancia - verificar que no se pierda
        setTimeout(() => {
            const currentCart = localStorage.getItem('cart');
            if (this.cart.length > 0 && (!currentCart || currentCart === '[]')) {
                console.log('🚨 CART LOSS DETECTED - Auto-recovering...');
                this.autoRecoverCart();
            }
        }, 1000);
    }

    // CAPA 4: Función de auto-recuperación
    autoRecoverCart() {
        const backups = [
            localStorage.getItem('cart_backup'),
            localStorage.getItem('cart_emergency_backup')
        ];

        for (const backup of backups) {
            if (backup && backup !== '[]') {
                try {
                    const recoveredCart = JSON.parse(backup);
                    if (recoveredCart.length > 0) {
                        this.cart = recoveredCart;
                        localStorage.setItem('cart', backup);
                        this.updateCartUI();
                        console.log('✅ Cart auto-recovered from backup');
                        this.showToast(t('cart.messages.cartRecovered'), 'success');
                        return true;
                    }
                } catch (error) {
                    console.error('Error in auto-recovery:', error);
                }
            }
        }
        return false;
    }

    updateCartUI() {
        this.updateCartCount();
        this.updateCartModal();
    }

    updateCartCount(retryCount = 0, allowRetries = true) {
        const countElement = document.getElementById('cart-count');
        if (countElement) {
            const count = this.cart.length;
            countElement.textContent = count;

            // Always show count if there are items, even if it's just added
            if (count > 0) {
                countElement.classList.remove('hidden');
                countElement.style.display = 'flex'; // Force display
                countElement.style.visibility = 'visible'; // Force visibility
                countElement.style.opacity = '1'; // Force opacity
                console.log(`✅ Cart count shown: ${count} items`);
            } else {
                countElement.classList.add('hidden');
                countElement.style.display = 'none';
                countElement.style.visibility = 'hidden';
                countElement.style.opacity = '0';
                console.log(`🔴 Cart count hidden: 0 items`);
            }
        } else {
            // FIXED: Only retry if explicitly allowed and within limits
            if (allowRetries && retryCount < 5) { // Reduced to 5 attempts max
                console.log(`⏳ Cart count element not found - retry ${retryCount + 1}/5`);
                setTimeout(() => {
                    this.updateCartCount(retryCount + 1, true);
                }, 300); // Reduced timeout
            } else {
                // Silently fail if retries not allowed or exhausted
                if (retryCount === 0) {
                    console.log('⚠️ Cart count element not available - skipping update');
                }
            }
        }
    }

    // Safe version for external calls (no retries)
    updateCartCountSafe() {
        this.updateCartCount(0, false);
    }

    updateCartModal() {
        const emptyDiv = document.getElementById('cart-empty');
        const itemsDiv = document.getElementById('cart-items');
        const footer = document.getElementById('cart-footer');
        const totalSpan = document.getElementById('cart-total');

        if (!emptyDiv || !itemsDiv || !footer || !totalSpan) return;

        if (this.cart.length === 0) {
            emptyDiv.classList.remove('hidden');
            itemsDiv.innerHTML = '';
            footer.classList.add('hidden');
            return;
        }

        emptyDiv.classList.add('hidden');
        footer.classList.remove('hidden');

        // Render cart items
        itemsDiv.innerHTML = this.cart.map(item => {
            const currentLang = i18n.getCurrentLanguage();

            // Handle title that might be an object or string (Firebase field name)
            let name = '';
            if (typeof item.title === 'object' && item.title !== null) {
                name = item.title[currentLang] || item.title['en'] || item.title['es'] || '';
            } else {
                name = item.title || '';
            }

            // Handle shortDescription that might be an object or string (Firebase field name)
            let description = '';
            if (typeof item.shortDescription === 'object' && item.shortDescription !== null) {
                description = item.shortDescription[currentLang] || item.shortDescription['en'] || item.shortDescription['es'] || '';
            } else {
                description = item.shortDescription || '';
            }

            return `
            <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <img src="${item.imageURL || 'https://placehold.co/80x80/e5e7eb/9ca3af?text=No+Image'}"
                     alt="${name}"
                     class="w-16 h-16 rounded-lg object-cover">
                <div class="flex-grow">
                    <h4 class="font-bold text-lg">${name}</h4>
                    <p class="text-gray-600 text-sm line-clamp-2">${description}</p>
                    <p class="text-[#22a7d0] font-bold text-lg">
                        ${item.price === 0 ? t('cart.price.free') : `$${item.price}`}
                    </p>
                </div>
                <button onclick="window.cart.removeFromCart('${item.id}')"
                        class="text-red-500 hover:text-red-700 p-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
            `;
        }).join('');

        // Update total
        const total = this.cart.reduce((sum, item) => sum + (item.price || 0), 0);
        totalSpan.textContent = total.toFixed(2);
    }

    openCart() {
        console.log('Opening cart...');

        // Always check and ensure cart modal has current language
        this.ensureCartModalLanguage();

        const modal = document.getElementById('cart-modal');
        if (modal) {
            console.log('Cart modal found, opening...');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // Update cart content when opening
            this.updateCartModal();
            // Update product buttons to reflect current cart state
            this.updateAllProductButtons();
        } else {
            console.error('Cart modal not found!');
        }
    }

    ensureCartModalLanguage() {
        const modal = document.getElementById('cart-modal');
        if (modal) {
            // Check if modal title matches current language
            const titleElement = modal.querySelector('h2');
            const currentTitle = t('cart.title');

            if (!titleElement || titleElement.textContent !== currentTitle) {
                console.log('🔄 Cart modal language mismatch detected, recreating...');
                modal.remove();
                this.createCartModal();
            }
        } else {
            // Create modal if it doesn't exist
            this.createCartModal();
        }
    }

    createCartModal() {
        if (!document.getElementById('cart-modal')) {
            const newCartModal = document.createElement('div');
            newCartModal.innerHTML = `
              <!-- Modal del Carrito -->
              <div id="cart-modal" class="fixed inset-0 z-[110] hidden items-center justify-center bg-black bg-opacity-50">
                  <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full m-4 max-h-[80vh] overflow-hidden">
                      <div class="p-6 border-b flex justify-between items-center">
                          <h2 class="text-2xl font-bold">${t('cart.title')}</h2>
                          <button id="cart-close-button" class="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                      </div>
                      <div id="cart-content" class="p-6 max-h-[50vh] overflow-y-auto">
                          <div id="cart-empty" class="text-center py-8 text-gray-500">
                              <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 8L5 21h14a2 2 0 002-2V9H5m0 4v6a2 2 0 002 2h10a2 2 0 002-2v-6M9 21v-2m6 2v-2"></path>
                              </svg>
                              <p class="text-lg">${t('cart.empty')}</p>
                          </div>
                          <div id="cart-items" class="space-y-4"></div>
                      </div>
                      <div id="cart-footer" class="p-6 border-t bg-gray-50">
                          <div class="flex justify-between items-center mb-4">
                              <span class="text-xl font-bold">${t('cart.total')}: $<span id="cart-total">0.00</span></span>
                          </div>
                          <div class="flex space-x-4">
                              <button id="clear-cart" class="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors">
                                  ${t('cart.clear')}
                              </button>
                              <button id="process-payment" class="flex-1 bg-[#22a7d0] text-white py-3 px-6 rounded-lg hover:bg-[#1e96bc] transition-colors">
                                  ${t('cart.processPayment')}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
            `;
            document.body.appendChild(newCartModal.firstElementChild);

            // Re-bind cart events
            setTimeout(() => {
                this.bindEvents();
                console.log('✅ Cart modal created with current language and events bound');
            }, 50);
        }
    }

    closeCart() {
        console.log('Closing cart...');
        const modal = document.getElementById('cart-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    async processPayment() {
        if (!auth?.currentUser) {
            this.showToast(t('cart.messages.loginRequired'), 'error');
            window.location.hash = '#/auth';
            return;
        }

        if (this.cart.length === 0) {
            this.showToast(t('cart.messages.cartEmpty'), 'error');
            return;
        }

        // Show progress modal
        const progressModal = this.showProgressModal();

        try {
            // Update progress: Iniciando pago (10%)
            this.updateProgress(progressModal, 10, t('cart.processing.initiating'));
            await new Promise(resolve => setTimeout(resolve, 500));

            // Update progress: Verificando datos (30%)
            this.updateProgress(progressModal, 30, t('cart.processing.verifying'));
            await new Promise(resolve => setTimeout(resolve, 600));

            // Update progress: Procesando pago (60%)
            this.updateProgress(progressModal, 60, t('cart.processing.status'));
            await new Promise(resolve => setTimeout(resolve, 800));

            // Update progress: Agregando productos (80%)
            this.updateProgress(progressModal, 80, t('cart.processing.adding'));

            // Agregar productos a la biblioteca del usuario
            const { addUserProduct } = await import('./userProfile.js');

            for (const item of this.cart) {
                await addUserProduct(auth.currentUser.uid, {
                    id: item.id,
                    title: item.title,
                    shortDescription: item.shortDescription,
                    price: item.price,
                    imageURL: item.imageURL,
                    category: 'purchased',
                    purchaseDate: new Date().toISOString()
                });
            }

            // Update progress: Finalizando (100%)
            this.updateProgress(progressModal, 100, t('cart.processing.completed'));
            await new Promise(resolve => setTimeout(resolve, 500));

            // Remove progress modal
            progressModal.remove();

            // Limpiar carrito después del pago exitoso
            this.clearCart();
            this.closeCart();

            // Recargar productos comprados
            await this.loadUserPurchasedProducts();

            // Actualizar todos los botones de productos
            this.updateAllProductButtons();

            // Mostrar mensaje de éxito y redirigir automáticamente
            this.showSuccessModal(() => {
                // Callback para cerrar modal y redirigir
                window.location.hash = '#/account/products';
            });

        } catch (error) {
            console.error('Error processing payment:', error);
            progressModal.remove();
            this.showToast(t('cart.messages.paymentError'), 'error');
        }
    }

    showProgressModal() {
        const progressModal = document.createElement('div');
        progressModal.className = 'fixed inset-0 z-[125] flex items-center justify-center bg-black bg-opacity-50';
        progressModal.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl max-w-md w-full m-4 p-8 text-center">
                <div class="mb-6">
                    <div class="w-24 h-24 mx-auto mb-4 relative">
                        <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" stroke="#e5e7eb" stroke-width="6" fill="none"/>
                            <circle id="progress-circle" cx="50" cy="50" r="45" stroke="#22a7d0" stroke-width="6"
                                fill="none" stroke-linecap="round" stroke-dasharray="283" stroke-dashoffset="283"
                                style="transition: stroke-dashoffset 0.5s ease-in-out"/>
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <span id="progress-percent" class="text-xl font-bold text-gray-700">0%</span>
                        </div>
                    </div>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">${t('cart.processing.title')}</h3>
                <p id="progress-message" class="text-gray-600">${t('cart.processing.starting')}</p>
            </div>
        `;
        document.body.appendChild(progressModal);
        return progressModal;
    }

    updateProgress(modal, percent, message) {
        const circle = modal.querySelector('#progress-circle');
        const percentText = modal.querySelector('#progress-percent');
        const messageText = modal.querySelector('#progress-message');

        const circumference = 283; // 2 * π * 45
        const offset = circumference - (percent / 100) * circumference;

        circle.style.strokeDashoffset = offset;
        percentText.textContent = `${percent}%`;
        messageText.textContent = message;
    }

    playApplePaySound() {
        try {
            // Create Web Audio Context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create a softer, more pleasant sound - single tone with gentle harmonics
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.type = 'sine';

            // Create very gentle envelope
            const now = audioContext.currentTime;
            const duration = 0.6;

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.06, now + 0.15); // Gentle attack
            gainNode.gain.exponentialRampToValueAtTime(0.03, now + 0.4); // Soft sustain
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Gentle release

            oscillator.start(now);
            oscillator.stop(now + duration);

        } catch (error) {
            console.log('Web Audio not supported, skipping payment sound');
        }
    }

    showSuccessModal(onRedirectCallback = null) {
        const successModal = document.createElement('div');
        successModal.className = 'fixed inset-0 z-[120] flex items-center justify-center bg-black bg-opacity-50';
        successModal.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl max-w-md w-full m-4 p-8 text-center">
                <div class="mb-6">
                    <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-4">${t('cart.success.title')}</h3>
                <p class="text-gray-600 mb-6">${t('cart.success.message')}</p>
                <div class="flex space-x-4">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()"
                            class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                        ${t('cart.success.close')}
                    </button>
                    <button onclick="window.location.hash = '#/account/products'; this.parentElement.parentElement.parentElement.remove();"
                            class="flex-1 bg-[#22a7d0] text-white py-2 px-4 rounded-lg hover:bg-[#1e96bc] transition-colors">
                        ${t('cart.success.viewLibrary')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(successModal);

        // Play Apple Pay-like success sound
        this.playApplePaySound();

        // Auto-redirect after 2 seconds if callback provided, otherwise auto-remove after 10 seconds
        if (onRedirectCallback) {
            setTimeout(() => {
                if (document.body.contains(successModal)) {
                    successModal.remove();
                }
                onRedirectCallback();
            }, 2000);
        } else {
            setTimeout(() => {
                if (document.body.contains(successModal)) {
                    successModal.remove();
                }
            }, 10000);
        }
    }

    isProductPurchased(productId) {
        return this.userPurchasedProducts.has(productId);
    }

    isProductInCart(productId) {
        return this.cart.some(item => item.id === productId);
    }

    // Method to update all product buttons across the page
    updateAllProductButtons() {
        const productButtons = document.querySelectorAll('.product-action-button');

        productButtons.forEach(button => {
            const productData = JSON.parse(button.getAttribute('data-product').replace(/&apos;/g, "'"));
            const productId = button.getAttribute('data-product-id');

            // Check states
            const isPurchased = this.isProductPurchased(productId);
            const inCart = this.isProductInCart(productId);

            // Reset button classes
            button.classList.remove('bg-gray-400', 'cursor-not-allowed', 'bg-green-500', 'bg-orange-500', 'hover:bg-orange-600');
            button.classList.add('bg-[#22a7d0]', 'hover:bg-[#1e96bc]');
            button.disabled = false;

            if (isPurchased) {
                button.textContent = t('productsPage.buttons.alreadyOwned');
                button.disabled = true;
                button.classList.remove('bg-[#22a7d0]', 'hover:bg-[#1e96bc]');
                button.classList.add('bg-gray-400', 'cursor-not-allowed');
            } else if (inCart) {
                if (productData.price === 0 || productData.price === "Gratis") {
                    button.textContent = t('productsPage.buttons.getFree');
                } else {
                    button.textContent = t('productsPage.buttons.removeFromCart');
                    button.classList.remove('bg-[#22a7d0]', 'hover:bg-[#1e96bc]');
                    button.classList.add('bg-orange-500', 'hover:bg-orange-600');
                }
            } else {
                if (productData.price === 0 || productData.price === "Gratis") {
                    button.textContent = t('productsPage.buttons.getFree');
                } else {
                    button.textContent = t('productsPage.buttons.addToCart');
                }
            }
        });
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 z-50 transform transition-all duration-300 translate-x-full';

        const bgColor = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'info': 'bg-blue-500',
            'warning': 'bg-yellow-500',
            'removed': 'bg-orange-500'
        }[type] || 'bg-green-500';

        const icon = {
            'success': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
            'error': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`,
            'info': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
            'warning': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
            'removed': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`
        }[type] || '';

        toast.innerHTML = `
            <div class="${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
                ${icon}
                <span class="font-medium">${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => toast.classList.remove('translate-x-full'), 100);
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // CAPA 5: Función de emergencia manual
    emergencyCartRecovery() {
        console.log('🚑 EMERGENCY CART RECOVERY ACTIVATED');

        const allBackups = {
            cart_backup: localStorage.getItem('cart_backup'),
            cart_emergency_backup: localStorage.getItem('cart_emergency_backup')
        };

        console.log('Available backups:', allBackups);

        // Intentar recuperar del backup más reciente
        const success = this.autoRecoverCart();

        if (success) {
            console.log('✅ Emergency recovery successful');
            return true;
        } else {
            console.log('❌ Emergency recovery failed - no valid backups found');
            return false;
        }
    }
}

// Inicializar carrito global
window.cart = new ShoppingCart();

// CAPA 5: Hacer función de emergencia disponible globalmente
window.emergencyCartRecovery = () => window.cart.emergencyCartRecovery();

export default ShoppingCart;