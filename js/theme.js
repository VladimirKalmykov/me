(function () {
  var root = document.documentElement;
  var button = document.getElementById("theme-toggle");
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  function current() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function apply(theme, persist) {
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch (e) {
        /* private mode */
      }
    }
    if (button) {
      var next = theme === "dark" ? "светлую" : "тёмную";
      button.setAttribute("aria-label", "Переключить на " + next + " тему");
      button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
  }

  if (button) {
    button.addEventListener("click", function () {
      apply(current() === "dark" ? "light" : "dark", true);
    });
  }

  function onSystemChange(event) {
    var stored = null;
    try {
      stored = localStorage.getItem("theme");
    } catch (e) {
      stored = null;
    }
    if (stored !== "light" && stored !== "dark") {
      apply(event.matches ? "dark" : "light", false);
    }
  }

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onSystemChange);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(onSystemChange);
  }

  apply(current(), false);
})();
