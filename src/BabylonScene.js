import React, { useEffect, useRef,useState } from "react";
import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import "@babylonjs/loaders/OBJ/objFileLoader";
const BabylonScene = () => {
    const canvasRef = useRef(null);
    const [scene, setScene] = useState(null);
    const [camera, setCamera] = useState(null);
    useEffect(() => {
      const canvas = canvasRef.current;
      // Initialize Babylon.js engine
      const engine = new BABYLON.Engine(canvas, true);
      
      // Create a basic scene with a camera and light
      const createScene = () => {
        const scene = new BABYLON.Scene(engine);
  
        // Create ArcRotateCamera (user can rotate with mouse)
        const camera = new BABYLON.ArcRotateCamera(
          "camera1",
          Math.PI / 2,
          Math.PI / 2,
          10,
          new BABYLON.Vector3(0, 0, 0),
          scene
        );
        camera.attachControl(canvas, true);
  
        // Create Hemispheric Light
        new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
  
        setScene(scene);
        setCamera(camera);
  
        return scene;
      };
  
      // Create scene
      const scene = createScene();
  
      // Run the render loop
      engine.runRenderLoop(() => {
        scene.render();
      });
  
      // Handle window resize
      window.addEventListener("resize", () => {
        engine.resize();
      });
  
      return () => {
        engine.dispose();
        window.removeEventListener("resize", () => engine.resize());
      };
    }, []);
  
    // Handle file upload and add to scene
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && scene) {
            const url = URL.createObjectURL(file);
    
            BABYLON.SceneLoader.ImportMeshAsync("", url, "", scene, null, ".obj").then((result) => {
                result.meshes.forEach((mesh) => {
                    // Create a new material for the mesh if it doesn't already have one
                    if (!mesh.material) {
                        console.log("Adding material to the model")
                        mesh.material = new BABYLON.StandardMaterial("material", scene);
                        mesh.material.useVertexColors = true;
                    }
    
                    // Enable vertex colors if present
                    const vertexData = BABYLON.VertexData.ExtractFromMesh(mesh);
                if (vertexData.colors) {
                    console.log('Vertex colors detected:', vertexData.colors);
                } else {
                    console.log('No vertex colors found. Applying default material.');
                }
                });
            });
        }
    };
  const handleJSONUpload = (event) =>{
    const file = event.target.files[0];
        if (file && scene) {
            const url = URL.createObjectURL(file);
          fetch(url)
            .then(response => response.json())
            .then(data => {
              data.items.forEach(item => {
                const { name, category, boundingBox } = item;
                const { min, max } = boundingBox;

                // Create a box mesh for the bounding box
                const box = BABYLON.MeshBuilder.CreateBox(name, {
                  size: 1,
                  updatable: true
                }, scene);

                // Position and scale the box according to the bounding box
                box.scaling = new BABYLON.Vector3(max.x - min.x, max.y - min.y, max.z - min.z);
                box.position = new BABYLON.Vector3((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);

                // Optionally, you can set a material or color for the box
                const material = new BABYLON.StandardMaterial(`${name}-material`, scene);
                material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
                box.material = material;

                console.log(`Added item: ${name}, category: ${category}`);
              });
            })
            .catch(error => {
              console.error('Error parsing JSON file:', error);
            });
        }
  };
    // Handle camera movement with WASD keys
    useEffect(() => {
      if (camera) {
        const moveSpeed = 0.5;
  
        const handleKeyDown = (event) => {
          switch (event.key) {
            case "w":
              camera.position.z -= moveSpeed;
              break;
            case "s":
              camera.position.z += moveSpeed;
              break;
            case "a":
              camera.position.x -= moveSpeed;
              break;
            case "d":
              camera.position.x += moveSpeed;
              break;
            default:
              break;
          }
        };
  
        window.addEventListener("keydown", handleKeyDown);
  
        return () => {
          window.removeEventListener("keydown", handleKeyDown);
        };
      }
    }, [camera]);
  
    return (
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "inline-block", padding: "10px 20px", margin: "10px", backgroundColor: "#007bff", color: "#fff", borderRadius: "5px", cursor: "pointer" }}>
            Upload model
            <input type="file" accept=".obj" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
          <label style={{ display: "inline-block", padding: "10px 20px", margin: "10px", backgroundColor: "#007bff", color: "#fff", borderRadius: "5px", cursor: "pointer" }}>
            Upload JSON
            <input type="file" accept=".json" onChange={handleJSONUpload} style={{ display: "none" }} />
          </label>
          <canvas ref={canvasRef} style={{ width: "100%", height: "100vh" }} />
        </div>
        <div style={{ width: "300px", backgroundColor: "#f0f0f0", padding: "10px" }}>
          <h3>Right Panel</h3>
          <p>Additional controls or information can go here.</p>
        </div>
      </div>
    );
  };
  
  export default BabylonScene;