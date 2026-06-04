let noiseOffset = 0;
let rainParticles = []; // 비 효과를 위한 배열

let hud; // 2D UI 전용 화면
let bgm;
let rainSound;
let bgmStarted = false;
let gunSound;

// ===== 게임 기본 변수 =====
let userName;
let gameState = "intro";
// intro, roundIntro, playerTurn, shooting, shootingResult, gameOver, clear

let dialogLines = [];
let dialogIndex = 0;
let dialogStartTime = 0;
let dialogDelay = 1700;

let round = 1;
let bullets = [];
let items = [];
let buttons = [];

let skipButton; // 대사 스킵 버튼

let message = "";
let shootingStartTime = 0;
let shootingResult = "";

// 아이템 시스템
let itemUseCount = 0;
let maxItemUseCount = 2;
let chocolateUsed = false;

// 총격 결과 화면용
let shootingResolved = false;
let resultStartTime = 0;
let resultTitle = "";
let resultText = "";

// 연출용 변수
let dealerSpeak = "";
let dealerSpeakTimer = 0;

function preload() {
  soundFormats("mp3");
  bgm = loadSound("assets/334911__fraskoh__cellar-wind-tube.mp3");
  rainSound = loadSound("assets/rainSound.mp3");
  gunSound = loadSound("assets/gunboom.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
    // 비 입자 초기 생성
  for (let i = 0; i < 20; i++) {
    rainParticles.push({
      x: random(-248, 248),
      y: random(-220, 20),
      z: -695,
      speed: random(10, 20),
      len: random(15, 28)
    });
  } 
  
  bgm.setVolume(0.20);
  rainSound.setVolume(0.45);
  gunSound.setVolume(0.7);
  
  hud = createGraphics(windowWidth, windowHeight);
  hud.textFont("monospace");

  userName = prompt("이름을 입력해주세요. / 성과 이름을 포함한 3글자여야합니다.");
  if (!userName || userName.length < 3) {
    userName = "손님A";
  }

  startIntro();
}

function draw() {
  background(20);

  camera(
    0, -120, 760,
    0, 20, -120,
    0, 1, 0
  );

  setLighting();
  drawRoom();
  drawWindowAndRain();
  drawProps();
  drawLamp();
  drawMainStage();

  if (gameState === "shooting") {
    drawGunAiming();
    updateShooting();
  }

  if (gameState === "shootingResult") {
    updateShootingResult();
  }

  drawHUD();

  if (gameState === "intro" || gameState === "roundIntro") {
    updateDialog();
  }

  if (dealerSpeak && millis() > dealerSpeakTimer) {
    dealerSpeak = "";
  }
}

// ===============================
// 1. 상태 시작 함수들
// ===============================
function startIntro() {
  gameState = "intro";

  dialogLines = [
    userName[0] + "..." + userName[1] + "..." + userName[2] + "..?",
    "이건...",
    "처음 듣는 이름이군요.",
    "규칙은 간단합니다.",
    "아이템을 사용해 현재 장전된 탄을 추측하세요.",
    "단, 한 턴에 아이템은 최대 2개까지만 사용할 수 있습니다.",
    "매 턴마다 랜덤 아이템 3개와 기본 휴대전화 1개가 지급됩니다.",
    "기본 휴대전화는 따로 표시되며, 사용 횟수를 소모하지 않습니다.",
    "랜덤 아이템으로 휴대전화가 한 번 더 나올 수도 있습니다.",
    "랜덤으로 나온 휴대전화는 아이템 사용 횟수를 소모합니다.",
    "다이아몬드는 강력하지만 아이템 사용 횟수 2개를 모두 소모합니다.",
    "다이아몬드는 다른 아이템을 사용하기 전에만 사용할 수 있습니다.",
    "공포탄이라고 판단되면 준비 완료를 누르십시오.",
    "실탄이라면... 여기서 끝입니다."
  ];

  dialogIndex = 0;
  dialogStartTime = millis();
}

function startRound(r) {
  round = r;
  gameState = "roundIntro";

  itemUseCount = 0;
  chocolateUsed = false;
  shootingResolved = false;

  if (round === 1) {
    bullets = ["실탄", "실탄", "실탄", "실탄", "공포탄", "공포탄"];
  } else {
    bullets = ["실탄", "실탄", "실탄", "실탄", "공포탄"];
  }

  shuffle(bullets, true);
  makeRandomItems();

  dialogLines = [
    round + "턴 시작.",
    "탄창에는 실탄과 공포탄이 섞여 있습니다.",
    "이번 턴에는 랜덤 아이템 3개와 기본 휴대전화 1개가 지급됩니다.",
    "기본 휴대전화는 사용 횟수를 소모하지 않습니다.",
    "랜덤 아이템으로 나온 휴대전화는 사용 횟수를 소모합니다.",
    "아이템은 최대 2개까지만 사용할 수 있습니다.",
    "다이아몬드는 아이템 사용 횟수 2개를 모두 소모합니다.",
    "단, 다이아몬드는 다른 아이템을 사용하기 전에만 사용할 수 있습니다.",
    "살아남으려면 현재 장전된 탄이 공포탄이어야 합니다."
  ];

  dialogIndex = 0;
  dialogStartTime = millis();
}

function startPlayerTurn() {
  gameState = "playerTurn";
  message = "아이템을 사용하거나 준비 완료를 누르세요.";
  makeButtons();
}

function startShooting() {
  gameState = "shooting";
  shootingStartTime = millis();
  shootingResult = bullets[0];
  shootingResolved = false;

  dealerSpeak = "준비되었습니까?";
  dealerSpeakTimer = millis() + 1800;
}

// ===============================
// 2. 대사 업데이트
// ===============================
function updateDialog() {
  if (millis() - dialogStartTime > dialogDelay) {
    dialogIndex++;
    dialogStartTime = millis();

    if (dialogIndex >= dialogLines.length) {
      if (gameState === "intro") {
        startRound(1);
      } else if (gameState === "roundIntro") {
        startPlayerTurn();
      }
    }
  }
}

// ===============================
// 3. 3D 씬
// ===============================
function setLighting() {
  ambientLight(25, 25, 30);

  // 형광등 불규칙 깜빡임
  noiseOffset += 0.004;
  let baseFlicker = noise(noiseOffset) * 120 + 1000;
  let finalFlicker = 0;

  let r = random(1);

  if (r < 0.002) {
    finalFlicker = 10;
  } else if (r < 0.008) {
    finalFlicker = random(60, 140);
  } else {
    finalFlicker = baseFlicker * 3.5;
  }

  pointLight(
    finalFlicker * 0.7,
    finalFlicker,
    finalFlicker * 0.7,
    0,
    -350,
    0
  );

  spotLight(
    finalFlicker * 0.9,
    finalFlicker * 0.85,
    finalFlicker * 0.7,
    0,
    -420,
    0,
    0,
    1,
    0,
    PI / 2.5,
    4
  );

  pointLight(50, 45, 40, 0, 80, 500);

  drawingContext.lampBrightness = finalFlicker;
}

function drawRoom() {
  push();
  fill(25);
  noStroke();

  // 바닥
  push();
  translate(0, 220, 0);
  rotateX(HALF_PI);
  plane(1800, 1800);
  pop();

  // 천장
  push();
  translate(0, -520, 0);
  rotateX(HALF_PI);
  plane(1800, 1800);
  pop();

  // 정면 벽
  push();
  translate(0, -150, -700);
  plane(1800, 800);
  pop();

  // 왼쪽 벽
  push();
  translate(-700, -150, 0);
  rotateY(HALF_PI);
  plane(1800, 800);
  pop();

  // 오른쪽 벽
  push();
  translate(700, -150, 0);
  rotateY(HALF_PI);
  plane(1800, 800);
  pop();

  pop();
}

function drawWindowAndRain() {
  // 창문 프레임
  push();
  translate(0, -150, -698);
  fill(12, 15, 12);
  stroke(40, 55, 40);
  strokeWeight(5);
  rectMode(CENTER);

  // 창문 본체
  rect(0, 0, 500, 250);

  // 창문 십자 프레임
  strokeWeight(4);
  line(-250, 0, 250, 0);
  line(0, -125, 0, 125);

  pop();

  // 비 효과
  push();
  stroke(60, 90, 130, 170);
  strokeWeight(2.5);

  for (let p of rainParticles) {
    p.y += p.speed;

    // 창문 안쪽에서만 비가 보이게 제한
    if (p.x > -248 && p.x < 248 && p.y > -125 && p.y < 125) {
      line(
        p.x,
        p.y - 150,
        p.z,
        p.x - 3,
        p.y - 150 + p.len,
        p.z
      );
    }

    // 아래로 벗어나면 위로 다시 보냄
    if (p.y > 140) {
      p.y = random(-130, -80);
      p.x = random(-248, 248);
    }
  }

  pop();
}

function drawProps() {
  push();
  fill(20);

  push();
  translate(-430, -40, -560);
  box(150, 520, 150);
  pop();

  push();
  translate(430, -40, -560);
  box(150, 520, 150);
  pop();

  push();
  translate(470, 110, -220);
  box(190, 190, 190);
  translate(-60, -140, 20);
  box(100, 100, 100);
  pop();

  push();
  translate(-500, 130, -180);
  box(160, 160, 160);
  pop();

  pop();
}

function drawLamp() {
  push();
  noStroke();
  translate(0, -450, 0);

  // 전등 줄
  push();
  fill(40);
  box(4, 90, 4);
  pop();

  // 전등 갓
  push();
  translate(0, 55, 0);
  fill(50, 52, 50);
  cylinder(65, 40);

  // 전구
  let bright = drawingContext.lampBrightness || 0;
  translate(0, 15, 0);

  if (bright > 200) {
    emissiveMaterial(240, 255, 200);
  } else {
    emissiveMaterial(30, 40, 30);
  }

  sphere(20);
  pop();

  pop();
}

function drawMainStage() {
  push();
  translate(0, 110, 0);
  fill(50,32, 20  );
  box(700, 26, 420);
  pop();

  push();
  fill(30, 20, 12);

  translate(-250, 180, -120);
  box(25, 120, 25);

  translate(500, 0, 0);
  box(25, 120, 25);

  translate(-500, 0, 240);
  box(25, 120, 25);

  translate(500, 0, 0);
  box(25, 120, 25);

  pop();

  drawDealer();

  push();
  translate(210, 70, -50);
  fill(90, 60, 35);
  box(130, 55, 90);
  pop();

  for (let i = 0; i < 4; i++) {
    push();
    translate(-220 + i * 110, 95, 85);
    fill(70, 55, 40);
    box(70, 10, 70);
    pop();
  }
}

function drawDealer() {
  push();

  // 테이블 뒤쪽에 딜러 배치
  translate(0, -85, -160);

  // 미세한 숨쉬기 모션
  let breathe = sin(frameCount * 0.05) * 3;
  translate(0, breathe, 0);

  noStroke();

  // 어두운 재질
  shininess(10);
  specularMaterial(20, 20, 25);
  ambientMaterial(15, 15, 18);

  // =========================
  // 1. 몸통
  // =========================
  push();
  translate(0, 100, 0);
  rotateX(0.1);
  fill(15, 15, 18);
  box(180, 140, 90);

  // 어깨
  push();
  translate(-90, -40, 0);
  sphere(25);
  pop();

  push();
  translate(90, -40, 0);
  sphere(25);
  pop();

  pop();

  // =========================
  // 2. 목
  // =========================
  push();
  translate(0, 10, 0);
  fill(12, 12, 15);
  cylinder(12, 50);
  pop();

  // =========================
  // 3. 머리
  // =========================
  push();
  translate(0, -40, 10);
  fill(10, 10, 12);
  box(70, 85, 75);

  // 붉게 빛나는 눈
  let eyeGlow = map(drawingContext.lampBrightness || 3500, 0, 3500, 50, 255);
  emissiveMaterial(eyeGlow, 0, 0);
  noStroke();

  push();
  translate(-18, -15, 39);
  sphere(6);
  pop();

  push();
  translate(18, -15, 39);
  sphere(6);
  pop();

  pop();

  // 눈 이후 재질 초기화 느낌으로 다시 어두운 재질 적용
  ambientMaterial(15, 15, 18);

  // =========================
  // 4. 왼팔
  // =========================
  push();
  translate(-105, 105, 20);
  rotateZ(0.25);
  rotateX(0.15);
  fill(14, 14, 17);
  cylinder(11, 130);
  pop();

  // =========================
  // 5. 오른팔
  // =========================
  push();
  translate(105, 105, 20);
  rotateZ(-0.25);
  rotateX(0.15);
  fill(14, 14, 17);
  cylinder(11, 130);
  pop();

  pop();
}

// ===============================
// 총 조준 모션
// ===============================
function drawGunAiming() {
  let t = constrain((millis() - shootingStartTime) / 1500, 0, 1);
  let easeT = 1 - pow(1 - t, 3);

  push();

  let gunZ = lerp(-130, 210, easeT);
  let gunY = lerp(35, 40, easeT);

  translate(0, gunY, gunZ);

  let shake = sin(millis() * 0.018) * 0.015;
  rotateY(shake);
  rotateX(-0.04);

  push();
  noStroke();
 
  push(); //총열
  translate(0, -35, 75);
  rotateX(HALF_PI);
  fill(35);
  cylinder(10, 290);
  pop();

  push();
  translate(0, -20, 35); //총몸체
  fill(139, 69, 19);
  box(20, 25, -185);
  pop();

  push();
  translate(0, -10, -120); //개머리판
  rotateX(0.25);
  fill(139, 69, 19);
  box(20, 30, 150);
  pop();

  push();
  translate(0, -5, -70); //그립
  rotateX(-0.45);
  fill(139, 69, 19);
  box(10, 70, 20);
  pop();
  
  push();
  translate(0, -10, -50);
  fill(0, 0, 0);
  rotateY(HALF_PI);
  torus(15, 5);
  pop();
}

// ===============================
// 4. HUD, 2D 화면 UI
// ===============================
function drawHUD() {
  hud.clear();

  if (gameState === "intro" || gameState === "roundIntro") {
    drawDialogBox();
  }

  if (gameState === "playerTurn") {
    drawTopInfo();
    drawBulletInfoPanel();
    drawMessagePanel();
    drawButtons();
    drawItemDescription();
  }

  if (gameState === "shooting") {
    drawTopInfo();
    drawBulletInfoPanel();
  }

  if (gameState === "shootingResult") {
    drawResultPanel(resultTitle, resultText);
  }

  if (dealerSpeak !== "") {
    drawDealerSpeech(dealerSpeak);
  }

  if (gameState === "gameOver") {
    drawEndScreen(
      "GAME OVER",
      "실탄이었습니다.\n당신은 살아남지 못했습니다.\n\n스페이스바를 눌러 처음으로 돌아가기"
    );
  }

  if (gameState === "clear") {
    drawEndScreen(
      "생존",
      "당신은 2번의 턴을 모두 버텼습니다.\n\n당신은 생존하셨습니다.\n\n스페이스바를 눌러 다시 시작"
    );
  }

  drawingContext.disable(drawingContext.DEPTH_TEST);

  push();
  resetMatrix();
  imageMode(CORNER);
  image(hud, -width / 2, -height / 2, width, height);
  pop();

  drawingContext.enable(drawingContext.DEPTH_TEST);
}

function drawDialogBox() {
  hud.fill(0, 235);
  hud.rect(100, height - 220, width - 200, 130, 20);

  hud.stroke(230);
  hud.strokeWeight(2);
  hud.noFill();
  hud.rect(100, height - 220, width - 200, 130, 20);
  hud.noStroke();

  hud.fill(255);
  hud.textAlign(LEFT, TOP);
  hud.textSize(18);
  hud.text("DEALER", 130, height - 200);

  if (dialogIndex < dialogLines.length) {
    hud.textSize(24);
    hud.text(dialogLines[dialogIndex], 130, height - 160);
  }

  // 대사 스킵 버튼
  skipButton = {
    x: width - 220,
    y: height - 290,
    w: 120,
    h: 45
  };

  let overSkip =
    mouseX > skipButton.x &&
    mouseX < skipButton.x + skipButton.w &&
    mouseY > skipButton.y &&
    mouseY < skipButton.y + skipButton.h;

  if (overSkip) {
    hud.fill(240);
  } else {
    hud.fill(170);
  }

  hud.rect(skipButton.x, skipButton.y, skipButton.w, skipButton.h, 12);

  hud.fill(0);
  hud.textAlign(CENTER, CENTER);
  hud.textSize(16);
  hud.text("스킵", skipButton.x + skipButton.w / 2, skipButton.y + skipButton.h / 2);
}

function drawTopInfo() {
  let boxX = 70;
  let boxY = 25;
  let boxW = 240;
  let boxH = 115;

  hud.fill(0, 190);
  hud.rect(boxX, boxY, boxW, boxH, 16);

  hud.stroke(180);
  hud.strokeWeight(1);
  hud.noFill();
  hud.rect(boxX, boxY, boxW, boxH, 16);
  hud.noStroke();

  hud.fill(255);
  hud.textAlign(LEFT, TOP);
  hud.textSize(20);
  hud.text("ROUND : " + round, boxX + 20, boxY + 20);

  hud.textSize(16);
  hud.text("현재 탄 수 : " + bullets.length, boxX + 20, boxY + 53);
  hud.text("아이템 사용 : " + itemUseCount + " / " + maxItemUseCount, boxX + 20, boxY + 80);
}
function drawBulletInfoPanel() {
  let liveCount = 0;
  let blankCount = 0;

  for (let b of bullets) {
    if (b === "실탄") liveCount++;
    else blankCount++;
  }

  hud.fill(0, 190);
  hud.rect(width - 240, 25, 210, 110, 16);

  hud.stroke(180);
  hud.strokeWeight(1);
  hud.noFill();
  hud.rect(width - 240, 25, 210, 110, 16);
  hud.noStroke();

  hud.fill(255);
  hud.textAlign(LEFT, TOP);
  hud.textSize(18);
  hud.text("탄 상자", width - 220, 42);

  hud.textSize(16);
  hud.text("실탄 : " + liveCount + "개", width - 220, 74);
  hud.text("공포탄 : " + blankCount + "개", width - 220, 100);
}

function drawMessagePanel() {
  hud.fill(0, 190);
  hud.rect(70, height - 250, width - 140, 70, 16);

  hud.stroke(160);
  hud.strokeWeight(1);
  hud.noFill();
  hud.rect(70, height - 250, width - 140, 70, 16);
  hud.noStroke();

  hud.fill(255);
  hud.textAlign(CENTER, CENTER);
  hud.textSize(18);
  hud.text(message, width / 2, height - 215);
}

function drawButtons() {
  for (let btn of buttons) {
    drawButton(btn);
  }
}

function drawButton(btn) {
  let disabled = false;

  if (
    btn.type === "item" &&
    itemUseCount >= maxItemUseCount &&
    btn.label !== "기본 휴대전화"
  ) {
    disabled = true;
  }

  if (btn.type === "item" && btn.label === "다이아몬드" && itemUseCount > 0) {
    disabled = true;
  }

  if (disabled) {
    hud.fill(90);
  } else if (isMouseOver(btn)) {
    hud.fill(240);
  } else {
    hud.fill(190);
  }

  hud.rect(btn.x, btn.y, btn.w, btn.h, 12);

  if (disabled) {
    hud.fill(180);
  } else {
    hud.fill(0);
  }

  hud.textAlign(CENTER, CENTER);
  hud.textSize(16);
  hud.text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
}

function drawItemDescription() {
  for (let btn of buttons) {
    if (btn.type === "item" && isMouseOver(btn)) {
      let desc = getItemDescription(btn.label);
      drawTooltip(desc);
    }
  }
}

function drawTooltip(desc) {
  let boxW = 410;
  let boxH = 130;
  let boxX = mouseX + 18;
  let boxY = mouseY - 140;

  if (boxX + boxW > width) {
    boxX = width - boxW - 20;
  }

  if (boxY < 20) {
    boxY = mouseY + 20;
  }

  hud.fill(0, 235);
  hud.rect(boxX, boxY, boxW, boxH, 14);

  hud.stroke(220);
  hud.strokeWeight(1);
  hud.noFill();
  hud.rect(boxX, boxY, boxW, boxH, 14);
  hud.noStroke();

  hud.fill(255);
  hud.textAlign(LEFT, TOP);
  hud.textSize(14);
  hud.text(desc, boxX + 14, boxY + 14);
}

function drawDealerSpeech(str) {
  hud.fill(0, 210);
  hud.rect(width / 2 - 220, 110, 440, 70, 18);

  hud.stroke(220);
  hud.strokeWeight(2);
  hud.noFill();
  hud.rect(width / 2 - 220, 110, 440, 70, 18);
  hud.noStroke();

  hud.fill(255);
  hud.textAlign(CENTER, CENTER);
  hud.textSize(22);
  hud.text(str, width / 2, 145);
}

function drawResultPanel(title, textContent) {
  hud.fill(0, 220);
  hud.rect(0, 0, width, height);

  hud.fill(255);
  hud.textAlign(CENTER, CENTER);

  hud.textSize(44);
  hud.text(title, width / 2, height / 2 - 70);

  hud.textSize(22);
  hud.text(textContent, width / 2, height / 2 + 20);
}

function drawEndScreen(title, subtitle) {
  hud.fill(0, 230);
  hud.rect(0, 0, width, height);

  hud.fill(255);
  hud.textAlign(CENTER, CENTER);

  hud.textSize(52);
  hud.text(title, width / 2, height / 2 - 70);

  hud.textSize(22);
  hud.text(subtitle, width / 2, height / 2 + 30);
}

// ===============================
// 5. 버튼 / 아이템
// ===============================
function makeRandomItems() {
  let randomItemPool = [
  "돋보기",
  "휴대전화",
  "자석",
  "고양이 상자",
  "초콜렛",
  "어금니",
  "립스틱",
  "주사위",
  "다이아몬드"
];

  shuffle(randomItemPool, true);

  // 랜덤 아이템 3개
  items = randomItemPool.slice(0, 3);

  // 기본 지급 휴대전화
  // 이 아이템은 사용 횟수를 소모하지 않음
  items.push("기본 휴대전화");

  shuffle(items, true);
}

function makeButtons() {
  buttons = [];

  let startX = 70;
  let y = height - 140;

  for (let i = 0; i < items.length; i++) {
    buttons.push({
      x: startX + i * 150,
      y: y,
      w: 130,
      h: 50,
      label: items[i],
      type: "item",
      itemIndex: i
    });
  }

  buttons.push({
    x: width - 240,
    y: height - 140,
    w: 170,
    h: 55,
    label: "준비 완료",
    type: "ready"
  });
}

function isMouseOver(btn) {
  return (
    mouseX > btn.x &&
    mouseX < btn.x + btn.w &&
    mouseY > btn.y &&
    mouseY < btn.y + btn.h
  );
}

function getItemDescription(itemName) {
  if (itemName === "돋보기") {
    return "돋보기\n현재 장전된 탄의 종류를 확인합니다.";
  } else if (itemName === "휴대전화") {
  return "휴대전화\n현재 탄을 제외한 랜덤한 위치의 탄 2개 정보를 알려줍니다.\n랜덤 아이템이므로 사용 횟수를 1회 소모합니다.";
  } else if (itemName === "기본 휴대전화") {
    return "기본 휴대전화\n현재 탄을 제외한 랜덤한 위치의 탄 정보를 알려줍니다.\n기본 지급 아이템이므로 사용 횟수를 소모하지 않습니다.";
  } else if (itemName === "자석") {
    return "자석\n총 안에 있는 모든 탄의 순서를 무작위로 섞습니다.";
  } else if (itemName === "고양이 상자") {
    return "고양이 상자\n50% 확률로 현재 장전된 탄을 바꿉니다.\n하지만 바뀌었는지는 알 수 없습니다.";
  } else if (itemName === "초콜렛") {
    return "초콜렛\n실탄 2발을 추가하고 탄을 섞습니다.\n대신 이번 턴 실탄을 맞아도 10% 확률로 생존합니다.";
  } else if (itemName === "어금니") {
  return "어금니\n실탄 1발을 추가하고 탄을 섞습니다.\n섞인 결과는 알 수 없습니다.";
  } else if (itemName === "립스틱") {
    return "립스틱\n현재 배열된 탄의 순서를 뒤로 한 칸 미룹니다.";
  } else if (itemName === "주사위") {
    return "주사위\n현재 배열된 탄의 순서를 뒤로 두 칸 미룹니다.";
  } else if (itemName === "다이아몬드") {
    return "다이아몬드\n실탄 개수를 공포탄 개수와 같게 바꾸고 섞습니다.\n단, 아이템 사용 전이어야만 사용할 수 있습니다.";
  }

  return "";
}

function rotateBulletsBack(step) {
  if (bullets.length <= 1) return;

  let moveCount = step % bullets.length;

  for (let i = 0; i < moveCount; i++) {
    let lastBullet = bullets.pop();
    bullets.unshift(lastBullet);
  }
}

function useItem(index) {
  let item = items[index];

  // 기본 휴대전화는 사용 횟수가 꽉 차도 사용 가능
  if (itemUseCount >= maxItemUseCount && item !== "기본 휴대전화") {
    message = "이번 턴에는 아이템을 더 이상 사용할 수 없습니다.";
    return;
  }

  // 다이아몬드는 다른 아이템을 하나라도 사용했다면 사용 불가
  if (item === "다이아몬드" && itemUseCount > 0) {
    message = "다이아몬드는 다른 아이템을 사용하기 전에만 사용할 수 있습니다.";
    return;
  }

  if (item === "돋보기") {
    message = "돋보기 사용: 현재 장전된 탄은 [" + bullets[0] + "]입니다.";
    itemUseCount++;
  }

  else if (item === "휴대전화") {
  if (bullets.length <= 1) {
    message = "휴대전화 사용 실패: 확인할 다른 탄이 없습니다.";
  } else {
    // 현재 탄인 0번을 제외하고 확인 가능한 인덱스 목록 만들기
    let possibleIndexes = [];

    for (let i = 1; i < bullets.length; i++) {
      possibleIndexes.push(i);
    }

    // 인덱스 순서를 섞어서 랜덤하게 만들기
    shuffle(possibleIndexes, true);

    // 최대 2개까지 확인
    let checkCount = min(2, possibleIndexes.length);

    message = "휴대전화 사용: ";

    for (let i = 0; i < checkCount; i++) {
      let bulletIndex = possibleIndexes[i];

      message +=
        (bulletIndex + 1) +
        "번째 탄은 [" +
        bullets[bulletIndex] +
        "]";

      if (i < checkCount - 1) {
        message += ", ";
      }
    }

    message += "입니다.";
  }

  itemUseCount++;
}

  else if (item === "기본 휴대전화") {
    if (bullets.length <= 1) {
      message = "기본 휴대전화 사용 실패: 확인할 다른 탄이 없습니다.";
    } else {
      let randomIndex = floor(random(1, bullets.length));
      message = "기본 휴대전화: " + (randomIndex + 1) + "번째 탄은 [" + bullets[randomIndex] + "]입니다.";
    }
  }

  else if (item === "자석") {
    shuffle(bullets, true);
    message = "자석 사용: 탄의 순서가 완전히 뒤섞였습니다.";
    itemUseCount++;
  }

  else if (item === "고양이 상자") {
    let chance = random(1);

    if (chance < 0.5) {
      if (bullets[0] === "실탄") {
        bullets[0] = "공포탄";
      } else {
        bullets[0] = "실탄";
      }
    }

    message = "고양이 상자 사용: 무언가 바뀐 것 같기도 합니다...";
    itemUseCount++;
  }

  else if (item === "초콜렛") {
    bullets.push("실탄");
    bullets.push("실탄");

    shuffle(bullets, true);

    chocolateUsed = true;

    message = "초콜렛 사용: 실탄 2발이 추가되고 탄이 섞였습니다. 이번 턴 실탄 생존 확률 10%가 생깁니다.";
    itemUseCount++;
  }

  else if (item === "어금니") {
    bullets.push("실탄");

    shuffle(bullets, true);

    message = "어금니 사용: 실탄 1발이 추가되고 탄이 섞였습니다.";
    itemUseCount++;
  }

  else if (item === "립스틱") {
  rotateBulletsBack(1);

  message = "립스틱 사용: 탄의 순서를 뒤로 한 칸 미뤘습니다.";
  itemUseCount++;
  }

  else if (item === "주사위") {
    rotateBulletsBack(2);

    message = "주사위 사용: 탄의 순서를 뒤로 두 칸 미뤘습니다.";
    itemUseCount++;
  }

  else if (item === "다이아몬드") {
    let blankCount = 0;

    for (let b of bullets) {
      if (b === "공포탄") {
        blankCount++;
      }
    }

    bullets = [];

    for (let i = 0; i < blankCount; i++) {
      bullets.push("공포탄");
    }

    for (let i = 0; i < blankCount; i++) {
      bullets.push("실탄");
    }

    shuffle(bullets, true);

    message = "다이아몬드 사용: 실탄 개수가 공포탄 개수와 같아졌습니다. 아이템 사용 횟수를 모두 소모했습니다.";

    itemUseCount = maxItemUseCount;
  }

  items.splice(index, 1);
  makeButtons();
}

// ===============================
// 6. 입력 / 판정
// ===============================
function mousePressed() {
  // intro 또는 roundIntro 상태일 때 스킵 버튼 클릭 처리
  
    if (!bgmStarted) {
  userStartAudio();

  bgm.loop();
  rainSound.loop();

  bgmStarted = true;
  }
  
  if (gameState === "intro" || gameState === "roundIntro") {
    if (
      skipButton &&
      mouseX > skipButton.x &&
      mouseX < skipButton.x + skipButton.w &&
      mouseY > skipButton.y &&
      mouseY < skipButton.y + skipButton.h
    ) {
      if (gameState === "intro") {
        startRound(1);
      } else if (gameState === "roundIntro") {
        startPlayerTurn();
      }

      return;
    }
  }

  // 플레이어 턴이 아니면 아래 버튼들은 작동하지 않음
  if (gameState !== "playerTurn") return;

  for (let btn of buttons) {
    if (isMouseOver(btn)) {
      if (btn.type === "item") {
        useItem(btn.itemIndex);
      } else if (btn.type === "ready") {
        startShooting();
      }
      return;
    }
  }
}

function updateShooting() {
  if (shootingResolved) return;

  if (millis() - shootingStartTime > 2200) {
    shootingResolved = true;

    if (shootingResult === "실탄") {
      if (chocolateUsed && random(1) < 0.1) {
        bullets.shift();

        resultTitle = "기적적인 생존";
        resultText = "실탄이었지만...\n초콜렛의 효과로 살아남았습니다.";

        resultStartTime = millis();
        gameState = "shootingResult";
      } else {
        gunSound.play();
        gameState = "gameOver";
      }
    } else {
      bullets.shift();

      resultTitle = "생존";
      resultText = "공포탄이었습니다.\n당신은 이번 턴을 버텼습니다.";

      resultStartTime = millis();
      gameState = "shootingResult";
    }
  }
}

function updateShootingResult() {
  if (millis() - resultStartTime > 1800) {
    if (round === 1) {
      startRound(2);
    } else {
      gameState = "clear";
    }
  }
}

function keyPressed() {
  if (gameState === "gameOver" && key === " ") {
    startIntro();
  }

  if (gameState === "clear" && key === " ") {
    startIntro();
  }
}

// ===============================
// 7. 반응형
// ===============================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  hud = createGraphics(windowWidth, windowHeight);
  hud.textFont("monospace");

  if (gameState === "playerTurn") {
    makeButtons();
  }
}
