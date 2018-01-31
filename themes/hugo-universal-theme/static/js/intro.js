var animateStart = true;
var lastVertices = null;
var global = this;

var camera = {
  focus : 400,
  self : {
    x : 0,
    y : 0,
    z : 0
  },
  rotate : {
    x : 0,
    y : 0,
    z : 0
  },
  up : {
    x : 0,
    y : 1,
    z : 0
  },
  zoom : 1,
  display : {
    x : window.innerWidth/2,
    y : window.innerHeight/2,
    z : 0
  }
};
var affine = {
  world : {
    size : function(p, size) {
      return {
        x :	p.x * size.x,
        y : p.y * size.y,
        z : p.z * size.z
      }
    },
    rotate: {
      x : function(p, rotate) {
        return {
          x : p.x,
          y : p.y*Math.cos(dtr(rotate.x)) - p.z*Math.sin(dtr(rotate.x)),
          z : p.y*Math.sin(dtr(rotate.x)) + p.z*Math.cos(dtr(rotate.x))
        }
      },
      y : function(p, rotate) {
        return {
          x : p.x*Math.cos(dtr(rotate.y)) + p.z*Math.sin(dtr(rotate.y)),
          y : p.y,
          z : -p.x*Math.sin(dtr(rotate.y)) + p.z*Math.cos(dtr(rotate.y))
        }
      },
      z : function(p, rotate) {
        return {
          x : p.x*Math.cos(dtr(rotate.z)) - p.y*Math.sin(dtr(rotate.z)),
          y : p.x*Math.sin(dtr(rotate.z)) + p.y*Math.cos(dtr(rotate.z)),
          z : p.z
        }
      }
    },
    position : function(p, position) {
      return {
        x : p.x + position.x,
        y : p.y + position.y,
        z : p.z + position.z
      }
    },
  },
  view : {
    point : function(p) {
      return {
        x : p.x - camera.self.x,
        y : p.y - camera.self.y,
        z : p.z - camera.self.z
      }
    },
    x : function(p) {
      return {
        x : p.x,
        y : p.y*Math.cos(dtr(camera.rotate.x)) - p.z*Math.sin(dtr(camera.rotate.x)),
        z : p.y*Math.sin(dtr(camera.rotate.x)) + p.z*Math.cos(dtr(camera.rotate.x))
      }
    },
    y : function(p) {
      return {
        x : p.x*Math.cos(dtr(camera.rotate.y)) + p.z*Math.sin(dtr(camera.rotate.y)),
        y : p.y,
        z : p.x*-Math.sin(dtr(camera.rotate.y)) + p.z*Math.cos(dtr(camera.rotate.y))
      }
    },
    viewReset : function(p) {
      return {
        x : p.x - camera.self.x,
        y : p.y - camera.self.y,
        z : p.z - camera.self.z
      }
    },
    righthandedReversal : function(p) {
      return {
        x : p.x,
        y : -p.y,
        z : p.z,
      }
    }
  },
  perspective : function(p) {
    return {
      x : p.x * ((camera.focus-camera.self.z) / ((camera.focus-camera.self.z) - p.z)) * camera.zoom,
      y : p.y * ((camera.focus-camera.self.z) / ((camera.focus-camera.self.z) - p.z)) * camera.zoom,
      z : p.z * ((camera.focus-camera.self.z) / ((camera.focus-camera.self.z) - p.z)) * camera.zoom,
      p : ((camera.focus-camera.self.z) / ((camera.focus-camera.self.z) - p.z)) * camera.zoom,
    }
  },
  display : function(p, display) {
    return {
      x : p.x + display.x,
      y : p.y + display.y,
      z : p.z + display.z,
      p : p.p,
    }
  },
  process : function(model, size, rotate, position,display) {
    var ret = affine.world.size(model, size);
    ret = affine.world.rotate.x(ret, rotate);
    ret = affine.world.rotate.y(ret, rotate);
    ret = affine.world.rotate.z(ret, rotate);
    ret = affine.world.position(ret, position);
    ret = affine.view.point(ret);
    ret = affine.view.x(ret);
    ret = affine.view.y(ret);
    ret = affine.view.viewReset(ret);
    ret = affine.view.righthandedReversal(ret);
    ret = affine.perspective(ret);
    ret = affine.display(ret, display);
    return ret;
  }
};



var vertex3d = function(param) {
  this.affineIn = new Object;
  this.affineOut = new Object;
  if(param.vertex !== undefined) {
    this.affineIn.vertex = param.vertex;
  } else {
    this.affineIn.vertex = {x:0,y:0,z:0};
  };
  if(param.size !== undefined) {
    this.affineIn.size = param.size;
  } else {
    this.affineIn.size = {x:1,y:1,z:1};
  };
  if(param.rotate !== undefined) {
    this.affineIn.rotate = param.rotate;
  } else {
    this.affineIn.rotate = {x:0,y:0,z:0};
  };
  if(param.position !== undefined) {
    this.affineIn.position = param.position;
  } else {
    this.affineIn.position = {x:0,y:0,z:0};
  };
};
vertex3d.prototype = {
  vertexUpdate : function() {
    this.affineOut = affine.process(
      this.affineIn.vertex,
      this.affineIn.size,
      this.affineIn.rotate,
      this.affineIn.position,
      camera.display
    );
  }
};

var dtr = function(v) {return v * Math.PI/180;};
//cordinate system transformation.
//polar to rectangle.
var polarToRectangle =  function(dX, dY, radius) {
  var x = Math.sin(dtr(dX)) * Math.cos(dtr(dY)) * radius;
  var y = Math.sin(dtr(dX)) * Math.sin(dtr(dY)) * radius;
  var z = Math.cos(dtr(dX)) * radius;
  return {x:y, y:z, z:x};
};
//rectangle to polar.
var rectangleToPolar = function(x, y, z) {
  if(x == 0)	var xD = 0.001;
  else		var xD = x;
  if(y == 0)	var yD = 0.001;
  else		var yD = y;
  if(z == 0)	var zD = 0.001;
  else		var zD = z;
  var radius = Math.sqrt(xD*xD + yD*yD + zD*zD);
  var theta = Math.atan(zD / Math.sqrt(xD*xD + yD*yD));
  var phi = Math.atan(yD / xD);
  return {x:theta*(180/Math.PI), y:phi*(180/Math.PI), r:radius};
};
var closeValue = function(minTime, maxTime) {
  this.flag = 0;
  this.progress = 0;
  this.startTime = 0;
  this.durationTime = 0;
  this.fromValue = 0;
  this.toValue = 0;
  this.minValue = 0;
  this.maxValue = 1;
  this.minDuration = minTime;
  this.maxDuration = maxTime;
};
closeValue.prototype = {
  init : function() {
    this.durationTime = this.minDuration + (this.maxDuration-this.minDuration) * Math.random();
    this.startTime = Date.now();
    this.progress = Math.min(1, ((Date.now()-this.startTime)/this.durationTime))
    this.fromValue = this.toValue;
    this.toValue = this.minValue + this.maxValue * Math.random();
    this.flag = 1;
    return this.fromValue + (this.toValue - this.fromValue) * this.progress;
  },
  update : function() {
    this.progress = Math.min(1, ((Date.now()-this.startTime)/this.durationTime));
    if(this.progress== 1) this.flag = 0;
    return this.fromValue + (this.toValue - this.fromValue) * this.progress;
  },
  execution : function() {
    if(this.flag == 0)		{return this.init()}
    else if(this.flag == 1)	{return this.update()};
  }
};

var strokeColor = "rgba(255,255,255,0.1)";
var backgroundColor = "rgba(0,0,0,1)";
var vibrateFlag = false;

var canvas = document.getElementById("canvas");
var canvasWidth = window.innerWidth;
var canvasHeight = window.innerHeight;
canvas.width = canvasWidth;
canvas.height = canvasHeight;
var ctx	= canvas.getContext("2d");
ctx.strokeStyle = strokeColor;

window.onresize = function() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  camera.display.x = window.innerWidth/2;
  camera.display.y = window.innerHeight/2;
};


/* class */
var	sphere = function(arg) {
  this.flag = true;
  this.type = "_";
  this.particleNum = arg.particleNum;
  this.center = {x:0, y:0, z:0};
  this.targetCenter = arg.center;
  this.radius = 0;
  this.targetRadius = arg.radius;

  this.degree = new Array();
  this.freeDegreeSpeed = new Array();
  for(var j=0; j<this.particleNum; j++) {
    this.degree[j] = {theta:0, phi:0};
    this.freeDegreeSpeed[j] = {theta:1*Math.random()-0.5, phi:1*Math.random()-0.5};
  };
  this.charsMap = new Object();
  for(var i in chars) {
    var buffer = document.getElementById(i).getContext("2d").getImageData(0, 0, 100, 100).data;
    this.charsMap[i] = new Array();
    var self = this;
    for(var j=0; j<this.particleNum; j++) {
      var redo = function() {
        var theta = Math.floor(Math.random()*100);
        var phi = Math.floor(Math.random()*100);
        if(buffer[(theta*400+(phi*4))] == 0) {
          self.charsMap[i].push(
            {
              theta:theta-50 + 360 * Math.round(Math.random()*2)-1,
              phi:phi-50 + 360 * Math.round(Math.random()*2)-1
            }
          );
        } else {
          redo();
        };
      };
      redo();
    };
  };
  this.charsMap["@"] = new Array();
  for(var i=0; i<this.particleNum; i++) {
    this.charsMap["@"][i] = {theta:360*Math.random(), phi:360*Math.random()};
  };
  this.charsMap["_"] = new Array();
  for(var i=0; i<this.particleNum; i++) {
    this.charsMap["_"][i] = {theta:0, phi:0};
  };

  this.veticies = new Array();
  for(var i=0; i<this.particleNum; i++) {
    this.veticies[i] = new vertex3d({});
  };
};
sphere.prototype = {
  update : function() {
    for(var i=0; i<this.charsMap[this.type].length; i++) {
      if(this.degree[i].theta >= 30 && this.degree[i].phi >= 30) {
        this.flag = true;
        break;
      } else {
        this.flag = false;
      };
    };
    this.radius =  this.radius + (this.targetRadius - this.radius) / 8;
    this.center.x = this.center.x + (this.targetCenter.x - this.center.x) / 8;
    this.center.y = this.center.y + (this.targetCenter.y - this.center.y) / 8;
    this.center.z = this.center.z + (this.targetCenter.z - this.center.z) / 8;
    for(var i=0; i<this.charsMap[this.type].length; i++) {
      if(this.type === "@") {
        this.charsMap[this.type][i].theta += this.freeDegreeSpeed[i].theta;
        this.charsMap[this.type][i].phi += this.freeDegreeSpeed[i].phi;
      };
      this.degree[i].theta =this.degree[i].theta + (this.charsMap[this.type][i].theta-this.degree[i].theta)/(4+20*Math.random());
      this.degree[i].phi = this.degree[i].phi + (this.charsMap[this.type][i].phi-this.degree[i].phi)/(4+20*Math.random());
      if(vibrateFlag == true) {
        var getPosition = polarToRectangle(this.degree[i].theta+90, this.degree[i].phi, this.radius+Math.random()*10);
      } else {
        var getPosition = polarToRectangle(this.degree[i].theta+90, this.degree[i].phi, this.radius);
      };
      this.veticies[i].affineIn.vertex = {
        x:getPosition.x,
        y:getPosition.y,
        z:getPosition.z
      };
      this.center.x
      this.veticies[i].affineIn.position = {
        x:this.center.x,
        y:this.center.y,
        z:this.center.z
      };
      this.veticies[i].vertexUpdate();
    };
  },
  draw : function() {
    if(this.flag == true) {
      ctx.beginPath();
      for(var i=0; i<this.veticies.length; i++) {
        for(var j=i; j<this.veticies.length; j++) {

          var distance =
            (this.veticies[i].affineOut.x-this.veticies[j].affineOut.x)*(this.veticies[i].affineOut.x-this.veticies[j].affineOut.x) +
            (this.veticies[i].affineOut.y-this.veticies[j].affineOut.y)*(this.veticies[i].affineOut.y-this.veticies[j].affineOut.y);

          if(distance <= this.radius*3) {
            ctx.moveTo(
              this.veticies[i].affineOut.x,
              this.veticies[i].affineOut.y
            );
            ctx.lineTo(
              this.veticies[j].affineOut.x,
              this.veticies[j].affineOut.y
            );
          };
        };
      };
      global.lastVertices = this.veticies;
      ctx.closePath();
      ctx.stroke();
    };
  }
};
/* class */
var sphereNum = 20;
var s = new Array();
/*-----------------------------------------------------*/
var setup = function() {
  for(var i=0; i<sphereNum; i++) {
    s[i] = new sphere({radius:100, particleNum:300, center:{x:70*i - (sphereNum-1)*70/2,y:0,z:0}});
  };
};
/*-----------------------------------------------------*/
var update = function() {
  for(var i=0; i<sphereNum; i++) {
    s[i].update();
  };
};
/*-----------------------------------------------------*/
var draw = function() {
  for(var i=0; i<sphereNum; i++) {
    s[i].draw();
  };
};


