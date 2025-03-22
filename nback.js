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
    isFullscreen: false, // 🖼️ 전체화면 상태 추가
    targetCountGoals: {},
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
    console.log("resetIndicators() - Resetting all indicators, previous states:", {
        scene: sceneIndicator.classList.value,
        location: locationIndicator.classList.value,
        sound: soundIndicator.classList.value,
        color: colorIndicator.classList.value
    });
    sceneIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    locationIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    soundIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    colorIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    gameState.sceneTargetProcessed = false;
    gameState.locationTargetProcessed = false;
    gameState.soundTargetProcessed = false;
    gameState.colorTargetProcessed = false;
    gameState.canRespond = true;
    console.log("resetIndicators() - Reset complete, canRespond:", gameState.canRespond);
}


function showIndicatorFeedback(indicatorId, isCorrect) {
    console.log(`showIndicatorFeedback() - 적용: ${indicatorId}, 정답 여부: ${isCorrect}`);
    const indicator = document.getElementById(indicatorId);
    if (!indicator) {
        console.error(`showIndicatorFeedback() - Indicator with ID '${indicatorId}' not found in DOM.`);
        return;
    }
    console.log(`showIndicatorFeedback() - Indicator found: ${indicatorId}, applying classes`);
    indicator.classList.remove('correct', 'incorrect');
    indicator.classList.add(isCorrect ? 'correct' : 'incorrect');
}


function showEarlyResponseFeedback(indicatorId) {
    console.log(`showEarlyResponseFeedback() - 적용: ${indicatorId}`);
    const indicator = document.getElementById(indicatorId);
    if (!indicator) {
        console.error(`showEarlyResponseFeedback() - Indicator with ID '${indicatorId}' not found in DOM.`);
        return;
    }
    console.log(`showEarlyResponseFeedback() - Indicator found: ${indicatorId}, marking as early`);
    indicator.classList.add('early');
}


function showMissedTargetFeedback(indicatorId) {
    const indicator = typeof indicatorId === 'string' ? document.getElementById(indicatorId) : indicatorId;
    if (!indicator) {
        console.error(`showMissedTargetFeedback() - Indicator with ID '${indicatorId}' not found in DOM.`);
        return;
    }
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
        // 디버깅 로그: 랜덤 간섭 타입 선택
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
                // 디버깅 로그: Previous 간섭 (이미지)
                console.log("Interference applied (previous): image");
            } else if (type < 0.5) {
                interferedPanelIndex = previousPanelIndex;
                // 디버깅 로그: Previous 간섭 (위치)
                console.log("Interference applied (previous): location");
            } else if (type < 0.75) {
                interferedSoundIndex = previousSoundIndex;
                // 디버깅 로그: Previous 간섭 (소리)
                console.log("Interference applied (previous): sound");
            } else {
                interferedColorIndex = previousColorIndex;
                // 디버깅 로그: Previous 간섭 (색상)
                console.log("Interference applied (previous): color");
            }
        } else if (currentInterferenceType === "cyclic" && gameState.currentStimulus >= gameState.cyclicInterferenceNBackLevel) {
            const cyclicNBackLevel = gameState.cyclicInterferenceNBackLevel;
            const cyclicImageIndex = gameState.sceneHistory[gameState.currentStimulus - cyclicNBackLevel];
            const cyclicPanelIndex = gameState.locationHistory[gameState.currentStimulus - cyclicNBackLevel];
            const cyclicSoundIndex = gameState.soundHistory[gameState.currentStimulus - cyclicNBackLevel];
            const cyclicColorIndex = gameState.colorHistory[gameState.currentStimulus - cyclicNBackLevel];
            const type = Math.random();
            if (type < 0.25) {
                interferedImageIndex = cyclicImageIndex;
                // 디버깅 로그: Cyclic 간섭 (이미지)
                console.log("Interference applied (cyclic, N=" + cyclicNBackLevel + "): image");
            } else if (type < 0.5) {
                interferedPanelIndex = cyclicPanelIndex;
                // 디버깅 로그: Cyclic 간섭 (위치)
                console.log("Interference applied (cyclic, N=" + cyclicNBackLevel + "): location");
            } else if (type < 0.75) {
                interferedSoundIndex = cyclicSoundIndex;
                // 디버깅 로그: Cyclic 간섭 (소리)
                console.log("Interference applied (cyclic, N=" + cyclicNBackLevel + "): sound");
            } else {
                interferedColorIndex = cyclicColorIndex;
                // 디버깅 로그: Cyclic 간섭 (색상)
                console.log("Interference applied (cyclic, N=" + cyclicNBackLevel + "): color");
            }
        } else if (currentInterferenceType === "next" && gameState.nextStimulusInfo) {
            const type = Math.random();
            if (type < 0.25) {
                interferedImageIndex = gameState.nextStimulusInfo.imageIndex;
                // 디버깅 로그: Next 간섭 (이미지)
                console.log("Interference applied (next): image");
            } else if (type < 0.5) {
                interferedPanelIndex = gameState.nextStimulusInfo.panelIndex;
                // 디버깅 로그: Next 간섭 (위치)
                console.log("Interference applied (next): location");
            } else if (type < 0.75) {
                interferedSoundIndex = gameState.nextStimulusInfo.soundIndex;
                // 디버깅 로그: Next 간섭 (소리)
                console.log("Interference applied (next): sound");
            } else {
                interferedColorIndex = gameState.nextStimulusInfo.colorIndex;
                // 디버깅 로그: Next 간섭 (색상)
                console.log("Interference applied (next): color");
            }
        }
        return { imageIndex: interferedImageIndex, panelIndex: interferedPanelIndex, soundIndex: interferedSoundIndex, colorIndex: interferedColorIndex };
    }
    return { imageIndex: currentImageIndex, panelIndex: currentPanelIndex, soundIndex: currentSoundIndex, colorIndex: currentColorIndex };
}



