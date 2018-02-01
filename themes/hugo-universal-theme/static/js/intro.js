
var canvas = document.querySelector("#scene"),
  ctx = canvas.getContext("2d"),
  particles = [],
  amount = 0,
  mouse = {x:0,y:0},
  radius = 1;

var colors = ["#FFF"];

var logo = "data:image/png;base64,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"

var copy = document.querySelector("#copy");

var ww = canvas.width = window.innerWidth;
var wh = canvas.height = window.innerHeight;

function Particle(x,y){
  this.x =  Math.random()*ww;
  this.y =  Math.random()*wh;
  this.dest = {
    x : x,
    y: y
  };
  this.r =  Math.random()*5 + 2;
  this.vx = (Math.random()-0.5)*20;
  this.vy = (Math.random()-0.5)*20;
  this.accX = 0;
  this.accY = 0;
  this.friction = Math.random()*0.05 + 0.94;

  this.color = colors[Math.floor(Math.random()*6)];
}

Particle.prototype.render = function() {


  this.accX = (this.dest.x - this.x)/1000;
  this.accY = (this.dest.y - this.y)/1000;
  this.vx += this.accX;
  this.vy += this.accY;
  this.vx *= this.friction;
  this.vy *= this.friction;

  this.x += this.vx;
  this.y +=  this.vy;

  ctx.fillStyle = this.color;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.r, Math.PI * 2, false);
  ctx.fill();

  var a = this.x - mouse.x;
  var b = this.y - mouse.y;

  var distance = Math.sqrt( a*a + b*b );
  if(distance<(radius*70)){
    this.accX = (this.x - mouse.x)/100;
    this.accY = (this.y - mouse.y)/100;
    this.vx += this.accX;
    this.vy += this.accY;
  }

}

function onMouseMove(e){
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}

function onTouchMove(e){
  if(e.touches.length > 0 ){
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
  }
}

function onTouchEnd(e){
  mouse.x = -9999;
  mouse.y = -9999;
}

function initScene(){
  ww = canvas.width = window.innerWidth;
  wh = canvas.height = window.innerHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "bold "+(ww/10)+"px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(copy.value, ww/2, wh/2);

  var data  = ctx.getImageData(0, 0, ww, wh).data;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "screen";

  particles = [];
  for(var i=0;i<ww;i+=Math.round(ww/150)){
    for(var j=0;j<wh;j+=Math.round(ww/150)){
      if(data[ ((i + j*ww)*4) + 3] > 150){
        particles.push(new Particle(i,j));
      }
    }
  }
  amount = particles.length;

}

function onMouseClick(){
  radius++;
  if(radius ===5){
    radius = 0;
  }
}

function render(a) {
  requestAnimationFrame(render);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < amount; i++) {
    particles[i].render();
  }
};

copy.addEventListener("keyup", initScene);
window.addEventListener("resize", initScene);
window.addEventListener("mousemove", onMouseMove);
window.addEventListener("touchmove", onTouchMove);
window.addEventListener("click", onMouseClick);
window.addEventListener("touchend", onTouchEnd);
initScene();
requestAnimationFrame(render);