var chars = {
  A : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAoVJREFUeNrsnO2RgkAQRGXrEsAQMAQJgVwMwRgMwVg0BA1BQpAQOErrPsrjdgfKnR3gzW/h5NE99M7iZW3brihZORAAC1jAAhawgAUCYAELWMACFrBAACxgAQtYwAIWCIAFLGABa0DtdrtMXGVZJvyqWfJ9w81mU9e1/PP3+z3P8yUqq2maQaS6ul6vC7Xh+XweeshyYQ2VFcqKfshMGnz3gBtx1O12K4piWcoabahU4pokrBGdbrmwUvV4o7C2221VVdjwJ456YOWPsta2nE0PdrLqxGXNiR82YQVXf8uC5fdRMEYlgZUslK7X665teUYLz8+YGj+k6VldUPKQyr/KWjR1Bj343do96SFJNE2mLEnD8nculAWsgc8yISz9Z6KzJqvfjKylLWdNVvIGD6xX6/nFBayiV2X/ncqT1yYPq36Ufwltdt3jTMnK+CLRHKwX3wFrACxTK0TtqUNw7+vv9wkeorYzpqqsoAp6g1UQhJq4nCkP9pouCEtt/KAKK3hVvanKH7U0e7wtG/aKyFCPb7XqOSmOVKfTSeESnB1ZaWZd6zaM2obnBmsGytILpeNexZKXws6YkrIU7rzCM3E+sBSiKcqy17PKslTgFftaNGA1TeN/a+EZ0/f7vecMh8Mh+Icul0twbWQ9wXfxOvg1qqryn0RyLcfjcfIJXmLA4GhBIpnYTteAJWm9wHqnsiSz0Ng7Y9Fh+V/Fks9hhJ07qricBQ+uBDv1win7tGFJgrVkTbcIWBJlCS0WVF/sHB8dluRWC2FJxDXip7FWYAnvs3C0InRiPHFl/CNqc1MHYAGLAhawgAUsYAGLAhawgAUsYAGLAhawgAUsYAGLAtZb6lOAAQB0jf7CahauSAAAAABJRU5ErkJggg==",
  B : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAoJJREFUeNrs3O1xolAUxvFNhgZswRa0BCmBFrAEKAFK0BKkBC0BS9AStAT2ybLjMPvFo0tOuJf/+ZAxMzAJv7n38tyX5KPrul+UrT4hAAsssMACCywIwAILLLDAAgsCsMACCyywwIIALLDACqgSnx+TpunpdHrjxsVisVqt+q/L5XKz2ejzj2l1LqWHHOsXzrJst9t1P1HhYfWlVnY8Hp2xQh2zrterunZZlgzw1qrrervdgmWt/Z8Cy1rqjPf7HSxTScqncUUSSn2wkuk8cJ88+8/n8/mlnqWXo2553B4/lh5V0WnYuZqmUZORguV2B6zpdkM1tDzP27Y1EjiM8QGMWUVRsOrwQve0XPbeRD02LE0DaVkj1+hz9SCxfNJ5JFjG6PDduQGsuLDUB+u6fnpZlmUOy83JZI3UoJQGlOAtY5bi67zmhtJJ07RnevU96PAq/KpA1+CHs6Lb7cYavElKc2+3zbGAsdRaL5eLw0sweCwZHQ4H5w3XULH0Eliv1w6T50i6Yb91aElhYP2tsizdtg5jWHVQcPVpX5Es0ah9qVfOCEtR4BH/lAkUoIqisK/8eTSu6ST4IdajlM6N8z7FiLkneBFUVWVpX29MKiMcs+SVZZlxrYIB3rq+TsuaUIEFFlhgWdcYwBoZ67s3+sPYN2yaBqznIXO/36dparx+Rif/+q2w4bcvJXJjyo8ESzT/s0zMKZrx549gfR2ldNjpiQFL47rPudPPCKSGB8LBeiLF9v3zEb2qqrZtPTelk+CYFNPzPNe7z/8UcxJEI3r8TbnClOdJkH/qg39EPbucBRZYYIFFgQUWWGCBBRYFFlhggQUWWBRYYIEFFlgzqd8CDAAuDkL9BnlXDAAAAABJRU5ErkJggg==",
  C : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAn9JREFUeNrsnO2RgkAMhs8bG6AFLEFLoAVaoAVb0BKwBCgBSvBK8ErQErgczDg3fjA5YcOyPu/PG5fbPCZLCImLpmk+kE6fIAAWsIAFLGABCwTAAhawgAUsYIEAWMACFrCABSwQAMuJll7t5rvVzR/X63UURcD6VVmWdV1/ter5WJIkQi1pNdlem4l0Pp93u90LLhPHsSyU5fZ7ngZWnucDI0uWF0URPqwsy8YKC7lUyLBGJGXPyxSWBI6LY1eOsNBgyZHsLgM4nU4GJtglpYfD4XK5OLr4fr83MGFh1kWzWq3uE84R5dRzTZNSSTiVpMTgNE0lmeoSevFHfXI7+t1jGliSo2s+Jjl6VVV/HUTs32w2ykelQDJ45TPKw3NabnaatfIvArkbdmH1mrVC0JMv3uhuqImRZ94noCU836WeNTxj8KREYwGrv/aiPPiplOJZ1OCRdzX4njCcspo8L1hZK8KQMwtYCFjAAhawgAUsBCxgAQtYwBpbdV0vFFK+ncSz8CxgAcut3PUqBQjLoumDMJwfLE/eJ88D1vD3ycMbAOYUhhpePae4vhcuBFgaM8qyfMhL2bkbtXJrhk0zm7J7734C4Hg8KhGkaeraiqU/ntU5kUScmN0B+lcDrsX7fbOhAU2n5JAz0WBOzC7PctqssN1uLXq4AhhHsXErU88Sk+T7d3HloiiMWgONR+jk8B53/3meBztvKPEyYupoSWqysd/h8SjEJQV7ixlpUVVVr2VGssrYoa6yG6F7Vqi6/lRBzzNNN2Qhug6MTaKJYd08SN9XF+JWnuzQI1jUs4AFLAQsYAELWMACFgIWsIAFLGABCwELWMACFrDeVT8CDACBApVLFWwP8gAAAABJRU5ErkJggg==",
  D : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAdVJREFUeNrs3GGNg0AQhuG2qQEsnIWzABKwABKwABJAAkgAC1g4CSCBm0COH702Gch1bmHf70dDmpLSJ7PLkOz2Ok3ThehygwAssMACCyywIAALLLDAAgssCMACCyywwAILArDAAutAudt8TRRFXddtPetjznrwOScIgpNj7cvXnIc34zgOwzBJkn+4oMkk8vP+9rKl0MqynGxzVKy1yoZhMMM69gTfNI3MhuM4cjdUpe/7NE3B2lBfO261/vZZVVWBtaG4DGYut7DCn+w412AkutWUtm27HkulSL3I+JIpXNnB+tWU/j5R2ih5xFFWpe99ljwJ5nmu+aR3c9arktE8PCtH6/nvhsqRCJZDAQsssMACCywCFlhggQUWWAQssMACCyywCFhg+Yz1prVwVJb3WDbLr6gsKgusV2mahsrSpigKzccM1kPcHB99URQpl8csG1feGrdW/gnNeixGm5ZcGVTW3bVScrlxPUnrsGwYA0uVLMu4G2oHYBzHYKkGYF3X9FkqqbZtzfa2HhhL5ilLqYvj236fRnRkhhIpgy70eFiis+wjl1cBspnLn+bKH1F712eBBRZYYBGwwAILLLDAImCBBRZYYIFFwAILLLDA8iTfAgwAhov2vlCJPZsAAAAASUVORK5CYII=",
  E : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNrs3MENwiAUgGExLsAsrNA3U1foTrBTR6gmJp56kINVy/efPTRf+ghI0rRt20XvdUUACxYsWLBgIYAFCxYsWLAQwIIFCxYsWAhgwYIFa7+ISB+otebNMoawYAkWLFiwYA3S7QefaZqmrt/nnMfFqrUaQ2sWLMGCBQsWLDv479b1n/pj+15KGRcrIrrORoft+I0hLFiwYMESLFiwHHd2Wpal67gzNNY8z8bQmgVLsGDBggULlmCd8bjTdbvzOk4ecCH29/eGz9Z1NYbWLFiwBAsWLFiwRij5ELU3CxYsWLBgIYAFCxYsWLAQwIIFCxYsWAhgwYIF65zdBRgAB2kfVa0J2mAAAAAASUVORK5CYII=",
  F : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAPJJREFUeNrs3MENgyAAQNHSuICzsAI7sQLM4gquwEyUATjooba1758xwRchGBND7/2hYz0RwIIFCxYsWAhgwYIFCxYsBLBgwYIFCxYCWLBgwZpXaw3vad93T5ZlCAuWYMGCBQvWP7R84ZxijOu6nrrk7Pj7YJVSUkqWoT0LlmDBggULlhP8B9u2rbV2fHzO+aKZ9QsbR/OfvgXL0J4FCxYsWIIFC5bXnUnjoB9jhHWoIeWDhT0LlmDBggULFizBggULFixYggULFixYsDQt+BG1JwsWLFiwYCGABQsWLFiwEMCCBQsWLFgIYMGCBeuevQQYAD9w7XiTuE79AAAAAElFTkSuQmCC",
  G : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAm9JREFUeNrs3NGRgjAQgGG9uQZsgRawBCzBFmjBFmxBWrAEKEFK0BK0BG5PZhxGJ7qibEL498nzToZ8kmQJm5s3TTMjdPEDAVhggQUWWGBBABZYYIEFFlgQgAUWWGCBBRYEYA0Sv0GdTVVVd+8sFos0TcH6j9PptN/v67oWpsvl4vqzJEnSa6zXa3nt7XQbT1GWZZZlPU5YPiWf9XLOHrDO57NcIB9+x0Imx4kc63A4fKsfyXAmR4sW63g8Sgu/OIYYe5li9RukXnqZ9Uc7rN1uN9Acled5bFiDTvnSwQ2aYJTBSzIlKdVwxy+KIp6k9DE1d0WbebavJVkVZeWXsd1uI0lKlZOgjGu9RzqDnmiBJbP7J+O0MoM1SOstxqwnN313SbmrY2o+Ln02hiUaZTNcKOGsOgS0nuVzOSGaxT+urPduaMBiDZ41eO8hOVQI88M4sIZY26EbggUWWMyGPkLuvd+9MTZ4dh0olkitVqt3Z0xNhkE3ZMwCCyywCLDAAosMXhlJknSfMBdFMejT/9FjbTab249VVYWARTcECyywwALLY+hr4UaPpXyi5xIJIWmww1IWK7gqIpWVkhZhVBSti8cyybIsldZZlg3dirnN//xbLpf6krYeBbgzkzV4o9sdab8Sq77GpGfDz7eBTQhLJsQ8z8HSRncVYaRXqB3W3RJVj5Ah3PPlabw5s3dr261yEh5TBw/bfnv0x+4mzGlhtammvqpRFLr7clzVH9Fi3cikV7rU5GqS3/raaO8zg38ejwVGcvmEU/5+iyCwyLPAAosACyywwAILLAIssMACCyywCLDAAgsssKYdfwIMALX7wq9Z+viIAAAAAElFTkSuQmCC",
  H : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAOZJREFUeNrs3MEJwyAYgNEYOlp3cgZ3chZXMeKltFTwUiPlfdefhOShhxCSUGs9NNeJABYsWLBgwUIACxYsWLBgIYAFCxYsWLAQwIIFC9ZnYaKU0ujwNpo5g5VlG8KCJViwYMGCBUuwYMGCBQuWYMGCtVGPfS6llJJzHo12uMKw5tudBW8TWr++F9sQFixYsGAJFixYHndePXtfR7kH6w0rxjia7oBlG8KCBQsWLMGCBQsWLFiCBQsWLFiwBAsWrNsLfkRtZcGCBQsWLASwYMGCBQsWAliwYMGCBQsBLFiwYP1nlwADAIgVIg41FpPaAAAAAElFTkSuQmCC",
  I : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAKtJREFUeNrs3LERACAIBEGx/5LoDS0BAhNnLyba+ZioqqVeGwEsWLBgwYKFABYsWLBgwUIACxYsWLBgIYAFCxasWZkZje4ZLMuCBUuwYMGCBQuWYMGCBQsWLMGCBQsWLFiCBQsWLFiwBAsWLFiwYAkWLFiwYMESLFiwYMGCJViwYMGCBUuwHhQeUVsWLFiwYMFCAAsWLFiwYCGABQsWLFiwEMCCBQvWnx0BBgCIewtNidNjyQAAAABJRU5ErkJggg==",
  J : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAXdJREFUeNrs3NFtglAUgGHpBq6gI7gCjuAKzgIrOAsj4Ag6go5we6JpY5pqtJh7xX7/kz6I+nm4QGKoUkoT3dcHAliwYMGCBQsBLFiwYMGChQAWLFiwYMFCAAsWLFhD67quuqO2bWGZLFiwBAsWLFiwYAkWLFiwYMESLFiwYMGCJViwYMGCBUuwYMGCBQuWYI0Iq23bG/8OXS6XsEwWLMGC9dV0OoV1b7PZ7D2xMk/BuLFuT8F2uz0ej5dPX/AHqLLd82+/38/n89ua6/U6HoTaZrO5tLtW7hsWpow9d4lZLBYpb1kX+LquX3ZrLzdZfd8/8ZPvdrvMkzXJ/H6r1eopUrG6pezlxopxGH4Ii7XvcDi8P9Z5ZxziFa+NLaQSTYq8a3zbvx0ZC0oVw4piP2qa5qERi3WqyN73Xb6T0l87n392p66NUn0qjgzFL5gKY/04xY8Kn0mNBcuFNCxYggULFixYsAQLFixYsGAJFixYsGD91z4FGAAFxpwXRUjPAQAAAABJRU5ErkJggg==",
  K : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAkVJREFUeNrs3NFtwkAQhGEcpQG3ACW4hVACLdCCa6AFWqAFWnAJUAKU4GzgBREJDw+s5+x/n08o+jS37J1Nqr7vF5RWXxCABRZYYIEFFgRggQUWWGCBBQFYYIEFFlhgQQAWWGCB9Vzr9boaqljz4hNWq1Ul1PV6nXuyDofD+XweXLbdbuu6njvWfr9XlrVtO/eeFZk6Ho9KrJbL5dyxdrudQ6wKwIqGrezBhFgVgGXSraaDlRMrd6yQUiaGzWbDBP83Xg2u+bnV3LG6rlMmhpxu5Y6ldKvMWPliRatSsDJj5Yvl1q2ssZSpPTlWplixAQdvWpqmSY6VL5YyiOb/YXZYMS7E0PB6TczrYKmtPb9bOWIpE8NYsbLDMpytHuvbKla23coRyzlWi7KeG9Z1nXYbUzzWR58JTg1rId8ygwXW+18Cyo0gWOOHqzws8b0HsN44P4I18k4sEiu24SjhKvXNP7Dc27wjlngAHCFcfUrpDxfitHy5XJQXPWJNn1t2yWrbNryUSyvxQexkk3WPVaw/nU7K+vjY+SbrHqv7FlN845yY2eaNsALo8SJUbPOZO9EL6+k7UXmpfaZY//uXEi7xDd3pD6Xi10LawGWNFclSBq60Nu9+3BHbvPjDgoljiY9UYycmPPtxx4pt2DSN0uYTOlcBtw5iuBK+EwvAEttWd6u5Y4nn6oRwlXH5pw9c/OxXPfp8us0Xc63ssBMr/hH1BJMFFlhgUWCBBRZYYIFFgQUWWGCBBRYFFlhggQUWWFTUrwADAHFImBJfDWY7AAAAAElFTkSuQmCC",
  L : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAMdJREFUeNrs3LENgCAQQFExLsAsLMcINxQrMBPaGxNKgu/XV5CXg5I0xjg014kAFixYsGDBQgALFixYsGAhgAULFixYsBDAggUL1mettTTRMwbLZsESLFiwYMGCJViwYMGCBUuwYMGCBQuWYMGCBQsWLMGCBQsWLFiCBQsWLFiwBAsWrAW71jxWrTXnPDlcSomI/2L13l1DbxYswYIFCxYsWHqXfERts2DBggULFgJYsGDBggULASxYsGDBgoUAFixYsPbsFmAAfSARhDW4TnEAAAAASUVORK5CYII=",
  M : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAj9JREFUeNrs3P+NgkAQhmEx14At2IIt0Jw90QItXAuW4G3OxBDgPmc53Rl23/0bSXgy8+3wI3b3+/3Asq0jBGCBBRZYYIEFAVhggQUWWGBBABZYYIEFFlgQgAUWWO1iXa/XLn+lX1lOPgzD506+m8oax/GNh1XehmBlrO/fBdbbissI2gTWSwj3sgqElXa6f2rShhmaDWHdbjddO2BZiytCYMXCEpUFVkajCcfT6VQtVt/3G8pHOIoT7h7rcrmIjP/LSziKE+4eK3XN+XzOKi69D9aMpS9vNZuClFU4rFUXgZUCq+RGGQtrteMEh+jo+rGWNHqyr78NU8bbO1F3WeVYj0azZ7wOrCYmeJE1s9gKMo56Yr2lDQunuxuWLopnNaWWTAEfJLA8b6QtxSV68HknUPmcZZ/jxdDwrE1RevVgWe4Q49zoOGNZntWINnTB+grYhg8m/VSvicqadpYuLlFWqYVLPiB1w5rmsd4QLeneShu+zHhRO+XHUX+s3KeAqz8s+ab6GBPLvpO2grUtfVz2wRBYG67cK913ieWV7rvEaqsNp3PphvGyLazZc4Ksi3cMrEOED0Oyrn92cOHPAf2xsgJ7dnBzWFlt6BhYUSrLmPH6o5ImsOyx5ZvuUbCMzeXbg2CFx1puYWBZh1Jjciep5T5Q8j3YIc7Xyi+rZvWA5uYsI5bv0FBDZYEVdMgKhKU/B4wglVbHH1Hvr7LAAgssFlhggQUWWGCxwAILLLDAAosFFlhggQUWWCzL+hFgAK1CEDiUER9hAAAAAElFTkSuQmCC",
  N : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAcpJREFUeNrs3OFxgjAYxvHSDVghjAAjsAIrsBwrZAVWYIRkBBqt57UejVFP+7z4f7+2x+nP5wnQYKt1XT+YsvmEACywwAILLLAgAAsssMACCywIwAILLLDAAgsCsMACC6zLqcpmmqZHjvBeyfLeKyeres0ma+HHXtd1COHuIzz7vWglK8aYaSILvKUmmsFq2xasy1mWZZ7nzeUMrI2RXbbAMo71VxPBshQuM1jOObBKmwiWsSaCtQus5ThgWQ2XGSxud65MOiGem8jZ0FgTwdoR1s8mgmUpXCpYmZPdN5bC2fCwI/KCufoyxnHM/DSEUHKQZ78LlWT1fW+giSLJSr+TKdowDArJEsJKIvkmUsPTeO/1myh06ZBPlsLmqxBWWrMyXilZ/371oHVRmm9ijBGs0iZSwxuaCNZpznfL+SaC9Ws9Ilk7aaLin2hkm6iIRbJua6LCc342sGTDJXQjDdad45wTbKLuhoVguMDaBZZgE6X3DdXCJXcjrYwl9K2wzVfSdV35Y97v9a0w8XCpJyvVs2kaklV6TlR4jM0GllQTwdJbs/Yx/F8HsMACCyywGLDAAgsssMBiwAILLLDAAosBCyywwLI0XwIMAAfXAsIjiXmrAAAAAElFTkSuQmCC",
  O : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAltJREFUeNrs3NFxgkAQgGHMpAEt4SxBS7AFW6AFW7AFLQFL0BK0BCwBSiCbMJNxCJ4b5fbI5d+HPDg4A5+3y4a5ZdI0TUbo4g0CsMACCyywwIIALLDAAgsssCAACyywwAILLAjAChLvYzuh0+nU+WSxWEynU7A+43q9Hg6Hy+UiTHVd3ztstVqJ2nq9lr/RzrWJF8fjUQh+e8LOud1uF+WE42CVZfkEU4dMrNPHOp/PQ9Ug4yWW2afesGXE0iv7o2vqNszy0RTrxTrlqV9VVSWFJfkS7p6+3W6TwgraH0l2G1zCxGbLkfScy+VSefB359n2q55O9TaKopAvptCUSpooF0inWuvvCXmeJ5KGytLeW3qU3YYsxkTScDababJJbmq962g+n0tKarIkhUc0GinP0wXlzUFZ3VJ4nuWpTUosuY38F6xALStPSsECCyywCLDAAgsssMAiwAILLLDAAosACyywwAILLAKsNLE0uxn8EXq2ICms0PMERliay/DsVPg5o5JyGjrnHh5T1/U9L82OD4OtEiNaWRL7/b73Q81eIs3v8WqMbVagMwSg3yZpMD1gtPMvU2/+axOqzSkp+b1rrTfKsgy+uMy2dud5HjTNDS7BrnUIuu866C8RYWUFHUdJcHZHykqIJrsoijRH6Aaf4NlsNikPZw7oZTBVEX/sVxLn9Xy0mQSLjyVRVZVc7XNksqCk/Nmfs11Tei/a9xS0ryrwd1JtSAsS6zUP8bEe/i/tvmIMpzcuLJ6UggUWARZYYIEFFlgEWGCBBRZYYBFggQUWWGD9y/gQYABO+P229yPVkwAAAABJRU5ErkJggg==",
  P : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAdpJREFUeNrs3OGtgjAUhmEkLsAKrCAjlBFgBBzBFXAEWIERYARYgRFgBO4JJl5yfx3NtZbyfj8MJlbkEdrTYjwtyxIQXUIIwAILLLDAAgsCsMACCyywwIIALLDAAgsssCAACyywdpSznd10XZem6RsNoyi6XC6yIY+ybYx5PP1OFitp2/a/PrCQFUUhb7hYz/6wnpGzrO97m1g77rPk0k6SpK5rOnhtrterNS8fRkPxGoYBLG3yPAdLm3EcLVyM/hSlFrDOTh1wvGZ7vkiUbaXbkhdvm3telJZl+afhNE1SgiqPpaqqQ9dZUq8LQZZlmhfP80yfFSixpEwFS4vFaPh7PYKlzTdXZvyrs8AC6618eqTzB0tfx4MVNE3jwiAQ7uK0ut/vLpQXTmPJ9KWu6yRJlPMYY8yBVh2E5tmRD8Pw0lzvedPsKFgvrcnYnxL5U2eBpY1ZA5YqZVlSZ6lSVZWdaXbogZR+3fm4WHEct21rTcq50kEZueiKNZb36zrWdoyT7cdPtD57v2svWDKo3W43Z785Fv/AAgsssMAiYIEFFlhggUXAAgsssMACi4AF1mdy4o+oObPAAgsssMCCACywwAILLLAgAAsssMACCywIwAILLLD8zI8AAwDN//7sunXNSAAAAABJRU5ErkJggg==",
  Q : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAApFJREFUeNrs29FtwkAMgGGougCMEEaAEVghK4QRWCErwAjJCDBCGCGMQEZIjZAQghCZ9s6XXH8/VBVqpeTr+c5J7WnbthNCF18QgAUWWGCBBRYEYIEFFlhggQUBWGCBBRZYYEEAlpf4HtoFHY/Hp0+Wy+VsNgPrGufzuSzL0+kkTE3TvPux9Xotammaytdg19qGi8PhIASfXnCSJLvdLsgFh8Gq6/oXTE9kYh0/VlVVrvYg4yU2sU89t9uIpddkpGvqMczy0RTrj/tUz/51uVyiwpJ88Xem53keFZbX+kiy2+AWpjYtR1JzrlYr5Q/fK89bvdpTqT5GURTyizEUpZImygXytFvrz4QsyyJJQ+XW3rn1KKsNWYyRpOF8PtdkkxxqnetosVhISmqyJIZXNBqpnrcLysNBubvF8D6rZ29SYskx8l+wPJWsvCkFCyywwCLAAgsssMACiwALLLDAAgssAiywwAILLLAIsOLE0nQz9EeSJGD9MyxNs0JPp8LrjErMaaj5mzdN885L0/Fh0CoxoJUlsd/vOz/U9BL5zsFrDG1W4GkIQN8maTA9YNT5N1E3/90S6pZTsuV3rrXOqOva++Iya+3OsszfXQiuwS3YlQ5e+669N3Ubryx/4ygGfcoBZndkW2HQKeQEj9mUU5jhTOdekoaxTYU9RlEUbvPRxivYQLncW57nDskMvEJO399X2Xa7dXJQ+p51sqvgNdH5LH1zlFJ+s9lovDxOgbbjCeUcnr+HxDFhaZ6ZvM7/jgyrx0vOCt8vHsaHJUfe69sxkaqqKtrSwaGXfC8PUtEWpQ4fM9M0NXvcGVbp8FFIkVGWpfKIdBIjxuI/0mCBBRYBFlhggQUWWARYYIE16PgRYAAFWSm6+dJU5QAAAABJRU5ErkJggg==",
  R : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAiVJREFUeNrsm9FtwkAQRHGUBmghLdACLeASqIESoARTgl0ClGBKMCXgEpxJLEGElGQduI3v/ObDXz6Ze7rdm90VWdd1M2TTCwiABSxgAQtYwAIBsIAFLGABC1ggABawgAUsYAELBMACFrAi0qvPZ7Ise2T526cWi4Wey+VSz/+h1bnoub9ZvIqi6NwVJaxeOmh1XQPLqvl87nnEMp/x/YM562fpfOmUcRualOd527bAMul8Pu/3e4/4SCAMe2/RNA0ny3q4jsdjIqbUeLVd8/Qfdn46neS/pmJKtdWvSy6Xi2yBff93yxP3Wd/tdr1eG9NW6F1EkLO2260xbZHgP3JZ8GSU0m0ILJp/wEIxwbLcdA6NhzhgyZ0Dy3qsgGXVZrOxvLZarSYNS+V0nudVVf36pkoiedfgjaYE+lnCVNe1w3wsBetQFIXTJDH26U5ZlozCZpY81TSN59ww1jBUad1P812/GnUYChZhODgegTXsQmR8P+BaVLIP7UtHOgq7Onjj2rZtZfSNo40UYInU4XC4K6FV7liq6J7XpB28LjvhM/oDh4n02H2WYjN0cCVVGzr0XtKBpTB0aL+k03WwdEGZSA8QsMaldMIQWDcDAawnK7SJTwqWsTACFmEILHLWJHwpYchtCCxgPbPcUc7a7XYBf8f4/2HRy1jx6LXoR2EkeGAhYAELWMACFrAQsIAFLGABC1gIWMACFrCABSwELGB5612AAQCjKaY5iMyusQAAAABJRU5ErkJggg==",
  S : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyVJREFUeNrsnOFtwkAMhUnVBViBFWAEGAFGYAVWgBFgBBiBjAAjwAgwAn1KKoQCSXw5Yl8uzz+qClVV7qvte+d3TfJ4PAYMWfwQAWERFmERFmERFhEQFmERFmERFmERAWERFmERFmERFhEQVivxG9TT3O/38/n8+slwOByPx4T1H9fr9XA4gFGapoD18WfAazqdzudzY3APu7hcLsvl0ulpR6PRdru1emAzWOv1uvEfGFl2u916AQvrxGo9CwK97HQ6xQ/Ln5QVL21Yq9Xqiw0X/V6zHlVhIRG+vkGBfpywsPe3saFjV40NFpbUkvqB/tBZgp4ohfIUtm0sHl/xfZqF5DdDfEUlSiU1+N6whRSOx2NUZQjxXbvmj1ubRGpA4iosQW/qgDNgrS7Pq68QkpQsHL/jH9GUZZAEVtkJvHfzrI/p5pq2XYIlKZOKja+23+nA0mvwkocpO+vV9nj8gMISErWr3UmSSKQDRMB73SExq7uS0kA1KOmQ81I7voQrHYSTGSTRZDIRyv1o3R15maDiFlkote0AyxDqXCICCp1IR5qHOKJxtSeeumG/3/cOFjq3a3K9tjzzxq89VvYxdcyrsnuGBTYKfV/H0grzFJBIMROr1cZk9eeF0Odlad832xwNeVnCQkATNN4fq8/eEcLK9YSPRYZy7hGsZ4oJT9qGxRgKrLzrN1NhaskVECyfqtQR98HBatb4dSoxUMMCyYVkcZrq9Nrdya9fCbWYxOXvDKzZbJbURVl9hXNbuQO+oeT+W1S+oWf/IqxW5veEVe/gN1b/EcKq3ex6B6vMK9S5TtQxWLvdzunzBg5uN2BJOjRqbbPZvJOSwNIpQ6WLISixxWIhdAmhFZwu4A6y+5WeQ0RRBGtHOwmxqC6GgFRL/zEwyO7BK7XVTtjR1a09zrGyjx1dlrCanr728O+7JRO/FfYtXn0xWT3tQsgLk+sOZjP43MtxRQZMhhdp9G4rV+jV/D0FFWfAcRb52woMH9UeVmGGVxjjBfUSjLBgBR58Fw1hERZhERZhMQiLsAiLsAiLsBiERViERViERVgMwiKsduJPgAEA+XyVu8uZ3pEAAAAASUVORK5CYII=",
  T : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAANxJREFUeNrs3M0NgyAYgOHSuACzsALDwUzs0lWo6dHEnwvakOe9mvDhE/Bo6L2/dK03AliwYMGCBQsBLFiwYMGChQAWLFiwYMFCAAsWLFjbaq1hcOsIJ8s1hAVLsGDBggVr+pZ7xsQYc857Tz+/ThdJKa3rHIwY/hr9DyqlXNlqa+3ZfbqGvlmwYMGCJViwYMGCBUuwYMGCBQuWYMGCBQsWLMGCBQsWLFiCBQsWLFiwBAsWLFiwYCn4EbWTBQsWLFiwEMCCBQsWLFgIYMGCBQsWLASwYMGCNWdfAQYAm9kWXxDs58sAAAAASUVORK5CYII=",
  U : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAZFJREFUeNrs3FFxwkAQBuDSqQEsBAmxABKwgAWQQCSABLAQCWABCSAhvYGh09LSuSnNBobvfwQus/dlL7PwQK9pmhfJyysCWLBgwYIFCwEsWLBgwYKFABYsWLBgwUIACxYsWJfpZWQ0Gl1bXlVVzhV0lmMIC5bAggULFixYAgsWLFiwYAksWLBgwYIlsGDBggULlsCCBQsWLFgCCxYsWLBgSThWURS3LK/rGtaX7Ha7a29tt9u278fjYf3YQcvl8nA4PBFWWZY5H5vNZhcuqafSizlrh8Nh27t4i8HK3EmiGQwG4/H41Cap19brdU5b5d+Pm9JEpdXNJNyALcSNDpPJ5EEv3kFntddc/X5/v98H1B+Ktdls2sBarVYx9YdipSwWi/+Vmk6nYcVHY5280sF5OKlusE7n8cbnV+IOO30dY3202B/G7rRkPp/HPNEv0uv8j6jTIFqf8/tYWx6TRtauSu0e63PSsP79O3NxzD2Ud19Yfs+CBUtgwYIFCxYsgQULFixYsAQWLFiwYD1l3gUYAIbGVuEGoBIxAAAAAElFTkSuQmCC",
  V : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAqxJREFUeNrsnNFxgzAQRK1MGsAlxCW4BTfnnlyCXQIuAUogipPxZDIZ3SLQnmT2PjNYSI/du0MQwjRNOwUWb0IgWIIlWIIlWIIlBIIlWIIlWIIlWEIgWIIlWIIlWIIlBIIlWIIlWD9xv98DEOfzGRktHoaMFk/aJKyPR5iHXS4XZDTksK7rkDNWasPj8YgIENSpeczpdGo4Z4GwxnFcBRZyurZhxbjdbqtYtW1YoC9MWKBV27YheLVNGyI+LSorEizkaq9iw1eAhdTyVWxYGtZuKh993yMzGYYhMQgywvV6LboQkrJir7hEXGA7+go2BA2SgGWalOFBGiwkxyeyElIKizYN1SkrAasSZQXOC7hRGvv9Hqk2//49/tYUV6wPSGZsQFlg9v1XXOMjVqkhbcBa4kTEg4SERYWV3ZoisMrtYfnAyi6IlZTC17EhoRSSbneegVz/jBudOCxn/tSnOxlOdN9K9rFhXo5HYHGyOxtWRtqqKGHxlWWqYK6ywKdt7cFCVDA3Z9FkVSOsP8oyd7I2Des3ryq2kh1hzeoequobdi5v0eBpyyyFTFI+sMwVPhmZsJge9IGFdw9I38CceeB/qiAiOBwO5h3i1+RCSB/W9z2T17uLsrquS2+8xI7B3Pks+ipWLTYEc7zpQXJ2d4NlrjPqrqre3c2GyDoRG/JhBZdv0ZhPxr7zWrp1cJj55BQLdRF/zp+z23vwy2Hx5+wGa2HV3xashYXfBVZw/NiY2aAn2tFhGDakrCXicpFVq7D4vbs/rOwcv0VlZa95i7DynmJxXsWqDlaeRrwSVpOwyHtYUlaDTWlea+o4Yf9/KJ8lLkdZVQFr1vp9YQV9iLolZQmWYAmWEAiWYAmWYAmWYAmBYAmWYAmWYAmWEAiWYAmWYAmWYAkBHp8CDABKCtGI2oWS6AAAAABJRU5ErkJggg==",
  W : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAv9JREFUeNrsnNtxAjEMRUMmDdACLdACVEsLtEAL2wIlEE8ysx/GenklP5brT7A90pl7JXs34fB6vb4wdOMbCAALsAALsAALsIAAsAALsAALsAALCAALsAALsAALsIAAsAALsD4O1v1+PygGs4Nm+e12o5Zfr1dxeQpyCFiXy0Uz7fl8Fj9/PB6a5cuyVHxlDbKFDU+nkziHgkJB1E8TYWnCGwuWFaIj67FgaUQepCwN6+0e9IR1PB57KSs6vD42pCqLUlnUDhqI89mQgqWXjKbrTWDDNM7nc8UqU/7FyW1aoTMsMabisdAEq2jYKWH1UlYbD7ZWVjFbfXWnYIn3GJdWOAQs04GgTln7seFGZTU7kfo/ohF5vedmfRiQ7SCy9pKVPyzHyJRKnBiWqKzMR4ysKO9kyhKrmJcHOygry43SRV35C22F/W1I6SJlSPHKlCUW+IltmPmOUlbKkFKEtWaNa0OrgyhdMLBMNcu34fjDMpUtJlVqn0xKc8MyNUQqVX4T/dHM0YN9lKWszZo8m90Ku8FaGTG1mSelv05Ob0PHri/uMLoNRV7imXtdTsFS1iz3u1cILD7KFRaVs1hoVv/yh6w5YG28rKxJitfD7S1idGWtgqKUpVGE5imYbyvsA8sl239N8cXL3YY/XWy4/I3qAq9kPYcNNQ1R8zSdUZa4Q8RjyChYYqyMNFbQDPG0fD+weGWlisOkqinMjY+jnZVFwcoWUtDTcp6XeyvsBotJNVtI5dzslf0QNqRqVkaHEQjz97iT2ZAPl3FQRpmBzmwS9EYuEFaDd4ifDiuTUt0mER6MheXy7q+uqUW0wt0qK8iGh9BfZuP/BaU43uNx2WR0ZVXUDhdFxDWWWFjWuIvzuxCfAJZLYQ5qheGwrA2xOL8L8QmUFeflHcJyOZrNakOX0E0EQ+9Y4bBM0W9X1gfBKtZm0w5xHmwBSy8WCsp23HNcd3Y28LsOgAVYgAVYgIUBWIAFWIAFWICFAViABViABViAhQFYgAVYgDXT+BVgAL9pjPIm/25KAAAAAElFTkSuQmCC",
  X : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAw1JREFUeNrsnOFxwjAMhUs3YAVWyAqswAqswAowAowAI5ARyAgwAoyQ6o67tlcgfonxk+M+/ezFufhDkp8su5O2bT9kmH0KgWAJlmAJlmAJlhAIlmAJlmAJlmAJgWAJlmAJlmAJlhAIlmAJlmD9WNM0E8B2u91b3rPZbBJOpk1vVVUFP2OxWHS/ZLVaIdO5Xq/pJsKAtd1ukXmez+eOl8xms+Ablstl0okwYJlNp9PgVNfr9avhp9MJwW2PlQDLQASnatH6ari5TMzwkcGyEIuJRMQxLdgLgWVmKTw4YcvijwP3+31woNEkTIGns5BQOhwOj3+s6/otLx+HdOi1oh2PxwEx2L2Sjs+z7lHW17lMrN5ut+4h8/kc+RlG5lmmGINu8if7IJnOkhrn+6mwQBHwPXmDG3zYfIr28exCulckPs33PqmdH4Z3sxQDlnj4k2WGIaibTGEiOjZ1MegPC9EQVrsgFdKjzigQFgICAUr+bB9YyDKXQzGYBSxQQ3TLMWZq95EOv7dGI4cjZdDopUOv7WbfYjAXz4rRk7xiMB/PAncUckjtzgm+V8/GqxjMKAyHRSK1GMwqDMFNGPfUnoVn9fUUe9gnteusw/jCsG8O4gv3XFZDsJ8INq4LhzVgaXOUDp6wkP5FVqLUM8Ejba5XA/9dgo8RAeQ9UmfPMu+4XC6DhyONn3I8K2Z/xkvK+3hWXddN08T75r/wLKQeRBr9ZIHqAAsRogYCOYlK1hAOsBAhajIdUWFkgcqGBQrRe3whWJkagg0Laa9+N+UNBLIfXywsRIj+1gR9ny9HOiBC9E/nBonEtFdQvKTDgDOl4NLJ0RA8WEgCerq6IaKMs8nFg4WcTHuqmxDBxdEQGd2w6Dj4n8kNC1KCR3JwR8MViUTGPgRHiEYm6UxuhX1yFEPkEaKqqpCVNPk+BMGz3nKfBJH+qQVqcljIWha889vCJyuTaojksIZdborZBUs3l0mrf0Stsw6CJViCJViCJRMswRIswRIswZIJlmAJlmAJlmDJBEuwBEuwirQvAQYAv7Sbyd6gtrAAAAAASUVORK5CYII=",
  Y : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAlVJREFUeNrsmn+NwkAQheEcgASQABKwgAWQgAUsYAEkgASQABJAQm8SLk1DSPd1e/ur+ebf42a7X+a9nel2XFXViNDiBwTAAhawgAUsYIEAWMACFrCABSwQAAtYwAIWsIAFAmABC1jA+ovX6zWdTseuWC6XSrbtdutMZcvZoqH2UwWOzWajPMb9fnemmkwmzjy2XLi9BId1vV4VWPv9vj3P4XBQ8thyBcOyWCwWzk3OZrP2JOv12pnEFgq6kRiw+heFiVTJYAsVD6u/3ZhInf9uS4TeRaTWQbH50+nk8adOS+R+GnbS0fF49D4ilPO0jMoy/16tVs6fXS4Xv7Iy+7clBlJZus0/n08Pv/takqUavL7tjxPNKPRvOwqToe7BH0r8KswE1h5ZhrrN11ZtkvRT7hAqy/SiNOK1o4sdg6Lu8ipL9KB6alEO0KDDYEqDf4dyxhsCRbOhh8GUMuzUzefStTdiHP87+MfjMZ/Pne72/mX7MCieAKV6lv6+xRm73S7yY6eBdT6f+8OKMAxmAUu0+fZhMP4zJ7vd6enN/yLkAgy+efHj3dyKw8BA7g3tLPMursgdQ+LTsKfNRxsGczF4b5sPejOYqcF7CyqZBtPK8P0SptM7g8jDYF6VZaQ6NQEpyyph61DH7XYTPwxJMAxm0jo0laXc7ycvq1Em32eJSlTeBQ4fVikBLGABC1jAAhYBLGABC1jAAhYBLGABC1jAAhYBLGABK3mkv2SlsoAFLBAAC1jAAhawgAUCYAELWMACFrBAACxgAQtYwAIWCIAVJH4FGABxraQlqLjfogAAAABJRU5ErkJggg==",
  Z : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAe5JREFUeNrs3NFtwkAQhGFAaYAWoARacAtugRbcApQALVAC1wIl4BLsEpxVnvIQRUMkbsfxv8+GXD6G9bGHWE/TtKK02kAAFlhggQUWWBCABRZYYIEFFgRggQUWWGCBBQFYYIEF1s9VSlm/oc7nM8nibQgWWBRYYIEFFlgLqY+af2y73TZNI148juPj8RCfttI/MLnW8XhU1r/b7aotyRTr+XyKL/blclk6lmGsTLGGYTCMVZTj3fB6vYp9vW3bqiszjJV4dzudTpXXtjGMVWwalFiJfe3fJss5VnbJEmMVlRArt487YmsPqXq7ds+3YewDxDXHljVlhUZYscMUY5W1whWxmh+WGKvYhSYu0qLBl1L6vre9CXo1eHHIFZflrjMf636/i69rXLl0rLnEKr9nla8SW/vSDyxut5s45Etu7ekN3nN2bNqzPGfHjlizi1Vmgxe/rpcwO3brWfqRRMqQzytZ+pGExU0wMVnms2OvZJnPjo2Spccqccjnkiw9Vl3X2R3/Mjs23ZTOYnb8S62nir/Mtt/vlYloNLXD4fDSM8d989WH/KHqffNPnx1HUxPnNt8fsrhDVvMCCyywwAILLAossN5TVT/ukCywKLDAAgsssMCiwAILLLDAAosCCyywwAILLAossOrVpwADALAUjuHbFyikAAAAAElFTkSuQmCC",
  s : "data:image/png;base64,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",
  p : "data:image/png;base64,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",
  o : "data:image/png;base64,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",
  r : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAAEH5aXCAAAAAXNSR0IArs4c6QAABQNJREFUeAHtnM8rNlEUx+/z9ip2xIZISmGjKNnY+Qv8AyilrOyslL0NK6Wk/AFWytKKkpUQKwtlYUU2Qsk719tMd8b8uPc8c+573Pc79fTMnTnn3HO+n3vvM+YxT+Mz2pTj9svR/stckNPHx8e3Cn5/OxIdaDQaqcNZrXKdYo+scXxckBBxSuZ7bk1FtcSO/mpqRKk4DVjn1AQ65DIxB2dWk9IassYaYqHD09NTDDn1XuiQsjIazg65ReflHnfi3IOzg/Pgi1NzeXfOyiV4bBtOJ7nDJC7TfM/Ol2zbtM3uk+QyO8gGzGuTOllcXFR6UsSvvMDmMeshbGavF4H29nYzTuk+qZLSiDknvXRiPbrKFqac5FOHvFRiDT6VmmPDSyXoxIkK5PqhcukV2HwdHx8n7dXV1eqqojWpcoui6Mvp3Nf+/n6lf9Oja3x8nKeS3t7eyuxNA6sF0vxU1GlHAaqzNyyalsuIVbiLTgqlyTsRjlxWVyuuQzYrWThyhVOJ1dqVBSmx7QWJj8JRiA+VXfoAERe1fNiCiA+VXfqwuoCwDTg6OlpoenFx8XXu5eVFDQ0Nqfv7+8R2YWFB7ezsJG3KTq2FXF5eFubw/PxceGtsbGys0M/2hLc5UnZ/z+pvtIqKaiVS0Vdy+vT0VE1OTibtOna8FtLsxXpZwd6G1snJSVkeTZ+r9eo3+xe+mZ3rfXDT12bfGxGbZJqxQSHNqMfhGwyRWpdfzuW1imIwRFBIFWrf50HEt+JV/dV6iVLVGed5DC1OdSmxQYSiGqcPiHCqS4kNIhTVOH1AhFNdSmwQoajG6QMinOpSYoMIRbWsz9vbW/YQuV0bkYODA6W/scp7bWxsJAlubm4m/4XX2tr67RmhxNBxp7b7WvomddE3Vg8PD19pdXZ2qsfHR8cU7cxrI1LVXV9fH1sRum8vhRweHqa+/KwqmnLeSyFXV1eU3Jx8vBTilBHR2Hshc3NzySMi+qZ3XTe+a1u1bIQ8OztTExMTNqbONt6ILC0tsRWhq/ZWyNbWlrPKLg7eCnFJimKLQiiqcfqACKe6lNggQlGN0wdEONWlxAYRimqcPsEQwdfTnMOEEjuYoYVCKPg5fUCEU11KbBChqMbpAyKc6lJiB3OJQileok8wU0SiuJScAISiGqMPgDCKSwkNIBTVGH0AhFFcSmgAoajG6AMgjOJSQgMIRTVGHwBhFJcSGkAoqjH6AAijuJTQAEJRjdEHQBjFpYQGEIpqjD4AwiguJfR/A+T9/V3t7u6q+fl5NTU1pbq7u5MHcLq6utTa2hpFv/p9ov+pF7ft7e3l/rR3VH3p8ZWVlVQtNzc3n/39/aU+cczl5eWU779qBDlDjo6OVFtbmxoZGVF3d3dWo1jPGAlbcED0L1VOT0+r19dXJ32lAPH69I6TQgTj9fV1gtdfFylAgpshVCJSgAQ1Q6pgDAwMqOHhYdXT06M6OjqU/nFe/cTw+fn511VXlb+P80ED0c+Tb29vq9nZWR9a1tJHkEBaWlrU9fW1GhwcrEUkn0GCA6Ivd29vb8UsQa4wg/tQ1z+BIeUD2hWGtg8OyMzMDEUHMT7BAdGfHz95Cw7IT4ahcwcQYQQBBECEKSAsHcwQABGmgLB0MEMARJgCwtLBDAEQYQoISwePRQsDgiULQIQpICwdzBAAEaaAsHQwQwBEmALC0sEMARBhCghLBzMEQIQpICydPzQz0wM8YBKTAAAAAElFTkSuQmCC",
  t : "data:image/png;base64,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",
  i : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAAEH5aXCAAAAAXNSR0IArs4c6QAABQRJREFUeAHtXD1L7EAUvasrYiFaCmongoWCir2NpfgFVoKtf8AfYCM2Vv4Bewv/gRYWgh8I2mgrCgqCIohf6HuZfWaJSWaSmbkJ94UTWDY7c++Ze8+Zm8zGcWt/goMsjxZL+4Z5qlOtVqPW1lYtXqqTsp6YmNA61dN6stJMHUmFp166I9VJZxy2C3fiYy9MWPfuRETNdsJaj5JwYJ8FCYqtJyd7SImkdaKF7cU7+LMUxqp7t87BevLpRja1545qa2uL9vb2TFjavgS5aZbxS1/WNI1j5BrEFtRpEN9McmsSj87mMwaxYYtKoauUKVxKJrKuXVZKx4xLoSvXIO/v77S0tBSLz+KjWsyYjtPTU7U6b75Mtro+0nWE7dEB1Pnh4WHYlfs9c3Z9f3//WukHyBY8/TPN1KSlpUVlS29vb4136xECh8xMXEDjPpmZnJ2dNb55ZC304sDRz5mDRI1dzzGIFXOgC3RZMWBlLOPaZRWyxhh1oiEmvbkU4dOH5m0tRXfekNPRkEicl5WVlV9LmnBp8/HxETct5DNLjfT09ND9/b02QLXMjT9s0Bo7drBMrf7+fuPwRSehBmdJ5Pj4mO7u7hLJzM7OOn8HSIBlNLBMrYwxSunO9bgjK5LLy0taXFzUmp2fn2v7uDpYEnl9faWLiwuumJxwWGrEaWRmJyTCTKg3HBTxppAZAIowE+oNB0W8KWQGqMxaC1OLeWZ4w0ERbwqZASqjCK5azDPDG64yUwuJeM8FZgAokkZosK2AlpeXaXNzk15eXtJMimvLvZHBYPj19dXciBFE2jyfm5szePF2ZW7myDNcW1tbM/hoIup8f38/D4S3DcsN0fSQuru7mx4fH4ubUj/I3sWe9YTx6emp8CTUAN6JDA8PGwMdHR019nN1eieiApmcnNTGc3R0pO1j7fCush+AhYWFRMHf3NxwwWfisBR7lFm18a69vT3aVMo5eyKlRJ0yCEuNpOCW3sTyh56RkRFt4Nvb2zQ2Nqbt5+pgScR0LylrzVWZqYVEuOY2Fw4U4WKSCweKcDHJhQNFuJjkwoEiXExy4UARLia5cKAIF5NcOFCEi0kuHCjCxSQXTmUUYXn4EDwG5CLWGacyiiAR5zlQkCMUKYhYZ1go4kxdQY5QpCBinWEro0hl/vTmLKUwx8rMLGG8OocDQZypK8YRghTDqzMqBHGmrhhHCFIMr86oIgUJ9qTSwMBA6q9HqC2gvb29tLu765y0aMfMzXUlGqyvryf2EQbkGdtWV1dLjLD4oVh2YHOEOT09bSTeJMzU1BRHCCIwRHwxvL29pb6+Pq8rydXVFQ0ODnphSHAWIcjn5yd1dnaS2insctTrdXp+fqaOjg4Xd1E+Im7qwT+d0MbGhjMxa2trlRBDESCiQkIlrq+vaXx8nB4eHsIm43tXVxednJw0VmRGw/+oU5QgUd7UsnZnZ4fUbyap+4M6hoaGSP0vzfz8PM3MzETNK3MuVpDKMGyZiIh7iGXMlTaHIMLkFSNI/LfD1SOSvK+DgwNhtLqHI0YQ9xSq5QlBhOkJQSCIMAaEhYMKgSDCGBAWDioEgghjQFg4qBAIIowBYeGgQiCIMAaEhYMKgSDCGBAWDioEgghjQFg4qBAIIowBYeGgQiCIMAaEhYMKESYINsoJEwQVAkGEMSAsHFQIBBHGgLBwUCEQRBgDwsJBhUAQYQwICwcVAkGEMSAsnL/kq5gdPvQRRwAAAABJRU5ErkJggg==",
  k : "data:image/png;base64,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",
  "!" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAT9JREFUeNrs3MGRgkAUBFDHMgFSIAVSIGuIiRRY7xY4lrs1PezrMwfrVfP5oFj2fb9JXe4IYMGCBQsWLASwYMGCBQsWAliwYMGCBQsBLFiwYH2WdV1LRZ6HwdIsWLAEFixYsGDBEliwYMG6YkrIr5VLKW+P2bZtGAbNutUotJUKwpqm6csDNCuoVj01a55nWEHF6QZrHEcz69ewEqpXct4KO1+1Ej5n0AZ/cqKFTLQgrBORhIHVTbPeTjTNgmVmNV8s/t3qcLI9NH84k9isIxGnYe3YSriFTsQKmU0dY2lW9IpwlEfazHrtUU6ziv+iudpSCgvWpZMy4GteCHiO/7aXy56+vl+Wpe2V0WkICxYsWLAEFixYsGC5kf7TdPEMUrNgwYIFC5bAggULFixYAgsWLFiwYAksWLBg9ZQfAQYAy984l3UoS88AAAAASUVORK5CYII=",
  "?" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAldJREFUeNrsm+FtwkAMhaFigTBCGaErlBFYgRVYAUZIRoAR6AhkhDACjJBaiURRFBo3EJ97+d5PBNLl09l+9y5My7KcIJ3eQAAsYAELWMACFgiABSxgAQtYwAIBsIAFLGABC1ggANYgmrlazfV6zfP8/pP3SsD6UZZlX5UEVusXPip9VkqSJNhCy3C6XC7b7fZPDy9fXq/XRVEEWXAwWKfTqXd9CTKhPBZYaZo+XxNSkrI3I4f1ElK3XmbJa2Jffa/tuavVKlpYshdePqP2+32EsKQrDzHQZVBECGs4iyTVbbD+maXzfOQ5GzNOVLt55U9Eh8NhiAIPZkrFTHYuRgZlw7UqEQjfqMqwswZbH/h4PPppW0aw5IDSe6gpjb7BUxhFNOfzWeMwH+2aceVZjeDFOZR/HP5pBqLFKDTLs6S714agR/062pWlbylNf8NzDKSp5/fgpQAXi4WmDMWRGSSornuW0sGL3TXKmt0WoD7MMUuZ/cJSDjjLfNkprM1mo0xKR3Fh8Yvk3KO0IzbJjF9Y8vzKbm1jF/zC0mcyI7oKe7Kpi1cIsjxHsPRN3fi60B0sTeBVN/VQd/d2eVandrudsqmHTHKc7CwNgiBN3d1BWg6A8/m8M4RRlmrkB2lNYqVs/2NPSm92AViqndUvZR3pznJylwEsfxcWT15nhHzp9k6uM3hv4k8DwAIWDb7lLyhurVZ4WEJquVxqDvyUIT0LWAhYwAIWsIAFLAQsYA0jwj92FrCABSxgIWABC1jAAhawELCABSxgAQtYCFjAAhawgBWpvgUYAFJsN1opTo5xAAAAAElFTkSuQmCC",
  "0" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAlVJREFUeNrs2+1twjAQgGFSdQFWgBGyAiuwAoyQFWCEMAKMgEcII6QjwAjpiYgKkVAdwZyNee9H1c/IeeKPc+rLmqYZEbr4ggAssMACCyywIAALLLDAAgssCMACCyywwAILArDAAuuN4juGRhwOB+fczznk89PpdP3T2WzWfpxMJvP5PGRDm3BxPB5Xq5UQPNTgxWJR13WQBgfDEqbxeDz4GRdFIdbpY8lNSu94fkzkeW7sFQDL47wjE1nKWDL6/M65ZVmaNT6zPBgii910OvV7TZn4ZDAmmGet12vv15Q8Y7PZJIi12+1ecVnJ0VLLs7bbraY9Mv1XVdX+yX6/lyUvnrsYRTW1S4LazTM06ZiwGtyC3TDUDJZu/iVSkn9qNkxJzVk3O757eabym911NikszcPv3Sd+IpYmerGe2UL6DbukNMsyzaLm/W95+cebUrDAAosACyywwAILLAIssMACCyywCLDAAgsssMAiwALrNmz+a/0GWINPlLwxlubh9x4esTlOFBfW4MMwGqzUepam7KT3KK3mfO2jNS0pYDnnlsvl9WwlX2rOXtn0LLsjR/pD8DK7tTffrRC79xjqura4B8vyirYYznsURWHTftPU4UXVgl7KpqLrWa/oXGbdKkChk/Jcu37RsKyiC1BCV1WVFy+5yF8tRsqVrNIdnhyPslwaS4Us+5Uoy3JAfiRDz7LGMFi94b39oLvEP78mPTE/R8AC/PBYNy8YujtBAYqkbiAuLF7+gQUWARZYYIEFFlgEWGCBBRZYYBFggQUWWGB9ZPwKMAAb8Bq6GXjuvQAAAABJRU5ErkJggg==",
  "1" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAShJREFUeNrs3EENgzAUBuCxTAkW8IIFLCChWMACEsACFrCAhK7JDsuWMbjRkO8/kcCh+dLX93qhiDHe5FjuCGDBggULFiwEsGDBggULFgJYsGDBggULASxYsGBdM48M17Sua13XP1+FEKqqgvXOMAzTNG05KsOPdF3nzDoqtSwLrP30fd+2rW54aE81TaMb7m+onKvvfKxEM89z6nqp953b43LESjSv8yjRpGdD6c6ouTU9ue64G8ISWLBgGR2+U5ZlCOH/mJpG+ay1YjYZx3F3tembE1eoDJ1ZsGDBgiWwYMGCBQuWwIIFCxYsWAILFixYsGAJLFiwYMGCJbBgwYIF66Ip/IjazoIFCxYsWAhgwYIFCxYsBLBgwYIFCxYCWLBgwbpmngIMAPZUToFkzb9zAAAAAElFTkSuQmCC",
  "2" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAApZJREFUeNrs2+FtwkAMBWBSdQEYgYzAClkBRmAFVmCFMAKMACPACDACGSF9UiSEaKOY9LAd5/kHQlRCydecz3c+srquJwxZfJGAWMQiFrGIRSwSEItYxCIWsYhFAmIRi1jEIhaxSEAsYhFrQPHt4SKqqjqdTrfbDa94f7lcnv9aFMV0Ol0sFniDV8sLrU3jeDyu12v51c7n87Isra7WDOt+vy+Xy37/YJDt9/uxYJ3PZ4ysf46JzWYTHyuJVBMYwpGxrtdrKqkmNMejNhZmtLQTFOiR/nQuXrXOOhwOKA6Slx273S5g6ZD8sXo8XNGGIfK6MGcjrzXZbbvdChMc6rVQWLjzHrMbFCRY+PJQWJ1jsC1VS0p81LehEvzLiu93NGvAPz+XpPlQuw6d99O2SMbipvPLsQiPgyWpGNqwJDsNobA+On65+fdePtLZ5xoAlmSIpV1vBh+GOlhK28qY0TqL0rZZDytKJ8PQeFs5Sd2vttzJPP92B6k9z/POBN+U/mPPWavVSjIV9t7LjzMM5V2fZpcicncnlZTmNvxkuEldeU/ZI1ZZlj67Fe6w3pIaRd8wiVRRFCNq378EBpRcCvW6ZqryhfVWj9pKygUW7nwQUvZYuHP5GthWyh5LXnyaSxljyac/D1KWWPLjNE6kLLGEqcqPlBmWcPXnSsoGSzgAlRfJTrEke3WQQqXqbZGvjSU8FWN4ftsRluSUh86RGO9YksfKYap6hGrDQnL4EzW9Tse0R+i1wqqqms1mknKhH5YwGw6gIy1sLLs6M2PZN/Ss4A4r+Qn4yDkry7JPd4uDPFkBHqsJf/ZLLGIRi7MhnywGsYhFLGIRi1gMYhGLWMQiFrEYxCIWsYhFLGIxiEUsYjmIHwEGAH5cZJ2I3VOhAAAAAElFTkSuQmCC",
  "3" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAwZJREFUeNrsm/1xwjAMxVuOBWCErsAKMEJWYAVWICOEEWAEGAFGgBFgBPqK2x7HRyxC8uw4T39wbY7kzO8kWXpyPs/n84fMZj0hECzBEizBEizBEgLBEizBEizBEiwhECzBEizBEizBEgLBEizBapH1Y1jE4XDYbDa73c798X99MBiMRqOvi2VZhs/ACz0HteVyOR6PjUsFrKIoAq42GKztdmvHdIMMiDsEaz6fvxkQs9msE7Cm02ktCYTP66OlpJyR45EKC+m53t0J+StNWMfjEaVA7bs5c3/kFaWLxeJ0OtX+2Ou6rGn7pJ3PGg6HXlgoQZG2nQOiQM3zHJ+WUjGponS9XntXAkYI1QqRi4cnFYZoZSylwA0a/IuL3hubiO7YG2nE4P1FS5VvCdXUYD3k8pCgJBrpWYJVTbFq7kZaqJJgWersyjUnTRSMPQy9sJyOKlg/1dlqtSr/TpZlXZGVy6VUSzLa7/e0JfVj8yZkdDgUog+Nt6Xop04xYnCi+0bHWPGT19mLJDe92t+BlKU5V1H6E30g1YSUWG79dmFC/whS1WZonfMsN7KmyQwxJvgKngL/ulEKu5LgK1ie55PJhCb7tV51wB5K5hUFLHdUphovuFjX2x30Ohb1ndzxxNsbOmSWYop26CFqWMaJP22IzxuyVjbLdNYoUaS/G1qqMM4Qn9TueFtld3z02V7plQCT2g29R/3gPiXnTi3epwr+1+kiWUkssMiNS7thWU6OCFabnI4Ey9L6PXOueIbSEcF6VitZ6gbSJkBrXLy/B0Dv9TzjVIJz+I8HyzI6RjRd8zJOJfCd1IasqBu9AYW0hU7Q9TfI68YtkjfBZ0oIDU2PUzuA66zed1H+HZY3GSPrU/Xu8chWzIMhbFj4bTVu8ym/6PSSWOz1Kf4rmmFk5TeFTdyLJ/CXHVKDL4ri1f0x7GvS4TV4FF+bi5X0gOM/C/sOQVwDi/v2EHTiEf9aMN2RniVYgiUTLMESLMESLMGSCZZgCZZgCZZgyQRLsARLsAQrdfsWYAB0oA7n6FfNZgAAAABJRU5ErkJggg==",
  "4" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAdxJREFUeNrs3N1tgzAUhuESdQFWgBFYAUZgBRiBrMAKrMAIsAIrMAKMQH3VRmpqfqTa5+D3XOQKkPXkMzomJtG2bR/UsXpAABZYYIEFFlgQgAUWWGCBBRYEYIEFFlhggQUBWGCBBdY961PmsJ7P5zRNu4cNw+ByVJHAH1nHcSyK4siRjgcvcRq2bcs962isTIGlO1bisCTHShyW5FjJwur7XnKsZLUOaZrO83zqlEBbh67rzkqFm6wLsQo0WSpiJSVZ12IVYrK0xMp/stZ1NbEyn9dODytZJlaXpTzU5q+WZYnj+K+BlWUpbfAPmbFKkqSqKpY7P3cry0qwaRrWhopj5Q3L9ArqYuUNy0ipi5UfLBMrMwfVxcoPlmUCSo6VByy9sfKApTdWrrFUx8o1Vl3XemPlFMv+M5f8WDldi+Z5bonV7+OPbPq450L6DrFy9uWcjVW4yZqm6Q6xcrOZzfIsNI5jk6y3lEc2s72eaC6VZZn6aehmf56Z6Xd+UqquwAILLLDAAoty0ZSadtGy3LG0srt96etl/70jlfmGxXd3vvueBW9YcM8CCywKLLDAAgus0Crij6hJFlhggQUWWBCABRZYYIEFFgRggQUWWGCBBQFYYIEF1j3rS4ABAJHuUWRFJlXUAAAAAElFTkSuQmCC",
  "5" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAntJREFUeNrsm9GVgjAQRWXPNmALWoItYAm2gCXQApaAJWAJUgKWgCVoCewc/FiPizi6MIRw36cH0Fwnk5eZEFRVNUM6fYEAWMACFrCABSwQAAtYwAIWsIAFAmABC1jAAhawQAAsYAELWH7q2/LLzufzdrvt9pmr1SpJEj9h5XnONCRnIWCNA9b1egXWGwkeWExDNKzPalcYhp+Z0inCOh6PTMNfnU4nchbWYQwJi9UQWFiHXh38uZZbU7UyVHvOul1TlmUcx4vFovGyzWaTpmk1kFyBlSTJ5XIRTJo/WFCKKZsurCiK3vXi9iHmCqzPZMwrsHzRKQiCbh84n8+LoniW4EZsHfpoVciWoPN2kc8+S/4Dsy2nD6Z0v99PFJakobCWfnE8HA6+mVJNuUrc1v0tkryFnWYUcqXBEOwi62VmEXf+YEoluLIsG2r1cHoaCqzGbZBmPtpUyuw20i9PcDyDIhBfRqXNgmgH65a2P7jRzHP6YB00Od4mZ5lud3rdJxkMhEopsIAFLGA1ab1eB63a7XbA0sr9frVDsJ65cA1Em7M0I8hZmq2Msjjhf2RpYPkWWS/HI9OtsWWtqe3Z7B8dgtXIRT5xJ7JM+4aazHJfLM2yTHOLhJWHTdYoipQ1mTAM9TMrjmMPYfV0arQsSw9hiTo/NiTR6mf7flafuloulx3WBSWsbEzWAD5LMlGapl09TbkCjHI1fDfTt8vzI0f3+s+7upM4zPagoijezfcy6W5nBAf5wcM3LCTli03Pa7UYdJGQbWzEmsmt7s7fE8oSSpavMo0JFsU/YAELAQtYwAIWsICFgAUsYAELWMBCwAIWsIAFrEnqR4ABAFakRVY8Sd/OAAAAAElFTkSuQmCC",
  "6" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAtlJREFUeNrsm+FxwjAMhZteF4ARYISswApZgRXMCKwQjxBGgBFgBDpCGIG+I3dcLw2tkiayIz/94E8L53wnK09Pdna/398YsngnAsIiLMIiLMIiLCIgLMIiLMIiLMIiAsIiLMIiLMIiLCIgLMIirBnFRwyLOBwOl0d8PuL7nzabTfO5WCzwuVqtQi70Hi7qut7v96AgX22e52VZhlpwMFjn83lwmuCLVVWlAgvZ8f894ZyzDws5NVYNwS62DAt1atwiDfRqi9eWDt771vvun7Hb7dQWnymfolkul7fbbdzfRHLhLWlNlCKtRifVyDSDCv50OkmU1PF4fL4KGlH6e0DNGhSlfy4GAvV6vba+JXkhWCvwkrQqiuInmu12G0ly6cGSPE9nnZYU7ylKYeyuQ+eOC9w8B3EdJNvwFaxITgnPILNSNP/GFe5BQk/BZ1kmUQDMLNrKE+9ZNDEtl3n1iE4tZk3BCxcDBf9ni4N/0HRmAvhZQjMvWucvOlh9A50QYfUIzclFXNJhQDRGRa95WrrSAS209z5FUTq4SUJyMbOkosyanyVPk7Isj4+QD/clloY1UQo0dV23JrISXjoaIq7MwjO30OR57pyLxdKIKrOec50B4/7kdNarxURi79CiSRKWwoDHDiwFqWUHloIjyALPAk9YCcGa9LyZNT9r0uexdvJPcixtsKOgMxyLK7M6ucQDS6+RlpiZRVEMOwre2YHP+xy85LG/TwNBSnLsDzlr8NKAcIbaXABrboIJXTCDsCYaK+jswQDXUSTbqu9L1uCQ9WmkrNfrEe0UZKvaoRrtdgdlaJT7c03gp1SPH833vqH+ldZgN1mrqhrcAOGLCd1k7SWjWpicc63ZotkC31nyvfeXywVtzavCj8KEtx66ZUh8HYMhsFMqBNey0oFGx1GYHyyaf4RFWAzCIizCIizCIiwGYREWYREWYREWg7AIi7AIi7CSjC8BBgDxhIHqgtCJ4AAAAABJRU5ErkJggg==",
  "7" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAh5JREFUeNrs21uRwkAQhWGg1gBIAAmxgAUsYAEkoAELWEBCIiErgZGQbS5VvHUGiu05Q/39nIXZr/o0MyFMh2GYUHk1gwAssMACCyywIAALLLDAAgssCMACCyywwAILArDAAgus76yfmLfpum6/3//TizdNczgcvgcrpXQ+n4khM4sCCyywwAKLTemnaz6fr9fr9/7291bOBcvlMua/mOo/+bdarXysvu9jvNRjaPt+X8oOOmGdNRm0yw+vpftyuYQtRrqzrKf8E+VutzOvuAUpt9V2u/UXH9lW1+EuK2UQvpRRBi9JN4bH49G/wDIYvSbZtvKHkQ3++FWJdtbpdEop+RmMX5XoptTfiN53DJwNH23lb0SLtJUo1uho32w2ZVamNtrbtvUX3DRNqbXNaKtaB7x9Ai4WC/+asHsM6jNrtK0sg6Wk6sMqmEEtrK7r/B3DfeMOVlZbWQAthmA99qLKGRTCGj0M3qc7WNfKecaGzqomgypYVWRQBSsng2U3DULHHTvi+J1V6gaWXGfZXnQ0gwptJYE1OtpFBpYEVs7AEsEqPLNy7slMbnco6aysDIoMrPJYNt1ryWB5rJyBFfrohyzW6CN9dNZrGQTr2Vk5lxHDmo6E1cRQp61KYqVbVTSwSmJlTnc664XpXvArVa0YgvXhksKq4OcodBZYYFFggQUWWGCBRYEFFlhggQUWBRZYYIEFFlgUWO/UnwADAKM+9iPbiqjtAAAAAElFTkSuQmCC",
  "8" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAwRJREFUeNrsm+FxgkAQhTGTBmwhLWAJtGALWoIt2IKWoCVACVqClqAlkDc4kxhEboHL3rG8/eHEhGPIN7t7u2+PWVmWCU1mH0RAWIRFWIRFWIRFBIRFWIRFWIRFWERAWIRFWIRFWIRFBIRFWIQ1IvuM4SGu12tRFOfzGT/g836///zpq7I0TfGZZRk+Qz5oGdR2ux0QyJ8WF2NJqKcNBut0OnXC9GxwNCyfCix4x3w+HxgT+i6WBCHlK4co80r0o89vzs3z3CwspBu/sLA/2oTlMQCDBKNqUXo8HiWXIfdnlQmrqv1+b63Out1ukufZbrfPq/BVsgo3NxWGyMSSmvN14XK5jCTN64Uh+hjnNavVSvjLHje31kg31vS9C33jsN6V9ZHw+ojcrahnUfzzoWoR1m9f0huWc7Pz3kUFhiX5fxqhAOKzdjoJWA91uEfj4uxmULUOV8eik5UljXRNApXU/WoqzUz53Z3FYuFMQPCUhw8WlTkvPhwONgcWl8vFY8ggtHVa6GCyMgLNCy+QUh5bhBlYwB0G1uuIPk2fCjwKg0nkhEjmOoFhCVW9d/12TSM0CwvhI9HzIozERJ+Ux2obt7K8G/bOUy3+ZROWpHrELonL8sqQmCRFBq43CMspPLy6CaLMyQvBaA2WZHDfWGRKOko0BqamO84uDx7UmPuR5pzOJRzfjkaiccJq2SWdG6iOyhqRrNziPkNU1lHCGqJ2Bj5Kqg/rX4fGzhjnKGzCozDC+lOahx0dmfKslrwjqdGsjcJ6b//OnXSKsBp5gRQn0tKuRXJkVKkQ01QdJMFS09eFB5x1JEDVIet6vZa4Sach62OflQyuR+ZZ3l+vaHRGO7Kyl1FFLVuZ1eD9ju8T2+/uCJV4oW02G/tDVi8v8SiTCjmRhn/1jkcsVJvoxHLWAfmr6xjxMbjXPxISoM561+WgcG8vqVBJpZV530w7WXhYNTW11jMDkNJ50dHBovhHWIRFIyzCIizCIizCohEWYREWYREWYdEIi7AIi7AIa5L2LcAAzvxzglhLcPIAAAAASUVORK5CYII=",
  "9" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAuZJREFUeNrsm/2RgjAQxQ/nGrAFLYEWsARa0BK0BFvQErQEKEFKkBKwBO6N3nmMoKwaNx+8/YNxFDLhZ3b3ZZNEdV1/0WQ2IgLCIizCIizCIiwiICzCIizCIizCIgLCIizCIizCIiwiICzCIiyP7NuFTpxOpzzPi7PhM67NX5MkGY/HcRynaTqZTGx2tLZqWZYBgby3QLbZbGz11hqsqqqewnQz1o7H41BgHQ4HeNY7DoHH0Uj4sN4nZYuXBViIO6YCLpoKGdZ6vTaboNCgWucjzV00kAXT6RRXg23CGRHsjfi1W6J0u92aJXX5A9BsgAp+v99LRspVSSF+QyUYadYzUQphJekPZOoLCUFHdumNLExoJNmtPZTm87mRxn1yw7Ise+/p1PQSoS9p3CdYN9PjeyOrM4r1JjtJ4z7BkuTBe+GpN2yFNrIk7/OyXBoiLFZKWVZ2zxRifDiwjE+k6IYDgKUj0D2D5QgU+7Akq1idcccdzeEWrM6M5s5wcwtWZ3VQr1zlnRvOZrPrUIIDLhYLhwKZ5grYR1+kXTX0uPgXx7HlnQp+SQdJzZOw/mHprFmFAAuklsslYUkNsCSrW4T1a7vd7tk9WYOTDu1ND73xCzdctjJIXkRh6VB1r0NbgkKd52drCvfLpkh46zUhRFEk+dc/3WGbsJ7opRuwWPwjLMJ6nAoIyy15oXdooCiK1Wr1+B4IhfZru1Mp1YN1OUbRe0/7SwksnVnByClP6SwrS1ZPlebnqlujBUDbT0mqYDo7/1RhSZwFqr35iKQEBpoB7oMX1mfgU8nZhM6FZgOE9aEyvNqhJ+2qg3FBhAEY7HGULMvMwtI862ShnmVw2ULz4I4dWFVVGXHGm7wZ8knWN1cu1DKgE7BgyGIvuCRGpcLis3Nl5WZxufizB8oTiS9NU4uLQ86VlcuzWZknB1KDZ6WUsAiLRliERViERViERSMswiIswiIswqIRFmERFmERVtD2I8AAVk+r365MC5oAAAAASUVORK5CYII=",
};
var charsLength = 0;
var charCounter = 0;
var bufferImages = {};
var bufferCanvases = {};
for(var i in chars) {
  charsLength++;
  bufferImages[i] = new Image();
  bufferImages[i].src = chars[i];
  bufferImages[i].onload = function() {
    charCounter++;
    if(charCounter === charsLength) {
      bufferDraw();
    };
  };
};
var bufferDraw = function() {
  for(var i in chars) {
    var canvas = document.createElement("canvas");
    canvas.id = i;
    document.getElementById("buffer").appendChild(canvas);
    document.getElementById(i).getContext("2d").drawImage(
      bufferImages[i],
      0,
      0,
      100,
      100
    );
  };
  start();
};

