 // Web Audio Context Initialization
const audioContext = new (window.AudioContext || window.webkitAudioContext)();


let nearMissHistory = []; // 전역 변수: 니얼미스 이벤트(타겟 아닌 자극에 대한 오반응 추적)를 기록하는 배열



const roomWidth = 5;
const roomHeight = 3;
const roomDepth = 5;
const panelDepth = 0.02;

const panelPositions = [
    { x: -1.3, y: 1.9, z: -roomDepth / 2 + 0.06, rotation: [0, 0, 0] },
    { x: 1.3, y: 1.9, z: -roomDepth / 2 + 0.06, rotation: [0, 0, 0] },
    { x: -1.3, y: 0.8, z: -roomDepth / 2 + 0.06, rotation: [0, 0, 0] },
    { x: 1.3, y: 0.8, z: -roomDepth / 2 + 0.06, rotation: [0, 0, 0] },
    { x: -roomWidth / 2 + 0.06, y: 1.9, z: -0.5, rotation: [0, Math.PI / 2, 0] },
    { x: -roomWidth / 2 + 0.06, y: 0.8, z: -0.5, rotation: [0, Math.PI / 2, 0] },
    { x: roomWidth / 2 - 0.06, y: 1.9, z: -0.5, rotation: [0, -Math.PI / 2, 0] },
    { x: roomWidth / 2 - 0.06, y: 0.8, z: -0.5, rotation: [0, -Math.PI / 2, 0] },
    { x: -1.3, y: roomHeight - panelDepth / 2, z: -0.25, rotation: [Math.PI / 2, 0, 0] }, // 천장 1: 천장 면에 평행
    { x: 1.3, y: roomHeight - panelDepth / 2, z: -0.25, rotation: [Math.PI / 2, 0, 0] }, // 천장 2: 천장 면에 평행
    { x: -1.3, y: panelDepth / 2, z: -0.48, rotation: [-Math.PI / 2, 0, 0] }, // 바닥 1: 바닥 면에 평행
    { x: 1.3, y: panelDepth / 2, z: -0.48, rotation: [-Math.PI / 2, 0, 0] }  // 바닥 2: 바닥 면에 평행
];





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
buttonStyles: null, // 버튼 스타일 저장용 속성 추가
accuracyHistory: [], // 정확도 기록 배열 추가
nearMissProbability: 0.3, // 니얼미스 발생 확률 (기본 10%)
    nearMissResponses: 0,     // 니얼미스에 반응한 횟수
    targetMissedErrors: { scene: 0, location: 0, sound: 0, color: 0 }, // 타겟인데 오답 처리된 횟수
    nonTargetFalseResponses: { scene: 0, location: 0, sound: 0, color: 0 }, // 논타겟을 정답으로 오판정한 횟수
    sceneTargets: 0,
    locationTargets: 0,
    soundTargets: 0,
    colorTargets: 0,
    bothTargets: 0,
    canRespondScene: true,      // Scene 응답 가능 여부
    canRespondLocation: true,   // Location 응답 가능 여부
    canRespondSound: true,      // Sound 응답 가능 여부
    canRespondColor: true,      // Color 응답 가능 여부
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
    consecutiveGames: 0,
    totalGamesToday: 0,
    stimulusTypes: [],
    randomizeInterval: false, // 무작위 간격 기능 활성화 여부
    minInterval: 1500,       // 무작위 간격의 최소값 (ms)
    maxInterval: 2500,       // 무작위 간격의 최대값 (ms)
    previousInterval: null,  // 이전 간격 시간 저장
    soundSource: "pianoTones",
    soundFiles: ['sounds/sound001.wav', 'sounds/sound002.wav', 'sounds/sound003.wav', 'sounds/sound004.wav', 'sounds/sound005.wav', 'sounds/sound006.wav', 'sounds/sound007.wav', 'sounds/sound008.wav'],
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
    useCeilingPanels: false,
    useFloorPanels: false,
panelPositionsCustom: panelPositions.map(pos => ({
        x: pos.x,
        y: pos.y,
        z: pos.z,
rotation: pos.rotation || [0, 0, 0]
    }))
};





// Fisher-Yates (Knuth) 셔플 알고리즘
function shuffleArray(array) {
    const shuffled = array.slice(); // 원본 배열 복사
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // 요소 교환
    }
    console.log("shuffleArray() - Shuffled array:", shuffled);
    return shuffled;
}




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

const panelMaterial = new THREE.MeshStandardMaterial({
    color: panelColor,
    roughness: 0.5,
    metalness: 0.0
});




const panels = []; // 글로벌 배열 유지

function createPanels() {
    console.log("createPanels() - 패널 생성 시작, 이전 패널 수:", panels.length); // 디버깅: 시작 로그
    // 기존 패널 제거
    panels.forEach(panel => {
        scene.remove(panel.group);
        console.log("createPanels() - 기존 패널 제거됨, 위치:", panel.position); // 디버깅: 제거 확인
    });
    panels.length = 0; // 배열 초기화

    panelPositions.forEach((pos, index) => {
        const isCeiling = index >= 8 && index < 10; // 천장 패널 (인덱스 8, 9)
        const isFloor = index >= 10; // 바닥 패널 (인덱스 10, 11)
        // 천장/바닥 패널 사용 여부에 따라 필터링
        if ((isCeiling && !gameState.useCeilingPanels) || (isFloor && !gameState.useFloorPanels)) {
            console.log("createPanels() - 패널 생성 스킵: 인덱스=", index, "천장=", isCeiling, "바닥=", isFloor); // 디버깅: 스킵 로그
            return;
        }

        const panelGroup = new THREE.Group();
        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth),
            panelMaterial
        );
        panelGroup.add(panel);

        // 사용자 정의 위치 적용 (기본값 fallback)
        const customPos = gameState.panelPositionsCustom[index] || pos;
        panelGroup.position.set(customPos.x, customPos.y, customPos.z);
        panelGroup.rotation.set(pos.rotation[0], pos.rotation[1], pos.rotation[2]);

        scene.add(panelGroup);
        panels.push({
            group: panelGroup,
            position: index,
            panel: panel,
            rotation: pos.rotation,
            stimulusObject: null
        });
        // 디버깅: 패널 회전값 적용 확인
        console.log("createPanels() - 패널 생성됨: 인덱스=", index, "위치=", customPos, "회전=", {
            x: pos.rotation[0] * 180 / Math.PI, // 라디안을 도(degree)로 변환
            y: pos.rotation[1] * 180 / Math.PI,
            z: pos.rotation[2] * 180 / Math.PI
        });
    });

    console.log("createPanels() - 패널 생성 완료, 총 패널 수:", panels.length); // 디버깅: 완료 로그
}

// 초기 호출 (기존 정적 초기화 대체)
createPanels();







const imageLoader = new THREE.TextureLoader();
const imageTextures = [];
//랜덤 색상 종류표
const distinctColors = [
  new THREE.Color(0xFFFF00), // 밝은 노랑 (Bright Yellow) - 검은색과 대비가 매우 강하여 눈에 잘 띕니다.
  new THREE.Color(0x00FFFF), // 시안 (Cyan) - 밝고 선명하며 노랑과 뚜렷하게 구분됩니다.
  new THREE.Color(0x00FF00), // 밝은 초록 (Bright Green) - 눈에 편안하면서도 검은색 배경에서 잘 보입니다.
  new THREE.Color(0xFF0000), // 밝은 빨강 (Bright Red) - 주목성이 높고 다른 색상들과 명확히 대비됩니다.
  new THREE.Color(0x0000FF), // 밝은 파랑 (Bright Blue) - 선명하며 다른 밝은 색상들과 구별됩니다.
  new THREE.Color(0xFFA500), // 주황 (Orange) - 노랑과 빨강 사이의 색으로, 뚜렷한 존재감을 나타냅니다.
  new THREE.Color(0x800080), // 보라 (Purple) - 파랑과 빨강의 조합으로 독특한 느낌을 주며 구분이 쉽습니다.
  new THREE.Color(0xFFFFFF)  // 흰색 (White) - 가장 높은 대비를 제공하며 기준 색상으로 유용합니다.
];

function getRandomColor() {
    return distinctColors[Math.floor(Math.random() * distinctColors.length)];
}

function loadImageTextures() {
    // 기존 배열 초기화
    imageTextures.length = 0;

    // 하위 폴더 목록 정의 (사용자가 원하는 폴더명으로 변경 가능)
    const subFolders = ['folder2', 'folder3'];
    console.log("loadImageTextures() - 사용 가능한 하위 폴더 목록:", subFolders);

    // 랜덤으로 하위 폴더 선택
    const selectedFolder = subFolders[Math.floor(Math.random() * subFolders.length)];
    console.log("loadImageTextures() - 선택된 하위 폴더:", selectedFolder);

    // 기본 URL 설정
    const baseUrl = `${gameState.imageSourceUrl}${selectedFolder}/`;
    const maxImages = 100; // 최대 시도할 이미지 개수 (필요 시 조정 가능)
    const promises = [];

    // 이미지 로딩 시도
    for (let i = 1; i <= maxImages; i++) {
        const filename = `image${String(i).padStart(3, '0')}.png`; // 파일명 형식: image001.png
        const loadPromise = new Promise((resolve) => {
            imageLoader.load(
                `${baseUrl}${filename}`,
                (loadedTexture) => {
                    // 이미지 로딩 성공
                    console.log(`loadImageTextures() - 성공적으로 로드됨: ${baseUrl}${filename}`);
                    resolve({ 
                        texture: loadedTexture, 
                        color: randomizeStimulusColor ? getRandomColor() : null 
                    });
                },
                undefined,
                (err) => {
                    // 이미지 로딩 실패 (파일 없음)
                    console.log(`loadImageTextures() - 파일 없음: ${baseUrl}${filename}`);
                    resolve(null); // null 반환으로 실패 처리
                }
            );
        });
        promises.push(loadPromise);
    }

    // 모든 로딩 작업 완료 후 처리
    return Promise.all(promises).then(results => {
        results.forEach(result => {
            if (result) {
                imageTextures.push(result); // 성공한 이미지만 배열에 추가
            }
        });
        console.log(`loadImageTextures() - 총 ${imageTextures.length}개의 이미지가 로드됨 from ${selectedFolder}`);
        
        // 로드된 이미지가 0개일 경우 경고
        if (imageTextures.length === 0) {
            console.error("loadImageTextures() - 이미지가 하나도 로드되지 않음. 폴더 경로 또는 파일명을 확인하세요.");
        }
    });
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
      // colorIndex가 유효한 범위 내에 있는지 확인
      if (colorIndex >= 0 && colorIndex < colors.length) {
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
    gameState.canRespondScene = true;      // Scene 응답 가능으로 초기화
    gameState.canRespondLocation = true;   // Location 응답 가능으로 초기화
    gameState.canRespondSound = true;      // Sound 응답 가능으로 초기화
    gameState.canRespondColor = true;      // Color 응답 가능으로 초기화
    console.log("resetIndicators() - Reset complete, canRespond states:", {
        scene: gameState.canRespondScene,
        location: gameState.canRespondLocation,
        sound: gameState.canRespondSound,
        color: gameState.canRespondColor
    });
}



function showIndicatorFeedback(indicatorId, isCorrect) {
    console.log(`showIndicatorFeedback() - 적용: ${indicatorId}, 정답 여부: ${isCorrect}`);
    const indicator = document.getElementById(indicatorId);
    if (!indicator) {
        console.error(`showIndicatorFeedback() - Indicator with ID '${indicatorId}' not found in DOM.`);
        return;
    }

    // 기대값과 실제값 비교
    const expectedCorrect = gameState[`currentIs${indicatorId.split('-')[0].charAt(0).toUpperCase() + indicatorId.split('-')[0].slice(1)}Target`];
    console.log(`showIndicatorFeedback() - 피드백 검증: 기대값=${expectedCorrect && isCorrect}, 실제값=${isCorrect}`);
    if ((expectedCorrect && isCorrect) !== isCorrect) {
        console.log("%c[경고] 피드백 불일치: 사용자가 기대한 결과와 다를 수 있음", "color: orange");
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
    if (gameState.isPaused) return;
    console.log("showStimulus() - 시작: imageIndex:", imageIndex, "panelIndex:", panelIndex, "soundIndex:", soundIndex, "colorIndex:", colorIndex, "currentStimulus:", gameState.currentStimulus);
    resetIndicators();
    const panel = panels[panelIndex];

    if (gameState.currentStimulus >= gameState.nBackLevel) {
        gameState.currentIsSceneTarget = gameState.stimulusSequence[gameState.currentStimulus].isSceneTarget;
        gameState.currentIsLocationTarget = gameState.stimulusSequence[gameState.currentStimulus].isLocationTarget;
        gameState.currentIsSoundTarget = gameState.stimulusSequence[gameState.currentStimulus].isSoundTarget;
        gameState.currentIsColorTarget = gameState.stimulusSequence[gameState.currentStimulus].isColorTarget;
        console.log("showStimulus() - 시퀀스에서 정의된 타겟:", {
            scene: gameState.currentIsSceneTarget,
            location: gameState.currentIsLocationTarget,
            sound: gameState.currentIsSoundTarget,
            color: gameState.currentIsColorTarget
        });
    } else {
        gameState.currentIsSceneTarget = false;
        gameState.currentIsLocationTarget = false;
        gameState.currentIsSoundTarget = false;
        gameState.currentIsColorTarget = false;
        console.log("showStimulus() - 초기 자극, 타겟 없음");
    }

    createStimulusImage(imageIndex, panel, colorIndex);
    if (gameState.stimulusTypes.includes("sound")) {
        playSound(soundIndex);
    }

    console.log("showStimulus() - Presented stimulus:", imageIndex, panelIndex, soundIndex, colorIndex);
    gameState.sceneHistory.push(imageIndex);
    gameState.locationHistory.push(panelIndex);
    gameState.soundHistory.push(soundIndex);
    gameState.colorHistory.push(colorIndex);

    gameState.presentedStimulusHistory.push({
        imageIndex,
        panelIndex,
        soundIndex,
        colorIndex
    });

    gameState.currentStimulus++;

    // 자극 간 간격 시간 계산
    let currentInterval;
    if (gameState.randomizeInterval) {
        const min = gameState.minInterval;
        const max = gameState.maxInterval;
        if (gameState.previousInterval === null) {
            // 첫 번째 자극: 완전 무작위 선택
            currentInterval = Math.floor(Math.random() * (max - min + 1)) + min;
            console.log("showStimulus() - 첫 자극 간격 무작위 선택:", currentInterval, "ms");
        } else {
            // 이전 간격을 고려한 편향 계산 (0: min, 1: max)
            const bias = (gameState.previousInterval - min) / (max - min);
            const newBias = 1 - bias; // 반대 방향으로 치우침
            // 70% 편향, 30% 무작위성
            currentInterval = min + (newBias * 0.7 + Math.random() * 0.3) * (max - min);
            currentInterval = Math.floor(Math.min(Math.max(currentInterval, min), max));
            console.log("showStimulus() - 이전 간격 기반 새 간격 계산:", {
                previous: gameState.previousInterval,
                bias: bias.toFixed(2),
                newBias: newBias.toFixed(2),
                result: currentInterval,
                min: min,
                max: max
            });
        }
        gameState.previousInterval = currentInterval;
    } else {
        currentInterval = gameState.stimulusInterval;
        console.log("showStimulus() - 고정 간격 사용:", currentInterval, "ms");
    }

    if (gameState.currentStimulus < gameState.stimuliPerBlock) {
        gameState.currentTimer = setTimeout(() => {
            console.log("Timer - Clearing stimuli and stopping sound, currentStimulus:", gameState.currentStimulus, "timestamp:", Date.now());
            clearAllStimuli();
            stopSound();
            gameState.inResponseWindow = true;
            gameState.canRespondScene = true;
            gameState.canRespondLocation = true;
            gameState.canRespondSound = true;
            gameState.canRespondColor = true;

            gameState.responseWindowTimer = setTimeout(() => {
                console.log("Timer - Response window closed, currentStimulus:", gameState.currentStimulus, "currentInterval:", currentInterval, "timestamp:", Date.now());
                gameState.inResponseWindow = false;
                gameState.canRespondScene = false;
                gameState.canRespondLocation = false;
                gameState.canRespondSound = false;
                gameState.canRespondColor = false;

                const lastPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1];
                if (gameState.stimulusTypes.includes("scene") && gameState.currentIsSceneTarget && !gameState.sceneTargetProcessed) {
                    showMissedTargetFeedback('scene-indicator');
                    gameState.sceneErrors++;
                    console.log("Timer - Missed scene target:", {
                        imageIndex: lastPresented.imageIndex,
                        nBackIndex: gameState.sceneHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        sceneErrors: gameState.sceneErrors
                    });
                }
                if (gameState.stimulusTypes.includes("location") && gameState.currentIsLocationTarget && !gameState.locationTargetProcessed) {
                    showMissedTargetFeedback('location-indicator');
                    gameState.locationErrors++;
                    console.log("Timer - Missed location target:", {
                        panelIndex: lastPresented.panelIndex,
                        nBackIndex: gameState.locationHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        locationErrors: gameState.locationErrors
                    });
                }
                if (gameState.stimulusTypes.includes("sound") && gameState.currentIsSoundTarget && !gameState.soundTargetProcessed) {
                    showMissedTargetFeedback('sound-indicator');
                    gameState.soundErrors++;
                    console.log("Timer - Missed sound target:", {
                        soundIndex: lastPresented.soundIndex,
                        nBackIndex: gameState.soundHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        soundErrors: gameState.soundErrors
                    });
                }
                if (gameState.stimulusTypes.includes("color") && gameState.currentIsColorTarget && !gameState.colorTargetProcessed) {
                    showMissedTargetFeedback('color-indicator');
                    gameState.colorErrors++;
                    console.log("Timer - Missed color target:", {
                        colorIndex: lastPresented.colorIndex,
                        nBackIndex: gameState.colorHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        colorErrors: gameState.colorErrors
                    });
                }

                console.log("Timer - Error counts after response window:", {
                    sceneErrors: gameState.sceneErrors,
                    locationErrors: gameState.locationErrors,
                    soundErrors: gameState.soundErrors,
                    colorErrors: gameState.colorErrors
                });

                generateNextStimulus();
            }, currentInterval);
        }, gameState.stimulusDuration);
    } else {
        gameState.currentTimer = setTimeout(() => {
            console.log("Timer - Final stimulus cleared, ending block, timestamp:", Date.now());
            clearAllStimuli();
            stopSound();
            gameState.inResponseWindow = true;
            gameState.canRespondScene = true;
            gameState.canRespondLocation = true;
            gameState.canRespondSound = true;
            gameState.canRespondColor = true;

            gameState.responseWindowTimer = setTimeout(() => {
                console.log("Timer - Response window closed (final), currentStimulus:", gameState.currentStimulus, "currentInterval:", currentInterval, "timestamp:", Date.now());
                gameState.inResponseWindow = false;
                gameState.canRespondScene = false;
                gameState.canRespondLocation = false;
                gameState.canRespondSound = false;
                gameState.canRespondColor = false;

                const lastPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1];
                if (gameState.stimulusTypes.includes("scene") && gameState.currentIsSceneTarget && !gameState.sceneTargetProcessed) {
                    showMissedTargetFeedback('scene-indicator');
                    gameState.sceneErrors++;
                    console.log("Timer - Missed scene target (final):", {
                        imageIndex: lastPresented.imageIndex,
                        nBackIndex: gameState.sceneHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        sceneErrors: gameState.sceneErrors
                    });
                }
                if (gameState.stimulusTypes.includes("location") && gameState.currentIsLocationTarget && !gameState.locationTargetProcessed) {
                    showMissedTargetFeedback('location-indicator');
                    gameState.locationErrors++;
                    console.log("Timer - Missed location target (final):", {
                        panelIndex: lastPresented.panelIndex,
                        nBackIndex: gameState.locationHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        locationErrors: gameState.locationErrors
                    });
                }
                if (gameState.stimulusTypes.includes("sound") && gameState.currentIsSoundTarget && !gameState.soundTargetProcessed) {
                    showMissedTargetFeedback('sound-indicator');
                    gameState.soundErrors++;
                    console.log("Timer - Missed sound target (final):", {
                        soundIndex: lastPresented.soundIndex,
                        nBackIndex: gameState.soundHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        soundErrors: gameState.soundErrors
                    });
                }
                if (gameState.stimulusTypes.includes("color") && gameState.currentIsColorTarget && !gameState.colorTargetProcessed) {
                    showMissedTargetFeedback('color-indicator');
                    gameState.colorErrors++;
                    console.log("Timer - Missed color target (final):", {
                        colorIndex: lastPresented.colorIndex,
                        nBackIndex: gameState.colorHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        colorErrors: gameState.colorErrors
                    });
                }

                console.log("Timer - Final error counts before ending block:", {
                    sceneErrors: gameState.sceneErrors,
                    locationErrors: gameState.locationErrors,
                    soundErrors: gameState.soundErrors,
                    colorErrors: gameState.colorErrors
                });

                setTimeout(() => {
                    endBlock();
                }, 500);
            }, currentInterval);
        }, gameState.stimulusDuration);
    }
}





