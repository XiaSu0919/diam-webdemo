# FlyMeThrough

A 3D indoor space exploration web application for visualizing and navigating indoor environments with AI-detected object annotations.

## Overview

This React-based application provides an immersive 3D exploration platform that lets you "fly through" indoor environments, featuring:

- **Dual-View Interface**: Primary 3D perspective view and secondary orthographic floor plan view
- **AI Object Detection**: Visualize detected objects with colored bounding boxes and descriptions
- **Interactive Navigation**: Click, hover, and keyboard-controlled camera movement
- **Space Management**: Browse, download, and select different indoor spaces
- **Real-time Object Exploration**: Explore and interact with detected objects within each space

## Features

### 🏢 Space Exploration
- Browse available indoor environments with preview images  
- Download 3D models (.ply files) for immersive exploration
- Visual download progress indicators
- Seamless model loading with interactive object detection

### 🎮 3D Navigation
- **Main View**: Full 3D perspective with intuitive mouse/keyboard flight controls
- **Floor Plan View**: Top-down orthographic view for spatial orientation
- **Dual-view synchronization** for seamless navigation experience

### 🔍 Object Detection & Interaction
- Color-coded bounding boxes for different object types
- Interactive object selection and highlighting
- Object panel with detailed descriptions
- Camera focus on selected objects
- Hover effects and visual feedback

### 🎨 Visual Features
- Transparent bounding boxes with colored edges
- Consistent color coding by object type
- Smooth camera animations and transitions
- Responsive design with fixed left panel

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flymethrough
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Usage Guide

### Getting Started

1. **Browse Spaces**: Available spaces appear in the left panel with preview images
2. **Download Models**: Click on a space to download its 3D model (indicated by download icon)
3. **Explore Space**: Once downloaded (green checkmark), click to load the space
4. **Fly Through**: Use mouse to look around, arrow keys to fly through the space

### Navigation Controls

#### Main 3D View
- **Mouse**: Drag to rotate, scroll to zoom
- **Arrow Keys**: 
  - ↑ Move forward
  - ↓ Move backward  
  - ← Move left
  - → Move right

#### Floor Plan View
- **Mouse Wheel**: Zoom in/out
- **Double-click**: Center camera on clicked location

### Object Interaction

- **Hover**: Objects highlight with thicker edges and appear in object panel
- **Click**: Select objects for persistent highlighting
- **View Button**: Focus camera on selected object
- **Return to Bird's Eye**: Reset to overview perspective

## Architecture

### Component Structure

```
src/
├── App.js              # Main application component
├── BabylonScene.js     # 3D visualization engine
├── LeftPanel.js        # Space selection and browsing
├── Space.js            # Data model for spaces
└── Icons/              # UI icons (loading, ready, download)
```

### Key Technologies

- **React 18**: Modern React with hooks and functional components
- **Babylon.js 7**: Advanced 3D rendering engine
- **Tailwind CSS + DaisyUI**: Utility-first styling framework
- **Modern JavaScript**: ES6+ features and async/await patterns

### Data Flow

1. **Space Loading**: Fetch space metadata from server
2. **Image Processing**: Download and create local blob URLs for previews
3. **Model Download**: On-demand .ply file download with progress tracking
4. **Object Processing**: Parse JSON object detection data into 3D bounding boxes
5. **Rendering**: Dual-scene rendering with synchronized cameras

## Configuration

### Server Configuration

Update the server URL in `src/App.js`:

```javascript
const SERVER_URL = "https://your-server-url.com/";
// const SERVER_URL = "http://localhost/"; // For local development
```

### Styling Customization

The application uses a combination of:
- **Inline styles** for dynamic and component-specific styling
- **Tailwind classes** for utility-based styling
- **CSS-in-JS** for hover effects and animations

## API Integration

The application expects the following server endpoints:

### GET /spaces
Returns an array of available spaces:
```json
[
  {
    "name": "Office Floor 1",
    "image": "preview.jpg",
    "ply_file": "model.ply",
    "json_files": { /* object detection data */ }
  }
]
```

### Static File Serving
- Images: `/images/{space_name}/{image_file}`
- Models: `/files/{ply_file}`

## Development

### Adding New Features

1. **New Object Types**: Update color palette in `BabylonScene.js`
2. **Additional Views**: Extend camera system in scene creation
3. **Enhanced Interactions**: Add event handlers in interaction functions
4. **UI Improvements**: Modify styles in component files

### Performance Considerations

- Models are loaded on-demand to reduce initial load time
- Bounding boxes are hidden by default and shown only on interaction
- Image blobs are created locally for faster preview loading
- Efficient React state management prevents unnecessary re-renders

### Debugging

Enable console logging by checking browser developer tools. Key log messages include:
- Space loading progress
- Model download status
- Object detection processing
- Camera movement events

## Browser Support

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support with potential WebGL performance differences

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is FlyMeThrough - an innovative 3D indoor space visualization platform.

## Troubleshooting

### Common Issues

**Models not loading**: Check server URL and CORS configuration
**Performance issues**: Reduce model complexity or limit concurrent objects
**Camera controls not working**: Ensure canvas has focus and no conflicting event handlers

### Support

For technical issues or questions about the FlyMeThrough platform, please check the project documentation or create an issue in the repository.

---

*Built with React and Babylon.js for immersive 3D indoor space exploration and navigation.*