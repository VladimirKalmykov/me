(() => {
  const container = document.getElementById("canvas-container");
  if (
    !container ||
    !window.THREE ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  let viewWidth = container.clientWidth;
  let viewHeight = container.clientHeight;
  if (!viewWidth || !viewHeight) return;

  // --- НАСТРОЙКИ ---
  const CONFIG = {
    maxNodes: 35,
    nodeMinLife: 30000,
    nodeMaxLife: 90000,
    linkMinLife: 15000,
    linkMaxLife: 45000,
    nodeSize: 4,
    colorSignal: "#79e1e4",
    colorSignalDim: "#2e777d",
    colorFocus: "#b9faff",
    maxLinkDistX: 800,
    maxLinkDistY: 120,
    singleEdgeMaxDist: 120,
    horizontalTolerance: 5,
    clusterRadius: 300, // радиус поиска для объединения
    maxFormations: 3, // НОВОЕ: Максимальное количество фигур на экране
    formationDelay: 3000, // НОВОЕ: Сколько мс вершина ждет связи (3 сек)
    maxLinks: 12, // Не больше 12 линий на всем экране
    maxNodeLinks: 2, // Одна вершина может иметь не больше 2 связей
    maxDecorations: 4, // Не больше 4 квадратов/кругов на весь экран одновременно
    decoAllowProbability: 0.5, // 50/50: шанс при рождении вершины, что она в принципе может рисовать декор
    decoSpawnChance: 0.0005, // Очень низкий шанс старта анимации каждый кадр (вместо старых 0.003)
  };

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    0,
    viewWidth,
    0,
    viewHeight,
    -1,
    1,
  );
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch {
    return;
  }
  renderer.setSize(viewWidth, viewHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  container.appendChild(renderer.domElement);

  let nodes = [];
  let links = [];
  let formations = [];

  function getActiveDecorationsCount() {
    return nodes.filter((n) => n.decoType !== null).length;
  }

  function getActiveCirclesCount() {
    return nodes.filter((n) => n.decoType === "circle").length;
  }

  // Глобальный счетчик активных кругов (не больше 3)
  function getActiveCirclesCount() {
    return nodes.filter((n) => n.decoType === "circle").length;
  }

  // Вспомогательные функции для генерации точек геометрии
  function createCirclePoints(radius, segments = 40) {
    return new THREE.EllipseCurve(
      0,
      0,
      radius,
      radius,
      0,
      Math.PI * 2,
      false,
      0,
    ).getPoints(segments);
  }

  function createSquarePoints(radius, segmentsPerEdge = 10) {
    const pts = [];
    const corners = [
      { x: -radius, y: -radius },
      { x: radius, y: -radius },
      { x: radius, y: radius },
      { x: -radius, y: radius },
      { x: -radius, y: -radius },
    ];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < segmentsPerEdge; j++) {
        const t = j / segmentsPerEdge;
        pts.push(
          new THREE.Vector2(
            corners[i].x + (corners[i + 1].x - corners[i].x) * t,
            corners[i].y + (corners[i + 1].y - corners[i].y) * t,
          ),
        );
      }
    }
    pts.push(new THREE.Vector2(corners[4].x, corners[4].y));
    return pts;
  }

  // --- КЛАСС ВЕРШИНЫ ---
  class NeuralNode {
    constructor(x = null, y = null, now = Date.now()) {
      this.x = x !== null ? x : Math.random() * viewWidth;
      this.y = y !== null ? y : Math.random() * viewHeight;

      // Для формаций (анимация сдвига)
      this.formation = null;
      this.linksCount = 0;

      this.birth = now;
      this.lifetime =
        CONFIG.nodeMinLife +
        Math.random() * (CONFIG.nodeMaxLife - CONFIG.nodeMinLife);
      this.death = this.birth + this.lifetime;

      this.isFlashed = false;
      this.flashTime = 0;

      // 3. Рандомизация базы
      this.baseScale = 1.0 + Math.random() * 0.4;
      this.baseOpacity = 0.15 + Math.random() * 0.25;

      const geom = new THREE.PlaneGeometry(CONFIG.nodeSize, CONFIG.nodeSize);
      this.mat = new THREE.MeshBasicMaterial({
        color: CONFIG.colorSignalDim,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });

      this.mesh = new THREE.Mesh(geom, this.mat);
      this.mesh.scale.set(this.baseScale, this.baseScale, 1);
      this.mesh.position.set(this.x, viewHeight - this.y, 0);
      scene.add(this.mesh);

      // Состояние декорации
      this.decoType = null;
      this.decoMesh = null;
      this.decoState = null;

      // ... (где-то после инициализации this.isFlashed)
      // Выдаем разрешение на декор при рождении вершины (50/50 из конфига)
      this.canHaveDeco = Math.random() < CONFIG.decoAllowProbability;

      // Состояние декорации
      this.decoType = null;
    }

    startDecoration(type, now) {
      this.decoType = type;
      const radius = 6 + Math.random() * 6; // диаметр 12-24px
      const points =
        type === "circle"
          ? createCirclePoints(radius)
          : createSquarePoints(radius);

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: CONFIG.colorSignal,
        transparent: true,
        opacity: 0.6,
      });

      this.decoMesh = new THREE.Line(geometry, material);
      // Добавляем внутрь mesh вершины, чтобы декор двигался вместе с ней
      this.mesh.add(this.decoMesh);

      this.decoState = {
        start: now,
        drawDuration: 2000 + Math.random() * 2000,
        holdDuration: 1000 + Math.random() * 2000,
        fadeDuration: 1000,
        pointsCount: points.length,
      };
    }

    updateDecoration(now) {
      const s = this.decoState;
      const age = now - s.start;
      const geo = this.decoMesh.geometry;

      if (age < s.drawDuration) {
        // Рисуем
        const progress = age / s.drawDuration;
        geo.setDrawRange(0, Math.floor(progress * s.pointsCount));
      } else if (age < s.drawDuration + s.holdDuration) {
        // Держим
        geo.setDrawRange(0, s.pointsCount);
      } else if (age < s.drawDuration + s.holdDuration + s.fadeDuration) {
        // Исчезаем, стираясь с начала (эффект хвоста змейки)
        const fadeProgress =
          (age - s.drawDuration - s.holdDuration) / s.fadeDuration;
        geo.setDrawRange(
          Math.floor(fadeProgress * s.pointsCount),
          s.pointsCount,
        );
      } else {
        // Завершаем
        this.mesh.remove(this.decoMesh);
        this.decoMesh.geometry.dispose();
        this.decoMesh.material.dispose();
        this.decoMesh = null;
        this.decoType = null;
        this.decoState = null;
      }
    }

    update(now) {
      const age = now - this.birth;
      const timeLeft = this.death - now;

      // Синхронизация позиции (важно для работы формаций)
      this.mesh.position.set(this.x, viewHeight - this.y, 0);

      let currentOpacity = this.baseOpacity;
      if (age < 1500) currentOpacity *= age / 1500;
      else if (timeLeft < 1500) currentOpacity *= timeLeft / 1500;

      if (this.isFlashed) {
        const flashAge = now - this.flashTime;
        if (flashAge < 1200) {
          const progress = flashAge / 1200;
          this.mat.color.set(CONFIG.colorFocus);
          this.mat.opacity = currentOpacity * (0.8 + (1.0 - progress) * 1.2);
        } else {
          this.isFlashed = false;
          this.mat.color.set(CONFIG.colorSignalDim);
        }
      } else {
        this.mat.color.set(CONFIG.colorSignalDim);
        this.mat.opacity = currentOpacity;
      }

      // Проверяем: есть ли разрешение, свободна ли вершина и сработал ли рандом
      if (
        this.canHaveDeco &&
        !this.decoType &&
        !this.formation &&
        Math.random() < CONFIG.decoSpawnChance
      ) {
        // Проверяем глобальный лимит на количество декораций
        if (getActiveDecorationsCount() < CONFIG.maxDecorations) {
          const canBeCircle = getActiveCirclesCount() < 3;
          if (canBeCircle && Math.random() < 0.5) {
            this.startDecoration("circle", now);
          } else {
            this.startDecoration("square", now);
          }
        }
      }

      if (this.decoType) {
        this.updateDecoration(now);
      }

      return now < this.death;
    }

    triggerFlash(now) {
      this.isFlashed = true;
      this.flashTime = now;
    }

    destroy() {
      if (this.decoMesh) {
        this.mesh.remove(this.decoMesh);
        this.decoMesh.geometry.dispose();
        this.decoMesh.material.dispose();
      }
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
  }

  // --- КЛАСС ФОРМАЦИИ (ГРУППИРОВКА ОДИНОКИХ ВЕРШИН) ---
  class Formation {
    constructor(groupNodes) {
      this.nodes = groupNodes;
      this.nodes.forEach((n) => (n.formation = this));
      this.type = this.nodes.length; // 2, 3 или 4
      this.radius = 12 + Math.random() * 20; // от 12 до 32px
      this.angle = Math.random() * Math.PI * 2;
      this.centroid = this.calculateCentroid();
    }

    calculateCentroid() {
      let cx = 0,
        cy = 0;
      this.nodes.forEach((n) => {
        cx += n.x;
        cy += n.y;
      });
      return { x: cx / this.nodes.length, y: cy / this.nodes.length };
    }

    update(now) {
      // Если хотя бы одна вершина умирает, формация распадается
      if (this.nodes.some((n) => n.death <= now)) {
        this.nodes.forEach((n) => (n.formation = null));
        return false;
      }

      if (this.type === 3) {
        this.angle += 0.005; // Вращаем только треугольник
      }

      this.nodes.forEach((n, i) => {
        let tx = this.centroid.x;
        let ty = this.centroid.y;

        if (this.type === 2) {
          tx += i === 0 ? -this.radius : this.radius;
        } else if (this.type === 3) {
          const a = this.angle + (i * Math.PI * 2) / 3;
          tx += Math.cos(a) * this.radius;
          ty += Math.sin(a) * this.radius;
        } else if (this.type === 4) {
          const a = (i * Math.PI * 2) / 4 + Math.PI / 4;
          tx += Math.cos(a) * this.radius;
          ty += Math.sin(a) * this.radius;
        }

        // Плавно стягиваем к нужным координатам
        n.x += (tx - n.x) * 0.05;
        n.y += (ty - n.y) * 0.05;
      });

      return true;
    }
  }

  // --- КЛАСС СВЯЗИ ---
  class NeuralLink {
    constructor(nodeA, nodeB, now = Date.now()) {
      this.nodeA = nodeA;
      this.nodeB = nodeB;
      this.nodeA.linksCount++;
      this.nodeB.linksCount++;

      this.birth = now;
      this.lifetime =
        CONFIG.linkMinLife +
        Math.random() * (CONFIG.linkMaxLife - CONFIG.linkMinLife);
      this.death = this.birth + this.lifetime;

      this.pixelPoints = this.generateCircuitPath(nodeA, nodeB);
      this.threePoints = this.pixelPoints.map(
        (p) => new THREE.Vector3(p.x, viewHeight - p.y, 0),
      );

      const geometry = new THREE.BufferGeometry().setFromPoints(
        this.threePoints,
      );
      this.mat = new THREE.LineBasicMaterial({
        color: CONFIG.colorSignalDim,
        transparent: true,
        opacity: 0,
      });
      this.line = new THREE.Line(geometry, this.mat);
      scene.add(this.line);

      this.nodeA.triggerFlash(this.birth);
    }

    generateCircuitPath(a, b) {
      let pts = [];
      pts.push({ x: a.x, y: a.y });

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (
        absDy <= CONFIG.horizontalTolerance &&
        absDx <= CONFIG.singleEdgeMaxDist
      ) {
        pts.push({ x: b.x, y: b.y });
      } else {
        const diagonalWidth = absDy;
        const remainingX = absDx - diagonalWidth;
        const h1 = remainingX * 0.4;
        const startX = a.x + h1;
        const endX = startX + diagonalWidth;

        pts.push({ x: startX, y: a.y });
        pts.push({ x: endX, y: b.y });
        pts.push({ x: b.x, y: b.y });
      }
      return pts;
    }

    update(now) {
      const age = now - this.birth;
      const buildDuration = 4500;
      let progress = Math.min(age / buildDuration, 1);

      const totalSegments = this.threePoints.length - 1;
      const activeSegmentsCount = Math.ceil(progress * totalSegments);

      this.line.geometry.setDrawRange(
        0,
        Math.max(2, Math.min(this.threePoints.length, activeSegmentsCount + 1)),
      );

      if (
        progress >= 1.0 &&
        !this.nodeB.isFlashed &&
        now - this.birth < buildDuration + 100
      ) {
        this.nodeB.triggerFlash(now);
      }

      const timeLeft = this.death - now;
      let opacity = 0.15;
      if (progress < 1.0) opacity = progress * 0.3;
      if (timeLeft < 1500) opacity = (timeLeft / 1500) * 0.15;
      this.mat.opacity = opacity;

      const isGlowing =
        progress < 1.0 ||
        (this.nodeB.isFlashed && now - this.nodeB.flashTime < 600);
      this.mat.color.set(
        isGlowing ? CONFIG.colorSignal : CONFIG.colorSignalDim,
      );

      return now < this.death;
    }

    destroy() {
      this.nodeA.linksCount--;
      this.nodeB.linksCount--;
      scene.remove(this.line);
      this.line.geometry.dispose();
      this.line.material.dispose();
    }
  }

  // --- МЕНЕДЖЕР СПАВНА И ЛОГИКИ ---
  function spawnLogic(now) {
    if (nodes.length < CONFIG.maxNodes) {
      nodes.push(new NeuralNode(null, null, now));
    }

    // 1. УМНАЯ, НО СДЕРЖАННАЯ ГЕНЕРАЦИЯ СВЯЗЕЙ
    // Шанс снижен до 2% за кадр, и проверяем глобальный лимит связей
    if (
      nodes.length > 5 &&
      links.length < CONFIG.maxLinks &&
      Math.random() < 0.02
    ) {
      // Берем только те узлы, у которых не исчерпан лимит связей (не больше 2)
      const availableNodes = nodes.filter(
        (n) => !n.formation && n.linksCount < CONFIG.maxNodeLinks,
      );

      if (availableNodes.length > 1) {
        const nA =
          availableNodes[Math.floor(Math.random() * availableNodes.length)];

        const validNeighbors = availableNodes.filter((nB) => {
          if (nA === nB) return false;
          if (nA.x >= nB.x) return false;

          const absDx = nB.x - nA.x;
          const absDy = Math.abs(nB.y - nA.y);

          if (absDy > CONFIG.maxLinkDistY || absDx > CONFIG.maxLinkDistX)
            return false;

          const isPureHorizontal = absDy <= CONFIG.horizontalTolerance;
          if (!isPureHorizontal && absDx <= absDy) return false;

          const exists = links.some(
            (l) =>
              (l.nodeA === nA && l.nodeB === nB) ||
              (l.nodeA === nB && l.nodeB === nA),
          );
          return !exists;
        });

        if (validNeighbors.length > 0) {
          const nB =
            validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
          links.push(new NeuralLink(nA, nB, now));
        }
      }
    }

    // Продление жизни связям
    links.forEach((l) => {
      if (l.death - now < 100 && Math.random() < 0.25) {
        if (l.nodeB.death - now < 3000)
          l.nodeB.death = now + CONFIG.nodeMinLife;
      }
    });

    // 2. ЛОГИКА ФОРМАЦИЙ (Работает по остаточному принципу)
    if (formations.length < CONFIG.maxFormations && Math.random() < 0.05) {
      // Берем только "одинокие" и "созревшие" вершины (без связей, не в форме, старше formationDelay)
      const freeNodes = nodes.filter(
        (n) =>
          n.linksCount === 0 &&
          !n.formation &&
          now - n.birth > CONFIG.formationDelay,
      );

      for (let i = 0; i < freeNodes.length; i++) {
        if (freeNodes[i].formation) continue;

        let cluster = [freeNodes[i]];
        for (let j = i + 1; j < freeNodes.length; j++) {
          if (cluster.length >= 4) break; // Максимум 4 точки (квадрат)
          if (freeNodes[j].formation) continue;

          const dx = freeNodes[j].x - freeNodes[i].x;
          const dy = freeNodes[j].y - freeNodes[i].y;

          // Если вершина рядом - берем в группу
          if (dx * dx + dy * dy < CONFIG.clusterRadius * CONFIG.clusterRadius) {
            cluster.push(freeNodes[j]);
          }
        }

        if (cluster.length >= 2) {
          formations.push(new Formation(cluster));
          break; // Создаем не больше одной новой формации за один кадр
        }
      }
    }
  }

  let frameId = 0;
  let active = false;
  function advance(now) {
    spawnLogic(now);

    nodes = nodes.filter((node) => {
      const isAlive = node.update(now);
      if (!isAlive) node.destroy();
      return isAlive;
    });

    links = links.filter((link) => {
      const parentsAlive =
        nodes.includes(link.nodeA) && nodes.includes(link.nodeB);
      const isAlive = link.update(now) && parentsAlive;
      if (!isAlive) link.destroy();
      return isAlive;
    });

    formations = formations.filter((f) => f.update(now));
  }

  // Build a lived-in network before the canvas gets its first visible frame.
  // Simulated timestamps keep fades, line growth and formation delays coherent.
  const readyAt = Date.now();
  const warmupDuration = 5000 + Math.random() * 5000;
  const warmupStep = 1000 / 60;
  for (let elapsed = 0; elapsed < warmupDuration; elapsed += warmupStep) {
    advance(readyAt - warmupDuration + elapsed);
  }
  advance(readyAt);
  renderer.render(scene, camera);

  function animate() {
    if (!active) return;
    frameId = requestAnimationFrame(animate);
    advance(Date.now());

    renderer.render(scene, camera);
  }

  const resizeObserver = new ResizeObserver(() => {
    viewWidth = container.clientWidth;
    viewHeight = container.clientHeight;
    renderer.setSize(viewWidth, viewHeight);
    camera.right = viewWidth;
    camera.bottom = viewHeight;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(container);

  function setActive(visible) {
    const shouldRun = visible && !document.hidden;
    if (shouldRun === active) return;
    active = shouldRun;
    if (active) animate();
    else cancelAnimationFrame(frameId);
  }
  const visibility = new IntersectionObserver(([entry]) =>
    setActive(entry.isIntersecting),
  );
  visibility.observe(container);
  document.addEventListener("visibilitychange", () => {
    const bounds = container.getBoundingClientRect();
    setActive(bounds.bottom > 0 && bounds.top < innerHeight);
  });
})();
