import React ,{useEffect, useRef,useState} from 'react';
import LeftPanel from './LeftPanel'; // Import the LeftPanel component
import BabylonScene from './BabylonScene'; // Assuming this is your existing component
import Space from './Space';
function App() {

  const [spaces, setSpaces] = useState([]);
  const [downloading,setDownloading] = useState([]);
  const [downloaded,setDownloaded] = useState([]);
  const BabylonRef = useRef(); // Ref to access the Canvas component
  const [selectedSpace, setSelectedSpace] = useState();
//const server_url="https://settled-stirring-fawn.ngrok-free.app/"
const server_url="http://localhost/"//

    useEffect(() => {
      const fetchSpaceInfo = async () => {
        try {
          // Fetch space data from the server
          const response = await fetch(server_url + 'spaces', {
            method: 'GET',
            headers: {
              'ngrok-skip-browser-warning': 'true'
            }
          });
          
          // Convert the response to JSON
          const data = await response.json();
          console.log(data);
          
          // Map the response data to the structure you need
          const spacesData = data.map(item => ({
            name: item.name,
            imageUrl: server_url + '/images/' + item.name + '/' + item.image,
            localImageUrl:"",
            plyPath: server_url + '/files/' + item.name + '/' + "colored_model.ply",
            jsonContent: item.json
          }));
          
          // Create a temporary array to store spaces
          let spaces_temp = [];
          let downloading_temp=[];
          let downloaded_temp=[];
          
          // Loop through the spaces data to fetch image blobs
          for (let i = 0; i < spacesData.length; i++) {
            const imageResponse = await fetch(spacesData[i].imageUrl, {
              method: 'GET',
              headers: {
                'ngrok-skip-browser-warning': 'true'
              }
            });
            
            // Convert the image response to a blob
            const imageBlob = await imageResponse.blob();
            //const blob = new Blob([response.data], { type: 'image/jpeg' });
            console.log("Blob type:", imageBlob.type);
            console.log("Blob length:", imageBlob.size);
            const imageLocalURL = URL.createObjectURL(imageBlob);
            
            // Update the image path with the local blob URL
            spacesData[i].localImageUrl = imageLocalURL;
            
            // Push the new space object into the spaces_temp array
            spaces_temp.push(new Space(
              spacesData[i].name,
              spacesData[i].imageUrl,
              spacesData[i].localImageUrl,
              spacesData[i].plyPath,
              spacesData[i].jsonContent
            ));
            downloaded_temp.push(false);
            downloading_temp.push(false);
          }
          
          // Update the state with the new spaces data
          setSpaces(spaces_temp);
          setDownloaded(downloaded_temp);
          setDownloading(downloading_temp);
          console.log("Spaces", spaces_temp);
          
        } catch (error) {
          // Log any errors that occur during the fetch
          console.error('Error fetching spaces:', error);
        }
      };
      fetchSpaceInfo();
      
    }, []);

      const handleDownloadModel = async (space) => {
        space.downloading = true;
        const updatedDownloading = downloading.map((status, index) => 
          index === spaces.indexOf(space) ? true : status
        );
        setDownloading(updatedDownloading);
        try {
          const response = await fetch(space.plyUrl, {
            method: 'GET',
            headers: {
              'ngrok-skip-browser-warning': 'true'
            }
          });
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const blob = await response.blob();
          console.log("Model blob size",blob.size)
          const localURL = URL.createObjectURL(blob);
          space.modelLocalURL = localURL;
          space.downloaded = true;
          const updatedDownloaded = downloaded.map((status, index) => 
            index === spaces.indexOf(space) ? true : status
          );
          setDownloaded(updatedDownloaded);
        } catch (error) {
          console.error('Error downloading model:', error);
        } finally {
          space.downloading = false;
          const updatedDownloading = downloading.map((status, index) => 
            index === spaces.indexOf(space) ? false : status
          );
          setDownloading(updatedDownloading);
        }
      };
    const handleSelectModel = (space)=>{
      // if (selectedSpace == space) {
      //   //DO nothing
      // }
      // else{
        setSelectedSpace(space);
        BabylonRef.current.loadModel(space.modelLocalURL);
        BabylonRef.current.loadJson(space.jsonContent);
      //}

    };
  return (
    <div className="App" style={styles.container}>
      <LeftPanel spaces={spaces} onDownloadModel={handleDownloadModel} onSelectModel={handleSelectModel} downloadingState={downloading} downloadedState={downloaded}/>
      <div style={styles.sceneContainer}>
        <BabylonScene ref={BabylonRef}/>
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