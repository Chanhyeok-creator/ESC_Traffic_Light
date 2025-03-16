function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  background(220);


 

}

function draw() {
  r=random(255);
  g=random(255);
  b=random(255);
  fill(r,g,b,100);
  s= random(100)+50;
  circle(mouseX, mouseY, 20);

}
function keyPressed() {
  if(key==='F'||key==='f'){
    let fs=fullscreen();
    fullscreen(!fs);
  }
}