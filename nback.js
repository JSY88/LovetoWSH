// Web Audio Context Initialization
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Game State
const gameState = {
    isPlaying: false,
    nBackLevel: 1,
    currentBlock: 0,
    maxBlocks: 12,
    stimuliPerBlock: 30,
    currentStimulus: 0,
    sceneHistory: [],
    locationHistory: [],
    soundHistory: [],
    colorHistory: [],
    sceneTargets: 0,
    locationTargets: 0,
    soundTargets: 0,
    colorTargets: 0,
    bothTargets: 0,
    sceneResponses: 0,
    locationResponses: 0,
    soundResponses: 0,
    colorResponses: 0,
    sceneErrors: 0,
    locationErrors: 0,
    soundErrors: 0,
    colorErrors: 0,
    currentTimer: null,
    responseWindowTimer: null,
    sceneTargetProcessed: false,
    locationTargetProcessed: false,
    soundTargetProcessed: false,
    colorTargetProcessed: false,
    currentIsSceneTarget: false,
    currentIsLocationTarget: false,
    currentIsSoundTarget: false,
    currentIsColorTarget: false,
    inResponseWindow: false,
    canRespond: true,
    interferenceType: "none",
    randomInterferenceProbabilities: {
        "previous": 0.33,
        "cyclic": 0.33,
        "next": 0.34
    },
    cyclicInterferenceNBackLevel: 2,
    nextStimulusInfo: null,
    consecutiveGames: 0,
    totalGamesToday: 0,
    stimulusTypes: ["scene", "location"],
    soundSource: "pianoTones",
    soundFiles: ['sounds/sound001.mp3', 'sounds/sound002.mp3', 'sounds/sound003.mp3'],
    audioLoader: new THREE.AudioLoader(),
    soundStimulus: null,
    pianoTones: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
    pianoFrequencies: {
        "C4": 261.63,
        "D4": 293.66,
        "E4": 329.63,
        "F4": 349.23,
        "G4": 392.00,
        "A4": 440.00,
        "B4": 493.88,
        "C5": 523.25
    },
    isLevelLocked: false,
    imageSourceUrl: "images/",
    resultImageUrl: "",
    sceneKey: "S",
    locationKey: "L",
    soundKey: "A",
    colorKey: "D",
    soundSourceUrl: "sounds/"
};

const wallColor = 0x262626;
const floorColor = 0x393734;
const panelColor = 0x000000;
const imageScale = 1.0;
const randomizeStimulusColor = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 2);
camera.lookAt(0, 1.6, -5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 1, 0);
directionalLight.intensity = 0.8;
scene.add(directionalLight);

const roomWidth = 5;
const roomHeight = 3;
const roomDepth = 5;

function createBrickTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 512;
    const height = 512;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);
    const brickHeight = 30;
    const brickWidth = 80;
    const mortarSize = 5;
    ctx.fillStyle = '#e0e0e0';
    let offsetX = 0;
    for (let y = 0; y < height; y += brickHeight + mortarSize) {
        offsetX = (Math.floor(y / (brickHeight + mortarSize)) % 2) * (brickWidth / 2);
        for (let x = -brickWidth / 2; x < width + brickWidth / 2; x += brickWidth + mortarSize) {
            ctx.fillRect(x + offsetX, y, brickWidth, brickHeight);
            ctx.fillStyle = '#d8d8d8';
            for (let i = 0; i < 15; i++) {
                const spotX = x + offsetX + Math.random() * brickWidth;
                const spotY = y + Math.random() * brickHeight;
                const spotSize = 1 + Math.random() * 3;
                ctx.beginPath();
                ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#e0e0e0';
        }
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < height; y += brickHeight + mortarSize) {
        ctx.fillRect(0, y - 1, width, 2);
        offsetX = (Math.floor(y / (brickHeight + mortarSize)) % 2) * (brickWidth / 2);
        for (let x = -brickWidth / 2; x < width + brickWidth / 2; x += brickWidth + mortarSize) {
            ctx.fillRect(x + offsetX - 1, y, 2, brickHeight);
        }
    }
    return new THREE.CanvasTexture(canvas);
}

const brickTexture = createBrickTexture();
brickTexture.wrapT = THREE.RepeatWrapping;
brickTexture.repeat.set(2, 1);

const wallMaterial = new THREE.MeshStandardMaterial({
    map: brickTexture,
    roughness: 0.0,
    metalness: 0.0,
    color: wallColor
});

const wallGeometry = new THREE.BoxGeometry(0.1, roomHeight, roomDepth);
const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
scene.add(leftWall);

const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
scene.add(rightWall);

const backWallGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, 0.1);
const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
scene.add(backWall);

