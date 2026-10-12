const chapters = [...document.querySelectorAll("[data-chapter]")];
const siteLinks = [...document.querySelectorAll("[data-target]")];
const timeline = document.querySelector(".timeline");
const skills = document.querySelector(".skills");
const skillScenes = [...document.querySelectorAll("[data-skill-scene]")];
const skillLinks = [...document.querySelectorAll("[data-skill-target]")];

if (skills && skillScenes.length && window.gsap) {
  const motion = window.gsap;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compact = window.matchMedia("(max-width: 680px)");
  const skillNav = document.querySelector(".skills-links");
  const skillNavBar = document.querySelector(".skills-nav");
  let activeIndex = -1;
  let stepDistance = 0;
  let scrollDistance = 0;
  let sceneTimeline = null;
  let renderFrame = 0;

  function stageTop() {
    return window.scrollY + skills.getBoundingClientRect().top;
  }

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    const currentId = skillScenes[index].id;
    skillScenes.forEach((scene, sceneIndex) => {
      const active = sceneIndex === index;
      scene.classList.toggle("is-active", active);
      scene.inert = !compact.matches && !active;
      if (compact.matches || active) scene.removeAttribute("aria-hidden");
      else scene.setAttribute("aria-hidden", "true");
    });
    for (const link of skillLinks) {
      const active = link.dataset.skillTarget === currentId;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
      if (active && window.innerWidth <= 680) {
        const navRect = skillNav.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        skillNav.scrollLeft +=
          linkRect.left - navRect.left - (navRect.width - linkRect.width) / 2;
      }
    }
  }

  function buildTimeline() {
    sceneTimeline?.kill();
    motion.set(skillScenes, { autoAlpha: 0, yPercent: 100 });
    skillScenes.forEach((scene, index) =>
      motion.set(scene, { zIndex: index + 1 }),
    );
    motion.set(
      skillScenes.map((scene) => scene.querySelector(".skill-content")),
      { opacity: 0, x: 120 },
    );
    motion.set(skillScenes[0], { autoAlpha: 1, yPercent: 0 });
    motion.set(skillScenes[0].querySelector(".skill-content"), {
      opacity: 1,
      x: 0,
    });
    sceneTimeline = reducedMotion.matches
      ? null
      : motion.timeline({ paused: true, defaults: { ease: "none" } });
    if (sceneTimeline) {
      for (let index = 0; index < skillScenes.length - 1; index++) {
        const outgoing = skillScenes[index];
        const incoming = skillScenes[index + 1];
        sceneTimeline.set(incoming, { autoAlpha: 1 }, index + 0.001);
        sceneTimeline.to(incoming, { yPercent: 0, duration: 0.95 }, index);
        sceneTimeline.to(
          incoming.querySelector(".skill-content"),
          { opacity: 1, x: 0, duration: 0.5 },
          index + 0.2,
        );
        sceneTimeline.to(
          outgoing,
          { yPercent: -100, duration: 0.23 },
          index + 0.72,
        );
        sceneTimeline.to(
          outgoing.querySelector(".skill-content"),
          { opacity: 0, duration: 0.23 },
          index + 0.72,
        );
        sceneTimeline.set(outgoing, { autoAlpha: 0 }, index + 0.95);
      }
      sceneTimeline.to({}, { duration: 0.15 }, skillScenes.length - 1);
    }
    activeIndex = -1;
    render();
  }

  function render() {
    if (compact.matches) {
      const marker = skillNavBar.getBoundingClientRect().height + 80;
      let index = 0;
      skillScenes.forEach((scene, sceneIndex) => {
        if (scene.getBoundingClientRect().top <= marker) index = sceneIndex;
      });
      setActive(index);
      return;
    }
    const position =
      Math.max(0, Math.min(scrollDistance, window.scrollY - stageTop())) /
      stepDistance;
    const index = Math.min(skillScenes.length - 1, Math.floor(position + 0.5));
    if (sceneTimeline) sceneTimeline.time(position, false);
    else if (index !== activeIndex) {
      motion.set(skillScenes, { autoAlpha: 0, x: 0, yPercent: 0 });
      motion.set(skillScenes[index], { autoAlpha: 1 });
      motion.set(
        skillScenes.map((scene) => scene.querySelector(".skill-content")),
        { opacity: 1, x: 0 },
      );
    }
    setActive(index);
  }

  function queueRender() {
    if (renderFrame) return;
    renderFrame = requestAnimationFrame(() => {
      renderFrame = 0;
      render();
    });
  }

  function measure() {
    if (compact.matches) {
      queueRender();
      return;
    }
    stepDistance = Math.max(600, Math.round(window.innerHeight * 0.75));
    scrollDistance = (skillScenes.length - 0.85) * stepDistance;
    skills.style.setProperty("--skills-scroll-distance", `${scrollDistance}px`);
    queueRender();
  }

  function hashIndex() {
    if (location.hash === "#expertise") return 0;
    return skillScenes.findIndex(
      (scene) => scene.id === location.hash.slice(1),
    );
  }

  function syncHash() {
    if (compact.matches) {
      queueRender();
      return;
    }
    const index = hashIndex();
    if (index < 0) return;
    window.scrollTo(0, stageTop() + index * stepDistance);
    queueRender();
  }

  function switchMode() {
    activeIndex = -1;
    if (compact.matches) {
      sceneTimeline?.kill();
      sceneTimeline = null;
      skills.classList.remove("is-interactive");
      skills.style.removeProperty("--skills-scroll-distance");
      motion.set(skillScenes, { clearProps: "all" });
      motion.set(
        skillScenes.map((scene) => scene.querySelector(".skill-content")),
        { clearProps: "all" },
      );
      skillScenes.forEach((scene) => {
        scene.inert = false;
        scene.removeAttribute("aria-hidden");
      });
      document.documentElement.style.removeProperty("scroll-behavior");
      queueRender();
    } else {
      document.documentElement.style.scrollBehavior = "auto";
      measure();
      skills.classList.add("is-interactive");
      buildTimeline();
    }
  }

  switchMode();
  window.addEventListener("scroll", queueRender, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  compact.addEventListener("change", switchMode);
  reducedMotion.addEventListener("change", () => {
    if (!compact.matches) buildTimeline();
  });
  skillLinks.forEach((link) =>
    link.addEventListener("click", (event) => {
      if (compact.matches) return;
      event.preventDefault();
      history.pushState(null, "", link.hash);
      syncHash();
    }),
  );
  window.addEventListener("hashchange", syncHash);
  window.addEventListener("popstate", syncHash);
  if (hashIndex() >= 0) {
    if (document.readyState === "complete") syncHash();
    else window.addEventListener("load", syncHash, { once: true });
  }
}

