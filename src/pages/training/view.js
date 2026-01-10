import { auth, db } from '../../js/firebase.js';
import { waitForAuthReady } from '../../js/auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  createSession,
  completeSession,
  getUserStatistics,
  formatTime
} from '../../js/sessionManager.js';

export async function renderTrainingView(productId) {
  console.log('🎯 renderTrainingView llamado con productId:', productId);

  // Remove loading overlay if present (from retry incorrect questions)
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.remove();
    console.log('🔄 Loading overlay removed');
  }

  const root = document.getElementById('spa-root');
  if (!root) {
    console.error('❌ No se encontró spa-root');
    return;
  }

  // Esperar a que Firebase determine el estado de autenticación
  // Esto previene redirecciones falsas durante la recarga de página
  await waitForAuthReady();

  if (!auth?.currentUser) {
    console.log('❌ Usuario no autenticado, redirigiendo a login');
    window.location.hash = '#/auth/login';
    return;
  }
  console.log('✅ Usuario autenticado:', auth.currentUser.email);

  const hasAccess = await verifyProductAccess(auth.currentUser.uid, productId);
  if (!hasAccess) {
    root.innerHTML = renderAccessDenied();
    return;
  }

  const product = await loadProduct(productId);
  if (!product) {
    root.innerHTML = renderError('Producto no encontrado');
    return;
  }

  let questions = await loadQuestions(productId);
  if (!questions || questions.length === 0) {
    root.innerHTML = renderError('No hay preguntas disponibles');
    return;
  }

  const params = getURLParams();

  // Filter questions if retrying incorrect ones
  if (params.retryIncorrect) {
    // Get incorrect question IDs from sessionStorage
    const storedIds = sessionStorage.getItem('retryIncorrectQuestionIds');
    if (storedIds) {
      try {
        const incorrectIds = new Set(JSON.parse(storedIds));
        console.log('🔄 IDs de preguntas incorrectas:', Array.from(incorrectIds));

        const originalCount = questions.length;
        questions = questions.filter(q => incorrectIds.has(q.id));
        console.log(`🔄 Filtrando preguntas incorrectas: ${questions.length} de ${originalCount} (buscando ${incorrectIds.size} IDs)`);

        // Clear sessionStorage after using it
        sessionStorage.removeItem('retryIncorrectQuestionIds');

        if (questions.length === 0) {
          root.innerHTML = renderError('No se encontraron las preguntas incorrectas. Es posible que las preguntas hayan sido actualizadas.');
          return;
        }
      } catch (e) {
        console.error('Error parsing incorrect question IDs:', e);
        sessionStorage.removeItem('retryIncorrectQuestionIds');
      }
    } else {
      console.warn('⚠️ retryIncorrect=true pero no hay IDs en sessionStorage');
    }
  }

  root.innerHTML = renderTrainingApp(product, questions, params);
  initializeTrainingApp(product, questions, params);
  injectStyles();
}

async function verifyProductAccess(userId, productId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.role === 'admin') {
        console.log('✅ Usuario es admin, acceso concedido');
        return true;
      }
    }

    if (auth.currentUser?.email === 'demo@frostware.com') {
      console.log('✅ Usuario demo, acceso concedido');
      return true;
    }

    const userProductRef = doc(db, 'users', userId, 'products', productId);
    const userProductDoc = await getDoc(userProductRef);
    const hasProduct = userProductDoc.exists();

    console.log(hasProduct ? '✅ Usuario tiene el producto' : '❌ Usuario no tiene el producto');
    return hasProduct;
  } catch (error) {
    console.error('Error verificando acceso:', error);
    return false;
  }
}

