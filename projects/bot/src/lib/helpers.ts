import { CSS_CLASS_OVERLAY, PATH_DIVIDER } from "./const";

function isHasAnySibling(el: Element): boolean {
  return Boolean(el.previousElementSibling || el.nextElementSibling?.nodeName);
}

function isSiblingWithSameChilds(el: Element, sibling: Element): boolean {
  return getChildTagsSequence(el) === getChildTagsSequence(sibling);
}

function getChildTagsSequence(el: Element): string {
  return Array.from(el.children).map(i => i.tagName).join(PATH_DIVIDER);
}

function isPrevSiblingValid(el: Element): boolean {
  return el.previousElementSibling?.nodeName === el.nodeName && isSiblingWithSameChilds(el, el.previousElementSibling);
}

function isNextSiblingValid(el: Element): boolean {
  return el.nextElementSibling?.nodeName === el.nodeName && isSiblingWithSameChilds(el, el.nextElementSibling);
}

export function isHasSiblingWithSameTagAndChilds (el: Element): boolean {
  return isHasAnySibling(el) && (isPrevSiblingValid(el) || isNextSiblingValid(el));
}

export function createOverlayWithStyles(el: Element): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.style.backgroundColor = 'transparent';
  overlay.style.position = 'fixed';
  overlay.style.zIndex = '10000000';
  overlay.classList.add(CSS_CLASS_OVERLAY);
  overlay.style.cursor = 'pointer';
  overlay.style.top = el.getBoundingClientRect().y + 1  + 'px';
  overlay.style.left = el.getBoundingClientRect().x + 1  + 'px';
  overlay.style.width = el.clientWidth - 2 + 'px';
  overlay.style.height = el.clientHeight - 2  + 'px';
  overlay.setAttribute("id", `${CSS_CLASS_OVERLAY}-${Math.random()}`);
  return overlay;
}

export function getPathFromRoot(el: Element, p: string): string {
  const path = p.toLowerCase();
  if (el.parentElement) {
    const  p = el.tagName + (path === '' ? '' : PATH_DIVIDER + path);
    return getPathFromRoot(el.parentElement, p);
  } else {
    return path;
  }
}

export function getDeepChilds(el: Element, acc: Array<Element> = []): Array<Element> {
  const list = el.children ? Array.from(el.children) : []
  return list.reduce((acc, i) => {
    let res = acc;
    acc.push(i);
    if (i.children?.length) {
      const list = getDeepChilds(i, acc);
      res = [...res, ...list]
    }
    return res;
  }, acc || [])
}

export function isInputElement(el: Element): boolean {
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
}

export function isClickableElement(el: Element): boolean {
  return !isInputElement(el);
}

