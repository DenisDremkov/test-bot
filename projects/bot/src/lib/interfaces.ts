
export interface IBotDomContainer {
  el: Element;
  allDeepChilds: Array<IBotDomContainerChild>;
  path: string;
}

export interface IBotDomContainerChild {
  el: Element;
  indexSpecific: number;  // index of element in container, for case if few tags with the same tag name - <container><div><div/><div><div/><container>
  indexBase: number;  // simple index, order (don't depend from types of tags)
  path: string;
}

