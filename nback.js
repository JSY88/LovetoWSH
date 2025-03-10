
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
    canRespond: true,

    // --- 간섭 관련 설정 추가 ---
    interferenceChance: 0.125, // 간섭 발생 확률 (12.5%)
    interferenceType: "none", // 간섭 유형 ("none", "previous", "cyclic") - "next"는 복잡도 증가로 인해 일단 제외
    cyclicInterferenceNBackLevel: 2, // 순환 간섭 시 사용할 N-back 레벨 (기본 N-back 레벨과 다를 수 있음)
    nextStimulusInfo: null // "next" 간섭 유형을 위한 다음 자극 정보 임시 저장 변수 (일단 사용하지 않음)
    // --- 간섭 관련 설정 끝 ---
};

// --- 커스터마이징 옵션 (사용자 설정 가능 변수) ---
const wallColor = 0x444444;     // 벽 색상 (light gray)
const floorColor = 0x783F04;    // 바닥 색상 (나무 색상)
const panelColor = 0x666666;    // 패널(액자) 색상 (dark gray - 변경됨)
const imageScale = 1.0;         // 이미지 크기 비율 (1.0: 원래 크기, 0.5: 절반 크기)
const randomizeStimulusColor = true; // 게임 시작 시 이미지에 랜덤 색상 입히기 여부 (true: 랜덤 색상 입힘, false: 색상 입히지 않음)
// --- 커스터마이징 옵션 끝 ---

// Three.js Scene, Camera, Renderer 설정
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0); // 캔버스 배경색 (light gray)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 2); // 카메라 위치 (x, y, z) - (0, 1.6, 2)는 적절한 기본 시점
camera.lookAt(0, 1.6, -5); // 카메라 시선 방향 (x, y, z) - (0, 1.6, -5)는 패널 중앙을 바라보게 함

const renderer = new THREE.WebGLRenderer({ antialias: true }); // WebGL 렌더러 생성 (antialias: 경계선 부드럽게 처리)
renderer.setSize(window.innerWidth, window.innerHeight); // 렌더러 크기를 창 크기에 맞춤
document.body.appendChild(renderer.domElement); // 렌더러를 HTML 문서에 추가

// 조명 설정
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // 은은한 주변광 (색상, 강도) - 전체적으로 밝기 조절
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // 방향성 광 (색상, 강도) - 그림자 생성, 입체감 부여
directionalLight.position.set(0, 1, 0); // 광원 위치 (x, y, z) - (0, 1, 0)는 위에서 아래로 비추는 효과
directionalLight.intensity = 0.8;
scene.add(directionalLight);

// 방 크기 설정
const roomWidth = 5;
const roomHeight = 3;
const roomDepth = 5;

// 벽돌 텍스처 생성 함수 (기존과 동일)
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

// 나무 바닥 텍스처 생성 함수 (기존과 동일)
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
    { x: roomWidth/2 - 0.06, y: 0.8, z: -0.5, rotation: [0, -Math.PI/2, 0] }
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
const imageTextures = []; // 이미지 텍스처를 저장할 배열 -> 이제 텍스처와 색상 정보를 함께 저장할 배열로 변경

// 랜덤 색상 생성 함수
// --- 수정된 랜덤 색상 팔레트 ---
const distinctColors = [
    new THREE.Color(0.8, 0.2, 0.2), // Red (약간 어두운 빨강)
    new THREE.Color(0.2, 0.6, 0.8), // Cyan (청록색)
    new THREE.Color(0.3, 0.7, 0.3), // Green (녹색)
    new THREE.Color(0.9, 0.5, 0.1), // Orange (주황색)
    new THREE.Color(0.6, 0.3, 0.7), // Purple (보라색)
    new THREE.Color(0.2, 0.4, 0.9), // Blue (파랑)
    new THREE.Color(0.7, 0.7, 0.2)  // Yellow-Green (연두색)
];

// 랜덤 색상 생성 함수 (수정됨: 팔레트 사용)
function getRandomColor() {
    return distinctColors[Math.floor(Math.random() * distinctColors.length)];
}

// 이미지 파일 이름 목록 (images 폴더 안의 이미지 파일 이름들을 여기에 추가)
const imageFilenames = [];
for (let i = 1; i <= 101; i++) {
    const filename = `image${String(i).padStart(3, '0')}.png`;
    imageFilenames.push(filename);
}
console.log("imageFilenames 배열 길이:", imageFilenames.length);


imageFilenames.forEach((filename) => {
    const texture = imageLoader.load(`images/${filename}`);
    let color = null; // 기본적으로 색상 없음
    if (randomizeStimulusColor) { // 랜덤 색상 입히기 옵션이 true이면
        color = getRandomColor(); // 랜덤 색상 생성
    }
    imageTextures.push({ texture: texture, color: color }); // 텍스처와 색상 정보를 함께 배열에 저장
});


console.log("imageTextures 배열 길이:", imageTextures.length);


