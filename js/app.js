/**
 * Vortex Studio - Main Application Orchestrator
 * Links YouTube Downloader, Lively Working GIF Studio, and UI System.
 */

import { YouTubeDownloader } from './yt-downloader.js';
import { GifConverter } from './gif-converter.js';
import { NexusAIEngine } from './ai-engine.js';
import { UIManager } from './ui-manager.js';

class App {
  constructor() {
    this.ui = new UIManager();
    this.ytDownloader = new YouTubeDownloader(this.ui);
    this.gifConverter = new GifConverter(this.ui);
    this.aiEngine = new NexusAIEngine();

    this.activeYtTab = 'video';
    this.currentVideoMeta = null;
    this.selectedFps = 15;
    this.selectedScale = 0.5;

    this.init();
  }

  init() {
    this.bindNavigationTabs();
    this.bindYouTubeDownloader();
    this.bindGifConverter();
    this.bindLivelyWorkingModal();
    this.bindSettings();
    this.bindHistory();
    this.registerServiceWorker();

    console.log("Vortex Studio initialized with Lively Working Engine!");
  }

  /* ----------------------------------------------------
   * 1. Navigation Tabs
   * ---------------------------------------------------- */
  bindNavigationTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.tool-pane');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.tab;
        tabButtons.forEach(b => b.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const activePane = document.getElementById(targetId);
        if (activePane) activePane.classList.add('active');

        this.ui.playAudioFeedback('click');
      });
    });
  }

  /* ----------------------------------------------------
   * 2. YouTube Downloader Module
   * ---------------------------------------------------- */
  bindYouTubeDownloader() {
    const urlInput = document.getElementById('yt-url-input');
    const fetchBtn = document.getElementById('btn-fetch-yt');
    const pasteBtn = document.getElementById('btn-paste-url');
    const sampleBtn = document.getElementById('btn-sample-yt');

    if (pasteBtn && navigator.clipboard) {
      pasteBtn.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            urlInput.value = text.trim();
            this.ui.showToast('Pasted URL from clipboard', 'info', 1800);
            this.fetchYouTubeVideo(urlInput.value);
          }
        } catch (err) {
          this.ui.showToast('Please paste the URL manually', 'info');
        }
      });
    }

    if (sampleBtn) {
      sampleBtn.addEventListener('click', () => {
        // Anime Red Eye 4K (or Rick Astley)
        const sampleUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        urlInput.value = sampleUrl;
        this.fetchYouTubeVideo(sampleUrl);
      });
    }

    if (fetchBtn) {
      fetchBtn.addEventListener('click', () => {
        this.fetchYouTubeVideo(urlInput.value);
      });
    }

    if (urlInput) {
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.fetchYouTubeVideo(urlInput.value);
        }
      });
    }

    // Subtabs: Video and Audio
    const subtabs = document.querySelectorAll('.subtab-btn');
    subtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        subtabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeYtTab = tab.dataset.subtab;
        this.renderActiveQualityGrid();
        this.ui.playAudioFeedback('click');
      });
    });

    // Native Video Play Trigger
    const playEmbedBtn = document.getElementById('btn-play-yt-embed');
    const thumbImg = document.getElementById('yt-thumb-img');
    const playerContainer = document.getElementById('yt-player-container');

    const activatePlayer = () => {
      if (thumbImg) thumbImg.style.display = 'none';
      if (playEmbedBtn) playEmbedBtn.style.display = 'none';
      if (playerContainer) playerContainer.style.display = 'block';
      this.ui.playAudioFeedback('pop');
    };

    if (playEmbedBtn) playEmbedBtn.addEventListener('click', activatePlayer);
    if (thumbImg) thumbImg.addEventListener('click', activatePlayer);
  }

  async fetchYouTubeVideo(url) {
    if (!url || !url.trim()) {
      this.ui.showToast('Please enter a valid YouTube video URL', 'error');
      return;
    }

    const fetchBtn = document.getElementById('btn-fetch-yt');
    const previewContainer = document.getElementById('yt-preview-container');

    try {
      fetchBtn.disabled = true;
      fetchBtn.innerHTML = `<span class="pulse-dot"></span> <span>Extracting Streams...</span>`;

      const meta = await this.ytDownloader.fetchVideoInfo(url);
      this.currentVideoMeta = meta;

      // Mount YouTube Player into DOM to read the EXACT real video duration
      this.ytDownloader.mountYouTubePlayer(meta.id, (formattedDuration, exactDuration, updatedMeta) => {
        const badge = document.getElementById('yt-duration-badge');
        if (badge) badge.textContent = formattedDuration;
        if (updatedMeta) {
          this.currentVideoMeta = updatedMeta;
        }
        this.renderActiveQualityGrid();
      });

      // AI Analysis
      const aiAdvice = this.aiEngine.recommendOptimalQuality(meta);

      this.renderVideoPreview(meta, aiAdvice);
      previewContainer.style.display = 'block';

      this.ui.showToast('Video information extracted successfully!', 'success');
      this.ui.playAudioFeedback('success');

      this.ui.saveToHistory({
        type: 'youtube',
        title: meta.title,
        id: meta.id,
        duration: meta.duration,
        url: meta.url
      });
    } catch (err) {
      this.ui.showToast(err.message || 'Error extracting video streams', 'error');
    } finally {
      fetchBtn.disabled = false;
      fetchBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>Extract Qualities</span>
      `;
    }
  }

  renderVideoPreview(meta, aiAdvice) {
    const thumbImg = document.getElementById('yt-thumb-img');
    const playEmbedBtn = document.getElementById('btn-play-yt-embed');
    const durationBadge = document.getElementById('yt-duration-badge');
    const titleEl = document.getElementById('yt-meta-title');
    const authorEl = document.getElementById('yt-meta-author');
    const viewsEl = document.getElementById('yt-meta-views');
    const aiTextEl = document.getElementById('ai-advisor-desc');

    if (thumbImg) {
      thumbImg.src = meta.thumbnail;
      thumbImg.style.display = 'block';
    }
    if (playEmbedBtn) playEmbedBtn.style.display = 'flex';
    if (durationBadge) durationBadge.textContent = meta.duration;
    if (titleEl) titleEl.textContent = meta.title;
    if (authorEl) authorEl.textContent = meta.author;
    if (viewsEl) viewsEl.textContent = meta.views;

    if (aiTextEl) aiTextEl.textContent = aiAdvice.reasonEn;

    this.renderActiveQualityGrid();
  }

  renderActiveQualityGrid() {
    if (!this.currentVideoMeta) return;

    const grid = document.getElementById('yt-streams-grid');
    grid.innerHTML = '';

    if (this.activeYtTab === 'video') {
      this.currentVideoMeta.streams.forEach(stream => {
        const card = document.createElement('div');
        card.className = 'stream-card';
        card.innerHTML = `
          <div class="stream-info">
            <div class="stream-quality-title">
              <span>${stream.res}</span>
              <span class="neon-badge ${stream.badge === 'Ultra' || stream.badge === 'UHD' ? 'neon-badge-uhd' : 'neon-badge-ai'}">${stream.badge}</span>
              <span class="neon-badge neon-badge-success" style="font-size:0.7rem; padding: 2px 8px;">${stream.aiBadge || 'AI'}</span>
            </div>
            <div class="stream-meta">
              <span>${stream.fps} FPS</span> &bull; <span>${stream.ext.toUpperCase()}</span> &bull; <span style="color: #c084fc; font-weight:700;">${stream.size}</span>
            </div>
          </div>
          <div class="stream-actions">
            <button class="btn btn-primary btn-sm btn-download-stream" data-id="${stream.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download File</span>
            </button>
          </div>
        `;

        const btn = card.querySelector('.btn-download-stream');
        btn.onclick = () => {
          this.handleStreamDownload(stream, btn);
        };

        grid.appendChild(card);
      });
    } else if (this.activeYtTab === 'audio') {
      this.currentVideoMeta.audioStreams.forEach(stream => {
        const card = document.createElement('div');
        card.className = 'stream-card';
        card.innerHTML = `
          <div class="stream-info">
            <div class="stream-quality-title">
              <span>${stream.format} (${stream.bitrate})</span>
              <span class="neon-badge neon-badge-ai">${stream.badge}</span>
            </div>
            <div class="stream-meta">
              <span>${stream.label}</span> &bull; <span style="color: #c084fc; font-weight:700;">${stream.size}</span>
            </div>
          </div>
          <div class="stream-actions">
            <button class="btn btn-neon btn-sm btn-download-audio" data-id="${stream.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
              <span>Download MP3</span>
            </button>
          </div>
        `;

        const btn = card.querySelector('.btn-download-audio');
        btn.onclick = () => {
          this.handleStreamDownload(stream, btn);
        };

        grid.appendChild(card);
      });
    }
  }

  async handleStreamDownload(stream, btn) {
    this.ui.playAudioFeedback('click');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="pulse-dot"></span> <span>Saving...</span>`;
    }

    try {
      const res = await this.ytDownloader.triggerDeviceDownload(stream);
      if (res && res.cancelled) {
        // User cancelled in Windows Save dialog
        return;
      }
    } catch (err) {
      this.ui.showToast(err.message || 'Unable to download stream', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origHtml;
      }
    }
  }

  /* ----------------------------------------------------
   * 3. MP4 to GIF Converter Module
   * ---------------------------------------------------- */
  bindGifConverter() {
    const dropzone = document.getElementById('gif-dropzone');
    const fileInput = document.getElementById('gif-file-input');
    const btnSampleVideo = document.getElementById('btn-sample-video');
    const videoEl = document.getElementById('preview-video');

    const fpsBtns = document.querySelectorAll('.fps-btn');
    const fpsSlider = document.getElementById('fps-slider');
    const fpsValueLabel = document.getElementById('fps-val-label');

    const scaleSlider = document.getElementById('scale-slider');
    const scaleValueLabel = document.getElementById('scale-val-label');

    const startTimeInput = document.getElementById('trim-start-time');
    const endTimeInput = document.getElementById('trim-end-time');
    const timelineSlider = document.getElementById('timeline-slider');

    const speedSelect = document.getElementById('gif-speed-select');
    const loopSelect = document.getElementById('gif-loop-select');
    const ditherToggle = document.getElementById('gif-dither-toggle');
    const aiSharpenToggle = document.getElementById('gif-ai-sharpen');
    const aiContrastToggle = document.getElementById('gif-ai-contrast');
    const watermarkInput = document.getElementById('gif-watermark-text');
    const watermarkPos = document.getElementById('gif-watermark-pos');

    const autoTuneBtns = document.querySelectorAll('.btn-autotune');

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.loadVideoFile(e.target.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.loadVideoFile(e.dataTransfer.files[0]);
      }
    });

    if (btnSampleVideo) {
      btnSampleVideo.addEventListener('click', () => {
        this.generateTestSampleVideo();
      });
    }

    fpsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        fpsBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedFps = parseInt(btn.dataset.fps, 10);
        if (fpsSlider) fpsSlider.value = this.selectedFps;
        if (fpsValueLabel) fpsValueLabel.textContent = `${this.selectedFps} FPS`;
        this.updateEstimatedFileSize();
      });
    });

    if (fpsSlider) {
      fpsSlider.addEventListener('input', (e) => {
        this.selectedFps = parseInt(e.target.value, 10);
        if (fpsValueLabel) fpsValueLabel.textContent = `${this.selectedFps} FPS`;
        fpsBtns.forEach(b => {
          b.classList.toggle('active', parseInt(b.dataset.fps, 10) === this.selectedFps);
        });
        this.updateEstimatedFileSize();
      });
    }

    if (scaleSlider) {
      scaleSlider.addEventListener('input', (e) => {
        this.selectedScale = parseFloat(e.target.value);
        if (scaleValueLabel) scaleValueLabel.textContent = `${Math.round(this.selectedScale * 100)}%`;
        this.updateEstimatedFileSize();
      });
    }

    if (timelineSlider && videoEl) {
      timelineSlider.addEventListener('input', (e) => {
        videoEl.currentTime = parseFloat(e.target.value);
      });

      videoEl.addEventListener('timeupdate', () => {
        timelineSlider.value = videoEl.currentTime;
      });
    }

    autoTuneBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        if (!this.gifConverter.videoDuration) {
          this.ui.showToast('Please load a video first', 'info');
          return;
        }

        const tuned = this.aiEngine.autoTuneGif(
          this.gifConverter.videoDuration,
          this.gifConverter.origWidth,
          this.gifConverter.origHeight,
          preset
        );

        this.selectedFps = tuned.fps;
        if (fpsSlider) fpsSlider.value = tuned.fps;
        if (fpsValueLabel) fpsValueLabel.textContent = `${tuned.fps} FPS`;
        fpsBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.fps, 10) === tuned.fps));

        const scaleVal = tuned.width / this.gifConverter.origWidth;
        this.selectedScale = Math.min(1.0, Math.max(0.25, parseFloat(scaleVal.toFixed(2))));
        if (scaleSlider) scaleSlider.value = this.selectedScale;
        if (scaleValueLabel) scaleValueLabel.textContent = `${Math.round(this.selectedScale * 100)}%`;

        if (ditherToggle) ditherToggle.checked = tuned.dither;

        this.ui.showToast(tuned.recommendationEn, 'success', 4000);
        this.ui.playAudioFeedback('pop');
        this.updateEstimatedFileSize();
      });
    });
  }

  /* ----------------------------------------------------
   * 4. LIVELY WORKING MODAL (Real-Time Rendering Studio)
   * ---------------------------------------------------- */
  bindLivelyWorkingModal() {
    const startConvertBtn = document.getElementById('btn-start-convert');
    const livelyModal = document.getElementById('lively-working-modal');
    const closeLivelyBtn = document.getElementById('btn-close-lively');
    const cancelLivelyBtn = document.getElementById('btn-cancel-lively');

    const stageRender = document.getElementById('lively-stage-render');
    const stageResult = document.getElementById('lively-stage-result');
    const errorContainer = document.getElementById('lively-error-container');
    const errorMsg = document.getElementById('lively-error-message');
    const retryBtn = document.getElementById('btn-lively-retry');

    const frameNumEl = document.getElementById('lively-frame-num');
    const progressFill = document.getElementById('lively-progress-fill');
    const percentText = document.getElementById('lively-percent-text');
    const statusText = document.getElementById('lively-status-text');

    const resultImg = document.getElementById('lively-result-img');
    const statDuration = document.getElementById('lively-stat-duration');
    const statDim = document.getElementById('lively-stat-dimensions');
    const statFps = document.getElementById('lively-stat-fps');
    const statFrames = document.getElementById('lively-stat-frames');
    const statSize = document.getElementById('lively-stat-size');
    const statFormat = document.getElementById('lively-stat-format');

    const downloadBtn = document.getElementById('btn-lively-download');
    const copyBtn = document.getElementById('btn-lively-copy');
    const anotherBtn = document.getElementById('btn-lively-another');

    const runConversion = async () => {
      if (!this.gifConverter.videoDuration) {
        this.ui.showToast('Please load a video first', 'error');
        return;
      }

      const startTimeInput = document.getElementById('trim-start-time');
      const endTimeInput = document.getElementById('trim-end-time');
      const speedSelect = document.getElementById('gif-speed-select');
      const loopSelect = document.getElementById('gif-loop-select');
      const aiSharpenToggle = document.getElementById('gif-ai-sharpen');
      const aiContrastToggle = document.getElementById('gif-ai-contrast');

      const startT = parseFloat(startTimeInput.value) || 0;
      const endT = parseFloat(endTimeInput.value) || this.gifConverter.videoDuration;
      const spd = parseFloat(speedSelect.value) || 1.0;
      const loopVal = parseInt(loopSelect.value, 10);

      // Reset Lively Modal stages
      if (errorContainer) errorContainer.style.display = 'none';
      stageRender.style.display = 'block';
      stageResult.style.display = 'none';
      progressFill.style.width = '0%';
      percentText.textContent = '0% Complete';
      statusText.textContent = 'Initializing FFmpeg Neural Pipeline...';

      livelyModal.classList.add('active');
      this.ui.playAudioFeedback('pop');

      try {
        const result = await this.gifConverter.convertToGif({
          fps: this.selectedFps,
          scale: this.selectedScale,
          startTime: startT,
          endTime: endT,
          speed: spd,
          loop: loopVal,
          enableAiSharpen: aiSharpenToggle ? aiSharpenToggle.checked : true,
          enableAiContrast: aiContrastToggle ? aiContrastToggle.checked : true,
          enableAiDenoise: false
        }, (liveUpdate) => {
          progressFill.style.width = `${liveUpdate.percent}%`;
          percentText.textContent = `${liveUpdate.percent}% Complete`;
          statusText.textContent = liveUpdate.statusText;
          if (frameNumEl) frameNumEl.textContent = `${liveUpdate.current} / ${liveUpdate.total}`;
        });

        // Transition to Stage 2: Final Result Ready
        stageRender.style.display = 'none';
        stageResult.style.display = 'block';

        resultImg.src = result.url;
        if (statDuration) statDuration.textContent = result.duration;
        if (statDim) statDim.textContent = result.resolution;
        if (statFps) statFps.textContent = `${result.fps} FPS`;
        if (statFrames) statFrames.textContent = `${result.framesCount} Frames`;
        if (statSize) statSize.textContent = result.sizeFormatted;
        if (statFormat) statFormat.textContent = result.format || 'GIF';

        this.ui.showToast('GIF created successfully with FFmpeg & AI optimization!', 'success');
        this.ui.playAudioFeedback('success');

        this.ui.saveToHistory({
          type: 'gif',
          title: `GIF Animation (${result.resolution})`,
          size: result.sizeFormatted,
          url: result.url
        });
      } catch (err) {
        stageRender.style.display = 'none';
        stageResult.style.display = 'none';
        if (errorContainer) {
          errorContainer.style.display = 'block';
          if (errorMsg) errorMsg.textContent = err.message || 'Conversion failed on server.';
        }
        this.ui.showToast(err.message || 'Conversion failed', 'error');
      }
    };

    if (startConvertBtn) {
      startConvertBtn.addEventListener('click', runConversion);
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', runConversion);
    }

    if (closeLivelyBtn) {
      closeLivelyBtn.addEventListener('click', () => {
        this.gifConverter.cancel();
        livelyModal.classList.remove('active');
      });
    }

    if (cancelLivelyBtn) {
      cancelLivelyBtn.addEventListener('click', () => {
        this.gifConverter.cancel();
        livelyModal.classList.remove('active');
        this.ui.showToast('Conversion cancelled', 'info');
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', async () => {
        try {
          await this.gifConverter.triggerDeviceDownload('vortex_animation.gif');
        } catch (err) {
          this.ui.showToast(err.message, 'error');
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        if (!this.gifConverter.generatedBlob && !this.gifConverter.generatedUrl) return;
        try {
          if (this.gifConverter.generatedBlob && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/gif': this.gifConverter.generatedBlob })
            ]);
            this.ui.showToast('GIF image copied to clipboard!', 'success');
          } else {
            await navigator.clipboard.writeText(window.location.origin + this.gifConverter.generatedUrl);
            this.ui.showToast('GIF URL copied to clipboard!', 'success');
          }
          this.ui.playAudioFeedback('pop');
        } catch (e) {
          try {
            await navigator.clipboard.writeText(window.location.origin + this.gifConverter.generatedUrl);
            this.ui.showToast('GIF link copied to clipboard!', 'success');
          } catch (err) {
            this.ui.showToast('Clipboard copy unavailable; please use Download to Device', 'info');
          }
        }
      });
    }

    if (anotherBtn) {
      anotherBtn.addEventListener('click', () => {
        livelyModal.classList.remove('active');
        const dropzone = document.getElementById('gif-dropzone');
        if (dropzone) dropzone.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  async loadVideoFile(file) {
    const editorWorkspace = document.getElementById('gif-editor-workspace');
    const startTimeInput = document.getElementById('trim-start-time');
    const endTimeInput = document.getElementById('trim-end-time');
    const timelineSlider = document.getElementById('timeline-slider');

    try {
      this.ui.showToast('Loading and initializing video stream...', 'info', 1500);
      const info = await this.gifConverter.loadVideo(file);

      editorWorkspace.style.display = 'grid';

      startTimeInput.value = 0;
      endTimeInput.value = Math.min(3.5, parseFloat(info.duration.toFixed(1)));
      startTimeInput.max = info.duration;
      endTimeInput.max = info.duration;

      if (timelineSlider) {
        timelineSlider.max = info.duration;
        timelineSlider.value = 0;
      }

      this.updateEstimatedFileSize();
      this.ui.showToast(`Video loaded (${info.width}x${info.height}) successfully!`, 'success');
      this.ui.playAudioFeedback('pop');

      editorWorkspace.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      this.ui.showToast(err.message, 'error');
    }
  }

  async generateTestSampleVideo() {
    this.ui.showToast('Generating neon test animation via FFmpeg...', 'info', 2000);
    try {
      const res = await fetch('/api/gif/sample');
      if (!res.ok) throw new Error("Could not fetch sample video from server.");
      const blob = await res.blob();
      await this.loadVideoFile(blob);
    } catch (err) {
      this.ui.showToast(err.message || 'Failed to load test sample', 'error');
    }
  }

  updateEstimatedFileSize() {
    const estEl = document.getElementById('est-file-size');
    if (!estEl || !this.gifConverter.videoDuration) return;

    const startT = parseFloat(document.getElementById('trim-start-time')?.value) || 0;
    const endT = parseFloat(document.getElementById('trim-end-time')?.value) || this.gifConverter.videoDuration;
    const duration = Math.max(0.5, endT - startT);

    const w = Math.min(540, Math.round(this.gifConverter.origWidth * this.selectedScale));
    const h = Math.round((w / this.gifConverter.origWidth) * this.gifConverter.origHeight);
    const fps = Math.min(20, this.selectedFps);

    const estMb = ((w * h * fps * duration) / (3.6 * 1024 * 1024)).toFixed(1);
    estEl.textContent = `Estimated Size: ~${estMb} MB (AI Safe Guard)`;
  }

  /* ----------------------------------------------------
   * 5. Settings Modal
   * ---------------------------------------------------- */
  bindSettings() {
    const btnSettings = document.getElementById('btn-open-settings');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('btn-close-settings');
    const soundToggle = document.getElementById('setting-sound-toggle');

    if (btnSettings && settingsModal) {
      btnSettings.addEventListener('click', () => {
        settingsModal.classList.add('active');
        this.ui.playAudioFeedback('click');
      });
    }

    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
      });
    }

    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        this.ui.soundEnabled = e.target.checked;
        this.ui.showToast(e.target.checked ? 'Sound effects enabled' : 'Sound effects muted', 'info');
      });
    }
  }

  /* ----------------------------------------------------
   * 6. History Module
   * ---------------------------------------------------- */
  bindHistory() {
    const btnHistory = document.getElementById('btn-open-history');
    const historyModal = document.getElementById('history-modal');
    const closeHistoryBtn = document.getElementById('btn-close-history');
    const clearHistoryBtn = document.getElementById('btn-clear-history');

    if (btnHistory && historyModal) {
      btnHistory.addEventListener('click', () => {
        this.renderHistoryList();
        historyModal.classList.add('active');
        this.ui.playAudioFeedback('click');
      });
    }

    if (closeHistoryBtn && historyModal) {
      closeHistoryBtn.addEventListener('click', () => {
        historyModal.classList.remove('active');
      });
    }

    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        this.ui.clearHistory();
        this.renderHistoryList();
      });
    }
  }

  renderHistoryList() {
    const historyList = document.getElementById('history-items-list');
    if (!historyList) return;

    const items = this.ui.getHistory();
    if (items.length === 0) {
      historyList.innerHTML = `
        <div style="text-align:center; padding: 30px; color: var(--text-dim);">
          <svg style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <p>No previous downloads in history yet.</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = '';
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'glass-card-sm';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'space-between';
      el.style.marginBottom = '10px';

      el.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
          <span class="neon-badge ${item.type === 'youtube' ? 'neon-badge-uhd' : 'neon-badge-ai'}">${item.type.toUpperCase()}</span>
          <div style="overflow: hidden;">
            <div style="font-weight: 700; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px;">${item.title}</div>
            <div style="font-size: 0.78rem; color: var(--text-dim);">${item.timestamp} ${item.duration ? '• ' + item.duration : ''}</div>
          </div>
        </div>
        ${item.url ? `<a href="${item.url}" target="_blank" class="btn btn-secondary btn-sm">Open</a>` : ''}
      `;
      historyList.appendChild(el);
    });
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(reg => console.log('Service Worker registered:', reg.scope))
        .catch(err => console.warn('Service Worker registration skipped:', err));
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.vortexApp = new App();
});
