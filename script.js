// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Control elements
    const aircraftModel = document.getElementById('aircraft-model');
    const speedSlider = document.getElementById('speed');
    const altitudeSlider = document.getElementById('altitude');
    const angleSlider = document.getElementById('angle');
    const windSpeedSlider = document.getElementById('wind-speed');
    const viewModeSelect = document.getElementById('view-mode');
    const startButton = document.getElementById('start-simulation');
    const resetButton = document.getElementById('reset-simulation');
    
    // Value display elements
    const speedValue = document.getElementById('speed-value');
    const altitudeValue = document.getElementById('altitude-value');
    const angleValue = document.getElementById('angle-value');
    const windSpeedValue = document.getElementById('wind-speed-value');
    
    // Data display elements
    const liftValue = document.getElementById('lift-value');
    const dragValue = document.getElementById('drag-value');
    const thrustValue = document.getElementById('thrust-value');
    const gravityValue = document.getElementById('gravity-value');
    
    // Three.js setup
    const container = document.getElementById('simulation-canvas');
    let scene, camera, renderer, controls;
    let aircraft, terrain, sky;
    let forceArrows = {
        lift: null,
        drag: null,
        thrust: null,
        gravity: null
    };
    
    // Aircraft models
    const aircraftModels = {
        cessna: {
            path: 'models/cessna.glb',
            scale: 0.5,
            mass: 1000,  // kg
            wingArea: 16,  // m^2
            liftCoefficient: 0.1,
            dragCoefficient: 0.027,
            cockpitPosition: new THREE.Vector3(0, 1, -2)
        },
        boeing: {
            path: 'models/boeing.glb',
            scale: 0.2,
            mass: 41000,  // kg
            wingArea: 125,  // m^2
            liftCoefficient: 0.2,
            dragCoefficient: 0.024,
            cockpitPosition: new THREE.Vector3(0, 3, -10)
        },
        fighter: {
            path: 'models/fighter.glb',
            scale: 0.3,
            mass: 12000,  // kg
            wingArea: 27,  // m^2
            liftCoefficient: 0.25,
            dragCoefficient: 0.016,
            cockpitPosition: new THREE.Vector3(0, 1, -1)
        }
    };
    
    // Simulation state
    let simulation = {
        aircraft: null,
        speed: 0,
        altitude: 0,
        angle: 0,
        windSpeed: 0,
        lift: 0,
        drag: 0,
        thrust: 0,
        gravity: 0,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0)
    };
    
    // Simulation status
    let isSimulationRunning = false;
    let clock = new THREE.Clock();
    let viewMode = 'free';
    
    // Initialize Three.js scene
    function initThreeJs() {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB);
        
        // Create camera
        camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 10000);
        camera.position.set(0, 100, 300);
        
        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
        
        // Create controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 300, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        scene.add(directionalLight);
        
        // Create terrain
        createTerrain();
        
        // Create sky
        createSky();
        
        // Create force arrows
        createForceArrows();
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
    }
    
    // Create terrain
    function createTerrain() {
        const geometry = new THREE.PlaneGeometry(10000, 10000, 128, 128);
        
        // Modify terrain height
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            if (i !== 1) { // Skip y-component for center point
                const x = vertices[i];
                const z = vertices[i + 2];
                const distance = Math.sqrt(x * x + z * z);
                
                // Create rolling hills
                vertices[i + 1] = Math.sin(x * 0.01) * Math.cos(z * 0.01) * 50 - distance * 0.05;
            }
        }
        
        geometry.computeVertexNormals();
        
        // Create terrain material with texture
        const material = new THREE.MeshStandardMaterial({
            color: 0x4CAF50,
            metalness: 0,
            roughness: 0.8,
            flatShading: false
        });
        
        terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.position.y = -100;
        terrain.receiveShadow = true;
        scene.add(terrain);
    }
    
    // Create sky
    function createSky() {
        const skyGeometry = new THREE.SphereGeometry(5000, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        
        sky = new THREE.Mesh(skyGeometry, skyMaterial);
        scene.add(sky);
        
        // Add clouds
        addClouds();
    }
    
    // Add clouds to the sky
    function addClouds() {
        for (let i = 0; i < 50; i++) {
            const cloudGeometry = new THREE.SphereGeometry(Math.random() * 50 + 20, 8, 8);
            const cloudMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.8
            });
            
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            
            // Position clouds randomly in the sky
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI / 2;
            const radius = Math.random() * 1000 + 1000;
            
            cloud.position.x = radius * Math.sin(phi) * Math.cos(theta);
            cloud.position.y = radius * Math.sin(phi) * Math.sin(theta);
            cloud.position.z = radius * Math.cos(phi);
            
            scene.add(cloud);
        }
    }
    
    // Create force arrows
    function createForceArrows() {
        // Create arrow helper for lift (green)
        forceArrows.lift = new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 0),
            50,
            0x00FF00,
            10,
            5
        );
        scene.add(forceArrows.lift);
        
        // Create arrow helper for drag (orange)
        forceArrows.drag = new THREE.ArrowHelper(
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            50,
            0xFFA500,
            10,
            5
        );
        scene.add(forceArrows.drag);
        
        // Create arrow helper for thrust (blue)
        forceArrows.thrust = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            50,
            0x0000FF,
            10,
            5
        );
        scene.add(forceArrows.thrust);
        
        // Create arrow helper for gravity (red)
        forceArrows.gravity = new THREE.ArrowHelper(
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, 0, 0),
            50,
            0xFF0000,
            10,
            5
        );
        scene.add(forceArrows.gravity);
        
        // Initially hide all arrows
        Object.values(forceArrows).forEach(arrow => {
            arrow.visible = false;
        });
    }
    
    // Load aircraft model
    function loadAircraftModel(modelName) {
        const model = aircraftModels[modelName];
        
        // Remove existing aircraft
        if (aircraft) {
            scene.remove(aircraft);
        }
        
        // Use a placeholder while loading or if model isn't available
        // For a real application, you would use GLTFLoader to load actual 3D models
        // const loader = new THREE.GLTFLoader();
        // loader.load(model.path, function(gltf) { ... });
        
        // Create placeholder aircraft
        let geometry;
        let material = new THREE.MeshPhongMaterial({ color: 0xCCCCCC });
        
        switch(modelName) {
            case 'cessna':
                aircraft = createCessnaModel();
                break;
            case 'boeing':
                aircraft = createBoeingModel();
                break;
            case 'fighter':
                aircraft = createFighterModel();
                break;
            default:
                aircraft = createCessnaModel();
        }
        
        // Set initial position
        aircraft.position.y = parseInt(altitudeSlider.value);
        
        // Add to scene
        scene.add(aircraft);
        
        // Update simulation object
        simulation.aircraft = model;
        
        // Update force arrows position
        updateForceArrowsPosition();
    }
    
    // Create Cessna model
    function createCessnaModel() {
        const group = new THREE.Group();
        
        // Fuselage
        const fuselageGeometry = new THREE.CylinderGeometry(5, 5, 40, 16);
        fuselageGeometry.rotateZ(Math.PI / 2);
        const fuselageMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.castShadow = true;
        group.add(fuselage);
        
        // Wings
        const wingGeometry = new THREE.BoxGeometry(30, 1, 80);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.position.y = -2;
        wing.castShadow = true;
        group.add(wing);
        
        // Tail
        const tailGeometry = new THREE.BoxGeometry(15, 1, 15);
        const tailMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.x = -18;
        tail.position.y = 3;
        tail.castShadow = true;
        group.add(tail);
        
        // Vertical stabilizer
        const vStabGeometry = new THREE.BoxGeometry(10, 10, 1);
        const vStabMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const vStab = new THREE.Mesh(vStabGeometry, vStabMaterial);
        vStab.position.x = -18;
        vStab.position.y = 8;
        vStab.castShadow = true;
        group.add(vStab);
        
        // Propeller
        const propGeometry = new THREE.BoxGeometry(1, 2, 20);
        const propMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const propeller = new THREE.Mesh(propGeometry, propMaterial);
        propeller.position.x = 20;
        propeller.castShadow = true;
        group.add(propeller);
        
        // Add propeller animation to the group
        group.propeller = propeller;
        
        return group;
    }
    
    // Create Boeing model
    function createBoeingModel() {
        const group = new THREE.Group();
        
        // Fuselage
        const fuselageGeometry = new THREE.CylinderGeometry(10, 10, 100, 16);
        fuselageGeometry.rotateZ(Math.PI / 2);
        const fuselageMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.castShadow = true;
        group.add(fuselage);
        
        // Wings
        const wingGeometry = new THREE.BoxGeometry(60, 2, 120);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.position.y = -5;
        wing.castShadow = true;
        group.add(wing);
        
        // Tail
        const tailGeometry = new THREE.BoxGeometry(30, 2, 30);
        const tailMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.x = -45;
        tail.position.y = 5;
        tail.castShadow = true;
        group.add(tail);
        
        // Vertical stabilizer
        const vStabGeometry = new THREE.BoxGeometry(20, 20, 2);
        const vStabMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const vStab = new THREE.Mesh(vStabGeometry, vStabMaterial);
        vStab.position.x = -45;
        vStab.position.y = 15;
        vStab.castShadow = true;
        group.add(vStab);
        
        // Engines
        const engineGeometry = new THREE.CylinderGeometry(5, 5, 10, 16);
        const engineMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        const engine1 = new THREE.Mesh(engineGeometry, engineMaterial);
        engine1.position.x = -10;
        engine1.position.y = -10;
        engine1.position.z = -30;
        engine1.rotation.z = Math.PI / 2;
        engine1.castShadow = true;
        group.add(engine1);
        
        const engine2 = new THREE.Mesh(engineGeometry, engineMaterial);
        engine2.position.x = -10;
        engine2.position.y = -10;
        engine2.position.z = 30;
        engine2.rotation.z = Math.PI / 2;
        engine2.castShadow = true;
        group.add(engine2);
        
        return group;
    }
    
    // Create Fighter model
    function createFighterModel() {
        const group = new THREE.Group();
        
        // Fuselage
        const fuselageGeometry = new THREE.CylinderGeometry(4, 3, 50, 8);
        fuselageGeometry.rotateZ(Math.PI / 2);
        const fuselageMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.castShadow = true;
        group.add(fuselage);
        
        // Wings (delta shape)
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(40, 30);
        wingShape.lineTo(40, -30);
        wingShape.lineTo(0, 0);
        
        const wingGeometry = new THREE.ExtrudeGeometry(wingShape, {
            depth: 1,
            bevelEnabled: false
        });
        
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.rotation.y = Math.PI / 2;
        wing.position.x = -5;
        wing.position.z = -0.5;
        wing.castShadow = true;
        group.add(wing);
        
        // Vertical stabilizer
        const vStabGeometry = new THREE.BoxGeometry(15, 10, 1);
        const vStabMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const vStab = new THREE.Mesh(vStabGeometry, vStabMaterial);
        vStab.position.x = -20;
        vStab.position.y = 5;
        vStab.castShadow = true;
        group.add(vStab);
        
        // Cockpit
        const cockpitGeometry = new THREE.SphereGeometry(4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2266AA,
            transparent: true,
            opacity: 0.7
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.x = 10;
        cockpit.position.y = 3;
        cockpit.rotation.x = -Math.PI / 2;
        cockpit.castShadow = true;
        group.add(cockpit);
        
        // Engines
        const engineGeometry = new THREE.CylinderGeometry(2, 2, 5, 16);
        const engineMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        engine.position.x = -25;
        engine.rotation.z = Math.PI / 2;
        engine.castShadow = true;
        group.add(engine);
        
        return group;
    }
    
    // Update window size
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    // Update simulation based on controls
    function updateSimulation() {
        const model = aircraftModel.value;
        const speed = parseInt(speedSlider.value);
        const altitude = parseInt(altitudeSlider.value);
        const angle = parseInt(angleSlider.value);
        const windSpeed = parseInt(windSpeedSlider.value);
        
        // Update simulation state
        simulation.speed = speed;
        simulation.altitude = altitude;
        simulation.angle = angle;
        simulation.windSpeed = windSpeed;
        
        // Update aircraft position and rotation
        if (aircraft) {
            aircraft.position.y = altitude;
            aircraft.rotation.z = angle * Math.PI / 180;
        }
        
        // Calculate physics
        calculatePhysics();
        
        // Update force arrows
        updateForceArrows();
        
        // Update data display
        updateDataDisplay();
    }
    
    // Calculate physics
    function calculatePhysics() {
        const airDensity = 1.225 * Math.exp(-simulation.altitude / 10000);  // Altitude-dependent air density
        const effectiveSpeed = simulation.speed + simulation.windSpeed;  // Relative speed
        const angleRad = simulation.angle * Math.PI / 180;  // Convert to radians
        
        // Calculate lift: 0.5 * air_density * velocity^2 * wing_area * lift_coefficient * sin(angle_of_attack)
        simulation.lift = 0.5 * airDensity * Math.pow(effectiveSpeed, 2) * 
                          simulation.aircraft.wingArea * 
                          simulation.aircraft.liftCoefficient * 
                          Math.sin(angleRad + 0.1);  // Add 0.1 for baseline lift
        
        // Calculate drag: 0.5 * air_density * velocity^2 * wing_area * drag_coefficient * (1 + 5*sin(angle_of_attack))
        simulation.drag = 0.5 * airDensity * Math.pow(effectiveSpeed, 2) * 
                          simulation.aircraft.wingArea * 
                          simulation.aircraft.dragCoefficient * 
                          (1 + Math.sin(angleRad) * 5);  // Increase drag with angle
        
        // Calculate gravity: mass * g
        simulation.gravity = simulation.aircraft.mass * 9.8;
        
        // Calculate thrust (simplified as drag + gravity component)
        simulation.thrust = simulation.drag + simulation.gravity * Math.sin(angleRad);
        if (simulation.thrust < 0) simulation.thrust = 0;
    }
    
    // Update force arrows
    function updateForceArrows() {
        if (!aircraft || !isSimulationRunning) {
            // Hide arrows if simulation is not running
            Object.values(forceArrows).forEach(arrow => {
                arrow.visible = false;
            });
            return;
        }
        
        const scale = 0.01;  // Scale factor for arrow length
        
        // Show all arrows
        Object.values(forceArrows).forEach(arrow => {
            arrow.visible = true;
        });
        
        // Update arrow positions to match aircraft
        updateForceArrowsPosition();
        
        // Update lift arrow (up)
        forceArrows.lift.setLength(simulation.lift * scale);
        
        // Update gravity arrow (down)
        forceArrows.gravity.setLength(simulation.gravity * scale);
        
        // Update thrust arrow (forward)
        forceArrows.thrust.setLength(simulation.thrust * scale);
        
        // Update drag arrow (backward)
        forceArrows.drag.setLength(simulation.drag * scale);
    }
    
    // Update force arrows position
    function updateForceArrowsPosition() {
        if (!aircraft) return;
        
        Object.values(forceArrows).forEach(arrow => {
            arrow.position.copy(aircraft.position);
        });
    }
    
    // Update data display
    function updateDataDisplay() {
        liftValue.textContent = Math.round(simulation.lift) + ' N';
        dragValue.textContent = Math.round(simulation.drag) + ' N';
        thrustValue.textContent = Math.round(simulation.thrust) + ' N';
        gravityValue.textContent = Math.round(simulation.gravity) + ' N';
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        
        // Update controls
        controls.update();
        
        // Update aircraft position if simulation is running
        if (isSimulationRunning && aircraft) {
            // Rotate propeller if present (Cessna)
            if (aircraft.propeller) {
                aircraft.propeller.rotation.x += 10 * delta * (simulation.speed / 100);
            }
            
            // Move aircraft forward based on speed
            const speed = simulation.speed / 3.6;  // Convert km/h to m/s
            aircraft.position.x += speed * delta;
            
            // Update camera if in follow or cockpit mode
            updateCameraPosition();
        }
        
        // Render scene
        renderer.render(scene, camera);
    }
    
    // Update camera position based on view mode
    function updateCameraPosition() {
        if (!aircraft) return;
        
        switch(viewMode) {
            case 'follow':
                // Position camera behind and slightly above aircraft
                const followOffset = new THREE.Vector3(-50, 20, 0);
                followOffset.applyQuaternion(aircraft.quaternion);
                
                camera.position.copy(aircraft.position).add(followOffset);
                camera.lookAt(aircraft.position);
                break;
                
            case 'cockpit':
                // Position camera at cockpit with aircraft orientation
                const cockpitPosition = aircraftModels[aircraftModel.value].cockpitPosition.clone();
                cockpitPosition.applyQuaternion(aircraft.quaternion);
                
                camera.position.copy(aircraft.position).add(cockpitPosition);
                
                // Look forward
                const lookAtPosition = aircraft.position.clone();
                const forwardVector = new THREE.Vector3(100, 0, 0);
                forwardVector.applyQuaternion(aircraft.quaternion);
                lookAtPosition.add(forwardVector);
                
                camera.lookAt(lookAtPosition);
                break;
                
            case 'free':
                // Free camera is controlled by OrbitControls
                // No need to update position
                break;
        }
    }
    
    // Start simulation
    function startSimulation() {
        if (isSimulationRunning) return;
        
        isSimulationRunning = true;
        startButton.textContent = 'Pause Simulation';
        startButton.removeEventListener('click', startSimulation);
        startButton.addEventListener('click', pauseSimulation);
        
        // Show force arrows
        updateForceArrows();
    }
    
    // Pause simulation
    function pauseSimulation() {
        isSimulationRunning = false;
        startButton.textContent = 'Start Simulation';
        startButton.removeEventListener('click', pauseSimulation);
        startButton.addEventListener('click', startSimulation);
        
        // Hide force arrows
        Object.values(forceArrows).forEach(arrow => {
            arrow.visible = false;
        });
    }
    
    // Reset simulation
    function resetSimulation() {
        // Pause simulation
        pauseSimulation();
        
        // Reset sliders
        speedSlider.value = 200;
        speedValue.textContent = '200';
        
        altitudeSlider.value = 1000;
        altitudeValue.textContent = '1000';
        
        angleSlider.value = 0;
        angleValue.textContent = '0';
        
        windSpeedSlider.value = 0;
        windSpeedValue.textContent = '0';
        
        // Reset aircraft model
        aircraftModel.value = 'cessna';
        
        // Reset aircraft position
        if (aircraft) {
            aircraft.position.set(0, parseInt(altitudeSlider.value), 0);
            aircraft.rotation.set(0, 0, 0);
        }
        
        // Reset camera for free view
        viewModeSelect.value = 'free';
        viewMode = 'free';
        camera.position.set(0, 100, 300);
        controls.target.set(0, 0, 0);
        controls.update();
        
        // Update simulation
        updateSimulation();
    }
    
    // Initialize theory animations
    function initTheoryAnimations() {
        // Bernoulli's Principle animation
        const bernoulliElement = document.getElementById('bernoulli-animation');
        if (bernoulliElement) {
            const bernoulliRenderer = new THREE.WebGLRenderer({ antialias: true });
            bernoulliRenderer.setSize(bernoulliElement.clientWidth, bernoulliElement.clientHeight);
            bernoulliElement.appendChild(bernoulliRenderer.domElement);
            
            const bernoulliScene = new THREE.Scene();
            bernoulliScene.background = new THREE.Color(0xf3f4f6);
            
            const bernoulliCamera = new THREE.PerspectiveCamera(
                60, 
                bernoulliElement.clientWidth / bernoulliElement.clientHeight, 
                0.1, 
                1000
            );
            bernoulliCamera.position.set(0, 0, 10);
            
            // Create wing cross-section
            const wingShape = new THREE.Shape();
            wingShape.moveTo(-5, 0);
            wingShape.bezierCurveTo(-2, 1.5, 2, 1.5, 5, 0);
            wingShape.lineTo(5, -0.5);
            wingShape.lineTo(-5, -0.5);
            wingShape.lineTo(-5, 0);
            
            const wingGeometry = new THREE.ExtrudeGeometry(wingShape, {
                depth: 2,
                bevelEnabled: false
            });
            
            const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x3498db });
            const wing = new THREE.Mesh(wingGeometry, wingMaterial);
            wing.rotation.y = Math.PI / 2;
            bernoulliScene.add(wing);
            
            // Add lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            bernoulliScene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(0, 5, 10);
            bernoulliScene.add(directionalLight);
            
            // Create particles for air flow
            const particlesAbove = createAirflowParticles(50, 0x2ecc71, true);  // Green, faster
            const particlesBelow = createAirflowParticles(30, 0xe74c3c, false); // Red, slower
            
            bernoulliScene.add(particlesAbove);
            bernoulliScene.add(particlesBelow);
            
            // Create text labels
            addTextLabel(bernoulliScene, "Low Pressure", 0, 2, 0, 0x2ecc71);
            addTextLabel(bernoulliScene, "High Pressure", 0, -2, 0, 0xe74c3c);
            addTextLabel(bernoulliScene, "Lift", 6, 0, 0, 0x9b59b6);
            
            // Add arrow for lift
            const liftArrow = new THREE.ArrowHelper(
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(6, 0, 0),
                2,
                0x9b59b6,
                0.5,
                0.3
            );
            bernoulliScene.add(liftArrow);
            
            // Animation function
            function animateBernoulli() {
                requestAnimationFrame(animateBernoulli);
                
                // Update particles
                updateAirflowParticles(particlesAbove, 0.1);  // Faster
                updateAirflowParticles(particlesBelow, 0.05); // Slower
                
                bernoulliRenderer.render(bernoulliScene, bernoulliCamera);
            }
            
            animateBernoulli();
        }
        
        // Newton's Laws animation
        const newtonElement = document.getElementById('newton-animation');
        if (newtonElement) {
            const newtonRenderer = new THREE.WebGLRenderer({ antialias: true });
            newtonRenderer.setSize(newtonElement.clientWidth, newtonElement.clientHeight);
            newtonElement.appendChild(newtonRenderer.domElement);
            
            const newtonScene = new THREE.Scene();
            newtonScene.background = new THREE.Color(0xf3f4f6);
            
            const newtonCamera = new THREE.PerspectiveCamera(
                60, 
                newtonElement.clientWidth / newtonElement.clientHeight, 
                0.1, 
                1000
            );
            newtonCamera.position.set(0, 0, 15);
            
            // Create jet engine
            const engineGeometry = new THREE.CylinderGeometry(1, 1, 4, 16);
            const engineMaterial = new THREE.MeshPhongMaterial({ color: 0x7f8c8d });
            const engine = new THREE.Mesh(engineGeometry, engineMaterial);
            engine.rotation.z = Math.PI / 2;
            newtonScene.add(engine);
            
            // Add lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            newtonScene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(0, 5, 10);
            newtonScene.add(directionalLight);
            
            // Create exhaust particles
            const exhaustParticles = new THREE.Group();
            for (let i = 0; i < 50; i++) {
                const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
                const particleMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xe74c3c,
                    transparent: true,
                    opacity: Math.random() * 0.5 + 0.5
                });
                
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                particle.position.x = -2 - Math.random() * 5;
                particle.position.y = (Math.random() - 0.5) * 0.5;
                particle.position.z = (Math.random() - 0.5) * 0.5;
                particle.userData = {
                    speed: Math.random() * 0.2 + 0.1,
                    life: Math.random() * 100
                };
                
                exhaustParticles.add(particle);
            }
            newtonScene.add(exhaustParticles);
            
            // Add arrows for forces
            const thrustArrow = new THREE.ArrowHelper(
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(0, 2, 0),
                4,
                0x3498db,
                0.5,
                0.3
            );
            newtonScene.add(thrustArrow);
            
            const reactionArrow = new THREE.ArrowHelper(
                new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(-2, -2, 0),
                4,
                0xe74c3c,
                0.5,
                0.3
            );
            newtonScene.add(reactionArrow);
            
            // Add text labels
            addTextLabel(newtonScene, "Thrust", 2, 3, 0, 0x3498db);
            addTextLabel(newtonScene, "Reaction", -4, -3, 0, 0xe74c3c);
            
            // Animation function
            function animateNewton() {
                requestAnimationFrame(animateNewton);
                
                // Update exhaust particles
                exhaustParticles.children.forEach(particle => {
                    particle.position.x -= particle.userData.speed;
                    particle.userData.life -= 1;
                    
                    if (particle.userData.life <= 0) {
                        particle.position.x = -2;
                        particle.position.y = (Math.random() - 0.5) * 0.5;
                        particle.position.z = (Math.random() - 0.5) * 0.5;
                        particle.userData.life = Math.random() * 100;
                        particle.material.opacity = Math.random() * 0.5 + 0.5;
                    }
                });
                
                // Make engine move slightly to simulate recoil
                engine.position.x = Math.sin(Date.now() * 0.002) * 0.1;
                
                newtonRenderer.render(newtonScene, newtonCamera);
            }
            
            animateNewton();
        }
        
        // Four Forces animation
        const forcesElement = document.getElementById('forces-animation');
        if (forcesElement) {
            const forcesRenderer = new THREE.WebGLRenderer({ antialias: true });
            forcesRenderer.setSize(forcesElement.clientWidth, forcesElement.clientHeight);
            forcesElement.appendChild(forcesRenderer.domElement);
            
            const forcesScene = new THREE.Scene();
            forcesScene.background = new THREE.Color(0xf3f4f6);
            
            const forcesCamera = new THREE.PerspectiveCamera(
                60, 
                forcesElement.clientWidth / forcesElement.clientHeight, 
                0.1, 
                1000
            );
            forcesCamera.position.set(0, 0, 15);
            
            // Create simplified aircraft
            const aircraft = createSimpleAircraft();
            forcesScene.add(aircraft);
            
            // Add lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            forcesScene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(0, 5, 10);
            forcesScene.add(directionalLight);
            
            // Add force arrows
            const liftArrow = new THREE.ArrowHelper(
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(0, 0, 0),
                4,
                0x2ecc71,
                0.5,
                0.3
            );
            forcesScene.add(liftArrow);
            
            const gravityArrow = new THREE.ArrowHelper(
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(0, 0, 0),
                4,
                0xe74c3c,
                0.5,
                0.3
            );
            forcesScene.add(gravityArrow);
            
            const thrustArrow = new THREE.ArrowHelper(
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(0, 0, 0),
                4,
                0x3498db,
                0.5,
                0.3
            );
            forcesScene.add(thrustArrow);
            
            const dragArrow = new THREE.ArrowHelper(
                new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(0, 0, 0),
                4,
                0xf39c12,
                0.5,
                0.3
            );
            forcesScene.add(dragArrow);
            
            // Add text labels
            addTextLabel(forcesScene, "Lift", 0, 5, 0, 0x2ecc71);
            addTextLabel(forcesScene, "Gravity", 0, -5, 0, 0xe74c3c);
            addTextLabel(forcesScene, "Thrust", 5, 0, 0, 0x3498db);
            addTextLabel(forcesScene, "Drag", -5, 0, 0, 0xf39c12);
            
            // Animation function
            function animateForces() {
                requestAnimationFrame(animateForces);
                
                // Make aircraft move slightly up and down
                aircraft.position.y = Math.sin(Date.now() * 0.001) * 0.5;
                
                // Update arrow positions
                liftArrow.position.copy(aircraft.position);
                gravityArrow.position.copy(aircraft.position);
                thrustArrow.position.copy(aircraft.position);
                dragArrow.position.copy(aircraft.position);
                
                forcesRenderer.render(forcesScene, forcesCamera);
            }
            
            animateForces();
        }
    }
    
    // Create a simple aircraft for theory animations
    function createSimpleAircraft() {
        const group = new THREE.Group();
        
        // Fuselage
        const fuselageGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        fuselageGeometry.rotateZ(Math.PI / 2);
        const fuselageMaterial = new THREE.MeshPhongMaterial({ color: 0x3498db });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        group.add(fuselage);
        
        // Wings
        const wingGeometry = new THREE.BoxGeometry(1, 0.1, 6);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x3498db });
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        group.add(wing);
        
        // Tail
        const tailGeometry = new THREE.BoxGeometry(1, 0.1, 2);
        const tailMaterial = new THREE.MeshPhongMaterial({ color: 0x3498db });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.x = -2;
        tail.position.y = 0.5;
        group.add(tail);
        
        return group;
    }
    
    // Create airflow particles for Bernoulli animation
    function createAirflowParticles(count, color, isAbove) {
        const particles = new THREE.Group();
        
        for (let i = 0; i < count; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({ color: color });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position particles
            particle.position.x = Math.random() * 20 - 10;
            particle.position.y = isAbove ? 1 + Math.random() * 0.5 : -1 - Math.random() * 0.5;
            particle.position.z = 0;
            
            // Store particle data
            particle.userData = {
                speed: isAbove ? Math.random() * 0.2 + 0.2 : Math.random() * 0.1 + 0.1
            };
            
            particles.add(particle);
        }
        
        return particles;
    }
    
    // Update airflow particles
    function updateAirflowParticles(particles, baseSpeed) {
        particles.children.forEach(particle => {
            particle.position.x += particle.userData.speed;
            
            if (particle.position.x > 10) {
                particle.position.x = -10;
            }
        });
    }
    
    // Add text label to a scene
    function addTextLabel(scene, text, x, y, z, color) {
        // In a real application, you would use TextGeometry or HTML/CSS overlay
        // For simplicity, we'll use a simple plane with a color
        const labelGeometry = new THREE.PlaneGeometry(2, 0.5);
        const labelMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(x, y, z);
        scene.add(label);
    }
    
    // Event listeners for controls
    speedSlider.addEventListener('input', function() {
        speedValue.textContent = this.value;
        updateSimulation();
    });
    
    altitudeSlider.addEventListener('input', function() {
        altitudeValue.textContent = this.value;
        updateSimulation();
    });
    
    angleSlider.addEventListener('input', function() {
        angleValue.textContent = this.value;
        updateSimulation();
    });
    
    windSpeedSlider.addEventListener('input', function() {
        windSpeedValue.textContent = this.value;
        updateSimulation();
    });
    
    aircraftModel.addEventListener('change', function() {
        loadAircraftModel(this.value);
        updateSimulation();
    });
    
    viewModeSelect.addEventListener('change', function() {
        viewMode = this.value;
        
        // If switching to free view, reset controls
        if (viewMode === 'free') {
            controls.enabled = true;
        } else {
            controls.enabled = false;
        }
    });
    
    startButton.addEventListener('click', startSimulation);
    resetButton.addEventListener('click', resetSimulation);
    
    // Initialize the simulation
    initThreeJs();
    loadAircraftModel('cessna');
    resetSimulation();
    initTheoryAnimations();
    animate();
});

// Handle window resize
window.addEventListener('resize', function() {
    const theoryCanvases = document.querySelectorAll('.theory-image canvas');
    theoryCanvases.forEach(canvas => {
        const width = canvas.parentElement.clientWidth;
        const height = canvas.parentElement.clientHeight;
        
        canvas.width = width;
        canvas.height = height;
        
        // Update renderer size
        if (canvas.renderer) {
            canvas.renderer.setSize(width, height);
        }
        
        // Update camera aspect ratio
        if (canvas.camera) {
            canvas.camera.aspect = width / height;
            canvas.camera.updateProjectionMatrix();
        }
    });
});
