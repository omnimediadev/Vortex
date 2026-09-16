/**
 * Vortex Studio - MP4 to GIF Converter Engine
 * Implements "Lively Working" real-time live canvas rendering,
 * AI sharpening convolution, frame decimation, and strict size limiting.
 */

import { FastGIFEncoder } from './lib/gif-encoder.js';
import { NexusAIEngine } from './ai-engine.js';

export class GifConverter {
  constructor(uiManager) {
    this.ui = uiManager;
    this.aiEngine = new NexusAIEngine();
    this.currentFile = null;
    this.videoDuration = 0;
    this.origWidth = 0;
    this.origHeight = 0;
    this.isConverting = false;
    this.shouldCancel = false;

    this.generatedBlob = null;
    this.generatedUrl = null;
  }

  getVideoElement() {
    return document.getElementById('preview-video');
  }

  async loadVideo(fileOrUrl) {
    const video = this.getVideoElement();
    if (!video) throw new Error("Video player element not found");

    let src = '';
    if (typeof fileOrUrl === 'string') {
      const res = await fetch(fileOrUrl);
      const blob = await res.blob();
      this.currentFile = blob;
      src = URL.createObjectURL(blob);
    } else if (fileOrUrl instanceof Blob) {
      this.currentFile = fileOrUrl;
      src = URL.createObjectURL(fileOrUrl);
    } else {
      throw new Error("Unsupported file format. Please upload MP4, WebM, or MOV.");
    }

    return new Promise((resolve, reject) => {
      video.src = src;
      video.muted = true;
      video.playsInline = true;
      video.load();

      const onMetadata = () => {
        video.removeEventListener('loadedmetadata', onMetadata);
        this.videoDuration = video.duration || 5;
        this.origWidth = video.videoWidth || 640;
        this.origHeight = video.videoHeight || 360;

        resolve({
          duration: this.videoDuration,
          width: this.origWidth,
          height: this.origHeight,
          src: src
        });
      };

      video.addEventListener('loadedmetadata', onMetadata);
      video.onerror = () => {
        reject(new Error("Failed to decode video file."));
      };
    });
  }

  /**
   * Converts video to GIF using backend FFmpeg Two-Pass Palette & AI Filters
   */
  async convertToGif(options, onLiveUpdate) {
    const video = this.getVideoElement();
    if (!video || !this.videoDuration) {
      throw new Error("No video file loaded.");
    }

    if (!this.currentFile) {
      throw new Error("Video file data is not available. Please re-upload.");
    }

    this.isConverting = true;
    this.shouldCancel = false;

    if (this.generatedUrl && this.generatedUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(this.generatedUrl); } catch(e) {}
    }
    this.generatedBlob = null;
    this.generatedUrl = null;

    const {
      fps = 15,
      scale = 0.5,
      startTime = 0,
      endTime = Math.min(this.videoDuration, 4),
      speed = 1.0,
      loop = 0,
      enableAiSharpen = true,
      enableAiContrast = true,
      enableAiDenoise = false
    } = options;

    const start = Math.max(0, startTime);
    const end = Math.min(this.videoDuration, Math.max(start + 0.2, endTime));

    // Live canvas visual feedback in modal
    const liveCanvas = document.getElementById('lively-canvas');
    if (liveCanvas) {
      liveCanvas.width = 480;
      liveCanvas.height = 270;
      const ctx = liveCanvas.getContext('2d');
      try {
        ctx.drawImage(video, 0, 0, 480, 270);
      } catch(e) {}
    }

    if (onLiveUpdate) {
      onLiveUpdate({
        stage: 'init',
        current: 1,
        total: 4,
        percent: 15,
        statusText: 'Submitting media stream to FFmpeg Neural Pipeline...'
      });
    }

    // Build multipart FormData for server
    const formData = new FormData();
    formData.append('video', this.currentFile, 'input_video.mp4');
    formData.append('start', start.toString());
    formData.append('end', end.toString());
    formData.append('fps', fps.toString());
    formData.append('scale', scale.toString());
    formData.append('speed', speed.toString());
    formData.append('loop', loop.toString());
    formData.append('ai_sharpen', enableAiSharpen ? 'true' : 'false');
    formData.append('ai_contrast', enableAiContrast ? 'true' : 'false');
    formData.append('ai_denoise', enableAiDenoise ? 'true' : 'false');

