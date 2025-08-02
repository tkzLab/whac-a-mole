const grid = document.querySelector('.grid');
const squares = document.querySelectorAll('.square');
const scoreDisplay = document.getElementById('score');
const timeLeftDisplay = document.getElementById('time-left');
const startButton = document.getElementById('start-button');
const timeButtons = document.querySelectorAll('.time-btn');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const moleUpload = document.getElementById('mole-upload');
const fileNameDisplay = document.getElementById('file-name');

// モーダル関連の要素
const cropModal = document.getElementById('crop-modal');
const imageToCrop = document.getElementById('image-to-crop');
const cropButton = document.getElementById('crop-button');
const cancelCropButton = document.getElementById('cancel-crop-button');
let cropper;

let score = 0;
let gameTime = 15;
let timeLeft = gameTime;
let moleSpeed = 2600;
let hitPosition;
let timerId = null;
let moleTimerId = null;

// --mole-image変数をgridではなく、:root（ドキュメント全体）に設定
document.documentElement.style.setProperty('--mole-image', "url('mole.svg')");
document.documentElement.style.setProperty('--mole-rise-time', '1.2s');
timeLeftDisplay.textContent = timeLeft;

// 画像アップロード時の処理
moleUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
        fileNameDisplay.textContent = '未選択';
        return;
    }
    fileNameDisplay.textContent = file.name;

    const reader = new FileReader();
    reader.onload = (event) => {
        imageToCrop.src = event.target.result;
        cropModal.style.display = 'flex';
        
        if(cropper) cropper.destroy();
        cropper = new Cropper(imageToCrop, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            background: false,
            autoCropArea: 0.8,
            cropBoxMovable: false,
            cropBoxResizable: false,
        });
    };
    reader.readAsDataURL(file);
});

// トリミング決定ボタン
cropButton.addEventListener('click', () => {
    const canvas = cropper.getCroppedCanvas({
        width: 200,
        height: 200,
        imageSmoothingQuality: 'high',
    });
    const croppedImageDataUrl = canvas.toDataURL('image/png');
    document.documentElement.style.setProperty('--mole-image', `url(${croppedImageDataUrl})`);
    
    cropModal.style.display = 'none';
    cropper.destroy();
});

// キャンセルボタン
cancelCropButton.addEventListener('click', () => {
    cropModal.style.display = 'none';
    cropper.destroy();
    moleUpload.value = '';
    fileNameDisplay.textContent = '未選択';
});

// 時間選択ボタンの処理
timeButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (timerId) return;
        timeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        gameTime = parseInt(button.dataset.time);
        timeLeft = gameTime;
        timeLeftDisplay.textContent = timeLeft;
    });
});

// 難易度選択ボタンの処理
difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (timerId) return;
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        moleSpeed = parseInt(button.dataset.speed);
        const riseTime = moleSpeed > 1000 ? '1.2s' : '0.3s';
        document.documentElement.style.setProperty('--mole-rise-time', riseTime);
    });
});

function randomSquare() {
    squares.forEach(square => {
        square.querySelector('.mole').classList.remove('up');
    });

    let randomSquare = squares[Math.floor(Math.random() * 9)];
    randomSquare.querySelector('.mole').classList.add('up');
    hitPosition = randomSquare.id;
}

function hitMole(square) {
    if (timerId && square.id == hitPosition) {
        score++;
        scoreDisplay.textContent = score;
        square.querySelector('.mole').classList.remove('up');
        hitPosition = null;
    }
}

squares.forEach(square => {
    square.addEventListener('mousedown', () => hitMole(square));
    square.addEventListener('touchstart', (e) => {
        e.preventDefault(); // ダブルタップでのズームを防ぐ
        hitMole(square);
    });
});

function moveMole() {
    moleTimerId = setInterval(randomSquare, moleSpeed);
}

function countDown() {
    timeLeft--;
    timeLeftDisplay.textContent = timeLeft;

    if (timeLeft == 0) {
        clearInterval(timerId);
        clearInterval(moleTimerId);
        timerId = null;
        
        setTimeout(() => {
            alert('ゲームオーバー! あなたのスコアは ' + score + ' です。');
            startButton.disabled = false;
            startButton.textContent = 'もう一度プレイ';
            timeButtons.forEach(btn => btn.disabled = false);
            difficultyButtons.forEach(btn => btn.disabled = false);
            moleUpload.disabled = false;
        }, 100);

        squares.forEach(square => {
            square.querySelector('.mole').classList.remove('up');
        });
    }
}

function startGame() {
    score = 0;
    timeLeft = gameTime;
    scoreDisplay.textContent = score;
    timeLeftDisplay.textContent = timeLeft;
    hitPosition = null;
    
    startButton.disabled = true;
    startButton.textContent = 'プレイ中';
    timeButtons.forEach(btn => btn.disabled = true);
    difficultyButtons.forEach(btn => btn.disabled = true);
    moleUpload.disabled = true;

    moveMole();
    timerId = setInterval(countDown, 1000);
}

startButton.addEventListener('click', startGame);