function selectIndexAvoidingRecent(recentIndices, maxRange, recentLimit, maxOccurrences = 5) {
    // 최근 인덱스가 recentLimit을 초과하면 오래된 항목 제거
    while (recentIndices.length >= recentLimit) {
        recentIndices.shift();
    }

    // 현재 시퀀스에서 각 값의 등장 횟수 추적
    const currentCounts = {};
    recentIndices.forEach(idx => {
        currentCounts[idx] = (currentCounts[idx] || 0) + 1;
    });

    // 사용 가능한 인덱스 배열 생성
    const availableIndices = [];
    for (let i = 0; i < maxRange; i++) {
        if (!recentIndices.includes(i) && (currentCounts[i] || 0) < maxOccurrences) {
            availableIndices.push(i);
        }
    }

    // 디버깅: 사용 가능한 인덱스와 현재 상태 확인
    console.log(`selectIndexAvoidingRecent() - 사용 가능한 인덱스: ${availableIndices}, 최근 사용된 인덱스: ${recentIndices}, 최대 범위: ${maxRange}, 제한: ${recentLimit}, 최대 등장 횟수: ${maxOccurrences}`);

    // 사용 가능한 인덱스가 없으면 무작위 값 반환
    if (availableIndices.length === 0) {
        console.warn(`selectIndexAvoidingRecent() - 사용 가능한 인덱스가 없음, 0부터 ${maxRange - 1} 중 무작위 선택`);
        return Math.floor(Math.random() * maxRange);
    }

    // 무작위로 인덱스 선택
    const selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    console.log(`selectIndexAvoidingRecent() - 선택된 인덱스: ${selectedIndex}`);

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
        console.log(`updateRecentIndices() - ${type} 업데이트: 제거된 인덱스 ${removedIndex}, 추가된 인덱스 ${index}`);
    } else {
        console.log(`updateRecentIndices() - ${type} 업데이트: 추가된 인덱스 ${index}`);
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

    updateStimulusCounter();
    showStimulus(imageIndex, panelIndex, soundIndex, colorIndex);
}




function cancelAllTimers() {
    if (gameState.currentTimer) {
        clearTimeout(gameState.currentTimer);
        gameState.currentTimer = null;
        console.log("cancelAllTimers() - Cleared currentTimer");
    }
    if (gameState.responseWindowTimer) {
        clearTimeout(gameState.responseWindowTimer);
        gameState.responseWindowTimer = null;
        console.log("cancelAllTimers() - Cleared responseWindowTimer");
    }
    console.log("cancelAllTimers() - All timers canceled", { timestamp: Date.now() });
}

function pauseGame() {
    if (!gameState.isPlaying || gameState.isPaused) {
        console.log("pauseGame() - Aborted: Game not playing or already paused", {
            isPlaying: gameState.isPlaying,
            isPaused: gameState.isPaused
        });
        return;
    }
    gameState.isPaused = true;
    cancelAllTimers();
    clearAllStimuli();
    stopSound();
    const pauseScreen = document.getElementById('pauseScreen');
    if (pauseScreen) {
        pauseScreen.style.display = 'flex';
        console.log("pauseGame() - pauseScreen displayed successfully");
    } else {
        console.error("pauseGame() - pauseScreen element not found in DOM");
    }
    gameState.isPlaying = false; // Prevent generateNextStimulus()
    console.log("pauseGame() - Game paused, timers canceled, stimuli cleared", {
        timestamp: Date.now()
    });
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
    const guide = document.getElementById('fullscreenGuide'); // 메시지 요소
    if (!gameState.isFullscreen) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
        // iPhone에서만 메시지 표시
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            guide.style.display = 'block';
            console.log('전체화면 안내 메시지 표시됨! 📱');
            setTimeout(() => {
                guide.style.display = 'none';
                console.log('전체화면 안내 메시지 3초 후 숨김! ⏳');
            }, 3000);
        }
        gameState.isFullscreen = true;
        document.getElementById('fullscreenBtn').textContent = 'Normal';
        console.log('전체화면 모드 활성화! 🌕');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        guide.style.display = 'none'; // 모드 해제 시 메시지 즉시 숨김
        console.log('전체화면 안내 메시지 숨김 (모드 해제)! 🚪');
        gameState.isFullscreen = false;
        document.getElementById('fullscreenBtn').textContent = 'Full';
        console.log('일반 화면 모드로 복귀! ☀️');
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
            const resultScreen = document.getElementById('resultScreen');
            if (resultScreen) {
                resultScreen.style.display = 'none';
            }
            startBlock();
        }
        return;
    }
    console.log("handleKeyPress() - 키 입력됨:", e.key, "타임스탬프:", Date.now(), "응답 가능 여부:", gameState.canRespond, "응답 창 여부:", gameState.inResponseWindow);

    // 현재 자극의 타겟 상태 분석
    const currentSequence = gameState.stimulusSequence[gameState.currentStimulus - 1] || {};
    console.log(`[분석] 현재 타겟 상태: scene=${currentSequence.isSceneTarget}, location=${currentSequence.isLocationTarget}, sound=${currentSequence.isSoundTarget}, color=${currentSequence.isColorTarget}`);

    // Scene 응답 처리
    if (gameState.stimulusTypes.includes("scene") && e.key.toUpperCase() === gameState.sceneKey && !gameState.sceneTargetProcessed && gameState.canRespond) {
        if (!currentSequence.isSceneTarget) {
            console.log("%c[분석] 경고: 'S' 키 입력은 Scene 타겟이 아님. 현재 타겟을 확인하세요.", "color: yellow");
        }
        console.log("handleKeyPress() - Scene 키 입력됨:", e.key, "handleSceneResponse() 호출");
        handleSceneResponse();
    }
    // Location 응답 처리
    if (gameState.stimulusTypes.includes("location") && e.key.toUpperCase() === gameState.locationKey && !gameState.locationTargetProcessed && gameState.canRespond) {
        if (!currentSequence.isLocationTarget) {
            console.log("%c[분석] 경고: 'A' 키 입력은 Location 타겟이 아님. 현재 타겟을 확인하세요.", "color: yellow");
        }
        console.log("handleKeyPress() - Location 키 입력됨:", e.key, "handleLocationResponse() 호출");
        handleLocationResponse();
    }
    // Sound 응답 처리
    if (gameState.stimulusTypes.includes("sound") && e.key.toUpperCase() === gameState.soundKey && !gameState.soundTargetProcessed && gameState.canRespond) {
        if (!currentSequence.isSoundTarget) {
            console.log("%c[분석] 경고: 'L' 키 입력은 Sound 타겟이 아님. 현재 타겟을 확인하세요.", "color: yellow");
        }
        console.log("handleKeyPress() - Sound 키 입력됨:", e.key, "handleSoundResponse() 호출");
        handleSoundResponse();
    }
    // Color 응답 처리
    if (gameState.stimulusTypes.includes("color") && e.key.toUpperCase() === gameState.colorKey && !gameState.colorTargetProcessed && gameState.canRespond) {
        if (!currentSequence.isColorTarget) {
            console.log("%c[분석] 경고: 'K' 키 입력은 Color 타겟이 아님. 현재 타겟을 확인하세요.", "color: yellow");
        }
        console.log("handleKeyPress() - Color 키 입력됨:", e.key, "handleColorResponse() 호출");
        handleColorResponse();
    }
}




function handleSceneResponse() {
    if (gameState.isPaused) return;
    console.log("handleSceneResponse() - 처리 시작: canRespondScene=", gameState.canRespondScene, "sceneTargetProcessed=", gameState.sceneTargetProcessed, "currentStimulus=", gameState.currentStimulus);

    console.log("handleSceneResponse() - 현재 타겟 상태:", {
        currentIsSceneTarget: gameState.currentIsSceneTarget,
        inResponseWindow: gameState.inResponseWindow
    });

    if (!gameState.canRespondScene || gameState.sceneTargetProcessed) {
        console.log("handleSceneResponse() - 응답 차단: canRespondScene=", gameState.canRespondScene, "sceneTargetProcessed=", gameState.sceneTargetProcessed);
        return;
    }

    gameState.sceneTargetProcessed = true;
    gameState.canRespondScene = false;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('scene-indicator');
        console.log("handleSceneResponse() - 조기 응답: stimulus=", gameState.currentStimulus, "nBackLevel=", gameState.nBackLevel);
        return;
    }

    gameState.sceneResponses++;
    const currentPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1];
    const nBackPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1 - gameState.nBackLevel];
    const sequenceTarget = gameState.stimulusSequence[gameState.currentStimulus - 1];

    console.log("handleSceneResponse() - 장면 비교: 현재 imageIndex=", currentPresented.imageIndex, "N백 imageIndex=", nBackPresented.imageIndex);

    const isDynamicMatch = currentPresented.imageIndex === nBackPresented.imageIndex;
    const isCorrect = gameState.currentIsSceneTarget && isDynamicMatch;
    console.log("handleSceneResponse() - 타겟 검증:", {
        predefined: gameState.currentIsSceneTarget,
        dynamic: isDynamicMatch,
        match: isCorrect,
        sequenceIsTarget: sequenceTarget.isSceneTarget
    });

    // 분석 로직: 사용자가 이해하기 쉽게 오답 이유 명확화
    console.log(`[분석] 타겟 여부: 시퀀스 타겟=${sequenceTarget.isSceneTarget}, 현재 타겟 상태=${gameState.currentIsSceneTarget}, 동적 비교=${isDynamicMatch}`);
    if (gameState.currentIsSceneTarget && !isDynamicMatch) {
        console.log("%c[분석] 타겟 장면 자극에 반응했으나 N백 비교 실패로 오답 처리됨", "color: red");
    } else if (!gameState.currentIsSceneTarget && isDynamicMatch) {
        console.log("%c[분석] 논타겟 장면 자극에 오반응 - 니얼미스 발생", "color: orange");
    } else if (!gameState.currentIsSceneTarget && !isDynamicMatch) {
        console.log("[분석] 논타겟 장면 자극에 오반응");
    } else {
        console.log("[분석] 타겟 장면 자극에 정확히 반응함");
    }

    showIndicatorFeedback('scene-indicator', isCorrect);

    if (gameState.currentIsSceneTarget) {
        if (isCorrect) {
            console.log("handleSceneResponse() - 장면 정답: isCorrect=", isCorrect);
        } else {
            gameState.sceneErrors++;
            gameState.targetMissedErrors.scene++;
            console.log("handleSceneResponse() - 장면 오류 (타겟 놓침): sceneErrors=", gameState.sceneErrors);
        }
    } else {
        if (isDynamicMatch) {
            gameState.sceneErrors++;
            gameState.nonTargetFalseResponses.scene++;
            gameState.nearMissResponses++;
            nearMissHistory.push({
                type: 'scene',
                timestamp: Date.now(),
                current: currentPresented.imageIndex,
                nBack: nBackPresented.imageIndex
            });
            console.log("handleSceneResponse() - 장면 오류 (니얼미스): sceneErrors=", gameState.sceneErrors, "nearMissResponses=", gameState.nearMissResponses);
        } else {
            gameState.sceneErrors++;
            gameState.nonTargetFalseResponses.scene++;
            console.log("handleSceneResponse() - 장면 오류 (논타겟 오반응): sceneErrors=", gameState.sceneErrors);
        }
    }

    console.log("handleSceneResponse() - 처리 완료: sceneResponses=", gameState.sceneResponses, "sceneErrors=", gameState.sceneErrors, "sceneTargetProcessed=", gameState.sceneTargetProcessed);
}











function handleLocationResponse() {
    if (gameState.isPaused) return; // 게임이 일시 정지된 경우 처리 중단
    console.log("handleLocationResponse() - 처리 시작: canRespondLocation=", gameState.canRespondLocation, "locationTargetProcessed=", gameState.locationTargetProcessed, "currentStimulus=", gameState.currentStimulus);

    console.log("handleLocationResponse() - 현재 타겟 상태:", {
        currentIsLocationTarget: gameState.currentIsLocationTarget,
        inResponseWindow: gameState.inResponseWindow
    });

    if (!gameState.canRespondLocation || gameState.locationTargetProcessed) {
        console.log("handleLocationResponse() - 응답 차단: canRespondLocation=", gameState.canRespondLocation, "locationTargetProcessed=", gameState.locationTargetProcessed);
        return; // 응답 가능 여부 또는 이미 처리된 경우 중단
    }

    gameState.locationTargetProcessed = true; // 위치 응답 처리 완료 플래그 설정
    gameState.canRespondLocation = false; // 추가 응답 방지
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('location-indicator'); // 조기 응답 피드백 표시
        console.log("handleLocationResponse() - 조기 응답: stimulus=", gameState.currentStimulus, "nBackLevel=", gameState.nBackLevel);
        return; // N백 레벨 이전 자극이면 조기 응답으로 처리
    }

    gameState.locationResponses++; // 위치 응답 횟수 증가
    const currentPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1]; // 현재 자극 정보
    const nBackPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1 - gameState.nBackLevel]; // N백 이전 자극 정보
    const sequenceTarget = gameState.stimulusSequence[gameState.currentStimulus - 1]; // 시퀀스에서 정의된 타겟 정보

    console.log("handleLocationResponse() - 위치 비교: 현재 panelIndex=", currentPresented.panelIndex, "N백 panelIndex=", nBackPresented.panelIndex);

    const isCorrect = currentPresented.panelIndex === nBackPresented.panelIndex; // 동적 타겟 판정
    console.log("handleLocationResponse() - 타겟 검증:", {
        predefined: gameState.currentIsLocationTarget,
        dynamic: isCorrect,
        match: gameState.currentIsLocationTarget === isCorrect,
        sequenceIsTarget: sequenceTarget.isLocationTarget // 시퀀스 타겟 정보 추가
    });

    // 타겟 판정 정밀화: 시퀀스 타겟과 현재 타겟 상태 불일치 확인
    if (gameState.currentIsLocationTarget !== sequenceTarget.isLocationTarget) {
        console.log("%c[분석] 위치 타겟 상태 불일치: currentIsLocationTarget와 시퀀스 값이 다름", "color: orange");
    }

    showIndicatorFeedback('location-indicator', gameState.currentIsLocationTarget && isCorrect); // UI 피드백 표시

    // 분석 로직 강화
    if (gameState.currentIsLocationTarget) {
        if (!isCorrect) {
            gameState.locationErrors++; // 오류 카운트 증가
            gameState.targetMissedErrors.location++; // 타겟 놓침 오류 증가
            console.log("handleLocationResponse() - 위치 오류 (타겟 놓침): locationErrors=", gameState.locationErrors, "isCorrect=", isCorrect);
            console.log("%c[분석] 사용자가 타겟 위치 자극에 반응했으나 오답 처리됨 - N백 비교 실패", "color: red");
            console.log("상세: 현재=", currentPresented.panelIndex, "N백=", nBackPresented.panelIndex);
        } else {
            console.log("handleLocationResponse() - 위치 정답: isCorrect=", isCorrect);
            console.log("%c[분석] 타겟 위치 자극에 정확히 반응함", "color: green");
        }
    } else {
        gameState.locationErrors++; // 오류 카운트 증가
        gameState.nonTargetFalseResponses.location++; // 논타겟 오반응 증가
        console.log("handleLocationResponse() - 위치 오류 (논타겟 오반응): locationErrors=", gameState.locationErrors);
        console.log("%c[분석] 사용자가 타겟이 아닌 위치 자극을 타겟으로 오반응함", "color: red");
        console.log("상세: 현재=", currentPresented.panelIndex, "N백=", nBackPresented.panelIndex);
        if (currentPresented.isNearMiss) {
            gameState.nearMissResponses++; // 니얼미스 반응 카운트 증가
            console.log("handleLocationResponse() - 니얼미스 반응 감지: nearMissResponses=", gameState.nearMissResponses);
            console.log("%c[분석] 니얼미스 자극에 반응함 - 혼동 유발 가능성", "color: yellow");
        }
    }

    console.log("handleLocationResponse() - 처리 완료: locationResponses=", gameState.locationResponses, "locationErrors=", gameState.locationErrors, "locationTargetProcessed=", gameState.locationTargetProcessed);
}









