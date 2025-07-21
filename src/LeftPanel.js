import React, { useEffect } from 'react';
import loadingIcon from './Icons/loading.png';
import readyIcon from './Icons/ready.png';
import downloadIcon from './Icons/download.png';

/**
 * LeftPanel Component - Displays available spaces with download/selection controls
 * Features:
 * - Space preview images
 * - Download state indicators (loading, ready, download)
 * - Click to download/select functionality
 */
function LeftPanel({
  spaces,
  onDownloadModel,
  onSelectModel,
  downloadingState,
  downloadedState
}) {
    
  /**
   * Handle space item click - download or select based on current state
   */
  const handleSpaceClick = (space) => {
    console.log(`Space clicked: ${space.name}`);
    
    if (space.downloaded) {
      // Model is ready - select it
      onSelectModel(space);
    } else if (space.downloading) {
      // Currently downloading - do nothing
      return;
    } else {
      // Not downloaded yet - start download
      onDownloadModel(space);
    }
  };
  useEffect(() => {
    console.log('Spaces updated:', spaces);
  }, [spaces]);
  /**
   * Get appropriate status icon based on download state
   */
  const getStatusIcon = (index) => {
    if (downloadingState[index]) {
      return <img src={loadingIcon} alt="Loading" style={styles.statusIcon} />;
    }
    if (downloadedState[index]) {
      return <img src={readyIcon} alt="Downloaded" style={styles.statusIcon} />;
    }
    return <img src={downloadIcon} alt="Download" style={styles.statusIcon} />;
  };

  return (
    <div style={styles.panel}>
      <h2 style={styles.title}>Spaces</h2>
      <div style={styles.scrollContainer}>
        {spaces && spaces.length > 0 ? (
          spaces.map((space, index) => (
            <div 
              key={index} 
              onClick={() => handleSpaceClick(space)} 
              style={{
                ...styles.spaceItem,
                cursor: space.downloading ? 'wait' : 'pointer',
                opacity: space.downloading ? 0.7 : 1
              }}
            >
              <div style={styles.headerRow}>
                <div style={styles.spaceName}>
                  <h4 style={styles.nameText}>{space.name}</h4>
                </div>
                <div style={styles.statusContainer}>
                  {getStatusIcon(index)}
                </div>
              </div>
              <img 
                src={space.localImgUrl || space.imageUrl} 
                alt={space.name} 
                style={styles.previewImage}
                onError={(e) => {
                  // Fallback to original imageUrl if localImgUrl fails
                  if (e.target.src !== space.imageUrl) {
                    e.target.src = space.imageUrl;
                  }
                }}
              />
            </div>
          ))
        ) : (
          <p style={styles.noSpacesText}>No spaces available</p>
        )}
      </div>
    </div>
  );
  
}

const styles = {
  panel: {
    width: '250px',
    height: '100vh',
    backgroundColor: '#f0f0f0',
    padding: '20px',
    boxSizing: 'border-box',
    position: 'fixed',
    left: '0',
    top: '0',
    borderRight: '1px solid #ddd',
    zIndex: 1000
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333'
  },
  scrollContainer: {
    overflowY: 'auto',
    height: 'calc(100vh - 80px)',
    paddingRight: '5px'
  },
  spaceItem: {
    position: 'relative',
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  spaceName: {
    flex: '1 1 auto',
    marginRight: '10px',
    wordBreak: 'break-word'
  },
  nameText: {
    margin: '0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  statusContainer: {
    flex: '0 0 auto',
    width: '20px',
    height: '20px'
  },
  statusIcon: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  previewImage: {
    width: '100%',
    height: 'auto',
    borderRadius: '4px',
    border: '1px solid #eee'
  },
  noSpacesText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: '50px'
  }
};

// Add hover effects with CSS-in-JS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .space-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
  `;
  document.head.appendChild(style);
}

export default LeftPanel;