// 자극 이미지 생성 함수
function createStimulusImage(imageIndex, panel) {
    clearStimulus(panel);

    const imageGeometry = new THREE.PlaneGeometry(panelWidth * imageScale, panelHeight * imageScale);
    const imageMaterial = new THREE.MeshBasicMaterial({
        map: imageTextures[imageIndex].texture,
        transparent: true, // 투명 배경 활성화!
        blending: THREE.NormalBlending // 블렌딩 모드 설정 (기본값이 NormalBlending이지만 명시적으로 설정)
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

// 패널의 자극(이미지) 제거 함수 (기존과 동일)
function clearStimulus(panel) {
    if (panel.stimulusObject) {
        panel.group.remove(panel.stimulusObject);
        panel.stimulusObject = null;
    }
}

// 모든 패널의 자극(이미지) 제거 함수 (기존과 동일)
function clearAllStimuli() {
    panels.forEach(panel => {
        clearStimulus(panel);
    });
}

// 반응 지시 박스 (S, L) 엘리먼트 가져오기 (기존과 동일)
const sceneIndicator = document.getElementById('scene-indicator');
const locationIndicator = document.getElementById('location-indicator');

// 반응 지시 박스 상태 초기화 함수 (기존과 동일)
function resetIndicators() {
    sceneIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    locationIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    gameState.sceneTargetProcessed = false;
    gameState.locationTargetProcessed = false;
    gameState.canRespond = true;
}

// 반응 지시 박스에 피드백 표시 함수 (기존과 동일)
function showIndicatorFeedback(indicator, isCorrect) {
    if (isCorrect) {
        indicator.classList.add('correct');
    } else {
        indicator.classList.add('incorrect');
    }
}

// 조기 반응 피드백 표시 함수 (기존과 동일)
function showEarlyResponseFeedback(indicator) {
    indicator.classList.add('early');
}

// 미반응 (missed) 타겟 피드백 표시 함수 (기존과 동일)
function showMissedTargetFeedback(indicator) {
    indicator.classList.add('missed');
}

// --- 간섭 적용 함수 ---
function introduceInterference(currentImageIndex, currentPanelIndex) {
    if (gameState.interferenceType === "none") {
        return { imageIndex: currentImageIndex, panelIndex: currentPanelIndex }; // 간섭 없음
    }

    if (Math.random() < gameState.interferenceChance) {
        let interferedImageIndex = currentImageIndex;
        let interferedPanelIndex = currentPanelIndex;

        if (gameState.interferenceType === "previous" && gameState.currentStimulus > 0) {
            // 한 트라이얼 이전 간섭
            const previousImageIndex = gameState.sceneHistory[gameState.currentStimulus - 1];
            const previousPanelIndex = gameState.locationHistory[gameState.currentStimulus - 1];

            const type = Math.random(); // 이미지 또는 위치 중 어떤 것을 간섭할지 랜덤 결정

            if (type < 0.5) {
                // 이미지 간섭
                interferedImageIndex = previousImageIndex;
                // 위치는 그대로 유지 (또는 필요에 따라 위치도 약간 변경 가능)
            } else {
                // 위치 간섭
                interferedPanelIndex = previousPanelIndex;
                // 이미지는 그대로 유지
            }

            console.log("간섭 적용 (이전):", "type=", type < 0.5 ? "image" : "location");


        } else if (gameState.interferenceType === "cyclic" && gameState.currentStimulus >= gameState.cyclicInterferenceNBackLevel) {
            // 순환 간섭 (N-back 이전)
            const cyclicNBackLevel = gameState.cyclicInterferenceNBackLevel;
            const cyclicImageIndex = gameState.sceneHistory[gameState.currentStimulus - cyclicNBackLevel];
            const cyclicPanelIndex = gameState.locationHistory[gameState.currentStimulus - cyclicNBackLevel];

             const type = Math.random(); // 이미지 또는 위치 중 어떤 것을 간섭할지 랜덤 결정

            if (type < 0.5) {
                // 이미지 간섭
                interferedImageIndex = cyclicImageIndex;
                // 위치는 그대로 유지
            } else {
                // 위치 간섭
                interferedPanelIndex = cyclicPanelIndex;
                // 이미지는 그대로 유지
            }
             console.log("간섭 적용 (순환, N=" + cyclicNBackLevel + "):", "type=", type < 0.5 ? "image" : "location");
        }

        return { imageIndex: interferedImageIndex, panelIndex: interferedPanelIndex };
    }

    return { imageIndex: currentImageIndex, panelIndex: currentPanelIndex }; // 간섭 미발생
}


// 자극 제시 함수 (수정됨: 간섭 적용)
function showStimulus(imageIndex, panelIndex) {
    resetIndicators();

    const panel = panels[panelIndex];

    console.log("showStimulus() - imageIndex (before interference):", imageIndex, "panelIndex:", panelIndex); // **추가**

    // --- 간섭 적용 ---
    const interferenceResult = introduceInterference(imageIndex, panelIndex);
    imageIndex = interferenceResult.imageIndex;
    panelIndex = interferenceResult.panelIndex;
    // --- 간섭 적용 끝 ---

    console.log("showStimulus() - imageIndex (after interference):", imageIndex, "panelIndex:", panelIndex); // **추가**
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
                    console.log("showStimulus() - 장면 미반응, sceneErrors 증가:", gameState.sceneErrors); // **추가**
                }

                if (!gameState.locationTargetProcessed && gameState.currentIsLocationTarget) {
                    showMissedTargetFeedback(locationIndicator);
                    gameState.locationErrors++;
                    console.log("showStimulus() - 위치 미반응, locationErrors 증가:", gameState.locationErrors); // **추가**
                }

                setTimeout(() => {
                    generateNextStimulus();
                }, 500);
            }, 2500); // 반응 시간 2.5초 (늘림)
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
                    console.log("showStimulus() - 장면 미반응, sceneErrors 증가:", gameState.sceneErrors); // **추가**
                }

                if (!gameState.locationTargetProcessed && gameState.currentIsLocationTarget) {
                    showMissedTargetFeedback(locationIndicator);
                    gameState.locationErrors++;
                    console.log("showStimulus() - 위치 미반응, locationErrors 증가:", gameState.locationErrors); // **추가**
                }

                setTimeout(() => {
                    endBlock();
                }, 500);
            }, 2500); // 반응 시간 2.5초 (늘림)
        }, 1000);
    }
}

