// 게임 상태를 저장하는 객체
const gameState = {
    isPlaying: false, // 게임 플레이 상태 (true: 진행 중, false: 일시 정지)
    nBackLevel: 1, // 현재 N-back 레벨 (기본값: 1)
    currentBlock: 0, // 현재 블록 번호
    maxBlocks: 12, // 최대 블록 수 (최대 블록 수, 현재 사용 안 함)
    stimuliPerBlock: 1, // 블록당 자극 제시 횟수 (기본값: 30회)
    currentStimulus: 0, // 현재 제시된 자극 횟수
    sceneHistory: [], // 장면 자극 히스토리 (이미지 인덱스 저장 배열)
    locationHistory: [], // 위치 자극 히스토리 (패널 인덱스 저장 배열)
    sceneTargets: 0, // 장면 목표 자극 횟수
    locationTargets: 0, // 위치 목표 자극 횟수
    bothTargets: 0, // 양쪽 모두 목표 자극 횟수
    sceneResponses: 0, // 장면 반응 횟수
    locationResponses: 0, // 위치 반응 횟수
    sceneErrors: 0, // 장면 오류 횟수 (오반응)
    locationErrors: 0, // 위치 오류 횟수 (오반응)
    currentTimer: null, // 자극 제시 시간 타이머
    responseWindowTimer: null, // 반응 시간 창 타이머
    sceneTargetProcessed: false, // 장면 목표 자극 처리 여부
    locationTargetProcessed: false, // 위치 목표 자극 처리 여부
    currentIsSceneTarget: false, // 현재 자극이 장면 목표 자극인지 여부
    currentIsLocationTarget: false, // 현재 자극이 위치 목표 자극인지 여부
    inResponseWindow: false, // 반응 시간 창 활성화 여부
    canRespond: true, // 반응 가능 상태 여부

    // --- 간섭 관련 설정 ---
    interferenceType: "none", // 간섭 유형 ("none", "previous", "cyclic", "next", "random") - 기본값: "none" (간섭 없음)
    randomInterferenceProbabilities: { // 랜덤 간섭 유형별 확률 (합계: 1) - interferenceType: "random" 일 때 적용
        "previous": 0.33, // 이전(previous) 간섭 확률: 33%
        "cyclic": 0.33, // 순환(cyclic) 간섭 확률: 33%
        "next": 0.34 // 다음(next) 간섭 확률: 34%
    },
    cyclicInterferenceNBackLevel: 2, // 순환 간섭 시 사용할 N-back 레벨 (기본값: 2) - interferenceType: "cyclic" 일 때 적용
    nextStimulusInfo: null, // "next" 간섭 유형을 위한 다음 자극 정보 임시 저장 변수 - interferenceType: "next" 일 때 사용
    // --- 간섭 관련 설정 끝 ---

    consecutiveGames: 0, // 연속 게임 횟수 (현재 세션 기준) - 새로 추가
    totalGamesToday: 0 // 오늘 총 게임 횟수 - 새로 추가
};

// --- [NEW] 업로드된 배경 이미지 저장 키 ---
const uploadedImagesKey = 'nbackUploadedImages';

// --- 커스터마이징 옵션 (사용자 설정 가능 변수) ---
const wallColor = 0x262626;     // 벽 색상 (gray) - Three.js Color 값 (hexadecimal)
const floorColor = 0x393734;    // 바닥 색상 (brownish) - Three.js Color 값 (hexadecimal)
const panelColor = 0x000000;    // 패널(액자) 색상 (dark gray) - Three.js Color 값 (hexadecimal)
const imageScale = 1.0;         // 이미지 크기 비율 (1.0: 원래 크기, 0.5: 절반 크기) - 1.0: 원래 크기, 0.5: 절반 크기
const randomizeStimulusColor = true; // 게임 시작 시 이미지에 랜덤 색상 입히기 여부 (true: 랜덤 색상 입힘, false: 색상 입히지 않음) - true: 랜덤 색상 적용, false: 색상 미적용
// --- 커스터마이징 옵션 끝 ---


// Three.js Scene, Camera, Renderer 설정
const scene = new THREE.Scene(); // Three.js Scene 생성 - 3D 오브젝트들을 담는 공간
scene.background = new THREE.Color(0xf0f0f0); // 캔버스 배경색 (light gray) - Three.js Color 객체 사용

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); // PerspectiveCamera 생성 (시야각, 가로세로비율, near, far) - 원근법 카메라
camera.position.set(0, 1.6, 2); // 카메라 위치 (x, y, z) - (0, 1.6, 2)는 적절한 기본 시점 (1.6은 눈높이, 2는 카메라 z축 위치)
camera.lookAt(0, 1.6, -5); // 카메라 시선 방향 (x, y, z) - (0, 1.6, -5)는 패널 중앙을 바라보게 함 (-5는 패널 z축 위치 고려)

const renderer = new THREE.WebGLRenderer({ antialias: true }); // WebGL 렌더러 생성 (antialias: 경계선 부드럽게 처리) - 3D scene 을 2D 이미지로 렌더링
renderer.setSize(window.innerWidth, window.innerHeight); // 렌더러 크기를 창 크기에 맞춤 (window.innerWidth, window.innerHeight 는 현재 창 크기)
document.body.appendChild(renderer.domElement); // 렌더러를 HTML 문서에 추가 (renderer.domElement 는 렌더링 결과를 보여주는 canvas 엘리먼트)

// 조명 설정
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // 은은한 주변광 (색상, 강도) - (색상, 강도) - 흰색(0xffffff), 강도 0.8
scene.add(ambientLight); // Scene 에 AmbientLight 추가 - scene 전체를 은은하게 밝힘

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // 방향성 광 (색상, 강도) - (색상, 강도) - 흰색(0xffffff), 강도 0.5, 그림자 생성, 입체감 부여
directionalLight.position.set(0, 1, 0); // 광원 위치 (x, y, z) - (0, 1, 0)는 위에서 아래로 비추는 효과
directionalLight.intensity = 0.8; // 광원 강도 (기본값: 1) - 0.8로 약간 감소
scene.add(directionalLight); // Scene 에 DirectionalLight 추가 - 특정 방향에서 빛을 비춤, 그림자 생성 가능

// 방 크기 설정 (단위: meters)
const roomWidth = 5; // 방 가로: 5m
const roomHeight = 3; // 방 세로: 3m
const roomDepth = 5; // 방 깊이: 5m

// 벽돌 텍스처 생성 함수 (CanvasTexture 사용)
function createBrickTexture() { // 벽돌 텍스처 생성 함수
    const canvas = document.createElement('canvas'); // Canvas 엘리먼트 생성 (HTML5 canvas) - 2D 그래픽을 그릴 수 있는 도화지
    const ctx = canvas.getContext('2d'); // 2D 렌더링 컨텍스트 가져오기 (canvas 2D API 사용) - canvas 에 그림을 그리기 위한 도구
    const width = 512; // 텍스처 가로 크기: 512px
    const height = 512; // 텍스처 세로 크기: 512px

    canvas.width = width; // Canvas 가로 크기 설정
    canvas.height = height; // Canvas 세로 크기 설정

    ctx.fillStyle = '#f5f5f5'; // 채우기 색상: light gray (#f5f5f5) - 벽돌 배경색
    ctx.fillRect(0, 0, width, height); // 사각형 채우기 (x, y, width, height) - (0, 0) 에서 시작, canvas 크기만큼 채우기 - 배경색으로 canvas 채우기

    const brickHeight = 30; // 벽돌 높이: 30px
    const brickWidth = 80; // 벽돌 너비: 80px
    const mortarSize = 5; // 모르타르(벽돌 사이 회색 부분) 크기: 5px

    ctx.fillStyle = '#e0e0e0'; // 벽돌 색상: light gray (#e0e0e0) - 실제 벽돌 색

    let offsetX = 0; // 가로 방향 offset (벽돌 패턴 어긋나게 하기 위해) - 벽돌 패턴을 자연스럽게 보이게 하기 위해
    for (let y = 0; y < height; y += brickHeight + mortarSize) { // 세로 방향 반복 (y축 따라 벽돌 쌓기) - 한 줄씩 벽돌 쌓기
        offsetX = (Math.floor(y / (brickHeight + mortarSize)) % 2) * (brickWidth / 2); // y 좌표에 따라 offsetX 계산 (짝수/홀수 줄 다르게) - 벽돌 줄마다 offset 을 다르게 하여 벽돌 패턴 생성
        for (let x = -brickWidth/2; x < width + brickWidth/2; x += brickWidth + mortarSize) { // 가로 방향 반복 (x축 따라 벽돌 쌓기) - 한 줄에 여러 개의 벽돌 쌓기
            ctx.fillRect(x + offsetX, y, brickWidth, brickHeight); // 벽돌 사각형 그리기 (x + offsetX, y) 위치에 brickWidth x brickHeight 크기로 - 벽돌 하나 그리기

            ctx.fillStyle = '#d8d8d8'; // 벽돌 얼룩 색상: gray (#d8d8d8) - 벽돌 표면에 얼룩 표현
            for (let i = 0; i < 15; i++) { // 얼룩 15개 생성 - 벽돌 하나당 15개의 얼룩 생성
                const spotX = x + offsetX + Math.random() * brickWidth; // 얼룩 x 좌표 (벽돌 내부 랜덤 위치) - 벽돌 내부 랜덤 위치에 얼룩 생성
                const spotY = y + Math.random() * brickHeight; // 얼룩 y 좌표 (벽돌 내부 랜덤 위치) - 벽돌 내부 랜덤 위치에 얼룩 생성
                const spotSize = 1 + Math.random() * 3; // 얼룩 크기 (1~4px 랜덤) - 얼룩 크기 랜덤하게 설정
                ctx.beginPath(); // 새로운 path 시작 - 새로운 얼룩을 그리기 위해 path 시작
                ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2); // 원 그리기 (얼룩) (중심 x, 중심 y, 반지름, 시작 각도, 종료 각도) - Math.PI * 2 는 360도 (완전한 원) - 원 모양의 얼룩 그리기
                ctx.fill(); // 현재 path 채우기 (fillStyle: #d8d8d8) - 현재 설정된 색상으로 원 채우기
            }

            ctx.fillStyle = '#e0e0e0'; // 벽돌 색상 복원 (다음 벽돌 위해) - 다음 벽돌을 위해 색상 복원
        }
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // 모르타르 그림자 색상: 검정색, 투명도 0.1 - 모르타르 그림자 색상 설정
    for (let y = 0; y < height; y += brickHeight + mortarSize) { // 세로 모르타르 그림자 - 세로 방향 모르타르 그림자 표현
        ctx.fillRect(0, y - 1, width, 2); // 가로 사각형 채우기 (모르타르 그림자) - y - 1 위치에 높이 2px 로 그림자 효과 - 가로 방향으로 얇은 사각형 그림자 그림
        offsetX = (Math.floor(y / (brickHeight + mortarSize)) % 2) * (brickWidth / 2); // offsetX 다시 계산 (가로 모르타르 그림자 위해) - 가로 방향 그림자를 위해 offset 다시 계산
        for (let x = -brickWidth/2; x < width + brickWidth/2; x += brickWidth + mortarSize) { // 가로 모르타르 그림자 - 가로 방향 모르타르 그림자 표현
            ctx.fillRect(x + offsetX - 1, y, 2, brickHeight); // 세로 사각형 채우기 (모르타르 그림자) - x - 1 위치에 너비 2px 로 그림자 효과 - 세로 방향으로 얇은 사각형 그림자 그림
        }
    }

    return new THREE.CanvasTexture(canvas); // CanvasTexture 생성 및 반환 (Three.js 텍스처로 사용) - canvas 에 그린 그림을 Three.js 텍스처로 만들어 반환
}

const brickTexture = createBrickTexture(); // 벽돌 텍스처 생성 - createBrickTexture 함수 호출하여 벽돌 텍스처 생성
brickTexture.wrapS = THREE.RepeatWrapping; // 텍스처 가로 반복 설정 (RepeatWrapping: 반복) - 텍스처가 가로 방향으로 반복되도록 설정
brickTexture.wrapT = THREE.RepeatWrapping; // 텍스처 세로 반복 설정 (RepeatWrapping: 반복) - 텍스처가 세로 방향으로 반복되도록 설정
brickTexture.repeat.set(2, 1); // 텍스처 반복 횟수 설정 (가로 2번, 세로 1번) - 벽돌 텍스처는 가로로만 반복

const wallMaterial = new THREE.MeshStandardMaterial({ // 벽 재질 생성 (MeshStandardMaterial: standard lighting 모델 재질) - 빛에 반응하는 재질
    map: brickTexture, // 텍스처: brickTexture (벽돌 텍스처) - 벽 재질에 벽돌 텍스처 적용
    roughness: 0.0, // 표면 거칠기: 0 (매끄러운 표면) - 빛 반사 강하게 - 표면이 매끄러워서 빛을 거울처럼 반사
    metalness: 0.0, // 금속성: 0 (비금속) - 나무, 플라스틱, 벽돌 등 비금속 재질 - 금속 재질이 아니므로 금속성 0
    color: wallColor // 기본 색상: wallColor (light gray) - 커스터마이징 옵션 - 벽 기본 색상 설정 (커스터마이징 가능)
});

