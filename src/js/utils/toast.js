// Global toast notification system
export function showToast(message, type = 'success', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 z-[9999] transform transition-all duration-500 translate-x-full';

  const bgColor = getToastColor(type);
  const icon = getToastIcon(type);

  toast.innerHTML = `
    <div class="${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-80">
      ${icon}
      <div class="flex-1">
        <p class="font-medium">${message}</p>
      </div>
      <button class="text-white hover:text-gray-200 transition-colors" onclick="this.parentElement.parentElement.remove()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
      toast.classList.add('translate-x-0');
    }, 10);
  });

  // Auto remove
  setTimeout(() => {
    removeToast(toast);
  }, duration);

  return toast;
}

function removeToast(toast) {
  toast.classList.add('translate-x-full');
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 500);
}

function getToastColor(type) {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    loading: 'bg-gray-500'
  };
  return colors[type] || colors.success;
}

function getToastIcon(type) {
  const icons = {
    success: `
      <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
    `,
    error: `
      <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    `,
    warning: `
      <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.832-.833-2.602 0L4.212 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
      </svg>
    `,
    info: `
      <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    `,
    loading: `
      <svg class="w-6 h-6 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    `
  };
  return icons[type] || icons.success;
}

// Convenience functions
export const toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error: (message, duration) => showToast(message, 'error', duration),
  warning: (message, duration) => showToast(message, 'warning', duration),
  info: (message, duration) => showToast(message, 'info', duration),
  loading: (message, duration) => showToast(message, 'loading', duration)
};

// Loading toast with manual control
export function showLoadingToast(message) {
  const loadingToast = showToast(message, 'loading', 999999); // Very long duration

  return {
    success: (successMessage) => {
      removeToast(loadingToast);
      return showToast(successMessage, 'success');
    },
    error: (errorMessage) => {
      removeToast(loadingToast);
      return showToast(errorMessage, 'error');
    },
    update: (newMessage) => {
      const messageElement = loadingToast.querySelector('p');
      if (messageElement) {
        messageElement.textContent = newMessage;
      }
    },
    close: () => {
      removeToast(loadingToast);
    }
  };
}