function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    context.fillStyle = '#8B4513';
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        context.strokeStyle = `rgba(139, 69, 19, ${Math.random() * 0.5})`;
        context.lineWidth = 1 + Math.random() * 10;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x + Math.random() * 50 - 25, canvas.height);
        context.stroke();
    }
    for (let i = 0; i < 30; i++) {
        const y = Math.random() * canvas.height;
        const width = 2 + Math.random() * 10;
        context.fillStyle = `rgba(60, 30, 15, ${Math.random() * 0.3})`;
        context.fillRect(0, y, canvas.width, width);
    }
    for (let i = 0; i < 800; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 1 + Math.random() * 2;
        context.fillStyle = `rgba(200, 150, 100, ${Math.random() * 0.2})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }
    return new THREE.CanvasTexture(canvas);
}

const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const woodTexture = createWoodTexture();
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;
woodTexture.repeat.set(4, 4);

const floorMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.8,
    metalness: 0.2,
    color: floorColor
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomHeight;
scene.add(ceiling);

const panelWidth = 1.0;
const panelHeight = 1.0;
const panelDepth = 0.02;

const panelMaterial = new THREE.MeshStandardMaterial({
    color: panelColor,
    roughness: 0.5,
    metalness: 0.0
});

const panels = [];
const panelPositions = [
    { x: -1.3, y: 1.9, z: -roomDepth / 2 + 0.06, rotation: [0, 0, 0] },
    { x: 1.3, y: 1.9, z: -roomDepth / 2 + 0.06, rotation: [0, 0, 0] },
    { x: -1.3, y: 0.8, z: -roomDepth / 2 + 0.06, rotation: [0, 0, 0] },
    { x: 1.3, y: 0.8, z: -roomDepth / 2 + 0.06, rotation: [0, 0, 0] },
    { x: -roomWidth / 2 + 0.06, y: 1.9, z: -0.5, rotation: [0, Math.PI / 2, 0] },
    { x: -roomWidth / 2 + 0.06, y: 0.8, z: -0.5, rotation: [0, Math.PI / 2, 0] },
    { x: roomWidth / 2 - 0.06, y: 1.9, z: -0.5, rotation: [0, -Math.PI / 2, 0] },
    { x: roomWidth / 2 - 0.06, y: 0.8, z: -0.5, rotation: [0, -Math.PI / 2, 0] }
];

panelPositions.forEach((pos, index) => {
    const panelGroup = new THREE.Group();
    const panel = new THREE.Mesh(
        new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth),
        panelMaterial
    );
    panelGroup.add(panel);
    panelGroup.position.set(pos.x, pos.y, pos.z);
    panelGroup.rotation.set(pos.rotation[0], pos.rotation[1], pos.rotation[2]);
    scene.add(panelGroup);
    panels.push({
        group: panelGroup,
        position: index,
        panel: panel,
        rotation: pos.rotation,
        stimulusObject: null
    });
});

const imageLoader = new THREE.TextureLoader();
const imageTextures = [];
const distinctColors = [
    new THREE.Color(0.8, 0.2, 0.2),
    new THREE.Color(0.2, 0.6, 0.8),
    new THREE.Color(0.3, 0.7, 0.3),
    new THREE.Color(0.9, 0.5, 0.1),
    new THREE.Color(0.6, 0.3, 0.7),
    new THREE.Color(0.2, 0.4, 0.9),
    new THREE.Color(0.7, 0.7, 0.2)
];

function getRandomColor() {
    return distinctColors[Math.floor(Math.random() * distinctColors.length)];
}

function loadImageTextures() {
    imageTextures.length = 0;
    const baseUrl = gameState.imageSourceUrl || "images/";
    for (let i = 1; i <= 101; i++) {
        const filename = `image${String(i).padStart(3, '0')}.png`;
        const texture = imageLoader.load(`${baseUrl}${filename}`, 
            () => console.log(`Loaded: ${baseUrl}${filename}`),
            undefined,
            (err) => console.error(`Error loading ${baseUrl}${filename}:`, err)
        );
        let color = randomizeStimulusColor ? getRandomColor() : null;
        imageTextures.push({ texture: texture, color: color });
    }
}

function createStimulusImage(imageIndex, panel, colorIndex) {
    clearStimulus(panel);
    const imageGeometry = new THREE.PlaneGeometry(panelWidth * imageScale, panelHeight * imageScale);
    const imageMaterial = new THREE.MeshBasicMaterial({
        map: imageTextures[imageIndex].texture,
        transparent: true,
        blending: THREE.NormalBlending
    });
    if (gameState.stimulusTypes.includes("color")) {
        const colors = distinctColors;
        if (colors[colorIndex]) {
            imageMaterial.color = colors[colorIndex];
            gameState.currentColorStimulusColor = colors[colorIndex];
        } else if (imageTextures[imageIndex].color && randomizeStimulusColor) {
            imageMaterial.color = imageTextures[imageIndex].color;
            gameState.currentColorStimulusColor = imageTextures[imageIndex].color;
        } else {
            gameState.currentColorStimulusColor = null;
        }
    }
    const imagePlane = new THREE.Mesh(imageGeometry, imageMaterial);
    imagePlane.position.set(0, 0, panelDepth / 2 + 0.01);
    panel.group.add(imagePlane);
    panel.stimulusObject = imagePlane;
    return imagePlane;
}

function clearStimulus(panel) {
    if (panel.stimulusObject) {
        panel.group.remove(panel.stimulusObject);
        panel.stimulusObject = null;
    }
}

function clearAllStimuli() {
    panels.forEach(panel => {
        clearStimulus(panel);
    });
}

const sceneIndicator = document.getElementById('scene-indicator');
const locationIndicator = document.getElementById('location-indicator');
const soundIndicator = document.getElementById('sound-indicator');
const colorIndicator = document.getElementById('color-indicator');

function resetIndicators() {
    sceneIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    locationIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    soundIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    colorIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    gameState.sceneTargetProcessed = false;
    gameState.locationTargetProcessed = false;
    gameState.soundTargetProcessed = false;
    gameState.colorTargetProcessed = false;
    gameState.canRespond = true;
}

function showIndicatorFeedback(indicator, isCorrect) {
    if (isCorrect) {
        indicator.classList.add('correct');
    } else {
        indicator.classList.add('incorrect');
    }
}

function showEarlyResponseFeedback(indicator) {
    indicator.classList.add('early');
}

function showMissedTargetFeedback(indicator) {
    indicator.classList.add('missed');
}

function introduceInterference(currentImageIndex, currentPanelIndex, currentSoundIndex, currentColorIndex) {
    let currentInterferenceType = gameState.interferenceType;
    if (currentInterferenceType === "none") {
        return { imageIndex: currentImageIndex, panelIndex: currentPanelIndex, soundIndex: currentSoundIndex, colorIndex: currentColorIndex };
    }
    if (currentInterferenceType === "random") {
        const rand = Math.random();
        let cumulativeProbability = 0;
        for (const type in gameState.randomInterferenceProbabilities) {
            cumulativeProbability += gameState.randomInterferenceProbabilities[type];
            if (rand < cumulativeProbability) {
                currentInterferenceType = type;
                break;
            }
        }
        console.log("Random interference type selected:", currentInterferenceType);
    }
    const interferenceChance = 0.35;
    if (Math.random() < interferenceChance) {
        let interferedImageIndex = currentImageIndex;
        let interferedPanelIndex = currentPanelIndex;
        let interferedSoundIndex = currentSoundIndex;
        let interferedColorIndex = currentColorIndex;
        if (currentInterferenceType === "previous" && gameState.currentStimulus > 0) {
            const previousImageIndex = gameState.sceneHistory[gameState.currentStimulus - 1];
            const previousPanelIndex = gameState.locationHistory[gameState.currentStimulus - 1];
            const previousSoundIndex = gameState.soundHistory[gameState.currentStimulus - 1];
            const previousColorIndex = gameState.colorHistory[gameState.currentStimulus - 1];
            const type = Math.random();
            if (type < 0.25) {
                interferedImageIndex = previousImageIndex;
            } else if (type < 0.5) {
                interferedPanelIndex = previousPanelIndex;
            } else if (type < 0.75) {
                interferedSoundIndex = previousSoundIndex;
            } else {
                interferedColorIndex = previousColorIndex;
            }
            console.log("Interference applied (previous):", type < 0.25 ? "image" : (type < 0.5 ? "location" : (type < 0.75 ? "sound" : "color")));
        } else if (currentInterferenceType === "cyclic" && gameState.currentStimulus >= gameState.cyclicInterferenceNBackLevel) {
            const cyclicNBackLevel = gameState.cyclicInterferenceNBackLevel;
            const cyclicImageIndex = gameState.sceneHistory[gameState.currentStimulus - cyclicNBackLevel];
            const cyclicPanelIndex = gameState.locationHistory[gameState.currentStimulus - cyclicNBackLevel];
            const cyclicSoundIndex = gameState.soundHistory[gameState.currentStimulus - cyclicNBackLevel];
            const cyclicColorIndex = gameState.colorHistory[gameState.currentStimulus - cyclicNBackLevel];
            const type = Math.random();
            if (type < 0.25) {
                interferedImageIndex = cyclicImageIndex;
            } else if (type < 0.5) {
                interferedPanelIndex = cyclicPanelIndex;
            } else if (type < 0.75) {
                interferedSoundIndex = cyclicSoundIndex;
            } else {
                interferedColorIndex = cyclicColorIndex;
            }
            console.log("Interference applied (cyclic, N=" + cyclicNBackLevel + "):", type < 0.25 ? "image" : (type < 0.5 ? "location" : (type < 0.75 ? "sound" : "color")));
        } else if (currentInterferenceType === "next" && gameState.nextStimulusInfo) {
            const type = Math.random();
            if (type < 0.25) {
                interferedImageIndex = gameState.nextStimulusInfo.imageIndex;
            } else if (type < 0.5) {
                interferedPanelIndex = gameState.nextStimulusInfo.panelIndex;
            } else if (type < 0.75) {
                interferedSoundIndex = gameState.nextStimulusInfo.soundIndex;
            } else {
                interferedColorIndex = gameState.nextStimulusInfo.colorIndex;
            }
            console.log("Interference applied (Next):", type < 0.25 ? "image" : (type < 0.5 ? "location" : (type < 0.75 ? "sound" : "color")));
        }
        return { imageIndex: interferedImageIndex, panelIndex: interferedPanelIndex, soundIndex: interferedSoundIndex, colorIndex: interferedColorIndex };
    }
    return { imageIndex: currentImageIndex, panelIndex: currentPanelIndex, soundIndex: currentSoundIndex, colorIndex: currentColorIndex };
}

function showStimulus(imageIndex, panelIndex, soundIndex, colorIndex) {
    resetIndicators();
    const panel = panels[panelIndex];
    console.log("showStimulus() - imageIndex (before interference):", imageIndex, "panelIndex:", panelIndex, "soundIndex:", soundIndex, "colorIndex:", colorIndex);
    if (gameState.interferenceType === "next" && gameState.nextStimulusInfo) {
        const type = Math.random();
        let interferedImageIndex = imageIndex;
        let interferedPanelIndex = panelIndex;
        let interferedSoundIndex = soundIndex;
        let interferedColorIndex = colorIndex;
        if (type < 0.25) {
            interferedImageIndex = gameState.nextStimulusInfo.imageIndex;
        } else if (type < 0.5) {
            interferedPanelIndex = gameState.nextStimulusInfo.panelIndex;
        } else if (type < 0.75) {
            interferedSoundIndex = gameState.nextStimulusInfo.soundIndex;
        } else {
            interferedColorIndex = gameState.nextStimulusInfo.colorIndex;
        }
        imageIndex = interferedImageIndex;
        panelIndex = interferedPanelIndex;
        soundIndex = interferedSoundIndex;
        colorIndex = interferedColorIndex;
        console.log("Interference applied (Next):", type < 0.25 ? "image" : (type < 0.5 ? "location" : (type < 0.75 ? "sound" : "color")));
        gameState.nextStimulusInfo = null;
    }
    const interferenceResult = introduceInterference(imageIndex, panelIndex, soundIndex, colorIndex);
    imageIndex = interferenceResult.imageIndex;
    panelIndex = interferenceResult.panelIndex;
    soundIndex = interferenceResult.soundIndex;
    colorIndex = interferenceResult.colorIndex;
    console.log("showStimulus() - imageIndex (after interference):", imageIndex, "panelIndex:", panelIndex, "soundIndex:", soundIndex, "colorIndex:", colorIndex);
    createStimulusImage(imageIndex, panel, colorIndex);
    if (gameState.stimulusTypes.includes("sound")) {
        playSound(soundIndex);
    }
    console.log("showStimulus() - Presented stimulus:", imageIndex, panelIndex, soundIndex, colorIndex);
    gameState.sceneHistory.push(imageIndex);
    gameState.locationHistory.push(panelIndex);
    gameState.soundHistory.push(soundIndex);
    gameState.colorHistory.push(colorIndex);
    if (gameState.currentStimulus >= gameState.nBackLevel) {
        gameState.currentIsSceneTarget = gameState.stimulusTypes.includes("scene") && gameState.sceneHistory[gameState.currentStimulus] === gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel];
        gameState.currentIsLocationTarget = gameState.stimulusTypes.includes("location") && gameState.locationHistory[gameState.currentStimulus] === gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel];
        gameState.currentIsSoundTarget = gameState.stimulusTypes.includes("sound") && gameState.soundHistory[gameState.currentStimulus] === gameState.soundHistory[gameState.currentStimulus - gameState.nBackLevel];
        gameState.currentIsColorTarget = gameState.stimulusTypes.includes("color") && gameState.colorHistory[gameState.currentStimulus] === gameState.colorHistory[gameState.currentStimulus - gameState.nBackLevel];
        if (gameState.currentIsSceneTarget) gameState.sceneTargets++;
        if (gameState.currentIsLocationTarget) gameState.locationTargets++;
        if (gameState.currentIsSoundTarget) gameState.soundTargets++;
        if (gameState.currentIsColorTarget) gameState.colorTargets++;
        if (gameState.currentIsSceneTarget && gameState.currentIsLocationTarget && gameState.currentIsSoundTarget && gameState.currentIsColorTarget) gameState.bothTargets++;
    } else {
        gameState.currentIsSceneTarget = false;
        gameState.currentIsLocationTarget = false;
        gameState.currentIsSoundTarget = false;
        gameState.currentIsColorTarget = false;
    }
    gameState.currentStimulus++;
    if (gameState.currentStimulus < gameState.stimuliPerBlock) {
        gameState.currentTimer = setTimeout(() => {
            clearAllStimuli();
            stopSound();
            gameState.inResponseWindow = true;
            gameState.canRespond = true;
            gameState.responseWindowTimer = setTimeout(() => {
                gameState.inResponseWindow = false;
                if (gameState.stimulusTypes.includes("scene") && !gameState.sceneTargetProcessed && gameState.currentIsSceneTarget) {
                    showMissedTargetFeedback(sceneIndicator);
                    gameState.sceneErrors++;
                }
                if (gameState.stimulusTypes.includes("location") && !gameState.locationTargetProcessed && gameState.currentIsLocationTarget) {
                    showMissedTargetFeedback(locationIndicator);
                    gameState.locationErrors++;
                }
                if (gameState.stimulusTypes.includes("sound") && !gameState.soundTargetProcessed && gameState.currentIsSoundTarget) {
                    showMissedTargetFeedback(soundIndicator);
                    gameState.soundErrors++;
                }
                if (gameState.stimulusTypes.includes("color") && !gameState.colorTargetProcessed && gameState.currentIsColorTarget) {
                    showMissedTargetFeedback(colorIndicator);
                    gameState.colorErrors++;
                }
                setTimeout(() => {
                    generateNextStimulus();
                }, 500);
            }, 2500);
        }, 1000);
    } else {
        gameState.currentTimer = setTimeout(() => {
            clearAllStimuli();
            stopSound();
            gameState.inResponseWindow = true;
            gameState.canRespond = true;
            gameState.responseWindowTimer = setTimeout(() => {
                gameState.inResponseWindow = false;
                if (gameState.stimulusTypes.includes("scene") && !gameState.sceneTargetProcessed && gameState.currentIsSceneTarget) {
                    showMissedTargetFeedback(sceneIndicator);
                    gameState.sceneErrors++;
                }
                if (gameState.stimulusTypes.includes("location") && !gameState.locationTargetProcessed && gameState.currentIsLocationTarget) {
                    showMissedTargetFeedback(locationIndicator);
                    gameState.locationErrors++;
                }
                if (gameState.stimulusTypes.includes("sound") && !gameState.soundTargetProcessed && gameState.currentIsSoundTarget) {
                    showMissedTargetFeedback(soundIndicator);
                    gameState.soundErrors++;
                }
                if (gameState.stimulusTypes.includes("color") && !gameState.colorTargetProcessed && gameState.currentIsColorTarget) {
                    showMissedTargetFeedback(colorIndicator);
                    gameState.colorErrors++;
                }
                setTimeout(() => {
                    endBlock();
                }, 500);
            }, 2500);
        }, 1000);
    }
}

function playSound(soundIndex) {
    stopSound();
    if (!gameState.stimulusTypes.includes("sound")) return;
    if (gameState.soundSource === "pianoTones") {
        if (soundIndex >= 0 && soundIndex < gameState.pianoTones.length) {
            const note = gameState.pianoTones[soundIndex];
            const frequency = gameState.pianoFrequencies[note];
            if (frequency) {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.value = frequency;
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                gainNode.gain.value = 0.3;
                const now = audioContext.currentTime;
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
                oscillator.start();
                gameState.soundStimulus = { oscillator: oscillator, gainNode: gainNode };
                setTimeout(() => {
                    stopSound();
                }, 1000);
                console.log("playSound() - Piano tone:", note, frequency, "Hz");
            } else {
                console.error("playSound() - Invalid piano note:", note);
            }
        } else {
            console.error("playSound() - Invalid pianoTones index:", soundIndex);
        }
    } else if (gameState.soundSource === "soundFiles") {
        if (soundIndex >= 0 && soundIndex < gameState.soundFiles.length) {
            const baseUrl = gameState.soundSourceUrl || "sounds/";
            const soundUrl = `${baseUrl}${gameState.soundFiles[soundIndex].split('/').pop()}`;
            gameState.audioLoader.load(
                soundUrl,
                function (buffer) {
                    const listener = new THREE.AudioListener();
                    camera.add(listener);
                    const sound = new THREE.Audio(listener);
                    sound.setBuffer(buffer);
                    sound.setVolume(0.5);
                    sound.play();
                    gameState.soundStimulus = sound;
                    console.log("playSound() - Sound file:", soundUrl);
                },
                function (xhr) {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                function (err) {
                    console.error('Error loading sound:', soundUrl, err);
                }
            );
        } else {
            console.error("playSound() - Invalid soundFiles index:", soundIndex);
        }
    }
}

function stopSound() {
    if (gameState.soundSource === "pianoTones") {
        if (gameState.soundStimulus && gameState.soundStimulus.oscillator && gameState.soundStimulus.gainNode) {
            const gainNode = gameState.soundStimulus.gainNode;
            const now = audioContext.currentTime;
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
            setTimeout(() => {
                if (gameState.soundStimulus && gameState.soundStimulus.oscillator) {
                    gameState.soundStimulus.oscillator.stop();
                    gameState.soundStimulus.oscillator.disconnect();
                    gameState.soundStimulus.gainNode.disconnect();
                    gameState.soundStimulus = null;
                    console.log("stopSound() - Piano tone stopped (fade-out)");
                }
            }, 200);
        }
    } else {
        if (gameState.soundStimulus && gameState.soundStimulus.isPlaying) {
            gameState.soundStimulus.stop();
            gameState.soundStimulus = null;
            console.log("stopSound() - Sound file stopped");
        }
    }
}

function clearAllSounds() {
    stopSound();
}

function generateNextStimulus() {
    if (!gameState.isPlaying) return;
    let shouldBeSceneTarget = false;
    let shouldBeLocationTarget = false;
    let shouldBeSoundTarget = false;
    let shouldBeColorTarget = false;
    let shouldBeBothTargets = false;
    if (gameState.stimulusTypes.includes("scene")) {
        shouldBeSceneTarget = gameState.sceneTargets < 6 && Math.random() < (6 - gameState.sceneTargets) / (gameState.stimuliPerBlock - gameState.currentStimulus);
    }
    if (gameState.stimulusTypes.includes("location")) {
        shouldBeLocationTarget = gameState.locationTargets < 6 && Math.random() < (6 - gameState.locationTargets) / (gameState.stimuliPerBlock - gameState.currentStimulus);
    }
    if (gameState.stimulusTypes.includes("sound")) {
        shouldBeSoundTarget = gameState.soundTargets < 6 && Math.random() < (6 - gameState.soundTargets) / (gameState.stimuliPerBlock - gameState.currentStimulus);
    }
    if (gameState.stimulusTypes.includes("color")) {
        shouldBeColorTarget = gameState.colorTargets < 6 && Math.random() < (6 - gameState.colorTargets) / (gameState.stimuliPerBlock - gameState.currentStimulus);
    }
    if (gameState.stimulusTypes.length >= 2) {
        shouldBeBothTargets = (gameState.bothTargets < 2 && Math.random() < (2 - gameState.bothTargets) / (gameState.stimuliPerBlock - gameState.currentStimulus) && gameState.stimulusTypes.every(type => {
            if (type === "scene") return shouldBeSceneTarget;
            if (type === "location") return shouldBeLocationTarget;
            if (type === "sound") return shouldBeSoundTarget;
            if (type === "color") return shouldBeColorTarget;
            return false;
        }));
    }
    let imageIndex, panelIndex, soundIndex, colorIndex;
    imageIndex = Math.floor(Math.random() * imageTextures.length);
    panelIndex = Math.floor(Math.random() * panels.length);
    soundIndex = gameState.soundSource === "soundFiles" ? Math.floor(Math.random() * gameState.soundFiles.length) : Math.floor(Math.random() * gameState.pianoTones.length);
    colorIndex = Math.floor(Math.random() * distinctColors.length);
    let targetType = "none";
    if (gameState.currentStimulus >= gameState.nBackLevel) {
        if (shouldBeBothTargets && gameState.stimulusTypes.length >= 2) {
            imageIndex = gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel];
            panelIndex = gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel];
            soundIndex = gameState.soundHistory[gameState.currentStimulus - gameState.nBackLevel];
            colorIndex = gameState.colorHistory[gameState.currentStimulus - gameState.nBackLevel];
            targetType = "both";
        } else if (shouldBeSceneTarget && gameState.stimulusTypes.includes("scene")) {
            imageIndex = gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel];
            do {
                panelIndex = Math.floor(Math.random() * panels.length);
            } while (!gameState.stimulusTypes.includes("location") || panelIndex === gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel]);
            soundIndex = gameState.soundSource === "soundFiles" ? Math.floor(Math.random() * gameState.soundFiles.length) : Math.floor(Math.random() * gameState.pianoTones.length);
            colorIndex = Math.floor(Math.random() * distinctColors.length);
            targetType = "scene";
        } else if (shouldBeLocationTarget && gameState.stimulusTypes.includes("location")) {
            panelIndex = gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel];
            do {
                imageIndex = Math.floor(Math.random() * imageTextures.length);
            } while (!gameState.stimulusTypes.includes("scene") || imageIndex === gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel]);
            soundIndex = gameState.soundSource === "soundFiles" ? Math.floor(Math.random() * gameState.soundFiles.length) : Math.floor(Math.random() * gameState.pianoTones.length);
            colorIndex = Math.floor(Math.random() * distinctColors.length);
            targetType = "location";
        } else if (shouldBeSoundTarget && gameState.stimulusTypes.includes("sound")) {
            soundIndex = gameState.soundHistory[gameState.currentStimulus - gameState.nBackLevel];
            do {
                imageIndex = Math.floor(Math.random() * imageTextures.length);
            } while (!gameState.stimulusTypes.includes("scene") || imageIndex === gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel]);
            panelIndex = Math.floor(Math.random() * panels.length);
            colorIndex = Math.floor(Math.random() * distinctColors.length);
            targetType = "sound";
        } else if (shouldBeColorTarget && gameState.stimulusTypes.includes("color")) {
            colorIndex = gameState.colorHistory[gameState.currentStimulus - gameState.nBackLevel];
            do {
                imageIndex = Math.floor(Math.random() * imageTextures.length);
            } while (!gameState.stimulusTypes.includes("scene") || imageIndex === gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel]);
            panelIndex = Math.floor(Math.random() * panels.length);
            soundIndex = gameState.soundSource === "soundFiles" ? Math.floor(Math.random() * gameState.soundFiles.length) : Math.floor(Math.random() * gameState.pianoTones.length);
            targetType = "color";
        } else {
            do {
                imageIndex = Math.floor(Math.random() * imageTextures.length);
                panelIndex = Math.floor(Math.random() * panels.length);
                soundIndex = gameState.soundSource === "soundFiles" ? Math.floor(Math.random() * gameState.soundFiles.length) : Math.floor(Math.random() * gameState.pianoTones.length);
                colorIndex = Math.floor(Math.random() * distinctColors.length);
            } while (
                (gameState.stimulusTypes.includes("scene") && imageIndex === gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel]) ||
                (gameState.stimulusTypes.includes("location") && panelIndex === gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel]) ||
                (gameState.stimulusTypes.includes("sound") && soundIndex === gameState.soundHistory[gameState.currentStimulus - gameState.nBackLevel]) ||
                (gameState.stimulusTypes.includes("color") && colorIndex === gameState.colorHistory[gameState.currentStimulus - gameState.nBackLevel])
            );
            targetType = "non-target";
        }
    } else {
        imageIndex = Math.floor(Math.random() * imageTextures.length);
        panelIndex = Math.floor(Math.random() * panels.length);
        soundIndex = gameState.soundSource === "soundFiles" ? Math.floor(Math.random() * gameState.soundFiles.length) : Math.floor(Math.random() * gameState.pianoTones.length);
        colorIndex = Math.floor(Math.random() * distinctColors.length);
        targetType = "initial";
    }
    console.log("generateNextStimulus() - Generated stimulus:", imageIndex, panelIndex, soundIndex, colorIndex, "Target type:", targetType);
    gameState.nextStimulusInfo = { imageIndex: imageIndex, panelIndex: panelIndex, soundIndex: soundIndex, colorIndex: colorIndex };
    updateStimulusCounter();
    showStimulus(imageIndex, panelIndex, soundIndex, colorIndex);
}

function handleKeyPress(e) {
    if (e.key === 'Escape') {
        showTitleScreen();
        return;
    }
    if (!gameState.isPlaying) {
        if (e.code === 'Space') {
            startBlock();
        }
        return;
    }
    if (gameState.stimulusTypes.includes("scene") && e.key.toUpperCase() === gameState.sceneKey && !gameState.sceneTargetProcessed && gameState.canRespond) {
        handleSceneResponse();
    }
    if (gameState.stimulusTypes.includes("location") && e.key.toUpperCase() === gameState.locationKey && !gameState.locationTargetProcessed && gameState.canRespond) {
        handleLocationResponse();
    }
    if (gameState.stimulusTypes.includes("sound") && e.key.toUpperCase() === gameState.soundKey && !gameState.soundTargetProcessed && gameState.canRespond) {
        handleSoundResponse();
    }
    if (gameState.stimulusTypes.includes("color") && e.key.toUpperCase() === gameState.colorKey && !gameState.colorTargetProcessed && gameState.canRespond) {
        handleColorResponse();
    }
}

function handleSceneResponse() {
    gameState.sceneTargetProcessed = true;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback(sceneIndicator);
        return;
    }
    gameState.sceneResponses++;
    const isCorrect = gameState.currentIsSceneTarget;
    showIndicatorFeedback(sceneIndicator, isCorrect);
    if (!isCorrect) {
        gameState.sceneErrors++;
        console.log("handleSceneResponse() - Scene error, sceneErrors:", gameState.sceneErrors);
    }
}

function handleLocationResponse() {
    gameState.locationTargetProcessed = true;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback(locationIndicator);
        return;
    }
    gameState.locationResponses++;
    const isCorrect = gameState.currentIsLocationTarget;
    showIndicatorFeedback(locationIndicator, isCorrect);
    if (!isCorrect) {
        gameState.locationErrors++;
        console.log("handleLocationResponse() - Location error, locationErrors:", gameState.locationErrors);
    }
}

function handleSoundResponse() {
    gameState.soundTargetProcessed = true;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback(soundIndicator);
        return;
    }
    gameState.soundResponses++;
    const isCorrect = gameState.currentIsSoundTarget;
    showIndicatorFeedback(soundIndicator, isCorrect);
    if (!isCorrect) {
        gameState.soundErrors++;
        console.log("handleSoundResponse() - Sound error, soundErrors:", gameState.soundErrors);
    }
}

function handleColorResponse() {
    gameState.colorTargetProcessed = true;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback(colorIndicator);
        return;
    }
    gameState.colorResponses++;
    const isCorrect = gameState.currentIsColorTarget;
    showIndicatorFeedback(colorIndicator, isCorrect);
    if (!isCorrect) {
        gameState.colorErrors++;
        console.log("handleColorResponse() - Color error, colorErrors:", gameState.colorErrors);
    }
}

function startBlock() {
    gameState.isPlaying = true;
    gameState.currentStimulus = 0;
    gameState.sceneHistory = [];
    gameState.locationHistory = [];
    gameState.soundHistory = [];
    gameState.colorHistory = [];
    gameState.sceneTargets = 0;
    gameState.locationTargets = 0;
    gameState.soundTargets = 0;
    gameState.colorTargets = 0;
    gameState.bothTargets = 0;
    gameState.sceneResponses = 0;
    gameState.locationResponses = 0;
    gameState.soundResponses = 0;
    gameState.colorResponses = 0;
    gameState.sceneErrors = 0;
    gameState.locationErrors = 0;
    gameState.soundErrors = 0;
    gameState.colorErrors = 0;
    gameState.consecutiveGames++;
    localStorage.setItem('totalGamesToday', gameState.totalGamesToday);
    localStorage.setItem('lastGameDate', new Date().toDateString());
    document.getElementById('titleScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'none';
    sceneIndicator.style.display = gameState.stimulusTypes.includes("scene") ? 'flex' : 'none';
    locationIndicator.style.display = gameState.stimulusTypes.includes("location") ? 'flex' : 'none';
    soundIndicator.style.display = gameState.stimulusTypes.includes("sound") ? 'flex' : 'none';
    colorIndicator.style.display = gameState.stimulusTypes.includes("color") ? 'flex' : 'none';
    resetStimulusCounter();
    applySettings();
    setTimeout(() => {
        generateNextStimulus();
    }, 1000);
}

function endBlock() {
    gameState.isPlaying = false;
    gameState.currentBlock++;
    gameState.totalGamesToday++;
    localStorage.setItem('totalGamesToday', gameState.totalGamesToday);
    const totalSceneErrors = gameState.sceneErrors;
    const totalLocationErrors = gameState.locationErrors;
    const totalSoundErrors = gameState.soundErrors;
    const totalColorErrors = gameState.colorErrors;
    document.getElementById('sceneErrors').textContent = totalSceneErrors;
    document.getElementById('locationErrors').textContent = totalLocationErrors;
    document.getElementById('soundErrors').textContent = totalSoundErrors;
    document.getElementById('colorErrors').textContent = totalColorErrors;
    document.getElementById('resultNLevel').textContent = gameState.nBackLevel;
    let levelChange = '';
    let nextNBackLevel = gameState.nBackLevel;
    let totalErrors = totalSceneErrors + totalLocationErrors + totalSoundErrors + totalColorErrors;
    if (!gameState.isLevelLocked) {
        if (gameState.nBackLevel === 1 && totalErrors > 5) {
            levelChange = '즐기는 거야~!😆';
        } else if (totalErrors < 3) {
            nextNBackLevel = gameState.nBackLevel + 1;
            levelChange = '⬆️ 최고야! 레벨업!!♥️🥰';
        } else if (totalErrors > 5) {
            nextNBackLevel = Math.max(1, gameState.nBackLevel - 1);
            levelChange = '⬇️ 괜찮아! 다시 해보자!😉♥️';
        } else {
            levelChange = '➡️ 오 좋아! 킵고잉!👏♥️';
        }
        gameState.nBackLevel = nextNBackLevel;
    } else {
        levelChange = '🔒 레벨 고정됨';
    }
    document.getElementById('levelChange').textContent = levelChange;
    document.getElementById('nBackLevel').textContent = gameState.nBackLevel;
    localStorage.setItem('nBackLevel', gameState.nBackLevel);
    document.getElementById('consecutiveGamesCount').textContent = gameState.consecutiveGames;
    document.getElementById('resultScreen').style.display = 'flex';
    setBackgroundImageToResultScreen();
}

function cancelAllTimers() {
    if (gameState.currentTimer) {
        clearTimeout(gameState.currentTimer);
    }
    if (gameState.responseWindowTimer) {
        clearTimeout(gameState.responseWindowTimer);
    }
}

function setBackgroundImageToResultScreen() {
    const backgroundImageDiv = document.getElementById('resultBackgroundImage');
    if (gameState.resultImageUrl) {
        backgroundImageDiv.style.backgroundImage = `url('${gameState.resultImageUrl}')`;
    } else {
        backgroundImageDiv.style.backgroundImage = 'none';
    }
}

function showTitleScreen() {
    cancelAllTimers();
    clearAllStimuli();
    clearAllSounds();
    gameState.isPlaying = false;
    document.getElementById('titleScreen').style.display = 'flex';
    document.getElementById('resultScreen').style.display = 'none';
    sceneIndicator.style.display = 'none';
    locationIndicator.style.display = 'none';
    soundIndicator.style.display = 'none';
    colorIndicator.style.display = 'none';
}

function updateStimulusCounter() {
    document.getElementById('stimulus-counter').textContent = `Stimulus: ${gameState.currentStimulus} / ${gameState.stimuliPerBlock}`;
}

function resetStimulusCounter() {
    document.getElementById('stimulus-counter').textContent = `Stimulus: 0 / ${gameState.stimuliPerBlock}`;
}

document.addEventListener('keydown', handleKeyPress);

let lastTap = 0;
document.addEventListener('touchstart', function(e) {
    const now = new Date().getTime();
    const timeSince = now - lastTap;
    if (timeSince < 300 && timeSince > 0) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
            console.log('전체화면 모드 활성화! 🌕');
        }
    }
    lastTap = now;
});

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

sceneIndicator.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (gameState.isPlaying && gameState.stimulusTypes.includes("scene") && !gameState.sceneTargetProcessed && gameState.canRespond) {
        handleSceneResponse();
    }
});

locationIndicator.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (gameState.isPlaying && gameState.stimulusTypes.includes("location") && !gameState.locationTargetProcessed && gameState.canRespond) {
        handleLocationResponse();
    }
});

soundIndicator.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (gameState.isPlaying && gameState.stimulusTypes.includes("sound") && !gameState.soundTargetProcessed && gameState.canRespond) {
        handleSoundResponse();
    }
});

colorIndicator.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (gameState.isPlaying && gameState.stimulusTypes.includes("color") && !gameState.colorTargetProcessed && gameState.canRespond) {
        handleColorResponse();
    }
});

sceneIndicator.addEventListener('click', function() {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("scene") && !gameState.sceneTargetProcessed && gameState.canRespond) {
        handleSceneResponse();
    }
});

locationIndicator.addEventListener('click', function() {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("location") && !gameState.locationTargetProcessed && gameState.canRespond) {
        handleLocationResponse();
    }
});

soundIndicator.addEventListener('click', function() {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("sound") && !gameState.soundTargetProcessed && gameState.canRespond) {
        handleSoundResponse();
    }
});

colorIndicator.addEventListener('click', function() {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("color") && !gameState.colorTargetProcessed && gameState.canRespond) {
        handleColorResponse();
    }
});

document.getElementById('setLevelBtn').addEventListener('click', function() {
    setCustomLevel();
});

document.getElementById('customLevel').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        setCustomLevel();
    }
});

document.getElementById('pressSpace').addEventListener('click', function() {
    if (!gameState.isPlaying) {
        startBlock();
    }
});

document.getElementById('pressSpace').addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (!gameState.isPlaying) {
        startBlock();
    }
});

document.getElementById('pressSpaceResult').addEventListener('click', function() {
    if (!gameState.isPlaying) {
        startBlock();
    }
});

document.getElementById('pressSpaceResult').addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (!gameState.isPlaying) {
        startBlock();
    }
});

function setCustomLevel() {
    const customLevelInput = document.getElementById('customLevel');
    let newLevel = parseInt(customLevelInput.value);
    if (isNaN(newLevel) || newLevel < 1) {
        newLevel = 1;
        customLevelInput.value = 1;
    } else if (newLevel > 9) {
        newLevel = 9;
        customLevelInput.value = 9;
    }
    gameState.nBackLevel = newLevel;
    document.getElementById('nBackLevel').textContent = gameState.nBackLevel;
    localStorage.setItem('nBackLevel', gameState.nBackLevel);
    customLevelInput.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
    setTimeout(() => {
        customLevelInput.style.backgroundColor = 'rgba(255,255,255,0.9)';
    }, 500);
}

document.getElementById('lockLevelBtn').addEventListener('click', function() {
    gameState.isLevelLocked = !gameState.isLevelLocked;
    const lockButton = document.getElementById('lockLevelBtn');
    if (gameState.isLevelLocked) {
        lockButton.classList.add('locked');
        lockButton.textContent = '해제';
        localStorage.setItem('isLevelLocked', 'true');
    } else {
        lockButton.classList.remove('locked');
        lockButton.textContent = '고정';
        localStorage.setItem('isLevelLocked', 'false');
    }
});

document.getElementById('openSettingsBtn').addEventListener('click', function() {
    document.getElementById('settingsPanel').style.display = 'block';
    populateSettings();
});

document.getElementById('closeSettingsBtn').addEventListener('click', function() {
    document.getElementById('settingsPanel').style.display = 'none';
});

document.getElementById('applySettingsBtn').addEventListener('click', function() {
    applySettings();
    document.getElementById('settingsPanel').style.display = 'none';
});

function populateSettings() {
    document.getElementById('sceneStimulus').checked = gameState.stimulusTypes.includes("scene");
    document.getElementById('locationStimulus').checked = gameState.stimulusTypes.includes("location");
    document.getElementById('soundStimulus').checked = gameState.stimulusTypes.includes("sound");
    document.getElementById('colorStimulus').checked = gameState.stimulusTypes.includes("color");
    document.getElementById('imageSourceUrl').value = gameState.imageSourceUrl;
    document.getElementById('resultImageUrl').value = gameState.resultImageUrl;
    document.getElementById('soundSourceSelect').value = gameState.soundSource;
    document.getElementById('soundSourceUrl').value = gameState.soundSourceUrl;
    document.getElementById('sceneKey').value = gameState.sceneKey;
    document.getElementById('locationKey').value = gameState.locationKey;
    document.getElementById('soundKey').value = gameState.soundKey;
    document.getElementById('colorKey').value = gameState.colorKey;
    document.getElementById('button1Assignment').value = gameState.stimulusTypes.includes("scene") ? "scene" : "none";
    document.getElementById('button2Assignment').value = gameState.stimulusTypes.includes("sound") ? "sound" : "none";
    document.getElementById('button3Assignment').value = gameState.stimulusTypes.includes("location") ? "location" : "none";
    document.getElementById('button4Assignment').value = gameState.stimulusTypes.includes("color") ? "color" : "none";
    document.getElementById('button1Left').value = parseInt(sceneIndicator.style.left) || 30;
    document.getElementById('button1Bottom').value = parseInt(sceneIndicator.style.bottom) || 40;
    document.getElementById('button2Left').value = parseInt(soundIndicator.style.left) || 130;
    document.getElementById('button2Bottom').value = parseInt(soundIndicator.style.bottom) || 40;
    document.getElementById('button3Right').value = parseInt(colorIndicator.style.right) || 130;
    document.getElementById('button3Bottom').value = parseInt(colorIndicator.style.bottom) || 40;
    document.getElementById('button4Right').value = parseInt(locationindicator.right) || 30;
    document.getElementById('button4Bottom').value = parseInt(locationindicator.style.bottom) || 40;
    document.getElementById('buttonWidth').value = parseInt(sceneIndicator.style.width) || 80;
    document.getElementById('buttonHeight').value = parseInt(sceneIndicator.style.height) || 80;
}

function applySettings() {
    const newStimulusTypes = [];
    if (document.getElementById('sceneStimulus').checked) newStimulusTypes.push("scene");
    if (document.getElementById('locationStimulus').checked) newStimulusTypes.push("location");
    if (document.getElementById('soundStimulus').checked) newStimulusTypes.push("sound");
    if (document.getElementById('colorStimulus').checked) newStimulusTypes.push("color");

    if (newStimulusTypes.length < 2 || newStimulusTypes.length > 4) {
        const errorDiv = document.getElementById('settingsError');
        errorDiv.textContent = "자극 유형은 최소 2개, 최대 4개를 선택해야 합니다.";
        errorDiv.style.display = 'block';
        setTimeout(() => { errorDiv.style.display = 'none'; }, 3000);
        return;
    }

    // gameState 업데이트
    gameState.stimulusTypes = newStimulusTypes;
    gameState.imageSourceUrl = document.getElementById('imageSourceUrl').value || "images/";
    gameState.resultImageUrl = document.getElementById('resultImageUrl').value || "";
    gameState.soundSource = document.getElementById('soundSourceSelect').value;
    gameState.soundSourceUrl = document.getElementById('soundSourceUrl').value || "sounds/";
    gameState.sceneKey = document.getElementById('sceneKey').value.toUpperCase() || "S";
    gameState.locationKey = document.getElementById('locationKey').value.toUpperCase() || "L";
    gameState.soundKey = document.getElementById('soundKey').value.toUpperCase() || "A";
    gameState.colorKey = document.getElementById('colorKey').value.toUpperCase() || "D";

    // 버튼 위치 및 스타일 적용
    sceneIndicator.style.left = document.getElementById('button1Left').value + 'px';
    sceneIndicator.style.bottom = document.getElementById('button1Bottom').value + 'px';
    soundIndicator.style.left = document.getElementById('button2Left').value + 'px';
    soundIndicator.style.bottom = document.getElementById('button2Bottom').value + 'px';
    locationIndicator.style.right = document.getElementById('button3Right').value + 'px';
    locationIndicator.style.bottom = document.getElementById('button3Bottom').value + 'px';
    colorIndicator.style.right = document.getElementById('button4Right').value + 'px';
    colorIndicator.style.bottom = document.getElementById('button4Bottom').value + 'px';

    const buttonWidth = document.getElementById('buttonWidth').value + 'px';
    const buttonHeight = document.getElementById('buttonHeight').value + 'px';
    sceneIndicator.style.width = buttonWidth;
    sceneIndicator.style.height = buttonHeight;
    soundIndicator.style.width = buttonWidth;
    soundIndicator.style.height = buttonHeight;
    locationIndicator.style.width = buttonWidth;
    locationIndicator.style.height = buttonHeight;
    colorIndicator.style.width = buttonWidth;
    colorIndicator.style.height = buttonHeight;

    const bgColor = document.getElementById('buttonBgColor').value || '#ffffff';
    const bgOpacity = document.getElementById('buttonBgOpacity').value || '0.5';
    const textColor = document.getElementById('buttonTextColor').value || '#ffffff';
    const textOpacity = document.getElementById('buttonTextOpacity').value || '0.5';
    sceneIndicator.style.backgroundColor = hexToRgba(bgColor, bgOpacity);
    soundIndicator.style.backgroundColor = hexToRgba(bgColor, bgOpacity);
    locationIndicator.style.backgroundColor = hexToRgba(bgColor, bgOpacity);
    colorIndicator.style.backgroundColor = hexToRgba(bgColor, bgOpacity);
    sceneIndicator.style.color = hexToRgba(textColor, textOpacity);
    soundIndicator.style.color = hexToRgba(textColor, textOpacity);
    locationIndicator.style.color = hexToRgba(textColor, textOpacity);
    colorIndicator.style.color = hexToRgba(textColor, textOpacity);

    // localStorage에 저장
    localStorage.setItem('stimulusTypes', JSON.stringify(gameState.stimulusTypes));
    localStorage.setItem('imageSourceUrl', gameState.imageSourceUrl);
    localStorage.setItem('resultImageUrl', gameState.resultImageUrl);
    localStorage.setItem('soundSource', gameState.soundSource);
    localStorage.setItem('soundSourceUrl', gameState.soundSourceUrl);
    localStorage.setItem('sceneKey', gameState.sceneKey);
    localStorage.setItem('locationKey', gameState.locationKey);
    localStorage.setItem('soundKey', gameState.soundKey);
    localStorage.setItem('colorKey', gameState.colorKey);
    localStorage.setItem('button1Left', document.getElementById('button1Left').value);
    localStorage.setItem('button1Bottom', document.getElementById('button1Bottom').value);
    localStorage.setItem('button2Left', document.getElementById('button2Left').value);
    localStorage.setItem('button2Bottom', document.getElementById('button2Bottom').value);
    localStorage.setItem('button3Right', document.getElementById('button3Right').value);
    localStorage.setItem('button3Bottom', document.getElementById('button3Bottom').value);
    localStorage.setItem('button4Right', document.getElementById('button4Right').value);
    localStorage.setItem('button4Bottom', document.getElementById('button4Bottom').value);
    localStorage.setItem('buttonWidth', document.getElementById('buttonWidth').value);
    localStorage.setItem('buttonHeight', document.getElementById('buttonHeight').value);
    localStorage.setItem('buttonBgColor', bgColor);
    localStorage.setItem('buttonBgOpacity', bgOpacity);
    localStorage.setItem('buttonTextColor', textColor);
    localStorage.setItem('buttonTextOpacity', textOpacity);

    // 저장 확인 로그
    console.log("Settings saved to localStorage:", {
        stimulusTypes: localStorage.getItem('stimulusTypes'),
        resultImageUrl: localStorage.getItem('resultImageUrl'),
        soundSource: localStorage.getItem('soundSource')
    });

    loadImageTextures();
    document.getElementById('settingsPanel').style.display = 'none';
}

function hexToRgba(hex, opacity) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

window.addEventListener('load', function() {
    const storedLevel = localStorage.getItem('nBackLevel');
    if (storedLevel) {
        gameState.nBackLevel = parseInt(storedLevel);
        document.getElementById('nBackLevel').textContent = gameState.nBackLevel;
        document.getElementById('customLevel').value = gameState.nBackLevel;
    }

    const storedTotalGames = localStorage.getItem('totalGamesToday');
    const lastGameDate = localStorage.getItem('lastGameDate');
    const today = new Date().toDateString();
    if (storedTotalGames && lastGameDate === today) {
        gameState.totalGamesToday = parseInt(storedTotalGames);
    } else {
        gameState.totalGamesToday = 0;
        localStorage.setItem('totalGamesToday', '0');
        localStorage.setItem('lastGameDate', today);
    }
    document.getElementById('totalGamesTodayCountValue').textContent = gameState.totalGamesToday;

    // localStorage에서 설정값 로드
    const storedStimulusTypes = localStorage.getItem('stimulusTypes');
    if (storedStimulusTypes) gameState.stimulusTypes = JSON.parse(storedStimulusTypes);
    gameState.imageSourceUrl = localStorage.getItem('imageSourceUrl') || "images/";
    gameState.resultImageUrl = localStorage.getItem('resultImageUrl') || "";
    gameState.soundSource = localStorage.getItem('soundSource') || "pianoTones";
    gameState.soundSourceUrl = localStorage.getItem('soundSourceUrl') || "sounds/";
    gameState.sceneKey = localStorage.getItem('sceneKey') || "S";
    gameState.locationKey = localStorage.getItem('locationKey') || "L";
    gameState.soundKey = localStorage.getItem('soundKey') || "A";
    gameState.colorKey = localStorage.getItem('colorKey') || "D";
    gameState.isLevelLocked = localStorage.getItem('isLevelLocked') === 'true';
    if (gameState.isLevelLocked) {
        document.getElementById('lockLevelBtn').classList.add('locked');
        document.getElementById('lockLevelBtn').textContent = '해제';
    }

    // 버튼 스타일 로드
    sceneIndicator.style.left = (localStorage.getItem('button1Left') || '30') + 'px';
    sceneIndicator.style.bottom = (localStorage.getItem('button1Bottom') || '40') + 'px';
    soundIndicator.style.left = (localStorage.getItem('button2Left') || '130') + 'px';
    soundIndicator.style.bottom = (localStorage.getItem('button2Bottom') || '40') + 'px';
    colorIndicator.style.right = (localStorage.getItem('button3Right') || '130') + 'px';
    colorIndicator.style.bottom = (localStorage.getItem('button3Bottom') || '40') + 'px';
    locationIndicator.style.right = (localStorage.getItem('button4Right') || '30') + 'px';
    locationIndicator.style.bottom = (localStorage.getItem('button4Bottom') || '40') + 'px';

    const buttonWidth = (localStorage.getItem('buttonWidth') || '80') + 'px';
    const buttonHeight = (localStorage.getItem('buttonHeight') || '80') + 'px';
    sceneIndicator.style.width = buttonWidth;
    sceneIndicator.style.height = buttonHeight;
    soundIndicator.style.width = buttonWidth;
    soundIndicator.style.height = buttonHeight;
    locationIndicator.style.width = buttonWidth;
    locationIndicator.style.height = buttonHeight;
    colorIndicator.style.width = buttonWidth;
    colorIndicator.style.height = buttonHeight;

    const bgColor = localStorage.getItem('buttonBgColor') || '#ffffff';
    const bgOpacity = localStorage.getItem('buttonBgOpacity') || '0.5';
    const textColor = localStorage.getItem('buttonTextColor') || '#ffffff';
    const textOpacity = localStorage.getItem('buttonTextOpacity') || '0.5';
    sceneIndicator.style.backgroundColor = hexToRgba(bgColor, bgOpacity);
    soundIndicator.style.backgroundColor = hexToRgba(bgColor, bgOpacity);
    locationIndicator.style.backgroundColor = hexToRgba(bgColor, bgOpacity);
    colorIndicator.style.backgroundColor = hexToRgba(bgColor, bgOpacity);
    sceneIndicator.style.color = hexToRgba(textColor, textOpacity);
    soundIndicator.style.color = hexToRgba(textColor, textOpacity);
    locationIndicator.style.color = hexToRgba(textColor, textOpacity);
    colorIndicator.style.color = hexToRgba(textColor, textOpacity);

    // 로드 확인 로그
    console.log("Settings loaded from localStorage:", {
        stimulusTypes: gameState.stimulusTypes,
        resultImageUrl: gameState.resultImageUrl,
        soundSource: gameState.soundSource
    });

    loadImageTextures();
    showTitleScreen();
});


function checkLocalStorage() {
    console.log("Current localStorage values:", {
        stimulusTypes: localStorage.getItem('stimulusTypes'),
        imageSourceUrl: localStorage.getItem('imageSourceUrl'),
        resultImageUrl: localStorage.getItem('resultImageUrl'),
        soundSource: localStorage.getItem('soundSource'),
        sceneKey: localStorage.getItem('sceneKey'),
        buttonWidth: localStorage.getItem('buttonWidth')
    });
}

// "적용" 버튼 클릭 후 호출 확인
document.getElementById('applySettingsBtn').addEventListener('click', function() {
    applySettings();
    setTimeout(checkLocalStorage, 100); // 저장 후 100ms 뒤에 확인
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