const wallGeometry = new THREE.BoxGeometry(0.1, roomHeight, roomDepth); // 벽 geometry 생성 (BoxGeometry: 육면체 geometry) - (width, height, depth) - 얇은 육면체로 벽 표현 - 벽의 형태를 정의하는 geometry (여기서는 얇은 육면체)

const leftWall = new THREE.Mesh(wallGeometry, wallMaterial); // 왼쪽 벽 Mesh 생성 (geometry, material) - Mesh: geometry 와 material 결합, scene 에 추가되어 렌더링됨 - geometry 와 material 을 결합하여 실제 벽 오브젝트 생성
leftWall.position.set(-roomWidth/2, roomHeight/2, 0); // 왼쪽 벽 위치 설정 (x, y, z) - 방 중앙 기준 왼쪽 벽 - 방 중앙 기준으로 왼쪽 벽 위치 설정
scene.add(leftWall); // Scene 에 왼쪽 벽 추가 - scene 에 왼쪽 벽 추가하여 화면에 보이도록 함

const rightWall = new THREE.Mesh(wallGeometry, wallMaterial); // 오른쪽 벽 Mesh 생성 (geometry, material) - geometry 와 material 을 결합하여 실제 벽 오브젝트 생성
rightWall.position.set(roomWidth/2, roomHeight/2, 0); // 오른쪽 벽 위치 설정 (x, y, z) - 방 중앙 기준 오른쪽 벽 - 방 중앙 기준으로 오른쪽 벽 위치 설정
scene.add(rightWall); // Scene 에 오른쪽 벽 추가 - scene 에 오른쪽 벽 추가하여 화면에 보이도록 함

const backWallGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, 0.1); // 뒤쪽 벽 geometry 생성 (BoxGeometry: 육면체 geometry) - 뒤쪽 벽 형태 정의
const backWall = new THREE.Mesh(backWallGeometry, wallMaterial); // 뒤쪽 벽 Mesh 생성 (geometry, material) - geometry 와 material 결합
backWall.position.set(0, roomHeight/2, -roomDepth/2); // 뒤쪽 벽 위치 설정 (x, y, z) - 방 중앙 기준 뒤쪽 벽 - 방 중앙 기준으로 뒤쪽 벽 위치 설정
scene.add(backWall); // Scene 에 뒤쪽 벽 추가 - scene 에 뒤쪽 벽 추가

// 나무 바닥 텍스처 생성 함수 (CanvasTexture 사용)
function createWoodTexture() { // 나무 바닥 텍스처 생성 함수
    const canvas = document.createElement('canvas'); // Canvas 엘리먼트 생성 - 2D 그래픽 도화지
    canvas.width = 512; // 텍스처 가로 크기: 512px
    canvas.height = 512; // 텍스처 세로 크기: 512px
    const context = canvas.getContext('2d'); // 2D 렌더링 컨텍스트 가져오기 - 2D 그림 그리기 도구

    context.fillStyle = '#8B4513'; // 바닥 기본 색상: dark brown (#8B4513) - 바닥 전체 배경색
    context.fillRect(0, 0, canvas.width, canvas.height); // Canvas 전체 채우기 - 배경색으로 canvas 채우기

    for (let i = 0; i < 40; i++) { // 나뭇결 40개 생성 - 바닥에 나뭇결 표현
        const x = Math.random() * canvas.width; // 나뭇결 x 좌표 (canvas 가로 범위 랜덤) - 랜덤한 가로 위치에 나뭇결 생성
        context.strokeStyle = `rgba(139, 69, 19, ${Math.random() * 0.5})`; // 나뭇결 색상: brown, 투명도 랜덤 (0~0.5) - 나뭇결 색상과 투명도 랜덤 설정
        context.lineWidth = 1 + Math.random() * 10; // 나뭇결 굵기: 1~11px 랜덤 - 나뭇결 굵기 랜덤 설정
        context.beginPath(); // 새 path 시작 - 새로운 나뭇결 path 시작
        context.moveTo(x, 0); // 시작점 (x, 0) - canvas 위쪽 - 나뭇결 시작점 canvas 위쪽으로 설정
        context.lineTo(x + Math.random() * 50 - 25, canvas.height); // 끝점 (x + 랜덤 offset, canvas 높이) - 약간 기울어진 나뭇결 표현 - 나뭇결 끝점 canvas 아래쪽, 약간 기울어지게 설정
        context.stroke(); // path 획 긋기 (strokeStyle, lineWidth 적용) - 설정된 스타일로 나뭇결 그리기
    }

    for (let i = 0; i < 30; i++) { // 옹이 30개 생성 - 바닥에 옹이 표현
        const y = Math.random() * canvas.height; // 옹이 y 좌표 (canvas 세로 범위 랜덤) - 랜덤한 세로 위치에 옹이 생성
        const width = 2 + Math.random() * 10; // 옹이 굵기: 2~12px 랜덤 - 옹이 굵기 랜덤 설정
        context.fillStyle = `rgba(60, 30, 15, ${Math.random() * 0.3})`; // 옹이 색상: dark brown, 투명도 랜덤 (0~0.3) - 옹이 색상과 투명도 랜덤 설정
        context.fillRect(0, y, canvas.width, width); // 가로 사각형 채우기 (옹이) - (0, y) 에서 시작, canvas 너비, width 높이 - 가로 방향으로 얇고 긴 사각형 옹이 그림
    }

    for (let i = 0; i < 800; i++) { // 먼지/스크래치 800개 생성 - 바닥에 먼지, 스크래치 표현
        const x = Math.random() * canvas.width; // 먼지/스크래치 x 좌표 - 랜덤 x 좌표
        const y = Math.random() * canvas.height; // 먼지/스크래치 y 좌표 - 랜덤 y 좌표
        const radius = 1 + Math.random() * 2; // 먼지/스크래치 크기: 1~3px 랜덤 - 먼지/스크래치 크기 랜덤 설정
        context.fillStyle = `rgba(200, 150, 100, ${Math.random() * 0.2})`; // 먼지/스크래치 색상: light brown, 투명도 랜덤 (0~0.2) - 먼지/스크래치 색상, 투명도 랜덤 설정
        context.beginPath(); // 새 path 시작 - 새로운 먼지/스크래치 path 시작
        context.arc(x, y, radius, 0, Math.PI * 2); // 원 그리기 (먼지/스크래치) - 원 모양 먼지/스크래치 그림
        context.fill(); // path 채우기 - 먼지/스크래치 채우기
    }

    return new THREE.CanvasTexture(canvas); // CanvasTexture 생성 및 반환 - canvas 그림을 Three.js 텍스처로 반환
}

const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth); // 바닥 geometry 생성 (PlaneGeometry: 평면 geometry) - (width, depth) - roomWidth x roomDepth 크기 - 평면 geometry 로 바닥 형태 정의
const woodTexture = createWoodTexture(); // 나무 바닥 텍스처 생성 - createWoodTexture 함수 호출하여 나무 바닥 텍스처 생성
woodTexture.wrapS = THREE.RepeatWrapping; // 텍스처 가로 반복 설정 - 텍스처 가로 반복 설정
woodTexture.wrapT = THREE.RepeatWrapping; // 텍스처 세로 반복 설정 - 텍스처 세로 반복 설정
woodTexture.repeat.set(4, 4); // 텍스처 반복 횟수 설정 (가로 4번, 세로 4번) - 바닥 텍스처 반복 횟수 설정

const floorMaterial = new THREE.MeshStandardMaterial({ // 바닥 재질 생성 (MeshStandardMaterial) - 빛에 반응하는 재질
    map: woodTexture, // 텍스처: woodTexture (나무 바닥 텍스처) - 바닥 재질에 나무 바닥 텍스처 적용
    roughness: 0.8, // 표면 거칠기: 0.8 (약간 거친 표면) - 빛 diffuse 반사 - 표면이 약간 거칠어서 빛을 diffuse 하게 (넓게) 반사
    metalness: 0.2, // 금속성: 0.2 (약간 금속성) - 나무 재질에 약간의 금속성 추가 - 나무 재질에 약간의 금속성 추가
    color: floorColor // 기본 색상: floorColor (나무 색상) - 커스터마이징 옵션 - 바닥 기본 색상 (커스터마이징 옵션)
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial); // 바닥 Mesh 생성 (geometry, material) - geometry, material 결합하여 바닥 mesh 생성
floor.rotation.x = -Math.PI / 2; // 바닥 x축 회전 (-90도) - PlaneGeometry 는 기본적으로 vertical plane 이므로 horizontal plane 으로 변경 - 기본 vertical plane 을 horizontal plane 으로 변경 (바닥으로 눕힘)
floor.receiveShadow = true; // 그림자 드리우기 허용 (바닥에 그림자) - 바닥에 그림자 드리우도록 설정
scene.add(floor); // Scene 에 바닥 추가 - scene 에 바닥 추가

const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth); // 천장 geometry 생성 (PlaneGeometry) - 평면 geometry 로 천장 형태 정의
const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial); // 천장 Mesh 생성 (geometry, material) - 벽과 동일한 재질 사용
ceiling.rotation.x = Math.PI / 2; // 천장 x축 회전 (90도) - 바닥과 반대 방향으로 horizontal plane 만들기 - 바닥과 반대 방향으로 회전시켜 천장으로 만듦
ceiling.position.y = roomHeight; // 천장 y 좌표: roomHeight (방 높이) - 방 천장 위치 - 천장을 방 높이만큼 위로 올림
scene.add(ceiling); // Scene 에 천장 추가 - scene 에 천장 추가

const panelWidth = 1.0; // 패널(액자) 가로 크기: 1m
const panelHeight = 1.0; // 패널(액자) 세로 크기: 1m
const panelDepth = 0.02; // 패널(액자) 깊이: 2cm (얇은 판)

const panelMaterial = new THREE.MeshStandardMaterial({ // 패널(액자) 재질 생성 (MeshStandardMaterial) - 패널 재질 (빛에 반응)
    color: panelColor, // 기본 색상: panelColor (light gray) - 커스터마이징 옵션 - 패널 기본 색상 (커스터마이징)
    roughness: 0.5, // 표면 거칠기: 0.5 (중간 정도 거칠기) - 표면 거칠기 중간 정도로 설정
    metalness: 0.0 // 금속성: 0 (비금속) - 금속 재질 아님
});

const panels = []; // 패널(액자) Mesh 들을 저장할 배열 - 생성된 패널 mesh 들을 저장할 배열

const panelPositions = [ // 패널(액자) 위치 및 회전 정보 배열 - 8개 패널 위치, 회전 정보 정의
    { x: -1.3, y: 1.9, z: -roomDepth/2 + 0.06, rotation: [0, 0, 0] }, // 뒤쪽 벽 위쪽 왼쪽 패널
    { x: 1.3, y: 1.9, z: -roomDepth/2 + 0.06, rotation: [0, 0, 0] }, // 뒤쪽 벽 위쪽 오른쪽 패널
    { x: -1.3, y: 0.8, z: -roomDepth/2 + 0.06, rotation: [0, 0, 0] }, // 뒤쪽 벽 아래쪽 왼쪽 패널
    { x: 1.3, y: 0.8, z: -roomDepth/2 + 0.06, rotation: [0, 0, 0] }, // 뒤쪽 벽 아래쪽 오른쪽 패널
    { x: -roomWidth/2 + 0.06, y: 1.9, z: -0.5, rotation: [0, Math.PI/2, 0] }, // 왼쪽 벽 위쪽 패널
    { x: -roomWidth/2 + 0.06, y: 0.8, z: -0.5, rotation: [0, Math.PI/2, 0] }, // 왼쪽 벽 아래쪽 패널
    { x: roomWidth/2 - 0.06, y: 1.9, z: -0.5, rotation: [0, -Math.PI/2, 0] }, // 오른쪽 벽 위쪽 패널
    { x: roomWidth/2 - 0.06, y: 0.8, z: -0.5, rotation: [0, -Math.PI/2, 0] }  // 오른쪽 벽 아래쪽 패널
];

panelPositions.forEach((pos, index) => { // panelPositions 배열 순회하며 패널 생성 - 각 위치 정보에 따라 패널 생성
    const panelGroup = new THREE.Group(); // 패널 그룹 생성 (Group: 여러 object 묶는 컨테이너) - 패널과 이미지를 그룹으로 묶기 위해 group 사용

    const panel = new THREE.Mesh( // 패널 Mesh 생성 (BoxGeometry, panelMaterial) - 패널 mesh 생성
        new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth), // 패널 geometry (BoxGeometry) - 패널 형태 (얇은 육면체)
        panelMaterial // 패널 material (panelMaterial) - 패널 재질
    );
    panelGroup.add(panel); // 패널 그룹에 패널 Mesh 추가 - 패널 그룹에 패널 mesh 추가

    panelGroup.position.set(pos.x, pos.y, pos.z); // 패널 그룹 위치 설정 (panelPositions 에서 가져옴) - 위치 정보 설정
    panelGroup.rotation.set(pos.rotation[0], pos.rotation[1], pos.rotation[2]); // 패널 그룹 회전 설정 (panelPositions 에서 가져옴) - rotation: [x축 회전, y축 회전, z축 회전] - 회전 정보 설정

    scene.add(panelGroup); // Scene 에 패널 그룹 추가 - scene 에 패널 그룹 추가

    panels.push({ // panels 배열에 패널 정보 저장 - 생성된 패널 정보 저장
        group: panelGroup, // 패널 그룹 - 패널 그룹
        position: index, // 패널 위치 인덱스 (0~7) - 패널 위치 index
        panel: panel, // 패널 Mesh - 패널 mesh
        rotation: pos.rotation, // 패널 회전 정보 - 패널 회전 정보
        stimulusObject: null // 자극 object (image plane) - 초기값: null, 자극 제시될 때 image plane 으로 채워짐 - 자극 이미지 plane 을 저장할 속성, 초기 null
    });
});

