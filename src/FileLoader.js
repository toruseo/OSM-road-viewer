/**
 * FileLoader - Manages GeoJSON file loading with Web Worker
 */
import ParserWorker from './worker/parser.worker.js?worker';

export class FileLoader {
  constructor(options = {}) {
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});

    this.worker = null;
    this.isLoading = false;
  }

  /**
   * Initialize the file input UI
   */
  initUI() {
    this.fileInput = document.getElementById('file-input');
    this.fileButton = document.getElementById('file-button');
    this.progressContainer = document.getElementById('progress-container');
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');
    this.stats = document.getElementById('stats');

    this.fileButton.addEventListener('click', () => {
      if (!this.isLoading) {
        this.fileInput.click();
      }
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadFile(file);
      }
    });

    // Support drag and drop
    const mapContainer = document.getElementById('map');
    mapContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    mapContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.geojson') || file.name.endsWith('.json'))) {
        this.loadFile(file);
      }
    });
  }

  /**
   * Load a GeoJSON file using Web Worker
   * @param {File} file - The file to load
   */
  loadFile(file) {
    if (this.isLoading) {
      console.warn('Already loading a file');
      return;
    }

    this.isLoading = true;
    this.showProgress();
    this.fileButton.disabled = true;
    this.fileButton.textContent = '読み込み中...';
    this.stats.style.display = 'none';

    // Create new worker
    if (this.worker) {
      this.worker.terminate();
    }
    this.worker = new ParserWorker();

    const startTime = performance.now();

    this.worker.onmessage = (event) => {
      const { type, progress, message, geojson, error } = event.data;

      switch (type) {
        case 'progress':
          this.updateProgress(progress, message);
          this.onProgress(progress, message);
          break;

        case 'complete':
          const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
          this.hideProgress();
          this.showStats(file, geojson, elapsed);
          this.isLoading = false;
          this.fileButton.disabled = false;
          this.fileButton.textContent = 'GeoJSONファイルを選択';
          this.worker.terminate();
          this.worker = null;
          this.onComplete(geojson);
          break;

        case 'error':
          this.hideProgress();
          this.isLoading = false;
          this.fileButton.disabled = false;
          this.fileButton.textContent = 'GeoJSONファイルを選択';
          this.worker.terminate();
          this.worker = null;
          this.onError(new Error(error));
          break;
      }
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
      this.hideProgress();
      this.isLoading = false;
      this.fileButton.disabled = false;
      this.fileButton.textContent = 'GeoJSONファイルを選択';
      this.worker.terminate();
      this.worker = null;
      this.onError(error);
    };

    // Send file to worker
    this.worker.postMessage({ file });
  }

  /**
   * Show progress UI
   */
  showProgress() {
    this.progressContainer.style.display = 'block';
    this.progressFill.style.width = '0%';
    this.progressText.textContent = '読み込み開始...';
  }

  /**
   * Update progress UI
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} message - Progress message
   */
  updateProgress(progress, message) {
    this.progressFill.style.width = `${progress}%`;
    this.progressText.textContent = message;
  }

  /**
   * Hide progress UI
   */
  hideProgress() {
    this.progressContainer.style.display = 'none';
  }

  /**
   * Show stats after loading
   * @param {File} file - The loaded file
   * @param {Object} geojson - The parsed GeoJSON
   * @param {string} elapsed - Elapsed time in seconds
   */
  showStats(file, geojson, elapsed) {
    const fileSize = this.formatBytes(file.size);
    const featureCount = geojson?.features?.length || 0;
    this.stats.innerHTML = `
      <strong>${file.name}</strong><br>
      サイズ: ${fileSize}<br>
      フィーチャー数: ${featureCount.toLocaleString()}<br>
      処理時間: ${elapsed}秒
    `;
    this.stats.style.display = 'block';
  }

  /**
   * Format bytes to human readable string
   * @param {number} bytes - Number of bytes
   * @returns {string} - Formatted string
   */
  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