function playSound(soundIndex) {
    stopSound(); // 기존 소리 중지
    if (!gameState.stimulusTypes.includes("sound")) {
        console.log("playSound() - Sound stimulus not enabled, skipping.");
        return;
    }
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
                console.log("playSound() - Piano tone:", note, frequency, "Hz, duration: 1000ms");
            } else {
                console.error("playSound() - Invalid piano note:", note);
            }
        } else {
            console.error("playSound() - Invalid pianoTones index:", soundIndex, "Max:", gameState.pianoTones.length - 1);
        }
    } else if (gameState.soundSource === "soundFiles") {
        if (soundIndex >= 0 && soundIndex < gameState.soundFiles.length) {
            const baseUrl = gameState.soundSourceUrl || "sounds/";
            const soundUrl = `${baseUrl}${gameState.soundFiles[soundIndex].split('/').pop()}`;
            console.log("playSound() - Loading sound file:", soundUrl);
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
                    console.log("playSound() - Sound file playing:", soundUrl);
                },
                function (xhr) {
                    console.log("playSound() - Loading progress:", (xhr.loaded / xhr.total * 100) + '%');
                },
                function (err) {
                    console.error("playSound() - Error loading sound:", soundUrl, err);
                }
            );
        } else {
            console.error("playSound() - Invalid soundFiles index:", soundIndex, "Max:", gameState.soundFiles.length - 1);
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
                    console.log("stopSound() - Piano tone stopped with fade-out (200ms)");
                }
            }, 200);
        } else {
            console.log("stopSound() - No piano tone to stop.");
        }
    } else {
        if (gameState.soundStimulus && gameState.soundStimulus.isPlaying) {
            gameState.soundStimulus.stop();
            gameState.soundStimulus = null;
            console.log("stopSound() - Sound file stopped");
        } else {
            console.log("stopSound() - No sound file playing to stop.");
        }
    }
}

function clearAllSounds() {
    stopSound();
    console.log("clearAllSounds() - All sounds cleared.");
}