// 이미지 로더 생성 및 이미지 텍스처 배열 준비
const imageLoader = new THREE.TextureLoader(); // TextureLoader 생성 (이미지 로드) - 이미지 로드에 사용
const imageTextures = []; // 이미지 텍스처 저장 배열 - 로드된 이미지 텍스처 저장 배열

// --- 수정된 랜덤 색상 팔레트 ---
const distinctColors = [ // 뚜렷한 색상 팔레트 (액자 색과 대비되는 색상) - 랜덤 색상 팔레트, 액자 색과 대비되는 색상
    new THREE.Color(0.8, 0.2, 0.2), // Red (약간 어두운 빨강)
    new THREE.Color(0.2, 0.6, 0.8), // Cyan (청록색)
    new THREE.Color(0.3, 0.7, 0.3), // Green (녹색)
    new THREE.Color(0.9, 0.5, 0.1), // Orange (주황색)
    new THREE.Color(0.6, 0.3, 0.7), // Purple (보라색)
    new THREE.Color(0.2, 0.4, 0.9), // Blue (파랑)
    new THREE.Color(0.7, 0.7, 0.2)  // Yellow-Green (연두색)
];

// 랜덤 색상 생성 함수 (수정됨: 팔레트 사용)
function getRandomColor() { // 랜덤 색상 생성 함수 (팔레트에서 랜덤 선택) - 팔레트에서 랜덤 색상 선택 함수
    return distinctColors[Math.floor(Math.random() * distinctColors.length)]; // 팔레트에서 랜덤 색상 선택 및 반환 - 팔레트에서 랜덤 index 선택하여 색상 반환
}

// 이미지 파일 이름 목록 (images 폴더 안의 이미지 파일 이름들을 여기에 추가)
const imageFilenames = []; // 이미지 파일 이름 저장 배열 - 이미지 파일 이름 저장 배열
for (let i = 1; i <= 101; i++) { // 1부터 101까지 반복 (101개 이미지 파일) - 101개 이미지 파일 이름 생성
    const filename = `image${String(i).padStart(3, '0')}.png`; // 이미지 파일 이름 생성 (image001.png, image002.png, ..., image101.png) - padStart(3, '0') : 3자리 숫자 (앞에 0 채움) - 파일 이름 형식 지정 (image001.png, image002.png ...)
    imageFilenames.push(filename); // 배열에 파일 이름 추가 - 생성된 파일 이름 배열에 추가
}
console.log("imageFilenames 배열 길이:", imageFilenames.length); // imageFilenames 배열 길이 콘솔에 출력 - 디버깅 용도 - 파일 이름 배열 길이 콘솔에 출력 (디버깅)

imageFilenames.forEach((filename) => { // imageFilenames 배열 순회하며 이미지 텍스처 로드 - 파일 이름 배열 순회하며 텍스처 로드
    const texture = imageLoader.load(`images/${filename}`); // TextureLoader 로 이미지 로드 - 비동기 로드 - 이미지 로더로 이미지 파일 로드 (비동기)
    let color = null; // 색상 변수 초기화 (기본값: null) - 색상 변수 초기화
    if (randomizeStimulusColor) { // randomizeStimulusColor 옵션이 true 이면 (커스터마이징 옵션) - 커스터마이징 옵션에 따라 랜덤 색상 적용 여부 결정
        color = getRandomColor(); // 랜덤 색상 생성 (getRandomColor 함수 호출) - 랜덤 색상 생성 함수 호출
    }
    imageTextures.push({ texture: texture, color: color }); // imageTextures 배열에 텍스처와 색상 정보 저장 (object 형태로 저장) - 로드된 텍스처와 색상 정보를 배열에 저장
});
console.log("imageTextures 배열 길이:", imageTextures.length); // imageTextures 배열 길이 콘솔에 출력 - 디버깅 용도 - 이미지 텍스처 배열 길이 콘솔에 출력 (디버깅)


// 자극 이미지 생성 함수
function createStimulusImage(imageIndex, panel) { // 자극 이미지 생성 함수 (imageIndex: 이미지 텍스처 인덱스, panel: 패널 object) - 자극 이미지 생성 함수
    clearStimulus(panel); // 기존 자극 제거 (새 자극 생성 전에) - 새 자극 생성 전에 기존 자극 제거

    const imageGeometry = new THREE.PlaneGeometry(panelWidth * imageScale, panelHeight * imageScale); // 이미지 geometry 생성 (PlaneGeometry) - 패널 크기에 imageScale 비율 적용 - 이미지 plane geometry 생성, 크기 조절
    const imageMaterial = new THREE.MeshBasicMaterial({ // 이미지 material 생성 (MeshBasicMaterial: lighting 영향 안 받는 재질) - lighting 에 영향 받지 않는 재질 사용
        map: imageTextures[imageIndex].texture, // 텍스처: imageTextures 배열에서 imageIndex 에 해당하는 텍스처 - 이미지 텍스처 적용
        transparent: true, // 투명 배경 활성화 - PNG 이미지 투명 배경 처리 - 이미지 배경 투명하게 처리
        blending: THREE.NormalBlending // 블렌딩 모드 설정 (NormalBlending: 기본 블렌딩) - 투명 배경 제대로 처리 위해 - 블렌딩 모드 설정 (투명 배경 처리)
    });
    if (imageTextures[imageIndex].color) { // imageTextures 에 색상 정보 있으면 - 이미지 텍스처에 색상 정보 있으면
        imageMaterial.color = imageTextures[imageIndex].color; // material color 에 색상 적용 - 랜덤 색상 적용 - 랜덤 색상 적용
    }
    const imagePlane = new THREE.Mesh(imageGeometry, imageMaterial); // 이미지 Plane Mesh 생성 (geometry, material) - 이미지 plane mesh 생성
    imagePlane.position.set(0, 0, panelDepth / 2 + 0.01); // 이미지 Plane 위치 설정 (패널 약간 앞으로) - z축 offset - 패널보다 약간 앞으로 위치시켜 잘 보이게 함

    panel.group.add(imagePlane); // 패널 그룹에 이미지 Plane 추가 (패널 위에 이미지 보이도록) - 패널 그룹에 이미지 plane 추가, 패널 위에 보이게 함
    panel.stimulusObject = imagePlane; // 패널 object 의 stimulusObject 속성에 이미지 Plane 저장 - 나중에 자극 제거 위해 - 생성된 이미지 plane 을 패널 object 에 저장, 나중에 제거 위해

    return imagePlane; // 생성된 이미지 Plane 반환 (필요한 경우) - 생성된 이미지 plane 반환 (필요시 사용)
}

// 패널의 자극(이미지) 제거 함수
function clearStimulus(panel) { // 패널의 자극(이미지) 제거 함수 (panel: 패널 object) - 특정 패널의 자극 제거 함수
    if (panel.stimulusObject) { // 패널에 stimulusObject (이미지 Plane) 가 있으면 - 패널에 자극 이미지 plane 이 있으면
        panel.group.remove(panel.stimulusObject); // 패널 그룹에서 이미지 Plane 제거 (화면에서 안 보이게) - 패널 그룹에서 이미지 plane 제거, 화면에서 안 보이게 함
        panel.stimulusObject = null; // 패널 object 의 stimulusObject 속성 null 로 초기화 - 패널 object 의 자극 정보 초기화
    }
}

// 모든 패널의 자극(이미지) 제거 함수
function clearAllStimuli() { // 모든 패널의 자극(이미지) 제거 함수 - 모든 패널의 자극 제거 함수
    panels.forEach(panel => { // panels 배열 순회 - 모든 패널에 대해 반복
        clearStimulus(panel); // 각 패널에 대해 clearStimulus 함수 호출 - 각 패널의 자극 제거
    });
}

// 반응 지시 박스 (S, L) 엘리먼트 가져오기
const sceneIndicator = document.getElementById('scene-indicator'); // HTML element (scene indicator box) 가져오기 - 이미지 반응 지시 - 'S' indicator box element 가져오기
const locationIndicator = document.getElementById('location-indicator'); // HTML element (location indicator box) 가져오기 - 위치 반응 지시 - 'L' indicator box element 가져오기

// 반응 지시 박스 상태 초기화 함수
function resetIndicators() { // 반응 지시 박스 상태 초기화 함수 - 매 자극 제시 전에 호출 - indicator box 상태 초기화 함수
    sceneIndicator.classList.remove('correct', 'incorrect', 'missed', 'early'); // 모든 class 제거 (correct, incorrect, missed, early) - indicator box 초기 상태로 - indicator box 의 모든 상태 class 제거
    locationIndicator.classList.remove('correct', 'incorrect', 'missed', 'early'); // 모든 class 제거 (correct, incorrect, missed, early) - indicator box 초기 상태로 - indicator box 의 모든 상태 class 제거
    gameState.sceneTargetProcessed = false; // 장면 목표 자극 처리 여부 초기화 - 장면 목표 자극 처리 여부 초기화
    gameState.locationTargetProcessed = false; // 위치 목표 자극 처리 여부 초기화 - 위치 목표 자극 처리 여부 초기화
    gameState.canRespond = true; // 반응 가능 상태로 설정 - 조기 반응 방지 위해 - 반응 가능 상태로 설정 (조기 반응 방지)
}

// 반응 지시 박스에 피드백 표시 함수
function showIndicatorFeedback(indicator, isCorrect) { // 반응 지시 박스 피드백 표시 함수 (indicator: indicator box element, isCorrect: 정답 여부) - indicator box 에 피드백 표시 함수
    if (isCorrect) { // 정답이면 - 정답인 경우
        indicator.classList.add('correct'); // 'correct' class 추가 - indicator box 초록색으로 변경 (CSS) - 'correct' class 추가 (초록색 표시)
    } else { // 오답이면 - 오답인 경우
        indicator.classList.add('incorrect'); // 'incorrect' class 추가 - indicator box 빨간색으로 변경 (CSS) - 'incorrect' class 추가 (빨간색 표시)
    }
}

// 조기 반응 피드백 표시 함수
function showEarlyResponseFeedback(indicator) { // 조기 반응 피드백 표시 함수 (indicator: indicator box element) - 조기 반응 시 피드백 표시 함수
    indicator.classList.add('early'); // 'early' class 추가 - indicator box 파란색으로 변경 (CSS) - 'early' class 추가 (파란색 표시) - 너무 빨리 반응했을 때 피드백
}

// 미반응 (missed) 타겟 피드백 표시 함수
function showMissedTargetFeedback(indicator) { // 미반응 (missed) 타겟 피드백 표시 함수 (indicator: indicator box element) - 미반응 시 피드백 표시 함수
    indicator.classList.add('missed'); // 'missed' class 추가 - indicator box 빨간색으로 변경 (CSS) - 'missed' class 추가 (빨간색 표시) - 반응 시간 초과로 미반응 처리되었을 때 피드백
}

