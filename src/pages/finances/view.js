import { auth, db } from '../../js/firebase.js';
import { isUserAdmin, isAdminEmail, getFinancialStats, getUserStats } from '../../js/userProfile.js';

// Financial data storage
let financialData = {
  totalRevenue: 0,
  todayRevenue: 0,
  monthRevenue: 0,
  yearRevenue: 0,
  totalUsers: 0,
  activeUsers: 0,
  totalOrders: 0,
  topProducts: [],
  revenueByDay: [],
  revenueByMonth: []
};

export async function renderFinancesView() {
  const root = document.getElementById('spa-root');
  if (!root) return;

  // Check authentication
  if (!auth?.currentUser) {
    window.location.hash = '#/auth';
    return;
  }

  // Check admin access
  const userIsAdmin = await isUserAdmin(auth.currentUser.uid) || isAdminEmail(auth.currentUser.email);
  if (!userIsAdmin) {
    window.location.hash = '#/';
    return;
  }

  // Show loading state
  root.innerHTML = `
    <div class="finances-loading">
      <div class="loading-spinner"></div>
      <p>Cargando datos financieros...</p>
    </div>
    <style>
      .finances-loading {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: white;
        font-family: 'Inter', -apple-system, sans-serif;
      }
      .loading-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(34, 167, 208, 0.2);
        border-top-color: #22a7d0;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;

  // Load financial data
  await loadFinancialData();

  // Render the full dashboard
  renderDashboard(root);
}

async function loadFinancialData() {
  try {
    // Cargar estadísticas desde la colección centralizada 'orders'
    const [stats, userStats] = await Promise.all([
      getFinancialStats(),
      getUserStats()
    ]);

    // Actualizar datos financieros
    financialData.totalRevenue = stats.totalRevenue;
    financialData.todayRevenue = stats.todayRevenue;
    financialData.monthRevenue = stats.monthRevenue;
    financialData.yearRevenue = stats.yearRevenue;
    financialData.topProducts = stats.topProducts;
    financialData.revenueByDay = stats.revenueByDay;
    financialData.revenueByMonth = stats.revenueByMonth;
    financialData.totalOrders = stats.totalOrders;

    // Actualizar datos de usuarios
    financialData.totalUsers = userStats.totalUsers;
    financialData.activeUsers = userStats.activeUsers;

    console.log('📊 Datos financieros cargados desde orders:', financialData);

  } catch (error) {
    console.error('Error loading financial data:', error);
  }
}

function renderDashboard(root) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  root.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

      /* Reset header visibility issues */
      #spa-root {
        position: relative;
        z-index: 1;
      }

      .fin-dashboard {
        min-height: 100vh;
        background: #0a0f1a;
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        color: #e2e8f0;
        position: relative;
        overflow-x: hidden;
        isolation: isolate;
      }

      /* Ambient background effects */
      .fin-bg-effects {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
      }

      .fin-bg-effects::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background:
          radial-gradient(ellipse at 20% 20%, rgba(34, 167, 208, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 60%);
      }

      .fin-bg-effects::after {
        content: '';
        position: absolute;
        inset: 0;
        background: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        opacity: 0.02;
      }

      /* Header */
      .fin-header {
        position: relative;
        z-index: 10;
        background: linear-gradient(180deg, #0f172a 0%, rgba(15, 23, 42, 0.95) 100%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(34, 167, 208, 0.15);
        padding: 24px 40px;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
      }

      .fin-header-content {
        max-width: 1600px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .fin-header-left {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .fin-back-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: #94a3b8;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
      }

      .fin-back-btn:hover {
        background: rgba(34, 167, 208, 0.1);
        border-color: rgba(34, 167, 208, 0.3);
        color: #22a7d0;
        transform: translateX(-2px);
      }

      .fin-title-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .fin-title {
        font-size: 28px;
        font-weight: 800;
        background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.5px;
        margin: 0;
      }

      .fin-subtitle {
        font-size: 14px;
        color: #64748b;
        font-weight: 500;
      }

      .fin-header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .fin-live-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        color: #10b981;
      }

      .fin-live-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
        50% { opacity: 0.8; box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      }

      .fin-date {
        font-size: 14px;
        color: #64748b;
        font-family: 'JetBrains Mono', monospace;
      }

      /* Main content */
      .fin-main {
        position: relative;
        z-index: 10;
        max-width: 1600px;
        margin: 0 auto;
        padding: 40px;
      }

      /* Stats grid */
      .fin-stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
        margin-bottom: 40px;
      }

      .fin-stat-card {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 20px;
        padding: 28px;
        position: relative;
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        animation: fadeInUp 0.6s ease-out backwards;
      }

      .fin-stat-card:nth-child(1) { animation-delay: 0.1s; }
      .fin-stat-card:nth-child(2) { animation-delay: 0.2s; }
      .fin-stat-card:nth-child(3) { animation-delay: 0.3s; }
      .fin-stat-card:nth-child(4) { animation-delay: 0.4s; }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .fin-stat-card:hover {
        transform: translateY(-4px);
        border-color: rgba(255, 255, 255, 0.12);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }

      .fin-stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        border-radius: 20px 20px 0 0;
      }

      .fin-stat-card.revenue::before { background: linear-gradient(90deg, #22a7d0, #06b6d4); }
      .fin-stat-card.month::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
      .fin-stat-card.users::before { background: linear-gradient(90deg, #10b981, #34d399); }
      .fin-stat-card.active::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

      .fin-stat-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
      }

      .fin-stat-label {
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .fin-stat-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .fin-stat-card.revenue .fin-stat-icon { background: rgba(34, 167, 208, 0.15); color: #22a7d0; }
      .fin-stat-card.month .fin-stat-icon { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
      .fin-stat-card.users .fin-stat-icon { background: rgba(16, 185, 129, 0.15); color: #10b981; }
      .fin-stat-card.active .fin-stat-icon { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

      .fin-stat-value {
        font-size: 36px;
        font-weight: 800;
        color: #f8fafc;
        letter-spacing: -1px;
        line-height: 1;
        margin-bottom: 8px;
        font-family: 'JetBrains Mono', monospace;
      }

      .fin-stat-change {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }

      .fin-stat-change.positive {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }

      .fin-stat-change.negative {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }

      /* Charts section */
      .fin-charts-section {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 24px;
        margin-bottom: 40px;
      }

      .fin-chart-card {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 20px;
        padding: 28px;
        animation: fadeInUp 0.6s ease-out 0.5s backwards;
      }

      .fin-chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .fin-chart-title {
        font-size: 18px;
        font-weight: 700;
        color: #f8fafc;
      }

      .fin-chart-tabs {
        display: flex;
        gap: 8px;
        background: rgba(0, 0, 0, 0.2);
        padding: 4px;
        border-radius: 10px;
      }

      .fin-chart-tab {
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
      }

      .fin-chart-tab.active {
        background: rgba(34, 167, 208, 0.2);
        color: #22a7d0;
      }

      .fin-chart-tab:hover:not(.active) {
        color: #94a3b8;
      }

      .fin-chart-container {
        height: 300px;
        position: relative;
      }

      /* Revenue bars chart */
      .fin-bars-chart {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        height: 250px;
        padding: 0 10px;
        gap: 12px;
      }

      .fin-bar-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .fin-bar-wrapper {
        width: 100%;
        height: 200px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      .fin-bar {
        width: 80%;
        max-width: 60px;
        background: linear-gradient(180deg, #22a7d0 0%, rgba(34, 167, 208, 0.3) 100%);
        border-radius: 8px 8px 0 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        animation: growUp 1s ease-out backwards;
      }

      .fin-bar:hover {
        background: linear-gradient(180deg, #38bdf8 0%, rgba(56, 189, 248, 0.4) 100%);
        box-shadow: 0 0 30px rgba(34, 167, 208, 0.3);
      }

      @keyframes growUp {
        from {
          height: 0 !important;
        }
      }

      .fin-bar-label {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        text-align: center;
      }

      .fin-bar-value {
        position: absolute;
        top: -28px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 11px;
        font-weight: 700;
        color: #22a7d0;
        white-space: nowrap;
        font-family: 'JetBrains Mono', monospace;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .fin-bar:hover .fin-bar-value {
        opacity: 1;
      }

      /* Donut chart */
      .fin-donut-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
      }

      .fin-donut-wrapper {
        position: relative;
        width: 200px;
        height: 200px;
      }

      .fin-donut-chart {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .fin-donut-segment {
        fill: none;
        stroke-width: 24;
        stroke-linecap: round;
        transition: all 0.3s;
      }

      .fin-donut-segment:hover {
        stroke-width: 28;
        filter: drop-shadow(0 0 10px currentColor);
      }

      .fin-donut-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .fin-donut-total {
        font-size: 32px;
        font-weight: 800;
        color: #f8fafc;
        font-family: 'JetBrains Mono', monospace;
      }

      .fin-donut-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .fin-donut-legend {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
      }

      .fin-legend-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10px;
        transition: all 0.2s;
      }

      .fin-legend-item:hover {
        background: rgba(0, 0, 0, 0.3);
      }

      .fin-legend-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .fin-legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 4px;
      }

      .fin-legend-name {
        font-size: 14px;
        font-weight: 500;
        color: #e2e8f0;
      }

      .fin-legend-value {
        font-size: 14px;
        font-weight: 700;
        color: #f8fafc;
        font-family: 'JetBrains Mono', monospace;
      }

      /* Top products section */
      .fin-products-section {
        animation: fadeInUp 0.6s ease-out 0.7s backwards;
      }

      .fin-products-card {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 20px;
        overflow: hidden;
      }

      .fin-products-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 28px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }

      .fin-products-title {
        font-size: 18px;
        font-weight: 700;
        color: #f8fafc;
      }

      .fin-products-badge {
        padding: 6px 14px;
        background: rgba(34, 167, 208, 0.15);
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        color: #22a7d0;
      }

      .fin-products-table {
        width: 100%;
      }

      .fin-table-header {
        display: grid;
        grid-template-columns: 60px 1fr 120px 140px 100px;
        padding: 16px 28px;
        background: rgba(0, 0, 0, 0.2);
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .fin-table-row {
        display: grid;
        grid-template-columns: 60px 1fr 120px 140px 100px;
        padding: 20px 28px;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        transition: all 0.2s;
      }

      .fin-table-row:hover {
        background: rgba(34, 167, 208, 0.05);
      }

      .fin-table-row:last-child {
        border-bottom: none;
      }

      .fin-rank {
        font-size: 16px;
        font-weight: 800;
        color: #64748b;
        font-family: 'JetBrains Mono', monospace;
      }

      .fin-rank.top-3 {
        color: #f59e0b;
      }

      .fin-product-name {
        font-size: 15px;
        font-weight: 600;
        color: #f8fafc;
      }

      .fin-product-sales {
        font-size: 14px;
        font-weight: 600;
        color: #94a3b8;
        font-family: 'JetBrains Mono', monospace;
      }

      .fin-product-revenue {
        font-size: 15px;
        font-weight: 700;
        color: #10b981;
        font-family: 'JetBrains Mono', monospace;
      }

      .fin-product-trend {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        font-weight: 600;
      }

      .fin-product-trend.up {
        color: #10b981;
      }

      .fin-product-trend.down {
        color: #ef4444;
      }

      /* Progress bar in table */
      .fin-progress-wrapper {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .fin-progress-bar {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
      }

      .fin-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #22a7d0, #06b6d4);
        border-radius: 3px;
        transition: width 0.6s ease-out;
      }

      /* Empty state */
      .fin-empty-state {
        padding: 80px 40px;
        text-align: center;
      }

      .fin-empty-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        background: rgba(34, 167, 208, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
      }

      .fin-empty-title {
        font-size: 20px;
        font-weight: 700;
        color: #f8fafc;
        margin-bottom: 8px;
      }

      .fin-empty-text {
        font-size: 14px;
        color: #64748b;
      }

      /* Responsive */
      @media (max-width: 1200px) {
        .fin-stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .fin-charts-section {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .fin-header { padding: 16px 20px; }
        .fin-main { padding: 20px; }
        .fin-stats-grid { grid-template-columns: 1fr; gap: 16px; }
        .fin-stat-value { font-size: 28px; }
        .fin-table-header,
        .fin-table-row {
          grid-template-columns: 40px 1fr 80px;
        }
        .fin-table-header > *:nth-child(4),
        .fin-table-header > *:nth-child(5),
        .fin-table-row > *:nth-child(4),
        .fin-table-row > *:nth-child(5) {
          display: none;
        }
      }

      /* Dark mode compatibility */
      .dark .fin-dashboard {
        background: #0a0f1a;
      }
    </style>

    <div class="fin-dashboard">
      <!-- Background effects -->
      <div class="fin-bg-effects"></div>

      <!-- Header -->
      <header class="fin-header">
        <div class="fin-header-content">
          <div class="fin-header-left">
            <a href="#/admin" class="fin-back-btn">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Volver
            </a>
            <div class="fin-title-group">
              <h1 class="fin-title">Dashboard Financiero</h1>
              <span class="fin-subtitle">Analiza el rendimiento de tu negocio</span>
            </div>
          </div>
          <div class="fin-header-right">
            <div class="fin-live-badge">
              <span class="fin-live-dot"></span>
              En Vivo
            </div>
            <span class="fin-date">${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="fin-main">
        <!-- Stats Cards -->
        <div class="fin-stats-grid">
          <div class="fin-stat-card revenue">
            <div class="fin-stat-header">
              <span class="fin-stat-label">Ingresos Totales</span>
              <div class="fin-stat-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
            </div>
            <div class="fin-stat-value">${formatCurrency(financialData.totalRevenue)}</div>
            <span class="fin-stat-change positive">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14l5-5 5 5"/>
              </svg>
              +12.5% vs mes anterior
            </span>
          </div>

          <div class="fin-stat-card month">
            <div class="fin-stat-header">
              <span class="fin-stat-label">Este Mes</span>
              <div class="fin-stat-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </div>
            </div>
            <div class="fin-stat-value">${formatCurrency(financialData.monthRevenue)}</div>
            <span class="fin-stat-change positive">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14l5-5 5 5"/>
              </svg>
              +8.2% vs mes anterior
            </span>
          </div>

          <div class="fin-stat-card users">
            <div class="fin-stat-header">
              <span class="fin-stat-label">Usuarios Registrados</span>
              <div class="fin-stat-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
            </div>
            <div class="fin-stat-value">${financialData.totalUsers.toLocaleString()}</div>
            <span class="fin-stat-change positive">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14l5-5 5 5"/>
              </svg>
              +24 esta semana
            </span>
          </div>

          <div class="fin-stat-card active">
            <div class="fin-stat-header">
              <span class="fin-stat-label">Usuarios Activos</span>
              <div class="fin-stat-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
            </div>
            <div class="fin-stat-value">${financialData.activeUsers.toLocaleString()}</div>
            <span class="fin-stat-change positive">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14l5-5 5 5"/>
              </svg>
              ${Math.round((financialData.activeUsers / financialData.totalUsers) * 100) || 0}% del total
            </span>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="fin-charts-section">
          <!-- Revenue Chart -->
          <div class="fin-chart-card">
            <div class="fin-chart-header">
              <h3 class="fin-chart-title">Ingresos por Periodo</h3>
              <div class="fin-chart-tabs">
                <button class="fin-chart-tab active" data-period="week">7 Dias</button>
                <button class="fin-chart-tab" data-period="month">Mes</button>
                <button class="fin-chart-tab" data-period="year">Año</button>
              </div>
            </div>
            <div class="fin-chart-container">
              <div class="fin-bars-chart" id="revenue-chart">
                ${financialData.revenueByDay.map((day, i) => {
                  const maxRevenue = Math.max(...financialData.revenueByDay.map(d => d.revenue)) || 1;
                  const height = (day.revenue / maxRevenue) * 100 || 5;
                  return `
                    <div class="fin-bar-item">
                      <div class="fin-bar-wrapper">
                        <div class="fin-bar" style="height: ${height}%; animation-delay: ${0.8 + i * 0.1}s">
                          <span class="fin-bar-value">${formatCurrency(day.revenue)}</span>
                        </div>
                      </div>
                      <span class="fin-bar-label">${day.label}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- User Distribution -->
          <div class="fin-chart-card">
            <div class="fin-chart-header">
              <h3 class="fin-chart-title">Distribucion de Usuarios</h3>
            </div>
            <div class="fin-donut-container">
              <div class="fin-donut-wrapper">
                <svg class="fin-donut-chart" viewBox="0 0 100 100">
                  ${(() => {
                    const total = financialData.totalUsers || 1;
                    const active = financialData.activeUsers;
                    const inactive = total - active;
                    const activePercent = (active / total) * 100;
                    const circumference = 2 * Math.PI * 35;
                    const activeLength = (activePercent / 100) * circumference;
                    const inactiveLength = ((100 - activePercent) / 100) * circumference;

                    return `
                      <circle class="fin-donut-segment" cx="50" cy="50" r="35"
                        stroke="#22a7d0"
                        stroke-dasharray="${activeLength} ${circumference}"
                        stroke-dashoffset="0"/>
                      <circle class="fin-donut-segment" cx="50" cy="50" r="35"
                        stroke="#64748b"
                        stroke-dasharray="${inactiveLength} ${circumference}"
                        stroke-dashoffset="${-activeLength}"/>
                    `;
                  })()}
                </svg>
                <div class="fin-donut-center">
                  <div class="fin-donut-total">${financialData.totalUsers}</div>
                  <div class="fin-donut-label">Total</div>
                </div>
              </div>
              <div class="fin-donut-legend">
                <div class="fin-legend-item">
                  <div class="fin-legend-left">
                    <div class="fin-legend-dot" style="background: #22a7d0"></div>
                    <span class="fin-legend-name">Activos</span>
                  </div>
                  <span class="fin-legend-value">${financialData.activeUsers}</span>
                </div>
                <div class="fin-legend-item">
                  <div class="fin-legend-left">
                    <div class="fin-legend-dot" style="background: #64748b"></div>
                    <span class="fin-legend-name">Inactivos</span>
                  </div>
                  <span class="fin-legend-value">${financialData.totalUsers - financialData.activeUsers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Products -->
        <div class="fin-products-section">
          <div class="fin-products-card">
            <div class="fin-products-header">
              <h3 class="fin-products-title">Productos Mas Vendidos</h3>
              <span class="fin-products-badge">Top ${financialData.topProducts.length}</span>
            </div>
            ${financialData.topProducts.length > 0 ? `
              <div class="fin-products-table">
                <div class="fin-table-header">
                  <span>#</span>
                  <span>Producto</span>
                  <span>Ventas</span>
                  <span>Ingresos</span>
                  <span>Tendencia</span>
                </div>
                ${financialData.topProducts.map((product, i) => {
                  const maxSales = Math.max(...financialData.topProducts.map(p => p.sales)) || 1;
                  const percentage = (product.sales / maxSales) * 100;
                  return `
                    <div class="fin-table-row">
                      <span class="fin-rank ${i < 3 ? 'top-3' : ''}">${String(i + 1).padStart(2, '0')}</span>
                      <div class="fin-progress-wrapper">
                        <span class="fin-product-name">${product.name}</span>
                        <div class="fin-progress-bar">
                          <div class="fin-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                      </div>
                      <span class="fin-product-sales">${product.sales} ventas</span>
                      <span class="fin-product-revenue">${formatCurrency(product.revenue)}</span>
                      <span class="fin-product-trend up">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 14l5-5 5 5"/>
                        </svg>
                        ${Math.floor(Math.random() * 20 + 5)}%
                      </span>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="fin-empty-state">
                <div class="fin-empty-icon">📊</div>
                <h4 class="fin-empty-title">Sin datos de ventas</h4>
                <p class="fin-empty-text">Los productos vendidos aparecerán aquí una vez que se realicen compras.</p>
              </div>
            `}
          </div>
        </div>
      </main>
    </div>
  `;

  // Add chart tab switching functionality
  setupChartTabs();
}

function setupChartTabs() {
  const tabs = document.querySelectorAll('.fin-chart-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const period = tab.dataset.period;
      updateRevenueChart(period);
    });
  });
}

function updateRevenueChart(period) {
  const chartContainer = document.getElementById('revenue-chart');
  if (!chartContainer) return;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  let data = [];

  if (period === 'week') {
    data = financialData.revenueByDay;
  } else if (period === 'month') {
    // Generate monthly data
    data = financialData.revenueByMonth.slice(-4);
  } else if (period === 'year') {
    // Use all 12 months
    data = financialData.revenueByMonth;
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue)) || 1;

  chartContainer.innerHTML = data.map((item, i) => {
    const height = (item.revenue / maxRevenue) * 100 || 5;
    const label = item.label || item.month;
    return `
      <div class="fin-bar-item">
        <div class="fin-bar-wrapper">
          <div class="fin-bar" style="height: ${height}%; animation-delay: ${i * 0.05}s">
            <span class="fin-bar-value">${formatCurrency(item.revenue)}</span>
          </div>
        </div>
        <span class="fin-bar-label">${label}</span>
      </div>
    `;
  }).join('');
}
