/**
 * Session Manager - Maneja sesiones de entrenamiento y estadísticas de usuario
 *
 * Colecciones de Firebase:
 * - sessions: Guarda cada sesión completada
 * - user_statistics: Estadísticas agregadas por usuario
 */

import { db, auth, initializeFirebase } from './firebase.js';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment
} from 'firebase/firestore';

// Asegurar que Firebase esté inicializado antes de usar cualquier función
async function ensureFirebaseReady() {
  await initializeFirebase();
  if (!db) {
    throw new Error('Firestore no está inicializado');
  }
}

/**
 * Crea una nueva sesión de entrenamiento
 * @param {Object} sessionData - Datos de la sesión
 * @returns {Promise<string>} - ID de la sesión creada
 */
export async function createSession(sessionData) {
  try {
    await ensureFirebaseReady();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Usuario no autenticado');

    const session = {
      userId,
      productId: sessionData.productId,
      productName: sessionData.productName,
      mode: sessionData.mode, // 'practice' o 'exam'
      selectedTopics: sessionData.selectedTopics || [],
      questionCount: sessionData.questionCount,
      startedAt: Timestamp.now(),
      completed: false,
      status: 'in_progress' // 'in_progress', 'completed', 'abandoned'
    };

    // Save to user's sessions subcollection (consistent with saveSessionToFirestore)
    const docRef = await addDoc(collection(db, 'users', userId, 'sessions'), session);
    console.log('✅ Sesión creada:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creando sesión:', error);
    throw error;
  }
}

/**
 * Completa una sesión de entrenamiento
 * @param {string} sessionId - ID de la sesión
 * @param {Object} results - Resultados de la sesión
 */
export async function completeSession(sessionId, results) {
  try {
    await ensureFirebaseReady();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Usuario no autenticado');

    // Use user's session subcollection (where sessions are actually stored)
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);

    // Clean answers - replace undefined values with null
    const cleanedAnswers = (results.answers || []).map(answer => ({
      questionId: answer.questionId || '',
      topic: answer.topic || 'General',
      userAnswer: answer.userAnswer !== undefined ? answer.userAnswer : null,
      correctAnswer: answer.correctAnswer !== undefined ? answer.correctAnswer : null,
      isCorrect: answer.isCorrect || false
    }));

    const completionData = {
      correctAnswers: results.correctAnswers || 0,
      incorrectAnswers: results.incorrectAnswers || 0,
      score: Math.round((results.correctAnswers / (results.totalQuestions || 1)) * 100),
      timeSpent: results.timeSpent || 0, // en segundos
      answers: cleanedAnswers,
      completedAt: Timestamp.now(),
      completed: true,
      status: 'completed'
    };

    await updateDoc(sessionRef, completionData);
    console.log('✅ Sesión completada:', sessionId);

    // Actualizar estadísticas del usuario
    await updateUserStatistics(results);

    return sessionId;
  } catch (error) {
    console.error('❌ Error completando sesión:', error);
    throw error;
  }
}

/**
 * Actualiza las estadísticas del usuario
 * @param {Object} sessionResults - Resultados de la sesión
 */
