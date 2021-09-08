import { getSplitAnchor } from '../diagrams';
import { Direction } from '../data';
import { distance, facePoint, Point, rotatePoint, translatePoint } from '../point';
import { calcRelativePoint, Rect, scaleRect } from '../rect';
import { globalStore, TopologyStore } from '../store';

export enum PenType {
  Node,
  Line,
}

export enum LockState {
  None,
  DisableEdit,
  DisableMove,
  // DisableActive,
  Disable = 10,
}

export enum AnchorMode {
  Default,
  In,
  Out,
}

export interface Pen {
  id?: string;
  tags?: string[];
  parentId?: string;
  type?: PenType;
  name?: string;
  x?: number;
  y?: number;
  ex?: number;
  ey?: number;
  width?: number;
  height?: number;
  rotate?: number;
  center?: Point;
  borderRadius?: number;
  layer?: number;
  // Hidden only visible === false
  visible?: boolean;
  locked?: LockState;

  // 连线是否闭合路径
  close?: boolean;
  // 连线长度
  length?: number;

  title?: string;
  markdown?: string;

  autoRect?: boolean;

  lineWidth?: number;
  globalAlpha?: number;
  lineDash?: number[];
  lineDashOffset?: number;
  color?: string;
  background?: string;
  anchorColor?: string;
  hoverColor?: string;
  hoverBackground?: string;
  activeColor?: string;
  activeBackground?: string;
  bkType?: number;
  lineCap?: string;
  lineJoin?: string;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  text?: string;
  textWidth?: number;
  textHeight?: number;
  textLeft?: number;
  textTop?: number;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  fontStyle?: string;
  fontWeight?: string;
  textAlign?: string;
  textBaseline?: string;
  textBackground?: string;
  whiteSpace?: string;
  ellipsis?: boolean;

  image?: string;
  icon?: string;
  iconRotate?: number;
  iconWidth?: number;
  iconHeight?: number;
  iconTop?: number;
  iconLeft?: number;
  iconColor?: string;
  iconFamily?: string;
  iconSize?: number;
  iconAlign?: string;

  disableInput?: boolean;
  disableRotate?: boolean;
  disableSize?: boolean;
  disableAnchor?: boolean;

  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;

  backgroundImage?: string;
  strokeImage?: string;

  children?: Pen[];

  anchors?: Point[];
  anchorRadius?: number;
  anchorBackground?: string;

  pathId?: string;
  path?: string;

  connectedLines?: { lineId: string; lineAnchor: string; anchor: string }[];

  // Cycle count. Infinite if <= 0.
  animateCycle?: number;
  nextAnimate?: string;
  autoPlay?: boolean;

  // 动画时长
  duration?: number;
  // 动画开始时间
  start?: number;
  // 动画结束时间
  end?: number;
  // 匀速渐变
  linear: boolean;
  // 主要用于动画帧的缩放
  scale?: number;
  // 连线动画速度
  animateSpan: number;

  frames?: Pen[];
  // 提前预置的不同效果的动画组
  animateList?: Pen[][];

  calculative?: {
    worldRect?: Rect;
    worldAnchors?: Point[];
    worldIconRect?: Rect;
    worldTextRect?: Rect;
    textDrawRect?: Rect;
    svgRect?: Rect;

    rotate?: number;
    lineWidth?: number;
    globalAlpha?: number;
    lineDash?: number[];
    lineDashOffset?: number;
    color?: string;
    background?: string;
    anchorColor?: string;
    hoverColor?: string;
    hoverBackground?: string;
    activeColor?: string;
    activeBackground?: string;
    bkType?: number;
    lineCap?: string;
    lineJoin?: string;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;

    text?: string;
    textWidth?: number;
    textHeight?: number;
    textLeft?: number;
    textTop?: number;
    textColor?: string;
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
    fontStyle?: string;
    fontWeight?: string;
    textBackground?: string;
    iconSize?: number;
    icon?: string;
    iconRotate?: number;
    iconWidth?: number;
    iconHeight?: number;
    iconTop?: number;
    iconLeft?: number;
    iconColor?: string;

    textLines?: string[];
    image?: string;
    img?: HTMLImageElement;
    imgNaturalWidth?: number;
    imgNaturalHeight?: number;
    backgroundImage?: string;
    strokeImage?: string;
    backgroundImg?: HTMLImageElement;
    strokeImg?: HTMLImageElement;
    active?: boolean;
    hover?: boolean;
    activeAnchor?: Point;
    dirty?: boolean;
    visible?: boolean;
    drawlineH?: boolean;

    animateStart?: number;
    animateCycleIndex?: number;
  };
}

