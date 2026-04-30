import * as THREE from 'three';

export class ShipRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private shipGroup: THREE.Group;
  private canvas: HTMLCanvasElement;
  constructor(width: number = 256, height: number = 256) {
    
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
    this.createF35();
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

  private createF35() {
    // F-35 Lightning II 5th Gen Stealth Fighter
    // Main Body (Fuselage)
    const fuselageGeo = new THREE.BoxGeometry(1.2, 0.6, 6);
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      roughness: 0.2,
      metalness: 0.9,
    });
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    fuselage.scale.set(1, 0.8, 1);
    this.shipGroup.add(fuselage);

    // Pointed Nose
    const noseGeo = new THREE.ConeGeometry(0.6, 2, 8);
    const nose = new THREE.Mesh(noseGeo, fuselageMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 3.5;
    this.shipGroup.add(nose);

    // Wings (Trapezoidal)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(3.5, -1.5);
    wingShape.lineTo(3, -3.5);
    wingShape.lineTo(0, -2.5);
    wingShape.closePath();

    const wingExtrudeSettings = { depth: 0.1, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
    
    const leftWing = new THREE.Mesh(wingGeo, fuselageMat);
    leftWing.rotation.x = Math.PI / 2;
    leftWing.position.set(0.6, 0, 1.5);
    this.shipGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, fuselageMat);
    rightWing.rotation.x = Math.PI / 2;
    rightWing.scale.x = -1;
    rightWing.position.set(-0.6, 0, 1.5);
    this.shipGroup.add(rightWing);

    // Horizontal Stabilizers (Rear wings)
    const tailWingShape = new THREE.Shape();
    tailWingShape.moveTo(0, 0);
    tailWingShape.lineTo(1.8, -0.8);
    tailWingShape.lineTo(1.5, -1.8);
    tailWingShape.lineTo(0, -1.2);
    tailWingShape.closePath();

    const leftTailWing = new THREE.Mesh(new THREE.ExtrudeGeometry(tailWingShape, wingExtrudeSettings), fuselageMat);
    leftTailWing.rotation.x = Math.PI / 2;
    leftTailWing.position.set(0.4, 0, -2);
    this.shipGroup.add(leftTailWing);

    const rightTailWing = new THREE.Mesh(new THREE.ExtrudeGeometry(tailWingShape, wingExtrudeSettings), fuselageMat);
    rightTailWing.rotation.x = Math.PI / 2;
    rightTailWing.scale.x = -1;
    rightTailWing.position.set(-0.4, 0, -2);
    this.shipGroup.add(rightTailWing);

    // Vertical Stabilizers (Tail fins - Angled)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(1.2, 0);
    finShape.lineTo(1.5, 1.5);
    finShape.lineTo(0.5, 1.5);
    finShape.closePath();

    const leftFin = new THREE.Mesh(new THREE.ExtrudeGeometry(finShape, wingExtrudeSettings), fuselageMat);
    leftFin.rotation.z = Math.PI / 6; // Angle outward
    leftFin.position.set(0.4, 0.2, -2.5);
    this.shipGroup.add(leftFin);

    const rightFin = new THREE.Mesh(new THREE.ExtrudeGeometry(finShape, wingExtrudeSettings), fuselageMat);
    rightFin.rotation.z = -Math.PI / 6; // Angle outward
    rightFin.position.set(-0.4, 0.2, -2.5);
    this.shipGroup.add(rightFin);

    // Cockpit
    const cockpitGeo = new THREE.SphereGeometry(0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.5,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.4,
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.2, 1.5);
    cockpit.scale.set(0.8, 0.6, 2.5);
    this.shipGroup.add(cockpit);

    // Engine (Single large exhaust)
    const engineGeo = new THREE.CylinderGeometry(0.4, 0.3, 0.5, 16);
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
    });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.rotation.x = Math.PI / 2;
    engine.position.z = -3;
    this.shipGroup.add(engine);

    // Engine Glow
    const glowGeo = new THREE.CircleGeometry(0.35, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = -3.26;
    glow.rotation.y = Math.PI;
    this.shipGroup.add(glow);
  }

  public render(rotationX: number, rotationY: number, rotationZ: number): HTMLCanvasElement {
    this.shipGroup.rotation.set(rotationX, rotationY, rotationZ);
    this.renderer.render(this.scene, this.camera);
    return this.canvas;
  }
}