    // Simulate progressive stage updates while FFmpeg compiles 2-pass palette
    let progressTimer = setInterval(() => {
      if (onLiveUpdate && this.isConverting) {
        onLiveUpdate({
          stage: 'processing',
          current: 2,
          total: 4,
          percent: 55,
          statusText: 'Pass 1 & 2: Compiling 256-color palette & Bayer dithering...'
        });
      }
    }, 600);

    let resData;
    try {
      const response = await fetch('/api/gif/convert', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressTimer);

      resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "FFmpeg conversion failed on server.");
      }

      if (onLiveUpdate) {
        onLiveUpdate({
          stage: 'downloading',
          current: 4,
          total: 4,
          percent: 92,
          statusText: 'Probing real frame count and final file size...'
        });
      }

      // Download the generated GIF blob into browser memory
      const blobRes = await fetch(resData.gif_url);
      const gifBlob = await blobRes.blob();

      this.generatedBlob = gifBlob;
      this.generatedUrl = resData.gif_url;
      this.isConverting = false;

      if (onLiveUpdate) {
        onLiveUpdate({
          stage: 'complete',
          current: 4,
          total: 4,
          percent: 100,
          statusText: 'GIF conversion completed successfully!'
        });
      }

      return {
        blob: gifBlob,
        url: resData.gif_url,
        duration: resData.duration,
        resolution: resData.resolution,
        fps: resData.fps,
        framesCount: resData.frames,
        sizeFormatted: resData.file_size,
        format: resData.format || 'GIF'
      };
    } catch (err) {
      clearInterval(progressTimer);
      this.isConverting = false;
      throw err;
    }
  }

  cancel() {
    this.shouldCancel = true;
    this.isConverting = false;
  }

  seekVideoDirect(video, time) {
    return new Promise((resolve) => {
      let resolved = false;
      const finish = () => {
        if (resolved) return;
        resolved = true;
        video.removeEventListener('seeked', onSeeked);
        requestAnimationFrame(() => {
          setTimeout(resolve, 20);
        });
      };

      const onSeeked = () => {
        if ('requestVideoFrameCallback' in video) {
          try {
            video.requestVideoFrameCallback(() => finish());
            setTimeout(finish, 60);
            return;
          } catch (e) {
            finish();
          }
        } else {
          finish();
        }
      };

      const targetTime = Math.max(0, Math.min(video.duration - 0.02, time));
      video.addEventListener('seeked', onSeeked, { once: true });
      video.currentTime = targetTime;

      setTimeout(finish, 280);
    });
  }

  isFramePitchBlack(ctx, width, height) {
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      let nonZeroCount = 0;
      const step = Math.max(4, Math.floor(data.length / 150));
      for (let i = 0; i < data.length; i += step) {
        if (data[i] > 10 || data[i + 1] > 10 || data[i + 2] > 10) {
          nonZeroCount++;
        }
      }
      return nonZeroCount < 3;
    } catch (e) {
      return false;
    }
  }

  drawWatermark(ctx, text, width, height, position = 'bottom') {
    ctx.save();
    const fontSize = Math.max(12, Math.round(width * 0.038));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';

    let y = height - 16;
    if (position === 'top') y = fontSize + 16;
    if (position === 'middle') y = height / 2;
    const x = width / 2;

    ctx.shadowColor = 'rgba(168, 85, 247, 0.9)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#05030a';
    ctx.lineWidth = 4;
    ctx.strokeText(text, x, y);

    ctx.fillStyle = '#f3e8ff';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  async triggerDeviceDownload(filename = 'vortex_animation.gif') {
    if (!this.generatedBlob) {
      throw new Error("No GIF file ready for download.");
    }
    if (this.ui) {
      return await this.ui.downloadBlobToDevice(this.generatedBlob, filename, 'image/gif');
    }
    const a = document.createElement('a');
    a.href = this.generatedUrl;
    a.download = filename;
    a.click();
    return { success: true };
  }
}
if (typeof window !== 'undefined') {
  window.GifConverter = GifConverter;
}
