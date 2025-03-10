const gameState = {
    isPlaying: false,
    nBackLevel: 1,
    currentBlock: 0,
    maxBlocks: 12,
    stimuliPerBlock: 30,
    currentStimulus: 0,
    sceneHistory: [],
    locationHistory: [],
    sceneTargets: 0,
    locationTargets: 0,
    bothTargets: 0,
    sceneResponses: 0,
    locationResponses: 0,
    sceneErrors: 0,
    locationErrors: 0,
    currentTimer: null,
    responseWindowTimer: null,
    sceneTargetProcessed: false,
    locationTargetProcessed: false,
    currentIsSceneTarget: false,
    currentIsLocationTarget: false,
    inResponseWindow: false,
    canRespond: true
};

// --- 커스터마이징 옵션 (사용자 설정 가능 변수) ---
const wallColor = 0x444444;     // 벽 색상 (light gray)
const floorColor = 0x783F04;    // 바닥 색상 (나무 색상)
const panelColor = 0x666666;    // 패널(액자) 색상 (dark gray - 변경됨)
const imageScale = 1.0;         // 이미지 크기 비율 (1.0: 원래 크기, 0.5: 절반 크기)
const randomizeStimulusColor = true; // 게임 시작 시 이미지에 랜덤 색상 입히기 여부 (true: 랜덤 색상 입힘, false: 색상 입히지 않음)
// --- 커스터마이징 옵션 끝 ---

// "좋은" 색상 팔레트 정의 (보기 좋고 구별하기 쉬운 색상들)
const goodColors = [
    0xFF0000, // Red
    0x00FF00, // Green
    0x0000FF, // Blue
    0xFFFF00, // Yellow
    0xFF00FF, // Magenta
    0x00FFFF, // Cyan
    0xFFA500, // Orange
    0x800080, // Purple
];

// 랜덤 색상 생성 함수 (기존 함수 이름 변경)
function generateTrulyRandomColor() {
    const r = Math.random();
    const g = Math.random();
    const b = Math.random();
    return new THREE.Color(r, g, b);
}

// 색상 거리 계산 함수 (RGB 채널별 차이의 합)
function getColorDistance(color1, color2) {
    const rDiff = Math.abs(color1.r - color2.r);
    const gDiff = Math.abs(color1.g - color2.g);
    const bDiff = Math.abs(color1.b - color2.b);
    return rDiff + gDiff + bDiff;
}

// "좋은" 색상 팔레트에서 랜덤 색상 선택 함수 (액자 색상과 유사하지 않도록 보정)
function getRandomColorFromPalette() {
    const panelThreeColor = new THREE.Color(panelColor); // 액자 색상을 Three.Color 객체로 변환
    let selectedColor = null;
    let attempts = 0;
    const maxAttempts = 10; // 최대 시도 횟수 제한 (무한 루프 방지)
    const minColorDistance = 0.5; // 최소 색상 거리 기준 (조절 가능)

    while (attempts < maxAttempts) {
        const randomIndex = Math.floor(Math.random() * goodColors.length);
        selectedColor = new THREE.Color(goodColors[randomIndex]);
        const distance = getColorDistance(selectedColor, panelThreeColor);

        if (distance >= minColorDistance) {
            // 선택된 색상이 액자 색상과 충분히 다르면 반환
            return selectedColor;
        }
        attempts++;
    }

    // 최대 시도 횟수 초과 시, 팔레트에서 그냥 랜덤 색상 반환 (최악의 경우 대비)
    console.warn("Could not find sufficiently different color after", maxAttempts, "attempts. Returning fallback color.");
        return selectedColor || new THREE.Color(goodColors[0]); // 기본 색상 (빨간색) 또는 마지막 시도 색상 반환
    }


// 랜덤 색상 선택 함수 (커스터마이징 옵션에 따라 팔레트 또는 완전 랜덤 색상 사용)
function getRandomColor() {
    if (randomizeStimulusColor) {
        return getRandomColorFromPalette(); // "좋은" 색상 팔레트에서 선택 (액자 색상 고려)
    } else {
        return null; // 색상 입히지 않음 (null 반환)
    }
}


