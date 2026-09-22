/* =========================================================
   AVORA DIGITAL — SITE BEHAVIOUR (merged: old_js + pricing_js)
   ---------------------------------------------------------
   Everything runs inside one DOMContentLoaded so there is a
   single, predictable startup order and no top-level globals.

   MERGE NOTES (read once, then delete this block):
   - Scroll reveal now adds BOTH "is-visible" (old_js) and
     "show" (pricing_js) classes. Check which one your CSS
     actually styles, then delete the other everywhere below
     and in your CSS.
   - FAQ accordion now matches EITHER ".faq-question" or a
     bare "button" inside ".faq-item", because the two source
     files assumed different markup. If every page uses the
     same FAQ markup, simplify the selector back down.
   - #currentYear and #year are both supported.
   - Pricing/currency section only does anything on pages that
     actually have .price-value / .currency-btn elements — it
     is a safe no-op everywhere else.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const reducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const supportsHover =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Site-wide: stops the browser's native smooth-scroll (e.g. CSS
  // `scroll-behavior: smooth`, or in-page #anchor jumps) for anyone
  // who asked the OS for reduced motion. JS-driven scrolls below
  // also check `reducedMotion` individually.
  if (reducedMotion) {
    document.documentElement.style.scrollBehavior = "auto";
  }

  const normalisePage = (value) => {
    const file = String(value || "")
      .split("?")[0]
      .split("#")[0]
      .replace(/\/+$/, "")
      .split("/")
      .pop();

    if (!file) return "index.html";
    return file.endsWith(".html") ? file : `${file}.html`;
  };

  const currentPage = normalisePage(window.location.pathname);

  const header = document.getElementById("siteHeader");
  const loader = document.getElementById("pageLoader");

  /* =========================================================
     PAGE LOADER
  ========================================================= */

  const hideLoader = () => loader?.classList.add("loaded");

  if (document.readyState === "complete") {
    window.setTimeout(hideLoader, 450);
  } else {
    window.addEventListener(
      "load",
      () => window.setTimeout(hideLoader, 450),
      { once: true }
    );
  }

  /* =========================================================
     CURRENT YEAR
  ========================================================= */

  document.querySelectorAll("#currentYear, #year").forEach((item) => {
    item.textContent = String(new Date().getFullYear());
  });

  /* =========================================================
     STICKY HEADER
  ========================================================= */

  const updateHeader = () => {
    header?.classList.toggle("scrolled", window.scrollY > 30);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* =========================================================
     MOBILE NAVIGATION
     (single handler: aria-expanded + aria-label + link-close +
     outside-click + Escape, so nothing fires twice)
  ========================================================= */

  const menuButton = document.getElementById("menuToggle");
  const navigation = document.querySelector(
    "#mainNav, #mainNavigation, .nav-wrapper, .nav-menu"
  );

  const setMenuState = (isOpen) => {
    navigation?.classList.toggle("open", isOpen);
    document.body.classList.toggle("menu-open", isOpen);
    menuButton?.setAttribute("aria-expanded", String(isOpen));
    menuButton?.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
  };

  const closeMenu = () => setMenuState(false);

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isOpen = !navigation.classList.contains("open");
      setMenuState(isOpen);
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
      if (!navigation.classList.contains("open")) return;

      const clickedInside = navigation.contains(event.target);
      const clickedButton = menuButton.contains(event.target);

      if (!clickedInside && !clickedButton) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navigation.classList.contains("open")) {
        closeMenu();
        menuButton.focus();
      }
    });
  }

  /* =========================================================
     SCROLL REVEALS
  ========================================================= */

  const reveals = document.querySelectorAll(".reveal");
  const revealShow = (el) => el.classList.add("is-visible", "show");

  if (reducedMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(revealShow);
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealShow(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    reveals.forEach((item) => revealObserver.observe(item));
  }

  /* =========================================================
     COUNTERS
  ========================================================= */

  const animateCounter = (counter) => {
    const target = Number(counter.dataset.target);
    if (!Number.isFinite(target)) return;

    if (reducedMotion) {
      counter.textContent = String(target);
      return;
    }

    const start = performance.now();

    const update = (time) => {
      const progress = Math.min((time - start) / 1500, 1);
      counter.textContent = String(
        Math.floor(target * (1 - Math.pow(1 - progress, 3)))
      );

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counter.textContent = String(target);
      }
    };

    requestAnimationFrame(update);
  };

  const counters = document.querySelectorAll(".counter");

  if (counters.length && "IntersectionObserver" in window && !reducedMotion) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((item) => counterObserver.observe(item));
  } else {
    counters.forEach(animateCounter);
  }

  /* =========================================================
     DESKTOP VISUAL INTERACTIONS
     (mouse-driven — skipped on touch and for reduced motion)
  ========================================================= */

  if (supportsHover && !reducedMotion) {

    document.querySelectorAll(".magnetic").forEach((button) => {
      button.addEventListener("mousemove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "";
      });
    });

    document
      .querySelectorAll(
        ".service-detail-card, .packaging-card, .price-card, .marketing-price-card, .packaging-price-card, .pillar-card"
      )
      .forEach((card) => {
        card.addEventListener("mousemove", (event) => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          card.style.transform =
            `perspective(1000px) rotateY(${x * 2}deg) rotateX(${y * -2}deg) translateY(-7px)`;
        });

        card.addEventListener("mouseleave", () => {
          card.style.transform = "";
        });
      });

    const addParallax = (container, element, xAmount, yAmount) => {
      if (!container || !element) return;

      container.addEventListener("mousemove", (event) => {
        const rect = container.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        element.style.transform =
          `translate(${x * xAmount}px, ${y * yAmount}px)`;
      });

      container.addEventListener("mouseleave", () => {
        element.style.transform = "";
      });
    };

    addParallax(
      document.querySelector(".hero"),
      document.querySelector(".hero .hero-visual"),
      12, 8
    );

    addParallax(
      document.querySelector(".services-hero"),
      document.querySelector(".services-hero-grid"),
      10, 8
    );

    addParallax(
      document.querySelector(".pricing-hero"),
      document.querySelector(".pricing-hero-grid"),
      10, 8
    );

    const pageHero = document.querySelector(".about-hero, .contact-hero");
    addParallax(pageHero, pageHero?.querySelector(".hero-grid"), 18, 18);

    if (currentPage === "about.html") {
      const orbitOne = document.querySelector(".orbit-one");
      const orbitTwo = document.querySelector(".orbit-two");

      window.addEventListener(
        "mousemove",
        (event) => {
          const x = event.clientX / window.innerWidth - 0.5;
          const y = event.clientY / window.innerHeight - 0.5;

          if (orbitOne) {
            orbitOne.style.transform = `translate(${x * 12}px, ${y * 10}px)`;
          }
          if (orbitTwo) {
            orbitTwo.style.transform = `translate(${x * -10}px, ${y * -8}px)`;
          }
        },
        { passive: true }
      );
    }
  }

  /* =========================================================
     FAQ ACCORDION
     Matches ".faq-question" (old_js markup) or a bare "button"
     (pricing_js markup) inside ".faq-item".
  ========================================================= */

  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question, button");
    if (!question) return;

    question.addEventListener("click", () => {
      const shouldOpen = !item.classList.contains("open");

      faqItems.forEach((other) => {
        other.classList.remove("open");
        other
          .querySelector(".faq-question, button")
          ?.setAttribute("aria-expanded", "false");
      });

      if (shouldOpen) {
        item.classList.add("open");
        question.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* =========================================================
     SMOOTH ANCHORS
  ========================================================= */

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.getElementById(href.slice(1));
      if (!target) return;

      event.preventDefault();

      window.scrollTo({
        top:
          target.getBoundingClientRect().top +
          window.scrollY -
          (header?.offsetHeight || 0) -
          20,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    });
  });

  /* =========================================================
     EXTERNAL LINKS SECURITY
  ========================================================= */

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    const rel = new Set(
      (link.getAttribute("rel") || "").split(/\s+/).filter(Boolean)
    );
    rel.add("noopener");
    rel.add("noreferrer");
    link.setAttribute("rel", [...rel].join(" "));
  });

  /* =========================================================
     ACTIVE NAVIGATION
  ========================================================= */

  document.querySelectorAll(".nav-links a, .nav-menu a").forEach((link) => {
    const rawHref = link.getAttribute("href") || "";
    if (/^(https?:|mailto:|tel:|#)/i.test(rawHref)) return;

    const href = normalisePage(rawHref);

    if (href === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  /* =========================================================
     GMAIL BUTTONS
  ========================================================= */

  const EMAIL_TO = "hello@avoradigital.online";

  const openGmailOrMailto = (subject, body) => {
    const gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL_TO)}` +
      `&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const gmailWindow = window.open(gmailUrl, "_blank", "noopener,noreferrer");

    // Popup blocked (common on mobile, and near-certain after an
    // await elsewhere) — fall back to the device's default mail app.
    if (!gmailWindow) {
      window.location.href =
        `mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    return Boolean(gmailWindow);
  };

  document
    .querySelectorAll(
      ".gmail-button, [data-email-button], [href^='mailto:hello@avoradigital.online']"
    )
    .forEach((button) => {
      button.addEventListener("click", (event) => {
        const href = button.getAttribute("href") || "";
        if (href.startsWith("mailto:")) event.preventDefault();

        const subject =
          button.dataset.subject || "Project Inquiry — Avora Digital";
        const body =
          button.dataset.body ||
          "Hello Avora Digital,\n\nI would like to discuss a project.\n\n";

        openGmailOrMailto(subject, body);
      });
    });

  /* =========================================================
     CONTACT FORM
  ========================================================= */

  const form = document.getElementById("projectForm");

  if (form) {
    const service = document.getElementById("service");
    const message = document.getElementById("message");
    const characterCount = document.getElementById("characterCount");
    const submitButton = document.getElementById("submitButton");
    const successMessage = document.getElementById("formSuccess");

    const MAX_MESSAGE_LENGTH = 1200;

    if (message) {
      message.setAttribute("maxlength", String(MAX_MESSAGE_LENGTH));
    }

    // formSuccess doubles as the error panel via setStatus() below.
    // Screen reader users get told about it even without moving focus.
    successMessage?.setAttribute("aria-live", "polite");
    successMessage?.setAttribute("tabindex", "-1");

    const params = new URLSearchParams(window.location.search);

    const serviceMap = {
      shopify: "Shopify Development",
      "custom-web": "Custom Web Development",
      facebook: "Facebook Marketing",
      instagram: "Instagram Marketing",
      "meta-ads": "Meta Ads Management",
      "bottle-labels": "Bottle Labels",
      tissue: "Tissue Packaging",
      "complete-brand": "Complete Brand Build",
    };

    const packageMap = {
      "digital-launch":
        "Digital Launch package (website, basic SEO, and analytics setup)",
      "digital-growth":
        "Digital Growth package (website optimization, social media, and Meta Ads)",
      "complete-brand": "Complete Brand Build package",
    };

    const selectedService = serviceMap[params.get("service")];
    const selectedPackage = packageMap[params.get("package")];

    // NOTE: this sets the <select>'s value to the human-readable LABEL
    // ("Shopify Development"), which only works if an <option value="...">
    // matches that exact string. If your <option> values are the short
    // keys instead ("shopify", "custom-web", ...), this silently fails —
    // check the actual <select id="service"> markup against serviceMap.
    if (service && selectedService) {
      service.value = selectedService;
    }

    if (selectedPackage) {
      if (service && !selectedService) {
        service.value =
          params.get("package") === "complete-brand"
            ? "Complete Brand Build"
            : "Other";
      }
      if (message && !message.value) {
        message.value = `I'm interested in the ${selectedPackage}. Please share the next steps and a tailored quote.`;
      }
    }

    /* ---------- character counter ---------- */

    const updateCharacterCount = () => {
      if (message && characterCount) {
        characterCount.textContent = `${message.value.length} / ${MAX_MESSAGE_LENGTH}`;
      }
    };

    updateCharacterCount();
    message?.addEventListener("input", updateCharacterCount);

    /* ---------- validation ---------- */

    const errorFor = (field) =>
      document.querySelector(`[data-error-for="${field.name}"]`);

    const showError = (field, text) => {
      field.closest(".form-field")?.classList.add("invalid");
      field.setAttribute("aria-invalid", "true");
      const error = errorFor(field);
      if (error) error.textContent = text;
    };

    const clearError = (field) => {
      field.closest(".form-field")?.classList.remove("invalid");
      field.removeAttribute("aria-invalid");
      const error = errorFor(field);
      if (error) error.textContent = "";
    };

    const validate = (field) => {
      const value = field.value.trim();

      if (field.required && !value) {
        showError(field, "This field is required.");
        return false;
      }

      if (
        field.type === "email" &&
        value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        showError(field, "Enter a valid email address.");
        return false;
      }

      if (field === message && value.length > MAX_MESSAGE_LENGTH) {
        showError(
          field,
          `Please keep the message under ${MAX_MESSAGE_LENGTH} characters.`
        );
        return false;
      }

      clearError(field);
      return true;
    };

    form
      .querySelectorAll("input[required], select[required], textarea[required]")
      .forEach((field) => {
        field.addEventListener("blur", () => validate(field));
        field.addEventListener("input", () => {
          if (field.closest(".form-field.invalid")) validate(field);
        });
      });

    /* ---------- submission (FormSubmit AJAX, with a real fallback) ---------- */

    // FIRST-TIME SETUP: formsubmit.co requires a one-time activation —
    // either submit this form once normally, or click the confirmation
    // link it emails to hello@avoradigital.online — before AJAX
    // submissions will actually deliver mail. If "it sends but nobody
    // receives it", check that inbox before touching this code.
    const FORM_ENDPOINT = `https://formsubmit.co/ajax/${EMAIL_TO}`;

    const setStatus = (text, state) => {
      if (!successMessage) return;

      const heading = successMessage.querySelector("h3");
      const paragraph = successMessage.querySelector("p");

      if (heading) heading.textContent = state === "error" ? "Request not sent" : "Request sent";
      if (paragraph) paragraph.textContent = text;
      else successMessage.textContent = text;

      successMessage.classList.add("show");
      successMessage.classList.toggle("is-error", state === "error");
      successMessage.focus();
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const requiredFields = [...form.querySelectorAll("[required]")];

      if (!requiredFields.every(validate)) {
        form
          .querySelector(
            ".form-field.invalid input, .form-field.invalid select, .form-field.invalid textarea"
          )
          ?.focus();
        return;
      }

      const data = new FormData(form);
      const readField = (key) => String(data.get(key) || "").trim();

      const name = readField("name");
      const email = readField("email");
      const whatsappNumber = readField("whatsapp");
      const company = readField("company");
      const selectedServiceValue = readField("service");
      const budget = readField("budget");
      const projectMessage = readField("message");

      const originalHtml = submitButton ? submitButton.innerHTML : "";

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute("aria-busy", "true");
        submitButton.innerHTML = "<span>Sending request...</span><span>↗</span>";
      }

      const payload = {
        _subject: `New Project Request — ${name}`,
        _template: "table",
        _captcha: "false",
        _replyto: email,
        Name: name,
        Email: email,
        "Company / Brand": company || "Not provided",
        Service: selectedServiceValue || "Not specified",
        Budget: budget || "Not specified",
        "Project Details": projectMessage,
      };

      if (whatsappNumber) payload["Phone / WhatsApp"] = whatsappNumber;

      let emailSent = false;
      let failureReason = "";

      try {
        const response = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));
        emailSent = response.ok && result.success !== "false";

        if (!emailSent) {
          failureReason = result.message || `HTTP ${response.status}`;
          console.error("Avora Digital email error:", failureReason);
        }
      } catch (error) {
        failureReason = "network";
        console.error("Avora Digital email request failed:", error);
      }

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitButton.innerHTML = originalHtml;
      }

      if (emailSent) {
        setStatus(
          "Thanks — your project request has been sent. We usually reply within one business day.",
          "success"
        );

        form.reset();
        updateCharacterCount();

        form
          .querySelectorAll(".form-field.invalid")
          .forEach((field) => field.classList.remove("invalid"));
        form
          .querySelectorAll(".field-error")
          .forEach((error) => (error.textContent = ""));

        successMessage?.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "center",
        });

        return;
      }

      // BUG FIX: the old code called window.open() here and told the user
      // "an email draft has been opened" even when the popup was blocked
      // (very likely, since this runs after an await). Now it actually
      // checks, and falls back to mailto: if the popup didn't open.
      const fallbackBody = [
        `Name: ${name}`,
        `Email: ${email}`,
        whatsappNumber ? `Phone: ${whatsappNumber}` : null,
        company ? `Company / Brand: ${company}` : null,
        `Service: ${selectedServiceValue || "Not specified"}`,
        `Budget: ${budget || "Not specified"}`,
        "",
        "Project Details:",
        projectMessage,
      ]
        .filter((line) => line !== null)
        .join("\n");

      const opened = openGmailOrMailto(
        `New Project Request — ${name}`,
        fallbackBody
      );

      setStatus(
        opened
          ? "We could not send the request automatically. An email draft has been opened — please press send, or write to hello@avoradigital.online."
          : "We could not send the request automatically. Please email hello@avoradigital.online directly with your details.",
        "error"
      );
    });
  }

  /* =========================================================
     PRICING — CURRENCY TOGGLE
     No-op on pages without .price-value / .currency-btn.
  ========================================================= */

  const pricing = {
    "shopify-basic": { USD: 125, PKR: 34999 },
    "shopify-standard": { USD: 215, PKR: 59999 },
    "shopify-premium": { USD: 360, PKR: 99999 },
    "web-basic": { USD: 107, PKR: 29999 },
    "web-standard": { USD: 196, PKR: 54999 },
    "web-premium": { USD: 321, PKR: 89999 },
    "social-basic": { USD: 54, PKR: 14999 },
    "social-standard": { USD: 89, PKR: 24999 },
    "social-premium": { USD: 143, PKR: 39999 },
    "ads-basic": { USD: 54, PKR: 14999 },
    "ads-standard": { USD: 89, PKR: 24999 },
    "ads-premium": { USD: 143, PKR: 39999 },
    "labels-basic": { USD: 29, PKR: 7999 },
    "labels-standard": { USD: 46, PKR: 12999 },
    "labels-premium": { USD: 71, PKR: 19999 },
    "tissue-basic": { USD: 29, PKR: 7999 },
    "tissue-standard": { USD: 54, PKR: 14999 },
    "tissue-premium": { USD: 89, PKR: 24999 },
  };

  const currencySettings = {
    USD: { symbol: "$", position: "before" },
    PKR: { symbol: "₨", position: "before" },
  };

  const currencyButtons = document.querySelectorAll(".currency-btn");
  const priceElements = document.querySelectorAll(".price-value");
  const currencySymbols = document.querySelectorAll(".currency-symbol");

  let currentCurrency = "USD";
  const savedCurrency = localStorage.getItem("avoraCurrency");
  if (savedCurrency === "USD" || savedCurrency === "PKR") {
    currentCurrency = savedCurrency;
  }

  const formatPrice = (value, currency) => {
    if (currency === "USD") {
      return Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    if (currency === "PKR") {
      return Number(value).toLocaleString("en-PK", { maximumFractionDigits: 0 });
    }
    return value;
  };

  const updatePrices = () => {
    const currency = currencySettings[currentCurrency];

    priceElements.forEach((priceElement) => {
      const priceId = priceElement.dataset.priceId;
      const priceData = pricing[priceId];

      if (!priceData) {
        if (priceId) {
          console.warn(`Avora Digital: no pricing entry for "${priceId}"`);
        }
        return;
      }

      priceElement.textContent = formatPrice(
        priceData[currentCurrency],
        currentCurrency
      );
    });

    currencySymbols.forEach((symbolElement) => {
      symbolElement.textContent = currency.symbol;
    });

    currencyButtons.forEach((button) => {
      const isActive = button.dataset.currency === currentCurrency;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    localStorage.setItem("avoraCurrency", currentCurrency);
  };

  currencyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.currency;
      if (!selected || selected === currentCurrency) return;

      currentCurrency = selected;
      updatePrices();
    });
  });

  updatePrices();

  /* =========================================================
     COOKIE CONSENT
  ========================================================= */

  const cookieBanner = document.getElementById("cookieBanner");
  const cookieAccept = document.getElementById("cookieAccept");
  const cookieReject = document.getElementById("cookieReject");
  const cookieSettings = document.getElementById("cookieSettings");

  const COOKIE_KEY = "avora_cookie_consent";

  const showCookieBanner = () => cookieBanner?.classList.add("show");
  const hideCookieBanner = () => cookieBanner?.classList.remove("show");
  const showCookieSettings = () => cookieSettings?.classList.add("show");

  const acceptAnalytics = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    if (typeof gtag === "function") {
      gtag("consent", "update", { analytics_storage: "granted" });
    }
    if (typeof window.loadGoogleAnalytics === "function") {
      window.loadGoogleAnalytics();
    }
    hideCookieBanner();
    showCookieSettings();
  };

  const rejectAnalytics = () => {
    localStorage.setItem(COOKIE_KEY, "rejected");
    if (typeof gtag === "function") {
      gtag("consent", "update", { analytics_storage: "denied" });
    }
    hideCookieBanner();
    showCookieSettings();
  };

  cookieAccept?.addEventListener("click", acceptAnalytics);
  cookieReject?.addEventListener("click", rejectAnalytics);
  cookieSettings?.addEventListener("click", showCookieBanner);

  const existingConsent = localStorage.getItem(COOKIE_KEY);
  if (!existingConsent) {
    window.setTimeout(showCookieBanner, 700);
  } else {
    showCookieSettings();
  }

});