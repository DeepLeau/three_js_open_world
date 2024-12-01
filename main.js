import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';


class CharacterControllerProxy {
  constructor(animations) {
    this._animations = animations;
  }

  get animations() {
    return this._animations;
  }
};


class CharacterController {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 100.0);
    this._velocity = new THREE.Vector3(0, 0, 0);
    this._position = new THREE.Vector3();

    this._animations = {};
    this._input = new CharacterControllerInput();
    this._stateMachine = new CharacterFSM(
        new CharacterControllerProxy(this._animations));

    this._LoadModels();
  }

  _LoadModels() {
    const loader = new FBXLoader();
    loader.setPath('./models/aventurier/');
    loader.load('aventurier.fbx', (fbx) => {
      fbx.scale.setScalar(0.1);
      fbx.traverse(c => {
        c.castShadow = true;
      });
  
      this._target = fbx;
      this._params.scene.add(this._target);
  
      this._mixer = new THREE.AnimationMixer(this._target);
  
      this._manager = new THREE.LoadingManager();
      this._manager.onLoad = () => {
        this._stateMachine.SetState('idle');
      };
  
      const _OnLoad = (animName, anim) => {
        const clip = anim.animations[0];
        const action = this._mixer.clipAction(clip);
  
        this._animations[animName] = {
          clip: clip,
          action: action,
        };
      };
  
      const animLoader = new FBXLoader(this._manager);
      animLoader.setPath('./models/aventurier/');
      animLoader.load('walk.fbx', (a) => { _OnLoad('walk', a); });
      animLoader.load('running.fbx', (a) => { _OnLoad('run', a); });
      animLoader.load('idle.fbx', (a) => { _OnLoad('idle', a); });
      animLoader.load('jump.fbx', (a) => { _OnLoad('jump', a); });
    });
  }

  get Position() {
    return this._position;
  }

  get Rotation() {
    if (!this._target) {
      return new THREE.Quaternion();
    }
    return this._target.quaternion;
  }

  Update(timeInSeconds) {
    if (!this._stateMachine._currentState) {
      return;
    }
  
    this._stateMachine.Update(timeInSeconds, this._input);
  
    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
      velocity.x * this._decceleration.x,
      velocity.y * this._decceleration.y,
      velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
      Math.abs(frameDecceleration.z), Math.abs(velocity.z)
    );
  
    velocity.add(frameDecceleration);
  
    const controlObject = this._target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();
  
    const acc = this._acceleration.clone();
    if (this._input._keys.shift) {
      acc.multiplyScalar(2.0);
    }
  
    if (this._stateMachine._currentState.Name === 'jump') {
      acc.multiplyScalar(0.0);
    }
  
    if (this._input._keys.forward) {
      velocity.z += acc.z * timeInSeconds;
    }
    if (this._input._keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
    }
    if (this._input._keys.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._input._keys.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
  
    controlObject.quaternion.copy(_R);
  
    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);
  
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();
  
    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();
  
    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);
  
    controlObject.position.add(forward);
    controlObject.position.add(sideways);
  
    controlObject.position.x = Math.max(-250, Math.min(250, controlObject.position.x));
    controlObject.position.z = Math.max(-250, Math.min(250, controlObject.position.z));
  
    this._position.copy(controlObject.position);
  
    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }
  
};

class CharacterControllerInput {
  constructor() {
    this._Init();    
  }

  _Init() {
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
      shift: false,
    };
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 90: // z
        this._keys.forward = true;
        break;
      case 81: // q
        this._keys.left = true;
        break;
      case 83: // s
        this._keys.backward = true;
        break;
      case 68: // d
        this._keys.right = true;
        break;
      case 32: // SPACE
        this._keys.space = true;
        break;
      case 16: // SHIFT
        this._keys.shift = true;
        break;
    }
  }

  _onKeyUp(event) {
    switch(event.keyCode) {
      case 90: // z
        this._keys.forward = false;
        break;
      case 81: // q
        this._keys.left = false;
        break;
      case 83: // s
        this._keys.backward = false;
        break;
      case 68: // d
        this._keys.right = false;
        break;
      case 32: // SPACE
        this._keys.space = false;
        break;
      case 16: // SHIFT
        this._keys.shift = false;
        break;
    }
  }
};


class FiniteStateMachine {
  constructor() {
    this._states = {};
    this._currentState = null;
  }

  _AddState(name, type) {
    this._states[name] = type;
  }

