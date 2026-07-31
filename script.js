gsap.registerPlugin(ScrollTrigger);

/* ---------- cursor glow ---------- */
const glow = document.querySelector(".cursor-glow");
if (glow) {
  window.addEventListener("pointermove", (e) => {
    gsap.to(glow, {
      x: e.clientX,
      y: e.clientY,
      duration: 0.6,
      ease: "power3.out",
    });
  });
}

/* ---------- nav scroll state ---------- */
const nav = document.querySelector("nav");
if (nav) {
  ScrollTrigger.create({
    start: "top -60",
    onUpdate: (self) => nav.classList.toggle("scrolled", self.scroll() > 60),
  });
}

/* ---------- hero line reveal (text itself is animated by the scramble effect below) ---------- */
gsap.from(".hero .eyebrow", { opacity: 0, y: 10, duration: 0.6, delay: 0.05 });
gsap.from(".hero .sub", { opacity: 0, y: 14, duration: 0.8, delay: 0.7 });
gsap.from(".hero .cta-row", { opacity: 0, y: 14, duration: 0.8, delay: 0.85 });
gsap.from(".scroll-cue", { opacity: 0, duration: 1, delay: 1.2 });

/* ---------- generic scroll reveal ---------- */
gsap.utils.toArray(".reveal").forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 85%" },
  });
});

/* ---------- staggered reveal groups ---------- */
gsap.utils.toArray("[data-stagger]").forEach((group) => {
  const items = group.querySelectorAll(".reveal");
  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: "power3.out",
    stagger: 0.08,
    scrollTrigger: { trigger: group, start: "top 85%" },
  });
});

/* ---------- project card cursor-tracked glow ---------- */
document.querySelectorAll(".pcard").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

/* ---------- animated counters (stat numbers) ---------- */
gsap.utils.toArray("[data-count]").forEach((el) => {
  const target = parseFloat(el.dataset.count);
  const decimals = (el.dataset.count.split(".")[1] || "").length;
  const suffix = el.dataset.suffix || "";
  const obj = { val: 0 };
  ScrollTrigger.create({
    trigger: el,
    start: "top 90%",
    once: true,
    onEnter: () => {
      gsap.to(obj, {
        val: target,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = obj.val.toFixed(decimals) + suffix;
        },
      });
    },
  });
});

/* ================================================================
   V2 - custom cursor, boot sequence, scramble text, magnetic btns,
   constellation nav
   ================================================================ */