// --- 간섭 적용 함수 ---
function introduceInterference(currentImageIndex, currentPanelIndex) { // 간섭 적용 함수 (currentImageIndex: 현재 이미지 인덱스, currentPanelIndex: 현재 패널 인덱스) - 간섭 적용 함수
    let currentInterferenceType = gameState.interferenceType; // 현재 간섭 유형 가져오기 - 현재 설정된 간섭 유형 가져오기

    if (currentInterferenceType === "none") { // 간섭 유형이 "none" 이면 - 간섭 유형이 'none' (간섭 없음) 이면
        return { imageIndex: currentImageIndex, panelIndex: currentPanelIndex }; // 간섭 없음 - 원래 자극 정보 그대로 반환 - 원래 자극 정보 그대로 반환 (간섭 없음)
    }

    // --- 랜덤 간섭 유형 선택 ---
    if (currentInterferenceType === "random") { // 간섭 유형이 "random" 이면 - 간섭 유형이 'random' 이면 (랜덤 간섭 유형 선택)
        const rand = Math.random(); // 0~1 사이 랜덤 값 생성 - 0~1 사이 랜덤 값 생성
        let cumulativeProbability = 0; // 누적 확률 변수 초기화 - 누적 확률 변수 초기화

        for (const type in gameState.randomInterferenceProbabilities) { // randomInterferenceProbabilities object 순회 - 랜덤 간섭 확률 객체 순회
            cumulativeProbability += gameState.randomInterferenceProbabilities[type]; // 누적 확률에 현재 간섭 유형 확률 더하기 - 현재 간섭 유형 확률 누적
            if (rand < cumulativeProbability) { // 랜덤 값이 누적 확률보다 작으면 - 랜덤 값이 누적 확률보다 작으면 해당 유형 선택
                currentInterferenceType = type; // 현재 간섭 유형을 선택된 유형으로 설정 - 현재 간섭 유형을 선택된 유형으로 설정
                break; // 반복문 종료 - 반복문 종료
            }
        }
        console.log("랜덤 간섭 유형 선택:", currentInterferenceType); // 선택된 랜덤 간섭 유형 콘솔에 출력 - 디버깅 용도 - 선택된 랜덤 간섭 유형 콘솔에 출력 (디버깅)
    }

    // --- 간섭 발생 확률 (개별 간섭 유형 확률 -> 전체 간섭 확률로 변경) ---
    const interferenceChance = 0.35; // 전체 간섭 발생 확률 (35%) - 필요에 따라 조절 - 모든 간섭 유형에 공통 적용 - 전체 간섭 발생 확률 (35%)
    if (Math.random() < interferenceChance) { // 전체 간섭 발생 확률에 따라 간섭 적용 여부 결정 - 설정된 확률에 따라 간섭 발생 여부 결정
        let interferedImageIndex = currentImageIndex; // 간섭된 이미지 인덱스 변수 초기화 (기본값: 현재 이미지 인덱스) - 간섭될 이미지 index 변수 초기화
        let interferedPanelIndex = currentPanelIndex; // 간섭된 패널 인덱스 변수 초기화 (기본값: 현재 패널 인덱스) - 간섭될 패널 index 변수 초기화

        // --- 선택된 간섭 유형에 따라 간섭 적용 ---

        if (currentInterferenceType === "previous" && gameState.currentStimulus > 0) { // 간섭 유형 "previous" 이고, 현재 자극 횟수가 0보다 크면 (최소 2번째 자극부터) - 간섭 유형이 'previous' 이고, 자극 횟수가 2회 이상이면 (최소 1-back 가능)
            // 한 트라이얼 이전 간섭
            const previousImageIndex = gameState.sceneHistory[gameState.currentStimulus - 1]; // 1-back 이전 이미지 인덱스 - 1-back 이전 이미지 index 가져오기
            const previousPanelIndex = gameState.locationHistory[gameState.currentStimulus - 1]; // 1-back 이전 패널 인덱스 - 1-back 이전 패널 index 가져오기

            const type = Math.random(); // 이미지 또는 위치 중 어떤 것을 간섭할지 랜덤 결정 - 0~1 사이 랜덤 값 - 이미지/위치 중 어떤 것을 간섭할지 랜덤 결정
            if (type < 0.5) { // 50% 확률로 이미지 간섭 - 50% 확률로 이미지 간섭
                // 이미지 간섭
                interferedImageIndex = previousImageIndex; // 간섭된 이미지 인덱스 = 1-back 이전 이미지 인덱스 - 현재 이미지 -> 1-back 이전 이미지로 대체 - 간섭된 이미지 index = 1-back 이전 이미지 index (이미지 간섭)
                // 위치는 그대로 유지 (또는 필요에 따라 위치도 약간 변경 가능) - 위치는 그대로 유지
            } else { // 나머지 50% 확률로 위치 간섭 - 나머지 50% 확률로 위치 간섭
                // 위치 간섭
                interferedPanelIndex = previousPanelIndex; // 간섭된 패널 인덱스 = 1-back 이전 패널 인덱스 - 현재 위치 -> 1-back 이전 위치로 대체 - 간섭된 패널 index = 1-back 이전 패널 index (위치 간섭)
                // 이미지는 그대로 유지 - 이미지는 그대로 유지
            }
            console.log("간섭 적용 (이전):", "type=", type < 0.5 ? "image" : "location"); // 콘솔에 간섭 적용 정보 출력 - 디버깅 용도 - 간섭 적용 정보 콘솔 출력 (디버깅)

        } else if (currentInterferenceType === "cyclic" && gameState.currentStimulus >= gameState.cyclicInterferenceNBackLevel) { // 간섭 유형 "cyclic" 이고, 현재 자극 횟수가 cyclicInterferenceNBackLevel 보다 크거나 같으면 (최소 N-back+1 번째 자극부터) - 간섭 유형 'cyclic' 이고, 자극 횟수가 cyclicInterferenceNBackLevel 이상이면 (최소 N-back+1 번째 자극부터)
            // 순환 간섭 (N-back 이전)
            const cyclicNBackLevel = gameState.cyclicInterferenceNBackLevel; // 순환 간섭 N-back 레벨 (gameState.cyclicInterferenceNBackLevel) - 순환 간섭 N-back 레벨 가져오기
            const cyclicImageIndex = gameState.sceneHistory[gameState.currentStimulus - cyclicNBackLevel]; // N-back 이전 이미지 인덱스 - N-back 이전 이미지 index 가져오기
            const cyclicPanelIndex = gameState.locationHistory[gameState.currentStimulus - cyclicNBackLevel]; // N-back 이전 패널 인덱스 - N-back 이전 패널 index 가져오기

             const type = Math.random(); // 이미지 또는 위치 중 어떤 것을 간섭할지 랜덤 결정 - 이미지/위치 중 어떤 것을 간섭할지 랜덤 결정
            if (type < 0.5) { // 50% 확률로 이미지 간섭 - 50% 확률로 이미지 간섭
                // 이미지 간섭
                interferedImageIndex = cyclicImageIndex; // 간섭된 이미지 인덱스 = N-back 이전 이미지 인덱스 - 현재 이미지 -> N-back 이전 이미지로 대체 - 간섭된 이미지 index = N-back 이전 이미지 index (이미지 간섭)
                // 위치는 그대로 유지 - 위치는 그대로 유지
            } else { // 나머지 50% 확률로 위치 간섭 - 나머지 50% 확률로 위치 간섭
                // 위치 간섭
                interferedPanelIndex = cyclicPanelIndex; // 간섭된 패널 인덱스 = N-back 이전 패널 인덱스 - 현재 위치 -> N-back 이전 위치로 대체 - 간섭된 패널 index = N-back 이전 패널 index (위치 간섭)
                // 이미지는 그대로 유지 - 이미지는 그대로 유지
            }
             console.log("간섭 적용 (순환, N=" + cyclicNBackLevel + "):", "type=", type < 0.5 ? "image" : "location"); // 콘솔에 간섭 적용 정보 출력 - 디버깅 용도 - 간섭 적용 정보 콘솔 출력 (디버깅)
        } else if (currentInterferenceType === "next" && gameState.nextStimulusInfo) { // 간섭 유형 "next" 이고, nextStimulusInfo 가 있으면 (generateNextStimulus 함수에서 다음 자극 정보 저장) - 간섭 유형 'next' 이고, nextStimulusInfo 가 있으면 (generateNextStimulus 에서 저장)
            // "Next" 간섭 (generateNextStimulus 함수에서 다음 자극 정보가 이미 저장됨)
            const type = Math.random(); // 이미지 또는 위치 중 어떤 것을 간섭할지 랜덤 결정 - 이미지/위치 중 어떤 것을 간섭할지 랜덤 결정

            if (type < 0.5) { // 50% 확률로 이미지 간섭 - 50% 확률로 이미지 간섭
                // 이미지 간섭
                interferedImageIndex = gameState.nextStimulusInfo.imageIndex; // 간섭된 이미지 인덱스 = 다음 자극 이미지 인덱스 - 현재 이미지 -> 다음 자극 이미지로 대체 - 간섭된 이미지 index = 다음 자극 이미지 index (이미지 간섭)
                // 위치는 그대로 유지 - 위치는 그대로 유지
            } else { // 나머지 50% 확률로 위치 간섭 - 나머지 50% 확률로 위치 간섭
                // 위치 간섭
                interferedPanelIndex = gameState.nextStimulusInfo.panelIndex; // 간섭된 패널 인덱스 = 다음 자극 패널 인덱스 - 현재 위치 -> 다음 자극 위치로 대체 - 간섭된 패널 index = 다음 자극 패널 index (위치 간섭)
                // 이미지는 그대로 유지 - 이미지는 그대로 유지
            }
            console.log("간섭 적용 (Next):", "type=", type < 0.5 ? "image" : "location"); // 콘솔에 간섭 적용 정보 출력 - 디버깅 용도 - 간섭 적용 정보 콘솔 출력 (디버깅)
        }

        return { imageIndex: interferedImageIndex, panelIndex: interferedPanelIndex }; // 간섭된 자극 정보 반환 (이미지 인덱스, 패널 인덱스) - 간섭된 자극 정보 반환
    }

    return { imageIndex: currentImageIndex, panelIndex: currentPanelIndex }; // 간섭 미발생 - 원래 자극 정보 그대로 반환 - 간섭이 발생하지 않은 경우 원래 자극 정보 반환
}