function handleSoundResponse() {
    if (gameState.isPaused) return; // 게임이 일시 정지된 경우 처리 중단
    console.log("handleSoundResponse() - 처리 시작: canRespondSound=", gameState.canRespondSound, "soundTargetProcessed=", gameState.soundTargetProcessed, "currentStimulus=", gameState.currentStimulus);

    console.log("handleSoundResponse() - 현재 타겟 상태:", {
        currentIsSoundTarget: gameState.currentIsSoundTarget,
        inResponseWindow: gameState.inResponseWindow
    });

    if (!gameState.canRespondSound || gameState.soundTargetProcessed) {
        console.log("handleSoundResponse() - 응답 차단: canRespondSound=", gameState.canRespondSound, "soundTargetProcessed=", gameState.soundTargetProcessed);
        return; // 응답 가능 여부 또는 이미 처리된 경우 중단
    }

    gameState.soundTargetProcessed = true; // 소리 응답 처리 완료 플래그 설정
    gameState.canRespondSound = false; // 추가 응답 방지
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('sound-indicator'); // 조기 응답 피드백 표시
        console.log("handleSoundResponse() - 조기 응답: stimulus=", gameState.currentStimulus, "nBackLevel=", gameState.nBackLevel);
        return; // N백 레벨 이전 자극이면 조기 응답으로 처리
    }

    gameState.soundResponses++; // 소리 응답 횟수 증가
    const currentPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1]; // 현재 자극 정보
    const nBackPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1 - gameState.nBackLevel]; // N백 이전 자극 정보
    const sequenceTarget = gameState.stimulusSequence[gameState.currentStimulus - 1]; // 시퀀스에서 정의된 타겟 정보

    console.log("handleSoundResponse() - 소리 비교: 현재 soundIndex=", currentPresented.soundIndex, "N백 soundIndex=", nBackPresented.soundIndex);

    const isCorrect = currentPresented.soundIndex === nBackPresented.soundIndex; // 동적 타겟 판정
    console.log("handleSoundResponse() - 타겟 검증:", {
        predefined: gameState.currentIsSoundTarget,
        dynamic: isCorrect,
        match: gameState.currentIsSoundTarget === isCorrect,
        sequenceIsTarget: sequenceTarget.isSoundTarget // 시퀀스 타겟 정보 추가
    });

    // 타겟 판정 정밀화: 시퀀스 타겟과 현재 타겟 상태 불일치 확인
    if (gameState.currentIsSoundTarget !== sequenceTarget.isSoundTarget) {
        console.log("%c[분석] 소리 타겟 상태 불일치: currentIsSoundTarget와 시퀀스 값이 다름", "color: orange");
    }

    showIndicatorFeedback('sound-indicator', gameState.currentIsSoundTarget && isCorrect); // UI 피드백 표시

    // 분석 로직 강화
    if (gameState.currentIsSoundTarget) {
        if (!isCorrect) {
            gameState.soundErrors++; // 오류 카운트 증가
            gameState.targetMissedErrors.sound++; // 타겟 놓침 오류 증가
            console.log("handleSoundResponse() - 소리 오류 (타겟 놓침): soundErrors=", gameState.soundErrors, "isCorrect=", isCorrect);
            console.log("%c[분석] 사용자가 타겟 소리 자극에 반응했으나 오답 처리됨 - N백 비교 실패", "color: red");
            console.log("상세: 현재=", currentPresented.soundIndex, "N백=", nBackPresented.soundIndex);
        } else {
            console.log("handleSoundResponse() - 소리 정답: isCorrect=", isCorrect);
            console.log("%c[분석] 타겟 소리 자극에 정확히 반응함", "color: green");
        }
    } else {
        gameState.soundErrors++; // 오류 카운트 증가
        gameState.nonTargetFalseResponses.sound++; // 논타겟 오반응 증가
        console.log("handleSoundResponse() - 소리 오류 (논타겟 오반응): soundErrors=", gameState.soundErrors);
        console.log("%c[분석] 사용자가 타겟이 아닌 소리 자극을 타겟으로 오반응함", "color: red");
        console.log("상세: 현재=", currentPresented.soundIndex, "N백=", nBackPresented.soundIndex);
        if (currentPresented.isNearMiss) {
            gameState.nearMissResponses++; // 니얼미스 반응 카운트 증가
            console.log("handleSoundResponse() - 니얼미스 반응 감지: nearMissResponses=", gameState.nearMissResponses);
            console.log("%c[분석] 니얼미스 자극에 반응함 - 혼동 유발 가능성", "color: yellow");
        }
    }

    console.log("handleSoundResponse() - 처리 완료: soundResponses=", gameState.soundResponses, "soundErrors=", gameState.soundErrors, "soundTargetProcessed=", gameState.soundTargetProcessed);
}





function handleColorResponse() {
    if (gameState.isPaused) return; // 게임이 일시 정지된 경우 처리 중단
    console.log("handleColorResponse() - 처리 시작: canRespondColor=", gameState.canRespondColor, "colorTargetProcessed=", gameState.colorTargetProcessed, "currentStimulus=", gameState.currentStimulus);

    console.log("handleColorResponse() - 현재 타겟 상태:", {
        currentIsColorTarget: gameState.currentIsColorTarget,
        inResponseWindow: gameState.inResponseWindow
    });

    if (!gameState.canRespondColor || gameState.colorTargetProcessed) {
        console.log("handleColorResponse() - 응답 차단: canRespondColor=", gameState.canRespondColor, "colorTargetProcessed=", gameState.colorTargetProcessed);
        return; // 응답 가능 여부 또는 이미 처리된 경우 중단
    }

    gameState.colorTargetProcessed = true; // 색상 응답 처리 완료 플래그 설정
    gameState.canRespondColor = false; // 추가 응답 방지
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('color-indicator'); // 조기 응답 피드백 표시
        console.log("handleColorResponse() - 조기 응답: stimulus=", gameState.currentStimulus, "nBackLevel=", gameState.nBackLevel);
        return; // N백 레벨 이전 자극이면 조기 응답으로 처리
    }

    gameState.colorResponses++; // 색상 응답 횟수 증가
    const currentPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1]; // 현재 자극 정보
    const nBackPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1 - gameState.nBackLevel]; // N백 이전 자극 정보
    const sequenceTarget = gameState.stimulusSequence[gameState.currentStimulus - 1]; // 시퀀스에서 정의된 타겟 정보

    console.log("handleColorResponse() - 색상 비교: 현재 colorIndex=", currentPresented.colorIndex, "N백 colorIndex=", nBackPresented.colorIndex);

    const isCorrect = currentPresented.colorIndex === nBackPresented.colorIndex; // 동적 타겟 판정
    console.log("handleColorResponse() - 타겟 검증:", {
        predefined: gameState.currentIsColorTarget,
        dynamic: isCorrect,
        match: gameState.currentIsColorTarget === isCorrect,
        sequenceIsTarget: sequenceTarget.isColorTarget // 시퀀스 타겟 정보 추가
    });

    // 타겟 판정 정밀화: 시퀀스 타겟과 현재 타겟 상태 불일치 확인
    if (gameState.currentIsColorTarget !== sequenceTarget.isColorTarget) {
        console.log("%c[분석] 색상 타겟 상태 불일치: currentIsColorTarget와 시퀀스 값이 다름", "color: orange");
    }

    showIndicatorFeedback('color-indicator', gameState.currentIsColorTarget && isCorrect); // UI 피드백 표시

    // 분석 로직 강화
    if (gameState.currentIsColorTarget) {
        if (!isCorrect) {
            gameState.colorErrors++; // 오류 카운트 증가
            gameState.targetMissedErrors.color++; // 타겟 놓침 오류 증가
            console.log("handleColorResponse() - 색상 오류 (타겟 놓침): colorErrors=", gameState.colorErrors, "isCorrect=", isCorrect);
            console.log("%c[분석] 사용자가 타겟 색상 자극에 반응했으나 오답 처리됨 - N백 비교 실패", "color: red");
            console.log("상세: 현재=", currentPresented.colorIndex, "N백=", nBackPresented.colorIndex);
        } else {
            console.log("handleColorResponse() - 색상 정답: isCorrect=", isCorrect);
            console.log("%c[분석] 타겟 색상 자극에 정확히 반응함", "color: green");
        }
    } else {
        gameState.colorErrors++; // 오류 카운트 증가
        gameState.nonTargetFalseResponses.color++; // 논타겟 오반응 증가
        console.log("handleColorResponse() - 색상 오류 (논타겟 오반응): colorErrors=", gameState.colorErrors);
        console.log("%c[분석] 사용자가 타겟이 아닌 색상 자극을 타겟으로 오반응함", "color: red");
        console.log("상세: 현재=", currentPresented.colorIndex, "N백=", nBackPresented.colorIndex);
        if (currentPresented.isNearMiss) {
            gameState.nearMissResponses++; // 니얼미스 반응 카운트 증가
            console.log("handleColorResponse() - 니얼미스 반응 감지: nearMissResponses=", gameState.nearMissResponses);
            console.log("%c[분석] 니얼미스 자극에 반응함 - 혼동 유발 가능성", "color: yellow");
        }
    }

    console.log("handleColorResponse() - 처리 완료: colorResponses=", gameState.colorResponses, "colorErrors=", gameState.colorErrors, "colorTargetProcessed=", gameState.colorTargetProcessed);
}







function setTargetGoal(type, baseValue) {
    if (!Number.isInteger(baseValue) || baseValue < 0) {
        console.error(`setTargetGoal() - 잘못된 타겟 목표 값: ${type}=${baseValue}`);
        baseValue = 0; // 기본값으로 0 설정
    }
    // 최대 타겟 수는 stimuliPerBlock과 nBackLevel을 고려해 제한
    const maxTargets = Math.floor((gameState.stimuliPerBlock - gameState.nBackLevel) / (gameState.nBackLevel + 1));
    const adjustedValue = Math.max(0, Math.min(baseValue, maxTargets));
    gameState.targetCountGoals[type] = adjustedValue;
    console.log(`setTargetGoal() - ${type} 타겟 목표 설정: 입력값=${baseValue}, 조정값=${adjustedValue}, 최대 가능=${maxTargets}`);
}

