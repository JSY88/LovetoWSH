// Web Audio Context Initialization
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Game State
const gameState = {
    stimulusDuration: 1000,      // 자극 제시 지속시간 (ms)
    stimulusInterval: 2500,      // 자극 간 간격 시간 (ms)
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
    interferenceType: "random",
    randomInterferenceProbabilities: {
        "previous": 0.33,
        "cyclic": 0.33,
        "next": 0.34
    },
    cyclicInterferenceNBackLevel: 2,
    nextStimulusInfo: null,
    consecutiveGames: 0,
    totalGamesToday: 0,
    stimulusTypes: [],
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
    locationKey: "A",
    soundKey: "L",
    colorKey: "K",
    soundSourceUrl: "sounds/",
    isPaused: false, // ⏸️ 일시정지 상태 추가
    isFullscreen: false // 🖼️ 전체화면 상태 추가
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
        return { imageIndex: interferedImageIndex, panelIndex: interferedPanelIndex, soundIndex: interferedSoundIndex, colorIndex: currentColorIndex };
    }
    return { imageIndex: currentImageIndex, panelIndex: currentPanelIndex, soundIndex: currentSoundIndex, colorIndex: currentColorIndex };
}

function showStimulus(imageIndex, panelIndex, soundIndex, colorIndex) {
    if (gameState.isPaused) return; // ⏸️ paused 상태일 때 stimuli 표시 방지
    resetIndicators();
    const panel = panels[panelIndex];
    console.log("showStimulus() - imageIndex (before interference):", imageIndex, "panelIndex:", panelIndex, "soundIndex:", soundIndex, "colorIndex:", colorIndex);

    // 간섭 로직
    if (gameState.interferenceType === "next" && gameState.nextStimulusInfo) {
        const type = Math.random();
        let interferedImageIndex = imageIndex;
        let interferedPanelIndex = panelIndex;
        let interferedSoundIndex = soundIndex;
        let interferedColorIndex = colorIndex;
        if (type < 0.25) interferedImageIndex = gameState.nextStimulusInfo.imageIndex;
        else if (type < 0.5) interferedPanelIndex = gameState.nextStimulusInfo.panelIndex;
        else if (type < 0.75) interferedSoundIndex = gameState.nextStimulusInfo.soundIndex;
        else interferedColorIndex = gameState.nextStimulusInfo.colorIndex;
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

    // 자극 표시
    createStimulusImage(imageIndex, panel, colorIndex);
    if (gameState.stimulusTypes.includes("sound")) {
        playSound(soundIndex);
    }

    // 히스토리 업데이트 및 타겟 확인
    console.log("showStimulus() - Presented stimulus:", imageIndex, panelIndex, soundIndex, colorIndex);
    gameState.sceneHistory.push(imageIndex);
    gameState.locationHistory.push(panelIndex);
    gameState.soundHistory.push(soundIndex);
    gameState.colorHistory.push(colorIndex);

    // 타겟 여부 확인
    if (gameState.currentStimulus >= gameState.nBackLevel) {
        gameState.currentIsSceneTarget = gameState.stimulusTypes.includes("scene") && gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel] === imageIndex;
        gameState.currentIsLocationTarget = gameState.stimulusTypes.includes("location") && gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel] === panelIndex;
        gameState.currentIsSoundTarget = gameState.stimulusTypes.includes("sound") && gameState.soundHistory[gameState.currentStimulus - gameState.nBackLevel] === soundIndex;
        gameState.currentIsColorTarget = gameState.stimulusTypes.includes("color") && gameState.colorHistory[gameState.currentStimulus - gameState.nBackLevel] === colorIndex;
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

    // 자극 카운터 증가
    gameState.currentStimulus++;

    // 타이머 설정
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
            }, gameState.stimulusInterval);
        }, gameState.stimulusDuration);
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
            }, gameState.stimulusInterval);
        }, gameState.stimulusDuration);
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
    if (!gameState.isPlaying || gameState.isPaused) return; // ⏸️ paused 상태일 때 stimuli 생성 방지
    let shouldBeSceneTarget = false;
    let shouldBeLocationTarget = false;
    let shouldBeSoundTarget = false;
    let shouldBeColorTarget = false;
    let shouldBeBothTargets = false;

    // 동적 타겟 개수 목표 설정 (첫 번째 정의에서 가져옴)
    const targetCountGoal = Math.floor(gameState.stimuliPerBlock / 5); // 예: 30개 자극이면 6개 타겟

    // 각 자극 유형에 대한 타겟 여부 결정
    if (gameState.stimulusTypes.includes("scene")) {
        shouldBeSceneTarget = gameState.sceneTargets < targetCountGoal && Math.random() < (targetCountGoal - gameState.sceneTargets) / (gameState.stimuliPerBlock - gameState.currentStimulus);
    }
    if (gameState.stimulusTypes.includes("location")) {
        shouldBeLocationTarget = gameState.locationTargets < targetCountGoal && Math.random() < (targetCountGoal - gameState.locationTargets) / (gameState.stimuliPerBlock - gameState.currentStimulus);
    }
    if (gameState.stimulusTypes.includes("sound")) {
        shouldBeSoundTarget = gameState.soundTargets < targetCountGoal && Math.random() < (targetCountGoal - gameState.soundTargets) / (gameState.stimuliPerBlock - gameState.currentStimulus);
    }
    if (gameState.stimulusTypes.includes("color")) {
        shouldBeColorTarget = gameState.colorTargets < targetCountGoal && Math.random() < (targetCountGoal - gameState.colorTargets) / (gameState.stimuliPerBlock - gameState.currentStimulus);
    }

    // "both" 타겟 조건 (두 번째 정의에서 가져옴)
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

    // 타겟 생성 로직
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

