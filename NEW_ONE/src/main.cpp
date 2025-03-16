#include <Arduino.h>

// LED 시퀀스 상태 정의
enum SequenceState {
  SEQ_R,       // 빨간 LED 2초 켜기
  SEQ_Y,       // 노란 LED 0.5초 켜기
  SEQ_G,       // 초록 LED 2초 켜기
  SEQ_G_BLINK, // 초록 LED 1초 동안 깜빡임 (8 인터벌: 약 125ms씩, 4회 깜빡임)
  SEQ_Y2       // 노란 LED 0.5초 켜기
};

SequenceState seqState = SEQ_R;
unsigned long stateStart = 0;  // 각 상태 시작 시간
unsigned long blinkTimer = 0;  // 초록 LED 깜빡임 인터벌 타이머
bool blinkOn = false;          // 초록 LED 깜빡임 상태 변수

// 각 상태의 지속 시간 (밀리초 단위)
const unsigned long durationR = 2000;
const unsigned long durationY = 500;
const unsigned long durationG = 2000;
const unsigned long durationG_Blink = 1000; // 총 1초 동안 깜빡임
const unsigned long blinkInterval = durationG_Blink / 8;  // 8 인터벌 (약 125ms씩)

// B 버튼 깜빡임을 위한 변수
unsigned long lastBlinkB = 0;
bool blinkAllState = false;
const unsigned long blinkIntervalB = 200; // B 버튼 깜빡임 간격 (200ms)

// 핀 번호 설정
const int buttonA = 2;
const int buttonB = 3;
const int buttonC = 4;

// PWM 기능이 지원되는 핀으로 변경 (예: R LED -> 11번 핀)
const int ledR = 11;   // 빨간 LED (PWM 지원)
const int ledY = 9;    // 노란 LED (PWM 지원)
const int ledG = 10;   // 초록 LED (PWM 지원)

const int potPin = A0; // 가변저항 핀

// C 버튼에 의한 전체 시스템 ON/OFF 상태
bool systemOn = true;
int lastCState = HIGH; // C 버튼 이전 상태

void setup() {
  // 버튼은 내부 풀업 사용: 미눌림은 HIGH, 눌림은 LOW
  pinMode(buttonA, INPUT_PULLUP);
  pinMode(buttonB, INPUT_PULLUP);
  pinMode(buttonC, INPUT_PULLUP);
  
  // LED 출력 설정
  pinMode(ledR, OUTPUT);
  pinMode(ledY, OUTPUT);
  pinMode(ledG, OUTPUT);
  
  Serial.begin(9600);
  stateStart = millis();
}

void loop() {
  unsigned long currentTime = millis();

  // 가변저항 값 읽기 및 밝기 변환 (0~1023 → 0~255)
  int potValue = analogRead(potPin);
  int brightness = map(potValue, 0, 1023, 0, 255);

  // C 버튼 체크: 상승 에지 감지하여 시스템 ON/OFF 토글 (디바운스 처리)
  int cState = digitalRead(buttonC);
  if (lastCState == HIGH && cState == LOW) {
    systemOn = !systemOn;
    delay(50);  // 간단한 디바운스
  }
  lastCState = cState;
  
  // 시스템 OFF 상태면 모든 LED 끔
  if (!systemOn) {
    analogWrite(ledR, 0);
    analogWrite(ledY, 0);
    analogWrite(ledG, 0);
    return;
  }
  
  // 우선순위: A 버튼이 눌리면 LED 시퀀스를 무시하고 빨간 LED만 밝기 적용해서 켬
  if (digitalRead(buttonA) == LOW) {
    analogWrite(ledR, brightness);
    analogWrite(ledY, 0);
    analogWrite(ledG, 0);
    return;
  }
  
  // B 버튼이 눌리면 모든 LED가 깜빡이는 상태로 전환
  if (digitalRead(buttonB) == LOW) {
    if (currentTime - lastBlinkB >= blinkIntervalB) {
      lastBlinkB = currentTime;
      blinkAllState = !blinkAllState;
      int outVal = blinkAllState ? brightness : 0;
      analogWrite(ledR, outVal);
      analogWrite(ledY, outVal);
      analogWrite(ledG, outVal);
    }
    return;
  }
  
  // 기본 LED 시퀀스 (버튼들이 눌리지 않았을 때)
  switch (seqState) {
    case SEQ_R:
      // 빨간 LED 켜기
      analogWrite(ledR, brightness);
      analogWrite(ledY, 0);
      analogWrite(ledG, 0);
      if (currentTime - stateStart >= durationR) {
        seqState = SEQ_Y;
        stateStart = currentTime;
      }
      break;
      
    case SEQ_Y:
      // 노란 LED 켜기
      analogWrite(ledR, 0);
      analogWrite(ledY, brightness);
      analogWrite(ledG, 0);
      if (currentTime - stateStart >= durationY) {
        seqState = SEQ_G;
        stateStart = currentTime;
      }
      break;
      
    case SEQ_G:
      // 초록 LED 켜기
      analogWrite(ledR, 0);
      analogWrite(ledY, 0);
      analogWrite(ledG, brightness);
      if (currentTime - stateStart >= durationG) {
        seqState = SEQ_G_BLINK;
        stateStart = currentTime;
        blinkTimer = currentTime;
        blinkOn = false;
      }
      break;
      
    case SEQ_G_BLINK:
      // 초록 LED 깜빡임 (총 1초 동안, 8 인터벌: 4회 깜빡임)
      if (currentTime - blinkTimer >= blinkInterval) {
        blinkTimer = currentTime;
        blinkOn = !blinkOn;
        analogWrite(ledG, blinkOn ? brightness : 0);
      }
      // 다른 LED는 OFF 상태 유지
      analogWrite(ledR, 0);
      analogWrite(ledY, 0);
      if (currentTime - stateStart >= durationG_Blink) {
        seqState = SEQ_Y2;
        stateStart = currentTime;
      }
      break;
      
    case SEQ_Y2:
      // 노란 LED 켜기
      analogWrite(ledR, 0);
      analogWrite(ledY, brightness);
      analogWrite(ledG, 0);
      if (currentTime - stateStart >= durationY) {
        // 시퀀스 초기 상태로 복귀
        seqState = SEQ_R;
        stateStart = currentTime;
      }
      break;
  }
}