// Three.js Scene, Camera, Renderer 설정
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
        for (let x = -brickWidth/2; x < width + brickWidth/2; x += brickWidth + mortarSize) {
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
        for (let x = -brickWidth/2; x < width + brickWidth/2; x += brickWidth + mortarSize) {
            ctx.fillRect(x + offsetX - 1, y, 2, brickHeight);
        }
    }

    return new THREE.CanvasTexture(canvas);
}

const brickTexture = createBrickTexture();
brickTexture.wrapS = THREE.RepeatWrapping;
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
leftWall.position.set(-roomWidth/2, roomHeight/2, 0);
scene.add(leftWall);

const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
rightWall.position.set(roomWidth/2, roomHeight/2, 0);
scene.add(rightWall);

const backWallGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, 0.1);
const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
backWall.position.set(0, roomHeight/2, -roomDepth/2);
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
    { x: -1.3, y: 1.9, z: -roomDepth/2 + 0.06, rotation: [0, 0, 0] },
    { x: 1.3, y: 1.9, z: -roomDepth/2 + 0.06, rotation: [0, 0, 0] },
    { x: -1.3, y: 0.8, z: -roomDepth/2 + 0.06, rotation: [0, 0, 0] },
    { x: 1.3, y: 0.8, z: -roomDepth/2 + 0.06, rotation: [0, 0, 0] },
    { x: -roomWidth/2 + 0.06, y: 1.9, z: -0.5, rotation: [0, Math.PI/2, 0] },
    { x: -roomWidth/2 + 0.06, y: 0.8, z: -0.5, rotation: [0, Math.PI/2, 0] },
    { x: roomWidth/2 - 0.06, y: 1.9, z: -0.5, rotation: [0, -Math.PI/2, 0] },
    { x: roomWidth/2 - 0.06, y: 0.8, z: -0.5, rotation: [0, -Math.PI/2, 0] },
    
    // 바닥 액자 (2개) - z 좌표 변경, 사용자 시점에 더 가깝게
    { x: -1.3, y: 0.02, z: -0.5, rotation: [-Math.PI/2, 0, 0] }, // 왼쪽 바닥, z: -1.5 -> -0.5 변경
    { x: 1.3, y: 0.02, z: -0.5, rotation: [-Math.PI/2, 0, 0] },  // 오른쪽 바닥, z: -1.5 -> -0.5 변경

    // 천장 액자 (2개) - z 좌표 변경, 사용자 시점에 더 가깝게
    { x: -1.3, y: roomHeight - 0.02, z: -0.5, rotation: [Math.PI/2, 0, 0] }, // 왼쪽 천장, z: -1.5 -> -0.5 변경
    { x: 1.3, y: roomHeight - 0.02, z: -0.5, rotation: [Math.PI/2, 0, 0] }   // 오른쪽 천장, z: -1.5 -> -0.5 변경
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

// 이미지 로더 생성 및 이미지 텍스처 배열 준비
const imageLoader = new THREE.TextureLoader();
const imageTextures = []; // 이미지 텍스처를 저장할 배열

// 랜덤 색상 생성 함수
function getRandomColor() {
    const r = Math.random();
    const g = Math.random();
    const b = Math.random();
    return new THREE.Color(r, g, b);
}

// 이미지 파일 이름 목록 (images 폴더 안의 이미지 파일 이름들을 여기에 추가)
const imageFilenames = [];
for (let i = 1; i <= 101; i++) {
    const filename = `image${String(i).padStart(3, '0')}.png`; // image001.png, image002.png, ... 형식으로 파일 이름 생성
    imageFilenames.push(filename);
}

imageFilenames.forEach((filename) => {
    const texture = imageLoader.load(`images/${filename}`);
    let color = null;
    if (randomizeStimulusColor) {
        color = getRandomColor();
    }
    imageTextures.push({ texture: texture, color: color });
});