// ⏸️ 일시정지 기능
function pauseGame() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    gameState.isPaused = true;
    cancelAllTimers();
    clearAllStimuli();
    stopSound();
    document.getElementById('pauseScreen').style.display = 'flex';
    gameState.isPlaying = false; // generateNextStimulus() 중지
}

// ⏸️ 게임 재개 기능
function resumeGame() {
    if (!gameState.isPaused) return;
    gameState.isPaused = false;
    document.getElementById('pauseScreen').style.display = 'none';
    gameState.isPlaying = true; // generateNextStimulus() 다시 시작 가능하도록
    generateNextStimulus(); // 즉시 다음 stimuli 표시
}

// 🖼️ 전체화면 토글 함수
function toggleFullscreen() {
    if (!gameState.isFullscreen) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
            document.documentElement.msRequestFullscreen();
        }
        gameState.isFullscreen = true;
        document.getElementById('fullscreenBtn').textContent = 'Normal';
        console.log('전체화면 모드 활성화! 🌕');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
        gameState.isFullscreen = false;
        document.getElementById('fullscreenBtn').textContent = 'Full';
        console.log('일반 화면 모드! ☀️');
    }
}

function handleKeyPress(e) {
    if (gameState.isPaused) return; // ⏸️ paused 상태일 때 키 입력 무시
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
    if (gameState.isPaused) return; // ⏸️ paused 상태일 때 반응 무시
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
    if (gameState.isPaused) return; // ⏸️ paused 상태일 때 반응 무시
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
    if (gameState.isPaused) return; // ⏸️ paused 상태일 때 반응 무시
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
    if (gameState.isPaused) return; // ⏸️ paused 상태일 때 반응 무시
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
    gameState.isPaused = false; // ⏸️ 게임 시작 시 paused 상태 해제
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
    loadSettings(); // ⭐️ 게임 시작 시 설정을 다시 로드하는 코드 추가
    localStorage.setItem('totalGamesToday', gameState.totalGamesToday);
    localStorage.setItem('lastGameDate', new Date().toDateString());

    document.getElementById('titleScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'none';

    sceneIndicator.style.display = gameState.stimulusTypes.includes("scene") ? 'flex' : 'none';
    soundIndicator.style.display = gameState.stimulusTypes.includes("sound") ? 'flex' : 'none';
    locationIndicator.style.display = gameState.stimulusTypes.includes("location") ? 'flex' : 'none';
    colorIndicator.style.display = gameState.stimulusTypes.includes("color") ? 'flex' : 'none';

    resetStimulusCounter();
    setTimeout(() => {
        generateNextStimulus();
    }, 1000);

    console.log("startBlock() - Applied settings:", {
        stimulusTypes: gameState.stimulusTypes,
        scenePos: { left: sceneIndicator.style.left, bottom: sceneIndicator.style.bottom },
        soundPos: { left: soundIndicator.style.left, bottom: soundIndicator.style.bottom }
    });
}

document.getElementById('toggleDevOptionsBtn').addEventListener('click', () => {
    const devOptions = document.getElementById('devOptions');
    devOptions.style.display = devOptions.style.display === 'none' ? 'block' : 'none';
});

function endBlock() {
    gameState.isPlaying = false;
    gameState.isPaused = false; // ⏸️ 게임 종료 시 paused 상태 해제
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

function showTitleScreen() {
    gameState.isPlaying = false;
    gameState.isPaused = false; // ⏸️ 타이틀 화면으로 돌아갈 때 paused 상태 해제
    cancelAllTimers();
    clearAllStimuli();
    clearAllSounds();
    document.getElementById('titleScreen').style.display = 'flex';
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('pauseScreen').style.display = 'none'; // ⏸️ 일시정지 화면 숨기기
    document.getElementById('totalGamesTodayCountValue').textContent = gameState.totalGamesToday;
    sceneIndicator.style.display = 'none';
    soundIndicator.style.display = 'none';
    locationIndicator.style.display = 'none';
    colorIndicator.style.display = 'none';
}

function resetStimulusCounter() {
    const stimulusCounter = document.getElementById('stimulus-counter');
    stimulusCounter.textContent = `Stimulus: ${gameState.currentStimulus} / ${gameState.stimuliPerBlock}`;
}

function updateStimulusCounter() {
    const stimulusCounter = document.getElementById('stimulus-counter');
    stimulusCounter.textContent = `Stimulus: ${gameState.currentStimulus + 1} / ${gameState.stimuliPerBlock}`;
}

function setBackgroundImageToResultScreen() {
    const resultBackgroundImage = document.getElementById('resultBackgroundImage');
    if (gameState.resultImageUrl) {
        resultBackgroundImage.style.backgroundImage = `url(${gameState.resultImageUrl})`;
    } else {
        resultBackgroundImage.style.backgroundImage = '';
    }
}

document.getElementById('pressSpaceResult').addEventListener('click', () => {
    if (!gameState.isPlaying) {
        showTitleScreen();
    }
});

document.getElementById('pressSpace').addEventListener('click', () => {
    if (!gameState.isPlaying) {
        startBlock();
    }
});

document.addEventListener('keydown', handleKeyPress);

sceneIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("scene") && !gameState.sceneTargetProcessed && gameState.canRespond) {
        handleSceneResponse();
    }
});

locationIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("location") && !gameState.locationTargetProcessed && gameState.canRespond) {
        handleLocationResponse();
    }
});

soundIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("sound") && !gameState.soundTargetProcessed && gameState.canRespond) {
        handleSoundResponse();
    }
});

colorIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("color") && !gameState.colorTargetProcessed && gameState.canRespond) {
        handleColorResponse();
    }
});

// ⏸️ 일시정지 버튼 이벤트
document.getElementById('pauseBtn').addEventListener('click', pauseGame);

// ⏸️ 게임 재개 버튼 이벤트
document.getElementById('resumeGameBtn').addEventListener('click', resumeGame);

// ⏸️ 메인 메뉴로 돌아가기 버튼 이벤트
document.getElementById('mainMenuBtn').addEventListener('click', showTitleScreen);

// 🖼️ 전체화면 버튼 이벤트
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

document.getElementById('setLevelBtn').addEventListener('click', () => {
    const customLevel = parseInt(document.getElementById('customLevel').value);
    if (customLevel >= 1 && customLevel <= 9) {
        gameState.nBackLevel = customLevel;
        document.getElementById('nBackLevel').textContent = gameState.nBackLevel;
        localStorage.setItem('nBackLevel', gameState.nBackLevel);
    }
});

document.getElementById('lockLevelBtn').addEventListener('click', () => {
    gameState.isLevelLocked = !gameState.isLevelLocked;
    const lockButton = document.getElementById('lockLevelBtn');
    lockButton.classList.toggle('locked', gameState.isLevelLocked);
    lockButton.textContent = gameState.isLevelLocked ? '해제' : '고정';
});

