/**
 * UI Manager: Complete Localization (AR / EN), Notifications, Audio Feedback,
 * History, and Smart Cross-Platform Device Downloader (File Explorer on PC, Share on Mobile).
 */

export class UIManager {
  constructor() {
    this.soundEnabled = true;
    this.currentLang = localStorage.getItem('nexus_lang') || 'ar';
    this.audioCtx = null;
    this.historyKey = 'nexus_tools_history_v2';

    // Full Site Localization Dictionary
    this.dictionary = {
      ar: {
        appName: 'نيكسوس ميديا ستوديو',
        appSubtitle: 'منصة أدوات الوسائط الذكية • Dark & Neon Purple Edition',
        ytTab: 'تحميل يوتيوب (URL)',
        gifTab: 'محول MP4 إلى GIF',
        historyBtn: 'السجل',
        settingsBtn: 'الإعدادات',
        langBtnLabel: 'English',
        
        // YouTube Downloader
        ytBadge: 'يدعم جودات 8K / 4K / 1080p / MP3 مضغوطة بالذكاء الاصطناعي',
        ytHeading: 'تنزيل فيديوهات وصوتيات يوتيوب بالرابط',
        ytSubheading: 'ضع رابط أي فيديو أو شورتس من يوتيوب لاستخراج كافة الجودات وتحميلها مباشرة إلى جهازك بسرعة فائقة وبأحجام محسنة.',
        ytPlaceholder: 'ألصق رابط الفيديو هنا: https://www.youtube.com/watch?v=...',
        pasteBtn: 'لصق',
        fetchBtn: 'استخراج الجودات',
        sampleBtn: '⚡ تجربة رابط نموذجي سريع',
        serverLabel: 'خادم التنزيل:',
        server1: 'خادم 1: Ultra CDN (الأسرع)',
        server2: 'خادم 2: Cloudflare Edge (عالمي)',
        server3: 'خادم 3: Direct Stream (المباشر للجهاز)',
        subtabVideo: 'فيديو (MP4 / WebM)',
        subtabAudio: 'صوت نقي (MP3 / M4A)',
        downloadToDevice: 'تحميل للجهاز',
        downloadStarted: 'جاري حفظ الملف على جهازك...',
        downloadSuccess: 'تم تنزيل الملف بنجاح على جهازك!',
        copySuccess: 'تم النسخ إلى الحافظة بنجاح!',
        errorUrl: 'يرجى إدخال رابط يوتيوب صالح أولاً',
        aiAdvisorTitle: 'نصيحة الذكاء الاصطناعي لتحسين الجودة وتقليص الحجم',
        aiAdvisorDesc: 'جاري تحليل جودة المقطع ونسبة الضغط الأفضل لتوفير المساحة مع الحفاظ على وضوح ناصع...',

        // MP4 to GIF
        gifBadge: 'معالجة فورية محلية 100% مع تحسين الحجم بالذكاء الاصطناعي',
        gifHeading: 'محول MP4 إلى GIF عالي الدقة وتقليص الحجم',
        gifSubheading: 'تحكم كامل في معدل الإطارات (FPS)، الجودة، الأبعاد، قص الفيديو، مع خوارزميات الذكاء الاصطناعي لمنع تضخم الحجم والحفاظ على حدة الصورة.',
        dropzoneTitle: 'اسحب وأفلت ملف الفيديو هنا أو اضغط للاختيار',
        dropzoneDesc: 'يدعم صيغ MP4, WebM, MOV بدون رفع إلى السيرفر (خصوصية تامة وسرعة خيالية)',
        browseBtn: 'تصفح الملفات',
        sampleVideoBtn: '⚡ إنشاء مقطع فيديو نيون تجريبي سريع (1-Click Test)',
        timelineHeader: 'شريط المعاينة والقص الزمني',
        trimStartLabel: 'بداية القص (ثواني):',
        trimEndLabel: 'نهاية القص (ثواني):',
        aiAutoTuneTitle: 'الضبط الذكي لمنع تضخم الحجم (AI Smart Size Limiter):',
        fpsLabel: 'معدل الإطارات (FPS):',
        scaleLabel: 'حجم ودقة الإخراج (Scale):',
        speedLabel: 'سرعة التشغيل:',
        loopLabel: 'نمط التكرار (Loop):',
        aiSharpenTitle: 'توضيح الإطارات بالذكاء الاصطناعي (AI Sharpen)',
        aiSharpenDesc: 'يمنع التغبيش مع تقليص حجم الملف',
        aiContrastTitle: 'تعزيز التباين وتوهج الألوان (AI Contrast)',
        aiContrastDesc: 'ألوان زاهية وواضحة جداً',
        aiDitherTitle: 'تنعيم التدرجات اللوني (Floyd-Steinberg Dithering)',
        aiDitherDesc: 'يمنع تقطع الألوان وتدرجات الظل',
        watermarkLabel: 'نص توضيحي / علامة مائية (اختياري):',
        watermarkPlaceholder: 'اكتب نصاً لإضافته على الـ GIF...',
        watermarkPosLabel: 'الموضع:',
        posBottom: 'الأسفل',
        posMiddle: 'الوسط',
        posTop: 'الأعلى',
        convertBtn: 'تحويل إلى GIF الآن',
        converting: 'جاري التحويل...',
        cancelConvert: 'إلغاء التحويل',
        resultReadyTitle: 'جاهز للتنزيل والمشاركة',
        downloadGifBtn: 'تحميل النتيجة إلى الجهاز (هاتف / حاسوب)',
        copyGifBtn: 'نسخ إلى الحافظة',

        // Settings & History Modal
        settingsTitle: 'إعدادات النظام والتخصيص',
        soundToggleTitle: 'المؤثرات الصوتية التفاعلية',
        soundToggleDesc: 'أصوات نقر ومؤشرات نقاء صوتية',
        hwToggleTitle: 'تسريع العتاد للكانفاس (Hardware Acceleration)',
        hwToggleDesc: 'استخدام بطاقة الرسوميات لمعالجة الـ GIF بسرعة',
        historyTitle: 'سجل التحميلات والتحويلات',
        clearHistoryBtn: 'مسح السجل بالكامل',
        historyEmpty: 'لا توجد تحميلات سابقة في السجل حتى الآن.',
        localStoredNote: 'محفوظ محلياً في متصفحك'
      },
      en: {
        appName: 'Nexus Media Studio',
        appSubtitle: 'Smart Media Tools Suite • Dark & Neon Purple Edition',
        ytTab: 'YouTube Downloader (URL)',
        gifTab: 'MP4 to GIF Converter',
        historyBtn: 'History',
        settingsBtn: 'Settings',
        langBtnLabel: 'العربية',

        // YouTube Downloader
        ytBadge: 'Supports 8K / 4K / 1080p / MP3 AI-Compressed Qualities',
        ytHeading: 'Download YouTube Videos & Audio by URL',
        ytSubheading: 'Paste any YouTube video or Shorts link to extract all resolutions and download directly to your device with smart size compression.',
        ytPlaceholder: 'Paste YouTube URL here: https://www.youtube.com/watch?v=...',
        pasteBtn: 'Paste',
        fetchBtn: 'Extract Qualities',
        sampleBtn: '⚡ Quick Test Sample URL',
        serverLabel: 'Download Server:',
        server1: 'Server 1: Ultra CDN (Fastest)',
        server2: 'Server 2: Cloudflare Edge (Global)',
        server3: 'Server 3: Direct Stream (Direct to Device)',
        subtabVideo: 'Video (MP4 / WebM)',
        subtabAudio: 'Pure Audio (MP3 / M4A)',
        downloadToDevice: 'Download to Device',
        downloadStarted: 'Saving file to your device...',
        downloadSuccess: 'File downloaded successfully to your device!',
        copySuccess: 'Copied to clipboard successfully!',
        errorUrl: 'Please enter a valid YouTube URL first',
        aiAdvisorTitle: 'AI Quality & Size Optimization Advisor',
        aiAdvisorDesc: 'Analyzing video bitrate and applying optimal compression for crisp clarity with reduced storage footprint...',

        // MP4 to GIF
        gifBadge: '100% In-Browser Local Processing with AI Size Optimization',
        gifHeading: 'High-Fidelity MP4 to GIF Converter & Compressor',
        gifSubheading: 'Full control over FPS, resolution, video trimming, and AI sharpening filters to prevent bloated file sizes and preserve razor-sharp details.',
        dropzoneTitle: 'Drag & Drop video file here or click to browse',
        dropzoneDesc: 'Supports MP4, WebM, MOV with zero server upload (100% Private & Instant)',
        browseBtn: 'Browse Files',
        sampleVideoBtn: '⚡ Generate Neon Sample Video (1-Click Test)',
        timelineHeader: 'Video Timeline & Trimming Scrubber',
        trimStartLabel: 'Trim Start (seconds):',
        trimEndLabel: 'Trim End (seconds):',
        aiAutoTuneTitle: 'AI Smart Size Limiter (Prevents Huge Files):',
        fpsLabel: 'Frame Rate (FPS):',
        scaleLabel: 'Output Scale & Quality:',
        speedLabel: 'Playback Speed:',
        loopLabel: 'Loop Mode:',
        aiSharpenTitle: 'AI Frame Sharpening (AI Sharpen)',
        aiSharpenDesc: 'Eliminates blurriness while minimizing file size',
        aiContrastTitle: 'AI Contrast & Color Vibrance',
        aiContrastDesc: 'Vivid, high-impact neon color grades',
        aiDitherTitle: 'Floyd-Steinberg Dithering',
        aiDitherDesc: 'Smooths out color gradients and eliminates banding',
        watermarkLabel: 'Watermark / Text Overlay (Optional):',
        watermarkPlaceholder: 'Type text overlay for GIF...',
        watermarkPosLabel: 'Position:',
        posBottom: 'Bottom',
        posMiddle: 'Middle',
        posTop: 'Top',
        convertBtn: 'Convert to GIF Now',
        converting: 'Converting...',
        cancelConvert: 'Cancel Conversion',
        resultReadyTitle: 'Ready to Download & Share',
        downloadGifBtn: 'Download to Device (Phone / PC)',
        copyGifBtn: 'Copy to Clipboard',

        // Settings & History Modal
        settingsTitle: 'System Settings & Preferences',
        soundToggleTitle: 'Interactive UI Sound Effects',
        soundToggleDesc: 'Subtle clicks and acoustic feedback',
        hwToggleTitle: 'Hardware Acceleration for Canvas',
        hwToggleDesc: 'Utilizes GPU for accelerated GIF encoding',
        historyTitle: 'Download & Conversion History',
        clearHistoryBtn: 'Clear History',
        historyEmpty: 'No previous downloads in history yet.',
        localStoredNote: 'Stored locally in your browser'
      }
    };
  }