// 다음 자극 생성 및 제시 함수 (기존 코드와 거의 동일)
function generateNextStimulus() {
    if (!gameState.isPlaying) return;

    const shouldBeSceneTarget = gameState.sceneTargets < 6 &&
                               Math.random() < (6 - gameState.sceneTargets) /
                               (gameState.stimuliPerBlock - gameState.currentStimulus);

    const shouldBeLocationTarget = gameState.locationTargets < 6 &&
                                  Math.random() < (6 - gameState.locationTargets) /
                                  (gameState.stimuliPerBlock - gameState.currentStimulus);

    const shouldBeBothTarget = gameState.bothTargets < 2 &&
                              Math.random() < (2 - gameState.bothTargets) /
                              (gameState.stimuliPerBlock - gameState.currentStimulus);

    let imageIndex, panelIndex;

    if (gameState.currentStimulus >= gameState.nBackLevel) {
        if (shouldBeBothTarget) {
            imageIndex = gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel];
            panelIndex = gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel];
        } else if (shouldBeSceneTarget) {
            imageIndex = gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel];
            do {
                panelIndex = Math.floor(Math.random() * panels.length);
            } while (panelIndex === gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel]);
        } else if (shouldBeLocationTarget) {
            panelIndex = gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel];
            do {
                imageIndex = Math.floor(Math.random() * imageTextures.length);
            } while (imageIndex === gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel]);
        } else {
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
        }
    } else {
        imageIndex = Math.floor(Math.random() * imageTextures.length);
        panelIndex = Math.floor(Math.random() * panels.length);
    }

    console.log("generateNextStimulus() - imageIndex:", imageIndex, "panelIndex:", panelIndex);
    showStimulus(imageIndex, panelIndex);
}

// 키 입력 처리 함수 (기존과 동일)
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

// 이미지 반응 처리 함수 (기존과 동일)
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
        console.log("handleSceneResponse() - 장면 오반응, sceneErrors 증가:", gameState.sceneErrors); // **추가**
    }
}

// 위치 반응 처리 함수 (기존과 동일)
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
        console.log("handleLocationResponse() - 위치 오반응, locationErrors 증가:", gameState.locationErrors); // **추가**
    }
}

// 블록 시작 함수 (게임 시작) (기존과 동일)
function startBlock() {
    gameState.isPlaying = true;
    gameState.currentStimulus = 0;
    gameState.sceneHistory = [];
    gameState.locationHistory = [];
    gameState.sceneTargets = 0;
    gameState.locationTargets = 0;
    gameState.bothTargets = 0;
    gameState.sceneResponses = 0,
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

// 블록 종료 함수 (한 블록 완료 후 결과 처리 및 다음 블록 준비) (기존과 동일)
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

// 모든 타이머 취소 함수 (기존과 동일)
function cancelAllTimers() {
    if (gameState.currentTimer) {
        clearTimeout(gameState.currentTimer);
    }
    if (gameState.responseWindowTimer) {
        clearTimeout(gameState.responseWindowTimer);
    }
}

// --- 이벤트 리스너 등록 --- (기존과 동일)
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

// 사용자 정의 레벨 설정 함수 (기존과 동일)
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
    document.getElementById('nBackLevel').textContent = newLevel;

    customLevelInput.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
    setTimeout(() => {
        customLevelInput.style.backgroundColor = 'rgba(255,255,255,0.9)';
    }, 500);
}


// 애니메이션 렌더링 함수 (기존과 동일)
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

