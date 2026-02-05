/**
 * GeoJSON Parser Web Worker
 * Handles streaming parsing of large GeoJSON files
 */

self.onmessage = async (event) => {
  const { file } = event.data;

  try {
    const geojson = await parseGeoJSONStream(file);

    // Send completed data back to main thread
    self.postMessage({
      type: 'complete',
      geojson: geojson
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
};

/**
 * Parse GeoJSON file using streaming for memory efficiency
 * @param {File} file - The GeoJSON file to parse
 * @returns {Promise<Array>} - Parsed features
 */
async function parseGeoJSONStream(file) {
  const fileSize = file.size;
  let processedBytes = 0;
  let lastProgressReport = 0;

  // For very large files, use chunked reading
  const CHUNK_SIZE = 64 * 1024 * 1024; // 64MB chunks

  if (fileSize > CHUNK_SIZE) {
    // Use streaming approach for large files
    return await parseWithStream(file, fileSize);
  } else {
    // For smaller files, read all at once
    return await parseDirectly(file, fileSize);
  }
}

/**
 * Parse file directly (for smaller files)
 */
async function parseDirectly(file, fileSize) {
  self.postMessage({
    type: 'progress',
    progress: 0,
    message: 'ファイルを読み込み中...'
  });

  const text = await file.text();

  self.postMessage({
    type: 'progress',
    progress: 50,
    message: 'JSONをパース中...'
  });

  const geojson = JSON.parse(text);

  self.postMessage({
    type: 'progress',
    progress: 80,
    message: 'フィーチャーを処理中...'
  });

  const normalized = normalizeGeoJSON(geojson);

  self.postMessage({
    type: 'progress',
    progress: 100,
    message: '完了'
  });

  return normalized;
}

/**
 * Parse file using ReadableStream (for large files)
 */
async function parseWithStream(file, fileSize) {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let processedBytes = 0;

  self.postMessage({
    type: 'progress',
    progress: 0,
    message: 'ストリーミング読み込み中...'
  });

  // Read all chunks first
  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    processedBytes += value.length;

    const progress = Math.round((processedBytes / fileSize) * 50);
    self.postMessage({
      type: 'progress',
      progress: progress,
      message: `読み込み中... ${formatBytes(processedBytes)} / ${formatBytes(fileSize)}`
    });
  }

  // Finalize decoder
  buffer += decoder.decode();

  self.postMessage({
    type: 'progress',
    progress: 50,
    message: 'JSONをパース中...'
  });

  // Parse the complete JSON
  const geojson = JSON.parse(buffer);
  buffer = null; // Free memory

  self.postMessage({
    type: 'progress',
    progress: 80,
    message: 'フィーチャーを処理中...'
  });

  const normalized = normalizeGeoJSON(geojson);

  self.postMessage({
    type: 'progress',
    progress: 100,
    message: '完了'
  });

  return normalized;
}

/**
 * Normalize GeoJSON to FeatureCollection format
 */
function normalizeGeoJSON(geojson) {
  if (!geojson) {
    throw new Error('Invalid GeoJSON: empty data');
  }

  // Already a FeatureCollection
  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    return geojson;
  }

  // Single Feature
  if (geojson.type === 'Feature') {
    return {
      type: 'FeatureCollection',
      features: [geojson]
    };
  }

  // Direct Geometry
  if (geojson.type && geojson.coordinates) {
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: geojson,
        properties: {}
      }]
    };
  }

  // Array of features
  if (Array.isArray(geojson)) {
    return {
      type: 'FeatureCollection',
      features: geojson
    };
  }

  throw new Error('Invalid GeoJSON format');
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
