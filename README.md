# PixelForge — Image Editor 🎨

PixelForge is a powerful, browser-based image editor built entirely with vanilla HTML, CSS, and JavaScript. It provides a comprehensive suite of professional editing tools without the need for external dependencies, offering a fast and seamless experience right in your browser.

## ✨ Features

- **Layer Management**: Create, delete, and merge multiple layers to build complex image compositions.
- **Drawing Tools**: Brush, Eraser, Shapes (Rectangle, Circle, Line, Arrow), and Text tools with full customization (size, color, opacity, font, stroke).
- **Image Adjustments**: Fine-tune your images using sliders for Brightness, Contrast, Exposure, Saturation, Hue Rotate, Blur, Grayscale, Sepia, Opacity, and Invert.
- **Preset Filters**: Quickly apply stylistic looks like Vintage, Noir, Vivid, Dramatic, Warm, and Cold.
- **Smart Tools**: Select/Move elements, Pick colors with the Eyedropper, Zoom, and Pan across your canvas.
- **Image Manipulation**: 
  - Crop & Resize (with Aspect Ratio lock)
  - One-click Background Removal (using Color Tolerance)
  - Rotate (90° Left/Right) & Flip (Horizontal/Vertical)
- **History System**: Robust Undo & Redo capabilities.
- **Import/Export**: Easy image uploading and one-click downloading of your edited masterpieces.

## 🛠️ Technology Stack

- **HTML5**: Utilizing `<canvas>` for high-performance image processing and rendering.
- **CSS3**: Custom UI with modern styling, transitions, and responsive layout.
- **Vanilla JavaScript**: All logic, state management, and pixel manipulation handled natively. No heavy libraries or frameworks!

## 🚀 Getting Started

Since PixelForge is built with vanilla web technologies, no build step or package manager is required.

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Samridhii-20/image-editor.git
   cd image-editor
   ```

2. **Open the project:**
   You can simply open `index.html` in your default browser. However, for some features requiring image processing (like local canvas read/write operations), it's highly recommended to run a local server to avoid browser security restrictions.

   **Using Python (Mac/Linux):**
   ```bash
   python3 -m http.server 8000
   # Then visit http://localhost:8000 in your browser
   ```

   **Using VS Code:**
   Install the "Live Server" extension, right-click `index.html`, and select "Open with Live Server".

## 💡 How to Use

1. Click **Choose Image** or drag and drop an image onto the canvas to get started.
2. Use the **Left Toolbar** to draw, erase, or add shapes and text.
3. Access the **Right Panel** to manage layers, adjust image properties, or apply quick preset filters.
4. The **Top Bar** houses quick actions for rotating, flipping, cropping, resizing, background removal, and undo/redo.
5. When finished, hit **Download** to save your edited image.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to fork the repository and submit a pull request.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
