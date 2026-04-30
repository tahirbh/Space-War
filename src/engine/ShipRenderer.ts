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
    this.createF16();
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

  private createF16() {
    // F-16 Fighting Falcon - Realistic 4th Gen Fighter
    const bodyColor = 0x808b96; // Military Air Superiority Grey
    const detailColor = 0x2c3e50; // Dark grey for details
    
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.4,
      metalness: 0.6,
    });

    const engineMat = new THREE.MeshStandardMaterial({
      color: detailColor,
      roughness: 0.7,
      metalness: 0.8,
    });

    // Main Fuselage (Blended Body)
    const fuselageGeo = new THREE.CylinderGeometry(0.5, 0.4, 5, 12);
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    fuselage.rotation.x = Math.PI / 2;
    fuselage.scale.set(1.2, 0.8, 1);
    this.shipGroup.add(fuselage);

    // Pointed Nose Radome
    const noseGeo = new THREE.ConeGeometry(0.4, 1.5, 12);
    const nose = new THREE.Mesh(noseGeo, fuselageMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 3.25;
    this.shipGroup.add(nose);

    // Ventral Air Intake (Signature F-16 feature)
    const intakeGeo = new THREE.BoxGeometry(0.8, 0.4, 1.2);
    const intake = new THREE.Mesh(intakeGeo, fuselageMat);
    intake.position.set(0, -0.35, 1.2);
    intake.rotation.x = 0.1;
    this.shipGroup.add(intake);

    const intakeOpeningGeo = new THREE.BoxGeometry(0.7, 0.3, 0.1);
    const intakeOpening = new THREE.Mesh(intakeOpeningGeo, engineMat);
    intakeOpening.position.set(0, -0.4, 1.8);
    this.shipGroup.add(intakeOpening);

    // Main Wings (Cropped Delta)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(3, -1.8); // Swept back
    wingShape.lineTo(2.8, -3); // Trailing edge
    wingShape.lineTo(0, -2.5);
    wingShape.closePath();

    const wingExtrudeSettings = { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
    
    const leftWing = new THREE.Mesh(wingGeo, fuselageMat);
    leftWing.rotation.x = Math.PI / 2;
    leftWing.position.set(0.4, 0, 1.2);
    this.shipGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, fuselageMat);
    rightWing.rotation.x = Math.PI / 2;
    rightWing.scale.x = -1;
    rightWing.position.set(-0.4, 0, 1.2);
    this.shipGroup.add(rightWing);

    // Horizontal Stabilizers
    const hStabShape = new THREE.Shape();
    hStabShape.moveTo(0, 0);
    hStabShape.lineTo(1.5, -0.8);
    hStabShape.lineTo(1.3, -1.5);
    hStabShape.lineTo(0, -1.2);
    hStabShape.closePath();

    const leftHStab = new THREE.Mesh(new THREE.ExtrudeGeometry(hStabShape, wingExtrudeSettings), fuselageMat);
    leftHStab.rotation.x = Math.PI / 2;
    leftHStab.position.set(0.3, 0, -1.8);
    this.shipGroup.add(leftHStab);

    const rightHStab = new THREE.Mesh(new THREE.ExtrudeGeometry(hStabShape, wingExtrudeSettings), fuselageMat);
    rightHStab.rotation.x = Math.PI / 2;
    rightHStab.scale.x = -1;
    rightHStab.position.set(-0.3, 0, -1.8);
    this.shipGroup.add(rightHStab);

    // Vertical Stabilizer (Single Tail Fin)
    const vStabShape = new THREE.Shape();
    vStabShape.moveTo(0, 0);
    vStabShape.lineTo(1.8, 0);
    vStabShape.lineTo(1.6, 1.8);
    vStabShape.lineTo(0.5, 1.8);
    vStabShape.closePath();

    const vStab = new THREE.Mesh(new THREE.ExtrudeGeometry(vStabShape, wingExtrudeSettings), fuselageMat);
    vStab.rotation.y = -Math.PI / 2;
    vStab.position.set(0, 0.3, -2.5);
    this.shipGroup.add(vStab);

    // Large Bubble Canopy
    const canopyGeo = new THREE.SphereGeometry(0.45, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.6,
      roughness: 0,
      metalness: 1,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.35, 1.8);
    canopy.scale.set(0.9, 0.7, 2.2);
    this.shipGroup.add(canopy);

    // Pilot Seat Detail
    const seatGeo = new THREE.BoxGeometry(0.2, 0.3, 0.4);
    const seat = new THREE.Mesh(seatGeo, engineMat);
    seat.position.set(0, 0.3, 1.6);
    this.shipGroup.add(seat);

    // Engine Exhaust Nozzle (Single)
    const nozzleGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.8, 16);
    const nozzle = new THREE.Mesh(nozzleGeo, engineMat);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.z = -2.8;
    this.shipGroup.add(nozzle);

    // Engine Glow
    const glowGeo = new THREE.CircleGeometry(0.3, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff, // Cyan glow to match game theme
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = -3.21;
    glow.rotation.y = Math.PI;
    this.shipGroup.add(glow);
  }

  public render(rotationX: number, rotationY: number, rotationZ: number): HTMLCanvasElement {
    this.shipGroup.rotation.set(rotationX, rotationY, rotationZ);
    this.renderer.render(this.scene, this.camera);
    return this.canvas;
  }
}