async function updateUserStatistics(sessionResults) {
  try {
    await ensureFirebaseReady();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Usuario no autenticado');

    const statsRef = doc(db, 'user_statistics', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
      // Crear estadísticas iniciales
      const initialStats = {
        userId,
        totalSessions: 1,
        totalQuestions: sessionResults.totalQuestions,
        correctAnswers: sessionResults.correctAnswers,
        incorrectAnswers: sessionResults.incorrectAnswers,
        averageScore: sessionResults.score,
        totalTimeSpent: sessionResults.timeSpent,
        currentStreak: 1,
        longestStreak: 1,
        achievements: [],
        lastSessionDate: Timestamp.now(),
        productStats: {
          [sessionResults.productId]: {
            sessions: 1,
            averageScore: sessionResults.score,
            totalQuestions: sessionResults.totalQuestions,
            correctAnswers: sessionResults.correctAnswers,
            topicPerformance: calculateTopicPerformance(sessionResults.answers)
          }
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      console.log('📝 Creando estadísticas iniciales para userId:', userId);
      console.log('📝 Datos:', initialStats);
      await setDoc(statsRef, initialStats);
      console.log('✅ Estadísticas iniciales creadas en:', `user_statistics/${userId}`);
    } else {
      // Actualizar estadísticas existentes
      const currentStats = statsDoc.data();

      const newTotalSessions = currentStats.totalSessions + 1;
      const newTotalQuestions = currentStats.totalQuestions + sessionResults.totalQuestions;
      const newCorrectAnswers = currentStats.correctAnswers + sessionResults.correctAnswers;
      const newIncorrectAnswers = currentStats.incorrectAnswers + sessionResults.incorrectAnswers;
      const newAverageScore = Math.round((newCorrectAnswers / newTotalQuestions) * 100);
      const newStreak = calculateStreak(currentStats.lastSessionDate);

      // Actualizar estadísticas por producto
      const productStats = currentStats.productStats || {};
      const currentProductStats = productStats[sessionResults.productId] || {
        sessions: 0,
        averageScore: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        topicPerformance: {}
      };

      const newProductSessions = currentProductStats.sessions + 1;
      const newProductQuestions = currentProductStats.totalQuestions + sessionResults.totalQuestions;
      const newProductCorrect = currentProductStats.correctAnswers + sessionResults.correctAnswers;
      const newProductAverage = Math.round((newProductCorrect / newProductQuestions) * 100);

      productStats[sessionResults.productId] = {
        sessions: newProductSessions,
        averageScore: newProductAverage,
        totalQuestions: newProductQuestions,
        correctAnswers: newProductCorrect,
        topicPerformance: mergeTopicPerformance(
          currentProductStats.topicPerformance || {},
          calculateTopicPerformance(sessionResults.answers)
        )
      };

      const updateData = {
        totalSessions: newTotalSessions,
        totalQuestions: newTotalQuestions,
        correctAnswers: newCorrectAnswers,
        incorrectAnswers: newIncorrectAnswers,
        averageScore: newAverageScore,
        totalTimeSpent: currentStats.totalTimeSpent + sessionResults.timeSpent,
        currentStreak: newStreak,
        longestStreak: Math.max(currentStats.longestStreak || 0, newStreak),
        lastSessionDate: Timestamp.now(),
        productStats,
        updatedAt: Timestamp.now()
      };

      await updateDoc(statsRef, updateData);
      console.log('✅ Estadísticas actualizadas');
    }

    // ============================================
    // TAMBIÉN GUARDAR EN LA SUBCOLLECCIÓN QUE USA EL DASHBOARD
    // ============================================
    // El dashboard espera: users/{userId}/stats/{productId}
    console.log('💾 Guardando estadísticas del producto en subcollección...');
    const productStatsRef = doc(db, 'users', userId, 'stats', sessionResults.productId);
    const productStatsSnap = await getDoc(productStatsRef);

    if (!productStatsSnap.exists()) {
      // Crear estadísticas iniciales del producto
      const initialProductStats = {
        productId: sessionResults.productId,
        totalSessions: 1,
        totalQuestions: sessionResults.totalQuestions,
        totalCorrect: sessionResults.correctAnswers,
        totalIncorrect: sessionResults.incorrectAnswers,
        averageScore: sessionResults.score,
        totalTimeStudied: sessionResults.timeSpent,
        averageTimePerSession: sessionResults.timeSpent,
        bestScore: sessionResults.score,
        worstScore: sessionResults.score,
        currentStreak: 1,
        longestStreak: 1,
        practiceMode: {
          sessions: sessionResults.mode === 'practice' ? 1 : 0,
          questions: sessionResults.mode === 'practice' ? sessionResults.totalQuestions : 0,
          correct: sessionResults.mode === 'practice' ? sessionResults.correctAnswers : 0,
          incorrect: sessionResults.mode === 'practice' ? sessionResults.incorrectAnswers : 0,
          averageScore: sessionResults.mode === 'practice' ? sessionResults.score : 0,
          timeStudied: sessionResults.mode === 'practice' ? sessionResults.timeSpent : 0
        },
        examMode: {
          sessions: sessionResults.mode === 'exam' ? 1 : 0,
          questions: sessionResults.mode === 'exam' ? sessionResults.totalQuestions : 0,
          correct: sessionResults.mode === 'exam' ? sessionResults.correctAnswers : 0,
          incorrect: sessionResults.mode === 'exam' ? sessionResults.incorrectAnswers : 0,
          averageScore: sessionResults.mode === 'exam' ? sessionResults.score : 0,
          timeStudied: sessionResults.mode === 'exam' ? sessionResults.timeSpent : 0
        },
        topicPerformance: calculateTopicPerformance(sessionResults.answers),
        lastSessionDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      console.log('📝 Creando estadísticas del producto:', {
        path: `users/${userId}/stats/${sessionResults.productId}`,
        data: initialProductStats
      });
      await setDoc(productStatsRef, initialProductStats);
      console.log('✅ Estadísticas del producto creadas');
    } else {
      // Actualizar estadísticas existentes del producto
      const currentProductStats = productStatsSnap.data();

      const newTotalSessions = (currentProductStats.totalSessions || 0) + 1;
      const newTotalQuestions = (currentProductStats.totalQuestions || 0) + sessionResults.totalQuestions;
      const newTotalCorrect = (currentProductStats.totalCorrect || 0) + sessionResults.correctAnswers;
      const newTotalIncorrect = (currentProductStats.totalIncorrect || 0) + sessionResults.incorrectAnswers;
      const newAverageScore = Math.round((newTotalCorrect / newTotalQuestions) * 100);
      const newTotalTime = (currentProductStats.totalTimeStudied || 0) + sessionResults.timeSpent;
      const newAvgTime = Math.round(newTotalTime / newTotalSessions);

      // Actualizar modo (practice/exam)
      const practiceMode = currentProductStats.practiceMode || {};
      const examMode = currentProductStats.examMode || {};

      if (sessionResults.mode === 'practice') {
        practiceMode.sessions = (practiceMode.sessions || 0) + 1;
        practiceMode.questions = (practiceMode.questions || 0) + sessionResults.totalQuestions;
        practiceMode.correct = (practiceMode.correct || 0) + sessionResults.correctAnswers;
        practiceMode.incorrect = (practiceMode.incorrect || 0) + sessionResults.incorrectAnswers;
        practiceMode.timeStudied = (practiceMode.timeStudied || 0) + sessionResults.timeSpent;
        practiceMode.averageScore = practiceMode.questions > 0
          ? Math.round((practiceMode.correct / practiceMode.questions) * 100)
          : 0;
      } else if (sessionResults.mode === 'exam') {
        examMode.sessions = (examMode.sessions || 0) + 1;
        examMode.questions = (examMode.questions || 0) + sessionResults.totalQuestions;
        examMode.correct = (examMode.correct || 0) + sessionResults.correctAnswers;
        examMode.incorrect = (examMode.incorrect || 0) + sessionResults.incorrectAnswers;
        examMode.timeStudied = (examMode.timeStudied || 0) + sessionResults.timeSpent;
        examMode.averageScore = examMode.questions > 0
          ? Math.round((examMode.correct / examMode.questions) * 100)
          : 0;
      }

      const updateProductData = {
        totalSessions: newTotalSessions,
        totalQuestions: newTotalQuestions,
        totalCorrect: newTotalCorrect,
        totalIncorrect: newTotalIncorrect,
        averageScore: newAverageScore,
        totalTimeStudied: newTotalTime,
        averageTimePerSession: newAvgTime,
        bestScore: Math.max(currentProductStats.bestScore || 0, sessionResults.score),
        worstScore: Math.min(currentProductStats.worstScore || 100, sessionResults.score),
        practiceMode,
        examMode,
        topicPerformance: mergeTopicPerformance(
          currentProductStats.topicPerformance || {},
          calculateTopicPerformance(sessionResults.answers)
        ),
        lastSessionDate: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      console.log('📝 Actualizando estadísticas del producto:', {
        path: `users/${userId}/stats/${sessionResults.productId}`,
        newTotalSessions,
        newAverageScore
      });
      await updateDoc(productStatsRef, updateProductData);
      console.log('✅ Estadísticas del producto actualizadas');
    }
  } catch (error) {
    console.error('❌ Error actualizando estadísticas:', error);
    throw error;
  }
}

/**
 * Calcula el rendimiento por tema
 * @param {Array} answers - Array de respuestas
 * @returns {Object} - Rendimiento por tema
 */
function calculateTopicPerformance(answers) {
  const topicPerformance = {};

  answers.forEach(answer => {
    if (!topicPerformance[answer.topic]) {
      topicPerformance[answer.topic] = {
        correct: 0,
        total: 0,
        percentage: 0
      };
    }

    topicPerformance[answer.topic].total++;
    if (answer.isCorrect) {
      topicPerformance[answer.topic].correct++;
    }
  });

  // Calcular porcentajes
  Object.keys(topicPerformance).forEach(topic => {
    const stats = topicPerformance[topic];
    stats.percentage = Math.round((stats.correct / stats.total) * 100);
  });

  return topicPerformance;
}

/**
 * Fusiona el rendimiento de temas
 * @param {Object} current - Rendimiento actual
 * @param {Object} newData - Nuevo rendimiento
 * @returns {Object} - Rendimiento fusionado
 */
function mergeTopicPerformance(current, newData) {
  const merged = { ...current };

  Object.keys(newData).forEach(topic => {
    if (!merged[topic]) {
      merged[topic] = newData[topic];
    } else {
      const currentCorrect = merged[topic].correct;
      const currentTotal = merged[topic].total;
      const newCorrect = newData[topic].correct;
      const newTotal = newData[topic].total;

      merged[topic] = {
        correct: currentCorrect + newCorrect,
        total: currentTotal + newTotal,
        percentage: Math.round(((currentCorrect + newCorrect) / (currentTotal + newTotal)) * 100)
      };
    }
  });

  return merged;
}

/**
 * Calcula la racha actual
 * @param {Timestamp} lastSessionDate - Fecha de la última sesión
 * @returns {number} - Racha actual
 */
function calculateStreak(lastSessionDate) {
  if (!lastSessionDate) return 1;

  const now = new Date();
  const lastDate = lastSessionDate.toDate();
  const diffTime = Math.abs(now - lastDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Si fue ayer o hoy, continúa la racha
  if (diffDays <= 1) {
    return increment(1);
  }

  // Si pasó más de un día, reinicia la racha
  return 1;
}

/**
 * Obtiene las estadísticas del usuario
 * @param {string} userId - ID del usuario (opcional, usa el actual si no se proporciona)
 * @returns {Promise<Object>} - Estadísticas del usuario
 */
export async function getUserStatistics(userId = null) {
  try {
    await ensureFirebaseReady();
    const uid = userId || auth.currentUser?.uid;
    if (!uid) throw new Error('Usuario no autenticado');

    console.log('📊 Obteniendo estadísticas para userId:', uid);
    console.log('📊 Usuario autenticado:', auth.currentUser?.email);

    const statsRef = doc(db, 'user_statistics', uid);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
      // Retornar estadísticas vacías
      return {
        totalSessions: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
        achievements: [],
        productStats: {}
      };
    }

    return statsDoc.data();
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
}

/**
 * Obtiene el historial de sesiones del usuario
 * @param {number} limitCount - Número máximo de sesiones a obtener
 * @returns {Promise<Array>} - Array de sesiones
 */
export async function getUserSessions(limitCount = 10) {
  try {
    await ensureFirebaseReady();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Usuario no autenticado');

    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      where('status', '==', 'completed'),
      orderBy('completedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return sessions;
  } catch (error) {
    console.error('❌ Error obteniendo sesiones:', error);
    throw error;
  }
}

/**
 * Obtiene las estadísticas de un producto específico
 * @param {string} productId - ID del producto
 * @returns {Promise<Object>} - Estadísticas del producto
 */
export async function getProductStatistics(productId) {
  try {
    await ensureFirebaseReady();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Usuario no autenticado');

    const stats = await getUserStatistics();

    return stats.productStats?.[productId] || {
      sessions: 0,
      averageScore: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      topicPerformance: {}
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas del producto:', error);
    throw error;
  }
}

/**
 * Formatea el tiempo en formato legible
 * @param {number} seconds - Tiempo en segundos
 * @returns {string} - Tiempo formateado
 */
export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Abandona una sesión en progreso
 * @param {string} sessionId - ID de la sesión
 */
export async function abandonSession(sessionId) {
  try {
    await ensureFirebaseReady();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Usuario no autenticado');

    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      status: 'abandoned',
      abandonedAt: Timestamp.now()
    });
    console.log('⚠️ Sesión abandonada:', sessionId);
  } catch (error) {
    console.error('❌ Error abandonando sesión:', error);
    throw error;
  }
}