  /**
   * Accurate device detection: true strictly for Mobile Phones and Tablets
   */
  isMobileDevice() {
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isIPadOS = navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua) && window.innerWidth <= 1024;
    return isMobileUA || isIPadOS;
  }

  /**
   * Applies language change across the entire website
   */
  setLanguage(lang) {
    if (!this.dictionary[lang]) lang = 'ar';
    this.currentLang = lang;
    localStorage.setItem('nexus_lang', lang);

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('dir-ltr', lang === 'en');

    // Update all text nodes with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (this.dictionary[lang] && this.dictionary[lang][key]) {
        el.textContent = this.dictionary[lang][key];
      }
    });

    // Update input placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (this.dictionary[lang] && this.dictionary[lang][key]) {
        el.placeholder = this.dictionary[lang][key];
      }
    });

    // Update language toggle button label
    const langLabel = document.querySelector('#btn-toggle-lang .lang-label');
    if (langLabel) {
      langLabel.textContent = lang === 'ar' ? 'English' : 'العربية';
    }

    this.showToast(lang === 'ar' ? 'تم تحويل لغة الموقع إلى العربية' : 'Website language switched to English', 'info', 2000);
  }

  /* ----------------------------------------------------
   * Smart Cross-Platform Device Downloader
   * - Computer / PC: Opens native Windows/Mac File Explorer save dialog or standard browser download
   * - Phone / Tablet: Uses Mobile Web Share sheet (Save to Photos / Files)
   * ---------------------------------------------------- */
  async downloadBlobToDevice(blob, filename, mimeType = 'application/octet-stream') {
    const isMobile = this.isMobileDevice();
    const t = this.dictionary[this.currentLang];

    this.showToast(t.downloadStarted, 'info', 2000);

    // 1. If on Mobile Device (Phone / Tablet):
    if (isMobile && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: mimeType });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: filename,
            text: `Nexus Media Studio - ${filename}`
          });
          this.showToast(t.downloadSuccess, 'success');
          return { success: true, method: 'mobile-share' };
        }
      } catch (err) {
        if (err.name === 'AbortError') return { cancelled: true };
      }
    }

    // 2. If on Computer / PC: Try File System Access API (Native Windows/Mac Save Dialog)
    if (!isMobile && 'showSaveFilePicker' in window) {
      try {
        const extension = filename.split('.').pop() || 'bin';
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'Media File',
              accept: { [mimeType]: [`.${extension}`] }
            }
          ]
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

        this.showToast(t.downloadSuccess, 'success');
        this.playAudioFeedback('success');
        return { success: true, method: 'pc-file-picker' };
      } catch (err) {
        if (err.name === 'AbortError') {
          return { cancelled: true };
        }
        console.warn("showSaveFilePicker fallback to anchor download", err);
      }
    }

    // 3. Universal High-Compatibility Anchor Download (Directly into Computer's Downloads folder)
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 4000);

    this.showToast(t.downloadSuccess, 'success');
    this.playAudioFeedback('success');
    return { success: true, method: 'direct-anchor' };
  }

  /**
   * Immediately opens the native Windows File Explorer "Save As" window
   * upon user click before any async delays.
   */
  async promptSaveFilePicker(filename, mimeType = 'video/mp4') {
    if (!this.isMobileDevice() && 'showSaveFilePicker' in window) {
      try {
        const extension = filename.split('.').pop() || 'mp4';
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: mimeType.startsWith('audio') ? 'Audio File' : 'Video File',
              accept: { [mimeType]: [`.${extension}`] }
            }
          ]
        });
        return handle;
      } catch (err) {
        if (err.name === 'AbortError') {
          return null; // User clicked Cancel in Windows dialog
        }
        console.warn("showSaveFilePicker error:", err);
      }
    }
    return null;
  }

  /**
   * Streams remote media URL directly into a selected Windows File Handle,
   * or triggers browser download without external popup windows.
   */
  async saveStreamUrlToDevice(streamUrl, filename, fileHandle = null, mimeType = 'video/mp4') {
    const t = this.dictionary[this.currentLang] || this.dictionary.en;

    if (fileHandle) {
      try {
        this.showToast("Saving file directly to your selected folder...", "info", 2500);
        const res = await fetch(streamUrl);
        if (res.ok) {
          const writable = await fileHandle.createWritable();
          if (res.body && typeof res.body.pipeTo === 'function') {
            await res.body.pipeTo(writable);
          } else {
            const blob = await res.blob();
            await writable.write(blob);
            await writable.close();
          }
          this.showToast(t.downloadSuccess, "success");
          this.playAudioFeedback("success");
          return { success: true, method: "pc-file-picker" };
        }
      } catch (err) {
        console.warn("Stream pipe to file handle error, falling back to direct link", err);
      }
    }

    // Direct Browser Download (Mobile or fallback - NO external popup window!)
    const link = document.createElement('a');
    link.href = streamUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 3000);

    this.showToast(t.downloadSuccess, "success");
    this.playAudioFeedback("success");
    return { success: true, method: "direct-stream" };
  }

  /* ----------------------------------------------------
   * Toast Notifications
   * ---------------------------------------------------- */
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-card toast-${type} animate-slide-in`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
      this.playAudioFeedback('success');
    } else if (type === 'error') {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
      this.playAudioFeedback('error');
    } else {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
      this.playAudioFeedback('pop');
    }

    toast.innerHTML = `
      <div class="toast-content">
        ${iconSvg}
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    toast.querySelector('.toast-close').onclick = () => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 250);
    };

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }

  /* ----------------------------------------------------
   * Web Audio UI Sound Effects
   * ---------------------------------------------------- */
  playAudioFeedback(type = 'click') {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      // Ignore audio policy issues
    }
  }

  /* ----------------------------------------------------
   * History Management
   * ---------------------------------------------------- */
  saveToHistory(item) {
    try {
      const history = this.getHistory();
      history.unshift({
        id: 'hist_' + Date.now(),
        timestamp: new Date().toLocaleString(this.currentLang === 'ar' ? 'ar-EG' : 'en-US'),
        ...item
      });
      const trimmed = history.slice(0, 30);
      localStorage.setItem(this.historyKey, JSON.stringify(trimmed));
    } catch (e) {
      console.warn("Could not save to localStorage history", e);
    }
  }

  getHistory() {
    try {
      const data = localStorage.getItem(this.historyKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  clearHistory() {
    localStorage.removeItem(this.historyKey);
    this.showToast(this.currentLang === 'ar' ? 'تم مسح السجل بالكامل' : 'History cleared successfully', 'info');
  }
}

if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
}