function startBlock() {
    console.log("startBlock() - 새로운 블록 시작, 타임스탬프:", Date.now());
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
    gameState.presentedStimulusHistory = [];
    nearMissHistory = []; // 니얼미스 기록 초기화
    console.log("startBlock() - nearMissHistory 초기화 완료, 길이:", nearMissHistory.length);

    // 동적 타겟 목표 설정
    setTargetGoal("scene", Math.ceil(3 * (gameState.nBackLevel / 2)));
    setTargetGoal("location", Math.ceil(3 * (gameState.nBackLevel / 2)));
    setTargetGoal("sound", Math.ceil(1 * (gameState.nBackLevel / 2)));
    setTargetGoal("color", Math.ceil(3 * (gameState.nBackLevel / 2)));

    gameState.stimulusSequence = generateStimulusSequence();

    // UI 전환
    console.log("startBlock() - DOM 요소 확인 후 UI 전환 시작");
    const titleScreen = document.getElementById('titleScreen');
    const gameScreen = document.getElementById('gameScreen');
    const blockCount = document.getElementById('blockCount');

    if (!titleScreen || !gameScreen || !blockCount) {
        console.error("startBlock() - 필수 UI 요소 누락:", {
            titleScreen: titleScreen ? "발견" : "누락",
            gameScreen: gameScreen ? "발견" : "누락",
            blockCount: blockCount ? "발견" : "누락"
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

    // 1초 후에 첫 자극 제시
    setTimeout(() => {
        if (!gameState.isPaused) {
            generateNextStimulus();
            console.log("startBlock() - 1초 후 첫 자극 제시 완료, 타임스탬프:", Date.now());
        } else {
            console.log("startBlock() - 일시정지 상태로 인해 첫 자극 제시 생략:", {
                isPaused: gameState.isPaused
            });
        }
    }, 1000);
}






















function generateStimulusSequence() {
    console.log("generateStimulusSequence() - 시퀀스 생성 시작: 새로운 패턴방지 및 니얼미스 로직 적용");
    console.log("generateStimulusSequence() - nearMissHistory 초기화 상태 확인, 길이:", nearMissHistory.length);
    const sequence = [];
    const recentLimit = gameState.nBackLevel * 2;
    const targetGoals = { scene: 3, location: 3, sound: 2, color: 3 };
    const targetPositions = {};
    const targetTypes = ['scene', 'location', 'sound', 'color'];

    const patternPreventionStrength = gameState.patternPreventionStrength;
    const minTargetInterval = gameState.minTargetInterval;
    const maxTargetInterval = Math.min(gameState.maxTargetInterval, gameState.stimuliPerBlock - gameState.nBackLevel - 1);
    const totalStimuli = gameState.stimuliPerBlock - gameState.nBackLevel;

    targetTypes.forEach(type => {
        targetPositions[type] = selectTargetPositions(totalStimuli, targetGoals[type], minTargetInterval, maxTargetInterval, patternPreventionStrength);
        console.log(`generateStimulusSequence() - ${type} 타겟 위치:`, targetPositions[type]);
    });

    // 초기 자극 생성 (N백 레벨만큼)
    for (let i = 0; i < gameState.nBackLevel; i++) {
        const imageIndex = selectIndexAvoidingRecent(gameState.recentSceneIndices || [], imageTextures.length, recentLimit, 5);
        const panelIndex = selectIndexAvoidingRecent(gameState.recentLocationIndices || [], panels.length, recentLimit, 5);
        const soundIndex = selectIndexAvoidingRecent(gameState.recentSoundIndices || [], gameState.pianoTones.length, recentLimit, 5);
        const colorIndex = selectIndexAvoidingRecent(gameState.recentColorIndices || [], distinctColors.length, recentLimit, 5);

        sequence.push({
            imageIndex, panelIndex, soundIndex, colorIndex,
            targetType: "initial",
            isSceneTarget: false, isLocationTarget: false, isSoundTarget: false, isColorTarget: false,
            isNearMiss: false
        });
        updateRecentIndices("scene", imageIndex, recentLimit);
        updateRecentIndices("location", panelIndex, recentLimit);
        updateRecentIndices("sound", soundIndex, recentLimit);
        updateRecentIndices("color", colorIndex, recentLimit);
    }

    const allTargets = [];
    targetTypes.forEach(type => {
        targetPositions[type].forEach(pos => allTargets.push({ pos, type }));
    });
    allTargets.sort((a, b) => a.pos - b.pos);

    const nearMissTypes = ['N-1', 'N+1', '2N'];
    const n = gameState.nBackLevel; // N백 레벨

    let consecutiveNonTargets = 0; // 연속된 non-target 자극 수 추적

    // 자극 시퀀스 생성
    for (let i = 0; i < totalStimuli; i++) {
        const absoluteIndex = i + gameState.nBackLevel;
        const nBackIndex = absoluteIndex - gameState.nBackLevel;
        const targetsAtPos = allTargets.filter(t => t.pos === absoluteIndex); // 복구: absoluteIndex 사용

        // 타겟 플래그 설정 (원본 로직 유지)
        let isSceneTarget = targetsAtPos.some(t => t.type === 'scene');
        let isLocationTarget = targetsAtPos.some(t => t.type === 'location');
        let isSoundTarget = targetsAtPos.some(t => t.type === 'sound');
        let isColorTarget = targetsAtPos.some(t => t.type === 'color');
        let targetType = targetsAtPos.length ? targetsAtPos[0].type : "non-target";

        // 연속된 non-target 자극 제한 (타겟 위치가 아닌 경우에만 적용)
        if (!targetsAtPos.length && consecutiveNonTargets >= 2) {
            console.log(`generateStimulusSequence() - 연속 non-target 2회 초과 감지 at ${absoluteIndex}, 강제 타겟 삽입`);
            const type = targetTypes[Math.floor(Math.random() * targetTypes.length)];
            if (type === 'scene') isSceneTarget = true;
            else if (type === 'location') isLocationTarget = true;
            else if (type === 'sound') isSoundTarget = true;
            else if (type === 'color') isColorTarget = true;
            targetType = type;
            consecutiveNonTargets = 0;
        }

        // 타겟 생성 로직 (원본 그대로 유지)
        let imageIndex = isSceneTarget ? sequence[nBackIndex].imageIndex : selectIndexAvoidingRecent(gameState.recentSceneIndices, imageTextures.length, recentLimit, 5);
        let panelIndex = isLocationTarget ? sequence[nBackIndex].panelIndex : selectIndexAvoidingRecent(gameState.recentLocationIndices, panels.length, recentLimit, 5);
        let soundIndex = isSoundTarget ? sequence[nBackIndex].soundIndex : selectIndexAvoidingRecent(gameState.recentSoundIndices, gameState.pianoTones.length, recentLimit, 5);
        let colorIndex = isColorTarget ? sequence[nBackIndex].colorIndex : selectIndexAvoidingRecent(gameState.recentColorIndices, distinctColors.length, recentLimit, 5);

        // 니얼미스 생성 로직 (수정된 부분 제외하고 원본 유지)
        let isNearMiss = false;
        if (n > 1 && !isSceneTarget && !isLocationTarget && !isSoundTarget && !isColorTarget) { // N=1일 때 니얼미스 비활성화
            const previousStimulus = sequence[absoluteIndex - 1];
            const isPreviousNearMiss = previousStimulus && previousStimulus.isNearMiss;
            const distanceToNearestTarget = Math.min(
                ...allTargets.map(t => Math.abs(t.pos - absoluteIndex))
            );
            if (!isPreviousNearMiss && distanceToNearestTarget > 1 && Math.random() < gameState.nearMissProbability) {
                isNearMiss = true;
                const nearMissType = nearMissTypes[Math.floor(Math.random() * nearMissTypes.length)];
                console.log(`generateStimulusSequence() - 니얼미스 생성 시도: 위치=${absoluteIndex}, 유형=${nearMissType}, 확률=${gameState.nearMissProbability}`);

                // 니얼미스 유형에 따른 인덱스 설정
                if (nearMissType === 'N-1' && absoluteIndex - 1 >= 0) {
                    imageIndex = sequence[absoluteIndex - 1].imageIndex;
                    panelIndex = sequence[absoluteIndex - 1].panelIndex;
                    soundIndex = sequence[absoluteIndex - 1].soundIndex;
                    colorIndex = sequence[absoluteIndex - 1].colorIndex;
                } else if (nearMissType === 'N+1' && absoluteIndex + 1 < gameState.stimuliPerBlock) {
                    const nextStimulus = generateNextStimulusPreview(absoluteIndex + 1, sequence, allTargets);
                    imageIndex = nextStimulus.imageIndex;
                    panelIndex = nextStimulus.panelIndex;
                    soundIndex = nextStimulus.soundIndex;
                    colorIndex = nextStimulus.colorIndex;
                } else if (nearMissType === '2N' && absoluteIndex - 2 * gameState.nBackLevel >= 0) {
                    imageIndex = sequence[absoluteIndex - 2 * gameState.nBackLevel].imageIndex;
                    panelIndex = sequence[absoluteIndex - 2 * gameState.nBackLevel].panelIndex;
                    soundIndex = sequence[absoluteIndex - 2 * gameState.nBackLevel].soundIndex;
                    colorIndex = sequence[absoluteIndex - 2 * gameState.nBackLevel].colorIndex;
                }

                // 니얼미스가 N백 자극과 동일하지 않도록 검증
                const nBackStimulus = sequence[nBackIndex];
                const isValidNearMiss = !(
                    imageIndex === nBackStimulus.imageIndex &&
                    panelIndex === nBackStimulus.panelIndex &&
                    soundIndex === nBackStimulus.soundIndex &&
                    colorIndex === nBackStimulus.colorIndex
                );

                if (!isValidNearMiss) {
                    console.log(`%c[경고] 위치 ${absoluteIndex}: 니얼미스가 N백 타겟과 동일하여 생성 취소`, 'color: red');
                    isNearMiss = false;
                } else {
                    nearMissHistory.push({ type: nearMissType, index: absoluteIndex });
                    console.log(`generateStimulusSequence() - 니얼미스 생성 성공: 위치=${absoluteIndex}, 유형=${nearMissType}, nearMissHistory 길이=${nearMissHistory.length}`);
                }
            }
        }

        // 시퀀스에 자극 추가
        sequence.push({
            imageIndex, panelIndex, soundIndex, colorIndex,
            targetType, isSceneTarget, isLocationTarget, isSoundTarget, isColorTarget,
            isNearMiss
        });

        // 연속 non-target 추적
        if (!isSceneTarget && !isLocationTarget && !isSoundTarget && !isColorTarget) {
            consecutiveNonTargets++;
            console.log(`generateStimulusSequence() - non-target 연속 횟수: ${consecutiveNonTargets} at ${absoluteIndex}`);
        } else {
            consecutiveNonTargets = 0;
            console.log(`generateStimulusSequence() - 타겟 삽입으로 non-target 연속 초기화 at ${absoluteIndex}`);
        }

        updateRecentIndices("scene", imageIndex, recentLimit);
        updateRecentIndices("location", panelIndex, recentLimit);
        updateRecentIndices("sound", soundIndex, recentLimit);
        updateRecentIndices("color", colorIndex, recentLimit);
    }

    console.log("generateStimulusSequence() - [분석] 시퀸스 생성 완료: 길이=", sequence.length, "니얼미스 개수=", nearMissHistory.length);

    // 디버깅: 생성된 시퀀스의 상세 정보 출력
    console.log("%c[시퀀스 생성] 전체 시퀀스 길이: " + sequence.length, "color: blue");
    console.log("%c[시퀀스 생성] 생성된 시퀀스 내용:", "color: blue", sequence.map((s, idx) => ({
        index: idx,
        targetType: s.targetType,
        imageIndex: s.imageIndex,
        panelIndex: s.panelIndex,
        soundIndex: s.soundIndex,
        colorIndex: s.colorIndex,
        isSceneTarget: s.isSceneTarget,
        isLocationTarget: s.isLocationTarget,
        isSoundTarget: s.isSoundTarget,
        isColorTarget: s.isColorTarget
    })));

    // 속성값 빈도 분석
    const attrCounts = {
        imageIndex: {},
        panelIndex: {},
        soundIndex: {},
        colorIndex: {}
    };
    sequence.forEach(s => {
        attrCounts.imageIndex[s.imageIndex] = (attrCounts.imageIndex[s.imageIndex] || 0) + 1;
        attrCounts.panelIndex[s.panelIndex] = (attrCounts.panelIndex[s.panelIndex] || 0) + 1;
        attrCounts.soundIndex[s.soundIndex] = (attrCounts.soundIndex[s.soundIndex] || 0) + 1;
        attrCounts.colorIndex[s.colorIndex] = (attrCounts.colorIndex[s.colorIndex] || 0) + 1;
    });

    console.log("%c[시퀀스 생성] 속성값 빈도 분석:", "color: purple");
    for (const [attr, counts] of Object.entries(attrCounts)) {
        const frequent = Object.entries(counts).filter(([_, count]) => count >= 4);
        console.log(`  ${attr}: `, frequent.length > 0 
            ? frequent.map(([val, count]) => `${val}=${count}회`).join(", ")
            : "4회 이상 반복된 값 없음");
    }

    const patternAnalysisResult = analyzeAllPatterns(sequence);
    console.log("[분석][패턴] 최종 분석 결과 (전체):", patternAnalysisResult.overallCounts);
    console.log("[분석][패턴] 최종 분석 결과 (유형별):", patternAnalysisResult.typeCounts);
    console.log("[분석][패턴] 총 패턴 발생 횟수: " + patternAnalysisResult.totalPatterns);

    const { patternCounts } = analyzePatterns(sequence);
    console.log("%c패턴 분석 결과: A-B-A: %d, A-B-A-B: %d", "color: red", patternCounts["A-B-A"], patternCounts["A-B-A-B"]);

    return sequence;
}









// N+1 미리보기 함수 (안정성 확보)
function generateNextStimulusPreview(absoluteIndex, sequence, allTargets) {
    const nBackIndex = absoluteIndex - gameState.nBackLevel;
    const targetsAtPos = allTargets.filter(t => t.pos === absoluteIndex - gameState.nBackLevel);
    const recentLimit = gameState.nBackLevel * 2;

    let isSceneTarget = targetsAtPos.some(t => t.type === 'scene');
    let isLocationTarget = targetsAtPos.some(t => t.type === 'location');
    let isSoundTarget = targetsAtPos.some(t => t.type === 'sound');
    let isColorTarget = targetsAtPos.some(t => t.type === 'color');

    const imageIndex = isSceneTarget ? sequence[nBackIndex].imageIndex : selectIndexAvoidingRecent(gameState.recentSceneIndices, imageTextures.length, recentLimit);
    const panelIndex = isLocationTarget ? sequence[nBackIndex].panelIndex : selectIndexAvoidingRecent(gameState.recentLocationIndices, panels.length, recentLimit);
    const soundIndex = isSoundTarget ? sequence[nBackIndex].soundIndex : selectIndexAvoidingRecent(gameState.recentSoundIndices, gameState.pianoTones.length, recentLimit);
    const colorIndex = isColorTarget ? sequence[nBackIndex].colorIndex : selectIndexAvoidingRecent(gameState.recentColorIndices, distinctColors.length, recentLimit);

    return { imageIndex, panelIndex, soundIndex, colorIndex };
}
























// 타겟 위치를 선정하는 함수 (패턴 방지 및 안정성 강화)
function selectTargetPositions(intervalStimuli, targetCount, minInterval) {
    console.log(`selectTargetPositions() - 타겟 위치 선정 시작: 구간 자극 수=${intervalStimuli}, 타겟 수=${targetCount}, 최소 간격=${minInterval}`);
    const positions = [];
    let attempts = 0;
    const maxAttempts = 200;

    while (attempts < maxAttempts) {
        const availablePositions = Array.from({ length: intervalStimuli }, (_, i) => i);
        shuffleArray(availablePositions);

        while (positions.length < targetCount && availablePositions.length > 0) {
            const pos = availablePositions.pop();
            if (positions.every(p => Math.abs(p - pos) >= minInterval)) {
                positions.push(pos);
            }
        }

        if (positions.length < targetCount) {
            console.warn(`selectTargetPositions() - 모든 타겟 배치 불가: 배치된 타겟 ${positions.length}/${targetCount}`);
            return positions.sort((a, b) => a - b);
        }

        positions.sort((a, b) => a - b);
        const diffs = positions.slice(1).map((p, i) => p - positions[i]);
        const isEqualInterval = diffs.length > 1 && diffs.every(d => d === diffs[0]);
        const isConsecutive = diffs.some(d => d === 1);
        const isCyclic = checkCyclicPattern(positions);

        console.log(`selectTargetPositions() - 시도 ${attempts + 1}: 위치=${positions}, 간격=${diffs}`);

        if (!isConsecutive && !isCyclic && (!isEqualInterval || diffs.length <= 2)) {
            console.log(`selectTargetPositions() - 성공: 위치=${positions}, 시도 횟수=${attempts}`);
            return positions;
        }

        positions.length = 0; // 실패 시 초기화
        attempts++;
    }

    console.error(`selectTargetPositions() - ${maxAttempts}번 시도 후 실패`);
    return [];
}


// 주기적 패턴 감지 함수
function checkCyclicPattern(positions) {
    if (positions.length < 4) return false;
    for (let i = 0; i < positions.length - 3; i++) {
        const seq = positions.slice(i, i + 4);
        const diffs = seq.slice(1).map((p, idx) => p - seq[idx]);
        if (diffs[0] === diffs[2] && diffs[0] !== diffs[1]) { // A-B-C-A 패턴 체크
            console.log(`checkCyclicPattern() - Cyclic pattern found: ${seq}, Diffs: ${diffs}`);
            return true;
        }
    }
    return false;
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


function analyzePatterns(sequence) {
    const patternCounts = {
        "A-B-A": 0,
        "A-B-A-B": 0
    };

    const targetTypeSequence = sequence.map(s => s.targetType);

    // A-B-A 패턴 분석
    for (let i = 2; i < targetTypeSequence.length; i++) {
        const last3 = targetTypeSequence.slice(i - 2, i + 1);
        if (last3[0] === last3[2] && last3[0] !== last3[1] && last3[0] !== "non-target" && last3[2] !== "non-target") {
            patternCounts["A-B-A"]++;
        }
    }

    // A-B-A-B 패턴 분석
    for (let i = 3; i < targetTypeSequence.length; i++) {
        const last4 = targetTypeSequence.slice(i - 3, i + 1);
        if (last4[0] === last4[2] && last4[1] === last4[3] && last4[0] !== last4[1] && last4[0] !== "non-target" && last4[2] !== "non-target") {
            patternCounts["A-B-A-B"]++;
        }
    }

    // 디버깅: 패턴 분석 결과를 빨간색으로 출력
    console.log("%c패턴 분석 결과: A-B-A: %d, A-B-A-B: %d", "color: red", patternCounts["A-B-A"], patternCounts["A-B-A-B"]);
    console.log(`analyzePatterns() - 패턴 분석 완료:`, patternCounts);
    return { patternCounts };
}





// 패턴 분석 함수: 시퀀스의 패턴 유형과 횟수를 계산
// A-B-A: 동일한 타겟 유형이 한 자극을 사이에 두고 반복되는 경우
// A-B-A-B: 두 쌍의 타겟 유형이 교차 반복되는 경우
// 추가: 속성별 빈도 및 타겟 분포 패턴 분석
function analyzeAllPatterns(sequence) {
    // 초기화: 전체 및 각 자극 유형별 패턴 카운트 객체 생성
    const overallCounts = { "A-A": 0, "A-B-A": 0, "A-B-A-B": 0 };
    const types = ['scene', 'location', 'sound', 'color'];
    const typeCounts = {
        scene: { "A-A": 0, "A-B-A": 0, "A-B-A-B": 0 },
        location: { "A-A": 0, "A-B-A": 0, "A-B-A-B": 0 },
        sound: { "A-A": 0, "A-B-A": 0, "A-B-A-B": 0 },
        color: { "A-A": 0, "A-B-A": 0, "A-B-A-B": 0 }
    };

    // 속성별 빈도 및 위치 추적 객체
    const attributeCounts = {
        imageIndex: {},
        panelIndex: {},
        soundIndex: {},
        colorIndex: {}
    };

    // 타겟 분포 패턴 카운트 객체
    const distributionPatterns = {
        "DoubleTarget": 0, // T-T-N: 연속 타겟 후 논타겟
        "LateDouble": 0,   // N-N-T-T: 논타겟 연속 후 타겟 쌍
        "Alternating": 0,  // N-T-N-T: 논타겟과 타겟 교차
        "TripleNonTarget": 0 // N-N-N-T: 논타겟 3개 후 타겟
    };
    const patternPositions = { // 패턴 발생 위치 기록
        "DoubleTarget": [],
        "LateDouble": [],
        "Alternating": [],
        "TripleNonTarget": []
    };

    // Helper: 타겟 유효성 판단
    function isValidTarget(targetType) {
        return targetType !== "non-target" && targetType !== "initial";
    }

    // 입력 데이터 점검
    if (!sequence || sequence.length === 0) {
        console.log("%c[분석][오류] 시퀀스가 비어있거나 유효하지 않음", "color: red");
        return { overallCounts, typeCounts, totalPatterns: 0 };
    }
    console.log(`%c[분석][입력] 시퀀스 길이: ${sequence.length}, 내용:`, "color: blue", sequence.map(s => ({
        targetType: s.targetType || "non-target",
        imageIndex: s.imageIndex,
        panelIndex: s.panelIndex,
        soundIndex: s.soundIndex,
        colorIndex: s.colorIndex
    })));

    // 전체 시퀀스에 대해 분석
    const targetTypeSequence = sequence.map(s => s.targetType || "non-target");
    const len = targetTypeSequence.length;

    // A-A 패턴 분석
    for (let i = 1; i < len; i++) {
        const prev = targetTypeSequence[i - 1];
        const curr = targetTypeSequence[i];
        if (isValidTarget(prev) && isValidTarget(curr) && prev === curr) {
            overallCounts["A-A"]++;
            if (types.includes(curr)) typeCounts[curr]["A-A"]++;
        }
    }

    // A-B-A 패턴 분석
    for (let i = 2; i < len; i++) {
        const first = targetTypeSequence[i - 2];
        const middle = targetTypeSequence[i - 1];
        const last = targetTypeSequence[i];
        if (isValidTarget(first) && isValidTarget(middle) && isValidTarget(last) &&
            first === last && first !== middle) {
            overallCounts["A-B-A"]++;
            if (types.includes(first)) typeCounts[first]["A-B-A"]++;
        }
    }

    // A-B-A-B 패턴 분석
    for (let i = 3; i < len; i++) {
        const t0 = targetTypeSequence[i - 3];
        const t1 = targetTypeSequence[i - 2];
        const t2 = targetTypeSequence[i - 1];
        const t3 = targetTypeSequence[i];
        if (isValidTarget(t0) && isValidTarget(t1) && isValidTarget(t2) && isValidTarget(t3) &&
            t0 === t2 && t1 === t3 && t0 !== t1) {
            overallCounts["A-B-A-B"]++;
            if (types.includes(t0)) typeCounts[t0]["A-B-A-B"]++;
        }
    }

    // 속성별 빈도 계산
    sequence.forEach((stimulus, index) => {
        ['imageIndex', 'panelIndex', 'soundIndex', 'colorIndex'].forEach(attr => {
            const value = stimulus[attr] !== undefined ? stimulus[attr] : -1;
            if (!attributeCounts[attr][value]) {
                attributeCounts[attr][value] = { count: 0, positions: [] };
            }
            attributeCounts[attr][value].count++;
            attributeCounts[attr][value].positions.push(index);
        });
    });

    // 속성별 중간 결과 디버깅
    console.log("%c[분석][중간] 속성별 빈도 계산 결과:", "color: purple", attributeCounts);

    // 타겟 분포 패턴 분석
    if (len < 4) {
        console.log("%c[분석][경고] 시퀀스 길이가 4 미만이라 타겟 분포 패턴 분석 불가", "color: orange");
    } else {
        for (let i = 3; i < len; i++) {
            const t0 = targetTypeSequence[i - 3];
            const t1 = targetTypeSequence[i - 2];
            const t2 = targetTypeSequence[i - 1];
            const t3 = targetTypeSequence[i];

            if (!isValidTarget(t0) && isValidTarget(t1) && !isValidTarget(t2) && isValidTarget(t3)) {
                distributionPatterns["Alternating"]++;
                patternPositions["Alternating"].push(i - 3);
                console.log(`%c[분석][패턴] Alternating 발견: 위치 ${i - 3}, 시퀀스 [${t0},${t1},${t2},${t3}]`, "color: green");
                continue;
            }

            if (!isValidTarget(t0) && !isValidTarget(t1) && isValidTarget(t2) && isValidTarget(t3)) {
                distributionPatterns["LateDouble"]++;
                patternPositions["LateDouble"].push(i - 3);
                console.log(`%c[분석][패턴] LateDouble 발견: 위치 ${i - 3}, 시퀀스 [${t0},${t1},${t2},${t3}]`, "color: green");
                continue;
            }

            if (!isValidTarget(t0) && !isValidTarget(t1) && !isValidTarget(t2) && isValidTarget(t3)) {
                distributionPatterns["TripleNonTarget"]++;
                patternPositions["TripleNonTarget"].push(i - 3);
                console.log(`%c[분석][패턴] TripleNonTarget 발견: 위치 ${i - 3}, 시퀀스 [${t0},${t1},${t2},${t3}]`, "color: green");
                continue;
            }

            if (i - 2 >= 0) {
                const prev2 = targetTypeSequence[i - 2];
                const prev1 = targetTypeSequence[i - 1];
                const curr = targetTypeSequence[i];
                if (isValidTarget(prev2) && isValidTarget(prev1) && !isValidTarget(curr)) {
                    distributionPatterns["DoubleTarget"]++;
                    patternPositions["DoubleTarget"].push(i - 2);
                    console.log(`%c[분석][패턴] DoubleTarget 발견: 위치 ${i - 2}, 시퀀스 [${prev2},${prev1},${curr}]`, "color: green");
                }
            }
        }
    }

    // 총합 계산
    const totalPatterns = overallCounts["A-A"] + overallCounts["A-B-A"] + overallCounts["A-B-A-B"];

    // 기존 로그 출력
    console.log("%c[분석] 전체 패턴 분석 결과 - A-A: " + overallCounts["A-A"] +
        ", A-B-A: " + overallCounts["A-B-A"] +
        ", A-B-A-B: " + overallCounts["A-B-A-B"] +
        " (총합: " + totalPatterns + ")", "color: blue");
    types.forEach(type => {
        const subTotal = typeCounts[type]["A-A"] + typeCounts[type]["A-B-A"] + typeCounts[type]["A-B-A-B"];
        console.log("%c[분석] " + type + " 패턴 분석 결과 - A-A: " + typeCounts[type]["A-A"] +
            ", A-B-A: " + typeCounts[type]["A-B-A"] +
            ", A-B-A-B: " + typeCounts[type]["A-B-A-B"] +
            " (총합: " + subTotal + ")", "color: green");
    });

    // 수정: 속성별 빈도 로그 개선 - 중간 점검 및 단순화된 출력
    ['imageIndex', 'panelIndex', 'soundIndex', 'colorIndex'].forEach(attr => {
        const allValues = Object.entries(attributeCounts[attr])
            .map(([value, data]) => ({
                value,
                count: data.count,
                positions: data.positions,
                avgInterval: data.positions.length > 1
                    ? (data.positions[data.positions.length - 1] - data.positions[0]) / (data.positions.length - 1)
                    : 0
            }))
            .sort((a, b) => b.count - a.count); // 빈도 내림차순 정렬

        // 주석: 중간 점검 로그 추가
        console.log(`%c[분석][패턴] ${attr} 빈도 값 계산 완료 - 항목 수: ${allValues.length}`, "color: purple", allValues);

        // 주석: 출력 단순화 - 스타일링 최소화, 한 번에 출력
        console.log(`[분석][패턴] ${attr} 모든 빈도 값:`);
        console.log(allValues.map(v => 
            `  값=${v.value}, 횟수=${v.count}${v.count >= 4 ? ' (빈도 높음)' : ''}, 위치=[${v.positions.join(", ")}], 평균 간격=${v.avgInterval.toFixed(2)}`
        ).join("\n"));
    });

    // 수정: 타겟 분포 패턴 로그 개선 - 중간 점검 및 단순화된 출력
    // 주석: 중간 점검 로그 추가
    console.log("%c[분석][패턴] 타겟 분포 패턴 계산 완료:", "color: orange", { distributionPatterns, patternPositions });

    // 주석: 출력 단순화 - 스타일링 최소화, 한 번에 출력
    console.log(`[분석][패턴] 타겟 분포 패턴 분석 결과:`);
    console.log(Object.entries(distributionPatterns).map(([pattern, count]) => 
        `  ${pattern}: ${count}회 (위치: ${patternPositions[pattern].join(", ") || "없음"})`
    ).join("\n"));

    return { overallCounts, typeCounts, totalPatterns };
}











function findProblematicPositions(sequence) {
    const problematicPositions = [];
    const targetTypeSequence = sequence.map(s => s.targetType);

    // A-B-A 패턴에 대한 문제 위치 탐지 (중간 위치)
    for (let i = 2; i < targetTypeSequence.length; i++) {
        const first = targetTypeSequence[i - 2];
        const middle = targetTypeSequence[i - 1];
        const last = targetTypeSequence[i];
        if (first === last && first !== middle && first !== "non-target" && first !== "initial") {
            problematicPositions.push(i - 1);
            console.log("[분석][패턴] A-B-A 패턴 문제 위치 발견: 인덱스 " + (i - 1));
        }
    }

    // A-B-A-B 패턴에 대한 문제 위치 탐지 (두 번째 그룹의 첫 번째 위치)
    for (let i = 3; i < targetTypeSequence.length; i++) {
        const t0 = targetTypeSequence[i - 3];
        const t1 = targetTypeSequence[i - 2];
        const t2 = targetTypeSequence[i - 1];
        const t3 = targetTypeSequence[i];
        if (t0 === t2 && t1 === t3 && t0 !== t1 && t0 !== "non-target" && t0 !== "initial") {
            problematicPositions.push(i - 2);
            console.log("[분석][패턴] A-B-A-B 패턴 문제 위치 발견: 인덱스 " + (i - 2));
        }
    }

    // 중복 제거 후 반환
    const uniquePositions = [...new Set(problematicPositions)];
    console.log("[분석][패턴] 최종 문제점 위치 목록: ", uniquePositions);
    return uniquePositions;
}






function adjustTargetPositions(sequence, problematicPositions) {
    // 타겟 유형 후보 (타겟 생성 로직과 일치해야 함)
    const targetTypes = ['scene', 'location', 'sound', 'color'];
    problematicPositions.forEach(pos => {
        const currentType = sequence[pos].targetType;
        // 현재 타겟과 다른 후보 중에서 무작위 선택
        const newCandidates = targetTypes.filter(t => t !== currentType);
        const newTargetType = newCandidates[Math.floor(Math.random() * newCandidates.length)];
        // 변경 전/후 정보를 기록 (디버깅 로그에 "분석"과 "패턴" 포함)
        console.log("[분석][패턴] adjustTargetPositions() - 위치 " + pos +
            " 변경: " + currentType + " -> " + newTargetType);
        sequence[pos].targetType = newTargetType;
        // 각 자극 유형에 따른 플래그 재설정 (필요시 기존 로직과 동일하게 처리)
        sequence[pos].isSceneTarget = newTargetType === 'scene';
        sequence[pos].isLocationTarget = newTargetType === 'location';
        sequence[pos].isSoundTarget = newTargetType === 'sound';
        sequence[pos].isColorTarget = newTargetType === 'color';
    });
}







function updateGameCounters() {
    console.log("updateGameCounters() - 게임 카운터 업데이트 시작: totalGamesToday=", gameState.totalGamesToday, "consecutiveGames=", gameState.consecutiveGames);
    document.getElementById('totalGamesTodayCountValue').textContent = gameState.totalGamesToday;
    document.getElementById('consecutiveGamesCount').textContent = gameState.consecutiveGames;
    localStorage.setItem('totalGamesToday', gameState.totalGamesToday);
    localStorage.setItem('consecutiveGames', gameState.consecutiveGames);
    console.log("updateGameCounters() - UI 및 로컬 스토리지 업데이트 완료, timestamp=", Date.now());
}






function endBlock() {
    console.log("endBlock() - 블록 종료 시작: currentBlock=", gameState.currentBlock, "maxBlocks=", gameState.maxBlocks, "timestamp=", Date.now());
    gameState.isPlaying = false;
    cancelAllTimers();
    clearAllStimuli();
    stopSound();

    console.log("endBlock() - 타겟 및 에러 통계:", {
        sceneTargets: gameState.sceneTargets,
        sceneErrors: gameState.sceneErrors,
        locationTargets: gameState.locationTargets,
        locationErrors: gameState.locationErrors,
        soundTargets: gameState.soundTargets,
        soundErrors: gameState.soundErrors,
        colorTargets: gameState.colorTargets,
        colorErrors: gameState.colorErrors,
        nearMissResponses: gameState.nearMissResponses,
        nearMissHistoryLength: nearMissHistory.length
    });

    const totalTargets = gameState.sceneTargets + gameState.locationTargets + gameState.soundTargets + gameState.colorTargets;
    const totalErrors = gameState.sceneErrors + gameState.locationErrors + gameState.soundErrors + gameState.colorErrors;
    const totalAccuracy = totalTargets > 0 ? (1 - totalErrors / totalTargets) * 100 : 100;
    gameState.accuracyHistory.push(totalAccuracy);

    console.log("endBlock() - 정확도 계산: totalTargets=", totalTargets, "totalErrors=", totalErrors, "totalAccuracy=", totalAccuracy.toFixed(2) + "%");

    if (!gameState.isLevelLocked && gameState.currentBlock >= gameState.maxBlocks - 1) {
        const recentAccuracy = gameState.accuracyHistory.slice(-3).reduce((a, b) => a + b, 0) / Math.min(gameState.accuracyHistory.length, 3);
        console.log("endBlock() - 최근 3개 블록 평균 정확도:", recentAccuracy.toFixed(2) + "%");

        let levelChangeText = '';
        if (recentAccuracy > 90 && gameState.nBackLevel < 9) {
            gameState.nBackLevel++;
            levelChangeText = `레벨 업! ${gameState.nBackLevel}-Back으로 상승`;
            console.log("endBlock() - 레벨 업 조건 충족, 새 레벨:", gameState.nBackLevel);
        } else if (recentAccuracy < 70 && gameState.nBackLevel > 1) {
            gameState.nBackLevel--;
            levelChangeText = `레벨 다운... ${gameState.nBackLevel}-Back으로 하락`;
            console.log("endBlock() - 레벨 다운 조건 충족, 새 레벨:", gameState.nBackLevel);
        } else {
            levelChangeText = `${gameState.nBackLevel}-Back 유지`;
            console.log("endBlock() - 레벨 변경 조건 미충족, 현재 레벨 유지:", gameState.nBackLevel);
        }
        document.getElementById('levelChange').textContent = levelChangeText;
        localStorage.setItem('nBackLevel', gameState.nBackLevel);
    }

    document.getElementById('resultNLevel').textContent = gameState.nBackLevel;
    document.getElementById('sceneErrors').textContent = gameState.sceneErrors;
    document.getElementById('locationErrors').textContent = gameState.locationErrors;
    document.getElementById('soundErrors').textContent = gameState.soundErrors;
    document.getElementById('colorErrors').textContent = gameState.colorErrors;

    const nearMissPercentage = nearMissHistory.length > 0 ? (gameState.nearMissResponses / nearMissHistory.length * 100).toFixed(2) : "0.00";
    document.getElementById('nearMissStats').textContent = `니얼미스 반응: ${gameState.nearMissResponses}/${nearMissHistory.length} (${nearMissPercentage}%)`;
    console.log("endBlock() - 니얼미스 통계 업데이트:", {
        responses: gameState.nearMissResponses,
        total: nearMissHistory.length,
        percentage: nearMissPercentage + "%"
    });

    const resultScreen = document.getElementById('resultScreen');
    const resultBackgroundImage = document.getElementById('resultBackgroundImage');
    if (gameState.resultImageUrl) {
        resultBackgroundImage.style.backgroundImage = `url(${gameState.resultImageUrl})`;
        resultBackgroundImage.style.backgroundSize = 'cover';
        resultBackgroundImage.style.backgroundPosition = 'center';
        console.log("endBlock() - 결과 배경 이미지 설정됨:", gameState.resultImageUrl);
    } else {
        resultBackgroundImage.style.backgroundImage = 'none';
        console.log("endBlock() - 결과 배경 이미지 없음");
    }

    if (resultScreen.style.display !== 'flex') {
        resultScreen.style.display = 'flex';
        console.log("endBlock() - 결과 화면 표시됨");
    }

    // 게임 종료 시 카운터 업데이트
    gameState.totalGamesToday++;
    gameState.consecutiveGames++;
    localStorage.setItem('lastGameTimestamp', Date.now().toString());
    updateGameCounters(); // 통합된 카운터 업데이트 함수 호출
    console.log("endBlock() - 게임 종료 후 카운터 업데이트 완료: totalGamesToday=", gameState.totalGamesToday, "consecutiveGames=", gameState.consecutiveGames);

    gameState.currentBlock++;
    if (gameState.currentBlock >= gameState.maxBlocks) {
        gameState.currentBlock = 0;
        console.log("endBlock() - 최대 블록 도달, currentBlock 초기화:", gameState.currentBlock);
    }

    resetGameStateForNewBlock();
    console.log("endBlock() - 블록 종료 완료, 상태 리셋 후 준비됨, timestamp=", Date.now());
}





function showTitleScreen() {
    console.log("showTitleScreen() - 타이틀 화면 표시 시작, timestamp=", Date.now());
    cancelAllTimers();
    clearAllStimuli();
    stopSound();
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.consecutiveGames = 0; // 타이틀 화면으로 돌아가면 연속 게임 횟수 리셋
    updateGameCounters(); // 카운터 업데이트
    console.log("showTitleScreen() - 연속 게임 횟수 리셋됨: consecutiveGames=", gameState.consecutiveGames);

    const titleScreen = document.getElementById('titleScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultScreen = document.getElementById('resultScreen');
    const pauseScreen = document.getElementById('pauseScreen');
    const settingsPanel = document.getElementById('settingsPanel');

    if (titleScreen && gameScreen && resultScreen && pauseScreen && settingsPanel) {
        titleScreen.style.display = 'block';
        gameScreen.style.display = 'none';
        resultScreen.style.display = 'none';
        pauseScreen.style.display = 'none';
        settingsPanel.style.display = 'none';
        console.log("showTitleScreen() - 모든 화면 상태 업데이트됨");
    } else {
        console.error("showTitleScreen() - 일부 화면 요소를 찾을 수 없음", {
            titleScreen: !!titleScreen,
            gameScreen: !!gameScreen,
            resultScreen: !!resultScreen,
            pauseScreen: !!pauseScreen,
            settingsPanel: !!settingsPanel
        });
    }

    document.getElementById('nBackLevel').textContent = gameState.nBackLevel;
    document.getElementById('customLevel').value = gameState.nBackLevel;
    console.log("showTitleScreen() - 타이틀 화면 표시 완료: nBackLevel=", gameState.nBackLevel, "timestamp=", Date.now());
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
        const resultScreen = document.getElementById('resultScreen');
        if (resultScreen) {
            resultScreen.style.display = 'none';
            console.log("pressSpaceResult - resultScreen hidden successfully");
        } else {
            console.error("pressSpaceResult - resultScreen element not found in DOM");
        }
        startBlock();
        console.log("pressSpaceResult - Clicked '게임 계속', starting new block", {
            timestamp: Date.now()
        });
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

// 기존 click 이벤트 유지
sceneIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("scene") && !gameState.sceneTargetProcessed && gameState.canRespondScene) {
        handleSceneResponse();
    }
});

locationIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("location") && !gameState.locationTargetProcessed && gameState.canRespondLocation) {
        handleLocationResponse();
    }
});

soundIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("sound") && !gameState.soundTargetProcessed && gameState.canRespondSound) {
        handleSoundResponse();
    }
});

colorIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("color") && !gameState.colorTargetProcessed && gameState.canRespondColor) {
        handleColorResponse();
    }
});

// touchstart 이벤트 추가
sceneIndicator.addEventListener('touchstart', (e) => {
    e.preventDefault(); // 기본 동작 방지 (줌 등)
    if (gameState.isPlaying && gameState.stimulusTypes.includes("scene") && !gameState.sceneTargetProcessed && gameState.canRespondScene) {
        handleSceneResponse();
        console.log("touchstart - Scene touched, touches:", e.touches.length, "timestamp:", Date.now());
    }
});

locationIndicator.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.isPlaying && gameState.stimulusTypes.includes("location") && !gameState.locationTargetProcessed && gameState.canRespondLocation) {
        handleLocationResponse();
        console.log("touchstart - Location touched, touches:", e.touches.length, "timestamp:", Date.now());
    }
});

soundIndicator.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.isPlaying && gameState.stimulusTypes.includes("sound") && !gameState.soundTargetProcessed && gameState.canRespondSound) {
        handleSoundResponse();
        console.log("touchstart - Sound touched, touches:", e.touches.length, "timestamp:", Date.now());
    }
});

