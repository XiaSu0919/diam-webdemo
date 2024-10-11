import React, { useEffect, useRef,useState,useImperativeHandle, forwardRef  } from "react";
import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import "@babylonjs/loaders/OBJ/objFileLoader";
const BabylonScene =forwardRef((props, ref) => {
    const canvasRef = useRef(null);
    const [scene, setScene] = useState(null);
    const [camera, setCamera] = useState(null);
    const [bboxes, setBboxes] = useState([]);
    class BBox {
      constructor(name, type, min, max, box) {
        this.name = name;
        this.type = type;
        this.min = min;
        this.max = max;
        this.box = box;
      }
    }
    const colors = {
      "class1": new BABYLON.Color3(0, 1, 0), // Green
      "class2": new BABYLON.Color3(1, 1, 0), // Yellow
      "class3": new BABYLON.Color3(0, 0, 1), // Blue
      "class4": new BABYLON.Color3(1, 0.75, 0.8) // Pink
    };
    const classMapping = {
      "class1": "door",
      "class2": "stair",
      "class3": "elevator",
      "class4": "ramp"
    };
    const createBBox = (name, type, min, max, scene) => {
      const box = BABYLON.MeshBuilder.CreateBox(name, {
        size: 1,
        updatable: true
      }, scene);

      box.scaling = new BABYLON.Vector3(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
      box.position = new BABYLON.Vector3((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);

      let material = scene.getMaterialByName(type);
      if (!material) {
        material = new BABYLON.StandardMaterial(type, scene);
        
        material.diffuseColor = colors[type];
        material.alpha = 0; // Make the faces transparent
      }
      box.material = material;

      // Make the box frame only
      const edges = box.enableEdgesRendering();
      edges.edgesWidth = 8.0; // Make the edge thicker
      edges.edgesColor = new BABYLON.Color4(material.diffuseColor.r, material.diffuseColor.g, material.diffuseColor.b, 1); // Same color as material

      return new BBox(name, type, min, max, box);
    };
    const loadJson = (json) =>{
      console.log(json)
      if (scene) {
        // Dispose of existing bounding boxes
        bboxes.forEach(bbox => bbox.box.dispose());
        setBboxes([]);
        Object.keys(json).forEach(className => {
          console.log(`Class: ${className}`);
          
          const objects = json[className]; // Access objects within each class
    
          // Loop through each object inside the class (e.g., 0, 1, 2, etc.)
          Object.keys(objects).forEach(objectKey => {
            const objectData = objects[objectKey]; // Contains 'min' and 'max'
            const { min, max } = objectData;
    
            // Create the bounding box and add it to the scene
            const bbox = createBBox(objectKey,className, min, max, scene);
            console.log(`Added object in class: ${className}, Object: ${objectKey}`);
    
            // Add the bounding box to the state
            setBboxes(prevBboxes => [...prevBboxes, bbox]);
          });
        });
      }
      
    }
    const highlightBox = (box) => {
      if (scene) {
        // Remove highlight from all other boxes
        bboxes.forEach(bbox => {
          bbox.box.edgesWidth = 8.0;
            // bbox.box.edgesColor = new BABYLON.Color4(
            // bbox.box.material.diffuseColor.r,
            // bbox.box.material.diffuseColor.g,
            // bbox.box.material.diffuseColor.b,
            // 1
            // ); // Reset edges color to match material color
        });

        // Highlight the selected box
        //box.edgesColor = new BABYLON.Color4(1, 0, 0, 1); // Red color for highlight
        box.edgesWidth = 38.0;
      }
    };
    useImperativeHandle(ref, () => ({
      loadModel,
      loadJson,
    }));
    const loadModel = (modelUrl) => {
      console.log('Loading model in Canvas:', modelUrl);
      if (scene) {
        scene.meshes.forEach((mesh) => {
          mesh.dispose();
        });
        //scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Optional: Reset background color
      }
      BABYLON.SceneLoader.ImportMeshAsync("", modelUrl, "", scene, null, ".ply")
  .then((result) => {
    //scene.clearColor = new BABYLON.Color4(0.5, 0.5, 0.5, 1); // Default blue color

    // Make the loaded model less reflective using PBR material
    result.meshes.forEach((mesh) => {
      if (mesh.material) {
        // Create a new PBR material
        const pbrMaterial = new BABYLON.PBRMaterial("pbrMaterial", scene);

        // Enable vertex colors (if your .ply model has them)
        pbrMaterial.useVertexColors = true;

        // Set the metallic and roughness values to make the material less reflective
        pbrMaterial.metallic = 0; // No metallic reflections
        pbrMaterial.roughness = 1; // Full roughness to give a matte look

        // Optionally, remove reflectivity
        pbrMaterial.reflectivityColor = new BABYLON.Color3(0, 0, 0);

        // Assign the PBR material to the mesh
        mesh.material = pbrMaterial;
      }
    });
  })
  .catch((error) => {
    console.error("Error loading model:", error);
  });
    };
    
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
  
    return (
      <div style={{ display: "flex" }}>
      <div style={{ flex: 1 }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100vh" }} />
      </div>
      <div style={{ width: "300px", backgroundColor: "#f0f0f0", padding: "10px" }}>
        <h3>Right Panel</h3>
        <p>Additional controls or information can go here.</p>
        <div>
        {bboxes.map((bbox, index) => (
          <div
          key={index}
          onMouseEnter={() => highlightBox(bbox.box)}
          style={{ marginBottom: "10px" }}
          >
          <strong>{classMapping[bbox.type]}</strong> 
          <strong>{bbox.name}</strong> 
          </div>
        ))}
        </div>
      </div>
      </div>
    );
  });
  
  export default BabylonScene;