// 자극 이미지 생성 함수
function createStimulusImage(imageIndex, panel) {
    clearStimulus(panel);

    const imageGeometry = new THREE.PlaneGeometry(panelWidth * imageScale, panelHeight * imageScale);
    const imageMaterial = new THREE.MeshBasicMaterial({
        map: imageTextures[imageIndex].texture,
        transparent: true,
        blending: THREE.NormalBlending
    });
    if (imageTextures[imageIndex].color) {
        imageMaterial.color = imageTextures[imageIndex].color;
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

function resetIndicators() {
    sceneIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    locationIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    gameState.sceneTargetProcessed = false;
    gameState.locationTargetProcessed = false;
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

function showStimulus(imageIndex, panelIndex) {
    resetIndicators();

    const panel = panels[panelIndex];

    createStimulusImage(imageIndex, panel);

    gameState.sceneHistory.push(imageIndex);
    gameState.locationHistory.push(panelIndex);

    if (gameState.currentStimulus >= gameState.nBackLevel) {
        gameState.currentIsSceneTarget = gameState.sceneHistory[gameState.currentStimulus] ===
                              gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel];
        gameState.currentIsLocationTarget = gameState.locationHistory[gameState.currentStimulus] ===
                                gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel];

        if (gameState.currentIsSceneTarget) gameState.sceneTargets++;
        if (gameState.currentIsLocationTarget) gameState.locationTargets++;
        if (gameState.currentIsSceneTarget && gameState.currentIsLocationTarget) gameState.bothTargets++;
    } else {
        gameState.currentIsSceneTarget = false;
        gameState.currentIsLocationTarget = false;
    }

    gameState.currentStimulus++;

    if (gameState.currentStimulus < gameState.stimuliPerBlock) {
        gameState.currentTimer = setTimeout(() => {
            clearAllStimuli();

            gameState.inResponseWindow = true;
            gameState.responseWindowTimer = setTimeout(() => {
                gameState.inResponseWindow = false;

                if (!gameState.sceneTargetProcessed && gameState.currentIsSceneTarget) {
                    showMissedTargetFeedback(sceneIndicator);
                    gameState.sceneErrors++;
                }

                if (!gameState.locationTargetProcessed && gameState.currentIsLocationTarget) {
                    showMissedTargetFeedback(locationIndicator);
                    gameState.locationErrors++;
                }

                setTimeout(() => {
                    generateNextStimulus();
                }, 500);
            }, 1500);
        }, 1000);
    } else {
        gameState.currentTimer = setTimeout(() => {
            clearAllStimuli();

            gameState.inResponseWindow = true;
            gameState.responseWindowTimer = setTimeout(() => {
                gameState.inResponseWindow = false;

                if (!gameState.sceneTargetProcessed && gameState.currentIsSceneTarget) {
                    showMissedTargetFeedback(sceneIndicator);
                    gameState.sceneErrors++;
                }

                if (!gameState.locationTargetProcessed && gameState.currentIsLocationTarget) {
                    showMissedTargetFeedback(locationIndicator);
                    gameState.locationErrors++;
                }

                setTimeout(() => {
                    endBlock();
                }, 500);
            }, 1500);
        }, 1000);
    }
}

function generateNextStimulus() {
    if (!gameState.isPlaying) return;

    let imageIndex, panelIndex;
    let targetType = 'none'; // Default to no target

    if (gameState.currentStimulus >= gameState.nBackLevel) {
        // Prioritize dual targets first
        if (gameState.bothTargets < 2) {
            targetType = 'both';
            gameState.bothTargets++;
            gameState.sceneTargets++; // Increment scene and location targets as well for dual targets
            gameState.locationTargets++;
        } else if (gameState.sceneTargets < 6) {
            targetType = 'scene';
            gameState.sceneTargets++;
        } else if (gameState.locationTargets < 6) {
            targetType = 'location';
            gameState.locationTargets++;
        }


        switch (targetType) {
            case 'both':
                imageIndex = gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel];
                panelIndex = gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel];
                break;
            case 'scene':
                imageIndex = gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel];
                do {
                    panelIndex = Math.floor(Math.random() * panels.length);
                } while (panelIndex === gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel]);
                break;
            case 'location':
                panelIndex = gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel];
                do {
                    imageIndex = Math.floor(Math.random() * imageTextures.length);
                } while (imageIndex === gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel]);
                break;
            case 'none':
            default:
                imageIndex = Math.floor(Math.random() * imageTextures.length);
                panelIndex = Math.floor(Math.random() * panels.length);
                while (imageIndex === gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel] ||
                panelIndex === gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel]) {
                    if (imageIndex === gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel]) {
                        imageIndex = Math.floor(Math.random() * imageTextures.length);
                    }
                    if (panelIndex === gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel]) {
                        panelIndex = Math.floor(Math.random() * panels.length);
                    }
                }
                break;
        }


    } else { // n-back level is not reached yet, generate random stimuli
        imageIndex = Math.floor(Math.random() * imageTextures.length);
        panelIndex = Math.floor(Math.random() * panels.length);
    }

    showStimulus(imageIndex, panelIndex);
}

