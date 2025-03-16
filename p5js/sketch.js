let buttonA, buttonB, buttonC, potSlider; // 버튼과 슬라이더 변수 선언
let buttonAState = false; // 버튼 A의 상태 (true = 눌림, false = 해제됨)
let buttonBState = false; // 버튼 B의 상태

let systemOn = true; // 시스템 온오프 상태 변수 (true = 켜짐, false = 꺼짐)

// LED 상태를 나타내는 상수 (시퀀스 단계)
const SEQ_R = 0; // 빨간색 LED 단계
const SEQ_Y = 1; // 노란색 LED 단계
const SEQ_G = 2; // 초록색 LED 단계
const SEQ_G_BLINK = 3; // 초록색 LED 깜빡이는 단계
const SEQ_Y2 = 4; // 다시 노란색 LED 단계
let seqState = SEQ_R; // 현재 LED 상태 (초기값: SEQ_R)

let stateStart = 0; // 현재 상태 시작 시간 저장 변수
let blinkTimer = 0; // 초록 LED 깜빡임 타이머 변수
let blinkOn = false; // 초록 LED 깜빡임 상태 변수
let lastBlinkB = 0; // 버튼 B로 인한 전체 LED 깜빡임 타이머 변수
let blinkAllState = false; // 버튼 B로 인한 LED 깜빡임 상태 변수

// 각 LED 상태 지속시간 (밀리초 단위)
const durationR = 2000; // 빨간색 LED 지속 시간 (2초)
const durationY = 500; // 노란색 LED 지속 시간 (0.5초)
const durationG = 2000; // 초록색 LED 지속 시간 (2초)
const durationG_Blink = 1000; // 초록 LED 깜빡이는 지속 시간 (1초)
const blinkInterval = durationG_Blink / 8; // 초록 LED 깜빡이는 주기 (약 125ms)
const blinkIntervalB = 200; // 버튼 B에 의해 전체 LED 깜빡이는 주기 (200ms)

function setup() {
  createCanvas(400, 400); // 캔버스 크기 설정 (400x400 픽셀)
  stateStart = millis(); // 초기 상태 시작 시간 설정

  // 버튼 A 생성 및 이벤트 리스너 설정
  buttonA = createButton('Button A');
  buttonA.position(420, 20);
  buttonA.mousePressed(() => { buttonAState = true; }); // 버튼을 누르면 상태 변경
  buttonA.mouseReleased(() => { buttonAState = false; }); // 버튼에서 손을 떼면 상태 변경

  // 버튼 B 생성 및 이벤트 리스너 설정
  buttonB = createButton('Button B');
  buttonB.position(420, 60);
  buttonB.mousePressed(() => { buttonBState = true; });
  buttonB.mouseReleased(() => { buttonBState = false; });

  // 버튼 C 생성 및 시스템 온오프 토글 기능 추가
  buttonC = createButton('Button C (Toggle System)');
  buttonC.position(420, 100);
  buttonC.mousePressed(toggleSystem); // 버튼을 누를 때마다 시스템 온오프 변경

  // 가변저항 역할을 하는 슬라이더 생성 (0 ~ 255 값 조절 가능)
  potSlider = createSlider(0, 255, 128);
  potSlider.position(420, 140);
}

// 시스템 온오프를 토글하는 함수
function toggleSystem() {
  systemOn = !systemOn; // 현재 상태의 반대로 변경
}

function draw() {
  background(220); // 배경을 회색(220)으로 설정
  let currentTime = millis(); // 현재 시간 가져오기
  let brightness = potSlider.value(); // 슬라이더 값 (0~255 범위)

  // LED 출력값 변수 (각 LED의 밝기 설정)
  let outR = 0, outY = 0, outG = 0;

  if (!systemOn) {
    // 시스템이 꺼져 있으면 모든 LED를 끔 (출력값 0 유지)
  } else if (buttonAState) {
    // 버튼 A가 눌려 있으면 빨간 LED만 켜짐
    outR = brightness;
  } else if (buttonBState) {
    // 버튼 B가 눌려 있으면 전체 LED가 200ms 간격으로 깜빡임
    if (currentTime - lastBlinkB >= blinkIntervalB) {
      lastBlinkB = currentTime;
      blinkAllState = !blinkAllState; // LED 상태 변경
    }
    let outVal = blinkAllState ? brightness : 0;
    outR = outVal; outY = outVal; outG = outVal; // 모든 LED 동일한 값 적용
  } else {
    // 기본 LED 시퀀스 동작 (빨강 -> 노랑 -> 초록 -> 깜빡임 -> 노랑 -> 반복)
    switch (seqState) {
      case SEQ_R:
        outR = brightness;
        if (currentTime - stateStart >= durationR) {
          seqState = SEQ_Y;
          stateStart = currentTime;
        }
        break;
      case SEQ_Y:
        outY = brightness;
        if (currentTime - stateStart >= durationY) {
          seqState = SEQ_G;
          stateStart = currentTime;
        }
        break;
      case SEQ_G:
        outG = brightness;
        if (currentTime - stateStart >= durationG) {
          seqState = SEQ_G_BLINK;
          stateStart = currentTime;
          blinkTimer = currentTime;
          blinkOn = false;
        }
        break;
      case SEQ_G_BLINK:
        if (currentTime - blinkTimer >= blinkInterval) {
          blinkTimer = currentTime;
          blinkOn = !blinkOn;
        }
        outG = blinkOn ? brightness : 0;
        if (currentTime - stateStart >= durationG_Blink) {
          seqState = SEQ_Y2;
          stateStart = currentTime;
        }
        break;
      case SEQ_Y2:
        outY = brightness;
        if (currentTime - stateStart >= durationY) {
          seqState = SEQ_R;
          stateStart = currentTime;
        }
        break;
    }
  }

  // LED를 원 형태로 표시 (알파 값 조절로 밝기 표현)
  fill(255, 0, 0, outR);
  ellipse(100, 100, 50, 50); // 빨간 LED
  fill(255, 255, 0, outY);
  ellipse(100, 200, 50, 50); // 노란 LED
  fill(0, 255, 0, outG);
  ellipse(100, 300, 50, 50); // 초록 LED

  // LED 라벨 표시
  fill(0);
  textSize(14);
  text("Red LED", 60, 95);
  text("Yellow LED", 60, 195);
  text("Green LED", 60, 295);

  // 시스템 상태 표시
  textSize(16);
  text("System " + (systemOn ? "ON" : "OFF"), 10, 20);
}
