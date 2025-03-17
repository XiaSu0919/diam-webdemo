import React, { useEffect, useState } from 'react';
import Space from './Space';
import loadingIcon from './Icons/loading.png';
import readyIcon from './Icons/ready.png';
import downloadIcon from './Icons/download.png';
function LeftPanel(props) {
    
    const handleImageClick = (space) => {
      // Logic to load the file in the Babylon canvas
      console.log(`Clicking: ${space.name}`);
      //props.onSelectModel(space)
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
      <div style={{ overflowY: 'auto', height: 'calc(100vh - 60px)' }}>
        {props.spaces && props.spaces.length > 0 ? (
        props.spaces.map((space, index) => (
          <div key={index} onClick={() => handleImageClick(space)} style={{ position: 'relative', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ flex: '1 1 auto', marginRight: '10px', wordBreak: 'break-word' }}>
            <h4 style={{ margin: '0' }}>{space.name}</h4>
            </div>
            <div style={{ flex: '0 0 auto', width: '20px', height: '20px' }}>
            {props.downloadingState[index] ? (
              <img src={loadingIcon} alt="Loading" style={{ width: '100%', height: '100%' }} />
            ) : props.downloadedState[index] ? (
              <img src={readyIcon} alt="Downloaded" style={{ width: '100%', height: '100%' }} />
            ) : (
              <img src={downloadIcon} alt="Download" style={{ width: '100%', height: '100%' }} />
            )}
            </div>
          </div>
          <img src={space.imageUrl} alt={space.name} style={{ width: '100%' }} />
          </div>
        ))
        ) : (
        <p>No spaces available</p>
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
  }
};

export default LeftPanel;
