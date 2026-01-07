import { auth, db } from '../../js/firebase.js';
import { doc, getDoc } from 'firebase/firestore';
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

  // Verificar autenticación
  if (!auth?.currentUser) {
    console.log('❌ Usuario no autenticado, redirigiendo a login');
    window.location.hash = '#/auth/login';
    return;
  }
  console.log('✅ Usuario autenticado:', auth.currentUser.email);

  // Verificar acceso al producto
  const hasAccess = await verifyProductAccess(auth.currentUser.uid, productId);
  if (!hasAccess) {
    root.innerHTML = renderAccessDenied();
    return;
  }

  // Cargar producto
  const product = await loadProduct(productId);
  if (!product) {
    root.innerHTML = renderError('Producto no encontrado');
    return;
  }

  // Cargar preguntas
  const questions = await loadQuestions(productId);
  if (!questions || questions.length === 0) {
    root.innerHTML = renderError('No hay preguntas disponibles');
    return;
  }

  // Renderizar aplicación
  root.innerHTML = renderTrainingApp(product, questions);

  // Inicializar la aplicación
  initializeTrainingApp(product, questions);
}

async function verifyProductAccess(userId, productId) {
  try {
    // Verificar si el usuario es admin
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Si es admin, tiene acceso a todos los productos
      if (userData.role === 'admin') {
        console.log('✅ Usuario es admin, acceso concedido');
        return true;
      }
    }

    // Si es demo@frostware.com también tiene acceso
    if (auth.currentUser?.email === 'demo@frostware.com') {
      console.log('✅ Usuario demo, acceso concedido');
      return true;
    }

    // Verificar si el usuario tiene el producto comprado
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

async function loadQuestions(productId) {
  // TODO: Implementar carga de preguntas desde Firebase
  // Por ahora retorna preguntas de ejemplo
  return [
    {
      id: 'q1',
      topic: 'Communications',
      question: '¿Cuál es la frecuencia principal de HF para comunicaciones NAT?',
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

function renderAccessDenied() {
  return `
    <div class="flex flex-col items-center justify-center min-h-screen px-4" style="background-color: var(--color-bg-primary);">
      <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div class="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Acceso Denegado</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          No tienes acceso a este producto. Por favor, adquiérelo primero.
        </p>
        <button onclick="window.location.hash='#/products'" class="w-full px-6 py-3 bg-[#22a7d0] text-white rounded-lg font-semibold hover:bg-[#1e96bc] transition">
          Ver Productos
        </button>
      </div>
    </div>
  `;
}

function renderError(message) {
  return `
    <div class="flex flex-col items-center justify-center min-h-screen px-4" style="background-color: var(--color-bg-primary);">
      <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div class="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-6">${message}</p>
        <button onclick="window.location.hash='#/products'" class="w-full px-6 py-3 bg-[#22a7d0] text-white rounded-lg font-semibold hover:bg-[#1e96bc] transition">
          Volver a Productos
        </button>
      </div>
    </div>
  `;
}

function renderTrainingApp(product, questions) {
  const productName = typeof product.name === 'object' ? product.name.es || product.name.en : product.name;

  return `
    <div style="background-color: var(--color-bg-primary); min-height: 100vh;">
      <!-- Header -->
      <header class="bg-gradient-to-r from-[#22a7d0] to-[#1e96bc] text-white shadow-lg sticky top-0 z-50">
        <div class="container mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <button onclick="exitTraining()" class="hover:bg-white/20 p-2 rounded-lg transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
              </button>
              <div>
                <h1 class="text-xl font-bold">${productName}</h1>
                <p class="text-sm text-white/80">Modo Práctica • ${questions.length} Preguntas</p>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <div class="text-right">
                <div class="text-sm text-white/80">Progreso</div>
                <div class="text-xl font-bold" id="progress-text">0 / ${questions.length}</div>
              </div>
              <div class="text-right">
                <div class="text-sm text-white/80">Puntuación</div>
                <div class="text-xl font-bold" id="score-text">0%</div>
              </div>
            </div>
          </div>
          <!-- Progress Bar -->
          <div class="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div class="h-full bg-white transition-all duration-300" id="progress-fill" style="width: 0%"></div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="container mx-auto px-6 py-8">
        <div class="max-w-4xl mx-auto" id="question-container">
          <!-- Las preguntas se cargarán aquí -->
        </div>

        <!-- Navigation Buttons -->
        <div class="max-w-4xl mx-auto mt-8 flex justify-between">
          <button id="prev-btn" onclick="previousQuestion()"
                  class="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
            ← Anterior
          </button>
          <button id="next-btn" onclick="nextQuestion()"
                  class="px-6 py-3 bg-gradient-to-r from-[#22a7d0] to-[#1e96bc] text-white rounded-lg font-semibold hover:shadow-lg transition">
            Siguiente →
          </button>
          <button id="finish-btn" onclick="finishTraining()"
                  class="hidden px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition">
            Finalizar Sesión
          </button>
        </div>
      </main>
    </div>
  `;
}

function initializeTrainingApp(product, questions) {
  window.trainingApp = {
    product,
    questions,
    currentQuestionIndex: 0,
    userAnswers: new Array(questions.length).fill(undefined),
    sessionStartTime: Date.now(),
    sessionId: null
  };

  // Crear sesión
  createTrainingSession(product);

  // Cargar primera pregunta
  loadQuestion(0);
}

async function createTrainingSession(product) {
  try {
    const sessionData = {
      productId: product.id,
      productName: typeof product.name === 'object' ? product.name.es || product.name.en : product.name,
      mode: 'practice',
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

function loadQuestion(index) {
  const app = window.trainingApp;
  const question = app.questions[index];
  const userAnswer = app.userAnswers[index];

  const container = document.getElementById('question-container');
  if (!container) return;

  container.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-all duration-300">
      <div class="flex items-center justify-between mb-6">
        <span class="text-sm font-semibold text-[#22a7d0] px-3 py-1 bg-[#22a7d0]/10 rounded-full">${question.topic}</span>
        <span class="text-sm text-gray-600 dark:text-gray-400">Pregunta ${index + 1} de ${app.questions.length}</span>
      </div>

      <h2 class="text-2xl font-bold mb-8 text-gray-900 dark:text-white">${question.question}</h2>

      <div class="space-y-3">
        ${question.options.map((option, i) => {
          let className = 'answer-option border-2 rounded-xl p-4 cursor-pointer transition-all duration-200';
          let borderColor = 'border-gray-200 dark:border-gray-700 hover:border-[#22a7d0]';
          let bgColor = 'bg-gray-50 dark:bg-gray-900';

          if (userAnswer !== undefined) {
            if (i === question.correctAnswer) {
              borderColor = 'border-green-500';
              bgColor = 'bg-green-50 dark:bg-green-900/20';
            } else if (i === userAnswer && i !== question.correctAnswer) {
              borderColor = 'border-red-500';
              bgColor = 'bg-red-50 dark:bg-red-900/20';
            }
          }

          return `
            <div class="${className} ${borderColor} ${bgColor}"
                 onclick="${userAnswer === undefined ? `selectAnswer(${i})` : ''}"
                 style="${userAnswer !== undefined ? 'cursor: default;' : ''}">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[#22a7d0] bg-[#22a7d0]/10">
                  ${String.fromCharCode(65 + i)}
                </div>
                <span class="flex-1 text-gray-900 dark:text-white">${option}</span>
                ${userAnswer !== undefined && i === question.correctAnswer ? '<span class="text-green-500 text-xl">✓</span>' : ''}
                ${userAnswer !== undefined && i === userAnswer && i !== question.correctAnswer ? '<span class="text-red-500 text-xl">✗</span>' : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      ${userAnswer !== undefined ? `
        <div class="mt-6 p-4 rounded-lg ${userAnswer === question.correctAnswer ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'}">
          <p class="font-semibold mb-2 text-gray-900 dark:text-white">
            ${userAnswer === question.correctAnswer ? '✅ ¡Correcto!' : '❌ Incorrecto'}
          </p>
          <p class="text-gray-700 dark:text-gray-300">${question.explanation}</p>
        </div>
      ` : ''}
    </div>
  `;

  updateProgress();
  updateNavigationButtons();
}

window.selectAnswer = function(optionIndex) {
  const app = window.trainingApp;
  if (app.userAnswers[app.currentQuestionIndex] !== undefined) return;

  app.userAnswers[app.currentQuestionIndex] = optionIndex;
  loadQuestion(app.currentQuestionIndex);
};

window.nextQuestion = function() {
  const app = window.trainingApp;
  if (app.currentQuestionIndex < app.questions.length - 1) {
    app.currentQuestionIndex++;
    loadQuestion(app.currentQuestionIndex);
  }
};

window.previousQuestion = function() {
  const app = window.trainingApp;
  if (app.currentQuestionIndex > 0) {
    app.currentQuestionIndex--;
    loadQuestion(app.currentQuestionIndex);
  }
};

function updateProgress() {
  const app = window.trainingApp;
  const answeredCount = app.userAnswers.filter(a => a !== undefined).length;
  const progress = (answeredCount / app.questions.length) * 100;

  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const scoreText = document.getElementById('score-text');

  if (progressText) progressText.textContent = `${answeredCount} / ${app.questions.length}`;
  if (progressFill) progressFill.style.width = `${progress}%`;

  const correctCount = app.userAnswers.filter((answer, index) =>
    answer === app.questions[index].correctAnswer
  ).length;
  const score = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  if (scoreText) scoreText.textContent = `${score}%`;
}

function updateNavigationButtons() {
  const app = window.trainingApp;
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const finishBtn = document.getElementById('finish-btn');

  if (prevBtn) prevBtn.disabled = app.currentQuestionIndex === 0;

  const allAnswered = app.userAnswers.filter(a => a !== undefined).length === app.questions.length;

  if (allAnswered) {
    if (nextBtn) nextBtn.classList.add('hidden');
    if (finishBtn) finishBtn.classList.remove('hidden');
  } else {
    if (nextBtn) nextBtn.classList.remove('hidden');
    if (finishBtn) finishBtn.classList.add('hidden');
  }
}

window.finishTraining = async function() {
  const app = window.trainingApp;
  const timeSpent = Math.floor((Date.now() - app.sessionStartTime) / 1000);
  const correctCount = app.userAnswers.filter((answer, index) =>
    answer === app.questions[index].correctAnswer
  ).length;

  const results = {
    productId: app.product.id,
    totalQuestions: app.questions.length,
    correctAnswers: correctCount,
    incorrectAnswers: app.questions.length - correctCount,
    score: Math.round((correctCount / app.questions.length) * 100),
    timeSpent: timeSpent,
    answers: app.questions.map((q, i) => ({
      questionId: q.id,
      topic: q.topic,
      isCorrect: app.userAnswers[i] === q.correctAnswer,
      timeSpent: 0
    }))
  };

  try {
    if (app.sessionId) {
      await completeSession(app.sessionId, results);
      console.log('✅ Sesión completada y estadísticas actualizadas');
    }

    alert(`¡Sesión completada!\n\nPuntuación: ${results.score}%\nCorrectas: ${correctCount}/${app.questions.length}\nTiempo: ${formatTime(timeSpent)}`);
    // Redirigir al dashboard del producto para ver las estadísticas actualizadas
    window.location.hash = `#/dashboard/${app.product.id}`;
  } catch (error) {
    console.error('Error completando sesión:', error);
    alert('Error al guardar la sesión. Tu progreso no se guardó.');
  }
};

window.exitTraining = function() {
  if (confirm('¿Estás seguro de que quieres salir? Tu progreso no se guardará.')) {
    window.location.hash = '#/products';
  }
};