var textChanger = function(text, sphereRadius, sphereSpace, unitTime) {
  var changeIncrement = 0;
  var charNum = text.length;
  var center = new Array();
  for(var i=0; i<charNum; i++) {
    center[i] = {x:sphereSpace*i - sphereSpace*(charNum-1)/2, y:0, z:0};
  };
  var changer = function() {
    setTimeout(function() {
      s[changeIncrement].type = text[changeIncrement];
      s[changeIncrement].targetCenter = center[changeIncrement];
      s[changeIncrement].targetRadius = sphereRadius;
      changeIncrement++;
      if(changeIncrement < charNum) {
        changer();
      };
    }, unitTime);
  };
  for(var i=charNum; i<s.length; i++) {
    s[i].type = "_";
  };
  changer();
};

var fullSet = function() {
  var alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ__?!1234567890";
  var col = 10;
  var colUnit = 80;
  var rowUnit = 120;
  for(var i=0; i<alpha.length; i++) {
    s[i].targetCenter = {
      x:(i%10)*colUnit - (col-1)*colUnit/2,
      y:Math.floor(i/10)*-rowUnit + 180,
      z:0
    };
    s[i].type = alpha[i];
  };
};
// var textSet = [
//   {text:"WEBSPHERE", sphereRadius:140, sphereSpace:80, unitTime:100, time:1000},
//   {text:"THIS_IS", sphereRadius:120, sphereSpace:70, unitTime:120, time:4000},
//   {text:"EXPERIMENTAL", sphereRadius:120, sphereSpace:70, unitTime:50, time:2000},
//   {text:"TYPEFACE", sphereRadius:120, sphereSpace:70, unitTime:100, time:4000},
//   {text:"BASED_ON", sphereRadius:100, sphereSpace:60, unitTime:100, time:3000},
//   {text:"HELVETICA", sphereRadius:140, sphereSpace:80, unitTime:100, time:2000},
//   {text:"@@@@@@@@", sphereRadius:60 + Math.random()*60, sphereSpace:200, unitTime:100, time:4000},
//   {text:"MOVABLE", sphereRadius:120, sphereSpace:70, unitTime:100, time:2000},
//   {text:"AND", sphereRadius:100, sphereSpace:60, unitTime:150, time:3500},
//   {text:"PROGRAMABLE", sphereRadius:120, sphereSpace:70, unitTime:50, time:2000},
//   {text:"!!!!!!!", sphereRadius:100, sphereSpace:60, unitTime:100, time:3500},
//   {text:"HACK_ME!", sphereRadius:140, sphereSpace:80, unitTime:100, time:2500},
//   {text:"@@@@@@@@", sphereRadius:60 + Math.random()*60, sphereSpace:200, unitTime:100, time:4000}
// ];

