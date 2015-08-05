
var cardTypes = [
  {
    name: "House",
    description: "Small house",
    color: vec3.fromValues(255.0, 0.0, 0.0),
  },
  {
    name: "School",
    description: "Small school",
    color: vec3.fromValues(0.0, 255.0, 0.0),
  },
  {
    name: "Shop",
    description: "Small shop",
    color: vec3.fromValues(0.0, 0.0, 255.0),
  },
  {
    name: "Park",
    description: "Small park",
    color: vec3.fromValues(255.0, 0.0, 255.0),
  },
];

function createCard() {
  var type = cardTypes[Math.floor(Math.random()*cardTypes.length)];

  var card = document.createElement("DIV");
  card.classList.add("card")

  var header = document.createElement("DIV");
  header.classList.add("card-header");
  header.innerText = type.name;
  card.appendChild(header);
  
  var description = document.createElement("DIV");
  description.classList.add("card-description");
  description.innerText = type.description;
  card.appendChild(description);

  var footer = document.createElement("DIV");
  footer.classList.add("card-footer");
  footer.innerText = "+HH";
  card.appendChild(footer);


  var background = type.color;
  var lightBackground = vec3.create();
  var limit = 200.0;
  vec3.max(lightBackground, background, vec3.fromValues(limit, limit, limit));
  
  header.style.background = cssColor(background);
  description.style.background = cssColor(lightBackground);
  footer.style.background = cssColor(background);

  return card;
}

function addCard(board, card, x, y) {
  card.style.position = "absolute";
  card.style.top = y * 340;
  card.style.left = x * 244;
  card.style.zIndex = x+y;
  board.appendChild(card);
}


function addHandCard(hand, card) {
  hand.appendChild(card);
}

function cssColor(rgb) {
  return "rgb("+Array.prototype.join.call(rgb, ",")+")";
}

function main() {
  var board=document.getElementById("board");
  var hand=document.getElementById("hand");
  var screen=document.getElementById("screen");
  var transform = mat2d.create();

  var updateTransform = function() {
    board.style.transform = "matrix("+Array.prototype.join.call(transform, ",")+")";
  };

  screen.onmousemove = function(e) {
    if(e.buttons === 1) {
      var translation = mat2d.create();
      mat2d.fromTranslation(translation, vec2.fromValues(e.movementX, e.movementY));
      mat2d.multiply(transform, translation, transform);
      updateTransform();
    }
    e.preventDefault();
  }
  window.onmousedown = function(e) {
    e.preventDefault();
  }
  window.onmousewheel = function(e) {
    var scaleDelta = Math.pow(1.5, e.wheelDelta/120);
    mat2d.scale(transform, transform, vec2.fromValues(scaleDelta, scaleDelta));
    updateTransform();
    e.preventDefault();
  }
  updateTransform();

  for(var y=0;y<20;y++) {
    for(var x=0;x<20;x++) {
      addCard(board, createCard(), x, y);
    }
  }

  for(var y=0;y<10;y++) {
    addHandCard(hand, createCard());
  }

}