  SetState(name) {
    const prevState = this._currentState;
    
    if (prevState) {
      if (prevState.Name == name) {
        return;
      }
      prevState.Exit();
    }

    const state = new this._states[name](this);

    this._currentState = state;
    state.Enter(prevState);
  }

  Update(timeElapsed, input) {
    if (this._currentState) {
      this._currentState.Update(timeElapsed, input);
    }
  }
};


class CharacterFSM extends FiniteStateMachine {
  constructor(proxy) {
    super();
    this._proxy = proxy;
    this._Init();
  }

  _Init() {
    this._AddState('idle', IdleState);
    this._AddState('walk', WalkState);
    this._AddState('run', RunState);
    this._AddState('jump', JumpState);
  }
};


class State {
  constructor(parent) {
    this._parent = parent;
  }

  Enter() {}
  Exit() {}
  Update() {}
};


class JumpState extends State {
  constructor(parent) {
    super(parent);

    this._FinishedCallback = () => {
      this._Finished();
    }
  }

  get Name() {
    return 'jump';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['jump'].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener('finished', this._FinishedCallback);

    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.reset();  
      curAction.setLoop(THREE.LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.2, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _Finished() {
    this._Cleanup();
    this._parent.SetState('idle');
  }

  _Cleanup() {
    const action = this._parent._proxy._animations['jump'].action;
    
    action.getMixer().removeEventListener('finished', this._CleanupCallback);
  }

  Exit() {
    this._Cleanup();
  }

  Update(_) {
  }
};


class WalkState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'walk';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['walk'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == 'run') {
        const ratio = curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {
  }

  Update(timeElapsed, input) {
    if (input._keys.forward || input._keys.backward) {
      if (input._keys.shift) {
        this._parent.SetState('run');
      }
      return;
    }

    this._parent.SetState('idle');
  }
};


class RunState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'run';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['run'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == 'walk') {
        const ratio = curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {
  }

  Update(timeElapsed, input) {
    if (input._keys.forward || input._keys.backward) {
      if (!input._keys.shift) {
        this._parent.SetState('walk');
      }
      return;
    }

    this._parent.SetState('idle');
  }
};


class IdleState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'idle';
  }

  Enter(prevState) {
    const idleAction = this._parent._proxy._animations['idle'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;
      idleAction.time = 0.0;
      idleAction.enabled = true;
      idleAction.setEffectiveTimeScale(1.0);
      idleAction.setEffectiveWeight(1.0);
      idleAction.crossFadeFrom(prevAction, 0.5, true);
      idleAction.play();
    } else {
      idleAction.play();
    }
  }

  Exit() {
  }

  Update(_, input) {
    if (input._keys.forward || input._keys.backward) {
      this._parent.SetState('walk');
    } else if (input._keys.space) {
      this._parent.SetState('jump');
    }
  }
};


class ThirdPersonCamera {
  constructor(params) {
    this._params = params;
    this._camera = params.camera;

    this._currentPosition = new THREE.Vector3();
    this._currentLookat = new THREE.Vector3();
  }

  _CalculateIdealOffset() {
    const idealOffset = new THREE.Vector3(-15, 20, -30);
    idealOffset.applyQuaternion(this._params.target.Rotation);
    idealOffset.add(this._params.target.Position);
    return idealOffset;
  }

  _CalculateIdealLookat() {
    const idealLookat = new THREE.Vector3(0, 10, 50);
    idealLookat.applyQuaternion(this._params.target.Rotation);
    idealLookat.add(this._params.target.Position);
    return idealLookat;
  }

  Update(timeElapsed) {
    const idealOffset = this._CalculateIdealOffset();
    const idealLookat = this._CalculateIdealLookat();

    // const t = 0.05;
    // const t = 4.0 * timeElapsed;
    const t = 1.0 - Math.pow(0.001, timeElapsed);

    this._currentPosition.lerp(idealOffset, t);
    this._currentLookat.lerp(idealLookat, t);

    this._camera.position.copy(this._currentPosition);
    this._camera.lookAt(this._currentLookat);
  }
}


class ThirdPerson {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    this._scene = new THREE.Scene();

    const listener = new THREE.AudioListener();
    this._camera.add(listener);

    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(-100, 100, 100);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 50;
    light.shadow.camera.right = -50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    this._scene.add(light);

    light = new THREE.AmbientLight(0xFFFFFF, 0.25);
    this._scene.add(light);

