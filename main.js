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

    form.querySelectorAll('[data-required="true"]').forEach((el) => {
      el.required = true;
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

    const hiddenInputs = form.querySelectorAll(".hidden-input");
    hiddenInputs.forEach((input) => {
      let inputUpdatedName = input.getAttribute("name") + "-" + index;
      input.id = inputUpdatedName;
      const submissionPageInput = document.querySelector(
        'input[name="submission_page"]',
      );
      if (submissionPageInput) {
        submissionPageInput.value = window.location.href;
      } else {
        console.log("not found url input");
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

    function validateCurrentSection() {
      // Clear previous error states
      currentSection.querySelectorAll(".is-error").forEach((el) => {
        el.classList.remove("is-error");
      });

      // Get all "validation units" in DOM order:
      // - file input wrappers
      // - radio groups (represented by their first input)
      // - checkbox groups (represented by their first required input)
      // - regular inputs/textareas/selects

      const seenRadioGroups = new Set();
      const seenCheckboxGroups = new Set();
      const validationUnits = [];

      const allFields = currentSection.querySelectorAll(
        "input, textarea, select, .file-upload-input",
      );

      allFields.forEach((el) => {
        if (el.classList.contains("file-upload-input")) {
          validationUnits.push({ type: "file", root: el });
          return;
        }

        if (el.type === "radio" && el.required) {
          if (seenRadioGroups.has(el.name)) return;
          seenRadioGroups.add(el.name);
          validationUnits.push({ type: "radio", el, name: el.name });
          return;
        }

        if (el.type === "checkbox" && el.required) {
          if (seenCheckboxGroups.has(el.name)) return;
          seenCheckboxGroups.add(el.name);
          validationUnits.push({ type: "checkbox", el, name: el.name });
          return;
        }

        if (el.type === "radio" || el.type === "checkbox") return;

        validationUnits.push({ type: "field", el });
      });

      // Validate units in order
      for (const unit of validationUnits) {
        let valid = true;
        let errorTarget = null;

        if (unit.type === "file") {
          const fi = window.fileInputs?.find((f) => f.root === unit.root);
          if (fi && !fi.validate()) {
            valid = false;
            errorTarget = unit.root;

            let message = "Please add the required files";
            if (fi.files.some((f) => f.status === "error")) {
              message = "Please fix the file errors";
            } else if (
              fi.files.filter((f) => f.status === "success").length <
              fi.minFiles
            ) {
              message = `Please upload at least ${fi.minFiles} file${
                fi.minFiles > 1 ? "s" : ""
              }`;
            }

            const nativeInput = fi.nativeInput;
            nativeInput.style.cssText =
              "opacity:1; position:fixed; top:50px; left:50px; width:20px; height:20px;";
            nativeInput.setCustomValidity(message);
            nativeInput.reportValidity();
            nativeInput.setCustomValidity("");
            nativeInput.style.cssText = "";
          }
        } else if (unit.type === "radio") {
          const group = Array.from(
            currentSection.querySelectorAll(`input[name="${unit.name}"]`),
          );
          const anyChecked = group.some((el) => el.checked);
          if (!anyChecked) {
            valid = false;
            errorTarget = group[0].closest(".radio__group") || group[0];
            group[0].required = true;
            group[0].reportValidity();
            group[0].required = false;
          }
        } else if (unit.type === "checkbox") {
          const group = Array.from(
            currentSection.querySelectorAll(
              `input[type="checkbox"][name="${unit.name}"]`,
            ),
          );
          const anyChecked = group.some((el) => el.checked);
          if (!anyChecked) {
            valid = false;
            errorTarget = group[0].closest(".checkbox-group") || group[0];
            group[0].style.cssText =
              "opacity:1; position:fixed; top:50px; left:50px; width:20px; height:20px;";
            group[0].setCustomValidity("Please select at least one option");
            group[0].reportValidity();
            group[0].setCustomValidity("");
            group[0].style.cssText = "";
          }
        } else if (unit.type === "field") {
          if (!unit.el.checkValidity()) {
            valid = false;
            errorTarget = unit.el.closest(".text-input, .textarea") || unit.el;
            unit.el.reportValidity();
          }
        }

        if (!valid) {
          console.log("Adding is-error to:", errorTarget);
          if (errorTarget) errorTarget.classList.add("is-error");
          console.log(
            "classList after add:",
            errorTarget?.classList.toString(),
          );
          setTimeout(() => {
            console.log(
              "classList after 200ms:",
              errorTarget?.classList.toString(),
            );
          }, 200);
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
        el.required = el.dataset.wasRequired === "true";
      });

      nextSection.classList.remove("hidden");
      nextSection.classList.add("current");

      currentSection = nextSection;

      const submissionPage = form.querySelector(
        'input[name="submission_page"]',
      );
      if (submissionPage) submissionPage.value = window.location.href;

      if (window.marchBtnInit) {
        requestAnimationFrame(() => window.marchBtnInit(form));
      }
    }

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
      `<span style="white-space:nowrap">${lastWord}&nbsp;</span>`;

    // Move icon inside the nowrap span
    const nowrap = textEl.querySelector("span");
    nowrap.appendChild(icon);
  });
});
