(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const navToggle = document.getElementById('navToggle');
  const letterNav = document.getElementById('letterNav');
  navToggle.addEventListener('click', () => {
    const open = letterNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  letterNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    letterNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));

  const beadsGroup = document.querySelector('.crest-beads');
  if (beadsGroup) {
    const cx = 130, cy = 130, r = 111, count = 32;
    let svgns = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      const dot = document.createElementNS(svgns, 'circle');
      dot.setAttribute('cx', x.toFixed(2));
      dot.setAttribute('cy', y.toFixed(2));
      dot.setAttribute('r', '2');
      beadsGroup.appendChild(dot);
    }
  }

  
  const tabs = document.querySelectorAll('.input-tab');
  const panes = document.querySelectorAll('.input-pane');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`.input-pane[data-pane="${tab.dataset.tab}"]`).classList.add('active');
    });
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
      const v = dataArray[idx] || 0;
      const y = mid + v * (mid - 6);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function getCSS(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  
  const arcFill = document.getElementById('arcFill');
  const arcNum = document.getElementById('arcNum');
  const royalSeal = document.getElementById('royalSeal');
  const rsText = document.getElementById('rsText');
  const findingsList = document.getElementById('findingsList');
  const ARC_LEN = 212;

  const CLONE_FINDINGS = [
    'Pitch jitter unusually low for a live voice',
    'Spectral texture inconsistent with a natural vocal tract',
    'No micro-pauses typical of breathing between phrases'
  ];
  const HUMAN_FINDINGS = [
    'Pitch jitter within expected range for a live speaker',
    'Breath and pause pattern consistent with natural speech',
    'No synthetic phase artifacts detected'
  ];

  function resetVerdict() {
    arcFill.style.strokeDashoffset = ARC_LEN;
    arcNum.textContent = '—';
    royalSeal.className = 'royal-seal';
    rsText.textContent = '···';
    findingsList.innerHTML = '<li>Reading the sample…</li>';
  }

  function renderVerdict(isCloned, confidence) {
    const offset = ARC_LEN - (ARC_LEN * confidence) / 100;
    arcFill.style.strokeDashoffset = offset;
    arcFill.style.stroke = isCloned ? getCSS('--ruby') : getCSS('--emerald');
    arcNum.textContent = `${Math.round(confidence)}%`;
    rsText.textContent = isCloned ? 'Flagged' : 'Verified';
    royalSeal.className = `royal-seal show ${isCloned ? 'flagged' : 'verified'}`;
    const findings = isCloned ? CLONE_FINDINGS : HUMAN_FINDINGS;
    findingsList.innerHTML = findings.map(f => `<li>${f}</li>`).join('');
  }

  function runSimulatedVerdict() {
    resetVerdict();
    return new Promise(resolve => {
      setTimeout(() => {
        const isCloned = Math.random() < 0.5;
        const confidence = isCloned ? (Math.random() * 8 + 90) : (Math.random() * 6 + 93);
        renderVerdict(isCloned, confidence);
        resolve({ isCloned, confidence });
      }, 1300);
    });
  }

  
  const uploadInput = document.getElementById('audioUpload');
  const uploadDrop = document.getElementById('uploadDrop');
  const uploadLabel = document.getElementById('uploadLabel');
  const uploadWave = document.getElementById('uploadWave');
  const analyzeUploadBtn = document.getElementById('analyzeUploadBtn');

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
      const peaks = extractWaveformPeaks(audioBuffer, 400);
      drawStaticWave(uploadWave, peaks, getCSS('--gold'));
      analyzeUploadBtn.disabled = false;
      audioCtx.close();
    } catch (err) {
      uploadLabel.textContent = 'Could not read that file — try a WAV or MP3.';
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

    micHint.textContent = 'Recording 4-second sample…';
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
        const v = (timeData[x * step] - 128) / 128;
        const y = height / 2 + v * (height / 2 - 6);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = getCSS('--gold-bright');
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const elapsed = performance.now() - startTime;
      if (elapsed < DURATION) {
        raf = requestAnimationFrame(drawLive);
      } else {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach(t => t.stop());
        audioCtx.close();
        micHint.textContent = 'Sample captured. Reading it now…';
        runSimulatedVerdict().then(() => {
          micHint.textContent = 'Sealed — run it again anytime.';
          micBtn.disabled = false;
        });
      }
    }
    drawLive();
  });

 
  const enquiryForm = document.getElementById('enquiryForm');
  const formStatus = document.getElementById('formStatus');

  function setFieldError(input, message) {
    const row = input.closest('.form-row');
    const errorEl = enquiryForm.querySelector(`.form-error[data-for="${input.id}"]`);
    row.classList.toggle('invalid', Boolean(message));
    if (errorEl) errorEl.textContent = message || '';
  }

  enquiryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    const name = document.getElementById('ef-name');
    const email = document.getElementById('ef-email');
    const msg = document.getElementById('ef-msg');

    if (!name.value.trim()) { setFieldError(name, 'Please enter your name.'); valid = false; }
    else setFieldError(name, '');

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value.trim())) { setFieldError(email, 'Enter a valid email address.'); valid = false; }
    else setFieldError(email, '');

    if (msg.value.trim().length < 5) { setFieldError(msg, 'Say a little more.'); valid = false; }
    else setFieldError(msg, '');

    if (!valid) {
      formStatus.style.color = 'var(--ruby)';
      formStatus.textContent = 'Please fix the highlighted fields.';
      return;
    }
    formStatus.style.color = 'var(--emerald)';
    formStatus.textContent = `Recorded — Team DevX will follow up with ${name.value.trim().split(' ')[0]}.`;
    enquiryForm.reset();
  });

})();