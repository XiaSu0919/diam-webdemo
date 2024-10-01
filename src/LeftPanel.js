import React, { useEffect, useState } from 'react';
import Space from './Space';

function LeftPanel() {
    const [spaces, setSpaces] = useState([Space]);

    useEffect(() => {
      const server_url="https://ninety-birds-sit.loca.lt/"
      fetch(server_url+'spaces')
        .then(response => response.json())
        .then(data => {
          const spacesData = data.map(item => ({
        name: item.name,
        imagePath: server_url+'/images/'+item.name+'/'+ item.image,
        spacePath: ""
          }));
          setSpaces(spacesData);
        })
        .catch(error => console.error('Error fetching spaces:', error));
    }, []);

    const handleImageClick = (spacePath) => {
      // Logic to load the file in the Babylon canvas
      console.log(`Loading space from: ${spacePath}`);
    };

    return (
      <div style={styles.panel}>
        <h2>Left Panel</h2>
        {spaces.map((space, index) => (
          <div key={index} onClick={() => handleImageClick(space.spacePath)}>
            <h4>{space.name}</h4>
            <img src={space.imagePath} alt={space.name} style={{ width: '100%' }} />
          </div>
        ))}
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