document.getElementById('openSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsPanel').style.display = 'block';
    populateSettings();
});

document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsPanel').style.display = 'none';
});

document.getElementById('applySettingsBtn').addEventListener('click', () => {
    applySettings();
    document.getElementById('settingsPanel').style.display = 'none';
});

function populateSettings() {
    document.getElementById('sceneStimulus').checked = gameState.stimulusTypes.includes('scene');
    document.getElementById('locationStimulus').checked = gameState.stimulusTypes.includes('location');
    document.getElementById('soundStimulus').checked = gameState.stimulusTypes.includes('sound');
    document.getElementById('colorStimulus').checked = gameState.stimulusTypes.includes('color');
    document.getElementById('imageSourceUrl').value = gameState.imageSourceUrl;
    document.getElementById('resultImageUrl').value = gameState.resultImageUrl;
    document.getElementById('button1Assignment').value = gameState.stimulusTypes.includes('scene') ? 'scene' : 'location';
    document.getElementById('button2Assignment').value = gameState.stimulusTypes.includes('sound') ? 'sound' : 'scene';
    document.getElementById('button3Assignment').value = gameState.stimulusTypes.includes('location') ? 'location' : 'sound';
    document.getElementById('button4Assignment').value = gameState.stimulusTypes.includes('color') ? 'color' : 'location';
    document.getElementById('sceneKey').value = gameState.sceneKey;
    document.getElementById('locationKey').value = gameState.locationKey;
    document.getElementById('soundKey').value = gameState.soundKey;
    document.getElementById('colorKey').value = gameState.colorKey;
    document.getElementById('soundSourceSelect').value = gameState.soundSource;
    document.getElementById('soundSourceUrl').value = gameState.soundSourceUrl;
    document.getElementById('button1Left').value = parseInt(sceneIndicator.style.left) || 30;
    document.getElementById('button1Bottom').value = parseInt(sceneIndicator.style.bottom) || 40;
    document.getElementById('button2Left').value = parseInt(soundIndicator.style.left) || 130;
    document.getElementById('button2Bottom').value = parseInt(soundIndicator.style.bottom) || 40;
    document.getElementById('button3Right').value = parseInt(locationIndicator.style.right) || 130;
    document.getElementById('button3Bottom').value = parseInt(locationIndicator.style.bottom) || 40;
    document.getElementById('button4Right').value = parseInt(colorIndicator.style.right) || 30;
    document.getElementById('button4Bottom').value = parseInt(colorIndicator.style.bottom) || 40;
    document.getElementById('buttonBgColor').value = '#ffffff';
    document.getElementById('buttonBgOpacity').value = 0.1;
    document.getElementById('buttonTextColor').value = '#ffffff';
    document.getElementById('buttonTextOpacity').value = 0.0;
    document.getElementById('buttonWidth').value = 80;
    document.getElementById('buttonHeight').value = 80;
document.getElementById('stimuliPerBlock').value = gameState.stimuliPerBlock;
    document.getElementById('stimulusDuration').value = gameState.stimulusDuration;
    document.getElementById('stimulusInterval').value = gameState.stimulusInterval;
}