function showStimulus(imageIndex, panelIndex, soundIndex, colorIndex) {
    if (gameState.isPaused) return; // ⏸️ paused 상태일 때 stimuli 표시 방지
    console.log("showStimulus() - Starting: imageIndex:", imageIndex, "panelIndex:", panelIndex, "soundIndex:", soundIndex, "colorIndex:", colorIndex);
    resetIndicators();
    const panel = panels[panelIndex];
    console.log("showStimulus() - Before interference:", { imageIndex, panelIndex, soundIndex, colorIndex });

    const interferenceResult = introduceInterference(imageIndex, panelIndex, soundIndex, colorIndex);
    imageIndex = interferenceResult.imageIndex;
    panelIndex = interferenceResult.panelIndex;
    soundIndex = interferenceResult.soundIndex;
    colorIndex = interferenceResult.colorIndex;
    console.log("showStimulus() - After interference:", { imageIndex, panelIndex, soundIndex, colorIndex });

    createStimulusImage(imageIndex, panel, colorIndex);
    if (gameState.stimulusTypes.includes("sound")) {
        playSound(soundIndex);
    }

    console.log("showStimulus() - Presented stimulus:", imageIndex, panelIndex, soundIndex, colorIndex);
    gameState.sceneHistory.push(imageIndex);
    gameState.locationHistory.push(panelIndex);
    gameState.soundHistory.push(soundIndex);
    gameState.colorHistory.push(colorIndex);

    // 미리 생성된 타겟 여부 사용
    const stimulus = gameState.stimulusSequence[gameState.currentStimulus];
    gameState.currentIsSceneTarget = stimulus.isSceneTarget;
    gameState.currentIsLocationTarget = stimulus.isLocationTarget;
    gameState.currentIsSoundTarget = stimulus.isSoundTarget;
    gameState.currentIsColorTarget = stimulus.isColorTarget;

    if (gameState.currentStimulus >= gameState.nBackLevel) {
        if (gameState.currentIsSceneTarget) gameState.sceneTargets++;
        if (gameState.currentIsLocationTarget) gameState.locationTargets++;
        if (gameState.currentIsSoundTarget) gameState.soundTargets++;
        if (gameState.currentIsColorTarget) gameState.colorTargets++;
        if (gameState.currentIsSceneTarget && gameState.currentIsLocationTarget && gameState.currentIsSoundTarget && gameState.currentIsColorTarget) {
            gameState.bothTargets++;
            console.log("showStimulus() - Both targets detected, bothTargets:", gameState.bothTargets);
        }
        console.log("showStimulus() - Target check:", {
            scene: gameState.currentIsSceneTarget,
            location: gameState.currentIsLocationTarget,
            sound: gameState.currentIsSoundTarget,
            color: gameState.currentIsColorTarget,
            both: gameState.bothTargets
        });
    } else {
        console.log("showStimulus() - Initial stimulus, no targets set");
    }

    gameState.currentStimulus++;

    if (gameState.currentStimulus < gameState.stimuliPerBlock) {
        gameState.currentTimer = setTimeout(() => {
            console.log("Timer - Clearing stimuli and stopping sound, currentStimulus:", gameState.currentStimulus);
            clearAllStimuli();
            stopSound();
            gameState.inResponseWindow = true;
            gameState.canRespond = true;
            gameState.responseWindowTimer = setTimeout(() => {
                console.log("Timer - Response window closed, currentStimulus:", gameState.currentStimulus);
                gameState.inResponseWindow = false;
                if (gameState.stimulusTypes.includes("scene") && !gameState.sceneTargetProcessed && gameState.currentIsSceneTarget) {
                    showMissedTargetFeedback(sceneIndicator);
                    gameState.sceneErrors++;
                    console.log("Timer - Missed scene target, sceneErrors:", gameState.sceneErrors);
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
            console.log("Timer - Final stimulus cleared, ending block");
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

function selectIndexAvoidingRecent(recentIndices, maxRange, recentLimit) {
    // 최근 인덱스가 recentLimit을 초과하면 오래된 항목 제거
    while (recentIndices.length >= recentLimit) {
        recentIndices.shift();
    }

    // 사용 가능한 인덱스 배열 생성
    const availableIndices = [];
    for (let i = 0; i < maxRange; i++) {
        if (!recentIndices.includes(i)) {
            availableIndices.push(i);
        }
    }

    // 디버깅 로그: 사용 가능한 인덱스 확인
    console.log("selectIndexAvoidingRecent() - Available indices:", availableIndices, 
                "Recent indices:", recentIndices, "Max range:", maxRange, "Recent limit:", recentLimit);

    // 사용 가능한 인덱스가 없으면 기본값 반환 (0)
    if (availableIndices.length === 0) {
        console.warn("selectIndexAvoidingRecent() - No available indices, returning 0");
        return 0;
    }

    // 무작위로 인덱스 선택
    const selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    console.log("selectIndexAvoidingRecent() - Selected index:", selectedIndex);

    return selectedIndex;
}


function updateRecentIndices(type, index, n) {
    const historyKey = `${type}History`;
    const recentKey = `recent${type.charAt(0).toUpperCase() + type.slice(1)}Indices`;
    const maxRecent = n + 1;

    gameState[historyKey].push(index);
    gameState[recentKey].push(index);

    if (gameState[recentKey].length > maxRecent) {
        const removedIndex = gameState[recentKey].shift();
        console.log(`updateRecentIndices() - Updated ${type}: Removed old index ${removedIndex}, Added ${index}`);
    } else {
        console.log(`updateRecentIndices() - Updated ${type}: Added ${index}`);
    }
}


function generateNextStimulus() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    console.log("generateNextStimulus() - Starting, currentStimulus:", gameState.currentStimulus);

    if (!gameState.stimulusSequence || gameState.currentStimulus >= gameState.stimulusSequence.length) {
        console.error("generateNextStimulus() - Stimulus sequence is invalid or index out of bounds", {
            stimulusSequence: gameState.stimulusSequence,
            currentStimulus: gameState.currentStimulus
        });
        endBlock();
        return;
    }

    const stimulus = gameState.stimulusSequence[gameState.currentStimulus];
    if (!stimulus || typeof stimulus !== 'object') {
        console.error("generateNextStimulus() - Invalid stimulus object at index:", gameState.currentStimulus, "stimulus:", stimulus);
        endBlock();
        return;
    }

    // 속성 확인 및 기본값 설정
    const { 
        imageIndex = 0, 
        panelIndex = 0, 
        soundIndex = 0, 
        colorIndex = 0, 
        targetType = "non-target" 
    } = stimulus;

    console.log("generateNextStimulus() - Stimulus data:", { imageIndex, panelIndex, soundIndex, colorIndex, targetType });

    gameState.nextStimulusInfo = { imageIndex, panelIndex, soundIndex, colorIndex, targetType };
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
    if (gameState.isPaused) return;
    if (e.key === 'Escape') {
        showTitleScreen();
        return;
    }
    if (!gameState.isPlaying) {
        if (e.code === 'Space') {
            startBlock(); // 결과 화면에서도 게임 시작
        }
        return;
    }
    if (gameState.stimulusTypes.includes("scene") && e.key.toUpperCase() === gameState.sceneKey && !gameState.sceneTargetProcessed && gameState.canRespond) {
        console.log("handleKeyPress() - Scene key pressed:", e.key, "calling handleSceneResponse()");
        handleSceneResponse();
    }
    if (gameState.stimulusTypes.includes("location") && e.key.toUpperCase() === gameState.locationKey && !gameState.locationTargetProcessed && gameState.canRespond) {
        console.log("handleKeyPress() - Location key pressed:", e.key, "calling handleLocationResponse()");
        handleLocationResponse();
    }
    if (gameState.stimulusTypes.includes("sound") && e.key.toUpperCase() === gameState.soundKey && !gameState.soundTargetProcessed && gameState.canRespond) {
        console.log("handleKeyPress() - Sound key pressed:", e.key, "calling handleSoundResponse()");
        handleSoundResponse();
    }
    if (gameState.stimulusTypes.includes("color") && e.key.toUpperCase() === gameState.colorKey && !gameState.colorTargetProcessed && gameState.canRespond) {
        console.log("handleKeyPress() - Color key pressed:", e.key, "calling handleColorResponse()");
        handleColorResponse();
    }
}




function handleSceneResponse() {
    if (gameState.isPaused) return; // ⏸️ paused 상태일 때 반응 무시
    console.log("handleSceneResponse() - Before processing: canRespond:", gameState.canRespond, "sceneTargetProcessed:", gameState.sceneTargetProcessed, "currentStimulus:", gameState.currentStimulus);
    gameState.sceneTargetProcessed = true;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('scene-indicator');
        console.log("handleSceneResponse() - Early response, stimulus:", gameState.currentStimulus, "nBackLevel:", gameState.nBackLevel);
        return;
    }
    gameState.sceneResponses++;
    const isCorrect = gameState.currentIsSceneTarget;
    showIndicatorFeedback('scene-indicator', isCorrect);
    if (!isCorrect) {
        gameState.sceneErrors++;
        console.log("handleSceneResponse() - Scene error, sceneErrors:", gameState.sceneErrors, "isCorrect:", isCorrect);
    } else {
        console.log("handleSceneResponse() - Correct scene response, isCorrect:", isCorrect);
    }
    console.log("handleSceneResponse() - After processing: sceneResponses:", gameState.sceneResponses, "sceneTargetProcessed:", gameState.sceneTargetProcessed);
}

function handleLocationResponse() {
    if (gameState.isPaused) return; // ⏸️ paused 상태일 때 반응 무시
    gameState.locationTargetProcessed = true;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('location-indicator'); // 문자열 ID 전달
        console.log(`handleLocationResponse() - Early response detected, stimulus: ${gameState.currentStimulus}`);
        return;
    }
    gameState.locationResponses++;
    const isCorrect = gameState.currentIsLocationTarget;
    showIndicatorFeedback('location-indicator', isCorrect); // 문자열 ID 전달
    if (!isCorrect) {
        gameState.locationErrors++;
        console.log(`handleLocationResponse() - Location error, locationErrors: ${gameState.locationErrors}`);
    } else {
        console.log(`handleLocationResponse() - Correct location response, isCorrect: ${isCorrect}`);
    }
}


function handleSoundResponse() {
    if (gameState.isPaused) return; // ⏸️ paused 상태일 때 반응 무시
    gameState.soundTargetProcessed = true;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('sound-indicator');
        console.log(`handleSoundResponse() - Early response detected, stimulus: ${gameState.currentStimulus}`);
        return;
    }
    gameState.soundResponses++;
    const isCorrect = gameState.currentIsSoundTarget;
    showIndicatorFeedback('sound-indicator', isCorrect);
    if (!isCorrect) {
        gameState.soundErrors++;
        console.log(`handleSoundResponse() - Sound error, soundErrors: ${gameState.soundErrors}`);
    } else {
        console.log(`handleSoundResponse() - Correct sound response, isCorrect: ${isCorrect}`);
    }
}

function handleColorResponse() {
    if (gameState.isPaused) return; // ⏸️ paused 상태일 때 반응 무시
    gameState.colorTargetProcessed = true;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('color-indicator'); // 문자열 ID로 수정
        return;
    }
    gameState.colorResponses++;
    const isCorrect = gameState.currentIsColorTarget;
    showIndicatorFeedback('color-indicator', isCorrect); // 문자열 ID로 수정
    if (!isCorrect) {
        gameState.colorErrors++;
        console.log("handleColorResponse() - Color error, colorErrors:", gameState.colorErrors);
    }
}



function setTargetGoal(type, value) {
    if (!Number.isInteger(value) || value <= 0) {
        console.error(`Invalid target goal for ${type}: ${value}`);
        return;
    }
    gameState.targetCountGoals[type] = value;
    console.log(`Set target goal for ${type} to ${value}`); // 디버깅 로그 추가
}




function startBlock() {
    console.log("startBlock() - Starting new block at timestamp:", Date.now());
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.currentStimulus = 0;
    gameState.sceneTargets = 0;
    gameState.locationTargets = 0;
    gameState.soundTargets = 0;
    gameState.colorTargets = 0;
    gameState.bothTargets = 0;
    gameState.sceneErrors = 0;
    gameState.locationErrors = 0;
    gameState.soundErrors = 0;
    gameState.colorErrors = 0;
    gameState.sceneHistory = [];
    gameState.locationHistory = [];
    gameState.soundHistory = [];
    gameState.colorHistory = [];
    gameState.recentSceneIndices = [];
    gameState.recentLocationIndices = [];
    gameState.recentSoundIndices = [];
    gameState.recentColorIndices = [];
    gameState.recentTargetTypes = [];
    gameState.recentInterferenceCount = 0;

    // 타겟 목표 설정
    setTargetGoal("scene", 6);
    setTargetGoal("location", 6);
    setTargetGoal("sound", 3);
    setTargetGoal("color", 6);

    // 자극 시퀀스 생성
    gameState.stimulusSequence = generateStimulusSequence();

    // UI 전환
    console.log("startBlock() - Checking DOM elements before UI transition");
    const titleScreen = document.getElementById('titleScreen');
    const gameScreen = document.getElementById('gameScreen');
    const blockCount = document.getElementById('blockCount');

    if (!titleScreen || !gameScreen || !blockCount) {
        console.error("startBlock() - Missing critical UI elements:", {
            titleScreen: titleScreen ? "Found" : "Missing",
            gameScreen: gameScreen ? "Found" : "Missing",
            blockCount: blockCount ? "Found" : "Missing"
        });
        return;
    }

    titleScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    blockCount.textContent = gameState.currentBlock;
    blockCount.style.display = 'none';

    document.getElementById('totalGamesTodayCountValue').textContent = gameState.totalGamesToday;

    // 인디케이터 표시
    sceneIndicator.style.display = gameState.stimulusTypes.includes("scene") ? 'flex' : 'none';
    soundIndicator.style.display = gameState.stimulusTypes.includes("sound") ? 'flex' : 'none';
    locationIndicator.style.display = gameState.stimulusTypes.includes("location") ? 'flex' : 'none';
    colorIndicator.style.display = gameState.stimulusTypes.includes("color") ? 'flex' : 'none';

    generateNextStimulus();
}









function generateStimulusSequence() {
    console.log("generateStimulusSequence() - Generating stimulus sequence for block");
    const sequence = [];
    const recentLimit = gameState.nBackLevel * 2;
    const maxConsecutiveTargets = 2;
    const maxConsecutiveInterference = 1;

    // 타겟 목표 설정
    gameState.targetCountGoals = { scene: 5, location: 5, sound: 3, color: 5 };
    let sceneTargets = 0;
    let locationTargets = 0;
    let soundTargets = 0;
    let colorTargets = 0;
    let bothTargets = 0;
    const recentTargetTypes = [];
    let recentInterferenceCount = 0;

    // 초기 자극 (nBackLevel만큼 타겟 없이 생성)
    for (let i = 0; i < gameState.nBackLevel; i++) {
        const imageIndex = selectIndexAvoidingRecent(gameState.recentSceneIndices || [], imageTextures.length, recentLimit);
        const panelIndex = selectIndexAvoidingRecent(gameState.recentLocationIndices || [], panels.length, recentLimit);
        const soundIndex = selectIndexAvoidingRecent(gameState.recentSoundIndices || [], gameState.soundSource === "soundFiles" ? gameState.soundFiles.length : gameState.pianoTones.length, recentLimit);
        const colorIndex = selectIndexAvoidingRecent(gameState.recentColorIndices || [], distinctColors.length, recentLimit);

        updateRecentIndices("scene", imageIndex, recentLimit);
        updateRecentIndices("location", panelIndex, recentLimit);
        updateRecentIndices("sound", soundIndex, recentLimit);
        updateRecentIndices("color", colorIndex, recentLimit);

        sequence.push({
            imageIndex,
            panelIndex,
            soundIndex,
            colorIndex,
            targetType: "initial",
            isSceneTarget: false,
            isLocationTarget: false,
            isSoundTarget: false,
            isColorTarget: false
        });
        recentTargetTypes.push("initial");
    }

    // 나머지 자극 생성
    for (let i = gameState.nBackLevel; i < gameState.stimuliPerBlock; i++) {
        let shouldBeSceneTarget = false;
        let shouldBeLocationTarget = false;
        let shouldBeSoundTarget = false;
        let shouldBeColorTarget = false;

        // 남은 타겟 개수 계산
        const remainingStimuli = gameState.stimuliPerBlock - i;
        const weights = [
            sceneTargets < gameState.targetCountGoals.scene ? (gameState.targetCountGoals.scene - sceneTargets) / remainingStimuli : 0,
            locationTargets < gameState.targetCountGoals.location ? (gameState.targetCountGoals.location - locationTargets) / remainingStimuli : 0,
            soundTargets < gameState.targetCountGoals.sound ? (gameState.targetCountGoals.sound - soundTargets) / remainingStimuli : 0,
            colorTargets < gameState.targetCountGoals.color ? (gameState.targetCountGoals.color - colorTargets) / remainingStimuli : 0
        ];
        const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;

        // 타겟 생성 결정 (여러 타겟 동시 발생 허용)
        if (gameState.stimulusTypes.includes("scene") && sceneTargets < gameState.targetCountGoals.scene) {
            shouldBeSceneTarget = totalWeight > 0 && Math.random() < (weights[0] / totalWeight);
        }
        if (gameState.stimulusTypes.includes("location") && locationTargets < gameState.targetCountGoals.location) {
            shouldBeLocationTarget = totalWeight > 0 && Math.random() < (weights[1] / totalWeight);
        }
        if (gameState.stimulusTypes.includes("sound") && soundTargets < gameState.targetCountGoals.sound) {
            shouldBeSoundTarget = totalWeight > 0 && Math.random() < (weights[2] / totalWeight);
        }
        if (gameState.stimulusTypes.includes("color") && colorTargets < gameState.targetCountGoals.color) {
            shouldBeColorTarget = totalWeight > 0 && Math.random() < (weights[3] / totalWeight);
        }

        // 연속 타겟 방지
        if (recentTargetTypes.length >= maxConsecutiveTargets) {
            const lastTargets = recentTargetTypes.slice(-maxConsecutiveTargets);
            if (lastTargets.every(type => type === "scene")) shouldBeSceneTarget = false;
            if (lastTargets.every(type => type === "location")) shouldBeLocationTarget = false;
            if (lastTargets.every(type => type === "sound")) shouldBeSoundTarget = false;
            if (lastTargets.every(type => type === "color")) shouldBeColorTarget = false;
        }

        let imageIndex, panelIndex, soundIndex, colorIndex;
        let targetType = "none";

        // 타겟 자극 생성
        if (shouldBeSceneTarget) {
            imageIndex = sequence[i - gameState.nBackLevel].imageIndex;
            targetType = targetType === "none" ? "scene" : "multiple";
            recentTargetTypes.push("scene");
            sceneTargets++;
        } else {
            imageIndex = selectIndexAvoidingRecent(gameState.recentSceneIndices, imageTextures.length, recentLimit);
        }

        if (shouldBeLocationTarget) {
            panelIndex = sequence[i - gameState.nBackLevel].panelIndex;
            targetType = targetType === "none" ? "location" : "multiple";
            recentTargetTypes.push("location");
            locationTargets++;
        } else {
            panelIndex = selectIndexAvoidingRecent(gameState.recentLocationIndices, panels.length, recentLimit);
        }

        if (shouldBeSoundTarget) {
            soundIndex = sequence[i - gameState.nBackLevel].soundIndex;
            targetType = targetType === "none" ? "sound" : "multiple";
            recentTargetTypes.push("sound");
            soundTargets++;
        } else {
            soundIndex = selectIndexAvoidingRecent(gameState.recentSoundIndices, gameState.soundSource === "soundFiles" ? gameState.soundFiles.length : gameState.pianoTones.length, recentLimit);
        }

        if (shouldBeColorTarget) {
            colorIndex = sequence[i - gameState.nBackLevel].colorIndex;
            targetType = targetType === "none" ? "color" : "multiple";
            recentTargetTypes.push("color");
            colorTargets++;
        } else {
            colorIndex = selectIndexAvoidingRecent(gameState.recentColorIndices, distinctColors.length, recentLimit);
        }

        if (targetType === "none") {
            targetType = "non-target";
            recentTargetTypes.push("non-target");
        }

        // 간섭 적용
        const previousWasTarget = targetType !== "non-target";
        let interferenceChance = previousWasTarget ? 0.175 : 0.225;
        if (recentInterferenceCount < maxConsecutiveInterference && Math.random() < interferenceChance) {
            recentInterferenceCount++;
            targetType = "interference";
        } else {
            recentInterferenceCount = 0;
        }

        // 타겟 여부 저장
        const stimulus = {
            imageIndex,
            panelIndex,
            soundIndex,
            colorIndex,
            targetType,
            isSceneTarget: shouldBeSceneTarget,
            isLocationTarget: shouldBeLocationTarget,
            isSoundTarget: shouldBeSoundTarget,
            isColorTarget: shouldBeColorTarget
        };

        // 최근 인덱스 업데이트
        updateRecentIndices("scene", imageIndex, recentLimit);
        updateRecentIndices("location", panelIndex, recentLimit);
        updateRecentIndices("sound", soundIndex, recentLimit);
        updateRecentIndices("color", colorIndex, recentLimit);

        sequence.push(stimulus);
    }

    // 타겟 개수 조정 (목표값에 맞게 강제 조정)
    let adjustedSequence = [...sequence];
    const targetCounts = { scene: sceneTargets, location: locationTargets, sound: soundTargets, color: colorTargets };
    const goals = gameState.targetCountGoals;

    for (const type of ["scene", "location", "sound", "color"]) {
        while (targetCounts[type] < goals[type]) {
            // 비타겟 자극을 타겟으로 변환
            let candidateIndex = gameState.nBackLevel;
            while (candidateIndex < gameState.stimuliPerBlock && (adjustedSequence[candidateIndex].targetType !== "non-target" || adjustedSequence[candidateIndex][`is${type.charAt(0).toUpperCase() + type.slice(1)}Target`])) {
                candidateIndex++;
            }
            if (candidateIndex >= gameState.stimuliPerBlock) break;

            const newStimulus = { ...adjustedSequence[candidateIndex] };
            newStimulus[`is${type.charAt(0).toUpperCase() + type.slice(1)}Target`] = true;
            newStimulus.targetType = type;
            if (type === "scene") newStimulus.imageIndex = adjustedSequence[candidateIndex - gameState.nBackLevel].imageIndex;
            if (type === "location") newStimulus.panelIndex = adjustedSequence[candidateIndex - gameState.nBackLevel].panelIndex;
            if (type === "sound") newStimulus.soundIndex = adjustedSequence[candidateIndex - gameState.nBackLevel].soundIndex;
            if (type === "color") newStimulus.colorIndex = adjustedSequence[candidateIndex - gameState.nBackLevel].colorIndex;
            adjustedSequence[candidateIndex] = newStimulus;
            targetCounts[type]++;
        }

        while (targetCounts[type] > goals[type]) {
            // 타겟 자극을 비타겟으로 변환
            let candidateIndex = gameState.nBackLevel;
            while (candidateIndex < gameState.stimuliPerBlock && !adjustedSequence[candidateIndex][`is${type.charAt(0).toUpperCase() + type.slice(1)}Target`]) {
                candidateIndex++;
            }
            if (candidateIndex >= gameState.stimuliPerBlock) break;

            const newStimulus = { ...adjustedSequence[candidateIndex] };
            newStimulus[`is${type.charAt(0).toUpperCase() + type.slice(1)}Target`] = false;
            newStimulus.targetType = "non-target";
            if (type === "scene") newStimulus.imageIndex = selectIndexAvoidingRecent(gameState.recentSceneIndices, imageTextures.length, recentLimit);
            if (type === "location") newStimulus.panelIndex = selectIndexAvoidingRecent(gameState.recentLocationIndices, panels.length, recentLimit);
            if (type === "sound") newStimulus.soundIndex = selectIndexAvoidingRecent(gameState.recentSoundIndices, gameState.soundSource === "soundFiles" ? gameState.soundFiles.length : gameState.pianoTones.length, recentLimit);
            if (type === "color") newStimulus.colorIndex = selectIndexAvoidingRecent(gameState.recentColorIndices, distinctColors.length, recentLimit);
            adjustedSequence[candidateIndex] = newStimulus;
            targetCounts[type]--;
        }
    }

    // bothTargets 계산
    for (let i = gameState.nBackLevel; i < gameState.stimuliPerBlock; i++) {
        const stimulus = adjustedSequence[i];
        if (stimulus.isSceneTarget && stimulus.isLocationTarget && stimulus.isSoundTarget && stimulus.isColorTarget) {
            bothTargets++;
        }
    }

    console.log("generateStimulusSequence() - Generated sequence:", adjustedSequence);
    console.log("generateStimulusSequence() - Final target counts:", {
        scene: targetCounts.scene,
        location: targetCounts.location,
        sound: targetCounts.sound,
        color: targetCounts.color,
        both: bothTargets
    });

    return adjustedSequence;
}


document.getElementById('toggleDevOptionsBtn').addEventListener('click', () => {
    const devOptions = document.getElementById('devOptions');
    devOptions.style.display = devOptions.style.display === 'none' ? 'block' : 'none';
});

function endBlock() {
    gameState.isPlaying = false;
    gameState.isPaused = false;
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

    // 타겟 목표 달성 여부 체크 (both 포함)
    const unmetGoals = [];
    if (gameState.sceneTargets < gameState.targetCountGoals.scene) unmetGoals.push(`Scene: ${gameState.sceneTargets}/${gameState.targetCountGoals.scene}`);
    if (gameState.locationTargets < gameState.targetCountGoals.location) unmetGoals.push(`Location: ${gameState.locationTargets}/${gameState.targetCountGoals.location}`);
    if (gameState.soundTargets < gameState.targetCountGoals.sound) unmetGoals.push(`Sound: ${gameState.soundTargets}/${gameState.targetCountGoals.sound}`);
    if (gameState.colorTargets < gameState.targetCountGoals.color) unmetGoals.push(`Color: ${gameState.colorTargets}/${gameState.targetCountGoals.color}`);
    if (unmetGoals.length > 0) {
        console.warn("endBlock() - Target goals not fully met:", unmetGoals, "Both targets:", gameState.bothTargets);
    } else {
        console.log("endBlock() - All target goals met:", {
            scene: gameState.sceneTargets,
            location: gameState.locationTargets,
            sound: gameState.soundTargets,
            color: gameState.colorTargets,
            both: gameState.bothTargets
        });
    }

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




function showTitleScreen() {
    gameState.isPlaying = false;
    gameState.isPaused = false; // ⏸️ 타이틀 화면으로 돌아갈 때 paused 상태 해제
    cancelAllTimers();
    clearAllStimuli();
    clearAllSounds();

    const titleScreen = document.getElementById('titleScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultScreen = document.getElementById('resultScreen');
    const pauseScreen = document.getElementById('pauseScreen');

    if (titleScreen) {
        titleScreen.style.display = 'flex';
        console.log("showTitleScreen() - titleScreen displayed");
    } else {
        console.error("showTitleScreen() - titleScreen element not found");
    }
    if (gameScreen) {
        gameScreen.style.display = 'none';
        console.log("showTitleScreen() - gameScreen hidden");
    } else {
        console.error("showTitleScreen() - gameScreen element not found");
    }
    if (resultScreen) {
        resultScreen.style.display = 'none';
        console.log("showTitleScreen() - resultScreen hidden");
    }
    if (pauseScreen) {
        pauseScreen.style.display = 'none'; // ⏸️ 일시정지 화면 숨기기
        console.log("showTitleScreen() - pauseScreen hidden");
    }

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
        startBlock(); // 메인 화면 대신 게임 시작
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
    document.getElementById('buttonTextOpacity').value = 0.2;
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

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded at timestamp:", Date.now());
    console.log("Initial DOM check:", {
        titleScreen: document.getElementById('titleScreen') ? "Found" : "Missing",
        gameScreen: document.getElementById('gameScreen') ? "Found" : "Missing",
        blockCount: document.getElementById('blockCount') ? "Found" : "Missing"
    });
});

window.onload = () => {
    console.log("Window fully loaded (including resources) at timestamp:", Date.now());
};

loadImageTextures();
loadSettings();
animate();
