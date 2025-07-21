import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import "@babylonjs/loaders/OBJ/objFileLoader";

/**
 * BabylonScene Component - Renders 3D scene with dual-view setup
 * Main features:
 * - Primary 3D perspective view for model exploration
 * - Secondary orthographic top-down view for floor plan navigation
 * - Interactive bounding box visualization for detected objects
 * - Facility panel with object selection and description
 */
const BabylonScene = forwardRef((props, ref) => {
  // Canvas references
  const canvasRef = useRef(null);
  const secondaryCanvasRef = useRef(null);
  
  // Scene and camera state
  const [scene, setScene] = useState(null);
  const [scene2, setScene2] = useState(null);
  const [camera, setCamera] = useState(null);
  const [secondaryCamera, setSecondaryCamera] = useState(null);
  
  // Bounding box and interaction state
  const [bboxes, setBboxes] = useState([]);
  const [typeColors, setTypeColors] = useState({});
  const [typeNames, setTypeNames] = useState({});
  const [hoveredBox, setHoveredBox] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  
  // UI references
  const facilityItemsRef = useRef({});
  const facilityListRef = useRef(null);
    
  /**
   * BBox Class - Represents a bounding box for detected objects
   * Contains geometry data and 3D mesh references for both scenes
   */
  class BBox {
    constructor(name, type, lowerCorners, upperCorners, box, box2, axisMeshes, axisMeshes2, description) {
      this.name = name;
      this.type = type;
      this.lowerCorners = lowerCorners;
      this.upperCorners = upperCorners;
      this.box = box;                    // Main scene mesh
      this.box2 = box2;                  // Secondary scene mesh
      this.axisMeshes = axisMeshes || [];
      this.axisMeshes2 = axisMeshes2 || [];
      this.description = description || "";
    }
  }
    
  /**
   * Color palette management for object types
   * Uses predefined palette first, then generates random colors
   */
  const COLOR_PALETTE = [
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

  const getRandomColor = () => {
    // Use palette colors first
    if (typeof getRandomColor.colorIndex === 'undefined') {
      getRandomColor.colorIndex = 0;
    }
    
    if (getRandomColor.colorIndex < COLOR_PALETTE.length) {
      const color = COLOR_PALETTE[getRandomColor.colorIndex];
      getRandomColor.colorIndex++;
      return color;
    }
    
    // Generate random bright colors when palette is exhausted
    const r = Math.random();
    const g = Math.random();
    const b = Math.random();
    const maxChannel = Math.max(r, g, b);
    const brightnessFactor = 0.8 + Math.random() * 0.2;
    
    return new BABYLON.Color3(
      r === maxChannel ? brightnessFactor : 0.2 + r * 0.5,
      g === maxChannel ? brightnessFactor : 0.2 + g * 0.5,
      b === maxChannel ? brightnessFactor : 0.2 + b * 0.5
    );
  };
    
  /**
   * Get or create a color for an object type
   * Ensures consistent coloring across all objects of the same type
   */
  const getColorForType = (type) => {
    if (!typeColors[type]) {
      const newColor = getRandomColor();
      setTypeColors(prev => ({ ...prev, [type]: newColor }));
      return newColor;
    }
    return typeColors[type];
  };
    
  /**
   * Create 3D bounding boxes from corner coordinates
   * Handles coordinate transformation and creates meshes for both scenes
   */
  const createBoxFromCorners = (name, type, corners, scene, description) => {
    // Process corner coordinates
    const lowerCorners = corners.slice(0, 4);
    const upperCorners = corners.slice(4, 8);
    
    // Apply z-axis inversion for coordinate system alignment
    const invertedLowerCorners = lowerCorners.map(corner => 
      [corner[0], corner[1], -corner[2]]
    );
    const invertedUpperCorners = upperCorners.map(corner => 
      [corner[0], corner[1], -corner[2]]
    );
    
    // Calculate dimensions and center
    const { width, height, depth, center } = calculateBoxGeometry(
      invertedLowerCorners, 
      invertedUpperCorners
    );
    
    // Calculate rotation from corner vectors
    const rotation = calculateBoxRotation(invertedLowerCorners);
    
    // Create material for this object type
    const color = getColorForType(type);
    const { material, material2 } = createBoxMaterials(type, color, scene, scene2);
    
    // Create primary box
    const box = createBoxMesh(name, { width, height, depth }, center, rotation, material, scene);
    
    // Create secondary box for floor plan view
    const box2 = createBoxMesh(name, { width, height, depth }, center, rotation, material2, scene2);
    
    // Initially hide boxes (shown only when selected/highlighted)
    box.visibility = 0;
    box2.visibility = 0;
    
    return new BBox(name, type, invertedLowerCorners, invertedUpperCorners, box, box2, [], [], description);
  };

  /**
   * Calculate box geometry from corner coordinates
   */
  const calculateBoxGeometry = (lowerCorners, upperCorners) => {
    const width = BABYLON.Vector3.Distance(
      new BABYLON.Vector3(...lowerCorners[0]), 
      new BABYLON.Vector3(...lowerCorners[1])
    );
    const depth = BABYLON.Vector3.Distance(
      new BABYLON.Vector3(...lowerCorners[0]), 
      new BABYLON.Vector3(...lowerCorners[2])
    );
    const height = BABYLON.Vector3.Distance(
      new BABYLON.Vector3(...lowerCorners[0]), 
      new BABYLON.Vector3(...upperCorners[0])
    );
    
    // Calculate center point
    const allCorners = [...lowerCorners, ...upperCorners];
    const center = {
      x: allCorners.reduce((sum, corner) => sum + corner[0], 0) / 8,
      y: allCorners.reduce((sum, corner) => sum + corner[1], 0) / 8,
      z: allCorners.reduce((sum, corner) => sum + corner[2], 0) / 8
    };
    
    return { width, height, depth, center };
  };

  /**
   * Calculate box rotation from corner vectors
   */
  const calculateBoxRotation = (lowerCorners) => {
    const lowerVec1 = BABYLON.Vector3.FromArray(lowerCorners[0]);
    const lowerVec2 = BABYLON.Vector3.FromArray(lowerCorners[1]);
    const lowerVec3 = BABYLON.Vector3.FromArray(lowerCorners[3]);
    
    const localX = lowerVec2.subtract(lowerVec1).normalize();
    const localZ = lowerVec3.subtract(lowerVec1).normalize();
    const localY = BABYLON.Vector3.Cross(localZ, localX).normalize();
    
    const rotationMatrix = BABYLON.Matrix.FromValues(
      localX.x, localX.y, localX.z, 0,
      localY.x, localY.y, localY.z, 0,
      localZ.x, localZ.y, localZ.z, 0,
      0, 0, 0, 1
    );
    
    const rotationQuaternion = new BABYLON.Quaternion();
    rotationMatrix.decompose(undefined, rotationQuaternion);
    
    return rotationQuaternion;
  };

  /**
   * Create materials for both scenes
   */
  const createBoxMaterials = (type, color, scene, scene2) => {
    let material = scene.getMaterialByName(type);
    if (!material) {
      material = new BABYLON.StandardMaterial(type, scene);
      material.diffuseColor = color;
      material.alpha = 0.3;
    }
    
    let material2 = scene2.getMaterialByName(type);
    if (!material2) {
      material2 = new BABYLON.StandardMaterial(type, scene2);
      material2.diffuseColor = color;
      material2.alpha = 0.3;
    }
    
    return { material, material2 };
  };

  /**
   * Create a box mesh with edges and styling
   */
  const createBoxMesh = (name, dimensions, center, rotation, material, scene) => {
    const box = BABYLON.MeshBuilder.CreateBox(name, {
      width: dimensions.width,
      height: dimensions.height,
      depth: dimensions.depth,
      updatable: true
    }, scene);
    
    box.position = new BABYLON.Vector3(center.x, center.y, center.z);
    box.rotationQuaternion = rotation;
    box.material = material;
    
    // Enable edges rendering with color matching
    box.enableEdgesRendering();
    box.edgesWidth = 8.0;
    box.edgesColor = new BABYLON.Color4(
      material.diffuseColor.r,
      material.diffuseColor.g,
      material.diffuseColor.b,
      1
    );
    
    return box;
  };
    
    const loadJson = (json) => {
      console.log(json);
      if (scene) {
        // Dispose of existing boxes
        bboxes.forEach(bbox => bbox.box.dispose());
        bboxes.forEach(bbox => bbox.box2.dispose());
        setBboxes([]);
    
        Object.keys(json).forEach(className => {
          try {
            console.log(`Filename: ${className}`);
            const bbox_json = json[className]["bounding_boxes"][0];
            const corners = bbox_json["obb_corners"]; // Access objects within each class
            const lower_corners = corners.slice(0, 4);
            const upper_corners = corners.slice(4, 8);
            const object_id = json[className]["object_id"];
            const type = object_id.split("_")[0];
            const description = json[className]["description"];
            const bbox = createBoxFromCorners(object_id, type, corners, scene, description);
            console.log(`Added object in class: ${className}, Object: ${className}`);
            
            // Add the BBox object to the state
            setBboxes(prevBboxes => [...prevBboxes, bbox]);
          } catch (error) {
            console.error(`Error processing object in class: ${className}`, error);
          }
        
          
        });
      }
      
    };
    
    const highlightBox = (box) => {
      if (scene) {
        // Hide all boxes that are not selected
        bboxes.forEach(bbox => {
          if (bbox !== selectedBox && bbox !== box) {
            bbox.box.visibility = 0;
            bbox.box2.visibility = 0;
            
            // Hide axes for non-highlighted boxes
            if (bbox.axisMeshes) {
              bbox.axisMeshes.forEach(axis => {
                axis.visibility = 0;
              });
            }
            if (bbox.axisMeshes2) {
              bbox.axisMeshes2.forEach(axis => {
                axis.visibility = 0;
              });
            }
          }
        });

        // Show and highlight the hovered box
        if (box !== selectedBox) {
          box.box.visibility = 1;
          box.box2.visibility = 1;
          box.box.edgesWidth = 10.0;
          box.box2.edgesWidth = 10.0;
          
          // Make axes visible for hovered box
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
        // Hide all boxes
        bboxes.forEach(bbox => {
          if (bbox !== box) {
            bbox.box.visibility = 0;
            bbox.box2.visibility = 0;
            
            if (bbox.axisMeshes) {
              bbox.axisMeshes.forEach(axis => {
                axis.visibility = 0;
              });
            }
            if (bbox.axisMeshes2) {
              bbox.axisMeshes2.forEach(axis => {
                axis.visibility = 0;
              });
            }
          }
        });
        
        // Show and apply strong highlight to selected box
        if (box) {
          box.box.visibility = 1;
          box.box2.visibility = 1;
          box.box.edgesWidth = 15.0;
          box.box2.edgesWidth = 15.0;
          
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
        // const pickResult = scene.pick(scene.pointerX, scene.pointerY);
        
        // if (pickResult.hit && pickResult.pickedMesh) {
        //   // Find which bbox was clicked
        //   const clickedBox = bboxes.find(bbox => bbox.box === pickResult.pickedMesh);
        //   if (clickedBox) {
        //     // Check if it's a double click
        //     if (event.detail === 2) {
        //       // Double click - focus camera on the box
        //       focusCameraOnBox(clickedBox);
        //     } else {
        //       // Single click - select the box
        //       selectBox(clickedBox);
        //     }
        //     return;
        //   }
        // }
        
        // If no box was clicked, deselect
        //selectBox(null);
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
        //scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
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

        // Add double-click event to center camera on clicked point
        secondaryCanvas.addEventListener("dblclick", (event) => {
          // Get the pick info from the scene
          const pickResult = scene2.pick(event.offsetX, event.offsetY);
          
          if (pickResult.hit) {
            // Get the hit position in world coordinates
            const hitPoint = pickResult.pickedPoint;
            
            // Create animation to smoothly move camera target to the hit point
            BABYLON.Animation.CreateAndStartAnimation(
              "cameraTargetAnimation",
              secondaryCamera,
              "target",
              30, // frames per second
              30, // number of frames
              secondaryCamera.target,
              hitPoint,
              BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
            
            // Adjust camera position to maintain the same view distance
            const direction = secondaryCamera.position.subtract(secondaryCamera.target).normalize();
            const distance = secondaryCamera.position.subtract(secondaryCamera.target).length();
            const newPosition = hitPoint.add(direction.scale(distance));
            
            // Animate camera position
            BABYLON.Animation.CreateAndStartAnimation(
              "cameraPositionAnimation",
              secondaryCamera,
              "position",
              30, // frames per second
              30, // number of frames
              secondaryCamera.position,
              newPosition,
              BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
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
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
      <button 
        className="btn btn-primary"
        style={{
          padding: "8px 16px",
          fontSize: "14px",
          borderRadius: "4px",
          backgroundColor: "#1890ff",
          color: "white",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s ease"
        }}
        onClick={() => {
          if (camera) {
            // Reset to bird's eye view
            camera.position = new BABYLON.Vector3(0, 20, 0);
            camera.setTarget(new BABYLON.Vector3(0, 0, 0));
          }
          // Reset the secondary camera as well
          if (secondaryCamera) {
            const boundingInfo = scene2.meshes[0]?.getBoundingInfo();
            if (boundingInfo) {
              const boundingBox = boundingInfo.boundingBox;
              const center = boundingBox.centerWorld;
              const extendSize = boundingBox.extendSizeWorld;
              
              secondaryCamera.position = new BABYLON.Vector3(center.x, center.y + extendSize.y * 2, center.z);
              secondaryCamera.setTarget(center);
            }
          }
          
          // Deselect the currently selected box
          setSelectedBox(null);
          
          // Hide all boxes
          bboxes.forEach(bbox => {
            bbox.box.visibility = 0;
            bbox.box2.visibility = 0;
            
            // Hide axes
            if (bbox.axisMeshes) {
              bbox.axisMeshes.forEach(axis => {
                axis.visibility = 0;
              });
            }
            if (bbox.axisMeshes2) {
              bbox.axisMeshes2.forEach(axis => {
                axis.visibility = 0;
              });
            }
          });
        }}
      >
        Return to Bird's Eye View
      </button>
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