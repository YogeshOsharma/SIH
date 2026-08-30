(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  const sections = document.querySelectorAll('main section[id]');
  const navLinkMap = new Map(
    Array.from(document.querySelectorAll('.nav-link')).map(a => [a.getAttribute('href').slice(1), a])
  );

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const link = navLinkMap.get(entry.target.id);
      if (!link) return;
      if (entry.isIntersecting) {
        navLinkMap.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(s => spyObserver.observe(s));

 
  const revealTargets = document.querySelectorAll(
    '.stat-card, .pipeline-step, .feature-card, .demo-card, .team-card, .arch-node, .console'
  );
  revealTargets.forEach(el => el.setAttribute('data-reveal', ''));

  if (reduceMotion) {
    revealTargets.forEach(el => el.classList.add('revealed'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealTargets.forEach(el => revealObserver.observe(el));
  }

 
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimal || '0', 10);
    if (Number.isNaN(target)) return;
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = value.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(decimals);
    }
    if (reduceMotion) {
      el.textContent = target.toFixed(decimals);
    } else {
      requestAnimationFrame(tick);
    }
  }

  const counters = document.querySelectorAll('[data-count]');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach(c => countObserver.observe(c));

 
  const scrollTopBtn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

 
  function fitCanvas(canvas) {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(rect.width * ratio, 1);
    canvas.height = Math.max(rect.height * ratio, 1);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, width: rect.width, height: rect.height };
  }

  function drawStaticWave(canvas, dataArray, color) {
    const { ctx, width, height } = fitCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    const mid = height / 2;
    const step = Math.max(1, Math.floor(dataArray.length / width));
    for (let x = 0; x < width; x++) {
      const idx = x * step;
      const v = dataArray[idx] || 0; // -1..1
      const y = mid + v * (mid - 6);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  
  const heroCanvas = document.getElementById('heroWave');
  const heroRunBtn = document.getElementById('heroRunBtn');
  const consoleStatus = document.getElementById('consoleStatus');
  const readoutSignal = document.getElementById('readoutSignal');
  const readoutVerdict = document.getElementById('readoutVerdict');

  let heroPhase = 0;
  let heroMode = 'idle'; 
  let heroRAF = null;

  function heroFrame() {
    const { ctx, width, height } = fitCanvas(heroCanvas);
    ctx.clearRect(0, 0, width, height);
    const mid = height / 2;
    ctx.beginPath();

    for (let x = 0; x <= width; x += 2) {
      let y;
      if (heroMode === 'cloned') {
      
        y = mid + Math.sin(x * 0.05 + heroPhase) * (height * 0.32);
      } else if (heroMode === 'authentic') {
      
        y = mid
          + Math.sin(x * 0.045 + heroPhase) * (height * 0.20)
          + Math.sin(x * 0.11 + heroPhase * 1.7) * (height * 0.09)
          + Math.sin(x * 0.021 + heroPhase * 0.6) * (height * 0.06);
      } else {
        
        y = mid
          + Math.sin(x * 0.04 + heroPhase) * (height * 0.14)
          + Math.sin(x * 0.09 + heroPhase * 1.3) * (height * 0.05);
      }
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }

    let color = getCSS('--accent-data');
    if (heroMode === 'authentic') color = getCSS('--accent-safe');
    if (heroMode === 'cloned') color = getCSS('--accent-danger');

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

  
    if (heroMode === 'scanning') {
      const sweepX = (heroPhase * 40) % width;
      ctx.beginPath();
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, height);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    heroPhase += reduceMotion ? 0 : 0.06;
    heroRAF = requestAnimationFrame(heroFrame);
  }

  function getCSS(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  function startHeroLoop() {
    if (heroRAF) cancelAnimationFrame(heroRAF);
    heroFrame();
  }
  startHeroLoop();
  window.addEventListener('resize', () => {  });

  function setConsoleStatus(mode) {
    consoleStatus.classList.toggle('danger', mode === 'cloned');
    if (mode === 'idle') consoleStatus.innerHTML = '<span class="dot dot-live"></span>LISTENING';
    if (mode === 'scanning') consoleStatus.innerHTML = '<span class="dot"></span>ANALYZING…';
    if (mode === 'authentic') consoleStatus.innerHTML = '<span class="dot" style="background:var(--accent-safe)"></span>AUTHENTIC';
    if (mode === 'cloned') consoleStatus.innerHTML = '<span class="dot" style="background:var(--accent-danger)"></span>ALERT — CLONE';
  }

  function runHeroDetection() {
    heroRunBtn.disabled = true;
    heroMode = 'scanning';
    setConsoleStatus('scanning');
    readoutSignal.textContent = 'Streaming 16kHz PCM…';
    readoutVerdict.textContent = 'Computing…';

    setTimeout(() => {
      const isCloned = Math.random() < 0.5;
      heroMode = isCloned ? 'cloned' : 'authentic';
      setConsoleStatus(heroMode);
      readoutSignal.textContent = isCloned ? 'Synthetic artifacts detected' : 'Natural prosody confirmed';
      const confidence = isCloned
        ? (Math.random() * 8 + 90).toFixed(1)
        : (Math.random() * 6 + 93).toFixed(1);
      readoutVerdict.textContent = `${isCloned ? 'SYNTHETIC' : 'HUMAN'} — ${confidence}% confidence`;
      heroRunBtn.disabled = false;

      
      setTimeout(() => {
        heroMode = 'idle';
        setConsoleStatus('idle');
        readoutSignal.textContent = 'Awaiting input…';
        readoutVerdict.textContent = '—';
      }, 6000);
    }, 1900);
  }

  heroRunBtn.addEventListener('click', runHeroDetection);

  const gaugeFill = document.getElementById('gaugeFill');
  const gaugeNum = document.getElementById('gaugeNum');
  const verdictLabel = document.getElementById('verdictLabel');
  const verdictDetail = document.getElementById('verdictDetail');
  const GAUGE_CIRC = 314;

  const CLONE_REASONS = [
    'Unnaturally low pitch jitter across syllables',
    'Spectral flatness inconsistent with vocal tract',
    'Missing micro-pauses typical of natural breathing',
    'Phase artifacts detected above 6kHz band'
  ];
  const HUMAN_REASONS = [
    'Pitch jitter within natural speaker range',
    'Breath and pause pattern consistent with live speech',
    'Formant transitions match expected vocal tract shape',
    'No synthetic phase artifacts detected'
  ];

  function renderVerdict(isCloned, confidence) {
    const color = isCloned ? getCSS('--accent-danger') : getCSS('--accent-safe');
    gaugeFill.style.stroke = color;
    const offset = GAUGE_CIRC - (GAUGE_CIRC * confidence) / 100;
    gaugeFill.style.strokeDashoffset = offset;
    gaugeNum.textContent = Math.round(confidence);
    gaugeNum.style.color = color;
    verdictLabel.textContent = isCloned ? 'Synthetic voice detected' : 'Authentic human voice';
    verdictLabel.style.color = color;
    const reasons = isCloned ? CLONE_REASONS : HUMAN_REASONS;
    verdictDetail.innerHTML = reasons
      .slice(0, 3)
      .map(r => `<li>· ${r}</li>`)
      .join('');
  }

  function resetVerdict() {
    gaugeFill.style.strokeDashoffset = GAUGE_CIRC;
    gaugeNum.textContent = '--';
    gaugeNum.style.color = '';
    verdictLabel.textContent = 'Analyzing…';
    verdictLabel.style.color = '';
    verdictDetail.innerHTML = '';
  }

  function runSimulatedVerdict() {
    resetVerdict();
    return new Promise(resolve => {
      setTimeout(() => {
        const isCloned = Math.random() < 0.5;
        const confidence = isCloned ? (Math.random() * 8 + 90) : (Math.random() * 6 + 93);
        renderVerdict(isCloned, confidence);
        resolve({ isCloned, confidence });
      }, 1400);
    });
  }

 
  const uploadInput = document.getElementById('audioUpload');
  const uploadDrop = document.getElementById('uploadDrop');
  const uploadLabel = document.getElementById('uploadLabel');
  const uploadWave = document.getElementById('uploadWave');
  const analyzeUploadBtn = document.getElementById('analyzeUploadBtn');
  let uploadedWaveform = null;

  function extractWaveformPeaks(audioBuffer, bucketCount) {
    const channel = audioBuffer.getChannelData(0);
    const bucketSize = Math.floor(channel.length / bucketCount) || 1;
    const peaks = new Float32Array(bucketCount);
    for (let i = 0; i < bucketCount; i++) {
      let max = 0;
      const start = i * bucketSize;
      const end = Math.min(start + bucketSize, channel.length);
      for (let j = start; j < end; j++) {
        const abs = Math.abs(channel[j]);
        if (abs > max) max = abs;
      }
  
      peaks[i] = max * (i % 2 === 0 ? 1 : -1);
    }
    return peaks;
  }

  async function handleUploadedFile(file) {
    if (!file) return;
    uploadLabel.textContent = `Loaded: ${file.name}`;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      uploadedWaveform = extractWaveformPeaks(audioBuffer, 400);
      drawStaticWave(uploadWave, uploadedWaveform, getCSS('--accent-data'));
      analyzeUploadBtn.disabled = false;
      audioCtx.close();
    } catch (err) {
      uploadLabel.textContent = 'Could not decode that file — try a WAV or MP3.';
      analyzeUploadBtn.disabled = true;
    }
  }

  uploadInput.addEventListener('change', (e) => handleUploadedFile(e.target.files[0]));

  ['dragenter', 'dragover'].forEach(evt => {
    uploadDrop.addEventListener(evt, (e) => { e.preventDefault(); uploadDrop.classList.add('dragover'); });
  });
  ['dragleave', 'drop'].forEach(evt => {
    uploadDrop.addEventListener(evt, (e) => { e.preventDefault(); uploadDrop.classList.remove('dragover'); });
  });
  uploadDrop.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) { uploadInput.files = e.dataTransfer.files; handleUploadedFile(file); }
  });

  analyzeUploadBtn.addEventListener('click', () => {
    analyzeUploadBtn.disabled = true;
    runSimulatedVerdict().finally(() => { analyzeUploadBtn.disabled = false; });
  });

  
  const micBtn = document.getElementById('micBtn');
  const micWave = document.getElementById('micWave');
  const micHint = document.getElementById('micHint');

  micBtn.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      micHint.textContent = 'Microphone access is not supported in this browser.';
      return;
    }
    micBtn.disabled = true;
    micHint.textContent = 'Requesting microphone permission…';

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      micHint.textContent = 'Microphone permission denied.';
      micBtn.disabled = false;
      return;
    }

    micHint.textContent = 'Recording 4s sample…';
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const timeData = new Uint8Array(analyser.fftSize);

    const startTime = performance.now();
    const DURATION = 4000;
    let raf;

    function drawLive() {
      analyser.getByteTimeDomainData(timeData);
      const { ctx, width, height } = fitCanvas(micWave);
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      const step = Math.max(1, Math.floor(timeData.length / width));
      for (let x = 0; x < width; x++) {
        const v = (timeData[x * step] - 128) / 128; // -1..1
        const y = height / 2 + v * (height / 2 - 6);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = getCSS('--accent-safe');
      ctx.lineWidth = 2;
      ctx.stroke();

      const elapsed = performance.now() - startTime;
      if (elapsed < DURATION) {
        raf = requestAnimationFrame(drawLive);
      } else {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach(t => t.stop());
        audioCtx.close();
        micHint.textContent = 'Sample captured. Analyzing…';
        runSimulatedVerdict().then(() => {
          micHint.textContent = 'Done — run it again anytime.';
          micBtn.disabled = false;
        });
      }
    }
    drawLive();
  });

  
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  function setFieldError(input, message) {
    const row = input.closest('.form-row');
    const errorEl = contactForm.querySelector(`.form-error[data-for="${input.id}"]`);
    row.classList.toggle('invalid', Boolean(message));
    if (errorEl) errorEl.textContent = message || '';
  }

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const name = document.getElementById('cf-name');
    const email = document.getElementById('cf-email');
    const message = document.getElementById('cf-msg');

    if (!name.value.trim()) { setFieldError(name, 'Please enter your name.'); valid = false; }
    else setFieldError(name, '');

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value.trim())) { setFieldError(email, 'Enter a valid email address.'); valid = false; }
    else setFieldError(email, '');

    if (message.value.trim().length < 5) { setFieldError(message, 'Message is a little short.'); valid = false; }
    else setFieldError(message, '');

    if (!valid) {
      formStatus.style.color = 'var(--accent-danger)';
      formStatus.textContent = 'Please fix the highlighted fields.';
      return;
    }

    formStatus.style.color = 'var(--accent-safe)';
    formStatus.textContent = `Thanks, ${name.value.trim().split(' ')[0]} — we'll be in touch shortly.`;
    contactForm.reset();
  });

})();