colorIndicator.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.isPlaying && gameState.stimulusTypes.includes("color") && !gameState.colorTargetProcessed && gameState.canRespondColor) {
        handleColorResponse();
        console.log("touchstart - Color touched, touches:", e.touches.length, "timestamp:", Date.now());
    }
});

// ⏸️ 일시정지 버튼 이벤트
document.getElementById('pauseBtn').addEventListener('click', pauseGame);

// ⏸️ 게임 재개 버튼 이벤트
document.getElementById('resumeGameBtn').addEventListener('click', resumeGame);

// ⏸️ 메인 메뉴로 돌아가기 버튼 이벤트
document.getElementById('mainMenuBtn').addEventListener('click', () => {
    console.log("mainMenuBtn clicked"); // 클릭 확인용 로그
    showTitleScreen();
});

document.getElementById('mainMenuResultBtn').addEventListener('click', () => {
    console.log("mainMenuResultBtn 클릭됨 - 메인메뉴로 이동 시작"); // 디버깅: 클릭 감지
    showTitleScreen();
    console.log("mainMenuResultBtn - showTitleScreen 호출 완료"); // 디버깅: 호출 확인
});



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
    console.log("populateSettings() - 설정 패널 UI 반영 시작, 타임스탬프:", Date.now());

    document.getElementById('sceneStimulus').checked = gameState.stimulusTypes.includes('scene');
    document.getElementById('locationStimulus').checked = gameState.stimulusTypes.includes('location');
    document.getElementById('soundStimulus').checked = gameState.stimulusTypes.includes('sound');
    document.getElementById('colorStimulus').checked = gameState.stimulusTypes.includes('color');
    document.getElementById('stimuliPerBlock').value = gameState.stimuliPerBlock;
    document.getElementById('stimulusDuration').value = gameState.stimulusDuration;
    document.getElementById('stimulusInterval').value = gameState.stimulusInterval;
    document.getElementById('patternPreventionStrength').value = gameState.patternPreventionStrength;
    document.getElementById('minTargetInterval').value = gameState.minTargetInterval;
    document.getElementById('maxTargetInterval').value = gameState.maxTargetInterval;
    document.getElementById('nearMissProbability').value = gameState.nearMissProbability;
    document.getElementById('imageSourceUrl').value = gameState.imageSourceUrl;
    document.getElementById('resultImageUrl').value = gameState.resultImageUrl;
    document.getElementById('soundSourceSelect').value = gameState.soundSource;
    document.getElementById('soundSourceUrl').value = gameState.soundSourceUrl;
    document.getElementById('sceneKey').value = gameState.sceneKey;
    document.getElementById('locationKey').value = gameState.locationKey;
    document.getElementById('soundKey').value = gameState.soundKey;
    document.getElementById('colorKey').value = gameState.colorKey;
    document.getElementById('buttonBgColor').value = gameState.buttonStyles.bgColor;
    document.getElementById('buttonBgOpacity').value = gameState.buttonStyles.bgOpacity;
    document.getElementById('buttonTextColor').value = gameState.buttonStyles.textColor;
    document.getElementById('buttonTextOpacity').value = gameState.buttonStyles.textOpacity;
    document.getElementById('buttonWidth').value = gameState.buttonStyles.width;
    document.getElementById('buttonHeight').value = gameState.buttonStyles.height;

    // 새로 추가된 UI 반영
    document.getElementById('randomizeInterval').checked = gameState.randomizeInterval;
    document.getElementById('minInterval').value = gameState.minInterval;
    document.getElementById('maxInterval').value = gameState.maxInterval;

    document.getElementById('button1Left').value = parseInt(sceneIndicator.style.left) || 20;
    document.getElementById('button1Bottom').value = parseInt(sceneIndicator.style.bottom) || 20;
    document.getElementById('button2Left').value = parseInt(soundIndicator.style.left) || 120;
    document.getElementById('button2Bottom').value = parseInt(soundIndicator.style.bottom) || 20;
    document.getElementById('button3Right').value = parseInt(locationIndicator.style.right) || 120;
    document.getElementById('button3Bottom').value = parseInt(locationIndicator.style.bottom) || 20;
    document.getElementById('button4Right').value = parseInt(colorIndicator.style.right) || 20;
    document.getElementById('button4Bottom').value = parseInt(colorIndicator.style.bottom) || 20;

    document.getElementById('useCeilingPanels').checked = gameState.useCeilingPanels;
    document.getElementById('useFloorPanels').checked = gameState.useFloorPanels;

    const ceilingPanel1 = gameState.panelPositionsCustom[8] || panelPositions[8] || { x: 0, y: 0, z: 0, rotation: [0, 0, 0] };
    document.getElementById('ceilingPanel1X').value = ceilingPanel1.x ?? 0;
    document.getElementById('ceilingPanel1Y').value = ceilingPanel1.y ?? 0;
    document.getElementById('ceilingPanel1Z').value = ceilingPanel1.z ?? 0;
    document.getElementById('ceilingPanel1RotX').value = ((ceilingPanel1.rotation?.[0] ?? 0) * 180 / Math.PI).toFixed(1);
    document.getElementById('ceilingPanel1RotY').value = ((ceilingPanel1.rotation?.[1] ?? 0) * 180 / Math.PI).toFixed(1);
    document.getElementById('ceilingPanel1RotZ').value = ((ceilingPanel1.rotation?.[2] ?? 0) * 180 / Math.PI).toFixed(1);

    const ceilingPanel2 = gameState.panelPositionsCustom[9] || panelPositions[9] || { x: 0, y: 0, z: 0, rotation: [0, 0, 0] };
    document.getElementById('ceilingPanel2X').value = ceilingPanel2.x ?? 0;
    document.getElementById('ceilingPanel2Y').value = ceilingPanel2.y ?? 0;
    document.getElementById('ceilingPanel2Z').value = ceilingPanel2.z ?? 0;
    document.getElementById('ceilingPanel2RotX').value = ((ceilingPanel2.rotation?.[0] ?? 0) * 180 / Math.PI).toFixed(1);
    document.getElementById('ceilingPanel2RotY').value = ((ceilingPanel2.rotation?.[1] ?? 0) * 180 / Math.PI).toFixed(1);
    document.getElementById('ceilingPanel2RotZ').value = ((ceilingPanel2.rotation?.[2] ?? 0) * 180 / Math.PI).toFixed(1);

    const floorPanel1 = gameState.panelPositionsCustom[10] || panelPositions[10] || { x: 0, y: 0, z: 0, rotation: [0, 0, 0] };
    document.getElementById('floorPanel1X').value = floorPanel1.x ?? 0;
    document.getElementById('floorPanel1Y').value = floorPanel1.y ?? 0;
    document.getElementById('floorPanel1Z').value = floorPanel1.z ?? 0;
    document.getElementById('floorPanel1RotX').value = ((floorPanel1.rotation?.[0] ?? 0) * 180 / Math.PI).toFixed(1);
    document.getElementById('floorPanel1RotY').value = ((floorPanel1.rotation?.[1] ?? 0) * 180 / Math.PI).toFixed(1);
    document.getElementById('floorPanel1RotZ').value = ((floorPanel1.rotation?.[2] ?? 0) * 180 / Math.PI).toFixed(1);

    const floorPanel2 = gameState.panelPositionsCustom[11] || panelPositions[11] || { x: 0, y: 0, z: 0, rotation: [0, 0, 0] };
    document.getElementById('floorPanel2X').value = floorPanel2.x ?? 0;
    document.getElementById('floorPanel2Y').value = floorPanel2.y ?? 0;
    document.getElementById('floorPanel2Z').value = floorPanel2.z ?? 0;
    document.getElementById('floorPanel2RotX').value = ((floorPanel2.rotation?.[0] ?? 0) * 180 / Math.PI).toFixed(1);
    document.getElementById('floorPanel2RotY').value = ((floorPanel2.rotation?.[1] ?? 0) * 180 / Math.PI).toFixed(1);
    document.getElementById('floorPanel2RotZ').value = ((floorPanel2.rotation?.[2] ?? 0) * 180 / Math.PI).toFixed(1);

    console.log("populateSettings() - 설정 패널에 인디케이터 위치 반영:", {
        scene: { left: document.getElementById('button1Left').value, bottom: document.getElementById('button1Bottom').value },
        sound: { left: document.getElementById('button2Left').value, bottom: document.getElementById('button2Bottom').value },
        location: { right: document.getElementById('button3Right').value, bottom: document.getElementById('button3Bottom').value },
        color: { right: document.getElementById('button4Right').value, bottom: document.getElementById('button4Bottom').value },
        timestamp: Date.now()
    });

    console.log("populateSettings() - 패널 설정 UI에 반영:", {
        useCeilingPanels: document.getElementById('useCeilingPanels').checked,
        useFloorPanels: document.getElementById('useFloorPanels').checked,
        ceilingPanel1: {
            x: document.getElementById('ceilingPanel1X').value,
            y: document.getElementById('ceilingPanel1Y').value,
            z: document.getElementById('ceilingPanel1Z').value,
            rotX: document.getElementById('ceilingPanel1RotX').value,
            rotY: document.getElementById('ceilingPanel1RotY').value,
            rotZ: document.getElementById('ceilingPanel1RotZ').value
        },
        ceilingPanel2: {
            x: document.getElementById('ceilingPanel2X').value,
            y: document.getElementById('ceilingPanel2Y').value,
            z: document.getElementById('ceilingPanel2Z').value,
            rotX: document.getElementById('ceilingPanel2RotX').value,
            rotY: document.getElementById('ceilingPanel2RotY').value,
            rotZ: document.getElementById('ceilingPanel2RotZ').value
        },
        floorPanel1: {
            x: document.getElementById('floorPanel1X').value,
            y: document.getElementById('floorPanel1Y').value,
            z: document.getElementById('floorPanel1Z').value,
            rotX: document.getElementById('floorPanel1RotX').value,
            rotY: document.getElementById('floorPanel1RotY').value,
            rotZ: document.getElementById('floorPanel1RotZ').value
        },
        floorPanel2: {
            x: document.getElementById('floorPanel2X').value,
            y: document.getElementById('floorPanel2Y').value,
            z: document.getElementById('floorPanel2Z').value,
            rotX: document.getElementById('floorPanel2RotX').value,
            rotY: document.getElementById('floorPanel2RotY').value,
            rotZ: document.getElementById('floorPanel2RotZ').value
        },
        timestamp: Date.now()
    });

    console.log("populateSettings() - panelPositionsCustom 상태:", gameState.panelPositionsCustom);
    console.log("populateSettings() - UI에 설정값 반영 완료:", { 
        stimulusTypes: gameState.stimulusTypes,
        stimuliPerBlock: gameState.stimuliPerBlock,
        stimulusDuration: gameState.stimulusDuration,
        stimulusInterval: gameState.stimulusInterval,
        patternPreventionStrength: gameState.patternPreventionStrength,
        minTargetInterval: gameState.minTargetInterval,
        maxTargetInterval: gameState.maxTargetInterval,
        nearMissProbability: gameState.nearMissProbability,
        imageSourceUrl: gameState.imageSourceUrl,
        resultImageUrl: gameState.resultImageUrl,
        soundSource: gameState.soundSource,
        soundSourceUrl: gameState.soundSourceUrl,
        sceneKey: gameState.sceneKey,
        locationKey: gameState.locationKey,
        soundKey: gameState.soundKey,
        colorKey: gameState.colorKey,
        buttonStyles: gameState.buttonStyles,
        randomizeInterval: gameState.randomizeInterval,
        minInterval: gameState.minInterval,
        maxInterval: gameState.maxInterval,
        timestamp: Date.now()
    });

    let ceilingPanelsExist = false;
    let floorPanelsExist = false;
    panels.forEach(panel => {
        const index = panel.position;
        if (index >= 8 && index < 10) ceilingPanelsExist = true;
        if (index >= 10) floorPanelsExist = true;
    });

    console.log("populateSettings() - 현재 패널 상태 확인:", {
        ceilingPanelsExist: ceilingPanelsExist,
        floorPanelsExist: floorPanelsExist,
        expectedCeilingPanels: gameState.useCeilingPanels,
        expectedFloorPanels: gameState.useFloorPanels
    });

    if (ceilingPanelsExist !== gameState.useCeilingPanels || floorPanelsExist !== gameState.useFloorPanels) {
        console.warn("populateSettings() - 패널 상태와 설정값 불일치, 패널 재생성으로 동기화");
        createPanels();
        console.log("populateSettings() - 패널 재생성 완료, 동기화 후 패널 상태:", {
            ceilingPanelsExist: panels.some(panel => panel.position >= 8 && panel.position < 10),
            floorPanelsExist: panels.some(panel => panel.position >= 10)
        });
    } else {
        console.log("populateSettings() - 패널 상태와 설정값 일치, 동기화 불필요");
    }

    console.log("populateSettings() - 설정 UI 반영 및 동기화 완료, 타임스탬프:", Date.now());
}






// 인디케이터 스타일 적용을 위한 통합 함수
function applyIndicatorStyles(indicators, styles) {
    console.log("applyIndicatorStyles() - 인디케이터 스타일 적용 시작", { styles, timestamp: Date.now() });
    indicators.forEach((indicator, i) => {
        if (!indicator) {
            console.error(`applyIndicatorStyles() - 인디케이터 ${i}가 DOM에 존재하지 않음`);
            return;
        }
        const { bgColor, bgOpacity, textColor, textOpacity, width, height } = styles;
        indicator.style.backgroundColor = hexToRgba(bgColor, bgOpacity);
        indicator.style.color = hexToRgba(textColor, textOpacity);
        indicator.style.width = `${width}px`;
        indicator.style.height = `${height}px`;

        // 적용된 스타일 확인 로그
        console.log(`applyIndicatorStyles() - 인디케이터 ${i} 스타일 적용 완료`, {
            id: indicator.id,
            backgroundColor: indicator.style.backgroundColor,
            color: indicator.style.color,
            width: indicator.style.width,
            height: indicator.style.height
        });
    });
    console.log("applyIndicatorStyles() - 모든 인디케이터 스타일 적용 완료");
}

