function applySettings() {
    const newStimulusTypes = [];
    if (document.getElementById('sceneStimulus').checked) newStimulusTypes.push('scene');
    if (document.getElementById('locationStimulus').checked) newStimulusTypes.push('location');
    if (document.getElementById('soundStimulus').checked) newStimulusTypes.push('sound');
    if (document.getElementById('colorStimulus').checked) newStimulusTypes.push('color');

    if (newStimulusTypes.length < 2 || newStimulusTypes.length > 4) {
        document.getElementById('settingsError').textContent = '자극 유형은 최소 2개, 최대 4개 선택해야 합니다.';
        document.getElementById('settingsError').style.display = 'block';
        return;
    }

    // gameState에 설정 적용
    gameState.stimulusTypes = newStimulusTypes;
    gameState.imageSourceUrl = document.getElementById('imageSourceUrl').value;
    gameState.resultImageUrl = document.getElementById('resultImageUrl').value;
    gameState.sceneKey = document.getElementById('sceneKey').value.toUpperCase();
    gameState.locationKey = document.getElementById('locationKey').value.toUpperCase();
    gameState.soundKey = document.getElementById('soundKey').value.toUpperCase();
    gameState.colorKey = document.getElementById('colorKey').value.toUpperCase();
    gameState.soundSource = document.getElementById('soundSourceSelect').value;
    gameState.soundSourceUrl = document.getElementById('soundSourceUrl').value;

    // 인디케이터 위치 설정
    sceneIndicator.style.left = `${document.getElementById('button1Left').value}px`;
    sceneIndicator.style.bottom = `${document.getElementById('button1Bottom').value}px`;
    soundIndicator.style.left = `${document.getElementById('button2Left').value}px`;
    soundIndicator.style.bottom = `${document.getElementById('button2Bottom').value}px`;
    locationIndicator.style.right = `${document.getElementById('button3Right').value}px`;
    locationIndicator.style.bottom = `${document.getElementById('button3Bottom').value}px`;
    colorIndicator.style.right = `${document.getElementById('button4Right').value}px`;
    colorIndicator.style.bottom = `${document.getElementById('button4Bottom').value}px`;

    const bgColor = document.getElementById('buttonBgColor').value;
    const bgOpacity = document.getElementById('buttonBgOpacity').value;
    const textColor = document.getElementById('buttonTextColor').value;
    const textOpacity = document.getElementById('buttonTextOpacity').value;
    const width = document.getElementById('buttonWidth').value;
    const height = document.getElementById('buttonHeight').value;

    [sceneIndicator, soundIndicator, locationIndicator, colorIndicator].forEach(indicator => {
        indicator.style.backgroundColor = hexToRgba(bgColor, bgOpacity);
        indicator.style.color = hexToRgba(textColor, textOpacity);
        indicator.style.width = `${width}px`;
        indicator.style.height = `${height}px`;
    });

    // localStorage에 설정 저장
    localStorage.setItem('stimulusTypes', JSON.stringify(gameState.stimulusTypes));
    localStorage.setItem('imageSourceUrl', gameState.imageSourceUrl);
    localStorage.setItem('resultImageUrl', gameState.resultImageUrl);
    localStorage.setItem('sceneKey', gameState.sceneKey);
    localStorage.setItem('locationKey', gameState.locationKey);
    localStorage.setItem('soundKey', gameState.soundKey);
    localStorage.setItem('colorKey', gameState.colorKey);
    localStorage.setItem('soundSource', gameState.soundSource);
    localStorage.setItem('soundSourceUrl', gameState.soundSourceUrl);
    // 인디케이터 위치 저장
    localStorage.setItem('sceneIndicatorPos', JSON.stringify({ left: sceneIndicator.style.left, bottom: sceneIndicator.style.bottom }));
    localStorage.setItem('soundIndicatorPos', JSON.stringify({ left: soundIndicator.style.left, bottom: soundIndicator.style.bottom }));
    localStorage.setItem('locationIndicatorPos', JSON.stringify({ right: locationIndicator.style.right, bottom: locationIndicator.style.bottom }));
    localStorage.setItem('colorIndicatorPos', JSON.stringify({ right: colorIndicator.style.right, bottom: colorIndicator.style.bottom }));
    localStorage.setItem('buttonStyles', JSON.stringify({
        bgColor: bgColor,
        bgOpacity: bgOpacity,
        textColor: textColor,
        textOpacity: textOpacity,
        width: width,
        height: height
    }));



// 개발자 옵션 적용
    gameState.stimuliPerBlock = parseInt(document.getElementById('stimuliPerBlock').value) || 30;
    gameState.stimulusDuration = parseInt(document.getElementById('stimulusDuration').value) || 1000, 400;
    gameState.stimulusInterval = parseInt(document.getElementById('stimulusInterval').value) || 2500, 400;

    // localStorage에 저장
    localStorage.setItem('stimuliPerBlock', gameState.stimuliPerBlock);
    localStorage.setItem('stimulusDuration', gameState.stimulusDuration);
    localStorage.setItem('stimulusInterval', gameState.stimulusInterval);    
    document.getElementById('settingsError').style.display = 'none';
    loadImageTextures();
}

