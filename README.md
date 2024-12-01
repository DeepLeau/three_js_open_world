
# 🌟 Third Person 3D Scene with Three.js

This project implements a third-person 3D scene using [Three.js](https://threejs.org/). It includes character animation, camera controls, interactive objects, and environmental features like skyboxes and dynamic lighting.

## ✨ Features

- **Character Controller**: Smooth animations for walking, running, jumping, and idle states.
- **Camera System**: A third-person camera that dynamically follows the character.
- **Interactive Objects**: Objects that respond to user actions, such as changing the environment.
- **Skyboxes**: Dynamic skyboxes for a rich visual experience.
- **Custom Assets**: Integration of 3D models and textures for a detailed environment.
- **Sound Effects**: Positional audio for a realistic experience.

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DeepLeau/three_js_open_world.git
   cd your-repository
   ```
2. Install a local web server (e.g., `http-server`) to serve the project:
   ```bash
   npm install -g http-server
   ```
3. Start the server:
   ```bash
   http-server
   ```
4. Open your browser and navigate to `http://localhost:8080`.

## 🎮 Usage

1. Use the following controls to interact with the scene:
   - **W, A, S, D (or Z, Q, S, D)**: Move forward, left, backward, and right.
   - **Shift**: Sprint.
   - **Spacebar**: Jump.
2. Click on interactive objects (like the red cylinder) to change the skybox.
3. Observe dynamic changes, such as object animations and audio effects.

## 📁 Project Structure

- **`models/`**: 3D models used in the scene.
- **`assets/`**: Textures, audio files, and fonts.
- **`scripts/`**: Main JavaScript files, including the character controller and camera logic.

## 📚 Resources

- [Third-Person Camera Tutorial by OslavDev](https://oslavdev.medium.com/third-person-controller-in-three-js-b643bec50f92)
- [Skybox Tutorial by YouTube - "Chris Courses"](https://www.youtube.com/watch?v=cp-H_6VODko)
- Textures: [Textures.com](https://www.textures.com/)
- Column and Hologram Models: [CGTrader](https://www.cgtrader.com/)
- Animations and Character Model: [Mixamo](https://www.mixamo.com/)

## 📦 Dependencies

- [Three.js](https://threejs.org/) (v0.118)
- FBXLoader and GLTFLoader for loading 3D models.
- A local web server (e.g., `http-server`).

## 🤝 Contributions

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Create a Pull Request.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Three.js Documentation](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)