function handleKeyPress(e) {
    if (!gameState.isPlaying) {
        if (e.code === 'Space') {
            startBlock();
        }
        return;
    }

    if (e.code === 'KeyS' && !gameState.sceneTargetProcessed && gameState.canRespond) {
        handleSceneResponse();
    }

    if (e.code === 'KeyL' && !gameState.locationTargetProcessed && gameState.canRespond) {
        handleLocationResponse();
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
    }
}

function startBlock() {
    gameState.isPlaying = true;
    gameState.currentStimulus = 0;
    gameState.sceneHistory = [];
    gameState.locationHistory = [];
    gameState.sceneTargets = 0;
    gameState.locationTargets = 0;
    gameState.bothTargets = 0,
    gameState.sceneResponses = 0;
    gameState.locationResponses = 0;
    gameState.sceneErrors = 0;
    gameState.locationErrors = 0;

    document.getElementById('titleScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('scene-indicator').style.display = 'flex';
    document.getElementById('location-indicator').style.display = 'flex';

    setTimeout(() => {
        generateNextStimulus();
    }, 1000);
}

function endBlock() {
    gameState.isPlaying = false;
    gameState.currentBlock++;

    const sceneMisses = gameState.sceneTargets - (gameState.sceneResponses - gameState.sceneErrors);
    const locationMisses = gameState.locationTargets - (gameState.locationResponses - gameState.locationErrors);

    const totalSceneErrors = gameState.sceneErrors + sceneMisses;
    const totalLocationErrors = gameState.locationErrors + locationMisses;

    document.getElementById('sceneErrors').textContent = totalSceneErrors;
    document.getElementById('locationErrors').textContent = totalLocationErrors;
    document.getElementById('resultNLevel').textContent = gameState.nBackLevel;

    let levelChange = '';
    let nextNBackLevel = gameState.nBackLevel;

    if (totalSceneErrors < 3 && totalLocationErrors < 3) {
        nextNBackLevel = gameState.nBackLevel + 1;
        levelChange = '⬆️ Excellent! Level increased!';
    } else if (totalSceneErrors > 5 || totalLocationErrors > 5) {
        nextNBackLevel = Math.max(1, gameState.nBackLevel - 1);
        levelChange = '⬇️ Too many errors. Level decreased.';
    } else {
        levelChange = '➡️ Level remains the same.';
    }

    document.getElementById('levelChange').textContent = levelChange;

    gameState.nBackLevel = nextNBackLevel;
    document.getElementById('nBackLevel').textContent = gameState.nBackLevel;

    document.getElementById('resultScreen').style.display = 'flex';
}

function cancelAllTimers() {
    if (gameState.currentTimer) {
        clearTimeout(gameState.currentTimer);
    }
    if (gameState.responseWindowTimer) {
        clearTimeout(gameState.responseWindowTimer);
    }
}

document.addEventListener('keydown', handleKeyPress);

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

sceneIndicator.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (gameState.isPlaying && !gameState.sceneTargetProcessed && gameState.canRespond) {
        handleSceneResponse();
    }
});

locationIndicator.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (gameState.isPlaying && !gameState.locationTargetProcessed && gameState.canRespond) {
        handleLocationResponse();
    }
});

sceneIndicator.addEventListener('click', function() {
    if (gameState.isPlaying && !gameState.sceneTargetProcessed && gameState.canRespond) {
        handleSceneResponse();
    }
});

locationIndicator.addEventListener('click', function() {
    if (gameState.isPlaying && !gameState.locationTargetProcessed && gameState.canRespond) {
        handleLocationResponse();
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

    customLevelInput.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
    setTimeout(() => {
        customLevelInput.style.backgroundColor = 'rgba(255,255,255,0.9)';
    }, 500);
}


function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
