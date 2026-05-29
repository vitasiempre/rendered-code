///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
// FILM FLIPPING ////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", (e) => {
  var FILM_SEL = ".film";
  var FLIPPED_CLASS = "is-flipped";

  function getFilm(node) {
    if (!node) return null;
    if (node.closest) return node.closest(FILM_SEL);

    // fallback (very old browsers)
    while (node && node !== document) {
      if (node.matches && node.matches(FILM_SEL)) return node;
      node = node.parentNode;
    }
    return null;
  }

  function setA11y(film, flipped) {
    var front = film.querySelector(".film-front");
    var back = film.querySelector(".film-back");

    if (!film.hasAttribute("role") && film.tagName !== "BUTTON") {
      film.setAttribute("role", "button");
    }
    if (!film.hasAttribute("tabindex") && film.tagName !== "BUTTON") {
      film.setAttribute("tabindex", "0");
    }

    film.setAttribute("aria-pressed", String(flipped));

    if (front) front.setAttribute("aria-hidden", String(flipped));
    if (back) back.setAttribute("aria-hidden", String(!flipped));
  }

  function flip(film, force) {
    var flipped =
      typeof force === "boolean"
        ? force
        : !film.classList.contains(FLIPPED_CLASS);

    film.classList.toggle(FLIPPED_CLASS, flipped);
    setA11y(film, flipped);
  }

  function init(root) {
    var films = (root || document).querySelectorAll(FILM_SEL);
    for (var i = 0; i < films.length; i++) {
      setA11y(films[i], films[i].classList.contains(FLIPPED_CLASS));
    }
  }

  // Click to flip
  document.addEventListener("click", function (e) {
    var film = getFilm(e.target);
    if (!film) return;

    if (
      e.target.closest &&
      e.target.closest("a, button, input, textarea, select, label")
    )
      return;

    flip(film);
  });

  // Keyboard support
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var film = getFilm(e.target);
    if (!film) return;

    e.preventDefault();
    flip(film);
  });

  // Init on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init();
    });
  } else {
    init();
  }
});

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
// MARCH BUTTON /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

