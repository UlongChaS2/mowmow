const assetPath = (path: string): string =>
  `${import.meta.env.BASE_URL}${path}`.replace(/\/+/g, "/");

export const characterAssets = {
  spriteSheet: assetPath("assets/lemon/sprite-sheet.png"),
  front: assetPath("assets/lemon/front.png"),
  left: assetPath("assets/lemon/left.png"),
  right: assetPath("assets/lemon/right.png"),
  back: assetPath("assets/lemon/back.png"),
  idle: assetPath("assets/lemon/front.png"),
  eat: assetPath("assets/lemon/front.png"),
} as const;
