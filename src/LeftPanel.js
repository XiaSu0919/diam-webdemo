import React, { useEffect, useState } from 'react';
import Space from './Space';
import loadingIcon from './Icons/loading.png';
import readyIcon from './Icons/ready.png';
import downloadIcon from './Icons/download.png';
function LeftPanel(props) {
    
    const handleImageClick = (space) => {
      // Logic to load the file in the Babylon canvas
      console.log(`Clicking: ${space.name}`);
      if (space.downloaded){
        props.onSelectModel(space)
      }
      else if (space.downloading){
        //DO nothing
      }
      else{
        //Download
        props.onDownloadModel(space)
      }
    };
    useEffect(()=>{
      console.log(props.spaces)
    })
    return (
      <div style={styles.panel}>
      <h2>Spaces</h2>
      {props.spaces && props.spaces.length > 0 ? (
        props.spaces.map((space, index) => (
        <div key={index} onClick={() => handleImageClick(space)} style={{ position: 'relative' }}>
          <h4>{space.name}</h4>
          <img src={space.imageUrl} alt={space.name} style={{ width: '100%' }} />
          {props.downloadingState[index] ? (
          <div style={{ ...styles.iconContainer, width: '20%', height: '20%' }}>
            <img src={loadingIcon} alt="Loading" style={{ width: '100%', height: '100%' }} />
          </div>
          ) : props.downloadedState[index] ? (
          <div style={{ ...styles.iconContainer, width: '20%', height: '20%' }}>
            <img src={readyIcon} alt="Downloaded" style={{ width: '100%', height: '100%' }} />
          </div>
          ) : (
          <div style={{ ...styles.iconContainer, width: '20%', height: '20%' }}>
            <img src={downloadIcon} alt="Download" style={{ width: '100%', height: '100%' }} />
          </div>
          )}
        </div>
        ))
      ) : (
        <p>No spaces available</p>
      )}
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
  }
};

export default LeftPanel;
