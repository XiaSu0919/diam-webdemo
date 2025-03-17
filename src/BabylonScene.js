import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import "@babylonjs/loaders/OBJ/objFileLoader";
const BabylonScene = forwardRef((props, ref) => {
    const canvasRef = useRef(null);
    const secondaryCanvasRef = useRef(null);
    const [scene, setScene] = useState(null);
    const [scene2, setScene2] = useState(null);
    const [camera, setCamera] = useState(null);
    const [secondaryCamera, setSecondaryCamera] = useState(null);
    const [bboxes, setBboxes] = useState([]);
    const [typeColors, setTypeColors] = useState({});
    const [typeNames, setTypeNames] = useState({});
    const [hoveredBox, setHoveredBox] = useState(null);
    const [selectedBox, setSelectedBox] = useState(null);
    const facilityItemsRef = useRef({});
    const facilityListRef = useRef(null);
    
    class BBox {
      constructor(name, type, lowerCorners, upperCorners, box, box2, axisMeshes, axisMeshes2, description) {
        this.name = name;
        this.type = type;
        this.lowerCorners = lowerCorners;
        this.upperCorners = upperCorners;
        this.box = box;
        this.box2 = box2;
        this.axisMeshes = axisMeshes || [];
        this.axisMeshes2 = axisMeshes2 || [];
        this.description = description || "";
      }
    }
    
    // Function to generate a random color
    const getRandomColor = () => {
      // Define a color palette with distinct, visually appealing colors
      const colorPalette = [
        new BABYLON.Color3(0.95, 0.33, 0.33), // Red
        new BABYLON.Color3(0.33, 0.76, 0.33), // Green
        new BABYLON.Color3(0.33, 0.33, 0.95), // Blue
        new BABYLON.Color3(0.95, 0.76, 0.33), // Orange
        new BABYLON.Color3(0.76, 0.33, 0.76), // Purple
        new BABYLON.Color3(0.33, 0.76, 0.76), // Cyan
        new BABYLON.Color3(0.95, 0.33, 0.76), // Pink
        new BABYLON.Color3(0.76, 0.76, 0.33), // Yellow
        new BABYLON.Color3(0.50, 0.33, 0.95), // Indigo
        new BABYLON.Color3(0.33, 0.95, 0.76)  // Teal
      ];
      
      // Static counter to keep track of which color to return next
      if (typeof getRandomColor.colorIndex === 'undefined') {
        getRandomColor.colorIndex = 0;
      }
      
      // If we still have colors in the palette, return the next one
      if (getRandomColor.colorIndex < colorPalette.length) {
        const color = colorPalette[getRandomColor.colorIndex];
        getRandomColor.colorIndex++;
        return color;
      }
      
      // If we've used all colors in the palette, fall back to random color generation
      const r = Math.random();
      const g = Math.random();
      const b = Math.random();
      
      // Make sure at least one channel is very bright
      const maxChannel = Math.max(r, g, b);
      const brightnessFactor = 0.8 + Math.random() * 0.2; // 0.8 to 1.0
      
      // Scale values to ensure good saturation and differentiation
      return new BABYLON.Color3(
        r === maxChannel ? brightnessFactor : 0.2 + r * 0.5,
        g === maxChannel ? brightnessFactor : 0.2 + g * 0.5,
        b === maxChannel ? brightnessFactor : 0.2 + b * 0.5
      );
    };
    
    // Function to get or create a color for a type
    const getColorForType = (type) => {
      if (!typeColors[type]) {
        // Generate a new random color for this type
        const newColor = getRandomColor();
        setTypeColors(prev => ({...prev, [type]: newColor}));
        return newColor;
      }
      return typeColors[type];
    };
    
    const createBoxFromCorners = (name, type, corners, scene, description) => {
      // Split corners into lower and upper corners
      const lowerCorners = corners.slice(0, 4);
      const upperCorners = corners.slice(4, 8);
      
      // Apply z-axis inversion to all corners
      const invertedLowerCorners = lowerCorners.map(corner => [corner[0], corner[1], -corner[2]]);
      const invertedUpperCorners = upperCorners.map(corner => [corner[0], corner[1], -corner[2]]);
      
      // Calculate box dimensions (width, height, depth)
      const width = BABYLON.Vector3.Distance(new BABYLON.Vector3(...invertedLowerCorners[0]), new BABYLON.Vector3(...invertedLowerCorners[1]));
      const depth = BABYLON.Vector3.Distance(new BABYLON.Vector3(...invertedLowerCorners[0]), new BABYLON.Vector3(...invertedLowerCorners[2]));
      const height = BABYLON.Vector3.Distance(new BABYLON.Vector3(...invertedLowerCorners[0]), new BABYLON.Vector3(...invertedUpperCorners[0]));
    
      // Calculate the center of the box with inverted z coordinates
      const centerX = (invertedLowerCorners[0][0] + invertedLowerCorners[1][0] + invertedLowerCorners[2][0] + invertedLowerCorners[3][0] + 
                       invertedUpperCorners[0][0] + invertedUpperCorners[1][0] + invertedUpperCorners[2][0] + invertedUpperCorners[3][0]) / 8;
      const centerY = (invertedLowerCorners[0][1] + invertedLowerCorners[1][1] + invertedLowerCorners[2][1] + invertedLowerCorners[3][1] + 
                       invertedUpperCorners[0][1] + invertedUpperCorners[1][1] + invertedUpperCorners[2][1] + invertedUpperCorners[3][1]) / 8;
      const centerZ = (invertedLowerCorners[0][2] + invertedLowerCorners[1][2] + invertedLowerCorners[2][2] + invertedLowerCorners[3][2] + 
                       invertedUpperCorners[0][2] + invertedUpperCorners[1][2] + invertedUpperCorners[2][2] + invertedUpperCorners[3][2]) / 8;
      
      // Create the box in Babylon.js
      const box = BABYLON.MeshBuilder.CreateBox(name, {
        width: width,
        height: height,
        depth: depth,
        updatable: true
      }, scene);
    
      // Position the box at the center
      box.position = new BABYLON.Vector3(centerX, centerY, centerZ);
    
      // Calculate rotation: Compute local axes with inverted z coordinates
      const lowerVec1 = BABYLON.Vector3.FromArray(invertedLowerCorners[0]);
      const lowerVec2 = BABYLON.Vector3.FromArray(invertedLowerCorners[1]);
      const lowerVec3 = BABYLON.Vector3.FromArray(invertedLowerCorners[3]);
    
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
    
      // Get or create color for this type
      const color = getColorForType(type);
      
      // Add material based on the type
      let material = scene.getMaterialByName(type);
      if (!material) {
        material = new BABYLON.StandardMaterial(type, scene);
        material.diffuseColor = color;
        material.alpha = 0.3; // Set transparency level (0 is fully transparent, 1 is fully opaque)
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

      // Create second box for the secondary scene
      const box2 = BABYLON.MeshBuilder.CreateBox(name, {
        width: width,
        height: height,
        depth: depth,
        updatable: true
      }, scene2);
      
      let material2 = scene2.getMaterialByName(type);
      if (!material2) {
        material2 = new BABYLON.StandardMaterial(type, scene2);
        material2.diffuseColor = color;
        material2.alpha = 0.3; // Set transparency level (0 is fully transparent, 1 is fully opaque)
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
      return new BBox(name, type, invertedLowerCorners, invertedUpperCorners, box, box2, [], [], description);
    };
    
    const loadJson = (json) => {
      console.log(json);
      if (scene) {
        // Dispose of existing boxes
        bboxes.forEach(bbox => bbox.box.dispose());
        bboxes.forEach(bbox => bbox.box2.dispose());
        setBboxes([]);
    
        Object.keys(json).forEach(className => {
          console.log(`Filename: ${className}`);
          const bbox_json=json[className]["bounding_boxes"][0]
          const corners = bbox_json["obb_corners"]; // Access objects within each class
          const lower_corners = corners.slice(0,4);
          const upper_corners = corners.slice(4,8);
          const object_id=json[className]["object_id"];
          const type=object_id.split("_")[0];
          const description=json[className]["description"];
          const bbox = createBoxFromCorners(object_id, type, corners, scene, description);
            console.log(`Added object in class: ${className}, Object: ${className}`);
        
            // Add the BBox object to the state
            setBboxes(prevBboxes => [...prevBboxes, bbox]);
        
          
        });
      }
      
    };
    
    const highlightBox = (box) => {
      if (scene) {
        // Remove hover highlight from all boxes
        bboxes.forEach(bbox => {
          if (bbox !== selectedBox) {
            bbox.box.edgesWidth = 8.0;
            bbox.box2.edgesWidth = 8.0;
            
            // Make axes less visible for non-highlighted boxes
            if (bbox.axisMeshes) {
              bbox.axisMeshes.forEach(axis => {
                axis.visibility = 0.3;
              });
            }
            if (bbox.axisMeshes2) {
              bbox.axisMeshes2.forEach(axis => {
                axis.visibility = 0.3;
              });
            }
          }
        });

        // Highlight the hovered box
        if (box !== selectedBox) {
          box.box.edgesWidth = 20.0;
          box.box2.edgesWidth = 20.0;
          
          // Make axes more visible for hovered box
          if (box.axisMeshes) {
            box.axisMeshes.forEach(axis => {
              axis.visibility = 0.7;
            });
          }
          if (box.axisMeshes2) {
            box.axisMeshes2.forEach(axis => {
              axis.visibility = 0.7;
            });
          }
        }
        
        // Highlight the corresponding item in the panel
        setHoveredBox(box);
        
        // Scroll to the item if needed
        if (facilityItemsRef.current[box.name] && facilityListRef.current) {
          facilityItemsRef.current[box.name].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          });
        }
      }
    };
    
    const selectBox = (box) => {
      if (scene) {
        // Reset all boxes to default state
        bboxes.forEach(bbox => {
          bbox.box.edgesWidth = 8.0;
          bbox.box2.edgesWidth = 8.0;
          
          if (bbox.axisMeshes) {
            bbox.axisMeshes.forEach(axis => {
              axis.visibility = 0.3;
            });
          }
          if (bbox.axisMeshes2) {
            bbox.axisMeshes2.forEach(axis => {
              axis.visibility = 0.3;
            });
          }
        });
        
        // Apply strong highlight to selected box
        if (box) {
          box.box.edgesWidth = 38.0;
          box.box2.edgesWidth = 38.0;
          
          // Make axes fully visible for selected box
          if (box.axisMeshes) {
            box.axisMeshes.forEach(axis => {
              axis.visibility = 1.0;
            });
          }
          if (box.axisMeshes2) {
            box.axisMeshes2.forEach(axis => {
              axis.visibility = 1.0;
            });
          }
        }
        
        setSelectedBox(box);
      }
    };
    
    const focusCameraOnBox = (box) => {
      if (scene && camera && box) {
        // Get the box's position
        const boxPosition = box.box.position.clone();
        
        // Calculate appropriate distance based on box size
        const boundingInfo = box.box.getBoundingInfo();
        const boxSize = boundingInfo.boundingBox.extendSize.length() * 2;
        
        // Calculate a good distance to view the box (adjust multiplier as needed)
        const distanceFactor = 2.5;
        const targetDistance = boxSize * distanceFactor;
        
        // Get current camera direction (normalized)
        const cameraDirection = camera.getTarget().subtract(camera.position).normalize();
        
        // Calculate new camera position
        const newPosition = boxPosition.subtract(cameraDirection.scale(targetDistance));
        
        // Animate the camera to the new position and target
        BABYLON.Animation.CreateAndStartAnimation(
          "cameraMove",
          camera,
          "position",
          30, // frames per second
          30, // number of frames
          camera.position,
          newPosition,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        BABYLON.Animation.CreateAndStartAnimation(
          "cameraTarget",
          camera,
          "target",
          30, // frames per second
          30, // number of frames
          camera.getTarget(),
          boxPosition,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
      }
    };
    
    const handleCanvasClick = (event) => {
      if (scene) {
        // Perform ray casting to detect if a box was clicked
        const pickResult = scene.pick(scene.pointerX, scene.pointerY);
        
        if (pickResult.hit && pickResult.pickedMesh) {
          // Find which bbox was clicked
          const clickedBox = bboxes.find(bbox => bbox.box === pickResult.pickedMesh);
          if (clickedBox) {
            // Check if it's a double click
            if (event.detail === 2) {
              // Double click - focus camera on the box
              focusCameraOnBox(clickedBox);
            } else {
              // Single click - select the box
              selectBox(clickedBox);
            }
            return;
          }
        }
        
        // If no box was clicked, deselect
        selectBox(null);
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
            
            // Scale the mesh to flip the z-axis (1, 1, -1)
            mesh.scaling = new BABYLON.Vector3(1, 1, -1);
        
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

        // Scale the mesh to flip the z-axis (1, 1, -1)
        mesh.scaling = new BABYLON.Vector3(1, 1, -1);
    
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
        
        // Override default keyboard behavior for arrow keys
        camera.keysUp = []; // Disable default up arrow behavior
        camera.keysDown = []; // Disable default down arrow behavior
        camera.keysLeft = []; // Disable default left arrow behavior
        camera.keysRight = []; // Disable default right arrow behavior
        
        // Add custom keyboard controls
        const moveSpeed = 1.5; // Adjust this value to control movement speed
        
        window.addEventListener("keydown", (evt) => {
          if (scene.activeCamera !== camera) return;
          
          // Get camera's view direction and right vector
          const forward = camera.getTarget().subtract(camera.position).normalize();
          const right = BABYLON.Vector3.Cross(forward, camera.upVector).normalize();
          
          // Calculate movement vectors
          let movementVector = new BABYLON.Vector3(0, 0, 0);
          
          switch (evt.keyCode) {
            case 38: // Up arrow - move forward
              movementVector = forward.scale(moveSpeed);
              break;
            case 40: // Down arrow - move backward
              movementVector = forward.scale(-moveSpeed);
              break;
            case 37: // Left arrow - move left
              movementVector = right.scale(moveSpeed);
              break;
            case 39: // Right arrow - move right
              movementVector = right.scale(-moveSpeed);
              break;
            default:
              return;
          }
          
          // Apply movement to both camera position and target
          camera.position.addInPlace(movementVector);
          camera.target.addInPlace(movementVector);
          
          evt.preventDefault(); // Prevent default browser behavior
        });
        
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

    useEffect(() => {
      const canvas = canvasRef.current;
      // Create a basic scene with a camera and light
      if (scene) {
        // Set up hover detection
        scene.onPointerMove = (event, pickResult) => {
          if (pickResult.hit && pickResult.pickedMesh) {
            // Find which bbox was hovered
            const hoveredBox = bboxes.find(bbox => bbox.box === pickResult.pickedMesh);
            if (hoveredBox) {
              highlightBox(hoveredBox);
            } else {
              // If we're not hovering over any box, clear the hover state
              setHoveredBox(null);
            }
          } else {
            // If we're not hovering over anything, clear the hover state
            setHoveredBox(null);
          }
        };
        
        // Set up click detection
        canvas.addEventListener('click', handleCanvasClick);
      }
  
      return () => {
        if (scene) {
          // Clean up the pointer move event
          scene.onPointerMove = null;
        }
        
        if (canvas) {
          canvas.removeEventListener('click', handleCanvasClick);
        }
      };
    }, [bboxes, scene, highlightBox, handleCanvasClick]);
  
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
    <div
      ref={facilityListRef}
      style={{
        flexGrow: 1,
        overflowY: "auto", // Allow scrolling when there are too many items
        marginBottom: "10px", // Ensure a small gap before the canvas
      }}
    >
      {bboxes.map((bbox, index) => (
        <div
          key={index}
          ref={el => facilityItemsRef.current[bbox.name] = el}
          onClick={() => selectBox(bbox)}
          onMouseEnter={() => highlightBox(bbox)}
          onMouseLeave={() => hoveredBox === bbox && setHoveredBox(null)}
          className="facility-item hover:bg-gray-200 rounded-md shadow-sm"
          style={{ 
            marginBottom: "12px",
            padding: "10px",
            transition: "all 0.3s ease",
            backgroundColor: selectedBox === bbox ? "#e6f7ff" : hoveredBox === bbox ? "#f5f5f5" : "white",
            cursor: "pointer",
            border: selectedBox === bbox ? "2px solid #1890ff" : "1px solid #e5e5e5",
            display: "flex",
            flexDirection: "column",
            transform: hoveredBox === bbox ? "translateY(-2px)" : "translateY(0)",
            boxShadow: selectedBox === bbox 
              ? "0 0 10px rgba(24, 144, 255, 0.5)" 
              : hoveredBox === bbox 
                ? "0 4px 6px rgba(0, 0, 0, 0.1)" 
                : "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  backgroundColor: typeColors[bbox.type] ? 
                    `rgb(${Math.round(typeColors[bbox.type].r * 255)}, ${Math.round(typeColors[bbox.type].g * 255)}, ${Math.round(typeColors[bbox.type].b * 255)})` : 
                    "#cccccc",
                  display: "inline-block",
                  marginRight: "12px",
                  borderRadius: "4px",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                }}
              ></div>
              <strong style={{ fontSize: "14px" }}>{typeNames[bbox.type] || bbox.type}</strong>
            </div>
            <button 
              className="btn btn-xs btn-outline"
              style={{
                padding: "2px 8px",
                fontSize: "12px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#f8f8f8",
                cursor: "pointer"
              }}
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the parent div's onClick
                selectBox(bbox);
                focusCameraOnBox(bbox); // Focus camera on the selected box
              }}
            >
              View
            </button>
          </div>
          <div style={{ 
            fontSize: "12px", 
            color: "#666", 
            marginTop: "6px",
            paddingLeft: "36px" 
          }}>
            {bbox.description || "No description available"}
          </div>
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