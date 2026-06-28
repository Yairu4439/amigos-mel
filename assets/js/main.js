(function () {
  const screens = Array.from(document.querySelectorAll(".screen"));
  const dots = Array.from(document.querySelectorAll(".dot"));
  const skyCanvas = document.getElementById("skyCanvas");
  const sky = skyCanvas.getContext("2d");
  const petalLayer = document.getElementById("petalLayer");
  const startGameButton = document.getElementById("startGame");
  const retryGameButton = document.getElementById("retryGame");
  const gameField = document.getElementById("gameField");
  const scoreText = document.getElementById("scoreText");
  const galaxyCanvases = Array.from(document.querySelectorAll("[data-galaxy]"));

  let currentScreen = 0;
  let skyWidth = 0;
  let skyHeight = 0;
  let stars = [];
  let comets = [];
  let nextCometAt = 0;
  let score = 0;
  const galaxyInstances = galaxyCanvases.map((canvas) => ({
    canvas,
    context: canvas.getContext("2d"),
    particles: [],
    start: 0,
    ready: false,
  }));

  const piecePositions = [
    [18, 24],
    [66, 20],
    [35, 34],
    [76, 43],
    [20, 55],
    [58, 60],
    [31, 75],
    [72, 78],
  ];

  function setScreen(index) {
    currentScreen = Math.max(0, Math.min(index, screens.length - 1));
    screens.forEach((screen, screenIndex) => {
      screen.classList.toggle("is-active", screenIndex === currentScreen);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === Math.min(currentScreen, dots.length - 1));
    });

    restartVisibleGalaxies();
  }

  function createPetals() {
    petalLayer.innerHTML = "";
    for (let i = 0; i < 34; i += 1) {
      const petal = document.createElement("span");
      const size = 9 + Math.random() * 13;
      petal.className = "petal";
      petal.style.setProperty("--x", `${3 + Math.random() * 94}vw`);
      petal.style.setProperty("--size", `${size}px`);
      petal.style.setProperty("--rot", `${Math.random() * 140}deg`);
      petal.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
      petal.style.setProperty("--time", `${8 + Math.random() * 8}s`);
      petal.style.setProperty("--delay", `${Math.random() * -12}s`);
      petalLayer.appendChild(petal);
    }

  }

  function easeInOut(value) {
    return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function resizeGalaxy(instance) {
    const rect = instance.canvas.getBoundingClientRect();
    const fallback = instance.canvas.classList.contains("mini-galaxy") ? 118 : instance.canvas.classList.contains("final-galaxy") ? 230 : 310;
    const width = rect.width || fallback;
    const height = rect.height || fallback;
    const scale = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    instance.canvas.width = Math.floor(width * scale);
    instance.canvas.height = Math.floor(height * scale);
    instance.context.setTransform(scale, 0, 0, scale, 0, 0);
    return { width, height };
  }

  function createGalaxyParticles(instance, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.36;
    const heartScale = Math.min(width, height) / 35;
    const count = Math.max(160, Math.floor(width * 0.7));

    instance.particles = Array.from({ length: count }, (_, particleIndex) => {
      const t = Math.random() * Math.PI * 2;
      const heartX = 16 * Math.pow(Math.sin(t), 3);
      const heartY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const radius = Math.sqrt(Math.random()) * maxRadius;
      const arm = particleIndex % 4;
      const angle = radius * 0.075 + arm * Math.PI * 0.5 + (Math.random() - 0.5) * 0.72;

      return {
        angle,
        radius,
        flat: 0.38 + Math.random() * 0.24,
        size: 0.85 + Math.random() * 1.75,
        speed: 0.55 + Math.random() * 0.9,
        glow: 0.45 + Math.random() * 0.55,
        targetX: centerX + heartX * heartScale,
        targetY: centerY + heartY * heartScale + 5,
        hue: Math.random() > 0.55 ? "255, 218, 226" : Math.random() > 0.45 ? "245, 205, 132" : "255, 250, 244",
      };
    });
  }

  function restartGalaxy(instance) {
    const { width, height } = resizeGalaxy(instance);
    createGalaxyParticles(instance, width, height);
    instance.start = performance.now();
    instance.ready = false;
    instance.canvas.closest("[data-galaxy-stage]")?.classList.remove("is-ready");
  }

  function restartVisibleGalaxies() {
    const activeScreen = screens[currentScreen];
    galaxyInstances.forEach((instance) => {
      if (activeScreen && activeScreen.contains(instance.canvas)) {
        restartGalaxy(instance);
      }
    });
  }

  function drawGalaxy(instance, time) {
    const width = instance.canvas.width / Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    const height = instance.canvas.height / Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    const centerX = width / 2;
    const centerY = height / 2;
    const elapsed = time - instance.start;
    const progress = Math.min(elapsed / 3000, 1);
    const morph = easeInOut(Math.max(0, (progress - 0.18) / 0.82));
    const spinTime = elapsed * 0.0017;
    const beat = progress >= 1 ? 1 + Math.sin((elapsed - 3000) * 0.0068) * 0.028 : 1;
    const ctx = instance.context;

    ctx.clearRect(0, 0, width, height);

    const core = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, Math.min(width, height) * 0.45);
    core.addColorStop(0, `rgba(255, 246, 223, ${0.2 + morph * 0.18})`);
    core.addColorStop(0.45, `rgba(216, 88, 117, ${0.1 + morph * 0.18})`);
    core.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, width, height);

    instance.particles.forEach((particle) => {
      const angle = particle.angle + spinTime * particle.speed + progress * 1.4;
      const radius = particle.radius * (1 - progress * 0.16);
      const galaxyX = centerX + Math.cos(angle) * radius;
      const galaxyY = centerY + Math.sin(angle) * radius * particle.flat;
      const pulseX = centerX + (particle.targetX - centerX) * beat;
      const pulseY = centerY + (particle.targetY - centerY) * beat;
      const x = galaxyX + (pulseX - galaxyX) * morph;
      const y = galaxyY + (pulseY - galaxyY) * morph;
      const alpha = (0.3 + particle.glow * 0.62) * (0.75 + morph * 0.25);

      ctx.beginPath();
      ctx.arc(x, y, particle.size + morph * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particle.hue}, ${alpha})`;
      ctx.shadowColor = `rgba(255, 190, 205, ${0.2 + morph * 0.46})`;
      ctx.shadowBlur = 8 + morph * 10;
      ctx.fill();
    });

    ctx.shadowBlur = 0;

    if (progress >= 1 && !instance.ready) {
      instance.ready = true;
      instance.canvas.closest("[data-galaxy-stage]")?.classList.add("is-ready");
    }
  }

  function drawGalaxyLoop(time) {
    galaxyInstances.forEach((instance) => drawGalaxy(instance, time));
    requestAnimationFrame(drawGalaxyLoop);
  }

  function resizeSky() {
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    skyWidth = window.innerWidth;
    skyHeight = window.innerHeight;
    skyCanvas.width = Math.floor(skyWidth * dpr);
    skyCanvas.height = Math.floor(skyHeight * dpr);
    skyCanvas.style.width = `${skyWidth}px`;
    skyCanvas.style.height = `${skyHeight}px`;
    sky.setTransform(dpr, 0, 0, dpr, 0, 0);

    const amount = Math.max(90, Math.floor((skyWidth * skyHeight) / 5200));
    stars = Array.from({ length: amount }, () => ({
      x: Math.random() * skyWidth,
      y: Math.random() * skyHeight,
      r: 0.45 + Math.random() * 1.65,
      a: 0.18 + Math.random() * 0.72,
      twinkle: 0.0015 + Math.random() * 0.0048,
    }));
  }

  function spawnComet(time, force = false) {
    if (!force && time < nextCometAt) {
      return;
    }
    if (!force && comets.length > 1) {
      return;
    }

    const fromLeft = Math.random() > 0.45;
    const startY = 34 + Math.random() * skyHeight * 0.42;
    const speed = 4.2 + Math.random() * 2.5;

    comets.push({
      x: fromLeft ? -90 : skyWidth + 90,
      y: startY,
      vx: fromLeft ? speed : -speed,
      vy: 1.2 + Math.random() * 1.1,
      life: 0,
      maxLife: 86 + Math.random() * 38,
      size: 1.3 + Math.random() * 1.4,
    });
    nextCometAt = time + 4500 + Math.random() * 4500;
  }

  function drawSky(time) {
    sky.clearRect(0, 0, skyWidth, skyHeight);

    const glow = sky.createRadialGradient(
      skyWidth * 0.5,
      skyHeight * 0.42,
      10,
      skyWidth * 0.5,
      skyHeight * 0.42,
      Math.max(skyWidth, skyHeight) * 0.72
    );
    glow.addColorStop(0, "rgba(255, 205, 220, 0.08)");
    glow.addColorStop(0.45, "rgba(217, 168, 79, 0.05)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    sky.fillStyle = glow;
    sky.fillRect(0, 0, skyWidth, skyHeight);

    stars.forEach((star) => {
      const alpha = Math.max(0.08, star.a + Math.sin(time * star.twinkle + star.x) * 0.22);
      sky.beginPath();
      sky.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      sky.fillStyle = `rgba(255, 250, 244, ${alpha})`;
      sky.fill();
    });

    spawnComet(time);
    comets = comets.filter((comet) => comet.life < comet.maxLife);
    comets.forEach((comet) => {
      comet.life += 1;
      comet.x += comet.vx;
      comet.y += comet.vy;

      const fade = 1 - comet.life / comet.maxLife;
      const tailX = comet.x - comet.vx * 15;
      const tailY = comet.y - comet.vy * 15;
      const trail = sky.createLinearGradient(comet.x, comet.y, tailX, tailY);
      trail.addColorStop(0, `rgba(255, 244, 218, ${0.88 * fade})`);
      trail.addColorStop(0.3, `rgba(255, 188, 205, ${0.42 * fade})`);
      trail.addColorStop(1, "rgba(255, 188, 205, 0)");

      sky.beginPath();
      sky.moveTo(comet.x, comet.y);
      sky.lineTo(tailX, tailY);
      sky.strokeStyle = trail;
      sky.lineWidth = 2.2 + comet.size;
      sky.lineCap = "round";
      sky.stroke();

      sky.beginPath();
      sky.arc(comet.x, comet.y, comet.size, 0, Math.PI * 2);
      sky.fillStyle = `rgba(255, 250, 244, ${fade})`;
      sky.shadowColor = `rgba(255, 220, 188, ${0.72 * fade})`;
      sky.shadowBlur = 14;
      sky.fill();
      sky.shadowBlur = 0;
    });

    requestAnimationFrame(drawSky);
  }

  function sparkleAt(x, y) {
    for (let i = 0; i < 12; i += 1) {
      const spark = document.createElement("span");
      const angle = Math.random() * Math.PI * 2;
      const distance = 28 + Math.random() * 46;
      spark.className = "spark";
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
      spark.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
      gameField.appendChild(spark);
      window.setTimeout(() => spark.remove(), 650);
    }
  }

  function createPiece(index) {
    const piece = document.createElement("button");
    const [left, top] = piecePositions[index];
    piece.className = "heart-piece";
    piece.type = "button";
    piece.setAttribute("aria-label", "Pedacito luminoso");
    piece.style.left = `${left}%`;
    piece.style.top = `${top}%`;
    piece.style.animationDelay = `${index * -0.28}s`;

    piece.addEventListener("click", () => {
      if (piece.classList.contains("is-caught")) {
        return;
      }
      const rect = piece.getBoundingClientRect();
      const fieldRect = gameField.getBoundingClientRect();
      sparkleAt(rect.left - fieldRect.left + rect.width / 2, rect.top - fieldRect.top + rect.height / 2);
      piece.classList.add("is-caught");
      score += 1;
      scoreText.textContent = `${score} / 8`;

      window.setTimeout(() => piece.remove(), 420);
      if (score >= 8) {
        window.setTimeout(() => setScreen(6), 780);
      }
    });

    gameField.appendChild(piece);
  }

  function startGame() {
    score = 0;
    scoreText.textContent = "0 / 8";
    gameField.hidden = false;
    gameField.querySelectorAll(".heart-piece, .spark").forEach((item) => item.remove());
    galaxyInstances.forEach((instance) => {
      if (gameField.contains(instance.canvas)) {
        restartGalaxy(instance);
      }
    });
    piecePositions.forEach((_, index) => createPiece(index));
  }

  document.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => setScreen(currentScreen + 1));
  });

  document.querySelectorAll("[data-restart]").forEach((button) => {
    button.addEventListener("click", () => {
      gameField.hidden = true;
      setScreen(0);
    });
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const next = Number(dot.dataset.jump);
      if (Number.isFinite(next)) {
        setScreen(next);
      }
    });
  });

  startGameButton.addEventListener("click", startGame);
  retryGameButton.addEventListener("click", startGame);

  window.addEventListener("resize", resizeSky);
  window.addEventListener("resize", () => galaxyInstances.forEach(restartGalaxy));

  createPetals();
  resizeSky();
  galaxyInstances.forEach(restartGalaxy);
  requestAnimationFrame(drawSky);
  requestAnimationFrame(drawGalaxyLoop);
})();
