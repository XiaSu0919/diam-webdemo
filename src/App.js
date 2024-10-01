import React from 'react';
import LeftPanel from './LeftPanel'; // Import the LeftPanel component
import BabylonScene from './BabylonScene'; // Assuming this is your existing component

function App() {
  return (
    <div className="App" style={styles.container}>
      <LeftPanel />
      <div style={styles.sceneContainer}>
        <BabylonScene />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  sceneContainer: {
    marginLeft: '250px', // Adjusting the scene to make space for the left panel
    flex: 1,
  }
};

export default App;