// 자극 제시 함수 (수정됨: 간섭 적용)
function showStimulus(imageIndex, panelIndex) { // 자극 제시 함수 (imageIndex: 이미지 텍스처 인덱스, panelIndex: 패널 인덱스) - 자극 제시 함수
    resetIndicators(); // 반응 지시 박스 상태 초기화 - 매 자극 시작 시 초기화 - indicator box 상태 초기화

    const panel = panels[panelIndex]; // 패널 인덱스에 해당하는 패널 object 가져오기 - 패널 index 로부터 패널 object 가져오기

    console.log("showStimulus() - imageIndex (before interference):", imageIndex, "panelIndex:", panelIndex); // 간섭 적용 전 자극 정보 콘솔에 출력 - 디버깅 용도 - 간섭 적용 전 자극 정보 콘솔 출력 (디버깅)

    // --- "Next" 간섭 유형 적용 (저장된 다음 자극 정보 사용) ---
    if (gameState.interferenceType === "next" && gameState.nextStimulusInfo) { // 간섭 유형 "next" 이고, nextStimulusInfo 가 있으면 (generateNextStimulus 함수에서 다음 자극 정보 저장) - 간섭 유형 'next' 이고, 다음 자극 정보가 저장되어 있으면
        const type = Math.random(); // 이미지 또는 위치 중 어떤 것을 간섭할지 랜덤 결정 - 이미지/위치 중 어떤 것을 간섭할지 랜덤 결정
        let interferedImageIndex = imageIndex; // 간섭된 이미지 인덱스 변수 초기화 (기본값: 현재 이미지 인덱스) - 간섭될 이미지 index 변수 초기화
        let interferedPanelIndex = panelIndex; // 간섭된 패널 인덱스 변수 초기화 (기본값: 현재 패널 인덱스) - 간섭될 패널 index 변수 초기화

        if (type < 0.5) { // 50% 확률로 이미지 간섭 - 50% 확률로 이미지 간섭
            // 이미지 간섭
            interferedImageIndex = gameState.nextStimulusInfo.imageIndex; // 간섭된 이미지 인덱스 = 다음 자극 이미지 인덱스 - 현재 이미지 -> 다음 자극 이미지로 대체 - 간섭된 이미지 index = 다음 자극 이미지 index (이미지 간섭)
            // 위치는 그대로 유지 - 위치는 그대로 유지
        } else { // 나머지 50% 확률로 위치 간섭 - 나머지 50% 확률로 위치 간섭
            // 위치 간섭
            interferedPanelIndex = gameState.nextStimulusInfo.panelIndex; // 간섭된 패널 인덱스 = 다음 자극 패널 인덱스 - 현재 위치 -> 다음 자극 위치로 대체 - 간섭된 패널 index = 다음 자극 패널 index (위치 간섭)
            // 이미지는 그대로 유지 - 이미지는 그대로 유지
        }
        imageIndex = interferedImageIndex; // 최종 이미지 인덱스 = 간섭된 이미지 인덱스 - 최종 이미지 index = 간섭된 이미지 index
        panelIndex = interferedPanelIndex; // 최종 패널 인덱스 = 간섭된 패널 인덱스 - 최종 패널 index = 간섭된 패널 index
        console.log("간섭 적용 (Next):", "type=", type < 0.5 ? "image" : "location"); // 콘솔에 간섭 적용 정보 출력 - 디버깅 용도 - 간섭 적용 정보 콘솔 출력 (디버깅)
        gameState.nextStimulusInfo = null; // 간섭 적용 후 다음 자극 정보 초기화 (null) - 다음 자극 정보 초기화 (더 이상 필요 없음)
    }

    // --- 간섭 적용 ---
    const interferenceResult = introduceInterference(imageIndex, panelIndex); // introduceInterference 함수 호출하여 간섭 적용 - 간섭 유형, 확률 따라 자극 정보 변경 - 간섭 적용 함수 호출
    imageIndex = interferenceResult.imageIndex; // 최종 이미지 인덱스 = 간섭 결과 이미지 인덱스 - 최종 이미지 index = 간섭 결과 이미지 index
    panelIndex = interferenceResult.panelIndex; // 최종 패널 인덱스 = 간섭 결과 패널 인덱스 - 최종 패널 index = 간섭 결과 패널 index
    // --- 간섭 적용 끝 ---

    console.log("showStimulus() - imageIndex (after interference):", imageIndex, "panelIndex:", panelIndex); // 간섭 적용 후 자극 정보 콘솔에 출력 - 디버깅 용도 - 간섭 적용 후 자극 정보 콘솔 출력 (디버깅)
    createStimulusImage(imageIndex, panel); // 최종 자극 정보로 자극 이미지 생성 및 패널에 제시 - 최종 자극 정보로 자극 이미지 생성 및 제시

    console.log("showStimulus() - 제시된 자극 (imageIndex:", imageIndex, ", panelIndex:", panelIndex, ")"); // 제시된 자극 정보 로그 - 제시된 자극 정보 로그
    console.log("showStimulus() - sceneHistory:", gameState.sceneHistory); // sceneHistory 로그 - sceneHistory 로그
    console.log("showStimulus() - locationHistory:", gameState.locationHistory); // locationHistory 로그 - locationHistory 로그
    console.log("showStimulus() - nBackLevel:", gameState.nBackLevel); // nBackLevel 로그 - nBackLevel 로그
    console.log("showStimulus() - 목표 자극 판정:", "장면 목표:", gameState.currentIsSceneTarget, ", 위치 목표:", gameState.currentIsLocationTarget); // 목표 자극 판정 결과 로그 - 목표 자극 판정 결과 로그


    gameState.sceneHistory.push(imageIndex); // 장면 자극 히스토리에 현재 이미지 인덱스 추가 - sceneHistory 에 현재 이미지 index 추가
    gameState.locationHistory.push(panelIndex); // 위치 자극 히스토리에 현재 패널 인덱스 추가 - locationHistory 에 현재 패널 index 추가

    if (gameState.currentStimulus >= gameState.nBackLevel) { // 현재 자극 횟수가 N-back 레벨 이상이면 (N-back 비교 시작) - 현재 자극 횟수가 N-back level 이상이면 (N-back 비교 시작)
        gameState.currentIsSceneTarget = gameState.sceneHistory[gameState.currentStimulus] === // 현재 자극 장면 목표 여부 결정 - 현재 이미지 == N-back 이전 이미지 - 현재 자극이 장면 목표 자극인지 판정 (현재 이미지 == N-back 이전 이미지)
                              gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel];
        gameState.currentIsLocationTarget = gameState.locationHistory[gameState.currentStimulus] === // 현재 자극 위치 목표 여부 결정 - 현재 위치 == N-back 이전 위치 - 현재 자극이 위치 목표 자극인지 판정 (현재 위치 == N-back 이전 위치)
                                gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel];

        if (gameState.currentIsSceneTarget) gameState.sceneTargets++; // 장면 목표 자극이면 장면 목표 횟수 증가 - 장면 목표 자극이면 장면 목표 횟수 증가
        if (gameState.currentIsLocationTarget) gameState.locationTargets++; // 위치 목표 자극이면 위치 목표 자극 횟수 증가 - 위치 목표 자극이면 위치 목표 자극 횟수 증가
        if (gameState.currentIsSceneTarget && gameState.currentIsLocationTarget) gameState.bothTargets++; // 양쪽 모두 목표 자극이면 양쪽 모두 목표 횟수 증가 - 양쪽 모두 목표 자극이면 양쪽 모두 목표 횟수 증가
    } else { // N-back 레벨 미만이면 (N-back 비교 아직 안 함) - N-back level 미만이면 (N-back 비교 안 함)
        gameState.currentIsSceneTarget = false; // 현재 자극은 장면 목표 자극 아님 - 목표 자극 아님으로 설정
        gameState.currentIsLocationTarget = false; // 현재 자극은 위치 목표 자극 아님 - 목표 자극 아님으로 설정
    }

    gameState.currentStimulus++; // 현재 자극 횟수 증가 - 현재 자극 횟수 증가

    if (gameState.currentStimulus < gameState.stimuliPerBlock) { // 블록당 자극 횟수 안 채웠으면 (다음 자극 제시) - 블록당 자극 횟수 아직 안 채웠으면 (다음 자극 제시)
        gameState.currentTimer = setTimeout(() => { // 1초 후 다음 자극 제시 (자극 제시 간 간격) - 1초 후 다음 자극 제시 (자극 제시 간 간격)
            clearAllStimuli(); // 모든 패널에서 자극 제거 (자극 사라지는 효과) - 모든 패널에서 자극 제거 (자극 사라지는 효과)
            gameState.inResponseWindow = true; // 반응 시간 창 활성화 - 자극 사라진 후 반응 시간 시작 - 반응 시간 창 활성화
            gameState.responseWindowTimer = setTimeout(() => { // 반응 시간 2.5초 (반응 시간 창) - 2.5초 동안 반응 대기 - 반응 시간 2.5초 설정
                gameState.inResponseWindow = false; // 반응 시간 창 종료 - 2.5초 지나면 자동 종료 - 반응 시간 창 종료

                if (!gameState.sceneTargetProcessed && gameState.currentIsSceneTarget) { // 장면 목표 자극인데, 처리 안 됐으면 (미반응) - 장면 목표 자극인데 반응 안 했으면 (미반응)
                    showMissedTargetFeedback(sceneIndicator); // 장면 미반응 피드백 표시 (indicator box 빨간색) - 장면 미반응 피드백 표시 (빨간색)
                    gameState.sceneErrors++; // 장면 오류 횟수 증가 (미반응) - 장면 오류 횟수 증가 (미반응)
                    console.log("showStimulus() - 장면 미반응, sceneErrors 증가:", gameState.sceneErrors); // 장면 미반응 오류 증가 로그 - 장면 미반응 오류 증가 로그
                }

                if (!gameState.locationTargetProcessed && gameState.currentIsLocationTarget) { // 위치 목표 자극인데, 처리 안 됐으면 (미반응) - 위치 목표 자극인데 반응 안 했으면 (미반응)
                    showMissedTargetFeedback(locationIndicator); // 위치 미반응 피드백 표시 (indicator box 빨간색) - 위치 미반응 피드백 표시 (빨간색)
                    gameState.locationErrors++; // 위치 오류 횟수 증가 (미반응) - 위치 오류 횟수 증가 (미반응)
                    console.log("showStimulus() - 위치 미반응, locationErrors 증가:", gameState.locationErrors); // 위치 미반응 오류 증가 로그 - 위치 미반응 오류 증가 로그
                }

                setTimeout(() => { // 0.5초 후 다음 자극 제시 (피드백 표시 후 잠시 딜레이) - 0.5초 후 다음 자극 제시 (피드백 후 딜레이)
                    generateNextStimulus(); // 다음 자극 생성 및 제시 함수 호출 - 다음 자극 제시 - 다음 자극 생성 및 제시
                }, 500); // 0.5초 딜레이 - 0.5초 딜레이
            }, 2500); // 반응 시간 2.5초 (늘림) - 반응 시간 2.5초
        }, 1000); // 자극 제시 시간 1초 (기존과 동일) - 자극 제시 시간 1초
    } else { // 블록당 자극 횟수 채웠으면 (블록 종료) - 블록당 자극 횟수 다 채웠으면 (블록 종료)
        gameState.currentTimer = setTimeout(() => { // 1초 후 블록 종료 처리 (마지막 자극 제시 후 딜레이) - 1초 후 블록 종료 처리 (마지막 자극 후 딜레이)
            clearAllStimuli(); // 모든 패널에서 자극 제거 (마지막 자극 사라지는 효과) - 모든 패널에서 자극 제거 (마지막 자극 사라지는 효과)
            gameState.inResponseWindow = true; // 반응 시간 창 활성화 - 마지막 자극 사라진 후 반응 시간 시작 - 반응 시간 창 활성화
            gameState.responseWindowTimer = setTimeout(() => { // 반응 시간 2.5초 (반응 시간 창) - 마지막 자극 후 반응 시간도 동일하게 적용 - 마지막 자극 후 반응 시간 2.5초 적용
                gameState.inResponseWindow = false; // 반응 시간 창 종료 - 반응 시간 창 종료

                if (!gameState.sceneTargetProcessed && gameState.currentIsSceneTarget) { // 장면 목표 자극인데, 처리 안 됐으면 (미반응) - 장면 목표 자극인데 반응 안 했으면 (미반응)
                    showMissedTargetFeedback(sceneIndicator); // 장면 미반응 피드백 표시 - 장면 미반응 피드백 표시
                    gameState.sceneErrors++; // 장면 오류 횟수 증가 (미반응) - 장면 오류 횟수 증가 (미반응)
                    console.log("showStimulus() - 장면 미반응, sceneErrors 증가:", gameState.sceneErrors); // 콘솔에 오류 정보 출력 - 장면 오류 정보 콘솔 출력
                }

                if (!gameState.locationTargetProcessed && gameState.currentIsLocationTarget) { // 위치 목표 자극인데, 처리 안 됐으면 (미반응) - 위치 목표 자극인데 반응 안 했으면 (미반응)
                    showMissedTargetFeedback(locationIndicator); // 위치 미반응 피드백 표시 - 위치 미반응 피드백 표시
                    gameState.locationErrors++; // 위치 오류 횟수 증가 (미반응) - 위치 오류 횟수 증가 (미반응)
                    console.log("showStimulus() - 위치 미반응, locationErrors 증가:", gameState.locationErrors); // 콘솔에 오류 정보 출력 - 위치 오류 정보 콘솔 출력
                }

                setTimeout(() => { // 0.5초 후 블록 종료 (피드백 표시 후 잠시 딜레이) - 0.5초 후 블록 종료 (피드백 후 딜레이)
                    endBlock(); // 블록 종료 함수 호출 - 블록 결과 표시, 레벨 조정 등 - 블록 종료 함수 호출
                }, 500); // 0.5초 딜레이 - 0.5초 딜레이
            }, 2500); // 반응 시간 2.5초 (늘림) - 반응 시간 2.5초
        }, 1000); // 자극 제시 시간 1초 (기존과 동일) - 자극 제시 시간 1초
    }
}

