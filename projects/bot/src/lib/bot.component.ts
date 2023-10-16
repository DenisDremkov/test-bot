import { Component, HostListener } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CSS_CLASS_ACTIVE, CSS_ALL_CLASSES, BOT_ACTIONS, BOT_STEPS, CSS_CLASS_OVERLAY, CSS_CLASS_PREDICTED, CSS_CLASS_SIMILAR } from './const';
import { IBotDomContainer, IBotDomContainerChild } from './interfaces';
import { createOverlayWithStyles, getDeepChilds, getPathFromRoot, isClickableElement, isHasSiblingWithSameTagAndChilds, isInputElement } from './helpers';

interface IAction {title: string, type: BOT_ACTIONS};

@Component({
  selector: 'denys-bot',
  templateUrl: './bot.component.html',
  styleUrls: ['./bot.component.scss'],
})
export class DenysBotComponent {

  public readonly BOT_STEPS = BOT_STEPS;
  public readonly BOT_ACTIONS = BOT_ACTIONS;

  private stylesEl?: HTMLStyleElement;
  private prevHighlightedContainers: Array<Element> = [];
  private overlay?: HTMLDivElement;
  private similarContainers: Array<IBotDomContainer> = [];

  public inputText?: string;
  public lastHoveredElem?: Element;
  public selectedByUserContainers: Array<IBotDomContainer> = [];
  public predictedContainers: Array<IBotDomContainer> = [];
  public currStep$ = new BehaviorSubject<BOT_STEPS>(BOT_STEPS.SELECT_CONTAINERS);
  public currAction?: IAction;
  public highlightedElements: Array<IBotDomContainerChild> = [];
  public selectedByUserElements: Array<IBotDomContainerChild> = [];
  public predictedElements: Array<IBotDomContainerChild> = [];
  public actions: Array<IAction> = [
    {
      title: 'Click element',
      type: BOT_ACTIONS.CLICK
    },
    {
      title: 'Input text',
      type: BOT_ACTIONS.INPUT
    }
  ];

  get predictedContainersAmount(): number {
    return this.similarContainers.length - this.selectedByUserContainers.length;
  }
  get isSelectContainers(): boolean {
    return this.currStep$.value === BOT_STEPS.SELECT_CONTAINERS;
  }
  get isSelectActions(): boolean {
    return this.currStep$.value === BOT_STEPS.SELECT_ACTIONS;
  }
  get isSelectElements(): boolean {
    return this.currStep$.value === BOT_STEPS.SELECT_ELEMENTS;
  }
  get isDisabledForInputAction(): boolean {
    return this.currAction?.type === BOT_ACTIONS.INPUT && !this.inputText;
  }
  get isClickAction(): boolean {
    return this.currAction?.type === BOT_ACTIONS.CLICK;
  }
  get isInputAction(): boolean {
    return this.currAction?.type === BOT_ACTIONS.INPUT;
  }

  @HostListener('window:mousemove', ['$event'])
    onMousemove(e: MouseEvent) {
      if (e.target) {
        this.handleMousemove(e.target as Element);
      }
    }

  ngOnInit(): void {
    this.createStyles();
  }

  ngOnDestroy(): void {
    document.head.removeChild(this.stylesEl as HTMLStyleElement);
  }


