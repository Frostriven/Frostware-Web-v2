import { auth, db } from '../../js/firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  createSession,
  completeSession,
  getUserStatistics,
  formatTime
} from '../../js/sessionManager.js';

export async function renderTrainingView(productId) {
  console.log('🎯 renderTrainingView llamado con productId:', productId);
  const root = document.getElementById('spa-root');
  if (!root) {
    console.error('❌ No se encontró spa-root');
    return;
  }

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

  const questions = await loadQuestions(productId);
  if (!questions || questions.length === 0) {
    root.innerHTML = renderError('No hay preguntas disponibles');
    return;
  }

  const params = getURLParams();
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

    return {
      ...q,
      options: shuffledOptions.map(item => item.option),
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

    // Process questions: randomize options
    const processedQuestions = processQuestions(rawQuestions);

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

  return {
    mode: urlParams.get('mode') || 'practice',
    duration: parseInt(urlParams.get('duration')) || 3600,
    sessionId: urlParams.get('sessionId') || null
  };
}

function injectStyles() {
  if (document.getElementById('training-app-styles')) return;

  const styleTag = document.createElement('style');
  styleTag.id = 'training-app-styles';
  styleTag.textContent = `
    #training-app-container {
      position: fixed;
      inset: 0;
      min-height: 100vh;
      background-color: var(--color-bg-primary, #ffffff);
      color: var(--color-text-primary, #111827);
      z-index: 9999;
      overflow: hidden;
    }

    html.dark #training-app-container {
      background-color: #0a0e1a;
      color: #e4e8ef;
    }

    .training-layout {
      display: flex;
      min-height: 100vh;
    }

    /* Sidebar Izquierdo */
    .questions-sidebar {
      width: 300px;
      background: var(--color-bg-secondary, #f9fafb);
      border-right: 1px solid var(--color-border-primary, #e5e7eb);
      overflow-y: auto;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 30;
      transform: translateX(0);
      transition: transform 0.3s ease;
    }

    .questions-sidebar.closed {
      transform: translateX(-300px);
    }

    html.dark .questions-sidebar {
      background: #12172b;
      border-right-color: #1e293b;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--color-border-primary, #e5e7eb);
      position: sticky;
      top: 0;
      background: inherit;
      z-index: 10;
    }

    html.dark .sidebar-header {
      border-bottom-color: #1e293b;
    }

    /* PIE Chart */
    .pie-chart-container {
      width: 160px;
      height: 160px;
      margin: 1rem auto;
      position: relative;
    }

    .pie-chart {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .pie-chart-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .pie-chart-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #22a7d0;
      line-height: 1;
    }

    html.dark .pie-chart-value {
      color: #22a7d0;
    }

    .pie-chart-label {
      font-size: 0.75rem;
      color: var(--color-text-secondary, #6b7280);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
      margin-top: 0.25rem;
    }

    html.dark .pie-chart-label {
      color: #9ca3af;
    }

    .pie-segment {
      transition: stroke-dasharray 0.5s ease;
    }

    .stats-compact {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .stat-compact {
      text-align: center;
      padding: 0.5rem;
      background: var(--color-bg-primary, #ffffff);
      border: 1px solid var(--color-border-primary, #e5e7eb);
      border-radius: 8px;
    }

    html.dark .stat-compact {
      background: #1a2038;
      border-color: #2d3a52;
    }

    .stat-compact-value {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .stat-compact-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--color-text-secondary, #6b7280);
      letter-spacing: 0.03em;
    }

    html.dark .stat-compact-label {
      color: #9ca3af;
    }

    html.dark .stat-compact-value {
      color: #e4e8ef;
    }

    .question-item {
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid var(--color-border-primary, #e5e7eb);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    html.dark .question-item {
      border-bottom-color: #1e293b;
    }

    .question-item:hover {
      background: rgba(34, 167, 208, 0.05);
    }

    .question-item.active {
      background: rgba(34, 167, 208, 0.1);
      border-left: 3px solid #22a7d0;
    }

    .question-item.bookmarked::before {
      content: '★';
      color: #f59e0b;
      font-size: 1rem;
    }

    .question-number {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--color-bg-primary, #ffffff);
      border: 2px solid var(--color-border-primary, #e5e7eb);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    html.dark .question-number {
      background: #1a2038;
      border-color: #2d3a52;
    }

    .question-item.active .question-number {
      background: #22a7d0;
      border-color: #22a7d0;
      color: white;
    }

    /* Colores según estado de respuesta */
    .question-item.answered-correct .question-number {
      background: #10b981;
      border-color: #10b981;
      color: white;
    }

    .question-item.answered-incorrect .question-number {
      background: #ef4444;
      border-color: #ef4444;
      color: white;
    }

    .question-item.answered-neutral .question-number {
      background: #6b7280;
      border-color: #6b7280;
      color: white;
    }

    /* Main Content */
    .training-main {
      margin-left: 300px;
      flex: 1;
      display: flex;
      flex-direction: column;
      transition: margin-left 0.3s ease;
      height: 100vh;
      overflow-y: auto;
    }

    .training-main.sidebar-closed {
      margin-left: 0;
    }

    .training-header {
      background: var(--color-bg-secondary, #f9fafb);
      border-bottom: 1px solid var(--color-border-primary, #e5e7eb);
      padding: 1.5rem 2rem;
      position: sticky;
      top: 0;
      z-index: 20;
    }

    html.dark .training-header {
      background: #12172b;
      border-bottom-color: #1e293b;
    }

    .header-stats {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .header-stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--color-text-secondary, #6b7280);
    }

    html.dark .header-stat {
      color: #9ca3af;
    }

    .header-stat-value {
      font-weight: 700;
      color: var(--color-text-primary, #111827);
    }

    html.dark .header-stat-value {
      color: #e4e8ef;
    }

    .header-stat.correct .header-stat-value {
      color: #10b981;
    }

    .header-stat.incorrect .header-stat-value {
      color: #ef4444;
    }

    .header-stat.bookmarked .header-stat-value {
      color: #f59e0b;
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    /* Exit Modal */
    .exit-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .exit-modal-content {
      background: var(--color-bg-primary, #ffffff);
      border-radius: 12px;
      max-width: 400px;
      width: 100%;
      padding: 2rem;
    }

    html.dark .exit-modal-content {
      background: #12172b;
      border: 1px solid #1e293b;
    }

    .exit-modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: var(--color-text-primary, #111827);
    }

    html.dark .exit-modal-title {
      color: #e4e8ef;
    }

    .exit-modal-text {
      color: var(--color-text-secondary, #6b7280);
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    html.dark .exit-modal-text {
      color: #9ca3af;
    }

    .exit-modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .training-content {
      flex: 1;
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    }

    /* Question Card */
    .question-card {
      background: var(--color-bg-secondary, #f9fafb);
      border: 1px solid var(--color-border-primary, #e5e7eb);
      border-radius: 12px;
      padding: 2rem;
    }

    html.dark .question-card {
      background: #12172b;
      border-color: #1e293b;
    }

    .question-title {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.4;
      margin-bottom: 2rem;
      color: var(--color-text-primary, #111827);
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
      background: var(--color-bg-primary, #ffffff);
      border: 2px solid var(--color-border-primary, #e5e7eb);
      border-radius: 10px;
      padding: 1rem 1.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    html.dark .answer-option {
      background: #1a2038;
      border-color: #2d3a52;
    }

    .answer-option:hover {
      border-color: #22a7d0;
      transform: translateX(4px);
    }

    .answer-option.selected {
      border-color: #22a7d0;
      background: rgba(34, 167, 208, 0.05);
    }

    html.dark .answer-option.selected {
      background: rgba(34, 167, 208, 0.1);
    }

    .exam-mode .answer-option.selected {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }

    html.dark .exam-mode .answer-option.selected {
      background: rgba(59, 130, 246, 0.1);
    }

    .answer-option.correct {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.05);
    }

    html.dark .answer-option.correct {
      background: rgba(16, 185, 129, 0.1);
    }

    .answer-option.incorrect {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.05);
    }

    html.dark .answer-option.incorrect {
      background: rgba(239, 68, 68, 0.1);
    }

    .option-letter {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: var(--color-bg-secondary, #f9fafb);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.125rem;
      flex-shrink: 0;
    }

    html.dark .option-letter {
      background: #0a0e1a;
    }

    .answer-option.selected .option-letter {
      background: #22a7d0;
      color: white;
    }

    .answer-option.correct .option-letter {
      background: #10b981;
      color: white;
    }

    .answer-option.incorrect .option-letter {
      background: #ef4444;
      color: white;
    }

    /* Explanation Box */
    .explanation-box {
      margin-top: 1.5rem;
      padding: 1.25rem;
      border-radius: 10px;
      border-left: 4px solid;
    }

    .explanation-box.correct {
      background: rgba(16, 185, 129, 0.05);
      border-color: #10b981;
    }

    html.dark .explanation-box.correct {
      background: rgba(16, 185, 129, 0.1);
    }

    .explanation-box.incorrect {
      background: rgba(239, 68, 68, 0.05);
      border-color: #ef4444;
    }

    html.dark .explanation-box.incorrect {
      background: rgba(239, 68, 68, 0.1);
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      text-align: center;
      padding: 1rem;
      background: var(--color-bg-primary, #ffffff);
      border: 1px solid var(--color-border-primary, #e5e7eb);
      border-radius: 10px;
    }

    html.dark .stat-card {
      background: #1a2038;
      border-color: #2d3a52;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #22a7d0;
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--color-text-secondary, #6b7280);
      letter-spacing: 0.05em;
    }

    /* Progress Bar */
    .progress-bar {
      height: 8px;
      background: var(--color-bg-primary, #ffffff);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 1rem;
    }

    html.dark .progress-bar {
      background: #1a2038;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22a7d0, #1e96bc);
      transition: width 0.3s ease;
    }

    /* Buttons */
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9375rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #22a7d0, #1e96bc);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(34, 167, 208, 0.3);
    }

    .btn-secondary {
      background: var(--color-bg-secondary, #f9fafb);
      color: var(--color-text-primary, #111827);
      border: 1px solid var(--color-border-primary, #e5e7eb);
    }

    html.dark .btn-secondary {
      background: #1a2038;
      border-color: #2d3a52;
      color: #e4e8ef;
    }

    .btn-secondary:hover {
      border-color: #22a7d0;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .btn-icon {
      width: 40px;
      height: 40px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Timer */
    .timer-display {
      font-size: 1.5rem;
      font-weight: 700;
      color: #22a7d0;
      font-variant-numeric: tabular-nums;
    }

    .timer-display.warning {
      color: #f59e0b;
    }

    .timer-display.critical {
      color: #ef4444;
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    /* Badge */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge.practice {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .badge.exam {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    /* Bookmark Button */
    .bookmark-btn {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: transparent;
      border: 2px solid var(--color-border-primary, #e5e7eb);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    html.dark .bookmark-btn {
      border-color: #2d3a52;
    }

    .bookmark-btn:hover {
      border-color: #f59e0b;
    }

    .bookmark-btn.bookmarked {
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
    }

    /* Image Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .modal-content {
      background: var(--color-bg-primary, #ffffff);
      border-radius: 12px;
      max-width: 900px;
      max-height: 90vh;
      overflow: auto;
      position: relative;
    }

    html.dark .modal-content {
      background: #12172b;
    }

    .modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(239, 68, 68, 0.1);
      border: 2px solid #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
    }

    .modal-close:hover {
      background: #ef4444;
    }

    /* Save Indicator */
    .save-indicator {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #10b981;
      color: white;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transform: translateY(100px);
      transition: transform 0.3s ease;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .save-indicator.show {
      transform: translateY(0);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .questions-sidebar {
        width: 100%;
        transform: translateX(-100%);
      }

      .questions-sidebar.open {
        transform: translateX(0);
      }

      .training-main.sidebar-open {
        margin-left: 0;
      }

      .training-content {
        padding: 1rem;
      }

      .question-card {
        padding: 1.5rem;
      }
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
        <!-- Sidebar Izquierdo -->
        <aside class="questions-sidebar" id="questions-sidebar">
          <div class="sidebar-header">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
              <h3 style="font-weight: 700; font-size: 1.125rem;">Preguntas</h3>
              <button onclick="toggleSidebar()" class="btn-secondary btn-icon">
                <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- PIE Chart -->
            <div class="pie-chart-container">
              <svg class="pie-chart" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="var(--color-bg-primary, #ffffff)" stroke="var(--color-border-primary, #e5e7eb)" stroke-width="2"/>
                ${!isExamMode ? `
                  <circle id="pie-correct" class="pie-segment" cx="50" cy="50" r="35" fill="none" stroke="#10b981" stroke-width="12" stroke-dasharray="0 220" />
                  <circle id="pie-incorrect" class="pie-segment" cx="50" cy="50" r="35" fill="none" stroke="#ef4444" stroke-width="12" stroke-dasharray="0 220" />
                  <circle id="pie-unanswered" class="pie-segment" cx="50" cy="50" r="35" fill="none" stroke="#e5e7eb" stroke-width="12" stroke-dasharray="0 220" />
                ` : `
                  <circle id="pie-answered-exam" class="pie-segment" cx="50" cy="50" r="35" fill="none" stroke="#22a7d0" stroke-width="12" stroke-dasharray="0 220" />
                  <circle id="pie-unanswered-exam" class="pie-segment" cx="50" cy="50" r="35" fill="none" stroke="#e5e7eb" stroke-width="12" stroke-dasharray="0 220" />
                `}
              </svg>
              <div class="pie-chart-center">
                <div class="pie-chart-value" id="pie-percentage">0</div>
                <div class="pie-chart-label">Progreso</div>
              </div>
            </div>
          </div>

          <div id="questions-list">
            ${questions.map((q, i) => {
              // Get localized text for sidebar display
              const localizedTopic = typeof q.topic === 'string' ? q.topic : (q.topic?.es || q.topic?.en || '');
              const localizedQuestion = typeof q.question === 'string' ? q.question : (q.question?.es || q.question?.en || '');

              return `
                <div class="question-item ${i === 0 ? 'active' : ''}" onclick="jumpToQuestion(${i})" data-index="${i}">
                  <div class="question-number">${i + 1}</div>
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.75rem; color: var(--color-text-secondary, #6b7280); margin-bottom: 0.25rem;">${localizedTopic}</div>
                    <div style="font-size: 0.875rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${localizedQuestion}</div>
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
            <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <button onclick="toggleSidebar()" class="btn-secondary btn-icon" title="Mostrar/Ocultar menú">
                  <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" stroke-linecap="round" viewBox="0 0 24 24">
                    <line x1="3" y1="6" x2="21" y2="6" stroke-width="2.5"/>
                    <line x1="3" y1="12" x2="21" y2="12" stroke-width="2.5"/>
                    <line x1="3" y1="18" x2="21" y2="18" stroke-width="2.5"/>
                  </svg>
                </button>
                <div>
                  <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">${productName}</h1>
                  <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                    <span class="badge ${mode}">
                      ${isExamMode ? 'Modo Examen' : 'Modo Práctica'}
                    </span>
                    <span style="font-size: 0.875rem; color: var(--color-text-secondary, #6b7280);">
                      ${questions.length} Preguntas
                    </span>
                    ${isExamMode ? `
                      <span style="font-size: 0.875rem; color: var(--color-text-secondary, #6b7280); display: flex; align-items: center; gap: 0.5rem;">
                        <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span id="timer-display-compact">60:00</span>
                      </span>
                    ` : ''}
                  </div>
                  <div class="action-buttons">
                    <button onclick="saveSession()" class="btn btn-secondary">
                      <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                      </svg>
                      Guardar Progreso
                    </button>
                    <button onclick="showExitModal()" class="btn btn-secondary">
                      <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                      Salir
                    </button>
                  </div>
                </div>
              </div>

              ${!isExamMode ? `
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                  <div>
                    <div style="font-size: 0.75rem; color: var(--color-text-secondary, #6b7280); margin-bottom: 0.25rem; text-transform: uppercase; font-weight: 600;">Puntuación</div>
                    <div class="timer-display" id="score-display">0%</div>
                  </div>
                </div>
              ` : ''}

              <!-- Estadísticas -->
              <div class="header-stats">
                <div class="header-stat">
                  <span>Contestadas:</span>
                  <span class="header-stat-value" id="header-stat-answered">0</span>
                </div>
                <div class="header-stat">
                  <span>Restantes:</span>
                  <span class="header-stat-value" id="header-stat-unanswered">${questions.length}</span>
                </div>
                ${!isExamMode ? `
                  <div class="header-stat correct">
                    <span>Correctas:</span>
                    <span class="header-stat-value" id="header-stat-correct">0</span>
                  </div>
                  <div class="header-stat incorrect">
                    <span>Incorrectas:</span>
                    <span class="header-stat-value" id="header-stat-incorrect">0</span>
                  </div>
                ` : ''}
                <div class="header-stat bookmarked">
                  <svg style="width: 1rem; height: 1rem; color: #f59e0b;" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                  </svg>
                  <span class="header-stat-value" id="header-stat-bookmarked">0</span>
                </div>
              </div>
            </div>

            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
            </div>

            <!-- Controls -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
              <button id="prev-btn" onclick="previousQuestion()" class="btn btn-secondary" disabled>
                <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Anterior
              </button>

              <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <button id="image-btn" onclick="openImageModal()" class="btn btn-secondary" style="display: none;">
                  <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Ver Imagen
                </button>
              </div>

              <div style="display: flex; gap: 1rem;">
                <button id="next-btn" onclick="nextQuestion()" class="btn btn-primary">
                  Siguiente
                  <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>

                <button id="finish-btn" onclick="finishTraining()" class="btn btn-primary" style="display: none;">
                  <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Finalizar
                </button>
              </div>
            </div>
          </header>

          <!-- Content -->
          <div class="training-content">
            <div id="question-container">
              <!-- Question loads here -->
            </div>
          </div>
        </div>
      </div>

      <!-- Save Indicator -->
      <div class="save-indicator" id="save-indicator">
        <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        Progreso guardado
      </div>

      <!-- Image Modal -->
      <div id="image-modal" class="modal-overlay" style="display: none;" onclick="closeImageModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()">
          <button class="modal-close" onclick="closeImageModal()">
            <svg style="width: 1.25rem; height: 1.25rem; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <img id="modal-image" src="" alt="Question Image" style="width: 100%; height: auto; border-radius: 12px;">
          <div style="padding: 1.5rem;">
            <p id="modal-caption" style="text-align: center; color: var(--color-text-secondary, #6b7280);"></p>
          </div>
        </div>
      </div>

      <!-- Exit Modal -->
      <div id="exit-modal" class="exit-modal-overlay" style="display: none;" onclick="closeExitModal(event)">
        <div class="exit-modal-content" onclick="event.stopPropagation()">
          <h3 class="exit-modal-title">¿Salir del entrenamiento?</h3>
          <p class="exit-modal-text">
            Tu progreso ha sido guardado automáticamente. Puedes regresar al dashboard del producto o continuar entrenando más tarde.
          </p>
          <div class="exit-modal-actions">
            <button onclick="closeExitModal()" class="btn btn-secondary">
              Continuar Entrenando
            </button>
            <button onclick="confirmExit()" class="btn btn-primary">
              <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initializeTrainingApp(product, questions, params) {
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
    timerInterval: null,
    sessionId: params.sessionId || null,
    currentLanguage: 'es' // Default language
  };

  createTrainingSession(product, params.mode);
  loadQuestion(0);

  if (params.mode === 'exam') {
    startExamTimer();
  }

  setInterval(() => {
    if (auth.currentUser) {
      saveSessionToFirestore();
    }
  }, 30000);
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

    // En modo práctica, mostrar colores si ya fue contestada
    if (isPracticeMode && userAnswer !== undefined) {
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

    return `
      <div class="${className}" onclick="selectAnswer(${i})">
        <div class="option-letter">${String.fromCharCode(65 + i)}</div>
        <span style="flex: 1;">${localizedOption}</span>
        ${isPracticeMode && userAnswer !== undefined && i === question.correctAnswer ? `
          <svg style="width: 1.5rem; height: 1.5rem; color: #10b981; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        ` : ''}
        ${isPracticeMode && userAnswer !== undefined && i === userAnswer && i !== question.correctAnswer ? `
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

      ${isPracticeMode && userAnswer !== undefined ? `
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

window.selectAnswer = function(optionIndex) {
  window.trainingApp.userAnswers[window.trainingApp.currentQuestionIndex] = optionIndex;
  loadQuestion(window.trainingApp.currentQuestionIndex);
};

window.toggleBookmark = function(index) {
  if (window.trainingApp.bookmarkedQuestions.has(index)) {
    window.trainingApp.bookmarkedQuestions.delete(index);
  } else {
    window.trainingApp.bookmarkedQuestions.add(index);
  }
  loadQuestion(window.trainingApp.currentQuestionIndex);
  updateQuestionsList();
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
};

function updateQuestionsList() {
  const app = window.trainingApp;
  const items = document.querySelectorAll('.question-item');
  const isPracticeMode = app.sessionMode === 'practice';

  items.forEach((item, i) => {
    const userAnswer = app.userAnswers[i];
    const isAnswered = userAnswer !== undefined;
    const isBookmarked = app.bookmarkedQuestions.has(i);
    const isCurrent = i === app.currentQuestionIndex;

    item.className = 'question-item';
    if (isCurrent) item.classList.add('active');
    if (isBookmarked) item.classList.add('bookmarked');

    // Colores según resultado
    if (isAnswered) {
      if (isPracticeMode) {
        // En modo práctica: mostrar verde (correcto) o rojo (incorrecto)
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
  }
};

window.previousQuestion = function() {
  const app = window.trainingApp;
  if (app.currentQuestionIndex > 0) {
    app.currentQuestionIndex--;
    loadQuestion(app.currentQuestionIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

function updateProgress() {
  const app = window.trainingApp;
  const answeredCount = app.userAnswers.filter(a => a !== undefined).length;
  const unansweredCount = app.questions.length - answeredCount;
  const progress = (answeredCount / app.questions.length) * 100;
  const bookmarkedCount = app.bookmarkedQuestions.size;

  const progressFill = document.getElementById('progress-fill');
  if (progressFill) progressFill.style.width = `${progress}%`;

  // Actualizar estadísticas del header
  const headerStatAnswered = document.getElementById('header-stat-answered');
  const headerStatUnanswered = document.getElementById('header-stat-unanswered');
  const headerStatBookmarked = document.getElementById('header-stat-bookmarked');

  if (headerStatAnswered) headerStatAnswered.textContent = answeredCount;
  if (headerStatUnanswered) headerStatUnanswered.textContent = unansweredCount;
  if (headerStatBookmarked) headerStatBookmarked.textContent = bookmarkedCount;

  // Animar porcentaje del PIE chart
  const piePercentage = document.getElementById('pie-percentage');
  if (piePercentage) {
    const currentPercentage = parseInt(piePercentage.textContent) || 0;
    const targetPercentage = Math.round(progress);
    animatePercentage(piePercentage, currentPercentage, targetPercentage, 500);
  }

  if (app.sessionMode === 'practice') {
    const correctCount = app.userAnswers.filter((answer, index) =>
      answer === app.questions[index].correctAnswer
    ).length;
    const incorrectCount = answeredCount - correctCount;
    // Puntuación: correctas / total de preguntas (incluyendo no contestadas)
    const totalQuestions = app.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const headerStatCorrect = document.getElementById('header-stat-correct');
    const headerStatIncorrect = document.getElementById('header-stat-incorrect');
    const scoreDisplay = document.getElementById('score-display');

    if (headerStatCorrect) headerStatCorrect.textContent = correctCount;
    if (headerStatIncorrect) headerStatIncorrect.textContent = incorrectCount;
    if (scoreDisplay) scoreDisplay.textContent = `${score}%`;

    // Actualizar PIE chart para modo práctica
    updatePieChart(correctCount, incorrectCount, unansweredCount);
  } else {
    // Actualizar PIE chart para modo examen (solo contestadas vs sin contestar)
    updatePieChartExam(answeredCount, unansweredCount);
  }
}

function animatePercentage(element, start, end, duration) {
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Usar easing para suavizar la animación
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (end - start) * easeOutCubic);

    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = end;
    }
  }

  requestAnimationFrame(update);
}

function updatePieChart(correct, incorrect, unanswered) {
  const total = correct + incorrect + unanswered;
  const circumference = 2 * Math.PI * 35; // r=35

  const correctPercent = correct / total;
  const incorrectPercent = incorrect / total;
  const unansweredPercent = unanswered / total;

  const correctDash = circumference * correctPercent;
  const incorrectDash = circumference * incorrectPercent;
  const unansweredDash = circumference * unansweredPercent;

  const pieCorrect = document.getElementById('pie-correct');
  const pieIncorrect = document.getElementById('pie-incorrect');
  const pieUnanswered = document.getElementById('pie-unanswered');

  if (pieCorrect) {
    pieCorrect.setAttribute('stroke-dasharray', `${correctDash} ${circumference}`);
    pieCorrect.setAttribute('stroke-dashoffset', '0');
  }

  if (pieIncorrect) {
    pieIncorrect.setAttribute('stroke-dasharray', `${incorrectDash} ${circumference}`);
    pieIncorrect.setAttribute('stroke-dashoffset', `-${correctDash}`);
  }

  if (pieUnanswered) {
    pieUnanswered.setAttribute('stroke-dasharray', `${unansweredDash} ${circumference}`);
    pieUnanswered.setAttribute('stroke-dashoffset', `-${correctDash + incorrectDash}`);
  }
}

function updatePieChartExam(answered, unanswered) {
  const total = answered + unanswered;
  const circumference = 2 * Math.PI * 35; // r=35

  const answeredPercent = answered / total;
  const unansweredPercent = unanswered / total;

  const answeredDash = circumference * answeredPercent;
  const unansweredDash = circumference * unansweredPercent;

  const pieAnswered = document.getElementById('pie-answered-exam');
  const pieUnanswered = document.getElementById('pie-unanswered-exam');

  if (pieAnswered) {
    pieAnswered.setAttribute('stroke-dasharray', `${answeredDash} ${circumference}`);
    pieAnswered.setAttribute('stroke-dashoffset', '0');
  }

  if (pieUnanswered) {
    pieUnanswered.setAttribute('stroke-dasharray', `${unansweredDash} ${circumference}`);
    pieUnanswered.setAttribute('stroke-dashoffset', `-${answeredDash}`);
  }
}

function updateNavigationButtons() {
  const app = window.trainingApp;
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const finishBtn = document.getElementById('finish-btn');

  if (prevBtn) prevBtn.disabled = app.currentQuestionIndex === 0;

  const allAnswered = app.userAnswers.filter(a => a !== undefined).length === app.questions.length;

  if (allAnswered) {
    if (nextBtn) nextBtn.style.display = 'none';
    if (finishBtn) finishBtn.style.display = 'inline-flex';
  } else {
    if (nextBtn) nextBtn.style.display = 'inline-flex';
    if (finishBtn) finishBtn.style.display = 'none';
  }
}

window.openImageModal = function() {
  if (!window.currentQuestionImage) return;

  const modal = document.getElementById('image-modal');
  const modalImage = document.getElementById('modal-image');
  const modalCaption = document.getElementById('modal-caption');

  if (modal && modalImage && modalCaption) {
    modalImage.src = window.currentQuestionImage;
    modalCaption.textContent = window.currentQuestionCaption;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
};

window.closeImageModal = function(event) {
  if (!event || event.target.id === 'image-modal') {
    const modal = document.getElementById('image-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }
};

window.saveSession = async function() {
  await saveSessionToFirestore();
};

async function saveSessionToFirestore() {
  if (!auth.currentUser || !window.trainingApp) return;

  try {
    const app = window.trainingApp;
    const sessionData = {
      productId: app.product.id,
      mode: app.sessionMode,
      currentQuestionIndex: app.currentQuestionIndex,
      userAnswers: app.userAnswers,
      bookmarkedQuestions: Array.from(app.bookmarkedQuestions),
      timeRemaining: app.sessionMode === 'exam' ? app.examTimeRemaining : null,
      totalQuestions: app.questions.length,
      lastUpdated: serverTimestamp(),
      completed: false
    };

    const sessionRef = doc(db, 'users', auth.currentUser.uid, 'sessions', app.sessionId || `session_${Date.now()}`);

    if (!app.sessionId) {
      app.sessionId = `session_${Date.now()}`;
    }

    await setDoc(sessionRef, sessionData, { merge: true });
    showSaveIndicator();
    console.log('✅ Sesión guardada');
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

  if (app.timerInterval) {
    clearInterval(app.timerInterval);
  }

  const timeSpent = Math.floor((Date.now() - app.sessionStartTime) / 1000);
  const correctCount = app.userAnswers.filter((answer, index) =>
    answer === app.questions[index].correctAnswer
  ).length;

  const results = {
    productId: app.product.id,
    mode: app.sessionMode,
    totalQuestions: app.questions.length,
    correctAnswers: correctCount,
    incorrectAnswers: app.questions.length - correctCount,
    score: Math.round((correctCount / app.questions.length) * 100),
    timeSpent: timeSpent,
    completed: true,
    completedAt: serverTimestamp(),
    answers: app.questions.map((q, i) => ({
      questionId: q.id,
      topic: q.topic,
      userAnswer: app.userAnswers[i],
      correctAnswer: q.correctAnswer,
      isCorrect: app.userAnswers[i] === q.correctAnswer
    }))
  };

  try {
    if (app.sessionId) {
      await completeSession(app.sessionId, results);
      console.log('✅ Sesión completada');
    }

    const message = app.sessionMode === 'exam'
      ? `¡EXAMEN COMPLETADO!\n\nTiempo: ${formatTime(timeSpent)}\nRespuestas correctas: ${correctCount}/${app.questions.length}\nPuntuación: ${results.score}%`
      : `¡SESIÓN COMPLETADA!\n\nTiempo: ${formatTime(timeSpent)}\nCorrectas: ${correctCount}/${app.questions.length}\nIncorrectas: ${results.incorrectAnswers}\nPuntuación: ${results.score}%`;

    alert(message);
    window.location.hash = `#/dashboard/${app.product.id}`;
  } catch (error) {
    console.error('Error completando sesión:', error);
    alert('Error al guardar los resultados');
  }
};

window.showExitModal = function() {
  const modal = document.getElementById('exit-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
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

  // Redirigir al dashboard del producto
  window.location.hash = `#/dashboard/${app.product.id}`;
};