export function getParent(pens: any, pen: Pen) {
  if (!pen.parentId) {
    return undefined;
  }

  return getParent(pens, pens[pen.parentId]) || pens[pen.parentId];
}

export function renderPen(ctx: CanvasRenderingContext2D, pen: Pen, path: Path2D, store: TopologyStore) {
  if (globalStore.independentDraws[pen.name]) {
    ctx.save();
    globalStore.independentDraws[pen.name](ctx, pen, store);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(0.5, 0.5);
  ctx.beginPath();
  // for canvas2svg
  if ((ctx as any).setAttrs) {
    (ctx as any).setAttrs(pen);
  }
  // end

  if (pen.calculative.rotate) {
    ctx.translate(pen.calculative.worldRect.center.x, pen.calculative.worldRect.center.y);
    ctx.rotate((pen.calculative.rotate * Math.PI) / 180);
    ctx.translate(-pen.calculative.worldRect.center.x, -pen.calculative.worldRect.center.y);
  }

  if (pen.calculative.lineWidth > 1) {
    ctx.lineWidth = pen.calculative.lineWidth;
  }

  let fill: any;
  if (pen.calculative.hover) {
    ctx.strokeStyle = pen.hoverColor || store.options.hoverColor;
    ctx.fillStyle = pen.hoverBackground || store.options.hoverBackground;
    fill = pen.hoverBackground || store.options.hoverBackground;
  } else if (pen.calculative.active) {
    ctx.strokeStyle = pen.activeColor || store.options.activeColor;
    ctx.fillStyle = pen.activeBackground || store.options.activeBackground;
    fill = pen.activeBackground || store.options.activeBackground;
  } else {
    if (pen.strokeImage) {
      if (pen.calculative.strokeImg) {
        ctx.strokeStyle = ctx.createPattern(pen.calculative.strokeImg, 'repeat');
        fill = true;
      }
    } else {
      ctx.strokeStyle = pen.color;
    }

    if (pen.backgroundImage) {
      if (pen.calculative.backgroundImg) {
        ctx.fillStyle = ctx.createPattern(pen.calculative.backgroundImg, 'repeat');
        fill = true;
      }
    } else {
      ctx.fillStyle = pen.background;
      fill = pen.background;
    }
  }

  if (pen.calculative.lineCap) {
    ctx.lineCap = pen.calculative.lineCap as CanvasLineCap;
  } else if (pen.type) {
    ctx.lineCap = 'round';
  }

  if (pen.calculative.lineJoin) {
    ctx.lineJoin = pen.calculative.lineJoin as CanvasLineJoin;
  } else if (pen.type) {
    ctx.lineJoin = 'round';
  }

  if (pen.calculative.globalAlpha < 1) {
    ctx.globalAlpha = pen.calculative.globalAlpha;
  }

  if (pen.calculative.lineDash) {
    ctx.setLineDash(pen.calculative.lineDash);
  }
  if (pen.calculative.lineDashOffset) {
    ctx.lineDashOffset = pen.calculative.lineDashOffset;
  }

  if (pen.calculative.shadowColor) {
    ctx.shadowColor = pen.calculative.shadowColor;
    ctx.shadowOffsetX = pen.calculative.shadowOffsetX;
    ctx.shadowOffsetY = pen.calculative.shadowOffsetY;
    ctx.shadowBlur = pen.calculative.shadowBlur;
  }

  if (path) {
    fill && ctx.fill(path);
    ctx.stroke(path);
  }

  if (pen.type && pen.calculative.active) {
    renderLineAnchors(ctx, pen, store);
  }

  if (globalStore.draws[pen.name]) {
    ctx.save();
    const ret = globalStore.draws[pen.name](ctx, pen, store);
    ctx.restore();
    // Finished on render.
    if (ret) {
      return;
    }
  }

  if (pen.image && pen.calculative.img) {
    ctx.save();
    ctx.shadowColor = '';
    ctx.shadowBlur = 0;
    const rect = pen.calculative.worldIconRect;
    let x = rect.x;
    let y = rect.y;
    let w = rect.width;
    let h = rect.height;
    if (pen.calculative.iconWidth) {
      w = pen.calculative.iconWidth;
    }
    if (pen.calculative.iconHeight) {
      h = pen.calculative.iconHeight;
    }
    if (pen.calculative.imgNaturalWidth && pen.calculative.imgNaturalHeight) {
      let scaleW = rect.width / pen.calculative.imgNaturalWidth;
      let scaleH = rect.height / pen.calculative.imgNaturalHeight;
      let scaleMin = scaleW > scaleH ? scaleH : scaleW;
      if (pen.iconWidth) {
        h = scaleMin * pen.iconWidth; //(pen.calculative.imgNaturalHeight / pen.calculative.imgNaturalWidth) * w;
      } else {
        w = scaleMin * pen.calculative.imgNaturalWidth; // (pen.calculative.imgNaturalWidth / pen.calculative.imgNaturalHeight) * h;
      }
      if (pen.iconHeight) {
        h = scaleMin * pen.iconHeight;
      } else {
        h = scaleMin * pen.calculative.imgNaturalHeight;
      }
    }
    x += (rect.width - w) / 2;
    y += (rect.height - h) / 2;

    if (pen.iconRotate) {
      ctx.translate(rect.center.x, rect.center.y);
      ctx.rotate((pen.iconRotate * Math.PI) / 180);
      ctx.translate(-rect.center.x, -rect.center.y);
    }

    ctx.drawImage(pen.calculative.img, x, y, w, h);
    ctx.restore();
  } else if (pen.icon) {
    ctx.save();
    ctx.shadowColor = '';
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const iconRect = pen.calculative.worldIconRect;
    let x = iconRect.x + iconRect.width / 2;
    let y = iconRect.y + iconRect.height / 2;

    if (pen.calculative.iconSize > 0) {
      ctx.font = `${pen.calculative.iconSize}px ${pen.iconFamily}`;
    } else if (iconRect.width > iconRect.height) {
      ctx.font = `${iconRect.height}px ${pen.iconFamily}`;
    } else {
      ctx.font = `${iconRect.width}px ${pen.iconFamily}`;
    }
    ctx.fillStyle = pen.iconColor || pen.textColor || store.options.textColor;

    if (pen.calculative.worldRect.rotate) {
      ctx.translate(iconRect.center.x, iconRect.center.y);
      ctx.rotate((pen.calculative.worldRect.rotate * Math.PI) / 180);
      ctx.translate(-iconRect.center.x, -iconRect.center.y);
    }

    ctx.beginPath();
    ctx.fillText(pen.icon, x, y);

    ctx.restore();
  }

  if (pen.text) {
    ctx.save();
    ctx.fillStyle = pen.textColor || pen.color;
    if (pen.calculative.textBackground) {
      ctx.save();
      ctx.fillStyle = pen.calculative.textBackground;
      let x = 0;
      if (pen.textAlign === 'right') {
        x = pen.calculative.textDrawRect.width;
      }
      ctx.fillRect(
        pen.calculative.textDrawRect.x - x,
        pen.calculative.textDrawRect.y,
        pen.calculative.textDrawRect.width,
        pen.calculative.textDrawRect.height
      );
      ctx.restore();
    }

    ctx.font = `${pen.fontStyle || 'normal'} normal ${pen.fontWeight || 'normal'} ${pen.fontSize}px/${pen.lineHeight} ${
      pen.fontFamily
    }`;

    if (pen.textAlign) {
      ctx.textAlign = pen.textAlign as any;
    } else {
      ctx.textAlign = 'center';
    }

    if (pen.textBaseline) {
      ctx.textBaseline = pen.textBaseline as any;
    }

    let y = 0.5;
    switch (pen.textBaseline) {
      case 'top':
        y = 0;
        break;
      case 'bottom':
        y = 1;
        break;
    }
    pen.calculative.textLines.forEach((text, i) => {
      let x = 0;
      if (!pen.textAlign) {
        x = pen.calculative.textDrawRect.width / 2;
      }
      ctx.fillText(
        text,
        pen.calculative.textDrawRect.x + x,
        pen.calculative.textDrawRect.y + (i + y) * pen.fontSize * pen.lineHeight
      );
    });

    ctx.restore();
  }

  ctx.restore();
}

export function renderLineAnchors(ctx: CanvasRenderingContext2D, pen: Pen, store: TopologyStore) {
  ctx.save();
  ctx.fillStyle = pen.activeColor || store.options.activeColor;
  pen.calculative.worldAnchors.forEach((pt) => {
    !pt.hidden && renderAnchor(ctx, pt, pen.calculative.activeAnchor === pt);
  });
  ctx.restore();
}

export function renderAnchor(ctx: CanvasRenderingContext2D, pt: Point, active?: boolean) {
  if (!pt) {
    return;
  }

  const r = 3;

  if (active) {
    if (pt.prev) {
      ctx.save();
      ctx.strokeStyle = '#4dffff';
      ctx.beginPath();
      ctx.moveTo(pt.prev.x, pt.prev.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.prev.x, pt.prev.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (pt.next) {
      ctx.save();
      ctx.strokeStyle = '#4dffff';
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.next.x, pt.next.y);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.next.x, pt.next.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export function calcWorldRects(pens: { [key: string]: Pen }, pen: Pen) {
  let rect: Rect = {
    x: pen.x,
    y: pen.y,
  };

  if (!pen.parentId) {
    rect.ex = pen.x + pen.width;
    rect.ey = pen.y + pen.height;
    rect.width = pen.width;
    rect.height = pen.height;
    rect.rotate = pen.rotate;
    rect.center = {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    };
  } else {
    let parentRect = pens[pen.parentId].calculative.worldRect;
    if (!parentRect) {
      parentRect = calcWorldRects(pens, pens[pen.parentId]);
    }

    rect.x = parentRect.x + parentRect.width * pen.x;
    rect.y = parentRect.y + parentRect.height * pen.y;
    rect.width = parentRect.width * pen.width;
    rect.height = parentRect.height * pen.height;
    rect.ex = rect.x + rect.width;
    rect.ey = rect.y + rect.height;

    rect.rotate = parentRect.rotate + pen.rotate;
    rect.center = {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    };
  }

  pen.calculative.worldRect = rect;

  return rect;
}

export function calcWorldAnchors(pen: Pen) {
  const anchors: Point[] = [];
  if (pen.anchors) {
    pen.anchors.forEach((anchor) => {
      anchors.push(calcWorldPointOfPen(pen, anchor));
    });
  }

  // Default anchors of node
  if (!anchors.length && !pen.type) {
    anchors.push({
      id: '0',
      penId: pen.id,
      x: pen.calculative.worldRect.x + pen.calculative.worldRect.width * 0.5,
      y: pen.calculative.worldRect.y,
    });

    anchors.push({
      id: '1',
      penId: pen.id,
      x: pen.calculative.worldRect.x + pen.calculative.worldRect.width,
      y: pen.calculative.worldRect.y + pen.calculative.worldRect.height * 0.5,
    });

    anchors.push({
      id: '2',
      penId: pen.id,
      x: pen.calculative.worldRect.x + pen.calculative.worldRect.width * 0.5,
      y: pen.calculative.worldRect.y + pen.calculative.worldRect.height,
    });

    anchors.push({
      id: '3',
      penId: pen.id,
      x: pen.calculative.worldRect.x,
      y: pen.calculative.worldRect.y + pen.calculative.worldRect.height * 0.5,
    });
  }

  if (pen.rotate) {
    anchors.forEach((anchor) => {
      rotatePoint(anchor, pen.rotate, pen.calculative.worldRect.center);
    });
  }

  if (!pen.type || pen.anchors) {
    pen.calculative.worldAnchors = anchors;
  }

  if (pen.calculative.activeAnchor && anchors.length) {
    pen.calculative.activeAnchor = anchors.find((a) => {
      a.id === pen.calculative.activeAnchor.id;
    });
  }
}

export function calcWorldPointOfPen(pen: Pen, pt: Point) {
  const p: Point = { ...pt };
  p.x = pen.calculative.worldRect.x + pen.calculative.worldRect.width * pt.x;
  p.y = pen.calculative.worldRect.y + pen.calculative.worldRect.height * pt.y;
  if (pt.prev) {
    p.prev = {
      penId: pen.id,
      connectTo: pt.prev.connectTo,
      x: pen.calculative.worldRect.x + pen.calculative.worldRect.width * pt.prev.x,
      y: pen.calculative.worldRect.y + pen.calculative.worldRect.height * pt.prev.y,
    };
  }
  if (pt.next) {
    p.next = {
      penId: pen.id,
      connectTo: pt.next.connectTo,
      x: pen.calculative.worldRect.x + pen.calculative.worldRect.width * pt.next.x,
      y: pen.calculative.worldRect.y + pen.calculative.worldRect.height * pt.next.y,
    };
  }

  return p;
}

export function calcIconRect(pens: { [key: string]: Pen }, pen: Pen) {
  let x = pen.calculative.iconLeft || 0;
  let y = pen.calculative.iconTop || 0;
  let width = pen.calculative.iconWidth || pen.calculative.worldRect.width;
  let height = pen.calculative.iconHeight || pen.calculative.worldRect.height;
  if (x && Math.abs(x) < 1) {
    x = pen.calculative.worldRect.width * pen.calculative.iconLeft;
  }

  if (y && Math.abs(y) < 1) {
    y = pen.calculative.worldRect.height * pen.calculative.iconLeft;
  }
  if (width && Math.abs(width) < 1) {
    width = pen.calculative.worldRect.width * pen.calculative.iconWidth;
  }

  if (height && Math.abs(height) < 1) {
    height = pen.calculative.worldRect.height * pen.calculative.iconHeight;
  }

  let rotate = pen.calculative.iconRotate || 0;
  if (pen.parentId) {
    const parentPen = pens[pen.parentId].calculative;
    if (parentPen) {
      rotate += parentPen.rotate;
      rotate %= 360;
    }
  }

  x = pen.calculative.worldRect.x + x;
  y = pen.calculative.worldRect.y + y;
  pen.calculative.worldIconRect = {
    x,
    y,
    width,
    height,
    ex: x + width,
    ey: y + height,
    rotate,
  };
}

export function scalePen(pen: Pen, scale: number, center: Point) {
  if (!pen.lineWidth) {
    pen.lineWidth = 1;
  }
  pen.calculative.lineWidth = pen.lineWidth * scale;
  pen.calculative.lineHeight = pen.lineHeight * scale;
  pen.calculative.fontSize = pen.fontSize * scale;
  pen.calculative.iconSize = pen.iconSize * scale;
  pen.calculative.iconWidth = pen.iconWidth * scale;
  pen.calculative.iconHeight = pen.iconHeight * scale;
  pen.calculative.iconLeft = pen.iconLeft * scale;
  pen.calculative.iconTop = pen.iconTop * scale;
  pen.calculative.textWidth = pen.textWidth * scale;
  pen.calculative.textHeight = pen.textHeight * scale;
  pen.calculative.textLeft = pen.textLeft * scale;
  pen.calculative.textTop = pen.textTop * scale;
  scaleRect(pen.calculative.worldRect, scale, center);
  if (pen.type) {
    calcWorldAnchors(pen);
  }
}

export function pushPenAnchor(pen: Pen, pt: Point) {
  if (!pen.anchors) {
    pen.anchors = [];
  }
  if (!pen.calculative.worldAnchors) {
    pen.calculative.worldAnchors = [];
  }

  const worldAnchor = {
    id: pt.id,
    penId: pen.id,
    x: pt.x,
    y: pt.y,
  };
  pen.calculative.worldAnchors.push(worldAnchor);

  if (pen.calculative.worldRect) {
    if (pen.rotate % 360) {
      rotatePoint(pt, -pen.rotate, pen.calculative.worldRect.center);
    }

    const anchor = {
      id: pt.id,
      penId: pen.id,
      x: (pt.x - pen.calculative.worldRect.x) / pen.calculative.worldRect.width,
      y: (pt.y - pen.calculative.worldRect.y) / pen.calculative.worldRect.height,
    };
    pen.anchors.push(anchor);
  }

  return worldAnchor;
}

export function addLineAnchor(pen: Pen, pt: Point, index: number) {
  if (!pen.anchors) {
    pen.anchors = [];
  }
  if (!pen.calculative.worldAnchors) {
    pen.calculative.worldAnchors = [];
  }

  const worldAnchor = getSplitAnchor(pen, pt, index);
  pen.calculative.worldAnchors.splice(index + 1, 0, worldAnchor);
  pen.anchors.splice(index + 1, 0, calcRelativePoint(worldAnchor, pen.calculative.worldRect));
  pen.calculative.activeAnchor = worldAnchor;
  return worldAnchor;
}

export function removePenAnchor(pen: Pen, anchor: Point) {
  if (!pen || !pen.calculative.worldAnchors) {
    return;
  }
  let i = pen.calculative.worldAnchors.findIndex((a) => a.id === anchor.id);
  if (i > -1) {
    pen.calculative.worldAnchors.splice(i, 1);
  }

  i = pen.anchors.findIndex((a) => a.id === anchor.id);
  if (i > -1) {
    pen.anchors.splice(i, 1);
  }
}

export function facePen(pt: Point, pen?: Pen) {
  if (!pen || !pen.calculative || !pen.calculative.worldRect.center) {
    return Direction.None;
  }

  return facePoint(pt, pen.calculative.worldRect.center);
}

export function nearestAnchor(pen: Pen, pt: Point) {
  let dis = Infinity;
  let anchor: Point;
  pen.calculative.worldAnchors.forEach((a: Point) => {
    const d = distance(pt, a);
    if (dis > d) {
      dis = d;
      anchor = a;
    }
  });

  return anchor;
}

export function translateLine(pen: Pen, x: number, y: number) {
  pen.x += x;
  pen.y += y;

  if (pen.anchors) {
    pen.anchors.forEach((a) => {
      translatePoint(a, x, y);
    });
  }

  if (pen.calculative.worldAnchors) {
    pen.calculative.worldAnchors.forEach((a) => {
      translatePoint(a, x, y);
    });
  }

  pen.calculative.dirty = true;
}

export function deleteTempAnchor(pen: Pen) {
  if (pen && pen.calculative && pen.calculative.worldAnchors.length) {
    let to: Point = pen.calculative.worldAnchors[pen.calculative.worldAnchors.length - 1];
    while (pen.calculative.worldAnchors.length && to !== pen.calculative.activeAnchor) {
      pen.calculative.worldAnchors.pop();
      to = pen.calculative.worldAnchors[pen.calculative.worldAnchors.length - 1];
    }
  }
}

export function connectLine(pen: Pen, lineId: string, lineAnchor: string, anchor: string) {
  if (!pen || !lineId || !lineAnchor || !anchor) {
    return;
  }

  if (!pen.connectedLines) {
    pen.connectedLines = [];
  }

  const i = pen.connectedLines.findIndex(
    (item) => item.lineId === lineId && item.lineAnchor === lineAnchor && item.anchor === anchor
  );

  if (i < 0) {
    pen.connectedLines.push({
      lineId,
      lineAnchor,
      anchor,
    });
  }
}

export function disconnectLine(pen: Pen, lineId: string, lineAnchor: string, anchor: string) {
  if (!pen || !lineId || !lineAnchor || !anchor) {
    return;
  }

  if (!pen.connectedLines) {
    pen.connectedLines = [];
  }

  const i = pen.connectedLines.findIndex(
    (item) => item.lineId === lineId && item.lineAnchor === lineAnchor && item.anchor === anchor
  );
  i > -1 && pen.connectedLines.splice(i, 1);
}

export function getAnchor(pen: Pen, anchorId: string) {
  if (!pen || !anchorId) {
    return;
  }

  if (pen.calculative.worldAnchors) {
    for (const item of pen.calculative.worldAnchors) {
      if (item.id === anchorId) {
        return item;
      }
    }
  }
}

export function getFromAnchor(pen: Pen) {
  if (!pen || !pen.calculative.worldAnchors) {
    return;
  }

  return pen.calculative.worldAnchors[0];
}

export function getToAnchor(pen: Pen) {
  if (!pen || !pen.calculative.worldAnchors) {
    return;
  }

  return pen.calculative.worldAnchors[pen.calculative.worldAnchors.length - 1];
}