async function loadProduct(productId) {
  try {
    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);
    if (productDoc.exists()) {
      return { id: productDoc.id, ...productDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error cargando producto:', error);
    return null;
  }
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Process questions: randomize options and track correct answer
function processQuestions(rawQuestions) {
  return rawQuestions.map(q => {
    // Create array with options and their original indices
    const optionsWithIndices = q.options.map((opt, idx) => ({
      option: opt,
      originalIndex: idx
    }));

    // Shuffle the options
    const shuffledOptions = shuffleArray(optionsWithIndices);

    // Find new position of correct answer
    const newCorrectAnswerIndex = shuffledOptions.findIndex(
      item => item.originalIndex === q.correctAnswer
    );

    // Create mapping: currentIndex -> originalIndex (for persistence)
    const optionMapping = shuffledOptions.map(item => item.originalIndex);

    return {
      ...q,
      options: shuffledOptions.map(item => item.option),
      optionMapping: optionMapping, // Track original indices for persistence
      correctAnswer: newCorrectAnswerIndex,
      originalCorrectAnswer: q.correctAnswer // Keep original for reference
    };
  });
}

async function loadQuestions(productId) {
  try {
    // Load product to get databaseId
    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      console.error('Producto no encontrado:', productId);
      return [];
    }

    const product = productDoc.data();
    const databaseId = product.databaseId;

    if (!databaseId) {
      console.error('Producto no tiene databaseId:', productId);
      return [];
    }

    // Load questions from the database collection
    const { collection, getDocs } = await import('firebase/firestore');
    const questionsSnapshot = await getDocs(collection(db, databaseId));

    const rawQuestions = questionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Cargadas ${rawQuestions.length} preguntas desde ${databaseId}`);

    // First shuffle the questions order
    const shuffledQuestions = shuffleArray(rawQuestions);
    console.log('🔀 Preguntas randomizadas');

    // Then process questions: randomize options within each question
    const processedQuestions = processQuestions(shuffledQuestions);
    console.log('🔀 Opciones de respuestas randomizadas');

    return processedQuestions;
  } catch (error) {
    console.error('Error cargando preguntas:', error);
    // Fallback to sample questions if there's an error
    return [
    {
      id: 'q1',
      topic: 'Communications',
      question: '¿Cuál es la frecuencia principal de HF para comunicaciones NAT?',
      image: 'https://via.placeholder.com/800x400/22a7d0/ffffff?text=HF+Communication+Diagram',
      options: [
        '123.45 MHz',
        '8.891 MHz',
        '121.5 MHz',
        '5.680 MHz'
      ],
      correctAnswer: 1,
      explanation: 'La frecuencia 8.891 MHz es una de las principales frecuencias HF utilizadas para comunicaciones en el Atlántico Norte.'
    },
    {
      id: 'q2',
      topic: 'Navigation',
      question: '¿Qué significa RNAV en navegación oceánica?',
      image: null,
      options: [
        'Radio Navigation',
        'Required Navigation',
        'Area Navigation',
        'Regional Navigation'
      ],
      correctAnswer: 2,
      explanation: 'RNAV significa Area Navigation, un método de navegación que permite vuelos en cualquier ruta dentro de la cobertura de ayudas a la navegación.'
    },
    {
      id: 'q3',
      topic: 'Weather',
      question: '¿Qué es SIGWX?',
      image: 'https://via.placeholder.com/800x400/10b981/ffffff?text=SIGWX+Chart+Example',
      options: [
        'Sistema de Información Meteorológica',
        'Significant Weather Chart',
        'Signal Weather Report',
        'Sistema de Gestión del Clima'
      ],
      correctAnswer: 1,
      explanation: 'SIGWX (Significant Weather Chart) es una carta meteorológica que muestra fenómenos meteorológicos significativos para la aviación.'
    }
    ];
  }
}

function getURLParams() {
  const hash = window.location.hash;
  const queryString = hash.includes('?') ? hash.split('?')[1] : '';
  const urlParams = new URLSearchParams(queryString);

  const mode = urlParams.get('mode')?.toLowerCase() || 'practice';
  const duration = parseInt(urlParams.get('duration')) || 3600;
  const passingScore = parseInt(urlParams.get('passingScore')) || 70;
  const sessionId = urlParams.get('sessionId') || null;
  const retryIncorrect = urlParams.get('retryIncorrect') === 'true';

  console.log('🎯 URL Params detectados:', { hash, mode, duration, passingScore, sessionId, retryIncorrect });

  return { mode, duration, passingScore, sessionId, retryIncorrect };
}

function injectStyles() {
  if (document.getElementById('training-app-styles')) return;

  const styleTag = document.createElement('style');
  styleTag.id = 'training-app-styles';
  styleTag.textContent = `
    /* ============================================
       TRAINING APP - Frostware Design System
       Clean, minimal, professional
       ============================================ */

    #training-app-container {
      position: fixed;
      inset: 0;
      min-height: 100vh;
      background: var(--color-bg-primary, #ffffff);
      color: var(--color-text-primary, #0f172a);
      z-index: 9999;
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    html.dark #training-app-container {
      background: #0a0e1a;
      color: #e4e8ef;
    }

    .training-layout {
      display: flex;
      min-height: 100vh;
    }

    /* ============================================
       SIDEBAR
       ============================================ */
    .questions-sidebar {
      width: 320px;
      min-width: 320px;
      max-height: 100vh;
      background: var(--color-bg-secondary, #f8fafc);
      border-right: 1px solid var(--color-border-primary, #e2e8f0);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease, min-width 0.3s ease, opacity 0.3s ease;
    }

    .questions-sidebar.closed {
      width: 0;
      min-width: 0;
      opacity: 0;
      border-right: none;
    }

    html.dark .questions-sidebar {
      background: #0f1419;
      border-right-color: #1e293b;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--color-border-primary, #e2e8f0);
      background: inherit;
    }

    html.dark .sidebar-header {
      border-bottom-color: #1e293b;
    }

    .sidebar-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .sidebar-title {
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary, #64748b);
    }

    html.dark .sidebar-title {
      color: #9ca3af;
    }

    /* Progress Stats Card */
    .progress-stats-card {
      background: linear-gradient(135deg, rgba(34, 167, 208, 0.08) 0%, rgba(34, 167, 208, 0.02) 100%);
      border: 1px solid rgba(34, 167, 208, 0.15);
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    html.dark .progress-stats-card {
      background: linear-gradient(135deg, rgba(34, 167, 208, 0.12) 0%, rgba(34, 167, 208, 0.04) 100%);
      border-color: rgba(34, 167, 208, 0.25);
    }

    .progress-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .progress-percentage {
      font-size: 1.75rem;
      font-weight: 800;
      color: #22a7d0;
      line-height: 1;
    }

    .progress-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary, #64748b);
    }

    html.dark .progress-label {
      color: #9ca3af;
    }

    .progress-bar-sidebar {
      height: 8px;
      background: var(--color-bg-tertiary, #f1f5f9);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    html.dark .progress-bar-sidebar {
      background: #1a1f2e;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #22a7d0, #06b6d4);
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .progress-counts {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
    }

    .progress-count {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--color-text-secondary, #475569);
    }

    html.dark .progress-count {
      color: #9ca3af;
    }

    .progress-count-value {
      font-weight: 700;
      color: var(--color-text-primary, #0f172a);
    }

    html.dark .progress-count-value {
      color: #e4e8ef;
    }

    .progress-count.correct .progress-count-value { color: #10b981; }
    .progress-count.incorrect .progress-count-value { color: #ef4444; }

    /* Database Info */
    .database-info {
      padding: 0.75rem 1rem;
      background: var(--color-bg-tertiary, #f1f5f9);
      border-radius: 8px;
      margin-top: 0.75rem;
    }

    html.dark .database-info {
      background: #1a1f2e;
    }

    .database-info-label {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary, #64748b);
      margin-bottom: 0.25rem;
    }

    html.dark .database-info-label {
      color: #6b7280;
    }

    .database-info-value {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-text-primary, #0f172a);
    }

    html.dark .database-info-value {
      color: #e4e8ef;
    }

    /* Questions List */
    .questions-list {
      flex: 1;
      min-height: 0; /* Critical for flex scroll */
      overflow-y: auto;
      overflow-x: hidden;
      scroll-behavior: smooth;
      padding-bottom: 1rem;
    }

    .question-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1.5rem;
      border-bottom: 1px solid var(--color-border-primary, #e2e8f0);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      animation: slideInFromLeft 0.3s ease-out forwards;
      opacity: 0;
      transform: translateX(-10px);
    }

    @keyframes slideInFromLeft {
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Stagger animation for question items */
    .question-item:nth-child(1) { animation-delay: 0.02s; }
    .question-item:nth-child(2) { animation-delay: 0.04s; }
    .question-item:nth-child(3) { animation-delay: 0.06s; }
    .question-item:nth-child(4) { animation-delay: 0.08s; }
    .question-item:nth-child(5) { animation-delay: 0.1s; }
    .question-item:nth-child(6) { animation-delay: 0.12s; }
    .question-item:nth-child(7) { animation-delay: 0.14s; }
    .question-item:nth-child(8) { animation-delay: 0.16s; }
    .question-item:nth-child(9) { animation-delay: 0.18s; }
    .question-item:nth-child(10) { animation-delay: 0.2s; }
    .question-item:nth-child(n+11) { animation-delay: 0.22s; }

    html.dark .question-item {
      border-bottom-color: #1e293b;
    }

    .question-item:hover {
      background: rgba(34, 167, 208, 0.04);
    }

    .question-item.active {
      background: rgba(34, 167, 208, 0.08);
      border-left: 3px solid #22a7d0;
      padding-left: calc(1.5rem - 3px);
    }

    .question-number {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--color-bg-tertiary, #f1f5f9);
      border: 2px solid transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8125rem;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    html.dark .question-number {
      background: #1a1f2e;
    }

    .question-item.active .question-number {
      background: #22a7d0;
      color: white;
    }

    .question-item.answered-correct .question-number {
      background: #10b981;
      color: white;
    }

    .question-item.answered-incorrect .question-number {
      background: #ef4444;
      color: white;
    }

    .question-item.answered-neutral .question-number {
      background: #22a7d0;
      color: white;
    }

    .question-item.bookmarked {
      background: rgba(245, 158, 11, 0.04);
    }

    .question-item .bookmark-icon {
      display: none;
      color: #f59e0b;
      flex-shrink: 0;
    }

    .question-item.bookmarked .bookmark-icon {
      display: block;
    }

    /* Image icon for questions with images */
    .question-item .image-icon {
      display: none;
      color: #22a7d0;
      flex-shrink: 0;
      cursor: pointer;
      padding: 5px;
      border-radius: 8px;
      border: 2px solid transparent;
      background: rgba(34, 167, 208, 0.08);
      position: relative;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .question-item.has-image .image-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      border-color: rgba(34, 167, 208, 0.4);
      animation: imagePulse 2s ease-in-out infinite;
    }

    /* Animated pulsing border */
    @keyframes imagePulse {
      0%, 100% {
        border-color: rgba(34, 167, 208, 0.4);
        box-shadow: 0 0 0 0 rgba(34, 167, 208, 0.4);
      }
      50% {
        border-color: rgba(34, 167, 208, 0.8);
        box-shadow: 0 0 8px 2px rgba(34, 167, 208, 0.3);
      }
    }

    /* Glow ring effect */
    .question-item.has-image .image-icon::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 12px;
      border: 2px solid transparent;
      background: linear-gradient(135deg, rgba(34, 167, 208, 0.3), rgba(6, 182, 212, 0.3)) border-box;
      -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      opacity: 0;
      animation: glowRing 2s ease-in-out infinite;
    }

    @keyframes glowRing {
      0%, 100% {
        opacity: 0;
        transform: scale(0.8);
      }
      50% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .question-item .image-icon:hover {
      background: rgba(34, 167, 208, 0.2);
      color: #1a8db3;
      transform: scale(1.15);
      border-color: #22a7d0;
      animation: none;
      box-shadow: 0 0 12px 3px rgba(34, 167, 208, 0.4);
    }

    .question-item .image-icon:hover::before {
      animation: none;
      opacity: 0;
    }

    .question-item .image-icon:active {
      transform: scale(0.95);
    }

    html.dark .question-item .image-icon {
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
    }

    html.dark .question-item.has-image .image-icon {
      border-color: rgba(56, 189, 248, 0.4);
      animation: imagePulseDark 2s ease-in-out infinite;
    }

    @keyframes imagePulseDark {
      0%, 100% {
        border-color: rgba(56, 189, 248, 0.4);
        box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.4);
      }
      50% {
        border-color: rgba(56, 189, 248, 0.8);
        box-shadow: 0 0 8px 2px rgba(56, 189, 248, 0.3);
      }
    }

    html.dark .question-item .image-icon:hover {
      background: rgba(56, 189, 248, 0.2);
      color: #7dd3fc;
      border-color: #38bdf8;
      box-shadow: 0 0 12px 3px rgba(56, 189, 248, 0.4);
    }

    /* Icons container for question item */
    .question-item-icons {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .question-item-content {
      flex: 1;
      min-width: 0;
    }

    .question-item-topic {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--color-text-tertiary, #64748b);
      margin-bottom: 0.125rem;
    }

    html.dark .question-item-topic {
      color: #6b7280;
    }

    .question-item-text {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-text-primary, #0f172a);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    html.dark .question-item-text {
      color: #e4e8ef;
    }

    /* ============================================
       MAIN CONTENT
       ============================================ */
    .training-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      min-width: 0;
    }

    /* Header */
    .training-header {
      background: var(--color-bg-secondary, #f8fafc);
      border-bottom: 1px solid var(--color-border-primary, #e2e8f0);
      padding: 1rem 1.5rem;
    }

    html.dark .training-header {
      background: #0f1419;
      border-bottom-color: #1e293b;
    }

    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-info h1 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-text-primary, #0f172a);
      margin-bottom: 0.25rem;
    }

    html.dark .header-info h1 {
      color: #e4e8ef;
    }

    .header-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .badge.practice {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .badge.exam {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .badge.review {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      border: 1px solid rgba(139, 92, 246, 0.2);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .timer-box {
      text-align: right;
    }

    .timer-label {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary, #64748b);
    }

    .timer-display {
      font-size: 1.5rem;
      font-weight: 800;
      color: #22a7d0;
      font-variant-numeric: tabular-nums;
    }

    .timer-display.warning { color: #f59e0b; }
    .timer-display.critical {
      color: #ef4444;
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .score-box {
      text-align: right;
    }

    .score-label {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary, #64748b);
    }

    .score-display {
      font-size: 1.5rem;
      font-weight: 800;
      color: #22a7d0;
    }

    /* Header Stats Row */
    .header-stats-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-stats {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .header-stat {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: var(--color-text-secondary, #475569);
    }

    html.dark .header-stat {
      color: #9ca3af;
    }

    .header-stat-value {
      font-weight: 700;
      color: var(--color-text-primary, #0f172a);
    }

    html.dark .header-stat-value {
      color: #e4e8ef;
    }

    .header-stat.success .header-stat-value { color: #10b981; }
    .header-stat.error .header-stat-value { color: #ef4444; }
    .header-stat.warning .header-stat-value { color: #f59e0b; }

    /* Progress Bar */
    .progress-container {
      margin-top: 1rem;
    }

    .progress-bar {
      height: 6px;
      background: var(--color-bg-tertiary, #f1f5f9);
      border-radius: 3px;
      overflow: hidden;
    }

    html.dark .progress-bar {
      background: #1a1f2e;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22a7d0, #06b6d4);
      border-radius: 3px;
      transition: width 0.4s ease;
    }

    /* Navigation Controls */
    .nav-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }

    .nav-left, .nav-right {
      display: flex;
      gap: 0.5rem;
    }

    /* ============================================
       QUESTION CONTENT
       ============================================ */
    .training-content {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }

    .question-wrapper {
      max-width: 800px;
      margin: 0 auto;
    }

    .question-card {
      background: var(--color-bg-secondary, #f8fafc);
      border: 1px solid var(--color-border-primary, #e2e8f0);
      border-radius: 16px;
      padding: 2rem;
    }

    html.dark .question-card {
      background: #0f1419;
      border-color: #1e293b;
    }

    .question-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .question-meta {
      flex: 1;
    }

    .topic-badge {
      display: inline-flex;
      padding: 0.375rem 0.75rem;
      background: rgba(34, 167, 208, 0.1);
      color: #22a7d0;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      margin-bottom: 0.5rem;
    }

    .question-counter {
      font-size: 0.8125rem;
      color: var(--color-text-tertiary, #64748b);
    }

    html.dark .question-counter {
      color: #6b7280;
    }

    .bookmark-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: transparent;
      border: 1px solid var(--color-border-secondary, #cbd5e1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--color-text-tertiary, #64748b);
    }

    html.dark .bookmark-btn {
      border-color: #2d3748;
      color: #6b7280;
    }

    .bookmark-btn:hover {
      border-color: #f59e0b;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.08);
    }

    .bookmark-btn.bookmarked {
      border-color: #f59e0b;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.12);
    }

    .question-title {
      font-size: 1.375rem;
      font-weight: 700;
      line-height: 1.5;
      color: var(--color-text-primary, #0f172a);
      margin-bottom: 2rem;
    }

    html.dark .question-title {
      color: #e4e8ef;
    }

    /* Answer Options */
    .answer-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .answer-option {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--color-bg-primary, #ffffff);
      border: 2px solid var(--color-border-primary, #e2e8f0);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    html.dark .answer-option {
      background: #151a24;
      border-color: #1e293b;
    }

    .answer-option:hover {
      border-color: #22a7d0;
      transform: translateX(4px);
    }

    .answer-option.selected {
      border-color: #22a7d0;
      background: rgba(34, 167, 208, 0.06);
    }

    html.dark .answer-option.selected {
      background: rgba(34, 167, 208, 0.1);
    }

    .answer-option.correct {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.06);
    }

    html.dark .answer-option.correct {
      background: rgba(16, 185, 129, 0.1);
    }

    .answer-option.incorrect {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.06);
    }

    html.dark .answer-option.incorrect {
      background: rgba(239, 68, 68, 0.1);
    }

    .option-letter {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #22a7d0;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .answer-option.selected .option-letter {
      box-shadow: 0 0 0 4px rgba(34, 167, 208, 0.2);
    }

    .answer-option.correct .option-letter {
      background: #10b981;
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
    }

    .answer-option.incorrect .option-letter {
      background: #ef4444;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
    }

    .option-text {
      flex: 1;
      font-size: 0.9375rem;
      color: var(--color-text-primary, #0f172a);
    }

    html.dark .option-text {
      color: #e4e8ef;
    }

    .option-icon {
      flex-shrink: 0;
    }

    /* Explanation Box */
    .explanation-box {
      margin-top: 1.5rem;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid;
    }

    .explanation-box.correct {
      background: rgba(16, 185, 129, 0.06);
      border-color: rgba(16, 185, 129, 0.2);
    }

    html.dark .explanation-box.correct {
      background: rgba(16, 185, 129, 0.1);
    }

    .explanation-box.incorrect {
      background: rgba(239, 68, 68, 0.06);
      border-color: rgba(239, 68, 68, 0.2);
    }

    html.dark .explanation-box.incorrect {
      background: rgba(239, 68, 68, 0.1);
    }

    .explanation-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }

    .explanation-box.correct .explanation-header { color: #10b981; }
    .explanation-box.incorrect .explanation-header { color: #ef4444; }

    .explanation-text {
      color: var(--color-text-secondary, #475569);
      font-size: 0.9375rem;
      line-height: 1.6;
    }

    html.dark .explanation-text {
      color: #9ca3af;
    }

    /* ============================================
       BUTTONS
       ============================================ */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.875rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #22a7d0;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1e96bc;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(34, 167, 208, 0.3);
    }

    .btn-secondary {
      background: var(--color-bg-tertiary, #f1f5f9);
      color: var(--color-text-primary, #0f172a);
      border: 1px solid var(--color-border-primary, #e2e8f0);
    }

    html.dark .btn-secondary {
      background: #1a1f2e;
      border-color: #2d3748;
      color: #e4e8ef;
    }

    .btn-secondary:hover:not(:disabled) {
      border-color: #22a7d0;
      transform: translateY(-2px);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-icon {
      width: 40px;
      height: 40px;
      padding: 0;
    }

    /* Image Button - Animated border */
    #image-btn {
      position: relative;
      border: 2px solid rgba(34, 167, 208, 0.5);
      background: rgba(34, 167, 208, 0.08);
      color: #22a7d0;
      font-weight: 600;
      animation: imageBtnPulse 2s ease-in-out infinite;
    }

    @keyframes imageBtnPulse {
      0%, 100% {
        border-color: rgba(34, 167, 208, 0.5);
        box-shadow: 0 0 0 0 rgba(34, 167, 208, 0.3);
      }
      50% {
        border-color: rgba(34, 167, 208, 1);
        box-shadow: 0 0 15px 3px rgba(34, 167, 208, 0.4);
      }
    }

    #image-btn::before {
      content: '';
      position: absolute;
      inset: -5px;
      border-radius: 14px;
      border: 2px solid transparent;
      background: linear-gradient(135deg, rgba(34, 167, 208, 0.4), rgba(6, 182, 212, 0.4)) border-box;
      -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      opacity: 0;
      animation: imageBtnRing 2s ease-in-out infinite;
      pointer-events: none;
    }

    @keyframes imageBtnRing {
      0%, 100% {
        opacity: 0;
        transform: scale(0.95);
      }
      50% {
        opacity: 1;
        transform: scale(1);
      }
    }

    #image-btn:hover {
      animation: none;
      border-color: #22a7d0;
      background: rgba(34, 167, 208, 0.15);
      box-shadow: 0 0 20px 5px rgba(34, 167, 208, 0.4);
      transform: translateY(-2px) scale(1.02);
    }

    #image-btn:hover::before {
      animation: none;
      opacity: 0;
    }

    #image-btn:active {
      transform: translateY(0) scale(0.98);
    }

    html.dark #image-btn {
      border-color: rgba(56, 189, 248, 0.5);
      background: rgba(56, 189, 248, 0.1);
      color: #38bdf8;
      animation: imageBtnPulseDark 2s ease-in-out infinite;
    }

    @keyframes imageBtnPulseDark {
      0%, 100% {
        border-color: rgba(56, 189, 248, 0.5);
        box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.3);
      }
      50% {
        border-color: rgba(56, 189, 248, 1);
        box-shadow: 0 0 15px 3px rgba(56, 189, 248, 0.4);
      }
    }

    html.dark #image-btn:hover {
      border-color: #38bdf8;
      background: rgba(56, 189, 248, 0.2);
      box-shadow: 0 0 20px 5px rgba(56, 189, 248, 0.4);
    }

    /* Stats Cards */
    .header-stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.625rem 1rem;
      background: var(--color-bg-tertiary, #f1f5f9);
      border-radius: 10px;
      min-width: 70px;
    }

    html.dark .header-stat-card {
      background: #1a1f2e;
    }

    .header-stat-card.success { background: rgba(16, 185, 129, 0.1); }
    .header-stat-card.error { background: rgba(239, 68, 68, 0.1); }
    .header-stat-card.warning { background: rgba(245, 158, 11, 0.1); }

    .header-stat-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--color-text-tertiary, #64748b);
      margin-bottom: 0.25rem;
    }

    html.dark .header-stat-label {
      color: #9ca3af;
    }

    .header-stat-card .header-stat-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--color-text-primary, #0f172a);
    }

    html.dark .header-stat-card .header-stat-value {
      color: #e4e8ef;
    }

    .header-stat-card.success .header-stat-value { color: #10b981; }
    .header-stat-card.error .header-stat-value { color: #ef4444; }
    .header-stat-card.warning .header-stat-value { color: #f59e0b; }

    /* Action Buttons Inline */
    .action-buttons-inline {
      display: flex;
      gap: 0.5rem;
      margin-left: auto;
    }

    .btn-action-sm {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-save {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #10b981;
    }

    .btn-save:hover:not(:disabled) {
      background: #10b981;
      color: white;
      border-color: #10b981;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }

    .btn-exit {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #ef4444;
    }

    .btn-exit:hover:not(:disabled) {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    }

    /* ============================================
       MODALS
       ============================================ */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0);
      backdrop-filter: blur(0px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal-overlay.active {
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      opacity: 1;
    }

    .modal-content {
      background: var(--color-bg-primary, #ffffff);
      border: 1px solid var(--color-border-primary, #e2e8f0);
      border-radius: 16px;
      max-width: 900px;
      max-height: 90vh;
      overflow: auto;
      position: relative;
      transform: scale(0.9) translateY(20px);
      opacity: 0;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-overlay.active .modal-content {
      transform: scale(1) translateY(0);
      opacity: 1;
    }

    html.dark .modal-content {
      background: #0f1419;
      border-color: #1e293b;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 10;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    html.dark .modal-close {
      background: rgba(30, 41, 59, 0.9);
      color: #94a3b8;
    }

    .modal-close:hover {
      background: #ef4444;
      color: white;
      transform: scale(1.1) rotate(90deg);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    }

    .modal-close:active {
      transform: scale(0.95) rotate(90deg);
    }

    /* Image Modal Specific Styles */
    .modal-image-container {
      position: relative;
      padding: 1rem;
    }

    .modal-image {
      width: 100%;
      height: auto;
      border-radius: 12px;
      display: block;
      transition: transform 0.3s ease;
    }

    .modal-image-placeholder {
      width: 100%;
      min-height: 300px;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: #94a3b8;
    }

    html.dark .modal-image-placeholder {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #475569;
    }

    .modal-image-placeholder svg {
      width: 64px;
      height: 64px;
      opacity: 0.5;
    }

    .modal-image-placeholder span {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .modal-caption {
      padding: 1rem 1.5rem 1.5rem;
      text-align: center;
      color: var(--color-text-secondary, #64748b);
      font-size: 0.9375rem;
      line-height: 1.5;
    }

    html.dark .modal-caption {
      color: #9ca3af;
    }

    /* Zoom controls for image */
    .modal-zoom-controls {
      position: absolute;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.95);
      padding: 0.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    html.dark .modal-zoom-controls {
      background: rgba(30, 41, 59, 0.95);
    }

    .modal-image-container:hover .modal-zoom-controls {
      opacity: 1;
    }

    .modal-zoom-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .modal-zoom-btn:hover {
      background: rgba(34, 167, 208, 0.1);
      color: #22a7d0;
    }

    html.dark .modal-zoom-btn {
      color: #94a3b8;
    }

    html.dark .modal-zoom-btn:hover {
      color: #38bdf8;
    }

    .exit-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .exit-modal-content {
      background: var(--color-bg-primary, #ffffff);
      border: 1px solid var(--color-border-primary, #e2e8f0);
      border-radius: 16px;
      max-width: 400px;
      width: 100%;
      padding: 2rem;
    }

    html.dark .exit-modal-content {
      background: #0f1419;
      border-color: #1e293b;
    }

    .exit-modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: var(--color-text-primary, #0f172a);
    }

    html.dark .exit-modal-title {
      color: #e4e8ef;
    }

    .exit-modal-text {
      color: var(--color-text-secondary, #475569);
      margin-bottom: 1.5rem;
      line-height: 1.6;
      font-size: 0.9375rem;
    }

    html.dark .exit-modal-text {
      color: #9ca3af;
    }

    .exit-modal-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    /* Results Modal */
    .results-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .results-modal-content {
      background: var(--color-bg-primary, #ffffff);
      border-radius: 24px;
      max-width: 480px;
      width: 100%;
      padding: 2.5rem;
      text-align: center;
      animation: resultsModalIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    html.dark .results-modal-content {
      background: #0f1419;
      border: 1px solid #1e293b;
    }

    @keyframes resultsModalIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .results-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 2.5rem;
    }

    .results-icon.passed {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
      border: 2px solid #10b981;
    }

    .results-icon.failed {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
      border: 2px solid #ef4444;
    }

    .results-title {
      font-size: 1.75rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      color: var(--color-text-primary, #0f172a);
    }

    html.dark .results-title {
      color: #e4e8ef;
    }

    .results-title.passed {
      color: #10b981;
    }

    .results-title.failed {
      color: #ef4444;
    }

    .results-subtitle {
      color: var(--color-text-secondary, #475569);
      margin-bottom: 2rem;
      font-size: 1rem;
    }

    html.dark .results-subtitle {
      color: #9ca3af;
    }

    .results-score {
      font-size: 4rem;
      font-weight: 900;
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .results-score.passed {
      color: #10b981;
    }

    .results-score.failed {
      color: #ef4444;
    }

    .results-passing {
      font-size: 0.875rem;
      color: var(--color-text-tertiary, #64748b);
      margin-bottom: 2rem;
    }

    html.dark .results-passing {
      color: #6b7280;
    }

    .results-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--color-bg-tertiary, #f1f5f9);
      border-radius: 16px;
    }

    html.dark .results-stats {
      background: #1a1f2e;
    }

    .results-stat {
      text-align: center;
    }

    .results-stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-text-primary, #0f172a);
    }

    html.dark .results-stat-value {
      color: #e4e8ef;
    }

    .results-stat-value.correct {
      color: #10b981;
    }

    .results-stat-value.incorrect {
      color: #ef4444;
    }

    .results-stat-value.time {
      color: #22a7d0;
    }

    .results-stat-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--color-text-tertiary, #64748b);
      margin-top: 0.25rem;
    }

    html.dark .results-stat-label {
      color: #6b7280;
    }

    .results-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .results-actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .results-actions-grid .results-btn:last-child {
      grid-column: 1 / -1;
    }

    .results-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .results-btn svg {
      flex-shrink: 0;
    }

    .results-btn-primary {
      background: linear-gradient(135deg, #22a7d0, #1a8db3);
      color: white;
      border: none;
    }

    .results-btn-primary:hover {
      background: linear-gradient(135deg, #1a8db3, #157a99);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(34, 167, 208, 0.4);
    }

    .results-btn-secondary {
      background: var(--color-bg-tertiary, #f1f5f9);
      color: var(--color-text-primary, #0f172a);
      border: 1px solid var(--color-border-primary, #e2e8f0);
    }

    html.dark .results-btn-secondary {
      background: #1a1f2e;
      color: #e4e8ef;
      border-color: #1e293b;
    }

    .results-btn-secondary:hover {
      background: var(--color-bg-secondary, #e2e8f0);
      transform: translateY(-2px);
    }

    html.dark .results-btn-secondary:hover {
      background: #262d3d;
    }

    /* Save Indicator */
    .save-indicator {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #10b981;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.875rem;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transition: transform 0.3s ease;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .save-indicator.show {
      transform: translateX(-50%) translateY(0);
    }

    /* ============================================
       RESPONSIVE
       ============================================ */
    @media (max-width: 1024px) {
      .training-layout {
        grid-template-columns: 1fr;
      }

      .questions-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 320px;
        z-index: 100;
        transform: translateX(-100%);
      }

      .questions-sidebar.open {
        transform: translateX(0);
      }

      .sidebar-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 99;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .sidebar-overlay.show {
        opacity: 1;
        visibility: visible;
      }
    }

    @media (max-width: 640px) {
      .training-header {
        padding: 0.75rem 1rem;
      }

      .training-content {
        padding: 1rem;
      }

      .question-card {
        padding: 1.25rem;
      }

      .question-title {
        font-size: 1.125rem;
      }

      .header-stats {
        display: none;
      }

      .nav-controls {
        flex-direction: column;
      }

      .nav-left, .nav-right {
        width: 100%;
      }

      .nav-left .btn, .nav-right .btn {
        flex: 1;
      }
    }

    /* Scrollbar - Custom styled */
    .questions-list::-webkit-scrollbar,
    .training-content::-webkit-scrollbar {
      width: 8px;
    }

    .questions-list::-webkit-scrollbar-track,
    .training-content::-webkit-scrollbar-track {
      background: linear-gradient(180deg, transparent 0%, rgba(34, 167, 208, 0.03) 50%, transparent 100%);
      border-radius: 4px;
    }

    .questions-list::-webkit-scrollbar-thumb,
    .training-content::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, rgba(34, 167, 208, 0.3) 0%, rgba(34, 167, 208, 0.5) 50%, rgba(34, 167, 208, 0.3) 100%);
      border-radius: 4px;
      border: 2px solid transparent;
      background-clip: padding-box;
      transition: background 0.2s ease;
    }

    .questions-list::-webkit-scrollbar-thumb:hover,
    .training-content::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, rgba(34, 167, 208, 0.5) 0%, rgba(34, 167, 208, 0.7) 50%, rgba(34, 167, 208, 0.5) 100%);
    }

    html.dark .questions-list::-webkit-scrollbar-thumb,
    html.dark .training-content::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, rgba(56, 189, 248, 0.25) 0%, rgba(56, 189, 248, 0.4) 50%, rgba(56, 189, 248, 0.25) 100%);
    }

    html.dark .questions-list::-webkit-scrollbar-thumb:hover,
    html.dark .training-content::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, rgba(56, 189, 248, 0.4) 0%, rgba(56, 189, 248, 0.6) 50%, rgba(56, 189, 248, 0.4) 100%);
    }

    /* Firefox scrollbar */
    .questions-list,
    .training-content {
      scrollbar-width: thin;
      scrollbar-color: rgba(34, 167, 208, 0.4) transparent;
    }

    html.dark .questions-list,
    html.dark .training-content {
      scrollbar-color: rgba(56, 189, 248, 0.3) transparent;
    }
  `;

  document.head.appendChild(styleTag);
}

function renderAccessDenied() {
  return `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: var(--color-bg-primary, #ffffff);">
      <div style="max-width: 28rem; width: 100%; text-align: center;">
        <div style="width: 5rem; height: 5rem; background: rgba(239, 68, 68, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
          <svg style="width: 2.5rem; height: 2.5rem; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h2 style="font-size: 1.875rem; font-weight: 700; margin-bottom: 1rem;">Acceso Denegado</h2>
        <p style="color: var(--color-text-secondary, #6b7280); margin-bottom: 2rem;">
          No tienes acceso a este producto. Por favor, adquiérelo primero.
        </p>
        <button onclick="window.location.hash='#/products'" class="btn btn-primary" style="width: 100%;">
          Ver Productos
        </button>
      </div>
    </div>
  `;
}

function renderError(message) {
  return `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: var(--color-bg-primary, #ffffff);">
      <div style="max-width: 28rem; width: 100%; text-align: center;">
        <div style="width: 5rem; height: 5rem; background: rgba(245, 158, 11, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
          <svg style="width: 2.5rem; height: 2.5rem; color: #f59e0b;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 style="font-size: 1.875rem; font-weight: 700; margin-bottom: 1rem;">Error</h2>
        <p style="color: var(--color-text-secondary, #6b7280); margin-bottom: 2rem;">${message}</p>
        <button onclick="window.location.hash='#/products'" class="btn btn-primary" style="width: 100%;">
          Volver a Productos
        </button>
      </div>
    </div>
  `;
}

function renderTrainingApp(product, questions, params) {
  const productName = typeof product.name === 'object' ? product.name.es || product.name.en : product.name;
  const mode = params.mode;
  const isExamMode = mode === 'exam';

  return `
    <div id="training-app-container" class="${isExamMode ? 'exam-mode' : ''}">
      <div class="training-layout">
        <!-- Sidebar -->
        <aside class="questions-sidebar" id="questions-sidebar">
          <div class="sidebar-header">
            <div class="sidebar-title-row">
              <span class="sidebar-title">Preguntas</span>
              <button onclick="toggleSidebar()" class="btn btn-secondary btn-icon">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Progress Stats Card -->
            <div class="progress-stats-card">
              <div class="progress-header">
                <span class="progress-percentage" id="sidebar-progress-percentage">0%</span>
                <span class="progress-label">Completado</span>
              </div>
              <div class="progress-bar-sidebar">
                <div class="progress-bar-fill" id="sidebar-progress-fill" style="width: 0%"></div>
              </div>
              <div class="progress-counts">
                <div class="progress-count">
                  <span>Contestadas:</span>
                  <span class="progress-count-value" id="sidebar-answered">0</span>
                </div>
                <div class="progress-count correct" id="sidebar-correct-container" style="display: none;">
                  <span>Correctas:</span>
                  <span class="progress-count-value" id="sidebar-correct">0</span>
                </div>
              </div>
            </div>

            <!-- Database Info -->
            <div class="database-info">
              <div class="database-info-label">Última actualización</div>
              <div class="database-info-value" id="database-last-updated">Cargando...</div>
            </div>
          </div>

          <div class="questions-list" id="questions-list">
            ${questions.map((q, i) => {
              const localizedTopic = typeof q.topic === 'string' ? q.topic : (q.topic?.es || q.topic?.en || '');
              const localizedQuestion = typeof q.question === 'string' ? q.question : (q.question?.es || q.question?.en || '');
              const hasImage = q.image && q.image.trim() !== '';
              return `
                <div class="question-item ${i === 0 ? 'active' : ''} ${hasImage ? 'has-image' : ''}" onclick="jumpToQuestion(${i})" data-index="${i}" data-has-image="${hasImage}">
                  <div class="question-number">${i + 1}</div>
                  <div class="question-item-content">
                    <div class="question-item-topic">${localizedTopic}</div>
                    <div class="question-item-text">${localizedQuestion}</div>
                  </div>
                  <div class="question-item-icons">
                    <button class="image-icon" onclick="event.stopPropagation(); openImageFromSidebar(${i})" title="Ver imagen">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </button>
                    <svg class="bookmark-icon" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                    </svg>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </aside>

        <!-- Main Content -->
        <div class="training-main" id="training-main">
          <!-- Header -->
          <header class="training-header">
            <div class="header-top">
              <div class="header-left">
                <button onclick="toggleSidebar()" class="btn btn-secondary btn-icon" title="Menú">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>
                <div class="header-info">
                  <h1>${productName}</h1>
                  <div class="header-meta">
                    <span class="badge ${mode}">${isExamMode ? 'Examen' : 'Práctica'}</span>
                    <span style="font-size: 0.8125rem; color: var(--color-text-tertiary, #64748b);">${questions.length} preguntas</span>
                  </div>
                </div>
              </div>

              <div class="header-right">
                ${isExamMode ? `
                  <div class="timer-box">
                    <div class="timer-label">Tiempo</div>
                    <div class="timer-display" id="timer-display-compact">60:00</div>
                  </div>
                ` : `
                  <div class="score-box">
                    <div class="score-label">Puntuación</div>
                    <div class="score-display" id="score-display">0%</div>
                  </div>
                `}
              </div>
            </div>

            <!-- Stats Row -->
            <div class="header-stats-row">
              <div class="header-stats">
                <div class="header-stat-card">
                  <span class="header-stat-label">Contestadas</span>
                  <span class="header-stat-value" id="header-stat-answered">0</span>
                </div>
                <div class="header-stat-card">
                  <span class="header-stat-label">Restantes</span>
                  <span class="header-stat-value" id="header-stat-unanswered">${questions.length}</span>
                </div>
                ${!isExamMode ? `
                  <div class="header-stat-card success">
                    <span class="header-stat-label">Correctas</span>
                    <span class="header-stat-value" id="header-stat-correct">0</span>
                  </div>
                  <div class="header-stat-card error">
                    <span class="header-stat-label">Incorrectas</span>
                    <span class="header-stat-value" id="header-stat-incorrect">0</span>
                  </div>
                ` : ''}
                <div class="header-stat-card warning">
                  <span class="header-stat-label">Marcadas</span>
                  <span class="header-stat-value" id="header-stat-bookmarked">0</span>
                </div>
              </div>

              <!-- Action Buttons - Right aligned -->
              <div class="action-buttons-inline">
                <button onclick="saveSession()" class="btn btn-action-sm btn-save" title="Guardar progreso">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                  </svg>
                  <span>Guardar</span>
                </button>
                <button onclick="showExitModal()" class="btn btn-action-sm btn-exit" title="Salir">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  <span>Salir</span>
                </button>
              </div>
            </div>

            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
              </div>
            </div>

            <!-- Navigation Controls -->
            <div class="nav-controls">
              <div class="nav-left">
                <button id="prev-btn" onclick="previousQuestion()" class="btn btn-secondary" disabled>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                  Anterior
                </button>
              </div>

              <button id="image-btn" onclick="openImageModal()" class="btn btn-secondary" style="display: none;">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Ver Imagen
              </button>

              <div class="nav-right">
                <button id="next-btn" onclick="nextQuestion()" class="btn btn-primary">
                  Siguiente
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
                <button id="finish-btn" onclick="finishTraining()" class="btn btn-primary" style="display: none;">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Finalizar</span>
                </button>
              </div>
            </div>
          </header>

          <!-- Content -->
          <div class="training-content">
            <div class="question-wrapper">
              <div id="question-container">
                <!-- Question loads here -->
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Indicator -->
      <div class="save-indicator" id="save-indicator">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        Progreso guardado
      </div>

      <!-- Image Modal -->
      <div id="image-modal" class="modal-overlay" onclick="closeImageModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()">
          <button class="modal-close" onclick="closeImageModal()" title="Cerrar">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <div class="modal-image-container" id="modal-image-container">
            <img id="modal-image" class="modal-image" src="" alt="Question Image">
            <div id="modal-image-placeholder" class="modal-image-placeholder" style="display: none;">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span>No hay imagen disponible</span>
            </div>
            <div class="modal-zoom-controls">
              <button class="modal-zoom-btn" onclick="zoomImage(-0.25)" title="Alejar">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"/>
                </svg>
              </button>
              <button class="modal-zoom-btn" onclick="resetImageZoom()" title="Restablecer">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                </svg>
              </button>
              <button class="modal-zoom-btn" onclick="zoomImage(0.25)" title="Acercar">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="modal-caption" id="modal-caption"></div>
        </div>
      </div>

      <!-- Exit Modal -->
      <div id="exit-modal" class="exit-modal-overlay" style="display: none;" onclick="closeExitModal(event)">
        <div class="exit-modal-content" onclick="event.stopPropagation()">
          <h3 class="exit-modal-title" id="exit-modal-title">¿Salir del entrenamiento?</h3>
          <p class="exit-modal-text" id="exit-modal-text">
            Tu progreso se guardará automáticamente. Puedes continuar más tarde desde donde lo dejaste.
          </p>
          <div class="exit-modal-actions" id="exit-modal-actions">
            <button onclick="closeExitModal()" class="btn btn-secondary">Continuar</button>
            <button onclick="confirmExit()" class="btn btn-primary">Salir</button>
          </div>
        </div>
      </div>

      <!-- Continue Session Modal (for practice mode) -->
      <div id="continue-modal" class="exit-modal-overlay" style="display: none;">
        <div class="exit-modal-content">
          <h3 class="exit-modal-title">Sesión anterior encontrada</h3>
          <p class="exit-modal-text">
            Tienes una sesión de práctica en progreso para este producto. ¿Deseas continuar donde lo dejaste o iniciar desde cero?
          </p>
          <div id="continue-modal-progress" style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(34, 167, 208, 0.1); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.875rem;">
              <span style="color: var(--color-text-secondary);">Progreso:</span>
              <span style="color: #22a7d0; font-weight: 600;" id="continue-modal-progress-text">0 de 0 preguntas</span>
            </div>
          </div>
          <div class="exit-modal-actions" style="flex-direction: column; gap: 0.75rem;">
            <button onclick="continueSavedSession()" class="btn btn-primary" style="width: 100%;">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 0.5rem;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Continuar sesión
            </button>
            <button onclick="startNewSession()" class="btn btn-secondary" style="width: 100%;">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 0.5rem;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Iniciar desde cero
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function initializeTrainingApp(product, questions, params) {
  window.trainingApp = {
    product,
    questions,
    currentQuestionIndex: 0,
    userAnswers: new Array(questions.length).fill(undefined),
    bookmarkedQuestions: new Set(),
    sessionStartTime: Date.now(),
    sessionMode: params.mode,
    examDuration: params.duration,
    examTimeRemaining: params.duration,
    passingScore: params.passingScore || 70,
    timerInterval: null,
    sessionId: params.sessionId || null,
    currentLanguage: localStorage.getItem('selectedLanguage') || 'es', // Get language from settings
    pendingExistingSession: null // For storing session to potentially continue
  };

  // Try to load saved session if sessionId is provided
  if (params.sessionId && auth.currentUser) {
    await loadSavedSession(params.sessionId);
    finalizeAppInitialization(params.mode);
  } else if (params.mode === 'exam' || params.retryIncorrect) {
    // EXAM MODE or RETRY INCORRECT: Always start fresh - never continue previous sessions
    createTrainingSession(product, params.mode);
    finalizeAppInitialization(params.mode);
  } else {
    // PRACTICE MODE: Check for existing session and ask user (only from dashboard)
    const existingSession = await findExistingSession(product.id, params.mode);
    if (existingSession && auth.currentUser) {
      // Store the session and show the continue modal
      window.trainingApp.pendingExistingSession = existingSession;
      showContinueModal(existingSession);
      // Don't finalize yet - wait for user choice
    } else {
      createTrainingSession(product, params.mode);
      finalizeAppInitialization(params.mode);
    }
  }
}

function finalizeAppInitialization(mode) {
  loadQuestion(window.trainingApp.currentQuestionIndex);

  // Load database last updated date
  loadDatabaseLastUpdated(window.trainingApp.product.databaseId);

  if (mode === 'exam') {
    startExamTimer();
  }

  // Auto-save every 30 seconds (only in practice mode)
  if (mode === 'practice') {
    setInterval(() => {
      if (auth.currentUser) {
        saveSessionToFirestore();
      }
    }, 30000);
  }
}

function showContinueModal(existingSession) {
  const modal = document.getElementById('continue-modal');
  const progressText = document.getElementById('continue-modal-progress-text');

  if (modal) {
    // Calculate progress from existing session
    const answeredCount = existingSession.userAnswers?.filter(a => a !== undefined).length || 0;
    const totalQuestions = existingSession.totalQuestions || window.trainingApp.questions.length;

    if (progressText) {
      progressText.textContent = `${answeredCount} de ${totalQuestions} preguntas`;
    }

    modal.style.display = 'flex';
  }
}

window.continueSavedSession = async function() {
  const modal = document.getElementById('continue-modal');
  if (modal) modal.style.display = 'none';

  const existingSession = window.trainingApp.pendingExistingSession;
  if (existingSession) {
    await loadSavedSession(existingSession.id);
  }

  finalizeAppInitialization(window.trainingApp.sessionMode);
}

window.startNewSession = function() {
  const modal = document.getElementById('continue-modal');
  if (modal) modal.style.display = 'none';

  // Clear any pending session reference
  window.trainingApp.pendingExistingSession = null;

  // Create a fresh session
  createTrainingSession(window.trainingApp.product, window.trainingApp.sessionMode);

  finalizeAppInitialization(window.trainingApp.sessionMode);
}

// Load database last updated date from Firebase
async function loadDatabaseLastUpdated(databaseId) {
  if (!databaseId) {
    const el = document.getElementById('database-last-updated');
    if (el) el.textContent = 'No disponible';
    return;
  }

  try {
    // Get the most recent question's timestamp or try to get database metadata
    const dbMetaRef = doc(db, 'databases', databaseId);
    const dbMetaDoc = await getDoc(dbMetaRef);

    if (dbMetaDoc.exists()) {
      const data = dbMetaDoc.data();
      if (data.lastUpdated) {
        const date = data.lastUpdated.toDate ? data.lastUpdated.toDate() : new Date(data.lastUpdated);
        const formatted = formatDate(date);
        const el = document.getElementById('database-last-updated');
        if (el) el.textContent = formatted;
        return;
      }
    }

    // Fallback: show current date
    const el = document.getElementById('database-last-updated');
    if (el) el.textContent = formatDate(new Date());
  } catch (error) {
    console.log('Error cargando fecha de actualización:', error.message);
    const el = document.getElementById('database-last-updated');
    if (el) el.textContent = 'No disponible';
  }
}

// Format date helper
function formatDate(date) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
}

// Find existing incomplete session for this product
async function findExistingSession(productId, mode) {
  if (!auth.currentUser) return null;

  try {
    const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
    const sessionsRef = collection(db, 'users', auth.currentUser.uid, 'sessions');

    // Try query with orderBy first (requires composite index)
    try {
      const q = query(
        sessionsRef,
        where('productId', '==', productId),
        where('mode', '==', mode),
        where('completed', '==', false),
        orderBy('lastUpdated', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        console.log('✅ Sesión existente encontrada:', doc.id);
        return { id: doc.id, ...doc.data() };
      }
    } catch (indexError) {
      // Index not available, try simpler query without orderBy
      console.log('⚠️ Índice no disponible, usando consulta simple:', indexError.message);

      const simpleQuery = query(
        sessionsRef,
        where('productId', '==', productId),
        where('mode', '==', mode),
        where('completed', '==', false)
      );

      const snapshot = await getDocs(simpleQuery);
      if (!snapshot.empty) {
        // Find the most recent session manually
        let mostRecent = null;
        let mostRecentTime = 0;

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const lastUpdated = data.lastUpdated?.toMillis?.() || 0;
          if (lastUpdated > mostRecentTime) {
            mostRecentTime = lastUpdated;
            mostRecent = { id: doc.id, ...data };
          }
        });

        if (mostRecent) {
          console.log('✅ Sesión existente encontrada (fallback):', mostRecent.id);
          return mostRecent;
        }
      }
    }
  } catch (error) {
    console.error('Error buscando sesión existente:', error);
  }
  return null;
}

// Load saved session from Firebase
async function loadSavedSession(sessionId) {
  if (!auth.currentUser) return;

  try {
    const sessionRef = doc(db, 'users', auth.currentUser.uid, 'sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (sessionDoc.exists()) {
      const data = sessionDoc.data();
      const app = window.trainingApp;

      // Restore session state
      app.sessionId = sessionId;

      // Restore bookmarks using question IDs
      if (data.bookmarkedQuestionIds && Array.isArray(data.bookmarkedQuestionIds)) {
        // Convert question IDs back to indices
        const bookmarkSet = new Set();
        data.bookmarkedQuestionIds.forEach(qId => {
          const index = app.questions.findIndex(q => q.id === qId);
          if (index !== -1) {
            bookmarkSet.add(index);
          }
        });
        app.bookmarkedQuestions = bookmarkSet;
        console.log('✅ Bookmarks restaurados:', bookmarkSet.size);
      } else if (data.bookmarkedQuestions && Array.isArray(data.bookmarkedQuestions)) {
        // Fallback for old format (indices)
        app.bookmarkedQuestions = new Set(data.bookmarkedQuestions);
      }

      // Restore answers using question IDs mapping
      if (data.answersMap && typeof data.answersMap === 'object') {
        // Convert question ID -> ORIGINAL answer index back to CURRENT shuffled index
        let restoredCount = 0;
        app.questions.forEach((q, i) => {
          if (data.answersMap[q.id] !== undefined) {
            const originalAnswerIndex = data.answersMap[q.id];
            // Find which current index maps to this original index
            if (q.optionMapping) {
              const currentIndex = q.optionMapping.indexOf(originalAnswerIndex);
              if (currentIndex !== -1) {
                app.userAnswers[i] = currentIndex;
                restoredCount++;
              }
            } else {
              // Fallback if no mapping (shouldn't happen)
              app.userAnswers[i] = originalAnswerIndex;
              restoredCount++;
            }
          }
        });
        console.log('✅ Respuestas restauradas desde answersMap:', restoredCount);
      } else if (data.userAnswers && Array.isArray(data.userAnswers)) {
        // Fallback for old format (but this won't work well with randomization)
        app.userAnswers = data.userAnswers;
      }

      if (data.currentQuestionIndex !== undefined) {
        app.currentQuestionIndex = Math.min(data.currentQuestionIndex, app.questions.length - 1);
      }

      if (data.timeRemaining && app.sessionMode === 'exam') {
        app.examTimeRemaining = data.timeRemaining;
      }

      console.log('✅ Sesión restaurada:', {
        sessionId: sessionId,
        answers: app.userAnswers.filter(a => a !== undefined).length,
        bookmarks: app.bookmarkedQuestions.size,
        currentQuestion: app.currentQuestionIndex,
        answersMapKeys: data.answersMap ? Object.keys(data.answersMap) : [],
        bookmarkedIds: data.bookmarkedQuestionIds || []
      });
    }
  } catch (error) {
    console.error('Error cargando sesión guardada:', error);
  }
}

async function createTrainingSession(product, mode) {
  try {
    const sessionData = {
      productId: product.id,
      productName: typeof product.name === 'object' ? product.name.es || product.name.en : product.name,
      mode: mode,
      selectedTopics: [],
      questionCount: window.trainingApp.questions.length
    };

    const sessionId = await createSession(sessionData);
    window.trainingApp.sessionId = sessionId;
    console.log('✅ Sesión creada:', sessionId);
  } catch (error) {
    console.error('Error creando sesión:', error);
  }
}

function startExamTimer() {
  updateTimerDisplay();

  window.trainingApp.timerInterval = setInterval(() => {
    window.trainingApp.examTimeRemaining--;
    updateTimerDisplay();

    if (window.trainingApp.examTimeRemaining <= 0) {
      clearInterval(window.trainingApp.timerInterval);
      finishTraining();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(window.trainingApp.examTimeRemaining / 60);
  const seconds = window.trainingApp.examTimeRemaining % 60;
  const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const timerElement = document.getElementById('timer-display-compact');
  if (timerElement) {
    timerElement.textContent = display;

    // Cambiar color según el tiempo restante
    if (window.trainingApp.examTimeRemaining <= 300) {
      timerElement.style.color = '#ef4444'; // Rojo crítico
    } else if (window.trainingApp.examTimeRemaining <= 600) {
      timerElement.style.color = '#f59e0b'; // Amarillo advertencia
    } else {
      timerElement.style.color = 'inherit';
    }
  }
}

// Get localized text based on current language
function getLocalizedText(textObj, lang = 'es') {
  if (!textObj) return '';
  if (typeof textObj === 'string') return textObj;
  if (typeof textObj === 'object') {
    return textObj[lang] || textObj['es'] || textObj['en'] || Object.values(textObj)[0] || '';
  }
  return String(textObj);
}

function loadQuestion(index) {
  const app = window.trainingApp;
  const question = app.questions[index];
  if (!question) return;

  const container = document.getElementById('question-container');
  if (!container) return;

  const userAnswer = app.userAnswers[index];
  const isBookmarked = app.bookmarkedQuestions.has(index);
  const isPracticeMode = app.sessionMode === 'practice';
  const isReviewMode = app.sessionMode === 'review' || app.reviewMode;
  const showAnswers = isPracticeMode || isReviewMode;

  // Get localized texts
  const currentLang = app.currentLanguage || 'es';
  const localizedTopic = getLocalizedText(question.topic, currentLang);
  const localizedQuestion = getLocalizedText(question.question, currentLang);
  const localizedExplanation = getLocalizedText(question.explanation, currentLang);

  // Show/hide image button
  const imageBtn = document.getElementById('image-btn');
  if (imageBtn) {
    imageBtn.style.display = question.image ? 'inline-flex' : 'none';
  }

  // Store current question image for modal
  window.currentQuestionImage = question.image;
  window.currentQuestionCaption = localizedQuestion;

  let optionsHTML = question.options.map((option, i) => {
    const localizedOption = getLocalizedText(option, currentLang);
    let className = 'answer-option';

    // En modo práctica o revisión, mostrar colores si ya fue contestada
    if (showAnswers && userAnswer !== undefined) {
      if (i === question.correctAnswer) {
        className += ' correct';
      } else if (i === userAnswer && i !== question.correctAnswer) {
        className += ' incorrect';
      }
    }
    // En modo examen, SOLO mostrar si está seleccionada (sin colores de correcto/incorrecto)
    else if (i === userAnswer) {
      className += ' selected';
    }

    // En modo revisión, deshabilitar clicks
    const onClickAttr = isReviewMode ? '' : `onclick="selectAnswer(${i})"`;

    return `
      <div class="${className}" ${onClickAttr} ${isReviewMode ? 'style="cursor: default;"' : ''}>
        <div class="option-letter">${String.fromCharCode(65 + i)}</div>
        <span style="flex: 1;">${localizedOption}</span>
        ${showAnswers && userAnswer !== undefined && i === question.correctAnswer ? `
          <svg style="width: 1.5rem; height: 1.5rem; color: #10b981; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        ` : ''}
        ${showAnswers && userAnswer !== undefined && i === userAnswer && i !== question.correctAnswer ? `
          <svg style="width: 1.5rem; height: 1.5rem; color: #ef4444; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        ` : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="question-card">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem;">
        <div style="flex: 1;">
          <div style="display: inline-block; padding: 0.375rem 0.75rem; background: rgba(34, 167, 208, 0.1); color: #22a7d0; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.75rem;">
            ${localizedTopic}
          </div>
          <div style="font-size: 0.875rem; color: var(--color-text-secondary, #6b7280);">
            Pregunta ${index + 1} de ${app.questions.length}
          </div>
        </div>
        <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark(${index})" title="Marcar pregunta">
          <svg style="width: 1.25rem; height: 1.25rem; color: ${isBookmarked ? '#f59e0b' : 'currentColor'};" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
          </svg>
        </button>
      </div>

      <h2 class="question-title">${localizedQuestion}</h2>

      <div class="answer-options">
        ${optionsHTML}
      </div>

      ${showAnswers && userAnswer !== undefined ? `
        <div class="explanation-box ${userAnswer === question.correctAnswer ? 'correct' : 'incorrect'}">
          <div style="font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            ${userAnswer === question.correctAnswer ? `
              <svg style="width: 1.5rem; height: 1.5rem; color: #10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              ¡Correcto!
            ` : `
              <svg style="width: 1.5rem; height: 1.5rem; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Incorrecto
            `}
          </div>
          <p style="color: var(--color-text-secondary, #6b7280);">${localizedExplanation || ''}</p>
        </div>
      ` : ''}
    </div>
  `;

  updateProgress();
  updateNavigationButtons();
  updateQuestionsList();
}

window.selectAnswer = async function(optionIndex) {
  window.trainingApp.userAnswers[window.trainingApp.currentQuestionIndex] = optionIndex;
  loadQuestion(window.trainingApp.currentQuestionIndex);

  // Save immediately when answer changes
  if (auth.currentUser) {
    await saveSessionToFirestore();
  }
};

window.toggleBookmark = async function(index) {
  if (window.trainingApp.bookmarkedQuestions.has(index)) {
    window.trainingApp.bookmarkedQuestions.delete(index);
    console.log('🔖 Bookmark eliminado para pregunta', index);
  } else {
    window.trainingApp.bookmarkedQuestions.add(index);
    console.log('🔖 Bookmark agregado para pregunta', index);
  }
  loadQuestion(window.trainingApp.currentQuestionIndex);
  updateQuestionsList();

  // Save immediately when bookmark changes
  if (auth.currentUser) {
    await saveSessionToFirestore();
  }
};

window.toggleSidebar = function() {
  const sidebar = document.getElementById('questions-sidebar');
  const main = document.getElementById('training-main');

  if (sidebar && main) {
    sidebar.classList.toggle('closed');
    main.classList.toggle('sidebar-closed');
  }
};

window.jumpToQuestion = function(index) {
  window.trainingApp.currentQuestionIndex = index;
  loadQuestion(index);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Scroll to active item in sidebar
  scrollToActiveQuestion(index);
};

// Scroll sidebar to show the active question
function scrollToActiveQuestion(index) {
  const questionsList = document.getElementById('questions-list');
  const activeItem = document.querySelector(`.question-item[data-index="${index}"]`);

  if (questionsList && activeItem) {
    const listRect = questionsList.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    // Check if item is not fully visible
    const isAboveView = itemRect.top < listRect.top;
    const isBelowView = itemRect.bottom > listRect.bottom;

    if (isAboveView || isBelowView) {
      activeItem.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
}

function updateQuestionsList() {
  const app = window.trainingApp;
  const items = document.querySelectorAll('.question-item');
  const isPracticeMode = app.sessionMode === 'practice';
  const isReviewMode = app.sessionMode === 'review' || app.reviewMode;

  items.forEach((item, i) => {
    const userAnswer = app.userAnswers[i];
    const isAnswered = userAnswer !== undefined;
    const isBookmarked = app.bookmarkedQuestions.has(i);
    const isCurrent = i === app.currentQuestionIndex;
    const hasImage = item.dataset.hasImage === 'true';

    item.className = 'question-item';
    if (isCurrent) item.classList.add('active');
    if (isBookmarked) item.classList.add('bookmarked');
    if (hasImage) item.classList.add('has-image');

    // Colores según resultado
    if (isAnswered) {
      if (isPracticeMode || isReviewMode) {
        // En modo práctica o revisión: mostrar verde (correcto) o rojo (incorrecto)
        const isCorrect = userAnswer === app.questions[i].correctAnswer;
        if (isCorrect) {
          item.classList.add('answered-correct');
        } else {
          item.classList.add('answered-incorrect');
        }
      } else {
        // En modo examen: solo mostrar que fue contestada (gris neutro)
        item.classList.add('answered-neutral');
      }
    }
  });
}

window.nextQuestion = function() {
  const app = window.trainingApp;
  if (app.currentQuestionIndex < app.questions.length - 1) {
    app.currentQuestionIndex++;
    loadQuestion(app.currentQuestionIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    scrollToActiveQuestion(app.currentQuestionIndex);
  }
};

window.previousQuestion = function() {
  const app = window.trainingApp;
  if (app.currentQuestionIndex > 0) {
    app.currentQuestionIndex--;
    loadQuestion(app.currentQuestionIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    scrollToActiveQuestion(app.currentQuestionIndex);
  }
};

function updateProgress() {
  const app = window.trainingApp;
  const answeredCount = app.userAnswers.filter(a => a !== undefined).length;
  const unansweredCount = app.questions.length - answeredCount;
  const progress = (answeredCount / app.questions.length) * 100;
  const bookmarkedCount = app.bookmarkedQuestions.size;

  // Actualizar barra de progreso del header
  const progressFill = document.getElementById('progress-fill');
  if (progressFill) progressFill.style.width = `${progress}%`;

  // Actualizar sidebar progress stats card
  const sidebarProgressPercentage = document.getElementById('sidebar-progress-percentage');
  const sidebarProgressFill = document.getElementById('sidebar-progress-fill');
  const sidebarAnswered = document.getElementById('sidebar-answered');

  if (sidebarProgressPercentage) sidebarProgressPercentage.textContent = `${Math.round(progress)}%`;
  if (sidebarProgressFill) sidebarProgressFill.style.width = `${progress}%`;
  if (sidebarAnswered) sidebarAnswered.textContent = answeredCount;

  // Actualizar estadísticas del header
  const headerStatAnswered = document.getElementById('header-stat-answered');
  const headerStatUnanswered = document.getElementById('header-stat-unanswered');
  const headerStatBookmarked = document.getElementById('header-stat-bookmarked');

  if (headerStatAnswered) headerStatAnswered.textContent = answeredCount;
  if (headerStatUnanswered) headerStatUnanswered.textContent = unansweredCount;
  if (headerStatBookmarked) headerStatBookmarked.textContent = bookmarkedCount;

  if (app.sessionMode === 'practice') {
    const correctCount = app.userAnswers.filter((answer, index) =>
      answer === app.questions[index].correctAnswer
    ).length;
    const incorrectCount = answeredCount - correctCount;
    const totalQuestions = app.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const headerStatCorrect = document.getElementById('header-stat-correct');
    const headerStatIncorrect = document.getElementById('header-stat-incorrect');
    const scoreDisplay = document.getElementById('score-display');

    if (headerStatCorrect) headerStatCorrect.textContent = correctCount;
    if (headerStatIncorrect) headerStatIncorrect.textContent = incorrectCount;
    if (scoreDisplay) scoreDisplay.textContent = `${score}%`;

    // Actualizar sidebar correct count (solo en modo práctica)
    const sidebarCorrectContainer = document.getElementById('sidebar-correct-container');
    const sidebarCorrect = document.getElementById('sidebar-correct');
    if (sidebarCorrectContainer) sidebarCorrectContainer.style.display = 'flex';
    if (sidebarCorrect) sidebarCorrect.textContent = correctCount;
  }
}

function updateNavigationButtons() {
  const app = window.trainingApp;
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const finishBtn = document.getElementById('finish-btn');
  const isExam = app.sessionMode === 'exam';

  if (prevBtn) prevBtn.disabled = app.currentQuestionIndex === 0;

  const isLastQuestion = app.currentQuestionIndex === app.questions.length - 1;

  // Update finish button text based on mode
  if (finishBtn) {
    const btnText = finishBtn.querySelector('span');
    if (btnText) {
      btnText.textContent = isExam ? 'Finalizar Examen' : 'Finalizar';
    }
  }

  // Both modes: Always show Finish button, hide Next on last question
  if (nextBtn) {
    nextBtn.style.display = isLastQuestion ? 'none' : 'inline-flex';
  }
  if (finishBtn) {
    finishBtn.style.display = 'inline-flex'; // Always visible
  }
}

// Image zoom state
window.imageZoomLevel = 1;

window.openImageModal = function(imageSrc, caption) {
  const imageToShow = imageSrc || window.currentQuestionImage;
  const captionToShow = caption || window.currentQuestionCaption || '';

  const modal = document.getElementById('image-modal');
  const modalImage = document.getElementById('modal-image');
  const modalCaption = document.getElementById('modal-caption');
  const placeholder = document.getElementById('modal-image-placeholder');

  if (!modal) return;

  // Reset zoom
  window.imageZoomLevel = 1;
  if (modalImage) {
    modalImage.style.transform = 'scale(1)';
  }

  // Show modal with animation
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Check if we have an image
  const hasValidImage = imageToShow && imageToShow.trim() !== '';

  if (hasValidImage && modalImage) {
    modalImage.src = imageToShow;
    modalImage.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  } else {
    if (modalImage) modalImage.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  }

  if (modalCaption) {
    modalCaption.textContent = captionToShow;
  }

  // Trigger animation after a small delay
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  });
};

window.closeImageModal = function(event) {
  if (!event || event.target.id === 'image-modal') {
    const modal = document.getElementById('image-modal');
    if (modal) {
      modal.classList.remove('active');

      // Wait for animation to complete before hiding
      setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Reset zoom
        window.imageZoomLevel = 1;
        const modalImage = document.getElementById('modal-image');
        if (modalImage) {
          modalImage.style.transform = 'scale(1)';
        }
      }, 300);
    }
  }
};

// Function to open image from sidebar
window.openImageFromSidebar = function(questionIndex) {
  const app = window.trainingApp;
  if (!app || !app.questions[questionIndex]) return;

  const question = app.questions[questionIndex];
  const localizedQuestion = typeof question.question === 'string'
    ? question.question
    : (question.question?.es || question.question?.en || '');

  window.openImageModal(question.image, localizedQuestion);
};

// Zoom functions for image modal
window.zoomImage = function(delta) {
  window.imageZoomLevel = Math.max(0.5, Math.min(3, window.imageZoomLevel + delta));
  const modalImage = document.getElementById('modal-image');
  if (modalImage) {
    modalImage.style.transform = `scale(${window.imageZoomLevel})`;
    modalImage.style.transition = 'transform 0.2s ease';
  }
};

window.resetImageZoom = function() {
  window.imageZoomLevel = 1;
  const modalImage = document.getElementById('modal-image');
  if (modalImage) {
    modalImage.style.transform = 'scale(1)';
    modalImage.style.transition = 'transform 0.2s ease';
  }
};

window.saveSession = async function() {
  await saveSessionToFirestore(true); // Show indicator for manual save
};

async function saveSessionToFirestore(showIndicator = false) {
  if (!auth.currentUser || !window.trainingApp) return;

  try {
    const app = window.trainingApp;

    // Convert bookmarked indices to question IDs for persistence
    const bookmarkedQuestionIds = Array.from(app.bookmarkedQuestions).map(index => {
      return app.questions[index]?.id;
    }).filter(Boolean);

    // Create answers map: question ID -> ORIGINAL answer index (for persistence across randomizations)
    const answersMap = {};
    app.userAnswers.forEach((answer, index) => {
      if (answer !== undefined && app.questions[index]) {
        const q = app.questions[index];
        // Convert current shuffled index to original index using optionMapping
        const originalAnswerIndex = q.optionMapping ? q.optionMapping[answer] : answer;
        answersMap[q.id] = originalAnswerIndex;
      }
    });

    // Clean userAnswers - replace undefined with null (Firebase doesn't accept undefined)
    const cleanedUserAnswers = app.userAnswers.map(a => a === undefined ? null : a);

    const sessionData = {
      productId: app.product.id,
      mode: app.sessionMode,
      currentQuestionIndex: app.currentQuestionIndex,
      userAnswers: cleanedUserAnswers, // Keep for backwards compatibility
      answersMap: answersMap, // New: question ID -> answer mapping
      bookmarkedQuestions: Array.from(app.bookmarkedQuestions), // Keep for backwards compatibility
      bookmarkedQuestionIds: bookmarkedQuestionIds, // New: array of question IDs
      timeRemaining: app.sessionMode === 'exam' ? (app.examTimeRemaining || 0) : null,
      totalQuestions: app.questions.length,
      lastUpdated: serverTimestamp(),
      completed: false
    };

    const sessionRef = doc(db, 'users', auth.currentUser.uid, 'sessions', app.sessionId || `session_${Date.now()}`);

    if (!app.sessionId) {
      app.sessionId = `session_${Date.now()}`;
    }

    await setDoc(sessionRef, sessionData, { merge: true });
    if (showIndicator) {
      showSaveIndicator();
    }
    console.log('✅ Sesión guardada:', {
      sessionId: app.sessionId,
      bookmarks: bookmarkedQuestionIds,
      answersCount: Object.keys(answersMap).length,
      answersMap: answersMap
    });
  } catch (error) {
    console.error('Error guardando sesión:', error);
  }
}

function showSaveIndicator() {
  const indicator = document.getElementById('save-indicator');
  if (indicator) {
    indicator.classList.add('show');
    setTimeout(() => {
      indicator.classList.remove('show');
    }, 2000);
  }
}

window.finishTraining = async function() {
  const app = window.trainingApp;
  let results = null;
  let timeSpent = 0;

  try {
    if (app.timerInterval) {
      clearInterval(app.timerInterval);
    }

    timeSpent = Math.floor((Date.now() - app.sessionStartTime) / 1000);

    // Calcular correctas de forma segura
    let correctCount = 0;
    for (let i = 0; i < app.questions.length; i++) {
      const userAnswer = app.userAnswers[i];
      const question = app.questions[i];
      if (userAnswer !== undefined && question && userAnswer === question.correctAnswer) {
        correctCount++;
      }
    }

    const totalQuestions = app.questions.length || 1; // Evitar división por cero

    results = {
      productId: app.product.id,
      mode: app.sessionMode,
      totalQuestions: app.questions.length,
      correctAnswers: correctCount,
      incorrectAnswers: app.questions.length - correctCount,
      score: Math.round((correctCount / totalQuestions) * 100),
      timeSpent: timeSpent,
      completed: true,
      completedAt: serverTimestamp(),
      answers: app.questions.map((q, i) => ({
        questionId: q.id,
        topic: q.topic || 'General',
        userAnswer: app.userAnswers[i] !== undefined ? app.userAnswers[i] : null, // Firebase doesn't accept undefined
        correctAnswer: q.correctAnswer,
        isCorrect: app.userAnswers[i] === q.correctAnswer
      }))
    };

    console.log('📊 Resultados calculados:', results);

    // Intentar completar sesión (no crítico si falla)
    try {
      if (app.sessionId) {
        await completeSession(app.sessionId, results);
        console.log('✅ Sesión completada en Firebase');
      }
    } catch (sessionError) {
      console.error('⚠️ Error guardando sesión (no crítico):', sessionError);
    }

    // Mostrar modal de resultados
    showResultsModal(results, timeSpent, app);
  } catch (error) {
    console.error('❌ Error en finishTraining:', error);
    // Crear resultados de emergencia si algo falló
    if (!results) {
      results = {
        productId: app?.product?.id || 'unknown',
        mode: app?.sessionMode || 'practice',
        totalQuestions: app?.questions?.length || 0,
        correctAnswers: 0,
        incorrectAnswers: app?.questions?.length || 0,
        score: 0,
        timeSpent: timeSpent,
        completed: true,
        answers: []
      };
    }
    showResultsModal(results, timeSpent, app, true);
  }
};

function showResultsModal(results, timeSpent, app, hasError = false) {
  const passed = results.score >= (app.passingScore || 70);
  const isExam = app.sessionMode === 'exam';
  const hasIncorrect = results.incorrectAnswers > 0;

  console.log('📊 Mostrando modal de resultados:', { passed, isExam, score: results.score, passingScore: app.passingScore });

  // Remove any existing results modal
  const existingModal = document.getElementById('results-modal');
  if (existingModal) existingModal.remove();

  // Store results for retry functionality
  window.lastTrainingResults = {
    results,
    productId: app.product.id,
    mode: app.sessionMode,
    incorrectQuestionIds: results.answers
      .filter(a => !a.isCorrect)
      .map(a => a.questionId)
  };

  const isDark = document.documentElement.classList.contains('dark');
  const bgColor = isDark ? '#0f1419' : '#ffffff';
  const textColor = isDark ? '#e4e8ef' : '#0f172a';
  const textSecondary = isDark ? '#9ca3af' : '#475569';
  const borderColor = isDark ? '#1e293b' : 'transparent';

  const modalHTML = `
    <style id="results-modal-styles">
      @keyframes resultsModalIn {
        from { opacity: 0; transform: scale(0.9) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
    </style>
    <div id="results-modal" style="
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    ">
      <div style="
        background: ${bgColor};
        border: 1px solid ${borderColor};
        border-radius: 24px;
        max-width: 480px;
        width: 100%;
        padding: 2.5rem;
        text-align: center;
        animation: resultsModalIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      ">
        <div style="
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          font-size: 2.5rem;
          background: ${passed ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))'};
          border: 2px solid ${passed ? '#10b981' : '#ef4444'};
        ">
          ${passed ? '🎉' : '📚'}
        </div>

        <h2 style="
          font-size: 1.75rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          color: ${passed ? '#10b981' : '#ef4444'};
        ">
          ${isExam
            ? (passed ? '¡Examen Aprobado!' : 'Examen No Aprobado')
            : '¡Sesión Completada!'}
        </h2>

        <p style="color: ${textSecondary}; margin-bottom: 2rem; font-size: 1rem;">
          ${isExam
            ? (passed
              ? 'Felicidades, has alcanzado el mínimo aprobatorio.'
              : 'No te preocupes, sigue practicando y lo lograrás.')
            : 'Buen trabajo en tu sesión de práctica.'}
        </p>

        <div style="
          font-size: 4rem;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: ${passed ? '#10b981' : '#ef4444'};
        ">
          ${results.score}%
        </div>

        ${isExam ? `
          <p style="color: ${textSecondary}; font-size: 0.875rem; margin-bottom: 1.5rem;">
            Mínimo aprobatorio: ${app.passingScore || 70}%
          </p>
        ` : ''}

        <div style="
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1.25rem;
          background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
          border-radius: 12px;
        ">
          <div style="text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 800; color: #10b981;">${results.correctAnswers}</div>
            <div style="font-size: 0.75rem; color: ${textSecondary}; text-transform: uppercase; letter-spacing: 0.05em;">Correctas</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 800; color: #ef4444;">${results.incorrectAnswers}</div>
            <div style="font-size: 0.75rem; color: ${textSecondary}; text-transform: uppercase; letter-spacing: 0.05em;">Incorrectas</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 800; color: #22a7d0;">${formatTime(timeSpent)}</div>
            <div style="font-size: 0.75rem; color: ${textSecondary}; text-transform: uppercase; letter-spacing: 0.05em;">Tiempo</div>
          </div>
        </div>

        ${hasError ? `
          <p style="color: #ef4444; font-size: 0.875rem; margin-bottom: 1rem;">
            Hubo un error al guardar los resultados, pero puedes continuar.
          </p>
        ` : ''}

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
          ${isExam ? `
            <button onclick="reviewExamAnswers()" style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              padding: 0.875rem 1rem;
              border-radius: 10px;
              font-weight: 600;
              font-size: 0.875rem;
              cursor: pointer;
              transition: all 0.2s;
              background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
              border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
              color: ${textColor};
            ">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              Revisar
            </button>
          ` : ''}
          ${hasIncorrect ? `
            <button onclick="retryIncorrectQuestions()" style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              padding: 0.875rem 1rem;
              border-radius: 10px;
              font-weight: 600;
              font-size: 0.875rem;
              cursor: pointer;
              transition: all 0.2s;
              background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
              border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
              color: ${textColor};
            ">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Incorrectas (${results.incorrectAnswers})
            </button>
          ` : ''}
          <button onclick="retryFullSession()" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.875rem 1rem;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
            background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
            color: ${textColor};
          ">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Nueva Sesión
          </button>
          <button onclick="closeResultsAndExit()" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.875rem 1rem;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
            background: linear-gradient(135deg, #22a7d0, #06b6d4);
            border: none;
            color: white;
          ">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Dashboard
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  console.log('✅ Modal de resultados insertado en el DOM');
}

window.closeResultsAndExit = function() {
  const app = window.trainingApp;
  const productId = app?.product?.id;

  // Remove modal and its styles
  const modal = document.getElementById('results-modal');
  if (modal) modal.remove();
  const modalStyles = document.getElementById('results-modal-styles');
  if (modalStyles) modalStyles.remove();

  // Clean up
  const trainingContainer = document.getElementById('training-app-container');
  if (trainingContainer) trainingContainer.remove();

  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.height = '';

  const styleTag = document.getElementById('training-app-styles');
  if (styleTag) styleTag.remove();

  window.trainingApp = null;
  window.lastTrainingResults = null;

  // Redirect
  window.location.hash = productId ? `#/dashboard/${productId}` : '#/products';
}

// Retry full session - start a new session with same settings
window.retryFullSession = function() {
  const lastResults = window.lastTrainingResults;
  if (!lastResults) return;

  // Remove results modal and its styles
  const modal = document.getElementById('results-modal');
  if (modal) modal.remove();
  const modalStyles = document.getElementById('results-modal-styles');
  if (modalStyles) modalStyles.remove();

  // Clean up current app
  const trainingContainer = document.getElementById('training-app-container');
  if (trainingContainer) trainingContainer.remove();

  const styleTag = document.getElementById('training-app-styles');
  if (styleTag) styleTag.remove();

  document.body.style.overflow = '';
  window.trainingApp = null;

  // Redirect to training with same mode
  const mode = lastResults.mode || 'practice';
  window.location.hash = `#/training/${lastResults.productId}?mode=${mode}`;
}

// Show loading overlay to prevent flash of unrendered content
function showLoadingOverlay(message = 'Cargando...') {
  const isDark = document.documentElement.classList.contains('dark');
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.innerHTML = `
    <div style="position: fixed; inset: 0; background: ${isDark ? '#0a0e14' : '#ffffff'}; z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem;">
      <div style="width: 48px; height: 48px; border: 3px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; border-top-color: #22a7d0; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="color: ${isDark ? '#9ca3af' : '#6b7280'}; font-size: 1rem; font-weight: 500;">${message}</p>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `;
  document.body.appendChild(overlay);
}

// Retry only incorrect questions
window.retryIncorrectQuestions = async function() {
  const lastResults = window.lastTrainingResults;
  if (!lastResults || !lastResults.incorrectQuestionIds?.length) {
    console.error('❌ No hay preguntas incorrectas para repetir');
    return;
  }

  console.log('🔄 Repetir incorrectas:', lastResults.incorrectQuestionIds);
  const productId = lastResults.productId;

  // Show loading overlay FIRST to cover the screen immediately
  showLoadingOverlay('Preparando preguntas incorrectas...');

  // Remove results modal and its styles
  const modal = document.getElementById('results-modal');
  if (modal) modal.remove();
  const modalStyles = document.getElementById('results-modal-styles');
  if (modalStyles) modalStyles.remove();

  // Clean up current app completely
  const trainingContainer = document.getElementById('training-app-container');
  if (trainingContainer) trainingContainer.remove();

  const styleTag = document.getElementById('training-app-styles');
  if (styleTag) styleTag.remove();

  document.body.style.overflow = '';
  window.trainingApp = null;
  window.lastTrainingResults = null;

  // Store incorrect IDs in sessionStorage and force navigation
  sessionStorage.setItem('retryIncorrectQuestionIds', JSON.stringify(lastResults.incorrectQuestionIds));

  // Force a full page reload to ensure clean state
  window.location.href = `${window.location.pathname}#/training/${productId}?mode=practice&retryIncorrect=true`;
  window.location.reload();
}

// Review exam answers - show all answers with correct/incorrect marking
window.reviewExamAnswers = function() {
  const app = window.trainingApp;
  if (!app) return;

  // Remove results modal and its styles
  const modal = document.getElementById('results-modal');
  if (modal) modal.remove();
  const modalStyles = document.getElementById('results-modal-styles');
  if (modalStyles) modalStyles.remove();

  // Enable review mode
  app.reviewMode = true;
  app.sessionMode = 'review'; // Switch to review mode to show answers

  // Go to first question
  app.currentQuestionIndex = 0;
  loadQuestion(0);
  updateQuestionsList();

  // Update header to show review mode
  const badge = document.querySelector('.badge');
  if (badge) {
    badge.textContent = 'Revisión';
    badge.className = 'badge review';
  }

  // Update header buttons for review mode
  const headerStatsRow = document.querySelector('.header-stats-row');
  if (headerStatsRow) {
    const actionsDiv = headerStatsRow.querySelector('.action-buttons-inline');
    if (actionsDiv) {
      actionsDiv.innerHTML = `
        <button onclick="exitReviewMode()" class="btn btn-action-sm btn-exit" title="Terminar revisión">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          <span>Terminar Revisión</span>
        </button>
      `;
    }
  }
}

window.exitReviewMode = function() {
  const app = window.trainingApp;
  const productId = app?.product?.id;

  // Clean up
  const trainingContainer = document.getElementById('training-app-container');
  if (trainingContainer) trainingContainer.remove();

  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.height = '';

  const styleTag = document.getElementById('training-app-styles');
  if (styleTag) styleTag.remove();

  window.trainingApp = null;
  window.lastTrainingResults = null;

  // Redirect
  window.location.hash = productId ? `#/dashboard/${productId}` : '#/products';
}

window.showExitModal = function() {
  const modal = document.getElementById('exit-modal');
  const app = window.trainingApp;
  const isExam = app?.sessionMode === 'exam';

  if (modal) {
    const title = document.getElementById('exit-modal-title');
    const text = document.getElementById('exit-modal-text');
    const actions = document.getElementById('exit-modal-actions');

    if (isExam) {
      // Exam mode: offer to finish exam and see results
      if (title) title.textContent = '¿Finalizar el examen?';
      if (text) text.textContent = 'Si finalizas ahora, se calcularán tus resultados con las preguntas que hayas respondido. Las preguntas sin responder se contarán como incorrectas.';
      if (actions) {
        actions.innerHTML = `
          <button onclick="closeExitModal()" class="btn btn-secondary">Seguir con el examen</button>
          <button onclick="finishExamFromModal()" class="btn btn-primary">Finalizar y ver resultados</button>
        `;
      }
    } else {
      // Practice mode: normal exit
      if (title) title.textContent = '¿Salir del entrenamiento?';
      if (text) text.textContent = 'Tu progreso se guardará automáticamente. Puedes continuar más tarde desde donde lo dejaste.';
      if (actions) {
        actions.innerHTML = `
          <button onclick="closeExitModal()" class="btn btn-secondary">Continuar</button>
          <button onclick="confirmExit()" class="btn btn-primary">Salir</button>
        `;
      }
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
};

window.finishExamFromModal = function() {
  // Close the exit modal
  const modal = document.getElementById('exit-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  // Call finishTraining to show results
  finishTraining();
};

window.closeExitModal = function(event) {
  if (!event || event.target.id === 'exit-modal') {
    const modal = document.getElementById('exit-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }
};

window.confirmExit = async function() {
  const app = window.trainingApp;

  if (app.timerInterval) {
    clearInterval(app.timerInterval);
  }

  // Guardar progreso antes de salir
  const hasProgress = app.userAnswers.filter(a => a !== undefined).length > 0;
  if (hasProgress) {
    await saveSessionToFirestore();
  }

  // Limpiar el contenedor de training y restaurar body overflow
  const trainingContainer = document.getElementById('training-app-container');
  if (trainingContainer) {
    trainingContainer.remove();
  }

  // Restaurar estilos del body
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.height = '';

  // Eliminar estilos inyectados
  const styleTag = document.getElementById('training-app-styles');
  if (styleTag) {
    styleTag.remove();
  }

  // Limpiar el estado de la app
  window.trainingApp = null;

  // Redirigir al dashboard del producto
  window.location.hash = `#/dashboard/${app.product.id}`;
};
