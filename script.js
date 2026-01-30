// script.js — pointer-based dragging + dispense logic
// Works on desktop + mobile (Pointer Events)

(() => {
  // ----------------------------
  // DOM
  // ----------------------------
  const dropZone = document.getElementById("dropZone");
  const coinBtn = document.getElementById("coinBtn");
  const stickerImg = document.getElementById("stickerImg");
  const stickerLabel = document.getElementById("stickerLabel");
  const stickerMeta = document.querySelector(".sticker-meta");
  const stickerIndexEl = document.getElementById("stickerIndex");
  const downloadBtn = document.getElementById("downloadBtn");

  const resetCoinBtn = document.getElementById("resetCoin");
  const newStickerBtn = document.getElementById("newSticker");
  const muteBtn = document.getElementById("muteBtn");

  const machine = document.querySelector(".machine");

  // Collection modal
  const myStickersBtn = document.getElementById("myStickersBtn");
  const collectionModal = document.getElementById("collectionModal");
  const closeCollection = document.getElementById("closeCollection");
  const collectionGrid = document.getElementById("collectionGrid");

  // Sounds
  const coinSound = document.getElementById("coinSound");
  const stickerSound = document.getElementById("stickerSound");

  // ----------------------------
  // Easter eggs (DEFINE EARLY ✅)
  // ----------------------------
  const EASTER_EGGS = [
    "assets/easteregg1.png",
    "assets/easteregg2.png",
  ];

  const EGG_CLICK_TARGET = 5;
  const EGG_WINDOW_MS = 2000;
  let eggClickCount = 0;
  let eggClickTimer = null;

  function resetEggClicks() {
    eggClickCount = 0;
    if (eggClickTimer) {
      clearTimeout(eggClickTimer);
      eggClickTimer = null;
    }
  }

  // ----------------------------
  // Sticker list + shuffle bag
  // ----------------------------
  const STICKER_COUNT = 14;
  const stickers = Array.from({ length: STICKER_COUNT }, (_, i) => `assets/${i + 1}.png`);

  // used for collection grid
  const allStickerSources = [...stickers, ...EASTER_EGGS];

  let bag = [];

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function refillBagIfNeeded() {
    if (bag.length === 0) bag = shuffle([...stickers]);
  }

  // ----------------------------
  // Sound
  // ----------------------------
  let soundEnabled = true;

  function playSound(audio) {
    if (!soundEnabled || !audio) return;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }

  // ----------------------------
  // Collection (localStorage)
  // ----------------------------
  const SCRAP_KEY = "sticker_collection_v1";

  function loadCollection() {
    try {
      const raw = localStorage.getItem(SCRAP_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  function saveCollection(set) {
    try {
      localStorage.setItem(SCRAP_KEY, JSON.stringify([...set]));
    } catch {
      // ignore
    }
  }

  let collectedSet = loadCollection();

  function isCollected(src) {
    return collectedSet.has(src);
  }

  function markCollected(src) {
    if (!src) return;
    if (!collectedSet.has(src)) {
      collectedSet.add(src);
      saveCollection(collectedSet);

      // If the modal is open, live-update it
      if (collectionModal && !collectionModal.classList.contains("hidden")) {
        renderCollection();
      }
    }
  }

  function getStickerMeta(src) {
    const m = src.match(/\/(\d+)\.png$/);
    if (m) {
      const n = Number(m[1]);
      let rarity = "Common";
      if (n >= 9 && n <= 12) rarity = "Rare";
      if (n >= 13) rarity = "Epic";
      return { name: `Sticker #${n}`, rarity };
    }
    if (src.includes("easteregg")) return { name: "Easter Egg", rarity: "Epic" };
    return { name: "Sticker", rarity: "Common" };
  }

  function renderCollection() {
    if (!collectionGrid) return;
    collectionGrid.innerHTML = "";

    allStickerSources.forEach((src) => {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.tabIndex = 0;

      const img = document.createElement("img");
      img.src = src;
      img.alt = getStickerMeta(src).name;

      if (!isCollected(src)) cell.classList.add("locked");

      cell.appendChild(img);
      collectionGrid.appendChild(cell);
    });
  }

  // Modal open/close
  if (myStickersBtn && collectionModal && closeCollection && collectionGrid) {
    myStickersBtn.addEventListener("click", () => {
      renderCollection();
      collectionModal.classList.remove("hidden");
      closeCollection.focus();
    });

    closeCollection.addEventListener("click", () => {
      collectionModal.classList.add("hidden");
      myStickersBtn.focus();
    });

    // Close on backdrop click
    collectionModal.addEventListener("mousedown", (e) => {
      const target = e.target;
      if (target && target.dataset && target.dataset.close !== undefined) {
        collectionModal.classList.add("hidden");
        myStickersBtn.focus();
      }
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (!collectionModal.classList.contains("hidden") && e.key === "Escape") {
        collectionModal.classList.add("hidden");
        myStickersBtn.focus();
      }
    });
  }

  // ----------------------------
  // Sticker display helpers
  // ----------------------------
  function showSticker(src, labelText, indexText, downloadName) {
    if (!stickerImg) return;

    stickerImg.src = src;
    stickerImg.classList.remove("hidden");
    stickerImg.classList.add("floating");

    if (stickerMeta) stickerMeta.classList.remove("hidden");

    if (stickerLabel) {
      stickerLabel.textContent = labelText || "You got a sticker!";
      stickerLabel.classList.remove("hidden");
    }

    if (stickerIndexEl) stickerIndexEl.textContent = indexText || "";

    if (downloadBtn) {
      downloadBtn.href = src;
      downloadBtn.setAttribute("download", downloadName || "sticker.png");
    }

    // pop animation retrigger
    stickerImg.classList.remove("pop");
    void stickerImg.offsetWidth;
    stickerImg.classList.add("pop");
  }

  function dispenseSticker() {
    refillBagIfNeeded();
    const next = bag.pop();

    // mark collected
    markCollected(next);

    const match = next.match(/\/(\d+)\.png$/);
    const idx = match ? Number(match[1]) : 0;

    showSticker(
      next,
      "You got a sticker!",
      `${idx}/${STICKER_COUNT}`,
      `sticker-${idx}.png`
    );

    playSound(stickerSound);
    if (navigator.vibrate) navigator.vibrate(30);
  }

  // Hide sticker when clicking the overlay background (not buttons)
  const outputOverlay = document.querySelector(".output");
  if (outputOverlay) {
    outputOverlay.addEventListener("click", (e) => {
      if (e.target === outputOverlay) {
        stickerImg?.classList.add("hidden");
        stickerMeta?.classList.add("hidden");
      }
    });
  }

  // ----------------------------
  // Coin movement + insert animation
  // ----------------------------
  function resetCoinPosition() {
    coinBtn.style.left = "";
    coinBtn.style.top = "";
    coinBtn.style.transform = "translate(-50%, -50%)";
    coinBtn.style.opacity = "1";
    coinBtn.style.transition = "";
  }

  function pointInRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function coinToSlotAnimationThenDispense() {
    if (!dropZone) return;

    const dz = dropZone.getBoundingClientRect();
    const coinRect = coinBtn.getBoundingClientRect();

    const targetX = dz.left + dz.width / 2;
    const targetY = dz.top + dz.height / 2;

    const coinCenterX = coinRect.left + coinRect.width / 2;
    const coinCenterY = coinRect.top + coinRect.height / 2;

    const dx = targetX - coinCenterX;
    const dy = targetY - coinCenterY;

    playSound(coinSound);
    document.body.classList.add("animating");
    machine?.classList.add("shake");

    coinBtn.classList.add("to-slot");
    coinBtn.style.transition = "transform 320ms cubic-bezier(.2,.9,.2,1), opacity 320ms ease";
    coinBtn.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.6)`;

    setTimeout(() => {
      coinBtn.style.opacity = "0";
    }, 320);

    setTimeout(() => {
      coinBtn.classList.remove("to-slot");
      machine?.classList.remove("shake");
      document.body.classList.remove("animating");
      resetCoinPosition();
      dispenseSticker();
    }, 640);
  }

  // Pointer drag state
  let isDragging = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let coinStartLeft = 0;
  let coinStartTop = 0;
  let didMove = false;

  coinBtn.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    if (document.body.classList.contains("animating")) return;

    isDragging = true;
    didMove = false;
    pointerId = e.pointerId;
    coinBtn.setPointerCapture(pointerId);

    stickerImg?.classList.add("paused");

    const rect = coinBtn.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;

    coinBtn.style.transition = "";
    coinBtn.style.transform = "translate(-50%, -50%)";
    coinBtn.style.left = `${rect.left + rect.width / 2}px`;
    coinBtn.style.top = `${rect.top + rect.height / 2}px`;

    coinStartLeft = parseFloat(coinBtn.style.left);
    coinStartTop = parseFloat(coinBtn.style.top);
  });

  window.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    if (pointerId !== e.pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) + Math.abs(dy) > 4) didMove = true;

    coinBtn.style.left = `${coinStartLeft + dx}px`;
    coinBtn.style.top = `${coinStartTop + dy}px`;

    const dzRect = dropZone.getBoundingClientRect();
    dropZone.classList.toggle("is-hover", pointInRect(e.clientX, e.clientY, dzRect));
  });

  window.addEventListener("pointerup", (e) => {
    if (!isDragging) return;
    if (pointerId !== e.pointerId) return;

    isDragging = false;
    stickerImg?.classList.remove("paused");
    dropZone.classList.remove("is-hover");

    const dzRect = dropZone.getBoundingClientRect();
    const isOver = pointInRect(e.clientX, e.clientY, dzRect);

    if (isOver) {
      coinToSlotAnimationThenDispense();
    } else {
      // animate back
      coinBtn.style.transition = "transform 220ms cubic-bezier(.2,.9,.2,1), left 220ms ease, top 220ms ease";
      coinBtn.style.left = "";
      coinBtn.style.top = "";
      coinBtn.style.transform = "translate(-50%, -50%)";
    }
  });

  // Tap to insert (ignore the click that happens after a drag)
  coinBtn.addEventListener("click", () => {
    if (isDragging) return;
    if (didMove) return;
    if (document.body.classList.contains("animating")) return;
    coinToSlotAnimationThenDispense();
  });

  // Buttons
  resetCoinBtn?.addEventListener("click", resetCoinPosition);
  newStickerBtn?.addEventListener("click", dispenseSticker);

  // Mute toggle
  muteBtn?.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    muteBtn.classList.toggle("muted", !soundEnabled);
    muteBtn.textContent = soundEnabled ? "🔊" : "🔇";
  });

  // Preload stickers (including easter eggs)
  (function preload() {
    allStickerSources.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  })();

  // ----------------------------
  // Easter egg: 5 clicks on machine within 2 seconds
  // ----------------------------
  function triggerEasterEgg() {
    resetEggClicks();

    const choice = EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)];
    markCollected(choice);

    showSticker(
      choice,
      "🥚 Easter egg unlocked!",
      "EG",
      "easter-egg.png"
    );

    playSound(stickerSound);
  }

  machine?.addEventListener("click", () => {
    eggClickCount += 1;
    console.log(`Machine clicked: ${eggClickCount} time(s)`);

    if (eggClickCount === 1) {
      eggClickTimer = setTimeout(() => {
        console.log("Easter egg click timer expired.");
        resetEggClicks();
      }, EGG_WINDOW_MS);
    }

    if (eggClickCount >= EGG_CLICK_TARGET) {
      console.log("Easter egg triggered!");
      triggerEasterEgg();
    }
  });
})();
