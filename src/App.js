import React, { useEffect, useRef, useState } from 'react';
import LeftPanel from './LeftPanel';
import BabylonScene from './BabylonScene';
import Space from './Space';

// Configuration constants
const SERVER_URL = "https://settled-stirring-fawn.ngrok-free.app/";
// const SERVER_URL = "http://localhost/"; // Alternative local server

function App() {
  // State management
  const [spaces, setSpaces] = useState([]);
  const [downloading, setDownloading] = useState([]);
  const [downloaded, setDownloaded] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  
  // Refs
  const babylonRef = useRef();

  // Fetch spaces data from server on component mount
  useEffect(() => {
    const fetchSpaceInfo = async () => {
      try {
        const response = await fetch(`${SERVER_URL}spaces`, {
          method: 'GET',
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        
        const data = await response.json();
        console.log('Fetched spaces data:', data);
        
        // Process spaces data and create Space objects
        const processedSpaces = await Promise.all(
          data.map(async (item, index) => {
            const spaceData = {
              name: item.name,
              imageUrl: `${SERVER_URL}images/${item.name}/${item.image}`,
              plyPath: `http://localhost/files/${item.ply_file}`,
              jsonContent: item.json_files
            };
            
            // Fetch image blob for local display
            const imageResponse = await fetch(spaceData.imageUrl, {
              method: 'GET',
              headers: {
                'ngrok-skip-browser-warning': 'true'
              }
            });
            
            const imageBlob = await imageResponse.blob();
            const localImageUrl = URL.createObjectURL(imageBlob);
            
            return new Space(
              spaceData.name,
              spaceData.imageUrl,
              localImageUrl,
              spaceData.plyPath,
              spaceData.jsonContent
            );
          })
        );
        
        // Initialize state arrays
        setSpaces(processedSpaces);
        setDownloaded(new Array(processedSpaces.length).fill(false));
        setDownloading(new Array(processedSpaces.length).fill(false));
        
      } catch (error) {
        console.error('Error fetching spaces:', error);
      }
    };
    
    fetchSpaceInfo();
  }, []);

  // Handle 3D model download for a space
  const handleDownloadModel = async (space) => {
    const spaceIndex = spaces.indexOf(space);
    
    // Update downloading state
    space.downloading = true;
    const updatedDownloading = [...downloading];
    updatedDownloading[spaceIndex] = true;
    setDownloading(updatedDownloading);
    
    try {
      console.log('Downloading model from URL:', space.plyUrl);
      
      const response = await fetch(space.plyUrl, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Model blob size:', blob.size);
      
      // Create local URL and update space
      const localURL = URL.createObjectURL(blob);
      space.modelLocalURL = localURL;
      space.downloaded = true;
      
      // Update downloaded state
      const updatedDownloaded = [...downloaded];
      updatedDownloaded[spaceIndex] = true;
      setDownloaded(updatedDownloaded);
      
    } catch (error) {
      console.error('Error downloading model:', error);
    } finally {
      // Reset downloading state
      space.downloading = false;
      const updatedDownloading = [...downloading];
      updatedDownloading[spaceIndex] = false;
      setDownloading(updatedDownloading);
    }
  };
  // Handle model selection and load into Babylon scene
  const handleSelectModel = (space) => {
    setSelectedSpace(space);
    
    if (babylonRef.current) {
      babylonRef.current.loadModel(space.modelLocalURL);
      babylonRef.current.loadJson(space.jsonContent);
    }
  };
  return (
    <div className="App" style={styles.container}>
      <LeftPanel 
        spaces={spaces} 
        onDownloadModel={handleDownloadModel} 
        onSelectModel={handleSelectModel} 
        downloadingState={downloading} 
        downloadedState={downloaded}
      />
      <div style={styles.sceneContainer}>
        <BabylonScene ref={babylonRef} />
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