// Wrenfield Studio — shared site behaviour: reveal-on-scroll, custom cursor,
// magnetic buttons, tilt cards, panel glow, mobile nav, active link, year stamp.
(function () {
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- reveal on scroll (fade/slide + line-reveal headings) ---------- */
  var revealTargets = document.querySelectorAll(".reveal, .mask-reveal, .reveal-fill");
  if (!prefersReduced && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- signature seal draw-in (home hero) ---------- */
  var seal = document.querySelector(".signature-seal");
  if (seal) {
    var drawEls = seal.querySelectorAll(".draw");
    if (prefersReduced) {
      seal.classList.add("is-drawn");
    } else {
      drawEls.forEach(function (el) {
        var len = el.getTotalLength();
        el.style.strokeDasharray = len;
        el.style.strokeDashoffset = len;
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          drawEls.forEach(function (el) {
            el.style.strokeDashoffset = "0";
          });
          seal.classList.add("is-drawn");
        });
      });
    }
  }

  /* ---------- custom cursor ---------- */
  if (fineHover && !prefersReduced) {
    var dot = document.createElement("div");
    dot.className = "cursor-dot";
    var ring = document.createElement("div");
    ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add("has-cursor");

    var ringX = 0,
      ringY = 0,
      targetX = 0,
      targetY = 0;

    window.addEventListener("mousemove", function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      dot.style.left = targetX + "px";
      dot.style.top = targetY + "px";
      dot.classList.add("is-active");
      ring.classList.add("is-active");
    });

    function tick() {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      ring.style.left = ringX + "px";
      ring.style.top = ringY + "px";
      requestAnimationFrame(tick);
    }
    tick();

    document.querySelectorAll("a, button, [data-cursor-hover]").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        ring.classList.add("is-hover");
      });
      el.addEventListener("mouseleave", function () {
        ring.classList.remove("is-hover");
      });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (fineHover && !prefersReduced) {
    document.querySelectorAll(".magnetic").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var relX = e.clientX - (r.left + r.width / 2);
        var relY = e.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + relX * 0.28 + "px," + relY * 0.35 + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* ---------- tilt cards ---------- */
  if (fineHover && !prefersReduced) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateX(" + (py * -7).toFixed(2) + "deg) rotateY(" + (px * 7).toFixed(2) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------- cursor-reactive panel glow ---------- */
  if (fineHover && !prefersReduced) {
    document.querySelectorAll(".panel-ink, .panel-forest").forEach(function (panel) {
      var glow = panel.querySelector(".panel-glow");
      if (!glow) return;
      panel.addEventListener("mouseenter", function () {
        glow.classList.add("is-active");
      });
      panel.addEventListener("mouseleave", function () {
        glow.classList.remove("is-active");
      });
      panel.addEventListener("mousemove", function (e) {
        var r = panel.getBoundingClientRect();
        glow.style.setProperty("--mx", e.clientX - r.left + "px");
        glow.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }

  /* ---------- count-up stats ---------- */
  var stats = document.querySelectorAll("[data-count]");
  if (stats.length && "IntersectionObserver" in window) {
    var statIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          statIo.unobserve(el);
          var target = parseInt(el.getAttribute("data-count"), 10);
          if (prefersReduced || !target) {
            el.textContent = el.getAttribute("data-count");
            return;
          }
          var start = null;
          var duration = 1100;
          function step(ts) {
            if (!start) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target);
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.6 }
    );
    stats.forEach(function (el) {
      statIo.observe(el);
    });
  }

  /* ---------- mobile nav ---------- */
  var toggle = document.getElementById("nav-toggle");
  var panel = document.getElementById("mobile-panel");
  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var open = panel.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- active nav link ---------- */
  var here = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach(function (link) {
    var target = link.getAttribute("href");
    if (target === here || (here === "" && target === "index.html")) {
      link.classList.add("is-active");
    }
  });

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