if (chapters.length && timeline) {
  let lastChapter = null;
  const timelineNav = document.querySelector(".timeline-nav");
  function updateTimeline() {
    const bounds = timeline.getBoundingClientRect();
    if (bounds.top > window.innerHeight || bounds.bottom < 0) return;
    const marker = window.innerHeight * 0.45;
    let activeId = chapters[0].id;
    for (const chapter of chapters) {
      if (chapter.getBoundingClientRect().top <= marker) activeId = chapter.id;
    }
    if (activeId === lastChapter) return;
    lastChapter = activeId;
    for (const link of siteLinks) {
      const active = link.dataset.target === activeId;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "location");
        const from = Number(link.style.getPropertyValue("--from"));
        const to = Number(link.style.getPropertyValue("--to"));
        timeline.style.setProperty("--playhead-position", (from + to) / 2);
        if (window.matchMedia("(max-width: 680px)").matches && timelineNav) {
          const navRect = timelineNav.getBoundingClientRect();
          const linkRect = link.getBoundingClientRect();
          timelineNav.scrollTo({
            left: timelineNav.scrollLeft + linkRect.left - navRect.left - (navRect.width - linkRect.width) / 2,
            behavior: "auto",
          });
        }
      } else link.removeAttribute("aria-current");
    }
  }
  window.addEventListener("scroll", updateTimeline, { passive: true });
  window.addEventListener("resize", updateTimeline, { passive: true });
  updateTimeline();
}