(() => {
  function sync(btn) {
    const svg = btn.querySelector(".march-btn__stroke");
    const rect = btn.querySelector(".march-btn__rect");
    if (!svg || !rect) return;

    const cs = getComputedStyle(btn);
    const w = parseFloat(cs.getPropertyValue("--w")) || 2;

    const box = btn.getBoundingClientRect();
    const width = box.width;
    const height = box.height;

    if (width <= 0 || height <= 0) return;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const receivedRadius = btn.getAttribute("data-radius");
    let r;

    if (receivedRadius !== "90px") {
      r = parseInt(receivedRadius);
    } else {
      r = (height - w) / 2;
    }

    rect.setAttribute("x", w / 2);
    rect.setAttribute("y", w / 2);
    rect.setAttribute("width", Math.max(0, width - w));
    rect.setAttribute("height", Math.max(0, height - w));
    rect.setAttribute("stroke-linejoin", "round");
    rect.setAttribute("rx", r);
    rect.setAttribute("ry", r);

    btn.style.border = "none";
  }

  function init(root) {
    (root || document).querySelectorAll(".march-btn").forEach(sync);
  }

  // ✅ call this after you show a hidden step
  window.marchBtnInit = init;

  // initial + resize
  window.addEventListener("load", () => init());
  window.addEventListener("resize", () => init());

  // ✅ optional: auto-fix when hidden sections become visible / change size
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver((entries) => {
      entries.forEach((entry) => sync(entry.target));
    });
    window.addEventListener("load", () => {
      document.querySelectorAll(".march-btn").forEach((btn) => ro.observe(btn));
    });
  }
})();

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
// CUSTOM RADIO INPUT ///////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", function () {
  var otherRadio = document.querySelector(
    'input[data-customradio="true"], input[data-customRadio="true"]',
  );

  if (!otherRadio) return;

  var option = otherRadio.closest(".radio__option");

  var text = option && option.querySelector(".radio__other__text-input");

  if (!option || !text) return;

  function sync() {
    var on = otherRadio.checked;
    text.disabled = !on;
    text.required = on;
    if (!on) text.value = "";
  }

  function selectOther() {
    if (!otherRadio.checked) {
      otherRadio.checked = true;
      otherRadio.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  text.addEventListener("focus", selectOther);
  text.addEventListener("pointerdown", selectOther);
  text.addEventListener("input", selectOther);

  option.addEventListener("change", sync);
  sync();
});

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
// TEXTAREA RESIZE //////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", function () {
  const areas = document.querySelectorAll("textarea");

  areas.forEach((el) => {
    function autoResize() {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }

    el.addEventListener("input", autoResize);
    autoResize();
  });
});

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
// FORMS NAVIGATION /////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", function () {
  const forms = document.querySelectorAll(".form");
  forms.forEach((form, index) => {
    // ---------------------------------
    // Add required attributes
    // ---------------------------------

    form.setAttribute("novalidate", "");

    form.querySelectorAll('[data-required="true"]').forEach((el) => {
      if (el.type !== "file") el.required = true;
    });

    // Snapshot original required state before any modifications
    form.querySelectorAll("input, textarea, select").forEach((el) => {
      el.dataset.originalRequired = String(el.required);
    });

    form.addEventListener("input", (e) => {
      const errorWrapper = e.target.closest(".is-error");
      if (errorWrapper) errorWrapper.classList.remove("is-error");
    });

    // ---------------------------------
    // Make input IDs unique
    // ---------------------------------

    const radios = form.querySelectorAll('input[type="radio"]');
    radios.forEach((radio) => {
      let radioUpdatedName = radio.getAttribute("value") + "-" + index;
      radio.id = radioUpdatedName;
    });

    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      if (checkbox.id) {
        checkbox.id = checkbox.id + "-" + index;
      }
    });

    const hiddenInputs = form.querySelectorAll(".hidden-input");
    hiddenInputs.forEach((input) => {
      let inputUpdatedName = input.getAttribute("name") + "-" + index;
      input.id = inputUpdatedName;

      const dataValue = input.getAttribute("data-value");
      if (dataValue) {
        input.value = dataValue;
      }
    });

    const inputs = form.querySelectorAll(".text-input__field");
    inputs.forEach((input) => {
      let inputUpdatedName = input.getAttribute("name") + "-" + index;
      let wrapper = input.closest(".text-input");
      const label = wrapper?.querySelector(".text-input__label");
      if (label) {
        label.setAttribute("for", inputUpdatedName);
      }
      input.id = inputUpdatedName;
    });

    const fileInputs = form.querySelectorAll(".file-input__input");
    fileInputs.forEach((input) => {
      let inputUpdatedName = input.getAttribute("name") + "-" + index;
      let wrapper = input.closest(".file-upload-input");
      const label = wrapper?.querySelector(".file-input__button");
      if (label) {
        label.setAttribute("for", inputUpdatedName);
      }
      input.id = inputUpdatedName;
    });

    // ---------------------------------
    // Sync checkbox groups to hidden inputs
    // ---------------------------------

    form
      .querySelectorAll(".checkbox__group[data-group-name]")
      .forEach((group) => {
        const groupName = group.dataset.groupName;

        let hiddenInput = group.querySelector(
          `input[type="hidden"][name="${groupName}"]`,
        );
        if (!hiddenInput) {
          hiddenInput = document.createElement("input");
          hiddenInput.type = "hidden";
          hiddenInput.name = groupName;
          hiddenInput.value = "";
          group.appendChild(hiddenInput); // ← append to fieldset, not form wrapper
        }

        const checkboxes = group.querySelectorAll('input[type="checkbox"]');

        function sync() {
          const selected = Array.from(checkboxes)
            .filter((cb) => cb.checked)
            .map((cb) => cb.value);
          hiddenInput.value = selected.join(",");
        }

        checkboxes.forEach((cb) => cb.addEventListener("change", sync));
        sync();
      });

    // ---------------------------------
    // Disable required on hidden sections at init
    // ---------------------------------

    form
      .querySelectorAll(
        ".form-section.hidden input, .form-section.hidden textarea, .form-section.hidden select",
      )
      .forEach((el) => {
        el.dataset.wasRequired = el.required;
        el.required = false;
      });

    // ---------------------------------
    // Navigation logic
    // ---------------------------------

    let currentSection = form.querySelector(".form-section.current");

    // Progress step back navigation
    const allSections = Array.from(form.querySelectorAll("[data-step]"));
    form.querySelectorAll(".progress-steps").forEach((progressBar) => {
      const steps = progressBar.querySelectorAll(".step");
      steps.forEach((step, i) => {
        const targetSection = allSections[i];
        if (!targetSection) return;
        step.style.cursor = "pointer";
        step.addEventListener("click", () => {
          const targetIndex = allSections.indexOf(targetSection);
          const currentIndex = allSections.indexOf(currentSection);
          if (targetIndex >= currentIndex) return;
          showNextSection(targetSection); // ← reuse existing function
        });
      });
    });

    function getSelectedCategory() {
      const selected = form.querySelector('input[name="contact-type"]:checked');
      if (!selected) return;

      const stepId = selected.value.slice(-2);
      const nextSection = form.querySelector('[data-step="' + stepId + '"]');
      if (!nextSection) return;

      showNextSection(nextSection);
    }

    function getNextSection() {
      const allSteps = Array.from(form.querySelectorAll("[data-step]"));
      const currentIndex = allSteps.findIndex((el) => el === currentSection);
      return allSteps[currentIndex + 1] || null;
    }

    function validateField(el) {
      if (el.checkValidity()) return null;
      el.reportValidity();
      const wrapper = el.closest(".text-input, .textarea");
      console.log("validateField:", el, "wrapper found:", wrapper);
      return wrapper || el;
    }

    function validateRadioGroup(name, section) {
      const group = Array.from(
        section.querySelectorAll(`input[name="${name}"]`),
      );
      if (group.some((el) => el.checked)) return null;

      const target = group[0];

      target.setCustomValidity("Please select an option");
      target.style.cssText =
        "opacity:0; position:absolute; top:50px; left:50px; width:20px; height:20px;";
      target.required = true;
      target.reportValidity();
      target.required = false;
      target.style.cssText = "";

      const cleanup = () => {
        target.style.cssText = "";
        group.forEach((r) => r.removeEventListener("change", cleanup));
      };
      group.forEach((r) => r.addEventListener("change", cleanup));

      return target.closest(".radio__group") || target;
    }

    function validateCheckboxGroup(name, section) {
      const group = Array.from(
        section.querySelectorAll(`input[type="checkbox"][name="${name}"]`),
      );
      if (group.some((el) => el.checked)) return null;

      const target = group[0];
      target.style.cssText =
        "opacity:0; position:absolute; top:50px; left:50px; width:20px; height:20px;";
      target.setCustomValidity("Please select at least one option");
      target.reportValidity();

      // Clear on next interaction so tooltip has time to render
      const cleanup = () => {
        target.setCustomValidity("");
        target.style.cssText = "";
        group.forEach((cb) => cb.removeEventListener("change", cleanup));
      };
      group.forEach((cb) => cb.addEventListener("change", cleanup));

      return target.closest(".checkbox__group") || target;
    }

    function validateFileInput(rootEl) {
      console.log("validateFileInput called for:", rootEl);
      const fi = window.fileInputs?.find((f) => f.root === rootEl);
      console.log("  fi:", fi, "validate:", fi?.validate());
      if (!fi || fi.validate()) return null;
      fi.showError();
      return rootEl;
    }

    function validateCurrentSection() {
      currentSection.querySelectorAll(".is-error").forEach((el) => {
        el.classList.remove("is-error");
      });

      const seenRadios = new Set();
      const seenCheckboxes = new Set();
      const allFields = currentSection.querySelectorAll(
        "input, textarea, select, .file-upload-input",
      );

      for (const el of allFields) {
        let errorTarget = null;

        if (el.classList.contains("file-upload-input")) {
          errorTarget = validateFileInput(el);
        } else if (el.type === "file") {
          continue;
        } else if (el.type === "radio") {
          if (seenRadios.has(el.name)) continue;
          seenRadios.add(el.name);

          const radioGroup = el.closest('[data-required="true"]');
          if (!radioGroup) continue; // optional group, skip

          errorTarget = validateRadioGroup(el.name, currentSection);
        } else if (el.type === "checkbox") {
          if (seenCheckboxes.has(el.name)) continue;
          seenCheckboxes.add(el.name);

          const checkboxGroup = el.closest('[data-required="true"]');
          if (!checkboxGroup) continue; // optional group, skip

          errorTarget = validateCheckboxGroup(el.name, currentSection);
        } else if (el.type !== "radio" && el.type !== "checkbox") {
          errorTarget = validateField(el);
        }

        if (errorTarget) {
          errorTarget.classList.add("is-error");
          return false;
        }
      }

      return true;
    }

    function showNextSection(nextSection) {
      if (!currentSection || !nextSection) return;

      // Disable required on fields leaving view
      currentSection
        .querySelectorAll("input, textarea, select")
        .forEach((el) => {
          el.dataset.wasRequired = el.required;
          el.required = false;
        });

      currentSection.classList.remove("current");
      currentSection.classList.add("hidden");

      // Restore required on fields coming into view
      nextSection.querySelectorAll("input, textarea, select").forEach((el) => {
        el.required = el.dataset.originalRequired === "true";
      });

      nextSection.classList.remove("hidden");
      nextSection.classList.add("current");

      currentSection = nextSection;

      const submissionPage = form.querySelector(
        'input[name="submission_page"]',
      );

      if (submissionPage) {
        const dataValue = submissionPage.getAttribute("data-value");
        if (dataValue) {
          submissionPage.value = dataValue;
        }
      }

      if (window.marchBtnInit) {
        requestAnimationFrame(() => window.marchBtnInit(form));
      }
    }

    form.addEventListener(
      "submit",
      (e) => {
        if (!validateCurrentSection()) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      true,
    );

    form.addEventListener("click", function (e) {
      const actionButton = e.target.closest("[data-action]");
      if (!actionButton) return;

      const buttonType = actionButton.getAttribute("data-action");

      switch (buttonType) {
        case "next":
          e.preventDefault();
          if (!validateCurrentSection()) return;
          showNextSection(getNextSection());
          break;

        case "fork":
          e.preventDefault();
          if (!validateCurrentSection()) return;
          getSelectedCategory();
          break;

        default:
          break;
      }
    });
  });
});

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
// LINK PRETTIER ////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".link").forEach((link) => {
    console.log("found a link");
    const textEl = link.querySelector(".link-text-element");
    const icon = link.querySelector(".link-icon-position");
    if (!textEl || !icon) return;

    const words = textEl.textContent.trim().split(" ");
    const lastWord = words.pop();

    textEl.innerHTML =
      words.join(" ") +
      (words.length ? " " : "") +
      `<span style="white-space:nowrap" class="u-nowrap-span-wrapper">${lastWord}&nbsp;</span>`;

    // Move icon inside the nowrap span
    const nowrap = textEl.querySelector("span");
    nowrap.appendChild(icon);
  });
});