  private removeOverlay(): void {
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = undefined;
    }
  }

  private createOverlay(el: Element): void {
    this.removeOverlay();
    this.lastHoveredElem = el;
    const overlay = createOverlayWithStyles(el);
    this.addClickEventToOverlay(overlay, el);
    this.overlay = overlay;
    document.body.append(overlay);
  }

  private addClickEventToOverlay(overlay: HTMLDivElement, el: Element): void {
    overlay.addEventListener('click', () => {
      if (this.isSelectContainers) {
        this.handleSelectContainer(el);
      } else if (this.isSelectElements) {
        this.handleSelectElement(el);
      }
    })
  }

  private handleSelectElement(el: Element): void {
    const item = this.findItem(el);
    if (item) {
      item.el.classList.add(CSS_CLASS_ACTIVE);
      this.selectedByUserElements.push(item);
      if (this.selectedByUserElements.length === 2 && !this.predictedElements.length) {
        this.setPredictedElements(item);
      }
    }
  }

  private getElementsForAction(): Array<IBotDomContainerChild> {
    return [...this.selectedByUserElements, ...(this.predictedElements || [])];
  }

  private setPredictedElements(child: IBotDomContainerChild): void {
    const indexOfChild = child.indexBase;
    this.predictedElements = [];
    this.similarContainers.forEach(cont => {
      const child = cont.allDeepChilds[indexOfChild];
      if (this.selectedByUserElements.indexOf(child) === -1) {
        this.predictedElements.push(child);
        if (!child.el.classList.contains(CSS_CLASS_PREDICTED)) {
          child.el.classList.add(CSS_CLASS_PREDICTED);
        }
      }
    });
  }

  private handleSelectContainer(el: Element): void {
    if (this.selectedByUserContainers.find(i => i.el ===  el)) {
      el.classList.remove(CSS_CLASS_ACTIVE);
      this.selectedByUserContainers = this.selectedByUserContainers.filter(i => i.el !== el);
    } else {
      el.classList.add(CSS_CLASS_ACTIVE);
      this.selectedByUserContainers = [...this.selectedByUserContainers, this.createContainer(el)];
      if (this.selectedByUserContainers.length === 2) {
        this.predictedContainers = [];
        this.similarContainers.forEach(i => {
          const el = i.el;
          const find = this.selectedByUserContainers.find(i => i.el === el)
          if (!find) {
            this.predictedContainers.push(this.createContainer(el));
            el.classList.add(CSS_CLASS_PREDICTED);
          }
        })
      }
    }
  }

  private handleHighlightContainer(target: Element): void {
    const parentWithSameSiblings = this.findParentWithSameSiblings(target);
    const wrapperForList = parentWithSameSiblings?.parentElement;
    if (wrapperForList) {
      const childs = Array.from(wrapperForList?.children || [])
        .filter(i => i.tagName === parentWithSameSiblings.tagName);
      const isOtherList = Boolean(this.selectedByUserContainers.length && !this.selectedByUserContainers.find(i => {
        return childs.indexOf(i.el) !== -1;
      }))
      if (isOtherList) {
        return;
      }
      this.similarContainers = childs.map(el => this.createContainer(el));
      this.createOverlay(parentWithSameSiblings);
      if (childs.length > 1 ) {
        this.removeContainersHighlights();
        this.prevHighlightedContainers = childs;
        childs.forEach(i => i.classList.add(CSS_CLASS_SIMILAR));
      } else {
        this.removeContainersHighlights();
      }
    } else {
      this.removeContainersHighlights();
    }
  }

  private handleMousemove(el: Element): void {
    if (this.lastHoveredElem !== el) {
      if (this.isSelectContainers && !el.classList.contains(CSS_CLASS_OVERLAY)) {
        this.removeOverlay();
        this.handleHighlightContainer(el);
      }
      if (this.isSelectElements) {
        this.handleHighlightElements(el);
      }
      this.lastHoveredElem = el;
    }
  }

  private isSameChildLevel(el: Element): boolean {
    return this.selectedByUserElements?.length
      ? this.findItem(el)?.indexBase === this.selectedByUserElements[0].indexBase
      : true;
  }

  private handleHighlightElements(el: Element): void {
    if (this.isInsideOfSelectedContainers(el) && this.isSameChildLevel(el)) {
      if (this.currAction?.type === BOT_ACTIONS.INPUT && isInputElement(el)) {
        this.createOverlay(el);
        this.highlightSimilarElements(el);
      }
      if (this.currAction?.type === BOT_ACTIONS.CLICK && isClickableElement(el)) {
        this.createOverlay(el);
        this.highlightSimilarElements(el);
      }
    }
  }

  private findItem(el: Element): IBotDomContainerChild | undefined {
    let res;
    this.similarContainers.some(cont => {
      return cont.allDeepChilds.find(child => {
        if (child.el === el) {
          res = child;
          return true;
        }
        return false;
      })
    })
    return res;
  }

  private findSimilarElementsByPath(v: IBotDomContainerChild): void {
    this.highlightedElements?.forEach(i => i.el.classList.remove(CSS_CLASS_SIMILAR));
    const similarElements: Array<IBotDomContainerChild> = [];
    this.similarContainers.forEach(cont => {
      const child = cont.allDeepChilds?.filter(el => el.path === v.path)[v.indexSpecific];
      child.el.classList.add(CSS_CLASS_SIMILAR);
      similarElements.push(child);
    });
    this.highlightedElements = similarElements;
  }

  private highlightSimilarElements(el: Element): void {
    const item = this.findItem(el);
    if (item) {
      this.removeElementsHighlights();
      this.findSimilarElementsByPath(item);
    }
  }

  private createContainer(el: Element): IBotDomContainer {
    const childs = getDeepChilds(el);
    return {
      el: el,
      allDeepChilds: childs.map((childEl, index) => {
        const v: IBotDomContainerChild = {
          el: childEl,
          indexBase: index,
          indexSpecific: childs.filter(i => i.tagName === childEl.tagName).findIndex(i => i === childEl),
          path: getPathFromRoot(childEl, '')
        }
        return v;
      }),
      path: getPathFromRoot(el, '')
    }
  }

  private isInsideOfSelectedContainers(el: Element): boolean {
    const isInsideOfContainers =  this.selectedByUserContainers.find(i => el !== i.el && i.el.contains(el))
      || this.predictedContainers.find(i => el !== i.el && i.el.contains(el));
    return Boolean(isInsideOfContainers)
  }

  private findParentWithSameSiblings(el: Element): Element | null {
    const isItemOfListWithChilds = Boolean(el.children.length);
    if (isItemOfListWithChilds && isHasSiblingWithSameTagAndChilds(el)) {
      return el;
    } else {
      return el.parentElement
        ? this.findParentWithSameSiblings(el.parentElement)
        : null;
    }
  }

  private removeContainersHighlights(): void {
    this.prevHighlightedContainers?.forEach(e => {
      e.classList.remove(CSS_CLASS_SIMILAR);
    });
  }

  private removeElementsHighlights(): void {
    this.highlightedElements?.forEach(i => {
      i.el.classList.remove(CSS_CLASS_SIMILAR);
    })
  }

  private clearClasses(el: Element): void {
    CSS_ALL_CLASSES.forEach(cl => {
      if (el.classList.contains(cl)) {
        el.classList.remove(cl);
      }
    });
  }

  private removeDomClasses(): void {
    this.similarContainers?.forEach(cont => {
      this.clearClasses(cont.el);
      cont.allDeepChilds.forEach(child => {
        this.clearClasses(child.el);
      })
    });
  }

  // global styles
  private createStyles(): void {
    var sheet = document.createElement('style');
    sheet.innerHTML = `
      .${CSS_CLASS_SIMILAR} {
        outline: 1px dashed red;
      }

      .${CSS_CLASS_ACTIVE} {
        outline: 2px solid green!important;
      }

      .${CSS_CLASS_PREDICTED} {
        outline: 2px solid blue!important;
      }
    `;
    document.head.appendChild(sheet);
  }

  private executeAction(): void {
    this.getElementsForAction()?.forEach(i => {
      switch (this.currAction?.type) {
        case BOT_ACTIONS.CLICK:
          var clickEvent = new MouseEvent('click', {
            'view': window,
            'bubbles': true,
            'cancelable': false
          });
          i.el.dispatchEvent(clickEvent);
          break;
        case BOT_ACTIONS.INPUT:
          (i.el as HTMLInputElement).value = this.inputText as string;
          break;
        default:
          break;
      }
    })
  }

  private clearState(): void {
    this.prevHighlightedContainers = [];
    this.removeOverlay();
    this.similarContainers = [];
    this.inputText = undefined;
    this.lastHoveredElem = undefined;
    this.selectedByUserContainers = [];
    this.predictedContainers = [];
    this.currStep$.next(BOT_STEPS.SELECT_CONTAINERS);
    this.currAction = undefined;
    this.highlightedElements = [];
    this.selectedByUserElements = [];
    this.predictedElements = [];
  }

  addAction(v: IAction): void {
    this.removeOverlay();
    this.currAction = v;
    this.currStep$.next(BOT_STEPS.SELECT_ELEMENTS);
  }

  reset(): void {
    this.removeDomClasses();
    this.clearState();
  }

  save(): void {
    this.currStep$.next(BOT_STEPS.SELECT_ACTIONS);
  }

  run(): void {
    this.executeAction();
    this.reset();
  }
}
