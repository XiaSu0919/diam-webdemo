import React, { useEffect, useRef,useState,useImperativeHandle, forwardRef  } from "react";
import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import "@babylonjs/loaders/OBJ/objFileLoader";
const BabylonScene =forwardRef((props, ref) => {
    const canvasRef = useRef(null);
    const secondaryCanvasRef = useRef(null);
    const [scene, setScene] = useState(null);
    const [scene2, setScene2] = useState(null);
    const [camera, setCamera] = useState(null);
    const [secondaryCamera, setSecondaryCamera] = useState(null);
    const [bboxes, setBboxes] = useState([]);
    class BBox {
      constructor(name, type, lowerCorners, upperCorners, box,box2) {
        this.name = name;
        this.type = type;
        this.lowerCorners = lowerCorners;
        this.upperCorners = upperCorners;
        this.box = box;
        this.box2 = box2;
      }
    }
    
    const colors = {
      "1": new BABYLON.Color3(0, 1, 0), // Green
      "2": new BABYLON.Color3(1, 1, 0), // Yellow
      "3": new BABYLON.Color3(0, 0, 1), // Blue
      "4": new BABYLON.Color3(1, 0.75, 0.8) // Pink
    };
    const classMapping = {
      "1": "door",
      "2": "elevator",
      "3": "stair",
      "4": "ramp"
    };
    const createBoxFromCorners = (name, type, lowerCorners, upperCorners, scene) => {
      // Calculate box dimensions (width, height, depth)
      const width = BABYLON.Vector3.Distance(new BABYLON.Vector3(...lowerCorners[0]), new BABYLON.Vector3(...lowerCorners[1]));
      const depth = BABYLON.Vector3.Distance(new BABYLON.Vector3(...lowerCorners[0]), new BABYLON.Vector3(...lowerCorners[2]));
      const height = BABYLON.Vector3.Distance(new BABYLON.Vector3(...lowerCorners[0]), new BABYLON.Vector3(...upperCorners[0]));
    
      // Calculate the center of the box
      const centerX = (lowerCorners[0][0] + lowerCorners[1][0] + lowerCorners[2][0] + lowerCorners[3][0] + upperCorners[0][0] + upperCorners[1][0] + upperCorners[2][0] + upperCorners[3][0]) / 8;
      const centerY = (lowerCorners[0][1] + lowerCorners[1][1] + lowerCorners[2][1] + lowerCorners[3][1] + upperCorners[0][1] + upperCorners[1][1] + upperCorners[2][1] + upperCorners[3][1]) / 8;
      const centerZ = (lowerCorners[0][2] + lowerCorners[1][2] + lowerCorners[2][2] + lowerCorners[3][2] + upperCorners[0][2] + upperCorners[1][2] + upperCorners[2][2] + upperCorners[3][2]) / 8;
      
      // Create the box in Babylon.js
      const box = BABYLON.MeshBuilder.CreateBox(name, {
        width: width,
        height: height,
        depth: depth,
        updatable: true
      }, scene);
    
      // Position the box at the center
      box.position = new BABYLON.Vector3(centerX, centerY, centerZ);
    
      // Calculate rotation: Compute local axes
      const lowerVec1 = BABYLON.Vector3.FromArray(lowerCorners[0]);
      const lowerVec2 = BABYLON.Vector3.FromArray(lowerCorners[1]);
      const lowerVec3 = BABYLON.Vector3.FromArray(lowerCorners[2]);
    
      const localX = lowerVec2.subtract(lowerVec1).normalize(); // Right direction
      const localZ = lowerVec3.subtract(lowerVec1).normalize(); // Forward direction
      const localY = BABYLON.Vector3.Cross(localZ, localX).normalize(); // Up direction (perpendicular to local X and Z)
    
      // Construct a rotation matrix manually from the local axes vectors
      const rotationMatrix = BABYLON.Matrix.FromValues(
        localX.x, localX.y, localX.z, 0,
        localY.x, localY.y, localY.z, 0,
        localZ.x, localZ.y, localZ.z, 0,
        0, 0, 0, 1
      );
    
      // Convert the rotation matrix to a quaternion
      const rotationQuaternion = new BABYLON.Quaternion();
      rotationMatrix.decompose(undefined, rotationQuaternion);
    
      // Apply the rotation quaternion to the box
      box.rotationQuaternion = rotationQuaternion;
    
      // Add material based on the type
      let material = scene.getMaterialByName(type);
      if (!material) {
        material = new BABYLON.StandardMaterial(type, scene);
        material.diffuseColor = colors[type];
        material.alpha = 0; // Set transparency level (0 is fully transparent, 1 is fully opaque)
      }
      box.material = material;
      // Enable edges rendering
      box.enableEdgesRendering();
      box.edgesWidth = 8.0;
      box.edgesColor = new BABYLON.Color4(
        material.diffuseColor.r,
        material.diffuseColor.g,
        material.diffuseColor.b,
        1
      );

      const box2 = BABYLON.MeshBuilder.CreateBox(name, {
        width: width,
        height: height,
        depth: depth,
        updatable: true
      }, scene2);
      let material2 = scene2.getMaterialByName(type);
      if (!material2) {
        material2 = new BABYLON.StandardMaterial(type, scene2);
        material2.diffuseColor = colors[type];
        material2.alpha = 0; // Set transparency level (0 is fully transparent, 1 is fully opaque)
      }
      // Position the box at the center
      box2.position = new BABYLON.Vector3(centerX, centerY, centerZ);
    
      // Apply the rotation quaternion to the box
      box2.rotationQuaternion = rotationQuaternion;
      box2.material = material2;
      // Enable edges rendering
      box2.enableEdgesRendering();
      box2.edgesWidth = 8.0;
      box2.edgesColor = new BABYLON.Color4(
        material2.diffuseColor.r,
        material2.diffuseColor.g,
        material2.diffuseColor.b,
        1
      );
    
      // Create and return a BBox object instead of just the Babylon box
      return new BBox(name, type, lowerCorners, upperCorners, box,box2);
    };
    
    const loadJson = (json) => {
      console.log(json);
      if (scene) {
        // Dispose of existing boxes
        bboxes.forEach(bbox => bbox.box.dispose());
        bboxes.forEach(bbox => bbox.box2.dispose());
        setBboxes([]);
    
        Object.keys(json).forEach(className => {
          console.log(`Class: ${className}`);
          
          const objects = json[className]; // Access objects within each class
        
          // Loop through each object inside the class (e.g., 0, 1, 2, etc.)
          Object.keys(objects).forEach(objectKey => {
            const objectData = objects[objectKey]; // Contains 'lower_corners' and 'upper_corners'
            const { lower_corners, upper_corners } = objectData;
            
            // Create the box and store it in a BBox object
            const bbox = createBoxFromCorners(objectKey, className, lower_corners, upper_corners, scene);
            console.log(`Added object in class: ${className}, Object: ${objectKey}`);
        
            // Add the BBox object to the state
            setBboxes(prevBboxes => [...prevBboxes, bbox]);
          });
        });
      }
      
    };
    const highlightBox = (box) => {
      if (scene) {
        // Remove highlight from all other boxes
        bboxes.forEach(bbox => {
          bbox.box.edgesWidth = 8.0;
          bbox.box2.edgesWidth = 8.0;
            // bbox.box.edgesColor = new BABYLON.Color4(
            // bbox.box.material.diffuseColor.r,
            // bbox.box.material.diffuseColor.g,
            // bbox.box.material.diffuseColor.b,
            // 1
            // ); // Reset edges color to match material color
        });

        // Highlight the selected box
        //box.edgesColor = new BABYLON.Color4(1, 0, 0, 1); // Red color for highlight
        box.box.edgesWidth = 38.0;
        box.box2.edgesWidth = 38.0;
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
        // Dispose of all existing bounding boxes
        bboxes.forEach(bbox => bbox.box.dispose());
        bboxes.forEach(bbox => bbox.box2.dispose());
        setBboxes([]);
        //scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Optional: Reset background color
      }
      if (scene2) {
        scene2.meshes.forEach((mesh) => {
          mesh.dispose();
        });
        //scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Optional: Reset background color
      }
      BABYLON.SceneLoader.ImportMeshAsync("", modelUrl, "", scene, null, ".ply").then((result) => {
        result.meshes.forEach((mesh) => {
          
            // Create a new Standard Material for the mesh
            const material = new BABYLON.StandardMaterial("vertexMaterial", scene);
            
            // Enable vertex colors (so it uses the colors embedded in the .ply file)
            material.vertexColor = true;
            
            // Set emissive color to the mesh's original colors (ignores lighting)
            material.emissiveColor = new BABYLON.Color3(1, 1, 1); // White, to reflect original color
            
            // Disable the influence of lighting
            material.disableLighting = true;
    
            // Assign the material to the mesh
            mesh.material = material;
        
        });
    });
      BABYLON.SceneLoader.ImportMeshAsync("", modelUrl, "", scene2, null, ".ply")
  .then((result) => {
    // Make the loaded model less reflective using PBR material
    result.meshes.forEach((mesh) => {
      
        // Create a new Standard Material for the mesh
        const material = new BABYLON.StandardMaterial("vertexMaterial", scene2);
        
        // Enable vertex colors (so it uses the colors embedded in the .ply file)
        material.vertexColor = true;
        
        // Set emissive color to the mesh's original colors (ignores lighting)
        material.emissiveColor = new BABYLON.Color3(1, 1, 1); // White, to reflect original color
        
        // Disable the influence of lighting
        material.disableLighting = true;

        // Assign the material to the mesh
        mesh.material = material;
    
    });
    const boundingInfo = result.meshes[0].getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;
        const center = boundingBox.centerWorld;
        const extendSize = boundingBox.extendSizeWorld;

        secondaryCamera.position = new BABYLON.Vector3(center.x, center.y + extendSize.y * 2, center.z);
        secondaryCamera.setTarget(center);

        const aspectRatio = secondaryCanvasRef.current.width / secondaryCanvasRef.current.height;
        const orthoHeight = extendSize.y * 2;
        const orthoWidth = orthoHeight * aspectRatio;

        secondaryCamera.orthoLeft = -orthoWidth*2 ;
        secondaryCamera.orthoRight = orthoWidth*2;
        secondaryCamera.orthoTop = orthoHeight*2 ;
        secondaryCamera.orthoBottom = -orthoHeight*2 ;
  })
  .catch((error) => {
    console.error("Error loading model:", error);
  });
    };
    
    useEffect(() => {
      const canvas = canvasRef.current;
      const secondaryCanvas = secondaryCanvasRef.current;
      //secondaryCanvas.style.backgroundColor = "white";
      // Initialize Babylon.js engine
      const engine = new BABYLON.Engine(canvas, true);
      const engine2 = new BABYLON.Engine(secondaryCanvas, true);
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
        //Create OrthographicCamera for the secondary canvas
        //scene.createDefaultEnvironment();
        //engine.registerView(canvas,camera);
        //engine.registerView(secondaryCanvas, secondaryCamera);
        //scene.createDefaultEnvironment();
        //scene.activeCameras = [camera, secondaryCamera];

        // Create Hemispheric Light
        new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
  
        setScene(scene);
        setCamera(camera);
  
        return scene;
      };

      const createScene2 = () => {
        const scene2  = new BABYLON.Scene(engine2);
        scene2.clearColor = new BABYLON.Color4(0, 0, 0, 0);
        //Create OrthographicCamera for the secondary canvas
        const secondaryCamera = new BABYLON.FreeCamera("secondaryCamera", new BABYLON.Vector3(0, 0, -10), scene2);
        secondaryCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        secondaryCamera.orthoLeft = -5;
        secondaryCamera.orthoRight = 5;
        secondaryCamera.orthoTop = 5;
        secondaryCamera.orthoBottom = -5;
        secondaryCamera.setTarget(BABYLON.Vector3.Zero());
        
        //secondaryCamera.attachControl(secondaryCanvas, true);

        // Override the default behavior to restrict to zoom only
        secondaryCanvas.addEventListener("wheel", (event) => {
          event.preventDefault();
          const delta = event.deltaY;
          const zoomFactor = 0.1; // Adjust this factor to control zoom speed

          if (delta > 0) {
            secondaryCamera.orthoLeft *= (1 + zoomFactor);
            secondaryCamera.orthoRight *= (1 + zoomFactor);
            secondaryCamera.orthoTop *= (1 + zoomFactor);
            secondaryCamera.orthoBottom *= (1 + zoomFactor);
          } else {
            secondaryCamera.orthoLeft *= (1 - zoomFactor);
            secondaryCamera.orthoRight *= (1 - zoomFactor);
            secondaryCamera.orthoTop *= (1 - zoomFactor);
            secondaryCamera.orthoBottom *= (1 - zoomFactor);
          }
        });
        //scene.createDefaultEnvironment();
        //engine.registerView(canvas,camera);
        //engine.registerView(secondaryCanvas, secondaryCamera);
        //scene.createDefaultEnvironment();
        //scene.activeCameras = [camera, secondaryCamera];

        // Create Hemispheric Light
        new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene2);
  
        setScene2(scene2);
        setSecondaryCamera(secondaryCamera);
  
        return scene2;
      };
  
      // Create scene
      const scene = createScene();
      const scene2 = createScene2();
  
      // Run the render loop
      engine.runRenderLoop(() => {
        if (scene.activeCamera) {
          scene.render();
      }
      });
      engine2.runRenderLoop(() => {
        if (scene2.activeCamera) {
          scene2.render();
      }
      });
  
      // Handle window resize
      window.addEventListener("resize", () => {
        engine.resize();
        engine2.resize();
      });
  
      return () => {
        engine.dispose();
        engine2.dispose();
        window.removeEventListener("resize", () => engine.resize());
        window.removeEventListener("resize", () => engine2.resize());
      };
    }, []);
  
      return (
        <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "100vh" }} />
        </div>
        <div
    style={{
      width: "300px",
      backgroundColor: "#f0f0f0",
      padding: "10px",
      display: "flex",
      flexDirection: "column",
      height: "100vh", // Full height of the viewport
    }}
  >
    <h3>Detected Facilities</h3>
    <p>Here we list the annotated facilities in the space.</p>
    <div
      style={{
        flexGrow: 1,
        overflowY: "auto", // Allow scrolling when there are too many items
        marginBottom: "10px", // Ensure a small gap before the canvas
      }}
    >
      {bboxes.map((bbox, index) => (
        <div
          key={index}
          onMouseEnter={() => highlightBox(bbox)}
          onMouseLeave={() => {/* Handle mouse leave if needed */}}
          style={{ 
            marginBottom: "10px",
            padding: "5px",
            transition: "background-color 0.3s ease",
            backgroundColor: "transparent",
            cursor: "pointer",
            ":hover": {
              backgroundColor: "#f0f0f0"
            }
          }}
          className="facility-item"
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: `rgb(${colors[bbox.type].r * 255}, ${colors[bbox.type].g * 255}, ${colors[bbox.type].b * 255})`,
              display: "inline-block",
              marginRight: "10px",
            }}
          ></div>
          <strong>{classMapping[bbox.type]}</strong> 
          <strong>{bbox.name}</strong> 
        </div>
      ))}
    </div>

    <canvas
      ref={secondaryCanvasRef}
      style={{
        width: "100%", // Ensure it takes full width of the container
        height: "300px", // Fixed height
        border: "1px solid #ccc", // Optional: Border for visibility
      }}
    />
  </div>
  </div>
      );
   });
  
  export default BabylonScene;