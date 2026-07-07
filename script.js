const grid = document.querySelector('.grid');
const squares = document.querySelectorAll('.square');
const scoreDisplay = document.getElementById('score');
const timeLeftDisplay = document.getElementById('time-left');
const startButton = document.getElementById('start-button');
const timeButtons = document.querySelectorAll('.time-btn');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const moleUpload = document.getElementById('mole-upload');
const fileNameDisplay = document.getElementById('file-name');

// 結果表示モーダル関連の要素
const resultModal = document.getElementById('result-modal');
const resultStars = document.getElementById('result-stars');
const resultCount = document.getElementById('result-count');
const resultMessage = document.getElementById('result-message');
const playAgainButton = document.getElementById('play-again-button');
const homeButton = document.getElementById('home-button');

// きゅうけい（ポーズ）関連の要素
const pauseButton = document.getElementById('pause-button');
const pauseModal = document.getElementById('pause-modal');
const resumeButton = document.getElementById('resume-button');
const quitButton = document.getElementById('quit-button');

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
let moleAppearances = 0; // 出現数（星の数の計算に使う）

// もぐらの表情画像（出現時にランダムで切り替え、叩かれたら目回し顔）
const moleExpressions = [
    'images/mole-normal.png',
    'images/mole-happy.png',
    'images/mole-angry.png',
    'images/mole-smile.png',
    'images/mole-surprised.png',
];
const moleDizzyImage = 'images/mole-dizzy.png';
let customMoleImage = null; // アップロード画像があれば表情切替せずこちらを使う

// ちらつき防止のため全表情を先読み
[...moleExpressions, moleDizzyImage].forEach(src => { new Image().src = src; });

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
    customMoleImage = canvas.toDataURL('image/png');

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
        square.querySelector('.mole').classList.remove('up', 'hit');
    });

    let randomSquare = squares[Math.floor(Math.random() * 9)];
    const mole = randomSquare.querySelector('.mole');
    const image = customMoleImage
        || moleExpressions[Math.floor(Math.random() * moleExpressions.length)];
    mole.style.backgroundImage = `url("${image}")`;
    mole.classList.add('up');
    hitPosition = randomSquare.id;
    moleAppearances++;
}

function hitMole(square) {
    if (timerId && square.id == hitPosition) {
        score++;
        scoreDisplay.textContent = score;
        hitPosition = null;

        const mole = square.querySelector('.mole');
        if (!customMoleImage) {
            // 目回し顔を一瞬見せてから引っ込める
            mole.style.backgroundImage = `url("${moleDizzyImage}")`;
            mole.classList.add('hit');
            setTimeout(() => {
                if (mole.classList.contains('hit')) {
                    mole.classList.remove('up', 'hit');
                }
            }, 350);
        } else {
            mole.classList.remove('up');
        }
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

        document.body.classList.remove('playing');

        setTimeout(() => {
            showResult();
            startButton.disabled = false;
            startButton.textContent = 'もういちど あそぶ';
            timeButtons.forEach(btn => btn.disabled = false);
            difficultyButtons.forEach(btn => btn.disabled = false);
            moleUpload.disabled = false;
        }, 100);

        squares.forEach(square => {
            square.querySelector('.mole').classList.remove('up', 'hit');
        });
    }
}

// 結果表示：たたけた割合で星とほめことばを決める（時間・難易度が違っても公平）
function showResult() {
    const ratio = moleAppearances > 0 ? score / moleAppearances : 0;
    let stars, message;
    if (score === 0) {
        stars = 0;
        message = 'つぎは きっと たたけるよ！';
    } else if (ratio >= 0.7) {
        stars = 3;
        message = 'もぐらたたき めいじん！';
    } else if (ratio >= 0.4) {
        stars = 2;
        message = 'すごい！ そのちょうし！';
    } else {
        stars = 1;
        message = 'よく がんばったね！';
    }

    resultStars.innerHTML =
        '<span class="star">⭐</span>'.repeat(stars)
        + '<span class="star">☆</span>'.repeat(3 - stars);
    resultCount.textContent = score;
    resultMessage.textContent = message;
    resultModal.style.display = 'flex';
}

playAgainButton.addEventListener('click', () => {
    resultModal.style.display = 'none';
    startGame();
});

// ほーむ（最初の画面）に戻す
function goHome() {
    clearInterval(timerId);
    clearInterval(moleTimerId);
    timerId = null;

    resultModal.style.display = 'none';
    pauseModal.style.display = 'none';
    document.body.classList.remove('playing');

    score = 0;
    timeLeft = gameTime;
    scoreDisplay.textContent = score;
    timeLeftDisplay.textContent = timeLeft;
    hitPosition = null;

    startButton.disabled = false;
    startButton.textContent = 'スタート';
    timeButtons.forEach(btn => btn.disabled = false);
    difficultyButtons.forEach(btn => btn.disabled = false);
    moleUpload.disabled = false;

    squares.forEach(square => {
        square.querySelector('.mole').classList.remove('up', 'hit');
    });
}

homeButton.addEventListener('click', goHome);
quitButton.addEventListener('click', goHome);

// きゅうけい（ポーズ）
pauseButton.addEventListener('click', () => {
    if (!timerId) return;
    clearInterval(timerId);
    clearInterval(moleTimerId);
    timerId = null; // プレイ中判定をオフにして、きゅうけい中は叩けなくする
    hitPosition = null;
    squares.forEach(square => {
        square.querySelector('.mole').classList.remove('up', 'hit');
    });
    pauseModal.style.display = 'flex';
});

resumeButton.addEventListener('click', () => {
    pauseModal.style.display = 'none';
    moveMole();
    timerId = setInterval(countDown, 1000);
});

function startGame() {
    score = 0;
    timeLeft = gameTime;
    moleAppearances = 0;
    scoreDisplay.textContent = score;
    timeLeftDisplay.textContent = timeLeft;
    hitPosition = null;
    
    startButton.disabled = true;
    startButton.textContent = 'プレイ中';
    document.body.classList.add('playing');
    timeButtons.forEach(btn => btn.disabled = true);
    difficultyButtons.forEach(btn => btn.disabled = true);
    moleUpload.disabled = true;

    moveMole();
    timerId = setInterval(countDown, 1000);
}

startButton.addEventListener('click', startGame);