// 다음 자극 생성 및 제시 함수 (수정됨: "next" 간섭, 자극 횟수 카운터)
function generateNextStimulus() { // 다음 자극 생성 및 제시 함수 - showStimulus 함수에서 호출 - 다음 자극 생성 및 제시 함수
    if (!gameState.isPlaying) return; // 게임 중 아니면 함수 종료 - 게임 일시 정지 상태 - 게임 중 아니면 함수 종료

    const shouldBeSceneTarget = gameState.sceneTargets < 6 && // 장면 목표 자극 횟수가 6회 미만이고, - 장면 목표 자극 횟수가 6회 미만이고,
                               Math.random() < (6 - gameState.sceneTargets) / // 확률 계산 - 남은 장면 목표 횟수 / 남은 자극 횟수 - 장면 목표 자극 생성 확률 계산 (남은 목표 횟수 / 남은 자극 횟수)
                               (gameState.stimuliPerBlock - gameState.currentStimulus); // 남은 자극 횟수 - 남은 자극 횟수

    const shouldBeLocationTarget = gameState.locationTargets < 6 && // 위치 목표 자극 횟수가 6회 미만이고, - 위치 목표 자극 횟수가 6회 미만이고,
                                  Math.random() < (6 - gameState.locationTargets) / // 확률 계산 - 남은 위치 목표 횟수 / 남은 자극 횟수 - 위치 목표 자극 생성 확률 계산 (남은 목표 횟수 / 남은 자극 횟수)
                                  (gameState.stimuliPerBlock - gameState.currentStimulus); // 남은 자극 횟수 - 남은 자극 횟수

    const shouldBeBothTarget = gameState.bothTargets < 2 && // 양쪽 모두 목표 자극 횟수가 2회 미만이고, - 양쪽 모두 목표 자극 횟수가 2회 미만이고,
                              Math.random() < (2 - gameState.bothTargets) / // 확률 계산 - 남은 양쪽 모두 목표 횟수 / 남은 자극 횟수 - 양쪽 모두 목표 자극 생성 확률 계산 (남은 목표 횟수 / 남은 자극 횟수)
                              (gameState.stimuliPerBlock - gameState.currentStimulus); // 남은 자극 횟수 - 남은 자극 횟수

    let imageIndex, panelIndex; // 다음 자극 이미지 인덱스, 패널 인덱스 변수 선언 - 다음 자극 이미지 index, 패널 index 변수 선언
    let targetType = "none"; // 목표 자극 유형 변수 (디버깅용) - 목표 자극 유형 변수 (디버깅)

    if (gameState.currentStimulus >= gameState.nBackLevel) { // 현재 자극 횟수가 N-back 레벨 이상이면 (목표 자극 생성 가능) - 현재 자극 횟수가 N-back level 이상이면 (목표 자극 생성 가능)
        if (shouldBeBothTarget) { // 양쪽 모두 목표 자극 생성 조건 만족하면 - 양쪽 모두 목표 자극 생성 조건 만족하면
            imageIndex = gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel]; // 이미지: N-back 이전 이미지와 동일 - 이미지: N-back 이전 이미지와 동일
            panelIndex = gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel]; // 위치: N-back 이전 위치와 동일 - 위치: N-back 이전 위치와 동일
            targetType = "both"; // 목표 자극 유형: 양쪽 모두 - 목표 자극 유형: 양쪽 모두
        } else if (shouldBeSceneTarget) { // 장면 목표 자극 생성 조건 만족하면 - 장면 목표 자극 생성 조건 만족하면
            imageIndex = gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel]; // 이미지: N-back 이전 이미지와 동일 - 이미지: N-back 이전 이미지와 동일
            do { // 위치: N-back 이전 위치와 다른 위치 랜덤 선택 - 위치: N-back 이전 위치와 다른 위치 랜덤 선택
                panelIndex = Math.floor(Math.random() * panels.length); // 패널 index 랜덤 선택 (0~7) - 패널 index 랜덤 선택 (0~7)
            } while (panelIndex === gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel]); // N-back 이전 위치와 다를 때까지 반복 - N-back 이전 위치와 다를 때까지 반복
            targetType = "scene"; // 목표 자극 유형: 장면 - 목표 자극 유형: 장면
        } else if (shouldBeLocationTarget) { // 위치 목표 자극 생성 조건 만족하면 - 위치 목표 자극 생성 조건 만족하면
            panelIndex = gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel]; // 위치: N-back 이전 위치와 동일 - 위치: N-back 이전 위치와 동일
            do { // 이미지: N-back 이전 이미지와 다른 이미지 랜덤 선택 - 이미지: N-back 이전 이미지와 다른 이미지 랜덤 선택
                imageIndex = Math.floor(Math.random() * imageTextures.length); // 이미지 index 랜덤 선택 (0~100) - 이미지 index 랜덤 선택 (0~100)
            } while (imageIndex === gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel]); // N-back 이전 이미지와 다를 때까지 반복 - N-back 이전 이미지와 다를 때까지 반복
            targetType = "location"; // 목표 자극 유형: 위치 - 목표 자극 유형: 위치
        } else { // 목표 자극 없을 때 (비-목표 자극 생성) - 목표 자극 없을 때 (비-목표 자극 생성)
            do { // 이미지, 위치 모두 N-back 이전 자극과 다른 자극 랜덤 선택 - 이미지, 위치 모두 N-back 이전 자극과 다르게 랜덤 선택
                imageIndex = Math.floor(Math.random() * imageTextures.length); // 이미지 index 랜덤 선택 (0~100) - 이미지 index 랜덤 선택 (0~100)
                panelIndex = Math.floor(Math.random() * panels.length); // 패널 index 랜덤 선택 (0~7) - 패널 index 랜덤 선택 (0~7)
                // 이미지 또는 위치가 N-back 이전 자극과 같으면 다시 랜덤 선택 - 이미지 또는 위치가 N-back 이전 자극과 같으면 다시 랜덤 선택
            } while (imageIndex === gameState.sceneHistory[gameState.currentStimulus - gameState.nBackLevel] || // 이미지 또는 - 이미지 또는
                     panelIndex === gameState.locationHistory[gameState.currentStimulus - gameState.nBackLevel]); // 위치가 N-back 이전 자극과 같으면 다시 랜덤 선택 - 위치가 N-back 이전 자극과 같으면 다시 랜덤 선택
            targetType = "non-target"; // 목표 자극 유형: 비-목표 - 목표 자극 유형: 비-목표
        }
    } else { // 현재 자극 횟수가 N-back 레벨 미만이면 (첫 N-back 자극) - 현재 자극 횟수가 N-back level 미만이면 (첫 N-back 자극)
        imageIndex = Math.floor(Math.random() * imageTextures.length); // 이미지 index 랜덤 선택 (0~100) - 이미지 index 랜덤 선택 (0~100)
        panelIndex = Math.floor(Math.random() * panels.length); // 패널 index 랜덤 선택 (0~7) - 패널 index 랜덤 선택 (0~7)
        targetType = "initial"; // 목표 자극 유형: 초기 - 목표 자극 유형: 초기
    }

    let currentInterferenceType = gameState.interferenceType; // 현재 간섭 유형 가져오기 - generateNextStimulus 함수 내에서 정의해야 showStimulus 함수에서 참조 가능 - 현재 간섭 유형 가져오기

    // --- "Next" 간섭 유형 처리 (다음 자극 정보 미리 저장) ---
    if (currentInterferenceType === "next") { // 간섭 유형 "next" 이면 - 간섭 유형 'next' 이면
        gameState.nextStimulusInfo = { imageIndex: imageIndex, panelIndex: panelIndex }; // 다음 자극 정보 저장 - generateNextStimulus 에서 미리 생성한 자극 정보를 showStimulus 에서 사용하기 위해 - 다음 자극 정보 저장 (showStimulus 에서 사용)
        // 현재는 간섭을 적용하지 않고, 다음 자극 정보를 저장만 함. 실제 간섭 적용은 showStimulus() 함수에서 이루어짐. - "next" 간섭은 다음 자극에 영향을 주는 방식이므로 자극 생성 시점에는 간섭 적용 안 함 - 실제 간섭 적용은 showStimulus 에서 이루어짐 (next 간섭은 다음 자극에 영향)
    }

    console.log("generateNextStimulus() - imageIndex:", imageIndex, "panelIndex:", panelIndex);
     // 디버깅 로그: 목표 자극 유형 - 목표 자극 유형 디버깅 로그
    console.log("generateNextStimulus() - 목표 자극 유형:", targetType);

    // --- 자극 횟수 카운터 업데이트 ---
    updateStimulusCounter(); // generateNextStimulus() 함수 호출 시 카운터 업데이트 - 화면에 자극 횟수 표시 업데이트 - 자극 횟수 카운터 업데이트

    showStimulus(imageIndex, panelIndex); // 최종 결정된 자극 정보로 자극 제시 함수 호출 - 자극 제시, 반응 처리 시작 - 최종 자극 정보로 자극 제시
}

// 키 입력 처리 함수
function handleKeyPress(e) { // 키 입력 처리 함수 (e: keyboard event) - 키 입력 처리 함수
    if (!gameState.isPlaying) { // 게임 중 아니면 (일시 정지 상태) - 게임 중 아니면 (일시 정지 상태)
        if (e.code === 'Space') { // Space 키 누르면 - Space 키 누르면
            startBlock(); // 블록 시작 함수 호출 - 게임 시작 - 게임 시작
        }
        return; // 함수 종료 - 함수 종료
    }

    if (e.code === 'KeyS' && !gameState.sceneTargetProcessed && gameState.canRespond) { // 'S' 키 누르고, 장면 목표 처리 안 됐고, 반응 가능 상태이면 - 'S' 키 입력 및 조건 만족 시
        handleSceneResponse(); // 장면 반응 처리 함수 호출 - 이미지 반응 처리 - 장면 반응 처리
    }

    if (e.code === 'KeyL' && !gameState.locationTargetProcessed && gameState.canRespond) { // 'L' 키 누르고, 위치 목표 처리 안 됐고, 반응 가능 상태이면 - 'L' 키 입력 및 조건 만족 시
        handleLocationResponse(); // 위치 반응 처리 함수 호출 - 위치 반응 처리 - 위치 반응 처리
    }
}

// 이미지 반응 처리 함수
function handleSceneResponse() { // 이미지 반응 처리 함수 - 'S' 키 입력 시 호출 - 이미지 반응 처리 함수
    gameState.sceneTargetProcessed = true; // 장면 목표 자극 처리 완료 상태로 변경 - 중복 반응 방지 - 장면 목표 자극 처리 완료 상태로 변경 (중복 반응 방지)

    if (gameState.currentStimulus <= gameState.nBackLevel) { // 현재 자극 횟수가 N-back 레벨 이하이면 (조기 반응) - 현재 자극 횟수가 N-back level 이하이면 (조기 반응)
        showEarlyResponseFeedback(sceneIndicator); // 조기 반응 피드백 표시 (indicator box 파란색) - 너무 빨리 반응했다는 피드백 - 조기 반응 피드백 표시 (파란색)
        return; // 함수 종료 - N-back 레벨 이하에서는 정답/오답 판정 안 함 - 함수 종료 (N-back level 이하에서는 판정 안 함)
    }

    gameState.sceneResponses++; // 장면 반응 횟수 증가 - 'S' 키 입력 횟수 카운트 - 장면 반응 횟수 증가

    const isCorrect = gameState.currentIsSceneTarget; // 정답 여부 - 현재 자극이 장면 목표 자극인지 여부 (showStimulus 함수에서 결정) - 정답 여부 판정 (현재 자극이 장면 목표 자극인지)
    showIndicatorFeedback(sceneIndicator, isCorrect); // 반응 지시 박스에 피드백 표시 (정답: 초록색, 오답: 빨간색) - indicator box 에 피드백 표시 (정답/오답)

    if (!isCorrect) { // 오답이면 - 오답인 경우
        gameState.sceneErrors++;
        console.log("handleSceneResponse() - 장면 오반응, sceneErrors 증가:", gameState.sceneErrors);
    }
}

// 위치 반응 처리 함수
function handleLocationResponse() { // 위치 반응 처리 함수 - 'L' 키 입력 시 호출 - 위치 반응 처리 함수
    gameState.locationTargetProcessed = true; // 위치 목표 자극 처리 완료 상태로 변경 - 중복 반응 방지 - 위치 목표 자극 처리 완료 상태로 변경 (중복 반응 방지)

    if (gameState.currentStimulus <= gameState.nBackLevel) { // 현재 자극 횟수가 N-back 레벨 이하이면 (조기 반응) - 현재 자극 횟수가 N-back level 이하이면 (조기 반응)
        showEarlyResponseFeedback(locationIndicator); // 조기 반응 피드백 표시 (indicator box 파란색) - 너무 빨리 반응했다는 피드백 - 조기 반응 피드백 표시 (파란색)
        return; // 함수 종료 - N-back 레벨 이하에서는 정답/오답 판정 안 함 - 함수 종료 (N-back level 이하에서는 판정 안 함)
    }

    gameState.locationResponses++; // 위치 반응 횟수 증가 - 'L' 키 입력 횟수 카운트 - 위치 반응 횟수 증가

    const isCorrect = gameState.currentIsLocationTarget; // 정답 여부 - 현재 자극이 위치 목표 자극인지 여부 (showStimulus 함수에서 결정) - 정답 여부 판정 (현재 자극이 위치 목표 자극인지)
    showIndicatorFeedback(locationIndicator, isCorrect); // 반응 지시 박스에 피드백 표시 (정답: 초록색, 오답: 빨간색) - indicator box 에 피드백 표시 (정답/오답)

    if (!isCorrect) { // 오답이면 - 오답인 경우
        gameState.locationErrors++;
        console.log("handleLocationResponse() - 위치 오반응, locationErrors 증가:", gameState.locationErrors);
    }
}

// 블록 시작 함수 (게임 시작)
function startBlock() { // 블록 시작 함수 - 게임 시작 시 호출 - 블록 시작 함수 (게임 시작)
    gameState.isPlaying = true; // 게임 플레이 상태 true 로 설정 - 게임 진행 중 상태로 변경 - 게임 플레이 상태 true 로 변경
    gameState.currentStimulus = 0; // 현재 자극 횟수 0으로 초기화 - 현재 자극 횟수 초기화
    gameState.sceneHistory = []; // 장면 자극 히스토리 초기화 (빈 배열) - 장면 자극 히스토리 초기화
    gameState.locationHistory = []; // 위치 자극 히스토리 초기화 (빈 배열) - 위치 자극 히스토리 초기화
    gameState.sceneTargets = 0; // 장면 목표 자극 횟수 0으로 초기화 - 장면 목표 자극 횟수 초기화
    gameState.locationTargets = 0; // 위치 목표 자극 횟수 0으로 초기화 - 위치 목표 자극 횟수 초기화
    gameState.bothTargets = 0; // 양쪽 모두 목표 자극 횟수 0으로 초기화 - 양쪽 모두 목표 자극 횟수 초기화
    gameState.sceneResponses = 0, // 장면 반응 횟수 0으로 초기화 - 장면 반응 횟수 초기화
    gameState.locationResponses = 0; // 위치 반응 횟수 0으로 초기화 - 위치 반응 횟수 초기화
    gameState.sceneErrors = 0; // 장면 오류 횟수 0으로 초기화 - 장면 오류 횟수 초기화
    gameState.locationErrors = 0; // 위치 오류 횟수 0으로 초기화 - 위치 오류 횟수 초기화
    gameState.consecutiveGames++; // 연속 게임 횟수 증가 - 새로운 게임 시작 시 카운터 증가 // --- [NEW] 연속 게임 횟수 증가 --- - 연속 게임 횟수 증가
    // gameState.totalGamesToday++; // 오늘 총 게임 횟수 증가 // --- [NEW] 오늘 총 게임 횟수 증가 --- - 오늘 총 게임 횟수 증가 (endBlock() 함수로 이동)

    // --- 오늘 게임 횟수 LocalStorage 에 저장 ---
    localStorage.setItem('totalGamesToday', gameState.totalGamesToday); // LocalStorage 에 오늘 총 게임 횟수 저장 - LocalStorage 에 오늘 총 게임 횟수 저장
    localStorage.setItem('lastGameDate', new Date().toDateString()); // LocalStorage 에 마지막 게임 날짜 저장 (날짜 비교 위해) - LocalStorage 에 마지막 게임 날짜 저장 (날짜 비교 위해)

    document.getElementById('titleScreen').style.display = 'none'; // 타이틀 화면 숨기기 - 타이틀 화면 숨기기
    document.getElementById('resultScreen').style.display = 'none'; // 결과 화면 숨기기 - 결과 화면 숨기기
    document.getElementById('scene-indicator').style.display = 'flex'; // 장면 반응 지시 박스 표시 - 장면 반응 지시 박스 표시
    document.getElementById('location-indicator').style.display = 'flex'; // 위치 반응 지시 박스 표시 - 위치 반응 지시 박스 표시

    // --- 자극 횟수 카운터 초기화 ---
    resetStimulusCounter(); // 블록 시작 시 카운터 초기화 - 화면의 자극 횟수 표시 0으로 초기화 - 자극 횟수 카운터 초기화

    setTimeout(() => { // 1초 후 첫 번째 자극 제시 (게임 시작 후 딜레이) - 1초 후 첫 번째 자극 제시 (게임 시작 후 딜레이)
        generateNextStimulus(); // 다음 자극 생성 및 제시 함수 호출 - 첫 번째 자극 제시 - 첫 번째 자극 제시
    }, 1000); // 1초 딜레이 - 1초 딜레이
}

