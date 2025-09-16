import { auth } from './firebase.js';
import { getUserProducts } from './userProfile.js';

class ShoppingCart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.userPurchasedProducts = new Set();
        this.initializeCart();
    }

    async initializeCart() {
        await this.loadUserPurchasedProducts();
        this.updateCartUI();
        // Wait for DOM elements to be available before binding events
        setTimeout(() => this.bindEvents(), 100);
    }

    async loadUserPurchasedProducts() {
        if (auth?.currentUser) {
            try {
                const userProducts = await getUserProducts(auth.currentUser.uid);
                this.userPurchasedProducts = new Set(userProducts.map(product => product.productId));
            } catch (error) {
                console.error('Error loading user products:', error);
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
            this.showToast('Este producto ya lo tienes en tu biblioteca', 'info');
            return false;
        }

        // Verificar si el producto ya está en el carrito
        const existingProduct = this.cart.find(item => item.id === product.id);
        if (existingProduct) {
            this.showToast('Este producto ya está en tu carrito', 'info');
            return false;
        }

        // Agregar al carrito
        this.cart.push({
            id: product.id,
            name: product.name,
            price: product.price || 0,
            image: product.image,
            description: product.description
        });

        this.saveCart();
        this.updateCartUI();
        this.updateAllProductButtons();
        this.showToast('Producto agregado al carrito', 'success');
        return true;
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
        this.updateAllProductButtons();
        this.showToast('Producto removido del carrito', 'success');
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
        this.updateAllProductButtons();
        this.showToast('Carrito limpiado', 'success');
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCartUI() {
        this.updateCartCount();
        this.updateCartModal();
    }

    updateCartCount() {
        const countElement = document.getElementById('cart-count');
        if (countElement) {
            const count = this.cart.length;
            countElement.textContent = count;
            if (count > 0) {
                countElement.classList.remove('hidden');
            } else {
                countElement.classList.add('hidden');
            }
        }
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
        itemsDiv.innerHTML = this.cart.map(item => `
            <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <img src="${item.image || 'https://placehold.co/80x80/e5e7eb/9ca3af?text=No+Image'}"
                     alt="${item.name}"
                     class="w-16 h-16 rounded-lg object-cover">
                <div class="flex-grow">
                    <h4 class="font-bold text-lg">${item.name}</h4>
                    <p class="text-gray-600 text-sm line-clamp-2">${item.description || ''}</p>
                    <p class="text-[#22a7d0] font-bold text-lg">
                        ${item.price === 0 ? 'Gratis' : `$${item.price}`}
                    </p>
                </div>
                <button onclick="window.cart.removeFromCart('${item.id}')"
                        class="text-red-500 hover:text-red-700 p-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        `).join('');

        // Update total
        const total = this.cart.reduce((sum, item) => sum + (item.price || 0), 0);
        totalSpan.textContent = total.toFixed(2);
    }

    openCart() {
        console.log('Opening cart...');
        const modal = document.getElementById('cart-modal');
        if (modal) {
            console.log('Cart modal found, opening...');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // Update cart content when opening
            this.updateCartModal();
        } else {
            console.error('Cart modal not found!');
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
            this.showToast('Debes iniciar sesión para procesar el pago', 'error');
            window.location.hash = '#/auth';
            return;
        }

        if (this.cart.length === 0) {
            this.showToast('Tu carrito está vacío', 'error');
            return;
        }

        // Show progress modal
        const progressModal = this.showProgressModal();

        try {
            // Update progress: Iniciando pago (10%)
            this.updateProgress(progressModal, 10, 'Iniciando procesamiento...');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Update progress: Verificando datos (30%)
            this.updateProgress(progressModal, 30, 'Verificando información...');
            await new Promise(resolve => setTimeout(resolve, 600));

            // Update progress: Procesando pago (60%)
            this.updateProgress(progressModal, 60, 'Procesando pago...');
            await new Promise(resolve => setTimeout(resolve, 800));

            // Update progress: Agregando productos (80%)
            this.updateProgress(progressModal, 80, 'Agregando productos a tu biblioteca...');

            // Agregar productos a la biblioteca del usuario
            const { addUserProduct } = await import('./userProfile.js');

            for (const item of this.cart) {
                await addUserProduct(auth.currentUser.uid, {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    image: item.image,
                    category: 'purchased',
                    purchaseDate: new Date().toISOString()
                });
            }

            // Update progress: Finalizando (100%)
            this.updateProgress(progressModal, 100, '¡Pago completado exitosamente!');
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

            // Mostrar mensaje de éxito
            this.showSuccessModal();

            // Redirect to account products tab after 2 seconds
            setTimeout(() => {
                window.location.hash = '#/account/products';
            }, 2000);

        } catch (error) {
            console.error('Error processing payment:', error);
            progressModal.remove();
            this.showToast('Error al procesar el pago. Inténtalo de nuevo.', 'error');
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
                <h3 class="text-xl font-bold text-gray-900 mb-2">Procesando Pago</h3>
                <p id="progress-message" class="text-gray-600">Iniciando...</p>
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

    showSuccessModal() {
        const successModal = document.createElement('div');
        successModal.className = 'fixed inset-0 z-[120] flex items-center justify-center bg-black bg-opacity-50';
        successModal.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl max-w-md w-full m-4 p-8 text-center">
                <div class="mb-6">
                    <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-4">¡Pago Exitoso!</h3>
                <p class="text-gray-600 mb-6">Tus productos han sido agregados a tu biblioteca. Ya puedes acceder a ellos.</p>
                <div class="flex space-x-4">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()"
                            class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                        Cerrar
                    </button>
                    <button onclick="window.location.hash = '#/account/products'; this.parentElement.parentElement.parentElement.remove();"
                            class="flex-1 bg-[#22a7d0] text-white py-2 px-4 rounded-lg hover:bg-[#1e96bc] transition-colors">
                        Ver Mi Biblioteca
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(successModal);

        // Play Apple Pay-like success sound
        this.playApplePaySound();

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(successModal)) {
                successModal.remove();
            }
        }, 10000);
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
            button.classList.remove('bg-gray-400', 'cursor-not-allowed', 'bg-green-500', 'bg-orange-500');
            button.classList.add('bg-[#22a7d0]', 'hover:bg-[#1e96bc]');
            button.disabled = false;

            if (isPurchased) {
                button.textContent = 'Ya lo tienes';
                button.disabled = true;
                button.classList.remove('bg-[#22a7d0]', 'hover:bg-[#1e96bc]');
                button.classList.add('bg-gray-400', 'cursor-not-allowed');
            } else if (inCart) {
                if (productData.price === 0 || productData.price === "Gratis") {
                    button.textContent = 'Obtener Gratis';
                } else {
                    button.textContent = 'Remover del Carrito';
                    button.classList.remove('bg-[#22a7d0]', 'hover:bg-[#1e96bc]');
                    button.classList.add('bg-orange-500', 'hover:bg-orange-600');
                }
            } else {
                if (productData.price === 0 || productData.price === "Gratis") {
                    button.textContent = 'Obtener Gratis';
                } else {
                    button.textContent = 'Agregar al Carrito';
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
            'info': 'bg-blue-500'
        }[type] || 'bg-green-500';

        const icon = {
            'success': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
            'error': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`,
            'info': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
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
}

// Inicializar carrito global
window.cart = new ShoppingCart();

export default ShoppingCart;