    const loader = new THREE.CubeTextureLoader();
    const skybox2 = loader.load([
        './assets/calm_sea_ft.jpg',
        './assets/calm_sea_bk.jpg',
        './assets/calm_sea_up.jpg',
        './assets/calm_sea_dn.jpg',
        './assets/calm_sea_rt.jpg',
        './assets/calm_sea_lf.jpg',
    ]);
    const skybox1 = loader.load([
      './assets/divine_ft.jpg',
      './assets/divine_bk.jpg',
      './assets/divine_up.jpg',
      './assets/divine_dn.jpg',
      './assets/divine_rt.jpg',
      './assets/divine_lf.jpg',
    ]);
    const skybox3 = loader.load([
      './assets/mystic_ft.jpg',
      './assets/mystic_bk.jpg',
      './assets/mystic_up.jpg',
      './assets/mystic_dn.jpg',
      './assets/mystic_rt.jpg',
      './assets/mystic_lf.jpg',
    ]);

    skybox1.encoding = THREE.sRGBEncoding;
    skybox2.encoding = THREE.sRGBEncoding;
    skybox3.encoding = THREE.sRGBEncoding;

    const skyboxes = [skybox1, skybox2, skybox3];
    let currentSkyboxIndex = 0;
    this._scene.background = skyboxes[currentSkyboxIndex];


