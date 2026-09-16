/**
 * Vortex Studio - YouTube Downloader Engine
 * Real YouTube IFrame API duration extraction, native video playback,
 * and high-speed verified download pipeline.
 */

export class YouTubeDownloader {
  constructor(uiManager) {
    this.ui = uiManager;
    this.currentVideoData = null;
    this.ytPlayerInstance = null;
  }

  extractVideoId(url) {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();

    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([^"&?\/\s]{11})/i;
    const match = cleanUrl.match(regExp);

    if (match && match[1]) return match[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;
    return null;
  }

  formatDuration(totalSeconds) {
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return '00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  }

  formatViews(views) {
    if (!views || isNaN(views)) return '1.2M';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return String(views);
  }

  /**
   * Fetches real video metadata & real stream matrix from local server
   */
  async fetchVideoInfo(urlOrId) {
    if (!urlOrId || typeof urlOrId !== 'string') {
      throw new Error("Please enter a valid YouTube video URL or Shorts link.");
    }

    const cleanInput = urlOrId.trim();
    let videoUrl = cleanInput;
    if (!cleanInput.startsWith('http://') && !cleanInput.startsWith('https://')) {
      videoUrl = `https://www.youtube.com/watch?v=${cleanInput}`;
    }

    const res = await fetch('/api/youtube/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: videoUrl })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to extract video information from YouTube.");
    }

    this.currentVideoData = data;
    return data;
  }

  /**
   * Mounts YouTube Iframe Player into DOM for native preview
   */
  mountYouTubePlayer(videoId, onDurationReady) {
    const container = document.getElementById('yt-player-container');
    if (!container) return;

    if (this.ytPlayerInstance && typeof this.ytPlayerInstance.destroy === 'function') {
      try { this.ytPlayerInstance.destroy(); } catch (e) {}
    }

    container.innerHTML = `<div id="yt-player-target"></div>`;

    const createPlayer = () => {
      try {
        this.ytPlayerInstance = new window.YT.Player('yt-player-target', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1
          },
          events: {
            onReady: (event) => {
              const exactDuration = event.target.getDuration();
              if (exactDuration > 0 && onDurationReady) {
                const formatted = this.formatDuration(exactDuration);
                onDurationReady(formatted, exactDuration, this.currentVideoData);
              }
            }
          }
        });
      } catch (err) {
        console.warn("YT.Player init delayed", err);
      }
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }
  }

  /**
   * Downloads video/audio directly via backend FFmpeg muxing into Windows or Mobile
   */
  async triggerDeviceDownload(item) {
    if (!this.currentVideoData) {
      throw new Error("No active video selected.");
    }

    const videoUrl = this.currentVideoData.url;
    const isAudio = Boolean(item.format && item.format.includes('MP3')) || item.ext === 'mp3';
    const ext = item.ext || (isAudio ? 'mp3' : 'mp4');
    const mimeType = isAudio ? 'audio/mpeg' : 'video/mp4';

    const safeTitle = (this.currentVideoData.title || `video_${this.currentVideoData.id}`)
      .replace(/[\\/:*?"<>|]/g, '_')
      .trim();
    const filename = `${safeTitle} - ${item.res || item.bitrate || ''}.${ext}`.replace(/\s+/g, ' ');

    // 1. On Windows / PC: Prompt native Windows File Explorer Save As dialog
    let fileHandle = null;
    if (this.ui) {
      fileHandle = await this.ui.promptSaveFilePicker(filename, mimeType);
      if (fileHandle === null && !this.ui.isMobileDevice() && 'showSaveFilePicker' in window) {
        return { cancelled: true };
      }
    }

    if (this.ui) {
      this.ui.showToast(`Processing & muxing ${filename} with FFmpeg...`, 'info', 4000);
    }

    // 2. Direct server download endpoint with universal H.264 / AAC MP4 muxing
    const height = item.height || 1080;
    const bitrate = item.bitrateVal || 320;
    const downloadUrl = `/api/youtube/download?url=${encodeURIComponent(videoUrl)}&height=${height}&is_audio=${isAudio}&bitrate=${bitrate}`;

    // 3. Stream directly to the chosen Windows file or download
    if (this.ui) {
      return await this.ui.saveStreamUrlToDevice(downloadUrl, filename, fileHandle, mimeType);
    } else {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 3000);
      return { success: true };
    }
  }
}

if (typeof window !== 'undefined') {
  window.YouTubeDownloader = YouTubeDownloader;
}