function applySettings() {
    console.log("applySettings() - 설정 적용 시작, 타임스탬프:", Date.now());

    const newStimulusTypes = [];
    if (document.getElementById('sceneStimulus').checked) newStimulusTypes.push('scene');
    if (document.getElementById('locationStimulus').checked) newStimulusTypes.push('location');
    if (document.getElementById('soundStimulus').checked) newStimulusTypes.push('sound');
    if (document.getElementById('colorStimulus').checked) newStimulusTypes.push('color');

    if (newStimulusTypes.length < 2 || newStimulusTypes.length > 4) {
        document.getElementById('settingsError').textContent = '자극 유형은 최소 2개, 최대 4개 선택해야 합니다.';
        document.getElementById('settingsError').style.display = 'block';
        console.log("applySettings() - 오류: 자극 유형 개수 부적합:", newStimulusTypes);
        return;
    }

    const rawStimuliPerBlock = parseInt(document.getElementById('stimuliPerBlock').value, 10);
    const rawStimulusDuration = parseInt(document.getElementById('stimulusDuration').value, 10);
    const rawStimulusInterval = parseInt(document.getElementById('stimulusInterval').value, 10);
    const rawPatternPreventionStrength = parseInt(document.getElementById('patternPreventionStrength').value, 10);
    const rawMinTargetInterval = parseInt(document.getElementById('minTargetInterval').value, 10);
    const rawMaxTargetInterval = parseInt(document.getElementById('maxTargetInterval').value, 10);
    const rawNearMissProbability = parseFloat(document.getElementById('nearMissProbability').value);
    // 새로 추가된 값
    const rawRandomizeInterval = document.getElementById('randomizeInterval').checked;
    const rawMinInterval = parseInt(document.getElementById('minInterval').value, 10);
    const rawMaxInterval = parseInt(document.getElementById('maxInterval').value, 10);

    console.log("applySettings() - UI에서 가져온 원시 값:", {
        rawStimuliPerBlock, rawStimulusDuration, rawStimulusInterval,
        rawPatternPreventionStrength, rawMinTargetInterval, rawMaxTargetInterval, rawNearMissProbability,
        rawRandomizeInterval, rawMinInterval, rawMaxInterval
    });

    gameState.stimulusTypes = newStimulusTypes;
    gameState.stimuliPerBlock = isNaN(rawStimuliPerBlock) ? 30 : Math.min(Math.max(rawStimuliPerBlock, 10), 100);
    gameState.stimulusDuration = isNaN(rawStimulusDuration) ? 1000 : Math.min(Math.max(rawStimulusDuration, 500), 5000);
    gameState.stimulusInterval = isNaN(rawStimulusInterval) ? 2500 : Math.min(Math.max(rawStimulusInterval, 1000), 10000);
    gameState.patternPreventionStrength = isNaN(rawPatternPreventionStrength) ? 5 : Math.min(Math.max(rawPatternPreventionStrength, 0), 10);
    gameState.minTargetInterval = isNaN(rawMinTargetInterval) ? 2 : Math.min(Math.max(rawMinTargetInterval, 1), 20);
    gameState.maxTargetInterval = isNaN(rawMaxTargetInterval) ? 10 : Math.min(Math.max(rawMaxTargetInterval, 5), 50);
    gameState.nearMissProbability = isNaN(rawNearMissProbability) ? 0.3 : Math.min(Math.max(rawNearMissProbability, 0), 1);
    // 새로 추가된 설정 적용
    gameState.randomizeInterval = rawRandomizeInterval;
    gameState.minInterval = isNaN(rawMinInterval) ? 1000 : Math.min(Math.max(rawMinInterval, 1000), 10000);
    gameState.maxInterval = isNaN(rawMaxInterval) ? 2500 : Math.min(Math.max(rawMaxInterval, 1000), 10000);

    // 최소값이 최대값보다 큰 경우 조정
    if (gameState.minInterval > gameState.maxInterval) {
        gameState.maxInterval = gameState.minInterval;
        console.log("applySettings() - 최소 간격이 최대 간격보다 커 최대값 조정됨:", gameState.maxInterval);
    }

    if (gameState.maxTargetInterval < gameState.minTargetInterval) {
        gameState.maxTargetInterval = gameState.minTargetInterval + 1;
        console.log("applySettings() - 최대 타겟 간격 조정됨:", gameState.maxTargetInterval);
    }

    gameState.imageSourceUrl = document.getElementById('imageSourceUrl').value || 'images/';
    gameState.resultImageUrl = document.getElementById('resultImageUrl').value || '';
    gameState.soundSource = document.getElementById('soundSourceSelect').value || 'pianoTones';
    gameState.soundSourceUrl = document.getElementById('soundSourceUrl').value || 'sounds/';
    gameState.sceneKey = document.getElementById('sceneKey').value.toUpperCase() || 'S';
    gameState.locationKey = document.getElementById('locationKey').value.toUpperCase() || 'A';
    gameState.soundKey = document.getElementById('soundKey').value.toUpperCase() || 'L';
    gameState.colorKey = document.getElementById('colorKey').value.toUpperCase() || 'K';

    const bgColor = document.getElementById('buttonBgColor').value || '#ffffff';
    const bgOpacity = Math.min(Math.max(parseFloat(document.getElementById('buttonBgOpacity').value) || 0.1, 0), 1);
    const textColor = document.getElementById('buttonTextColor').value || '#ffffff';
    const textOpacity = Math.min(Math.max(parseFloat(document.getElementById('buttonTextOpacity').value) || 0.0, 0), 1);
    const width = Math.max(parseInt(document.getElementById('buttonWidth').value, 10) || 80, 20);
    const height = Math.max(parseInt(document.getElementById('buttonHeight').value, 10) || 80, 20);

    gameState.buttonStyles = { bgColor, bgOpacity, textColor, textOpacity, width, height };
    console.log("applySettings() - 버튼 스타일 적용됨:", gameState.buttonStyles);

    const indicators = [sceneIndicator, soundIndicator, locationIndicator, colorIndicator];
    const indicatorPositions = [
        { left: parseInt(document.getElementById('button1Left').value) || 20, bottom: parseInt(document.getElementById('button1Bottom').value) || 20 },
        { left: parseInt(document.getElementById('button2Left').value) || 120, bottom: parseInt(document.getElementById('button2Bottom').value) || 20 },
        { right: parseInt(document.getElementById('button3Right').value) || 120, bottom: parseInt(document.getElementById('button3Bottom').value) || 20 },
        { right: parseInt(document.getElementById('button4Right').value) || 20, bottom: parseInt(document.getElementById('button4Bottom').value) || 20 }
    ];

    indicators.forEach((indicator, i) => {
        if (i < 2) {
            indicator.style.left = `${indicatorPositions[i].left}px`;
            indicator.style.right = '';
        } else {
            indicator.style.right = `${indicatorPositions[i].right}px`;
            indicator.style.left = '';
        }
        indicator.style.bottom = `${indicatorPositions[i].bottom}px`;
        console.log("applySettings() - 인디케이터 위치 적용:", {
            id: indicator.id,
            left: indicator.style.left,
            right: indicator.style.right,
            bottom: indicator.style.bottom
        });
    });

    applyIndicatorStyles(indicators, gameState.buttonStyles);

    const previousUseCeilingPanels = gameState.useCeilingPanels;
    const previousUseFloorPanels = gameState.useFloorPanels;
    gameState.useCeilingPanels = document.getElementById('useCeilingPanels').checked;
    gameState.useFloorPanels = document.getElementById('useFloorPanels').checked;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const degToRad = (deg) => deg * Math.PI / 180;

    let ceilingPanel1X = parseFloat(document.getElementById('ceilingPanel1X').value);
    let ceilingPanel1Y = parseFloat(document.getElementById('ceilingPanel1Y').value);
    let ceilingPanel1Z = parseFloat(document.getElementById('ceilingPanel1Z').value);
    let ceilingPanel1RotX = parseFloat(document.getElementById('ceilingPanel1RotX').value);
    let ceilingPanel1RotY = parseFloat(document.getElementById('ceilingPanel1RotY').value);
    let ceilingPanel1RotZ = parseFloat(document.getElementById('ceilingPanel1RotZ').value);

    ceilingPanel1X = isNaN(ceilingPanel1X) ? panelPositions[8].x : clamp(ceilingPanel1X, -roomWidth / 2, roomWidth / 2);
    ceilingPanel1Y = isNaN(ceilingPanel1Y) ? panelPositions[8].y : clamp(ceilingPanel1Y, roomHeight - 1, roomHeight);
    ceilingPanel1Z = isNaN(ceilingPanel1Z) ? panelPositions[8].z : clamp(ceilingPanel1Z, -roomDepth / 2, roomDepth / 2);
    ceilingPanel1RotX = isNaN(ceilingPanel1RotX) ? panelPositions[8].rotation[0] * 180 / Math.PI : clamp(ceilingPanel1RotX, -180, 180);
    ceilingPanel1RotY = isNaN(ceilingPanel1RotY) ? panelPositions[8].rotation[1] * 180 / Math.PI : clamp(ceilingPanel1RotY, -180, 180);
    ceilingPanel1RotZ = isNaN(ceilingPanel1RotZ) ? panelPositions[8].rotation[2] * 180 / Math.PI : clamp(ceilingPanel1RotZ, -180, 180);

    gameState.panelPositionsCustom[8] = {
        x: ceilingPanel1X,
        y: ceilingPanel1Y,
        z: ceilingPanel1Z,
        rotation: [degToRad(ceilingPanel1RotX), degToRad(ceilingPanel1RotY), degToRad(ceilingPanel1RotZ)]
    };

    let ceilingPanel2X = parseFloat(document.getElementById('ceilingPanel2X').value);
    let ceilingPanel2Y = parseFloat(document.getElementById('ceilingPanel2Y').value);
    let ceilingPanel2Z = parseFloat(document.getElementById('ceilingPanel2Z').value);
    let ceilingPanel2RotX = parseFloat(document.getElementById('ceilingPanel2RotX').value);
    let ceilingPanel2RotY = parseFloat(document.getElementById('ceilingPanel2RotY').value);
    let ceilingPanel2RotZ = parseFloat(document.getElementById('ceilingPanel2RotZ').value);

    ceilingPanel2X = isNaN(ceilingPanel2X) ? panelPositions[9].x : clamp(ceilingPanel2X, -roomWidth / 2, roomWidth / 2);
    ceilingPanel2Y = isNaN(ceilingPanel2Y) ? panelPositions[9].y : clamp(ceilingPanel2Y, roomHeight - 1, roomHeight);
    ceilingPanel2Z = isNaN(ceilingPanel2Z) ? panelPositions[9].z : clamp(ceilingPanel2Z, -roomDepth / 2, roomDepth / 2);
    ceilingPanel2RotX = isNaN(ceilingPanel2RotX) ? panelPositions[9].rotation[0] * 180 / Math.PI : clamp(ceilingPanel2RotX, -180, 180);
    ceilingPanel2RotY = isNaN(ceilingPanel2RotY) ? panelPositions[9].rotation[1] * 180 / Math.PI : clamp(ceilingPanel2RotY, -180, 180);
    ceilingPanel2RotZ = isNaN(ceilingPanel2RotZ) ? panelPositions[9].rotation[2] * 180 / Math.PI : clamp(ceilingPanel2RotZ, -180, 180);

    gameState.panelPositionsCustom[9] = {
        x: ceilingPanel2X,
        y: ceilingPanel2Y,
        z: ceilingPanel2Z,
        rotation: [degToRad(ceilingPanel2RotX), degToRad(ceilingPanel2RotY), degToRad(ceilingPanel2RotZ)]
    };

    let floorPanel1X = parseFloat(document.getElementById('floorPanel1X').value);
    let floorPanel1Y = parseFloat(document.getElementById('floorPanel1Y').value);
    let floorPanel1Z = parseFloat(document.getElementById('floorPanel1Z').value);
    let floorPanel1RotX = parseFloat(document.getElementById('floorPanel1RotX').value);
    let floorPanel1RotY = parseFloat(document.getElementById('floorPanel1RotY').value);
    let floorPanel1RotZ = parseFloat(document.getElementById('floorPanel1RotZ').value);

    floorPanel1X = isNaN(floorPanel1X) ? panelPositions[10].x : clamp(floorPanel1X, -roomWidth / 2, roomWidth / 2);
    floorPanel1Y = isNaN(floorPanel1Y) ? panelPositions[10].y : clamp(floorPanel1Y, 0, 1);
    floorPanel1Z = isNaN(floorPanel1Z) ? panelPositions[10].z : clamp(floorPanel1Z, -roomDepth / 2, roomDepth / 2);
    floorPanel1RotX = isNaN(floorPanel1RotX) ? panelPositions[10].rotation[0] * 180 / Math.PI : clamp(floorPanel1RotX, -180, 180);
    floorPanel1RotY = isNaN(floorPanel1RotY) ? panelPositions[10].rotation[1] * 180 / Math.PI : clamp(floorPanel1RotY, -180, 180);
    floorPanel1RotZ = isNaN(floorPanel1RotZ) ? panelPositions[10].rotation[2] * 180 / Math.PI : clamp(floorPanel1RotZ, -180, 180);

    gameState.panelPositionsCustom[10] = {
        x: floorPanel1X,
        y: floorPanel1Y,
        z: floorPanel1Z,
        rotation: [degToRad(floorPanel1RotX), degToRad(floorPanel1RotY), degToRad(floorPanel1RotZ)]
    };

    let floorPanel2X = parseFloat(document.getElementById('floorPanel2X').value);
    let floorPanel2Y = parseFloat(document.getElementById('floorPanel2Y').value);
    let floorPanel2Z = parseFloat(document.getElementById('floorPanel2Z').value);
    let floorPanel2RotX = parseFloat(document.getElementById('floorPanel2RotX').value);
    let floorPanel2RotY = parseFloat(document.getElementById('floorPanel2RotY').value);
    let floorPanel2RotZ = parseFloat(document.getElementById('floorPanel2RotZ').value);

    floorPanel2X = isNaN(floorPanel2X) ? panelPositions[11].x : clamp(floorPanel2X, -roomWidth / 2, roomWidth / 2);
    floorPanel2Y = isNaN(floorPanel2Y) ? panelPositions[11].y : clamp(floorPanel2Y, 0, 1);
    floorPanel2Z = isNaN(floorPanel2Z) ? panelPositions[11].z : clamp(floorPanel2Z, -roomDepth / 2, roomDepth / 2);
    floorPanel2RotX = isNaN(floorPanel2RotX) ? panelPositions[11].rotation[0] * 180 / Math.PI : clamp(floorPanel2RotX, -180, 180);
    floorPanel2RotY = isNaN(floorPanel2RotY) ? panelPositions[11].rotation[1] * 180 / Math.PI : clamp(floorPanel2RotY, -180, 180);
    floorPanel2RotZ = isNaN(floorPanel2RotZ) ? panelPositions[11].rotation[2] * 180 / Math.PI : clamp(floorPanel2RotZ, -180, 180);

    gameState.panelPositionsCustom[11] = {
        x: floorPanel2X,
        y: floorPanel2Y,
        z: floorPanel2Z,
        rotation: [degToRad(floorPanel2RotX), degToRad(floorPanel2RotY), degToRad(floorPanel2RotZ)]
    };

    let ceilingPanelsExist = false;
    let floorPanelsExist = false;
    panels.forEach(panel => {
        const index = panel.position;
        if (index >= 8 && index < 10) ceilingPanelsExist = true;
        if (index >= 10) floorPanelsExist = true;
    });

    console.log("applySettings() - 패널 상태와 설정값 비교:", {
        previousCeilingPanels: previousUseCeilingPanels,
        previousFloorPanels: previousUseFloorPanels,
        newCeilingPanels: gameState.useCeilingPanels,
        newFloorPanels: gameState.useFloorPanels,
        ceilingPanelsExist: ceilingPanelsExist,
        floorPanelsExist: floorPanelsExist
    });

    const shouldRecreatePanels = 
        previousUseCeilingPanels !== gameState.useCeilingPanels ||
        previousUseFloorPanels !== gameState.useFloorPanels ||
        ceilingPanelsExist !== gameState.useCeilingPanels ||
        floorPanelsExist !== gameState.useFloorPanels;

    if (shouldRecreatePanels) {
        console.log("applySettings() - 패널 설정 변경 또는 상태 불일치, 패널 재생성");
        createPanels();
        console.log("applySettings() - 패널 재생성 완료, 새로운 패널 상태:", {
            ceilingPanelsExist: panels.some(panel => panel.position >= 8 && panel.position < 10),
            floorPanelsExist: panels.some(panel => panel.position >= 10)
        });
    } else {
        console.log("applySettings() - 패널 설정 변경 없음, 재생성 불필요");
    }

    console.log("applySettings() - 패널 설정 적용됨:", {
        useCeilingPanels: gameState.useCeilingPanels,
        useFloorPanels: gameState.useFloorPanels,
        ceilingPanel1: gameState.panelPositionsCustom[8],
        ceilingPanel2: gameState.panelPositionsCustom[9],
        floorPanel1: gameState.panelPositionsCustom[10],
        floorPanel2: gameState.panelPositionsCustom[11],
        timestamp: Date.now()
    });

    // 로컬 스토리지 저장
    localStorage.setItem('stimulusTypes', JSON.stringify(gameState.stimulusTypes));
    localStorage.setItem('stimuliPerBlock', gameState.stimuliPerBlock);
    localStorage.setItem('stimulusDuration', gameState.stimulusDuration);
    localStorage.setItem('stimulusInterval', gameState.stimulusInterval);
    localStorage.setItem('patternPreventionStrength', gameState.patternPreventionStrength);
    localStorage.setItem('minTargetInterval', gameState.minTargetInterval);
    localStorage.setItem('maxTargetInterval', gameState.maxTargetInterval);
    localStorage.setItem('nearMissProbability', gameState.nearMissProbability);
    localStorage.setItem('imageSourceUrl', gameState.imageSourceUrl);
    localStorage.setItem('resultImageUrl', gameState.resultImageUrl);
    localStorage.setItem('soundSource', gameState.soundSource);
    localStorage.setItem('soundSourceUrl', gameState.soundSourceUrl);
    localStorage.setItem('sceneKey', gameState.sceneKey);
    localStorage.setItem('locationKey', gameState.locationKey);
    localStorage.setItem('soundKey', gameState.soundKey);
    localStorage.setItem('colorKey', gameState.colorKey);
    localStorage.setItem('buttonStyles', JSON.stringify(gameState.buttonStyles));
    localStorage.setItem('sceneIndicatorPos', JSON.stringify({ left: indicatorPositions[0].left, bottom: indicatorPositions[0].bottom }));
    localStorage.setItem('soundIndicatorPos', JSON.stringify({ left: indicatorPositions[1].left, bottom: indicatorPositions[1].bottom }));
    localStorage.setItem('locationIndicatorPos', JSON.stringify({ right: indicatorPositions[2].right, bottom: indicatorPositions[2].bottom }));
    localStorage.setItem('colorIndicatorPos', JSON.stringify({ right: indicatorPositions[3].right, bottom: indicatorPositions[3].bottom }));
    localStorage.setItem('useCeilingPanels', gameState.useCeilingPanels);
    localStorage.setItem('useFloorPanels', gameState.useFloorPanels);
    localStorage.setItem('panelPositionsCustom', JSON.stringify(gameState.panelPositionsCustom));
    // 새로 추가된 로컬 스토리지 저장
    localStorage.setItem('randomizeInterval', gameState.randomizeInterval);
    localStorage.setItem('minInterval', gameState.minInterval);
    localStorage.setItem('maxInterval', gameState.maxInterval);

    console.log("applySettings() - 로컬 스토리지에 저장된 값:", {
        randomizeInterval: localStorage.getItem('randomizeInterval'),
        minInterval: localStorage.getItem('minInterval'),
        maxInterval: localStorage.getItem('maxInterval'),
        timestamp: Date.now()
    });

    console.log("applySettings() - 설정 적용 및 저장 완료:", {
        stimulusTypes: gameState.stimulusTypes,
        stimuliPerBlock: gameState.stimuliPerBlock,
        stimulusDuration: gameState.stimulusDuration,
        stimulusInterval: gameState.stimulusInterval,
        nearMissProbability: gameState.nearMissProbability,
        buttonStyles: gameState.buttonStyles,
        randomizeInterval: gameState.randomizeInterval,
        minInterval: gameState.minInterval,
        maxInterval: gameState.maxInterval,
        timestamp: Date.now()
    });

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
    console.log("loadSettings() - 설정 로드 시작, 타임스탬프:", Date.now());

    const settingsWarning = document.getElementById('loadSettingsWarning');
    if (settingsWarning) {
        settingsWarning.style.display = 'none';
        settingsWarning.textContent = '';
    } else {
        console.warn("loadSettings() - 경고 메시지 요소(loadSettingsWarning)가 DOM에 존재하지 않음");
    }

    const savedNBackLevel = localStorage.getItem('nBackLevel');
    if (savedNBackLevel) {
        gameState.nBackLevel = Math.min(Math.max(parseInt(savedNBackLevel), 1), 9);
        document.getElementById('nBackLevel').textContent = gameState.nBackLevel;
        document.getElementById('customLevel').value = gameState.nBackLevel;
        console.log("loadSettings() - N백 레벨 로드됨:", gameState.nBackLevel);
    } else {
        console.log("loadSettings() - 저장된 N백 레벨 없음, 기본값 사용:", gameState.nBackLevel);
    }

    // UTC 기준으로 날짜 경계 확인
    const now = Date.now();
    const todayStart = new Date(new Date().setUTCHours(0, 0, 0, 0)).getTime();
    const lastGameTimestamp = parseInt(localStorage.getItem('lastGameTimestamp')) || 0;
    console.log("loadSettings() - 날짜 경계 비교: 오늘 시작=", todayStart, "마지막 게임 타임스탬프=", lastGameTimestamp);

    if (lastGameTimestamp < todayStart) {
        gameState.totalGamesToday = 0;
        gameState.consecutiveGames = 0;
        localStorage.setItem('lastGameTimestamp', now.toString());
        console.log("loadSettings() - 날짜 경계 넘어감, 카운터 초기화: totalGamesToday=", gameState.totalGamesToday, "consecutiveGames=", gameState.consecutiveGames);
    } else {
        const savedTotalGames = localStorage.getItem('totalGamesToday');
        const savedConsecutiveGames = localStorage.getItem('consecutiveGames');
        gameState.totalGamesToday = savedTotalGames ? parseInt(savedTotalGames) : 0;
        gameState.consecutiveGames = savedConsecutiveGames ? parseInt(savedConsecutiveGames) : 0;
        console.log("loadSettings() - 같은 날짜 내, 카운터 로드됨: totalGamesToday=", gameState.totalGamesToday, "consecutiveGames=", gameState.consecutiveGames);
    }
    updateGameCounters(); // 통합된 카운터 업데이트 함수 호출

    const savedStimulusTypes = JSON.parse(localStorage.getItem('stimulusTypes'));
    gameState.stimulusTypes = (savedStimulusTypes && savedStimulusTypes.length >= 2 && savedStimulusTypes.length <= 4) ? savedStimulusTypes : ['scene', 'location'];
    console.log("loadSettings() - 자극 유형 로드됨:", gameState.stimulusTypes);

    const savedStimuliPerBlock = parseInt(localStorage.getItem('stimuliPerBlock'));
    gameState.stimuliPerBlock = isNaN(savedStimuliPerBlock) ? 30 : Math.min(Math.max(savedStimuliPerBlock, 10), 100);
    console.log("loadSettings() - 블록당 자극 수 로드됨:", gameState.stimuliPerBlock);

    const savedStimulusDuration = parseInt(localStorage.getItem('stimulusDuration'));
    gameState.stimulusDuration = isNaN(savedStimulusDuration) ? 1000 : Math.min(Math.max(savedStimulusDuration, 500), 5000);
    console.log("loadSettings() - 자극 지속 시간 로드됨:", gameState.stimulusDuration);

    const savedStimulusInterval = parseInt(localStorage.getItem('stimulusInterval'));
    gameState.stimulusInterval = isNaN(savedStimulusInterval) ? 2500 : Math.min(Math.max(savedStimulusInterval, 1000), 10000);
    console.log("loadSettings() - 자극 간격 로드됨:", gameState.stimulusInterval);

    const savedPatternPreventionStrength = parseInt(localStorage.getItem('patternPreventionStrength'));
    gameState.patternPreventionStrength = isNaN(savedPatternPreventionStrength) ? 5 : Math.min(Math.max(savedPatternPreventionStrength, 0), 10);
    console.log("loadSettings() - 패턴 방지 강도 로드됨:", gameState.patternPreventionStrength);

    const savedMinTargetInterval = parseInt(localStorage.getItem('minTargetInterval'));
    gameState.minTargetInterval = isNaN(savedMinTargetInterval) ? 2 : Math.min(Math.max(savedMinTargetInterval, 1), 20);
    console.log("loadSettings() - 최소 타겟 간격 로드됨:", gameState.minTargetInterval);

    const savedMaxTargetInterval = parseInt(localStorage.getItem('maxTargetInterval'));
    gameState.maxTargetInterval = isNaN(savedMaxTargetInterval) ? 10 : Math.min(Math.max(savedMaxTargetInterval, 5), 50);
    console.log("loadSettings() - 최대 타겟 간격 로드됨:", gameState.maxTargetInterval);

    const savedNearMissProbability = parseFloat(localStorage.getItem('nearMissProbability'));
    gameState.nearMissProbability = isNaN(savedNearMissProbability) ? 0.3 : Math.min(Math.max(savedNearMissProbability, 0), 1);
    console.log("loadSettings() - 근접 오차 확률 로드됨:", gameState.nearMissProbability);

    const savedRandomizeInterval = localStorage.getItem('randomizeInterval');
    gameState.randomizeInterval = savedRandomizeInterval === 'true' || savedRandomizeInterval === true;
    const savedMinInterval = parseInt(localStorage.getItem('minInterval'));
    gameState.minInterval = isNaN(savedMinInterval) ? 2500 : Math.min(Math.max(savedMinInterval, 1000), 10000);
    const savedMaxInterval = parseInt(localStorage.getItem('maxInterval'));
    gameState.maxInterval = isNaN(savedMaxInterval) ? 2500 : Math.min(Math.max(savedMaxInterval, 1000), 10000);

    if (gameState.minInterval > gameState.maxInterval) {
        gameState.maxInterval = gameState.minInterval;
        console.log("loadSettings() - 최소 간격이 최대 간격보다 커 최대값 조정됨:", gameState.maxInterval);
    }

    console.log("loadSettings() - 무작위 간격 설정 로드됨:", {
        randomizeInterval: gameState.randomizeInterval,
        minInterval: gameState.minInterval,
        maxInterval: gameState.maxInterval
    });

    if (gameState.maxTargetInterval < gameState.minTargetInterval) {
        gameState.maxTargetInterval = gameState.minTargetInterval + 1;
        console.log("loadSettings() - 경고: 최대 타겟 간격이 최소 간격보다 작아 조정됨:", gameState.maxTargetInterval);
    }

    const rawUseCeilingPanels = localStorage.getItem('useCeilingPanels');
    const rawUseFloorPanels = localStorage.getItem('useFloorPanels');

    console.log("loadSettings() - 로컬 스토리지에서 로드된 원시 패널 설정 값:", {
        rawUseCeilingPanels: rawUseCeilingPanels,
        rawUseFloorPanels: rawUseFloorPanels
    });

    gameState.useCeilingPanels = rawUseCeilingPanels === 'true' || rawUseCeilingPanels === true;
    gameState.useFloorPanels = rawUseFloorPanels === 'true' || rawUseFloorPanels === true;

    let hasInvalidSettings = false;
    if (rawUseCeilingPanels !== 'true' && rawUseCeilingPanels !== 'false' && rawUseCeilingPanels !== null) {
        console.warn("loadSettings() - useCeilingPanels 값이 유효하지 않음, 기본값(false)으로 초기화:", rawUseCeilingPanels);
        gameState.useCeilingPanels = false;
        localStorage.setItem('useCeilingPanels', 'false');
        hasInvalidSettings = true;
    }
    if (rawUseFloorPanels !== 'true' && rawUseFloorPanels !== 'false' && rawUseFloorPanels !== null) {
        console.warn("loadSettings() - useFloorPanels 값이 유효하지 않음, 기본값(false)으로 초기화:", rawUseFloorPanels);
        gameState.useFloorPanels = false;
        localStorage.setItem('useFloorPanels', 'false');
        hasInvalidSettings = true;
    }

    if (hasInvalidSettings && settingsWarning) {
        settingsWarning.textContent = '일부 설정값이 손상되어 기본값으로 초기화되었습니다.';
        settingsWarning.style.display = 'block';
        console.log("loadSettings() - 사용자에게 설정 손상 경고 표시");
    }

    console.log("loadSettings() - 패널 설정 로드 후 상태:", {
        useCeilingPanels: gameState.useCeilingPanels,
        useFloorPanels: gameState.useFloorPanels
    });

    gameState.panelPositionsCustom = JSON.parse(localStorage.getItem('panelPositionsCustom')) || panelPositions.map(pos => ({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotation: pos.rotation || [0, 0, 0]
    }));

    if (!Array.isArray(gameState.panelPositionsCustom) || gameState.panelPositionsCustom.length !== panelPositions.length) {
        console.warn("loadSettings() - panelPositionsCustom이 유효하지 않음, 기본값으로 초기화");
        gameState.panelPositionsCustom = panelPositions.map(pos => ({
            x: pos.x,
            y: pos.y,
            z: pos.z,
            rotation: pos.rotation || [0, 0, 0]
        }));
        hasInvalidSettings = true;
    }

    gameState.panelPositionsCustom = gameState.panelPositionsCustom.map((pos, index) => ({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotation: pos.rotation || panelPositions[index]?.rotation || [0, 0, 0]
    }));

    gameState.imageSourceUrl = localStorage.getItem('imageSourceUrl') || 'images/';
    gameState.resultImageUrl = localStorage.getItem('resultImageUrl') || '';
    gameState.soundSource = localStorage.getItem('soundSource') || 'pianoTones';
    gameState.soundSourceUrl = localStorage.getItem('soundSourceUrl') || 'sounds/';
    gameState.sceneKey = localStorage.getItem('sceneKey') || 'S';
    gameState.locationKey = localStorage.getItem('locationKey') || 'A';
    gameState.soundKey = localStorage.getItem('soundKey') || 'L';
    gameState.colorKey = localStorage.getItem('colorKey') || 'K';
    console.log("loadSettings() - URL 및 키 설정 로드됨:", {
        imageSourceUrl: gameState.imageSourceUrl,
        resultImageUrl: gameState.resultImageUrl,
        soundSource: gameState.soundSource,
        soundSourceUrl: gameState.soundSourceUrl,
        sceneKey: gameState.sceneKey,
        locationKey: gameState.locationKey,
        soundKey: gameState.soundKey,
        colorKey: gameState.colorKey
    });

    const scenePos = JSON.parse(localStorage.getItem('sceneIndicatorPos')) || { left: 20, bottom: 20 };
    const soundPos = JSON.parse(localStorage.getItem('soundIndicatorPos')) || { left: 120, bottom: 20 };
    const locationPos = JSON.parse(localStorage.getItem('locationIndicatorPos')) || { right: 120, bottom: 20 };
    const colorPos = JSON.parse(localStorage.getItem('colorIndicatorPos')) || { right: 20, bottom: 20 };

    sceneIndicator.style.left = `${scenePos.left}px`;
    sceneIndicator.style.bottom = `${scenePos.bottom}px`;
    sceneIndicator.style.right = '';
    soundIndicator.style.left = `${soundPos.left}px`;
    soundIndicator.style.bottom = `${soundPos.bottom}px`;
    soundIndicator.style.right = '';
    locationIndicator.style.right = `${locationPos.right}px`;
    locationIndicator.style.bottom = `${locationPos.bottom}px`;
    locationIndicator.style.left = '';
    colorIndicator.style.right = `${colorPos.right}px`;
    colorIndicator.style.bottom = `${colorPos.bottom}px`;
    colorIndicator.style.left = '';

    console.log("loadSettings() - 인디케이터 위치 로드 및 적용:", {
        scene: { left: sceneIndicator.style.left, bottom: sceneIndicator.style.bottom },
        sound: { left: soundIndicator.style.left, bottom: soundIndicator.style.bottom },
        location: { right: locationIndicator.style.right, bottom: locationIndicator.style.bottom },
        color: { right: colorIndicator.style.right, bottom: colorIndicator.style.bottom }
    });

    gameState.buttonStyles = JSON.parse(localStorage.getItem('buttonStyles')) || {
        bgColor: '#ffffff',
        bgOpacity: 0.1,
        textColor: '#ffffff',
        textOpacity: 0.0,
        width: 80,
        height: 80
    };
    console.log("loadSettings() - 버튼 스타일 로드됨:", gameState.buttonStyles);

    const indicators = [sceneIndicator, soundIndicator, locationIndicator, colorIndicator];
    applyIndicatorStyles(indicators, gameState.buttonStyles);

    console.log("loadSettings() - 모든 설정 로드 완료:", {
        stimulusTypes: gameState.stimulusTypes,
        stimuliPerBlock: gameState.stimuliPerBlock,
        stimulusDuration: gameState.stimulusDuration,
        stimulusInterval: gameState.stimulusInterval,
        patternPreventionStrength: gameState.patternPreventionStrength,
        minTargetInterval: gameState.minTargetInterval,
        maxTargetInterval: gameState.maxTargetInterval,
        nearMissProbability: gameState.nearMissProbability,
        useCeilingPanels: gameState.useCeilingPanels,
        useFloorPanels: gameState.useFloorPanels,
        panelPositionsCustom: gameState.panelPositionsCustom,
        randomizeInterval: gameState.randomizeInterval,
        minInterval: gameState.minInterval,
        maxInterval: gameState.maxInterval,
        timestamp: Date.now()
    });

    populateSettings();
    console.log("loadSettings() - 설정 로드 및 UI 반영 완료, 타임스탬프:", Date.now());
}










