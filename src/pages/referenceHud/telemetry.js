export function startTelemetry(shadow) {
  const root = shadow.host;
  const controller = new AbortController();
  const { signal } = controller;
  const balancedPerformanceMode = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderChart = shadow.getElementById("render-chart");
  const networkChart = shadow.getElementById("network-chart");
  const metricTargets = {};
  for (const node of shadow.querySelectorAll("[data-metric]")) (metricTargets[node.dataset.metric] ??= []).push(node);
  function setMetric(name, value) {
    (metricTargets[name] || []).forEach((target) => {
      if (target.textContent !== value) target.textContent = value;
    });
  }

  function setRing(name, value, label, isAvailable = true) {
    const ring = shadow.querySelector(`[data-ring="${name}"]`);
    if (!ring) return;
    const normalizedValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    ring.style.setProperty('--ring-value', normalizedValue.toFixed(1));
    ring.classList.toggle('is-na', !isAvailable);
    setMetric(`ring-${name}`, label);
  }

  function drawSparkline(canvas, values, { min = null, max = null, dark = false } = {}) {
    if (!canvas || values.length < 2) return;
    const bounds = { width: canvas.clientWidth, height: canvas.clientHeight };
    if (!bounds.width || !bounds.height) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const pixelWidth = Math.max(1, Math.round(bounds.width * ratio));
    const pixelHeight = Math.max(1, Math.round(bounds.height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.height);

    const lower = min ?? Math.min(...values);
    const upper = max ?? Math.max(...values);
    const range = Math.max(1, upper - lower);
    const padding = 4;
    const chartWidth = bounds.width - padding * 2;
    const chartHeight = bounds.height - padding * 2;

    context.beginPath();
    values.forEach((value, index) => {
      const x = padding + (index / (values.length - 1)) * chartWidth;
      const y = padding + (1 - (value - lower) / range) * chartHeight;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });

    const computed = getComputedStyle(root);
    const stroke = computed.getPropertyValue(dark ? '--prism-cyan' : '--sky-deep').trim() || '#59cbea';
    context.lineWidth = 1.25;
    context.strokeStyle = stroke;
    context.shadowColor = stroke;
    context.shadowBlur = 4;
    context.stroke();
    context.shadowBlur = 0;

    const lastValue = values[values.length - 1];
    const lastY = padding + (1 - (lastValue - lower) / range) * chartHeight;
    context.fillStyle = dark ? '#7feaff' : '#ffffff';
    context.fillRect(bounds.width - padding - 2, lastY - 1, 3, 3);
  }

  function detectBrowserName() {
    const brands = navigator.userAgentData?.brands || [];
    const preferredBrand = brands.find((brand) => !/Not.A.Brand|Chromium/i.test(brand.brand))
      || brands.find((brand) => !/Not.A.Brand/i.test(brand.brand));
    if (preferredBrand) return preferredBrand.brand.replace('Google ', '').toUpperCase();

    const userAgent = navigator.userAgent;
    if (/Edg\//.test(userAgent)) return 'EDGE';
    if (/Firefox\//.test(userAgent)) return 'FIREFOX';
    if (/Chrome\//.test(userAgent)) return 'CHROME';
    if (/Safari\//.test(userAgent)) return 'SAFARI';
    return 'UNKNOWN';
  }

  function readWebGLRenderer() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return null;
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER);
      return typeof renderer === 'string' ? renderer.replace(/^ANGLE \(|\)$/g, '') : null;
    } catch {
      return null;
    }
  }

  async function readWebGPUAdapter() {
    if (!navigator.gpu?.requestAdapter) {
      setMetric('webgpu-status', 'N/A');
      return;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        setMetric('webgpu-status', 'UNAVAILABLE');
        return;
      }
      setMetric('webgpu-status', 'AVAILABLE');
      const info = adapter.info || await adapter.requestAdapterInfo?.();
      const descriptor = info?.description || info?.device || info?.architecture;
      if (descriptor && (metricTargets['gpu-name']?.[0]?.textContent === 'N/A')) {
        setMetric('gpu-name', String(descriptor));
      }
    } catch {
      setMetric('webgpu-status', 'N/A');
    }
  }

  function updateViewportMetrics() {
    const ratio = window.devicePixelRatio || 1;
    const screenWidth = Math.round(window.screen.width * ratio);
    const screenHeight = Math.round(window.screen.height * ratio);
    setMetric('screen-size', `${screenWidth}×${screenHeight} / ${ratio.toFixed(2)}X`);
    setMetric('viewport-size', `${window.innerWidth}×${window.innerHeight}`);
  }

  function updateSessionTransferRate() {
    const resources = performance.getEntriesByType?.('resource') || [];
    const transferred = resources.filter((entry) => entry.transferSize > 0 && entry.responseEnd > entry.startTime);
    if (!transferred.length) {
      setMetric('session-rx', 'N/A');
      return;
    }

    const bytes = transferred.reduce((total, entry) => total + entry.transferSize, 0);
    const startedAt = Math.min(...transferred.map((entry) => entry.startTime));
    const endedAt = Math.max(...transferred.map((entry) => entry.responseEnd));
    const seconds = Math.max(0.001, (endedAt - startedAt) / 1000);
    const megabitsPerSecond = (bytes * 8) / seconds / 1_000_000;
    setMetric('session-rx', `${megabitsPerSecond.toFixed(megabitsPerSecond >= 10 ? 0 : 1)} MBPS`);
  }

  const networkHistory = [];
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  function updateNetworkMetrics() {
    const online = navigator.onLine;
    setMetric('online-state', online ? 'ONLINE' : 'OFFLINE');
    const networkIndicator = shadow.querySelector('.widget-network .live-dot');
    if (networkIndicator) networkIndicator.textContent = online ? 'ONLINE' : 'OFFLINE';

    if (!connection) {
      setMetric('net-downlink', 'N/A');
      setMetric('net-uplink', 'N/A');
      setMetric('net-rtt', 'N/A');
      setMetric('net-type', 'N/A');
      setRing('link', 0, 'N/A', false);
      return;
    }

    const downlink = Number(connection.downlink);
    const rtt = Number(connection.rtt);
    const type = connection.effectiveType || connection.type;
    const hasDownlink = Number.isFinite(downlink) && downlink > 0;
    const hasRtt = Number.isFinite(rtt) && rtt >= 0;

    setMetric('net-downlink', hasDownlink ? `${downlink.toFixed(downlink >= 10 ? 0 : 1)} MBPS` : 'N/A');
    setMetric('net-uplink', 'N/A');
    setMetric('net-rtt', hasRtt ? `${Math.round(rtt)} MS` : 'N/A');
    setMetric('net-type', type ? String(type).toUpperCase() : 'N/A');

    if (hasDownlink) {
      networkHistory.push(downlink);
      if (networkHistory.length > 42) networkHistory.shift();
      drawSparkline(networkChart, networkHistory, { min: 0, max: Math.max(10, ...networkHistory) * 1.08, dark: true });
    }

    if (hasDownlink || hasRtt) {
      const bandwidthScore = hasDownlink ? Math.min(100, downlink * 8) : 50;
      const latencyScore = hasRtt ? Math.max(0, 100 - rtt / 5) : 50;
      const linkScore = bandwidthScore * 0.62 + latencyScore * 0.38;
      setRing('link', linkScore, `${Math.round(linkScore)}%`);
    } else {
      setRing('link', 0, 'N/A', false);
    }
  }

  function initializeVisitorTelemetry() {
    const logicalCores = Number(navigator.hardwareConcurrency);
    const deviceMemory = Number(navigator.deviceMemory);
    setMetric('logical-cores', Number.isFinite(logicalCores) && logicalCores > 0 ? `${logicalCores} THREADS` : 'N/A');
    setMetric('device-memory', Number.isFinite(deviceMemory) && deviceMemory > 0 ? `≈${deviceMemory} GB` : 'N/A');
    setMetric('browser-name', detectBrowserName());
    setMetric('platform-name', String(navigator.userAgentData?.platform || navigator.platform || 'N/A').toUpperCase());
    setMetric('gpu-name', readWebGLRenderer() || 'N/A');
    updateViewportMetrics();
    updateNetworkMetrics();
    readWebGPUAdapter();

    window.addEventListener('resize', updateViewportMetrics, { passive: true, signal });
    window.addEventListener('online', updateNetworkMetrics, { signal });
    window.addEventListener('offline', updateNetworkMetrics, { signal });
    connection?.addEventListener?.('change', updateNetworkMetrics, { signal });
    updateSessionTransferRate();
  }

  const renderHistory = [];
  const renderSampleWindow = balancedPerformanceMode ? 360 : 500;
  const renderSamplePause = balancedPerformanceMode ? 3000 : 2500;
  let renderSampleStartedAt = 0;
  let previousFrameAt = null;
  let sampledFrameDuration = 0;
  let sampledFrameCount = 0;
  let renderTelemetryFrame = 0;
  let renderTelemetryResumeTimer = 0;

  function canSampleRenderTelemetry() {
    return document.visibilityState === 'visible' && root.isConnected;
  }

  function resetRenderSample() {
    renderSampleStartedAt = 0;
    previousFrameAt = null;
    sampledFrameDuration = 0;
    sampledFrameCount = 0;
  }

  function stopRenderTelemetry() {
    if (renderTelemetryFrame) {
      window.cancelAnimationFrame(renderTelemetryFrame);
      renderTelemetryFrame = 0;
    }
    if (renderTelemetryResumeTimer) {
      window.clearTimeout(renderTelemetryResumeTimer);
      renderTelemetryResumeTimer = 0;
    }
    resetRenderSample();
  }

  function beginRenderSample() {
    if (!canSampleRenderTelemetry() || renderTelemetryFrame) return;
    renderSampleStartedAt = performance.now();
    previousFrameAt = null;
    sampledFrameDuration = 0;
    sampledFrameCount = 0;
    renderTelemetryFrame = window.requestAnimationFrame(updateRenderTelemetry);
  }

  function scheduleNextRenderSample() {
    if (!canSampleRenderTelemetry()) {
      stopRenderTelemetry();
      return;
    }
    renderTelemetryResumeTimer = window.setTimeout(() => {
      renderTelemetryResumeTimer = 0;
      beginRenderSample();
    }, renderSamplePause);
  }

  function syncRenderTelemetry() {
    if (!canSampleRenderTelemetry()) {
      stopRenderTelemetry();
      return;
    }
    if (!renderTelemetryFrame && !renderTelemetryResumeTimer) beginRenderSample();
  }

  function updateRenderTelemetry(now) {
    renderTelemetryFrame = 0;
    if (!canSampleRenderTelemetry()) {
      resetRenderSample();
      return;
    }

    if (previousFrameAt !== null) {
      const frameDuration = now - previousFrameAt;
      if (frameDuration > 0 && frameDuration < 250) {
        sampledFrameDuration += frameDuration;
        sampledFrameCount += 1;
      }
    }
    previousFrameAt = now;

    if (now - renderSampleStartedAt >= renderSampleWindow) {
      if (sampledFrameCount > 0) {
        const averageFrameTime = sampledFrameDuration / sampledFrameCount;
        const fps = 1000 / averageFrameTime;
        const frameBudget = Math.min(999, (averageFrameTime / (1000 / 60)) * 100);
        const displayedFps = Math.round(fps);
        setMetric('fps', String(displayedFps));
        setMetric('frame-time', `${averageFrameTime.toFixed(1)} MS`);
        setMetric('frame-budget', `${Math.round(frameBudget)}%`);
        setRing('fps', Math.min(100, (fps / 60) * 100), String(displayedFps));
        renderHistory.push(fps);
        if (renderHistory.length > 54) renderHistory.shift();
        drawSparkline(renderChart, renderHistory, { min: 0, max: Math.max(60, ...renderHistory) * 1.08 });
      }

      const memory = performance.memory;
      if (memory?.usedJSHeapSize > 0 && memory?.jsHeapSizeLimit > 0) {
        const heapPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        setRing('heap', heapPercent, `${Math.round(heapPercent)}%`);
      } else {
        setRing('heap', 0, 'N/A', false);
      }

      resetRenderSample();
      scheduleNextRenderSample();
      return;
    }

    renderTelemetryFrame = window.requestAnimationFrame(updateRenderTelemetry);
  }

  initializeVisitorTelemetry();
  syncRenderTelemetry();
  const clockTime = shadow.getElementById('hud-clock-time');
  const clockDate = shadow.getElementById('hud-clock-date');
  function updateSession() {
    if (!clockTime) return;
    const now = new Date();
    clockTime.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    clockDate.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    const seconds = Math.floor(performance.now() / 1000);
    setMetric('session-uptime', [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
      .map(value => String(value).padStart(2, '0')).join(':'));
    setMetric('visibility-state', document.hidden ? 'PAUSED' : 'ACTIVE');
  }
  updateSession();
  const clockTimer = clockTime ? setInterval(updateSession, 1000) : null;
  document.addEventListener('visibilitychange', () => { syncRenderTelemetry(); updateSession(); }, { signal });
  const timer = setInterval(() => { if (canSampleRenderTelemetry()) { updateNetworkMetrics(); updateSessionTransferRate(); } },5000);
  return () => {controller.abort();clearInterval(timer);clearInterval(clockTimer);stopRenderTelemetry()};
}
