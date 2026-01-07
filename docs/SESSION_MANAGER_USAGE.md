# Session Manager - Guía de Uso

Este documento explica cómo usar el `sessionManager.js` para guardar sesiones y estadísticas en Firebase.

## Estructura de Colecciones en Firebase

### 1. Colección `sessions`
Guarda cada sesión de entrenamiento completada por el usuario.

**Ruta:** `sessions/{sessionId}`

**Estructura:**
```javascript
{
  sessionId: "auto-generated-id",
  userId: "user-uid",
  productId: "product-id",
  productName: "North Atlantic Operations",
  mode: "practice" | "exam",
  selectedTopics: ["Communications", "Navigation"],
  questionCount: 50,
  correctAnswers: 42,
  incorrectAnswers: 8,
  score: 84,
  timeSpent: 3600, // segundos
  startedAt: Timestamp,
  completedAt: Timestamp,
  status: "completed",
  answers: [
    {
      questionId: "q1",
      topic: "Communications",
      isCorrect: true,
      timeSpent: 45
    }
  ]
}
```

### 2. Colección `user_statistics`
Guarda estadísticas agregadas por usuario.

**Ruta:** `user_statistics/{userId}`

**Estructura:**
```javascript
{
  userId: "user-uid",
  totalSessions: 12,
  totalQuestions: 600,
  correctAnswers: 522,
  incorrectAnswers: 78,
  averageScore: 87,
  totalTimeSpent: 43200, // segundos
  currentStreak: 5,
  longestStreak: 12,
  achievements: ["first_session", "perfect_score"],
  lastSessionDate: Timestamp,
  productStats: {
    "product-id-1": {
      sessions: 8,
      averageScore: 85,
      totalQuestions: 400,
      correctAnswers: 340,
      topicPerformance: {
        "Communications": {
          correct: 45,
          total: 50,
          percentage: 90
        }
      }
    }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Cómo Usar

### 1. Importar el módulo

```javascript
import {
  createSession,
  completeSession,
  getUserStatistics,
  getUserSessions,
  getProductStatistics,
  abandonSession,
  formatTime
} from './js/sessionManager.js';
```

### 2. Crear una sesión (cuando el usuario inicia entrenamiento)

```javascript
async function startTraining() {
  try {
    const sessionData = {
      productId: 'nat-ops-001',
      productName: 'North Atlantic Operations',
      mode: 'practice', // o 'exam'
      selectedTopics: ['Communications', 'Navigation', 'Weather'],
      questionCount: 50
    };

    const sessionId = await createSession(sessionData);
    console.log('Sesión iniciada:', sessionId);

    // Guardar sessionId en el estado de la aplicación
    window.currentSessionId = sessionId;

  } catch (error) {
    console.error('Error iniciando sesión:', error);
  }
}
```

### 3. Completar una sesión (cuando el usuario termina)

```javascript
async function finishTraining() {
  try {
    const results = {
      productId: 'nat-ops-001',
      totalQuestions: 50,
      correctAnswers: 42,
      incorrectAnswers: 8,
      score: 84,
      timeSpent: 3600, // segundos
      answers: [
        {
          questionId: 'q1',
          topic: 'Communications',
          isCorrect: true,
          timeSpent: 45
        },
        {
          questionId: 'q2',
          topic: 'Navigation',
          isCorrect: false,
          timeSpent: 60
        }
        // ... más respuestas
      ]
    };

    await completeSession(window.currentSessionId, results);
    console.log('✅ Sesión completada y estadísticas actualizadas');

    // Mostrar resultados al usuario
    showResultsScreen(results);

  } catch (error) {
    console.error('Error completando sesión:', error);
  }
}
```

### 4. Obtener estadísticas del usuario (para el dashboard)

```javascript
async function loadDashboardStats() {
  try {
    const stats = await getUserStatistics();

    // Mostrar en el dashboard
    document.getElementById('total-sessions').textContent = stats.totalSessions;
    document.getElementById('average-score').textContent = `${stats.averageScore}%`;
    document.getElementById('current-streak').textContent = stats.currentStreak;
    document.getElementById('total-time').textContent = formatTime(stats.totalTimeSpent);

    console.log('Estadísticas cargadas:', stats);

  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
}
```

### 5. Obtener historial de sesiones

```javascript
async function loadSessionHistory() {
  try {
    const sessions = await getUserSessions(10); // últimas 10 sesiones

    sessions.forEach(session => {
      console.log(`
        Producto: ${session.productName}
        Modo: ${session.mode}
        Score: ${session.score}%
        Fecha: ${session.completedAt.toDate().toLocaleDateString()}
      `);
    });

  } catch (error) {
    console.error('Error cargando historial:', error);
  }
}
```

### 6. Obtener estadísticas de un producto específico

```javascript
async function loadProductStats(productId) {
  try {
    const productStats = await getProductStatistics(productId);

    console.log(`
      Sesiones: ${productStats.sessions}
      Promedio: ${productStats.averageScore}%
      Preguntas totales: ${productStats.totalQuestions}
    `);

    // Mostrar rendimiento por tema
    Object.entries(productStats.topicPerformance).forEach(([topic, stats]) => {
      console.log(`${topic}: ${stats.percentage}% (${stats.correct}/${stats.total})`);
    });

  } catch (error) {
    console.error('Error cargando estadísticas del producto:', error);
  }
}
```

### 7. Abandonar una sesión

```javascript
async function handleAbandonSession() {
  try {
    if (window.currentSessionId) {
      await abandonSession(window.currentSessionId);
      console.log('Sesión abandonada');
    }
  } catch (error) {
    console.error('Error abandonando sesión:', error);
  }
}
```

## Ejemplo Completo de Flujo

```javascript
// En tu página de dashboard/training

import {
  createSession,
  completeSession,
  getUserStatistics,
  formatTime
} from './js/sessionManager.js';

// 1. Cargar estadísticas al cargar el dashboard
window.addEventListener('load', async () => {
  const stats = await getUserStatistics();
  updateDashboardUI(stats);
});

// 2. Cuando el usuario hace clic en "Iniciar Entrenamiento"
document.getElementById('start-training-btn').addEventListener('click', async () => {
  const sessionData = {
    productId: getCurrentProductId(),
    productName: getCurrentProductName(),
    mode: getSelectedMode(), // 'practice' o 'exam'
    selectedTopics: getSelectedTopics(),
    questionCount: getQuestionCount()
  };

  const sessionId = await createSession(sessionData);
  window.currentSessionId = sessionId;

  // Redirigir a la página de entrenamiento
  window.location.hash = `#/training/${sessionId}`;
});

// 3. Cuando el usuario completa el entrenamiento
async function onTrainingComplete(answers, timeSpent) {
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const incorrectAnswers = answers.length - correctAnswers;

  const results = {
    productId: getCurrentProductId(),
    totalQuestions: answers.length,
    correctAnswers,
    incorrectAnswers,
    score: Math.round((correctAnswers / answers.length) * 100),
    timeSpent,
    answers
  };

  await completeSession(window.currentSessionId, results);

  // Mostrar pantalla de resultados
  showResults(results);
}

function updateDashboardUI(stats) {
  document.getElementById('total-sessions').textContent = stats.totalSessions;
  document.getElementById('total-questions').textContent = stats.totalQuestions;
  document.getElementById('average-score').textContent = `${stats.averageScore}%`;
  document.getElementById('total-time').textContent = formatTime(stats.totalTimeSpent);
  document.getElementById('current-streak').textContent = stats.currentStreak;
}
```

## Reglas de Firestore

Para que esto funcione, necesitas agregar estas reglas en Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Reglas para sessions
    match /sessions/{sessionId} {
      // Los usuarios solo pueden leer/escribir sus propias sesiones
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;

      // Permitir crear sesión
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    // Reglas para user_statistics
    match /user_statistics/{userId} {
      // Los usuarios solo pueden leer/escribir sus propias estadísticas
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

## Notas Importantes

1. **Las colecciones se crean automáticamente** cuando insertas el primer documento
2. **No necesitas crear índices** inicialmente, Firebase te avisará si los necesitas
3. **El userId se obtiene automáticamente** del usuario autenticado
4. **Los timestamps se manejan automáticamente** con `Timestamp.now()`
5. **Las estadísticas se actualizan automáticamente** al completar cada sesión

## Testing

Puedes probar las funciones en la consola del navegador:

```javascript
// Importar el módulo
import('./js/sessionManager.js').then(async (module) => {
  // Ver estadísticas actuales
  const stats = await module.getUserStatistics();
  console.log(stats);

  // Ver historial
  const sessions = await module.getUserSessions(5);
  console.log(sessions);
});
```