window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log("window.onresize - 뷰포트 업데이트: width:", window.innerWidth, "height:", window.innerHeight);
    renderer.render(scene, camera); // 즉시 렌더링 호출
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    document.getElementById('fullscreenGuide').style.display = 'block';
    console.log("아이폰 감지 - 전체화면 안내 표시");
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
    loadImageTextures().then(() => {
        console.log("window.onload - 이미지 로드 완료, 설정 로드 시작");
        loadSettings();
        console.log("window.onload - 설정 로드 완료, 패널 생성 시작");
        createPanels(); // 설정 로드 후 패널 생성
        console.log("window.onload - 패널 생성 완료, 애니메이션 시작");
        animate();

        // 고급 설정 토글 버튼 이벤트 리스너
        const toggleAdvancedSettingsBtn = document.getElementById('toggleAdvancedSettingsBtn');
        if (toggleAdvancedSettingsBtn) {
            toggleAdvancedSettingsBtn.addEventListener('click', () => {
                const advancedSettings = document.getElementById('advancedSettings');
                if (advancedSettings) {
                    advancedSettings.style.display = advancedSettings.style.display === 'none' ? 'block' : 'none';
                    console.log("toggleAdvancedSettingsBtn clicked - Advanced settings visibility:", advancedSettings.style.display);
                } else {
                    console.error("advancedSettings element not found in DOM");
                }
            });
            console.log("toggleAdvancedSettingsBtn event listener added successfully");
        } else {
            console.error("toggleAdvancedSettingsBtn not found in DOM at window.onload");
        }

        // 버튼 설정 토글 버튼 이벤트 리스너
        const toggleButtonSettingsBtn = document.getElementById('toggleButtonSettingsBtn');
        if (toggleButtonSettingsBtn) {
            toggleButtonSettingsBtn.addEventListener('click', () => {
                const buttonSettings = document.getElementById('buttonSettings');
                if (buttonSettings) {
                    buttonSettings.style.display = buttonSettings.style.display === 'none' ? 'block' : 'none';
                    console.log("toggleButtonSettingsBtn clicked - Button settings visibility:", buttonSettings.style.display);
                } else {
                    console.error("buttonSettings element not found in DOM");
                }
            });
            console.log("toggleButtonSettingsBtn event listener added successfully");
        } else {
            console.error("toggleButtonSettingsBtn not found in DOM at window.onload");
        }

        // 패널 설정 토글 버튼 이벤트 리스너
        const togglePanelSettingsBtn = document.getElementById('togglePanelSettingsBtn');
        if (togglePanelSettingsBtn) {
            togglePanelSettingsBtn.addEventListener('click', () => {
                const panelSettings = document.getElementById('panelSettings');
                if (panelSettings) {
                    panelSettings.style.display = panelSettings.style.display === 'none' ? 'block' : 'none';
                    console.log("togglePanelSettingsBtn clicked - Panel settings visibility:", panelSettings.style.display);
                } else {
                    console.error("panelSettings element not found in DOM");
                }
            });
            console.log("togglePanelSettingsBtn event listener added successfully");
        } else {
            console.error("togglePanelSettingsBtn not found in DOM at window.onload");
        }

        // 설정 패널 닫기 버튼 이벤트 리스너
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                const settingsPanel = document.getElementById('settingsPanel');
                const advancedSettings = document.getElementById('advancedSettings');
                const buttonSettings = document.getElementById('buttonSettings');
                const panelSettings = document.getElementById('panelSettings');
                if (settingsPanel) {
                    settingsPanel.style.display = 'none';
                    console.log("closeSettingsBtn clicked - Settings panel closed");
                } else {
                    console.error("settingsPanel not found in DOM");
                }
                if (advancedSettings) {
                    advancedSettings.style.display = 'none';
                    console.log("closeSettingsBtn clicked - Advanced settings hidden");
                }
                if (buttonSettings) {
                    buttonSettings.style.display = 'none';
                    console.log("closeSettingsBtn clicked - Button settings hidden");
                }
                if (panelSettings) {
                    panelSettings.style.display = 'none';
                    console.log("closeSettingsBtn clicked - Panel settings hidden");
                }
            });
            console.log("closeSettingsBtn event listener added successfully");
        } else {
            console.error("closeSettingsBtn not found in DOM at window.onload");
        }
    }).catch(err => {
        console.error("window.onload - 이미지 로딩 중 오류 발생:", err);
    });
};
