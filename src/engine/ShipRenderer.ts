import * as THREE from 'three';

export class ShipRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private shipGroup: THREE.Group;
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;

  constructor(width: number = 256, height: number = 256) {
    this.width = width;
    this.height = height;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(1);

    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    this.shipGroup = new THREE.Group();
    this.createB2Bomber();
    this.scene.add(this.shipGroup);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);
    
    const rimLight = new THREE.DirectionalLight(0x00d4ff, 0.8);
    rimLight.position.set(-5, 2, -5);
    this.scene.add(rimLight);
  }

  private createB2Bomber() {
    // B2 Bomber is a flying wing. We'll use a custom geometry for the sleek shape.
    const shape = new THREE.Shape();
    
    // Define the V-shaped wing
    shape.moveTo(0, 0); // Nose
    shape.lineTo(2, -0.5); 
    shape.lineTo(4, -2);
    shape.lineTo(3.5, -2.2);
    shape.lineTo(2, -1.8);
    shape.lineTo(1.5, -2.5);
    shape.lineTo(0, -2.2); // Middle rear
    shape.lineTo(-1.5, -2.5);
    shape.lineTo(-2, -1.8);
    shape.lineTo(-3.5, -2.2);
    shape.lineTo(-4, -2);
    shape.lineTo(-2, -0.5);
    shape.closePath();

    const extrudeSettings = {
      depth: 0.3,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.1,
      bevelThickness: 0.1,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.3,
      metalness: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2; // Lay it flat
    mesh.position.y = 0;
    this.shipGroup.add(mesh);

    // Cockpit
    const cockpitGeo = new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.6,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.5,
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.2, -0.5);
    cockpit.scale.set(1, 0.5, 2);
    this.shipGroup.add(cockpit);

    // Engines (Exhaust ports)
    const engineGeo = new THREE.BoxGeometry(0.8, 0.2, 0.2);
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff3300,
      emissiveIntensity: 2,
    });
    
    const leftEngine = new THREE.Mesh(engineGeo, engineMat);
    leftEngine.position.set(-1, 0.1, -2.1);
    this.shipGroup.add(leftEngine);
    
    const rightEngine = new THREE.Mesh(engineGeo, engineMat);
    rightEngine.position.set(1, 0.1, -2.1);
    this.shipGroup.add(rightEngine);
  }

  public render(rotationX: number, rotationY: number, rotationZ: number): HTMLCanvasElement {
    this.shipGroup.rotation.set(rotationX, rotationY, rotationZ);
    this.renderer.render(this.scene, this.camera);
    return this.canvas;
  }
}