// 블록 종료 함수 (한 블록 완료 후 결과 처리 및 다음 블록 준비)
function endBlock() { // 블록 종료 함수 - 한 블록 완료 후 결과 처리 및 다음 블록 준비 - 블록 종료 함수
    gameState.isPlaying = false; // 게임 플레이 상태 false 로 설정 - 게임 일시 정지 상태로 변경 - 게임 플레이 상태 false 로 변경
    gameState.currentBlock++; // 현재 블록 번호 증가 - 현재 블록 번호 증가

    gameState.totalGamesToday++; // 오늘 총 게임 횟수 증가 // --- [NEW] 오늘 총 게임 횟수 증가 (게임 완료 시) --- - 오늘 총 게임 횟수 증가 (게임 완료 시)
    localStorage.setItem('totalGamesToday', gameState.totalGamesToday); // LocalStorage 에 오늘 총 게임 횟수 저장 (업데이트) - LocalStorage 에 오늘 총 게임 횟수 저장 (업데이트)

    // Remove these lines - they are causing double-counting
    // const sceneMisses = gameState.sceneTargets - (gameState.sceneResponses - gameState.sceneErrors);
    // const locationMisses = gameState.locationTargets - (gameState.locationResponses - gameState.locationErrors);

    // Directly use gameState.sceneErrors and gameState.locationErrors as total errors
    const totalSceneErrors = gameState.sceneErrors; // sceneErrors already includes missed targets - 장면 오류 횟수
    const totalLocationErrors = gameState.locationErrors; // locationErrors already includes missed targets - 위치 오류 횟수


    document.getElementById('sceneErrors').textContent = totalSceneErrors; // 결과 화면에 장면 오류 횟수 표시 - 결과 화면에 장면 오류 횟수 표시
    document.getElementById('locationErrors').textContent = totalLocationErrors; // 결과 화면에 위치 오류 횟수 표시 - 결과 화면에 위치 오류 횟수 표시
    document.getElementById('resultNLevel').textContent = gameState.nBackLevel; // 결과 화면에 N-back 레벨 표시 - 결과 화면에 N-back 레벨 표시

    let levelChange = ''; // 레벨 변화 메시지 변수 초기화 - 레벨 변화 메시지 변수 초기화
    let nextNBackLevel = gameState.nBackLevel; // 다음 N-back 레벨 변수 초기화 (현재 레벨로 시작) - 다음 N-back 레벨 변수 초기화

    if (gameState.nBackLevel === 1 && (totalSceneErrors > 5 || totalLocationErrors > 5)) { // 레벨 1이고 오류 많으면 - 레벨 1이고 오류 많으면
        levelChange = '즐기는 거야~!😆'; // 레벨 변화 메시지 설정 - 레벨 변화 메시지 설정
    } else if (totalSceneErrors < 3 && totalLocationErrors < 3) { // 장면/위치 오류 횟수 모두 3회 미만이면 (레벨 업 조건 만족) - 오류 횟수 적으면 레벨 업
        nextNBackLevel = gameState.nBackLevel + 1; // 다음 레벨 = 현재 레벨 + 1 - 레벨 업
        levelChange = '⬆️ 최고야! 레벨업!!♥️🥰'; // 레벨 변화 메시지 설정 - 레벨 업 메시지
    } else if (totalSceneErrors > 5 || totalLocationErrors > 5) { // 오류 횟수 많으면 레벨 다운 - 오류 횟수 많으면 레벨 다운
        nextNBackLevel = Math.max(1, gameState.nBackLevel - 1); // 다음 레벨 = max(1, 현재 레벨 - 1) - 레벨 다운 (최소 레벨 1)
        levelChange = '⬇️ 괜찮아! 다시 해보자!😉♥️'; // 레벨 변화 메시지 설정 - 레벨 다운 메시지
    } else { // 그 외 경우 (레벨 유지) - 레벨 유지 조건
        levelChange = '➡️ 오 좋아! 킵고잉!👏♥️'; // 레벨 변화 메시지 설정 - 레벨 유지 메시지
    }

    document.getElementById('levelChange').textContent = levelChange; // 결과 화면에 레벨 변화 메시지 표시 - 결과 화면에 레벨 변화 메시지 표시

    gameState.nBackLevel = nextNBackLevel; // gameState 의 N-back 레벨 업데이트 - 다음 레벨로 업데이트
    document.getElementById('nBackLevel').textContent = gameState.nBackLevel; // 타이틀 화면의 레벨 표시 업데이트 - 타이틀 화면 레벨 표시 업데이트
    localStorage.setItem('nBackLevel', gameState.nBackLevel);
    // --- 결과 화면에 연속 게임 횟수 표시 --- // --- [NEW] 결과 화면 연속 게임 횟수 표시 ---
    document.getElementById('consecutiveGamesCount').textContent = gameState.consecutiveGames; // 결과 화면에 연속 게임 횟수 표시 - 결과 화면에 연속 게임 횟수 표시
    document.getElementById('resultScreen').style.display = 'flex'; // 결과 화면 표시 - 결과 화면 표시

     // 디버깅 로그: endBlock 함수 종료 시 레벨 변화 정보 출력 - 레벨 변화 정보 디버깅 로그
    console.log("endBlock() - 종료:", "levelChange:", levelChange, "nextNBackLevel:", nextNBackLevel);

    // --- [NEW] 결과 화면 배경 이미지 설정 ---
    setBackgroundImageToResultScreen(); // 결과 화면 배경 이미지 설정 함수 호출
}

// 모든 타이머 취소 함수
function cancelAllTimers() { // 모든 타이머 취소 함수 - 게임 중단 시 타이머 leak 방지 - 모든 타이머 취소 함수
    if (gameState.currentTimer) { // 자극 제시 시간 타이머 있으면 - 자극 제시 시간 타이머 있으면
        clearTimeout(gameState.currentTimer); // 타이머 취소 - 타이머 취소
    }
    if (gameState.responseWindowTimer) { // 반응 시간 창 타이머 있으면 - 반응 시간 창 타이머 있으면
        clearTimeout(gameState.responseWindowTimer); // 타이머 취소 - 타이머 취소
    }
}

// --- [NEW] 결과 화면 배경 이미지 설정 함수 ---
function setBackgroundImageToResultScreen() {
    const storedImages = loadUploadedImages(); // LocalStorage 에서 저장된 이미지 목록 로드
    const backgroundImageDiv = document.getElementById('resultBackgroundImage'); // 배경 이미지 div element 가져오기

    if (storedImages && storedImages.length > 0) { // 저장된 이미지가 있으면
        const randomIndex = Math.floor(Math.random() * storedImages.length); // 랜덤 index 선택
        const randomImageData = storedImages[randomIndex]; // 랜덤 이미지 데이터 가져오기
        backgroundImageDiv.style.backgroundImage = `url('${randomImageData}')`; // 배경 이미지 URL 설정 (data URL 사용)
    } else {
        backgroundImageDiv.style.backgroundImage = 'none'; // 저장된 이미지 없으면 배경 이미지 제거
    }
}

// --- [NEW] 이미지 업로드 처리 함수 (수정됨: Data URL 생성 완료 후 저장 및 배경 설정, 메시지 표시) ---
document.getElementById('imageUpload').addEventListener('change', function(e) {
    const files = e.target.files; // 선택된 파일 목록 가져오기
    if (files && files.length > 0) { // 파일이 선택되었으면
        const storedImages = loadUploadedImages(); // 기존 저장된 이미지 목록 로드
        let updatedImages = [...storedImages]; // 기존 이미지 목록 복사 (새로운 배열 생성)
        let loadedCount = 0; // 로드된 이미지 count 변수 추가
        let fileNames = []; // 파일 이름 저장 배열 추가
        for (let i = 0; i < files.length; i++) { // 선택된 파일 목록 순회
            fileNames.push(files[i].name); // 파일 이름 배열에 추가
        }
        let uploadMessage = `Uploaded images: ${fileNames.join(', ')}`; // 업로드 메시지 생성 (파일 이름 목록)
        if (files.length > 3) { // 3개 초과 업로드 시 메시지 변경
            uploadMessage = `Uploaded ${files.length} images`; // 업로드 메시지 변경 (개수만 표시)
        }

        // 메시지 표시 엘리먼트 (titleScreen 아래에 추가)
        const messageElement = document.createElement('div');
        messageElement.textContent = "이미지 로딩 중..."; // 초기 메시지
        messageElement.style.color = 'lightgreen'; // 메시지 스타일 (lightgreen 색상)
        messageElement.style.marginTop = '10px'; // margin-top 추가
        messageElement.id = 'uploadingMessage'; // id 부여 (나중에 제거 위해)

        const titleScreenDiv = document.getElementById('titleScreen'); // titleScreen element 가져오기
        titleScreenDiv.appendChild(messageElement); // titleScreenDiv 에 메시지 element 추가


        for (let i = 0; i < files.length; i++) { // 선택된 파일 목록 순회
            const file = files[i]; // 현재 파일 가져오기
            const reader = new FileReader(); // FileReader 생성 (파일 내용 읽기)

            reader.onload = function(event) { // 파일 로드 완료 시 이벤트 핸들러
                const imageDataUrl = event.target.result; // Data URL (base64 인코딩된 이미지 데이터)
                updatedImages.push(imageDataUrl); // Data URL 을 업데이트된 이미지 목록에 추가
                loadedCount++; // 로드된 이미지 count 증가

                if (loadedCount === files.length) { // 모든 파일 load 완료되었으면
                    saveUploadedImages(updatedImages); // 업데이트된 이미지 목록 LocalStorage 에 저장
                    console.log(`Uploaded images added. Total images: ${updatedImages.length}`); // 콘솔 로그 (업로드된 이미지 추가, 총 이미지 수)
                    setBackgroundImageToResultScreen(); // 결과 화면 배경 이미지 설정 함수 호출 (load 완료 후 즉시 호출)
                    showUploadCompleteMessage(uploadMessage); // 업로드 완료 메시지 표시 함수 호출 // [✨ NEW ✨]
                }
            };

            reader.readAsDataURL(file); // 파일을 Data URL 로 읽기 시작 (비동기)
        }
        // input type="file" 값 초기화 (동일 파일 재선택 가능하도록)
        e.target.value = ''; // input value 초기화
    }
});

// --- [NEW] 이미지 업로드 완료 메시지 표시 함수 ---
function showUploadCompleteMessage(message) {
    const messageElement = document.getElementById('uploadingMessage'); // 메시지 element 가져오기
    if (messageElement) { // 메시지 element 가 있으면
        messageElement.textContent = message + " 완료!"; // 메시지 텍스트 변경 (완료 메시지)
        setTimeout(() => { // 3초 후 메시지 사라지게 함 - 3초 후 사라지는 효과
            if (messageElement && messageElement.parentNode) { // element 와 parentNode 둘 다 있는지 확인
                messageElement.parentNode.removeChild(messageElement); // 메시지 element 제거 - 메시지 사라지게 함
            }
        }, 3000); // 3초 후 실행
    }
}

// --- [NEW] LocalStorage 에 이미지 목록 저장 함수 ---
function saveUploadedImages(images) {
    localStorage.setItem(uploadedImagesKey, JSON.stringify(images)); // 이미지 목록 JSON 문자열로 변환 후 LocalStorage 에 저장
}

// --- [NEW] LocalStorage 에서 이미지 목록 로드 함수 ---
function loadUploadedImages() {
    const storedImages = localStorage.getItem(uploadedImagesKey); // LocalStorage 에서 이미지 목록 JSON 문자열 가져오기
    return storedImages ? JSON.parse(storedImages) : []; // JSON 문자열 파싱하여 배열로 반환, 없으면 빈 배열 반환
}


// --- 이벤트 리스너 등록 ---
document.addEventListener('keydown', handleKeyPress); // keydown event listener 등록 - 키 입력 처리 (handleKeyPress 함수 호출) - 키 입력 이벤트 리스너 등록

window.addEventListener('resize', function() { // window resize event listener 등록 - 창 크기 변경 시 렌더러, 카메라 업데이트 - 창 크기 변경 이벤트 리스너 등록
    camera.aspect = window.innerWidth / window.innerHeight; // 카메라 aspect ratio 업데이트 (창 가로세로비율에 맞춤) - 카메라 aspect ratio 업데이트
    camera.updateProjectionMatrix(); // 카메라 projection matrix 업데이트 - aspect ratio 변경 반영 - 카메라 projection matrix 업데이트
    renderer.setSize(window.innerWidth, window.innerHeight); // 렌더러 크기 업데이트 (창 크기에 맞춤) - 렌더러 크기 업데이트
});

sceneIndicator.addEventListener('touchstart', function(e) { // 장면 반응 지시 박스 touchstart event listener 등록 - 터치 시 장면 반응 처리 - 장면 반응 indicator box 터치 이벤트 리스너 등록
    e.preventDefault(); // prevent default touch event behavior - 모바일 브라우저 기본 터치 동작 방지 - 기본 터치 동작 방지
    if (gameState.isPlaying && !gameState.sceneTargetProcessed && gameState.canRespond) { // 게임 중이고, 장면 목표 처리 안 됐고, 반응 가능 상태이면 - 게임 중, 조건 만족 시
        handleSceneResponse(); // 장면 반응 처리 함수 호출 - 장면 반응 처리 - 장면 반응 처리
    }
});