function hexToRgba(hex, opacity) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function loadSettings() {
    // N백 레벨 불러오기
    const savedNBackLevel = localStorage.getItem('nBackLevel');
    if (savedNBackLevel) {
        gameState.nBackLevel = parseInt(savedNBackLevel);
        document.getElementById('nBackLevel').textContent = gameState.nBackLevel;
        document.getElementById('customLevel').value = gameState.nBackLevel;
    }



    // 게임 횟수 및 날짜 불러오기
    const lastGameDate = localStorage.getItem('lastGameDate');
    const today = new Date().toDateString();
    if (lastGameDate !== today) {
        gameState.totalGamesToday = 0;
    } else {
        const savedTotalGames = localStorage.getItem('totalGamesToday');
        gameState.totalGamesToday = savedTotalGames ? parseInt(savedTotalGames) : 0;
    }
    document.getElementById('totalGamesTodayCountValue').textContent = gameState.totalGamesToday;

    // 설정 불러오기 (기본값 제공)
    gameState.stimulusTypes = JSON.parse(localStorage.getItem('stimulusTypes')) || ['scene', 'location'];
    gameState.imageSourceUrl = localStorage.getItem('imageSourceUrl') || 'images/';
    gameState.resultImageUrl = localStorage.getItem('resultImageUrl') || '';
    gameState.sceneKey = localStorage.getItem('sceneKey') || 'S';
    gameState.locationKey = localStorage.getItem('locationKey') || 'A';
    gameState.soundKey = localStorage.getItem('soundKey') || 'L';
    gameState.colorKey = localStorage.getItem('colorKey') || 'K';
    gameState.soundSource = localStorage.getItem('soundSource') || 'pianoTones';
    gameState.soundSourceUrl = localStorage.getItem('soundSourceUrl') || 'sounds/';

    // 인디케이터 위치 불러오기
    const scenePos = JSON.parse(localStorage.getItem('sceneIndicatorPos')) || { left: '30px', bottom: '40px' };
    const soundPos = JSON.parse(localStorage.getItem('soundIndicatorPos')) || { left: '130px', bottom: '40px' };
    const locationPos = JSON.parse(localStorage.getItem('locationIndicatorPos')) || { right: '130px', bottom: '40px' };
    const colorPos = JSON.parse(localStorage.getItem('colorIndicatorPos')) || { right: '30px', bottom: '40px' };
    sceneIndicator.style.left = scenePos.left;
    sceneIndicator.style.bottom = scenePos.bottom;
    soundIndicator.style.left = soundPos.left;
    soundIndicator.style.bottom = soundPos.bottom;
    locationIndicator.style.right = locationPos.right;
    locationIndicator.style.bottom = locationPos.bottom;
    colorIndicator.style.right = colorPos.right;
    colorIndicator.style.bottom = colorPos.bottom;

    // 버튼 스타일 불러오기
    const buttonStyles = JSON.parse(localStorage.getItem('buttonStyles')) || {
        bgColor: '#ffffff',
        bgOpacity: 0.1,
        textColor: '#ffffff',
        textOpacity: 0.0,
        width: '80',
        height: '80'
    };
    [sceneIndicator, soundIndicator, locationIndicator, colorIndicator].forEach(indicator => {
        indicator.style.backgroundColor = hexToRgba(buttonStyles.bgColor, buttonStyles.bgOpacity);
        indicator.style.color = hexToRgba(buttonStyles.textColor, buttonStyles.textOpacity);
        indicator.style.width = `${buttonStyles.width}px`;
        indicator.style.height = `${buttonStyles.height}px`;
    });

gameState.stimuliPerBlock = parseInt(localStorage.getItem('stimuliPerBlock')) || 30;
    gameState.stimulusDuration = parseInt(localStorage.getItem('stimulusDuration')) || 1000;
    gameState.stimulusInterval = parseInt(localStorage.getItem('stimulusInterval')) || 2500;

    // 설정 UI 동기화
    populateSettings();
}


window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

loadImageTextures();
loadSettings();
animate();
