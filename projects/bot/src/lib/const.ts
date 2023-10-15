export const PATH_DIVIDER = '___';

export const CSS_CLASS_OVERLAY = 'denys-bot__overlay'
export const CSS_CLASS_ACTIVE = 'denys-bot__container--active';
export const CSS_CLASS_SIMILAR = 'denys-bot__container--similar';
export const CSS_CLASS_PREDICTED = 'denys-bot__container--active-predicted';
export const CSS_ALL_CLASSES = [CSS_CLASS_ACTIVE, CSS_CLASS_SIMILAR, CSS_CLASS_PREDICTED];

export enum BOT_ACTIONS {
  CLICK = 'Click',
  INPUT = 'Input'
}

export enum BOT_STEPS {
  SELECT_CONTAINERS = 1,
  SELECT_ACTIONS = 2,
  SELECT_ELEMENTS = 3,
}
