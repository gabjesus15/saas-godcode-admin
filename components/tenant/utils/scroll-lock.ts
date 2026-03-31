let lockCount = 0;
let scrollY = 0;
let previousBodyStyles: Partial<CSSStyleDeclaration> | null = null;
let previousHtmlOverscroll = "";

function getScrollbarCompensation() {
  if (typeof window === "undefined") return 0;
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

export function lockScroll() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  lockCount += 1;
  if (lockCount > 1) return;

  const body = document.body;
  const html = document.documentElement;

  scrollY = window.scrollY || window.pageYOffset || 0;
  previousBodyStyles = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
    touchAction: body.style.touchAction,
    paddingRight: body.style.paddingRight,
  };
  previousHtmlOverscroll = html.style.overscrollBehavior;

  const compensation = getScrollbarCompensation();
  const currentPadding = parseFloat(window.getComputedStyle(body).paddingRight || "0") || 0;

  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  body.style.touchAction = "none";
  if (compensation > 0) {
    body.style.paddingRight = `${currentPadding + compensation}px`;
  }
  html.style.overscrollBehavior = "none";
}

export function unlockScroll() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (lockCount <= 0) return;

  lockCount -= 1;
  if (lockCount > 0) return;

  const body = document.body;
  const html = document.documentElement;

  body.style.position = previousBodyStyles?.position || "";
  body.style.top = previousBodyStyles?.top || "";
  body.style.left = previousBodyStyles?.left || "";
  body.style.right = previousBodyStyles?.right || "";
  body.style.width = previousBodyStyles?.width || "";
  body.style.overflow = previousBodyStyles?.overflow || "";
  body.style.touchAction = previousBodyStyles?.touchAction || "";
  body.style.paddingRight = previousBodyStyles?.paddingRight || "";
  html.style.overscrollBehavior = previousHtmlOverscroll || "";

  window.scrollTo(0, scrollY);
  previousBodyStyles = null;
  previousHtmlOverscroll = "";
}
