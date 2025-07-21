/**
 * Space Class - Represents a 3D space with associated data and assets
 * 
 * Properties:
 * - name: Display name of the space
 * - imageUrl: Remote URL for preview image
 * - localImgUrl: Local blob URL for preview image
 * - plyUrl: URL for 3D model (.ply file)
 * - jsonContent: Object detection metadata (bounding boxes, descriptions)
 * - downloaded: Boolean indicating if 3D model has been downloaded
 * - downloading: Boolean indicating if download is in progress
 * - modelLocalURL: Local blob URL for downloaded 3D model
 */
class Space {
  constructor(name, imageUrl, localImgUrl, plyUrl, jsonContent) {
    // Basic properties
    this.name = name;
    this.imageUrl = imageUrl;
    this.localImgUrl = localImgUrl;
    this.plyUrl = plyUrl;
    this.jsonContent = jsonContent;
    
    // Download state tracking
    this.downloaded = false;
    this.downloading = false;
    this.modelLocalURL = "";
  }

  /**
   * Get the display name for this space
   * @returns {string} Space name
   */
  getName() {
    return this.name;
  }

  /**
   * Get the appropriate image URL (local if available, remote otherwise)
   * @returns {string} Image URL
   */
  getImageUrl() {
    return this.localImgUrl || this.imageUrl;
  }

  /**
   * Check if the 3D model is ready for loading
   * @returns {boolean} True if model is downloaded and ready
   */
  isModelReady() {
    return this.downloaded && this.modelLocalURL;
  }

  /**
   * Check if model is currently being downloaded
   * @returns {boolean} True if download is in progress
   */
  isDownloading() {
    return this.downloading;
  }

  /**
   * Get the model URL for loading into the 3D scene
   * @returns {string} Local model URL or empty string if not ready
   */
  getModelUrl() {
    return this.modelLocalURL || "";
  }

  /**
   * Get JSON content containing object detection data
   * @returns {Object} Object detection metadata
   */
  getJsonContent() {
    return this.jsonContent || {};
  }

  /**
   * Set the local model URL after successful download
   * @param {string} url - Local blob URL for the downloaded model
   */
  setModelLocalURL(url) {
    this.modelLocalURL = url;
    this.downloaded = true;
    this.downloading = false;
  }

  /**
   * Mark the space as currently downloading
   */
  startDownload() {
    this.downloading = true;
    this.downloaded = false;
  }

  /**
   * Mark the download as failed and reset state
   */
  failDownload() {
    this.downloading = false;
    this.downloaded = false;
    this.modelLocalURL = "";
  }

  /**
   * Get a summary of the space for debugging/logging
   * @returns {Object} Space summary
   */
  getSummary() {
    return {
      name: this.name,
      hasImage: !!this.localImgUrl,
      hasModel: !!this.modelLocalURL,
      downloaded: this.downloaded,
      downloading: this.downloading,
      objectCount: this.jsonContent ? Object.keys(this.jsonContent).length : 0
    };
  }
}

export default Space;