var textSet = [
  {text:"sportik", sphereRadius:140, sphereSpace:80, unitTime:100, time:2000},
  {text:"SPORTIK", sphereRadius:120, sphereSpace:70, unitTime:100, time:2000},
];

var textSetChangerIncrement = 0;
var textSetChanger = function() {
  setTimeout(function() {
    textChanger(
      textSet[textSetChangerIncrement].text,
      textSet[textSetChangerIncrement].sphereRadius,
      textSet[textSetChangerIncrement].sphereSpace,
      textSet[textSetChangerIncrement].unitTime
    );
    textSetChangerIncrement++;
    if(textSetChangerIncrement == textSet.length) {
      this.animateStart = false;
      return;
    };
    textSetChanger();
  }, textSet[textSetChangerIncrement].time);
};
var vibrateCV = new closeValue(200, 500);
var invertCV = new closeValue(1000, 1200);

var start = function() {
  setup();
  setInterval(function() {
    // if(vibrateCV.execution() > 0.8) {
    //   vibrateFlag = true;
    // } else {
    //   vibrateFlag = false;
    // };
    // if(invertCV.execution() > 0.7) {
    //   strokeColor = "rgba(0,0,0,0.1)";
    //   backgroundColor = "rgba(255,255,255,1)";
    // } else {
    //   strokeColor = "rgba(255,255,255,0.1)";
    //   backgroundColor = "rgba(0,0,0,1)";
    // };
    strokeColor = 'rgba(255,255,255,0.3)';
    backgroundColor = '#1678EA';
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.strokeStyle = strokeColor;
    update();
    draw();
  }, 1000/60);
  textSetChanger();
};
document.body.onmousemove = function(e) {
  // camera.rotate.x = e.pageY/window.innerHeight * 180 - 90;
  // camera.rotate.y = e.pageX/window.innerWidth * 180 - 90;
  // document.onmousedown = function() {camera.zoom = Math.random()*1+1};
  // document.onmouseup = function() {camera.zoom = 1};
  if(!this.animateStart && global.lastVertices) {
    // global.lastVertices.forEach(function (vert) {
    //   vert.affineIn.position = {
    //     x: -e.pageX,
    //     y: -e.pageY,
    //     z: this.z,
    //   }
    // });
    // update();
    // draw();
  }
};