locationIndicator.addEventListener('touchstart', function(e) { // 위치 반응 지시 박스 touchstart event listener 등록 - 터치 시 위치 반응 처리 - 위치 반응 indicator box 터치 이벤트 리스너 등록
    e.preventDefault(); // prevent default touch event behavior - 기본 터치 동작 방지
    if (gameState.isPlaying && !gameState.locationTargetProcessed && gameState.canRespond) { // 게임 중이고, 위치 목표 처리 안 됐고, 반응 가능 상태이면 - 게임 중, 조건 만족 시
        handleLocationResponse(); // 위치 반응 처리 함수 호출 - 위치 반응 처리 - 위치 반응 처리
    }
});

sceneIndicator.addEventListener('click', function() { // 장면 반응 지시 박스 click event listener 등록 - 클릭 시 장면 반응 처리 - 장면 반응 indicator box 클릭 이벤트 리스너 등록
    if (gameState.isPlaying && !gameState.sceneTargetProcessed && gameState.canRespond) { // 게임 중이고, 장면 목표 처리 안 됐고, 반응 가능 상태이면 - 게임 중, 조건 만족 시
        handleSceneResponse(); // 장면 반응 처리 함수 호출 - 장면 반응 처리 - 장면 반응 처리
    }
});

locationIndicator.addEventListener('click', function() { // 위치 반응 지시 박스 click event listener 등록 - 클릭 시 위치 반응 처리 - 위치 반응 indicator box 클릭 이벤트 리스너 등록
    if (gameState.isPlaying && !gameState.locationTargetProcessed && gameState.canRespond) { // 게임 중이고, 위치 목표 처리 안 됐고, 반응 가능 상태이면 - 게임 중, 조건 만족 시
        handleLocationResponse(); // 위치 반응 처리 함수 호출 - 위치 반응 처리 - 위치 반응 처리
    }
});

document.getElementById('setLevelBtn').addEventListener('click', function() { // 레벨 설정 버튼 click event listener 등록 - 레벨 설정 버튼 클릭 시 - 레벨 설정 버튼 클릭 이벤트 리스너 등록
    setCustomLevel(); // 사용자 정의 레벨 설정 함수 호출 - 레벨 변경 - 사용자 정의 레벨 설정
});

document.getElementById('customLevel').addEventListener('keypress', function(e) { // 레벨 입력 필드 keypress event listener 등록 - Enter 키 입력 시 레벨 설정 - 레벨 입력 필드 keypress 이벤트 리스너 등록
    if (e.key === 'Enter') { // Enter 키 입력이면 - Enter 키 입력 시
        setCustomLevel(); // 사용자 정의 레벨 설정 함수 호출 - 레벨 변경 - 사용자 정의 레벨 설정
    }
});

document.getElementById('pressSpace').addEventListener('click', function() { // "Press SPACE to begin" 버튼 click event listener 등록 - 클릭 시 게임 시작 - "Press SPACE to begin" 버튼 click 이벤트 리스너 등록
    if (!gameState.isPlaying) { // 게임 중 아니면 (일시 정지 상태) - 게임 중 아니면 (일시 정지 상태)
        startBlock(); // 블록 시작 함수 호출 - 게임 시작 - 게임 시작
    }
});

document.getElementById('pressSpace').addEventListener('touchstart', function(e) { // "Press SPACE to begin" 버튼 touchstart event listener 등록 - 터치 시 게임 시작 - "Press SPACE to begin" 버튼 터치 이벤트 리스너 등록
    e.preventDefault(); // prevent default touch event behavior - 기본 터치 동작 방지
    if (!gameState.isPlaying) { // 게임 중 아니면 (일시 정지 상태) - 게임 중 아니면 (일시 정지 상태)
        startBlock(); // 블록 시작 함수 호출 - 게임 시작 - 게임 시작
    }
});

document.getElementById('pressSpaceResult').addEventListener('click', function() { // 결과 화면 "Press SPACE to continue" 버튼 click event listener 등록 - 클릭 시 다음 블록 시작 - 결과 화면 "Press SPACE to continue" 버튼 click event listener 등록
    if (!gameState.isPlaying) { // 게임 중 아니면 (일시 정지 상태) - 게임 중 아니면 (일시 정지 상태)
        startBlock(); // 블록 시작 함수 호출 - 다음 블록 시작 - 다음 블록 시작
    }
});

document.getElementById('pressSpaceResult').addEventListener('touchstart', function(e) { // 결과 화면 "Press SPACE to continue" 버튼 touchstart event listener 등록 - 터치 시 다음 블록 시작 - 결과 화면 "Press SPACE to continue" 버튼 터치 이벤트 리스너 등록
    e.preventDefault(); // prevent default touch event behavior - 기본 터치 동작 방지
    if (!gameState.isPlaying) { // 게임 중 아니면 (일시 정지 상태) - 게임 중 아니면 (일시 정지 상태)
        startBlock(); // 블록 시작 함수 호출 - 다음 블록 시작 - 다음 블록 시작
    }
});

// 사용자 정의 레벨 설정 함수
function setCustomLevel() { // 사용자 정의 레벨 설정 함수 - setLevelBtn 클릭 또는 customLevel input field 에서 Enter 키 입력 시 호출 - 사용자 정의 레벨 설정 함수
    const customLevelInput = document.getElementById('customLevel'); // 레벨 입력 필드 HTML element 가져오기 - 레벨 입력 필드 element 가져오기
    let newLevel = parseInt(customLevelInput.value); // 입력 값 가져와서 정수로 변환 - 입력 값 정수로 변환

    if (isNaN(newLevel) || newLevel < 1) { // 입력 값이 숫자가 아니거나 1보다 작으면 - 입력 값이 유효하지 않으면
        newLevel = 1; // 레벨 1로 설정 (최소 레벨) - 최소 레벨로 설정
        customLevelInput.value = 1; // 입력 필드 값 1로 변경 - 입력 필드 값 업데이트
    } else if (newLevel > 9) { // 입력 값이 9보다 크면 - 입력 값이 최대 레벨 초과 시
        newLevel = 9; // 레벨 9로 설정 (최대 레벨) - 최대 레벨로 설정
        customLevelInput.value = 9; // 입력 필드 값 9로 변경 - 입력 필드 값 업데이트
    }

    gameState.nBackLevel = newLevel; // gameState 의 N-back 레벨 업데이트 - 게임 레벨 업데이트
    document.getElementById('nBackLevel').textContent = newLevel; // 타이틀 화면의 레벨 표시 업데이트 - 타이틀 화면 레벨 표시 업데이트

    // --- [수정됨] 레벨 변경 시 LocalStorage 에 저장 ---
    localStorage.setItem('nBackLevel', gameState.nBackLevel); // LocalStorage 에 현재 N-back 레벨 저장 // --- [NEW] 레벨 저장 코드 추가됨 --- - LocalStorage 에 레벨 저장

    customLevelInput.style.backgroundColor = 'rgba(0, 255, 0, 0.2)'; // 입력 필드 배경색 초록색으로 변경 - 레벨 변경 성공 시 피드백 - 입력 필드 배경색 변경 (성공 피드백)
    setTimeout(() => { // 0.5초 후 배경색 원래대로 복원 (애니메이션 효과) - 0.5초 후 배경색 원래대로 복원
        customLevelInput.style.backgroundColor = 'rgba(255,255,255,0.9)'; // 배경색 light gray 로 복원 - 배경색 복원
    }, 500); // 0.5초 딜레이 - 0.5초 딜레이
}

// --- 페이지 로드 시 저장된 N-back 레벨 및 오늘 게임 횟수, 배경 이미지 목록 불러오기 --- // --- [NEW] 페이지 로드 시 오늘 게임 횟수 불러오기 ---
window.addEventListener('load', function() { // window load event listener 등록 - 페이지 로드 완료 시 실행 - 페이지 로드 시 이벤트 리스너 등록
    // --- 저장된 N-back 레벨 불러오기 ---
    const storedLevel = localStorage.getItem('nBackLevel'); // LocalStorage 에서 'nBackLevel' 키로 저장된 값 가져오기 - LocalStorage 에서 레벨 정보 가져오기
    if (storedLevel) { // 저장된 레벨이 있으면 - 저장된 레벨 정보 있으면
        gameState.nBackLevel = parseInt(storedLevel); // gameState 의 N-back 레벨을 LocalStorage 에서 불러온 값으로 설정 - 게임 레벨 LocalStorage 값으로 설정
        document.getElementById('nBackLevel').textContent = gameState.nBackLevel; // 타이틀 화면의 레벨 표시 업데이트 - 저장된 레벨 표시 - 타이틀 화면 레벨 표시 업데이트
    } // 저장된 레벨 없으면 기본 레벨(1-back) 유지 - 저장된 레벨 없으면 기본 레벨 유지

    // --- 오늘 게임 횟수 불러오기 및 날짜 확인 (수정됨) --- // --- [NEW] 오늘 게임 횟수 불러오기 및 날짜 확인 ---
    let storedTotalGamesToday = localStorage.getItem('totalGamesToday'); // LocalStorage 에서 'totalGamesToday' 키로 저장된 값 가져오기 - LocalStorage 에서 오늘 게임 횟수 정보 가져오기
    let lastGameDateString = localStorage.getItem('lastGameDate'); // LocalStorage 에서 'lastGameDate' 키로 저장된 마지막 게임 날짜 문자열 가져오기 - LocalStorage 에서 마지막 게임 날짜 문자열 가져오기

    if (storedTotalGamesToday && lastGameDateString) { // 저장된 오늘 게임 횟수와 마지막 게임 날짜가 있으면 - 저장된 게임 횟수와 날짜 정보 있으면
        const lastGameDate = new Date(lastGameDateString); // 저장된 날짜 문자열로부터 Date 객체 생성 - 저장된 날짜 문자열로부터 Date 객체 생성
        const todayDate = new Date(); // 오늘 날짜 Date 객체 생성 - 오늘 날짜 Date 객체 생성

        // 날짜 정보 비교 (년, 월, 일) - 날짜 정보 비교
        if (lastGameDate.getFullYear() === todayDate.getFullYear() &&
            lastGameDate.getMonth() === todayDate.getMonth() &&
            lastGameDate.getDate() === todayDate.getDate()) {
            // 마지막 게임 날짜와 오늘 날짜가 같으면 (같은 날짜) - 마지막 게임 날짜와 오늘 날짜 같으면 (같은 날)
            gameState.totalGamesToday = parseInt(storedTotalGamesToday); // 저장된 오늘 게임 횟수 불러오기 - 저장된 오늘 게임 횟수 불러오기
        } else {
            // 마지막 게임 날짜가 오늘 날짜와 다르면 (새로운 날짜) - 마지막 게임 날짜가 오늘 날짜와 다르면 (다른 날)
            gameState.totalGamesToday = 0; // 오늘 게임 횟수 0으로 초기화 - 오늘 게임 횟수 0으로 초기화
        }
    } else {
        gameState.totalGamesToday = 0; // 저장된 오늘 게임 횟수 없으면 0으로 초기화 - 저장된 게임 횟수 없으면 0으로 초기화
    }
    document.getElementById('totalGamesTodayCountValue').textContent = gameState.totalGamesToday; // 타이틀 화면에 오늘 게임 횟수 표시 - 타이틀 화면에 오늘 게임 횟수 표시

    // --- [NEW] 저장된 배경 이미지 목록 불러오기 ---
    loadUploadedImages(); // 페이지 로드 시 저장된 배경 이미지 목록 로드 (초기 로드)
});


// --- 자극 횟수 카운터 업데이트 함수 ---
function updateStimulusCounter() { // 자극 횟수 카운터 업데이트 함수 - generateNextStimulus 함수에서 호출 - 자극 횟수 카운터 업데이트 함수
    const counterElement = document.getElementById('stimulus-counter'); // 자극 횟수 카운터 HTML element 가져오기 - 카운터 element 가져오기
    if (counterElement) { // 카운터 element 가 존재하면 - 카운터 element 존재하면
        counterElement.textContent = `Stimulus: ${gameState.currentStimulus} / ${gameState.stimuliPerBlock}`; // 카운터 텍스트 업데이트 - "Stimulus: 현재 횟수 / 전체 횟수" 형태 - 카운터 텍스트 업데이트
    }
}

// --- 자극 횟수 카운터 초기화 함수 (블록 시작 시) ---
function resetStimulusCounter() { // 자극 횟수 카운터 초기화 함수 - startBlock 함수에서 호출 - 자극 횟수 카운터 초기화 함수
    const counterElement = document.getElementById('stimulus-counter'); // 자극 횟수 카운터 HTML element 가져오기 - 카운터 element 가져오기
    if (counterElement) { // 카운터 element 가 존재하면 - 카운터 element 존재하면
        counterElement.textContent = `Stimulus: 0 / ${gameState.stimuliPerBlock}`; // 초기 텍스트 설정 - "Stimulus: 0 / 전체 횟수" 형태 - 카운터 텍스트 초기화
    }
}


// 애니메이션 렌더링 함수
function animate() { // 애니메이션 렌더링 함수 - requestAnimationFrame 사용 - 애니메이션 렌더링 함수
    requestAnimationFrame(animate); // requestAnimationFrame 재귀 호출 - 브라우저 repaint 시 animate 함수 반복 호출 (rendering loop) - 애니메이션 프레임 요청 (rendering loop)
    renderer.render(scene, camera); // Three.js 렌더러 렌더링 - scene 과 camera 를 사용하여 렌더링 - scene 렌더링
}

animate(); // animate 함수 최초 호출 - rendering loop 시작 - rendering loop 시작
