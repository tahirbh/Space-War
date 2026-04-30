import * as THREE from 'three';

export type ObjectModelType = 'drone' | 'satellite' | 'jet' | 'tank' | 'iss' | 'carrier' | 'array' | 'asteroid';

export class ObjectRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private group: THREE.Group;
  private canvas: HTMLCanvasElement;
  private models: Map<ObjectModelType, THREE.Group> = new Map();

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

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);
    
    const rimLight = new THREE.DirectionalLight(0x00d4ff, 0.5);
    rimLight.position.set(-5, 2, -5);
    this.scene.add(rimLight);

    this.initModels();
  }

  private initModels() {
    this.models.set('drone', this.createDrone());
    this.models.set('satellite', this.createSatellite());
    this.models.set('jet', this.createJet());
    this.models.set('tank', this.createTank());
    this.models.set('iss', this.createISS());
    this.models.set('carrier', this.createCarrier());
    this.models.set('array', this.createArray());
    this.models.set('asteroid', this.createAsteroid());
  }

  private createDrone(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 3), mat);
    group.add(body);
    
    const wing = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 0.8), mat);
    wing.position.z = 0.5;
    group.add(wing);
    
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.6), mat);
    tail.position.z = -1.2;
    group.add(tail);

    return group;
  }

  private createSatellite(): THREE.Group {
    const group = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x0044ff, metalness: 0.5, roughness: 0.5 });
    
    const core = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1.5), goldMat);
    group.add(core);
    
    const panelGeo = new THREE.BoxGeometry(4, 0.05, 1.2);
    const leftPanel = new THREE.Mesh(panelGeo, blueMat);
    leftPanel.position.x = 2.5;
    group.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(panelGeo, blueMat);
    rightPanel.position.x = -2.5;
    group.add(rightPanel);

    return group;
  }

  private createJet(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.9, roughness: 0.2 });
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 4), mat);
    group.add(body);
    
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(2.5, -1.5);
    wingShape.lineTo(2, -3);
    wingShape.lineTo(0, -2);
    wingShape.closePath();
    
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.1, bevelEnabled: false });
    const wingL = new THREE.Mesh(wingGeo, mat);
    wingL.rotation.x = Math.PI/2;
    wingL.position.set(0.5, 0, 1);
    group.add(wingL);
    
    const wingR = wingL.clone();
    wingR.scale.x = -1;
    wingR.position.set(-0.5, 0, 1);
    group.add(wingR);

    return group;
  }

  private createTank(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.8 });
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 3.5), mat);
    group.add(body);
    
    const turret = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.5), mat);
    turret.position.y = 0.7;
    group.add(turret);
    
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.5), mat);
    barrel.rotation.x = Math.PI/2;
    barrel.position.set(0, 0.7, 2);
    group.add(barrel);

    return group;
  }

  private createISS(): THREE.Group {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x003366, metalness: 0.3 });
    
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6), metalMat);
    cylinder.rotation.z = Math.PI/2;
    group.add(cylinder);
    
    for(let i = -2; i <= 2; i+=2) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 1.5), solarMat);
      panel.position.x = i;
      group.add(panel);
    }

    return group;
  }

  private createCarrier(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.7 });
    
    const deck = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 10), mat);
    group.add(deck);
    
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 2), mat);
    tower.position.set(1.5, 1, 1);
    group.add(tower);
    
    // Antennas
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2), mat);
    ant.position.set(1.5, 3, 1);
    group.add(ant);

    return group;
  }

  private createArray(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ddff, emissive: 0x0055ff });
    
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.2, 16, 100), mat);
    group.add(ring);
    
    const core = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), mat);
    group.add(core);

    return group;
  }

  private createAsteroid(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x665544, roughness: 1.0 });
    const geo = new THREE.DodecahedronGeometry(2, 1);
    const mesh = new THREE.Mesh(geo, mat);
    
    // Deform asteroid
    const pos = geo.attributes.position;
    for(let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.5);
        pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.5);
        pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.5);
    }
    group.add(mesh);
    return group;
  }

  public render(type: ObjectModelType, rotX: number, rotY: number, rotZ: number): HTMLCanvasElement {
    this.group.clear();
    const model = this.models.get(type);
    if (model) {
      this.group.add(model);
      model.rotation.set(rotX, rotY, rotZ);
    }
    
    this.renderer.render(this.scene, this.camera);
    return this.canvas;
  }
}