/* ---------- custom cursor (dot + trailing ring) ---------- */
const cDot = document.querySelector(".cursor-dot");
const cRing = document.querySelector(".cursor-ring");
if (cDot && cRing && matchMedia("(hover:hover) and (pointer:fine)").matches) {
  const ringPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  window.addEventListener("pointermove", (e) => {
    cDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
    gsap.to(ringPos, {
      x: e.clientX,
      y: e.clientY,
      duration: 0.35,
      ease: "power2.out",
      onUpdate: () => {
        cRing.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%,-50%)`;
      },
    });
  });
  document.addEventListener("pointerover", (e) => {
    if (e.target.closest("a, button, .node, .btn, .magnetic"))
      cRing.classList.add("hovering");
  });
  document.addEventListener("pointerout", (e) => {
    if (e.target.closest("a, button, .node, .btn, .magnetic"))
      cRing.classList.remove("hovering");
  });
}

/* ---------- magnetic buttons ---------- */
document.querySelectorAll(".magnetic").forEach((el) => {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const relX = e.clientX - (r.left + r.width / 2);
    const relY = e.clientY - (r.top + r.height / 2);
    gsap.to(el, {
      x: relX * 0.35,
      y: relY * 0.35,
      duration: 0.3,
      ease: "power2.out",
    });
  });
  el.addEventListener("pointerleave", () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
  });
});

/* ---------- boot sequence (homepage only, once per session) ---------- */
const boot = document.querySelector(".boot");
if (boot) {
  if (sessionStorage.getItem("mp_booted")) {
    boot.remove();
  } else {
    const lines = boot.querySelectorAll(".boot-line");
    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem("mp_booted", "1");
        boot.classList.add("hidden");
        setTimeout(() => boot.remove(), 700);
      },
    });
    lines.forEach((line, i) => {
      const text = line.dataset.text || "";
      const chars = { n: 0 };
      tl.set(line, { opacity: 1 }, "+=0.05");
      tl.to(chars, {
        n: text.length,
        duration: Math.min(text.length * 0.028, 1.1),
        ease: "none",
        onUpdate: () => {
          line.textContent = text.slice(0, Math.floor(chars.n));
        },
      });
      if (i === lines.length - 1)
        tl.to(line, {
          borderRightColor: "transparent",
          duration: 0.3,
          repeat: 3,
          yoyo: true,
        });
      else tl.set(line, { borderRightColor: "transparent" });
    });
    tl.to(boot, { delay: 0.3 });
    const skip = boot.querySelector(".boot-skip");
    if (skip) skip.addEventListener("click", () => tl.progress(1));
    boot.addEventListener("click", () => tl.progress(1));
  }
}

/* ---------- scramble-in text ---------- */
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0101010101";
function scrambleReveal(el, delay = 0) {
  const finalText = el.textContent;
  const len = finalText.length;
  const state = { progress: 0 };
  gsap.to(state, {
    progress: len,
    duration: len * 0.035,
    delay,
    ease: "none",
    onUpdate: () => {
      const revealCount = Math.floor(state.progress);
      let out = "";
      for (let i = 0; i < len; i++) {
        if (finalText[i] === " ") {
          out += " ";
          continue;
        }
        if (i < revealCount) out += finalText[i];
        else
          out +=
            SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = finalText;
    },
  });
}
document.querySelectorAll("[data-scramble]").forEach((el, i) => {
  scrambleReveal(el, (boot ? 2.0 : 0.1) + i * 0.15);
});

/* ---------- constellation project graph ---------- */
const PROJECTS = [
  {
    id: "shopping",
    href: "projects/shopping-assistant.html",
    title: "Shopping Assistant",
    status: "shipped",
    x: 20,
    y: 20,
    hook: "Shoppers face inconsistent specs and noisy reviews. A multi-agent LangGraph pipeline ranks products automatically, +79% precision over keyword search.",
    tags: ["LangGraph", "LLaMA 3.1"],
  },
  {
    id: "rag",
    href: "projects/rag-cleaning.html",
    title: "RAG Data Cleaning",
    status: "shipped",
    x: 50,
    y: 10,
    hook: "Missing specs carry zero signal in a product's own description. Retrieving them from other listings lifted accuracy from 15.6% to 77.1%.",
    tags: ["RAG", "PyDI"],
  },
  {
    id: "emotion",
    href: "projects/emotion-regulation.html",
    title: "Emotion Regulation ML",
    status: "shipped",
    x: 80,
    y: 20,
    hook: "A mental-health app had 28,000+ unlabeled entries, only 100-200 labeled. Active learning on EmoBERTa reached 0.97 ROC-AUC.",
    tags: ["Active Learning", "EmoBERTa"],
  },
  {
    id: "wiki",
    href: "projects/wiki-trends.html",
    title: "Wiki Edit Wars",
    status: "shipped",
    x: 12,
    y: 62,
    hook: "Unclear if contested Wikipedia articles read differently before the fact. A bilingual matched-pairs study found they do, at AUC 0.79.",
    tags: ["NLP", "Stats"],
  },
  {
    id: "fiction",
    href: "projects/ai-fiction.html",
    title: "AI Fiction & Ethics",
    status: "shipped",
    x: 88,
    y: 58,
    hook: "AI-alignment debates often lack concrete cases. A 1977 novel about an uncontainable AI argues why capability keeps outrunning governance.",
    tags: ["AI Ethics"],
  },
  {
    id: "thesis",
    href: "projects/thesis.html",
    title: "Master's Thesis",
    status: "progress",
    x: 32,
    y: 90,
    hook: "Istari.ai's search relied on manual keyword filters over 20M companies. Semantic retrieval matched OpenAI's API at 5.7x the speed.",
    tags: ["Embeddings", "FAISS"],
  },
  {
    id: "framing",
    href: "projects/framing-annotation.html",
    title: "Framing Annotation",
    status: "shipped",
    x: 66,
    y: 92,
    hook: "660K German news paragraphs needed crime-framing labels. An iteratively refined LLM pipeline reached 98.7% agreement with human coders.",
    tags: ["LLM Annotation", "German NLP"],
  },
];
const EDGES = [
  ["shopping", "rag"],
  ["thesis", "rag"],
  ["wiki", "framing"],
  ["emotion", "framing"],
];

const constellation = document.getElementById("constellation");
if (constellation) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "edges");
  constellation.appendChild(svg);

  const hub = document.createElement("div");
  hub.className = "hub";
  hub.style.setProperty("--x", "50%");
  hub.style.setProperty("--y", "50%");
  hub.textContent = "MARMEE.DEV";
  constellation.appendChild(hub);

  const nodeEls = {};
  PROJECTS.forEach((p, i) => {
    const a = document.createElement("a");
    a.className = "node";
    a.href = p.href;
    a.style.setProperty("--x", p.x + "%");
    a.style.setProperty("--y", p.y + "%");
    a.style.setProperty("--dur", 5.5 + (i % 3) + "s");
    a.style.setProperty("--delay", i * 0.4 + "s");
    a.innerHTML = `<div class="n-idx">0${i + 1}</div><div class="n-title">${p.title}</div><div class="n-status ${p.status === "progress" ? "progress" : ""}">${p.status === "progress" ? "In progress" : "Shipped"}</div>`;
    constellation.appendChild(a);
    nodeEls[p.id] = a;

    const preview = document.createElement("div");
    preview.className = "node-preview";
    preview.innerHTML = `<div class="np-hook">${p.hook}</div><div class="np-tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>`;
    constellation.appendChild(preview);

    a.addEventListener("pointerenter", () => {
      const r = a.getBoundingClientRect();
      const cr = constellation.getBoundingClientRect();
      let left = r.left - cr.left + r.width / 2 - 140;
      left = Math.max(8, Math.min(left, cr.width - 288));
      let top = r.top - cr.top + r.height + 12;
      if (top + 140 > cr.height) top = r.top - cr.top - 150;
      preview.style.left = left + "px";
      preview.style.top = top + "px";
      preview.classList.add("visible");
    });
    a.addEventListener("pointerleave", () =>
      preview.classList.remove("visible"),
    );
  });

  function drawEdges() {
    svg.innerHTML = "";
    const cw = constellation.clientWidth,
      ch = constellation.clientHeight;
    const hubX = cw * 0.5,
      hubY = ch * 0.5;
    PROJECTS.forEach((p) => {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      line.setAttribute("x1", hubX);
      line.setAttribute("y1", hubY);
      line.setAttribute("x2", (p.x / 100) * cw);
      line.setAttribute("y2", (p.y / 100) * ch);
      svg.appendChild(line);
    });
    EDGES.forEach(([a, b]) => {
      const pa = PROJECTS.find((p) => p.id === a),
        pb = PROJECTS.find((p) => p.id === b);
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      line.setAttribute("class", "hot");
      line.setAttribute("x1", (pa.x / 100) * cw);
      line.setAttribute("y1", (pa.y / 100) * ch);
      line.setAttribute("x2", (pb.x / 100) * cw);
      line.setAttribute("y2", (pb.y / 100) * ch);
      svg.appendChild(line);
    });
  }

  if (window.innerWidth > 900) {
    constellation.classList.add("active");
    drawEdges();
    window.addEventListener("resize", drawEdges);
    const fallback = document.querySelector(".constellation-fallback");
    if (fallback) fallback.style.display = "none";
  }
}

/* ---------- case study scroll-spy TOC ---------- */
const tocLinks = document.querySelectorAll(".case-toc a");
if (tocLinks.length) {
  tocLinks.forEach((link) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: "top 40%",
      end: "bottom 40%",
      onToggle: (self) => {
        if (self.isActive) {
          tocLinks.forEach((l) => l.classList.remove("active"));
          link.classList.add("active");
        }
      },
    });
  });
}
