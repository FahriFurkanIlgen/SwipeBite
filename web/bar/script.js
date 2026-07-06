/* SwipeBar landing — lightweight swipe deck + chip toggle (no dependencies) */
(function () {
  "use strict";

  var COCKTAILS = [
    { emoji: "🍸", name: "Espresso Martini", desc: "Vodka · coffee · liqueur", tag: "Strong" },
    { emoji: "🍹", name: "Piña Colada", desc: "Rum · pineapple · coconut", tag: "Refreshing" },
    { emoji: "🥃", name: "Whiskey Sour", desc: "Bourbon · lemon · sugar", tag: "Sour" },
    { emoji: "🍷", name: "Negroni", desc: "Gin · Campari · vermouth", tag: "Classic" },
    { emoji: "🌿", name: "Mojito", desc: "Rum · mint · lime · soda", tag: "Herbal" },
    { emoji: "🍾", name: "Aperol Spritz", desc: "Aperol · prosecco · soda", tag: "Bubbly" },
    { emoji: "🍋", name: "Tom Collins", desc: "Gin · lemon · soda", tag: "Refreshing" },
    { emoji: "🍸", name: "Cosmopolitan", desc: "Vodka · cranberry · lime", tag: "Classic" },
  ];

  var deck = document.getElementById("deck");
  if (!deck) return;

  var index = 0;
  var MAX_VISIBLE = 3;

  function buildCard(data) {
    var card = document.createElement("div");
    card.className = "card-drink";
    card.innerHTML =
      '<div class="card-drink__stamp card-drink__stamp--yes">LIKE</div>' +
      '<div class="card-drink__stamp card-drink__stamp--no">PASS</div>' +
      '<div class="card-drink__emoji">' + data.emoji + "</div>" +
      '<span class="card-drink__tag">' + data.tag + "</span>" +
      "<h4>" + data.name + "</h4>" +
      "<p>" + data.desc + "</p>";
    return card;
  }

  function render() {
    deck.innerHTML = "";
    for (var i = MAX_VISIBLE - 1; i >= 0; i--) {
      var data = COCKTAILS[(index + i) % COCKTAILS.length];
      var card = buildCard(data);
      var scale = 1 - i * 0.05;
      var offset = i * 14;
      card.style.transform = "translateY(" + offset + "px) scale(" + scale + ")";
      card.style.zIndex = String(MAX_VISIBLE - i);
      card.style.opacity = i === MAX_VISIBLE - 1 ? "0.6" : "1";
      if (i === 0) attachDrag(card);
      deck.appendChild(card);
    }
  }

  function fly(card, dir) {
    var stamp = card.querySelector(
      dir > 0 ? ".card-drink__stamp--yes" : ".card-drink__stamp--no"
    );
    if (stamp) stamp.style.opacity = "1";
    card.style.transition = "transform .4s ease, opacity .4s ease";
    card.style.transform =
      "translate(" + dir * 520 + "px, -40px) rotate(" + dir * 22 + "deg)";
    card.style.opacity = "0";
    setTimeout(function () {
      index = (index + 1) % COCKTAILS.length;
      render();
    }, 300);
  }

  function attachDrag(card) {
    var startX = 0,
      startY = 0,
      dx = 0,
      dy = 0,
      dragging = false;

    function down(x, y) {
      dragging = true;
      startX = x;
      startY = y;
      card.style.transition = "none";
    }
    function move(x, y) {
      if (!dragging) return;
      dx = x - startX;
      dy = y - startY;
      card.style.transform =
        "translate(" + dx + "px," + dy + "px) rotate(" + dx / 18 + "deg)";
      var yes = card.querySelector(".card-drink__stamp--yes");
      var no = card.querySelector(".card-drink__stamp--no");
      if (yes) yes.style.opacity = dx > 30 ? String(Math.min(1, dx / 120)) : "0";
      if (no) no.style.opacity = dx < -30 ? String(Math.min(1, -dx / 120)) : "0";
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      card.style.transition = "transform .35s ease, opacity .35s ease";
      if (Math.abs(dx) > 110) {
        fly(card, dx > 0 ? 1 : -1);
      } else {
        card.style.transform = "translateY(0) scale(1)";
        var yes = card.querySelector(".card-drink__stamp--yes");
        var no = card.querySelector(".card-drink__stamp--no");
        if (yes) yes.style.opacity = "0";
        if (no) no.style.opacity = "0";
      }
      dx = dy = 0;
    }

    card.addEventListener("mousedown", function (e) {
      down(e.clientX, e.clientY);
    });
    window.addEventListener("mousemove", function (e) {
      move(e.clientX, e.clientY);
    });
    window.addEventListener("mouseup", up);
    card.addEventListener(
      "touchstart",
      function (e) {
        down(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: true }
    );
    card.addEventListener(
      "touchmove",
      function (e) {
        move(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: true }
    );
    card.addEventListener("touchend", up);
  }

  // Buttons
  document.querySelectorAll(".deck__buttons .circle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var top = deck.querySelector(".card-drink");
      if (!top) return;
      fly(top, btn.getAttribute("data-action") === "yes" ? 1 : -1);
    });
  });

  // Keyboard
  window.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    var top = deck.querySelector(".card-drink");
    if (top) fly(top, e.key === "ArrowRight" ? 1 : -1);
  });

  // Chip toggle
  document.querySelectorAll(".chips .chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      document
        .querySelectorAll(".chips .chip")
        .forEach(function (c) {
          c.classList.remove("chip--active");
        });
      chip.classList.add("chip--active");
    });
  });

  render();
})();