    const textureLoader = new THREE.TextureLoader();
    const planA0 = textureLoader.load("./assets/textures/blue_crystal_43_01_ao.jpg")
    const planMetal = textureLoader.load("./assets/textures/blue_crystal_43_01_metallic.jpg")
    const planRough = textureLoader.load("./assets/textures/blue_crystal_43_01_roughness.jpg")
    const planNormal = textureLoader.load("./assets/textures/blue_crystal_43_01_normal.jpg")
    const planHeight = textureLoader.load("./assets/textures/blue_crystal_43_01_height.jpg")
    const planColor = textureLoader.load("./assets/textures/blue_crystal_43_01_diffuse.jpg")

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500, 10, 10),
        new THREE.MeshStandardMaterial({
            map:planColor,
            normalMap: planNormal,
            displacementMap: planHeight,
            roughnessMap: planRough,
            aoMap: planA0,
            metalnessMap: planMetal
          }));

    plane.position.set(0, 0, 0);
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);

    const loader2 = new GLTFLoader();
    loader2.load('./models/holo.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(10, 10, 10); 
      model.position.set(200, 0, 200); 
      model.rotation.set(0, -2*Math.PI/3, 0); 
      this._scene.add(model);
    });

    const loader3 = new GLTFLoader();
    loader3.load('./models/seamless.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(10, 10, 10); 
      const boundingBox = new THREE.Box3().setFromObject(model);
      model.userData.boundingBox = boundingBox;

      model.position.set(200, 20, 100); 
      model.rotation.set(0, -2*Math.PI/3, 0); 
      this._scene.add(model);
    });

    const planeWidth = 500;
    const planeHeight = 500;

    const hologramExclusionZone = {
      xMin: 150, 
      xMax: 250,
      zMin: 150,
      zMax: 250,
    };

    const columnPositions = [];

    for (let x = -planeWidth / 2; x <= planeWidth / 2; x += 50) {
      columnPositions.push([x, -planeHeight / 2]); 
      columnPositions.push([x, planeHeight / 2]); 
    }
    
    for (let z = -planeHeight / 2; z <= planeHeight / 2; z += 50) {
      columnPositions.push([-planeWidth / 2, z]); 
      columnPositions.push([planeWidth / 2, z]); 
    }

    const loader4 = new GLTFLoader();
    loader4.load('./models/column.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(20, 20, 20); 

      columnPositions.forEach(([x, z]) => {
        if (
          (x < hologramExclusionZone.xMin || x > hologramExclusionZone.xMax ||
          z < hologramExclusionZone.zMin || z > hologramExclusionZone.zMax) &&
          (x > -250 && z >-250)
        ) {
          const column = model.clone(); 
          column.position.set(x, 0, z);
          this._scene.add(column);
        }
      });
    });

    const audioLoader = new THREE.AudioLoader();

    const loader5 = new GLTFLoader();
    loader5.load('./models/upper_holo.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(10, 10, 10); 
      model.position.set(200, 20, 200); 
      model.rotation.set(0, Math.PI/3, 0); 
      this._scene.add(model);

      const sound = new THREE.PositionalAudio(listener);
      audioLoader.load('./assets/sounds/hologram_sound.mp3', (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true); 
        sound.setVolume(1.0); 
        sound.play(); 
    });

    model.add(sound);
    });

    const loader6 = new GLTFLoader();
    loader6.load('./models/ai_powered.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(10, 10, 10); 
      model.position.set(100, 20, 200); 
      model.rotation.set(0, -6*Math.PI/7, 0); 
      this._scene.add(model);
    });

    this._spheres = [];

    const textureLoader2 = new THREE.TextureLoader();

    const numSpheres = 14;
    for (let i = 0; i < numSpheres; i++) {
      const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        map: textureLoader2.load(`./assets/languages/language_logo_${i + 1}.png`), 
      });

      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(i * 20 - 30, 10, -200);
      sphere.rotation.set(0, -Math.PI/3,0)
      sphere.castShadow = true; 
      sphere.receiveShadow = true;
      this._scene.add(sphere);

      this._spheres.push(sphere); 
    }

    const cubeGeometry = new THREE.BoxGeometry(10, 10, 10);
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(50, 5, 50); 
    cube.castShadow = true; 
    cube.receiveShadow = true; 
    this._scene.add(cube);

    const cylinderGeometry = new THREE.CylinderGeometry(2, 2, 3, 32);
    const cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); 
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.set(50, 10, 50);
    cylinder.castShadow = true; 
    cylinder.receiveShadow = true; 
    this._scene.add(cylinder);

    const arrowGeometry = new THREE.ConeGeometry(3, 10, 32);
    const arrowMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    this._arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    this._arrow.position.set(50, 25, 50); 
    this._arrow.rotation.x = Math.PI; 
    this._arrow.castShadow = true;
    this._arrowDirection = 1;
    this._arrowSpeed = 0.1;
    this._scene.add(this._arrow);

    const fontLoader = new THREE.FontLoader();
    fontLoader.load('./assets/fonts/helvetiker_regular.typeface.json', (font) => {
      const textGeometry = new THREE.TextGeometry("DON'T CLICK", {
        font: font,
        size: 3,
        height: 0.5,
      });
    
      const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      this._textMesh = new THREE.Mesh(textGeometry, textMaterial);
      this._textMesh.position.set(35, 40, 50); 
      this._textMesh.rotation.y = Math.PI / 4;
      this._textMesh.castShadow = true;
      this._textMesh.material.color.set(0xFF0033);
      this._scene.add(this._textMesh);
    });
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('mousedown', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
      raycaster.setFromCamera(mouse, this._camera);
  
      const intersects = raycaster.intersectObjects([cylinder]);
  
      if (intersects.length > 0) {
          currentSkyboxIndex = (currentSkyboxIndex + 1) % skyboxes.length;
          this._scene.background = skyboxes[currentSkyboxIndex];
  
          console.log(`Skybox actuelle : ${currentSkyboxIndex + 1}`);
      }
    });

    this._mixers = [];
    this._previousRAF = null;

    this._LoadAnimatedModel();
    this._RAF();
  }

  _LoadAnimatedModel() {
    const params = {
      camera: this._camera,
      scene: this._scene,
    }
    this._controls = new CharacterController(params);

    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this._camera,
      target: this._controls,
    });
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this._mixers) {
      this._mixers.map(m => m.update(timeElapsedS));
    }

    if (this._controls) {
      this._controls.Update(timeElapsedS);
    }

    this._thirdPersonCamera.Update(timeElapsedS);

    this._spheres.forEach(sphere => {
      sphere.rotation.y += 0.01;
    });

    this._arrow.position.y += this._arrowDirection * this._arrowSpeed;
    if (this._arrow.position.y > 28) {
      this._arrowDirection = -1;
    }
    if (this._arrow.position.y < 25) {
      this._arrowDirection = 1;
    }
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new ThirdPerson();
});


function _LerpOverFrames(frames, t) {
  const s = new THREE.Vector3(0, 0, 0);
  const e = new THREE.Vector3(100, 0, 0);
  const c = s.clone();

  for (let i = 0; i < frames; i++) {
    c.lerp(e, t);
  }
  return c;
}

function _TestLerp(t1, t2) {
  const v1 = _LerpOverFrames(100, t1);
  const v2 = _LerpOverFrames(50, t2);
  console.log(v1.x + ' | ' + v2.x);
}

_TestLerp(0.01, 0.01);
_TestLerp(1.0 / 100.0, 1.0 / 50.0);
_TestLerp(1.0 - Math.pow(0.3, 1.0 / 100.0), 
          1.0 - Math.pow(0.3, 1.0 / 50.0));
