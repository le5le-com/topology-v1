declare const window: any;
export function slider(ctx: CanvasRenderingContext2D, pen: any) {
  if (!pen.onDestroy) {
    pen.onResize = resize;
    pen.onClick = click;
    pen.onMouseMove = mouseMove;
    pen.onMouseDown = mouseDown;
    pen.onMouseUp = mouseUp;
  }
  let x = pen.calculative.worldRect.x;
  let y = pen.calculative.worldRect.y;
  let w = pen.calculative.worldRect.width;
  let h = pen.calculative.worldRect.height;
  let sliderW = w * pen.sliderRadio;
  let inputW = w * pen.inputRadio;

  pen.textLeft = w * (1 - pen.inputRadio) + 2;
  pen.textWidth = inputW;
  pen.textAlign = 'start';
  pen.textBaseline = 'middle';
  ctx.beginPath();
  ctx.fillStyle = '#D4D6D9';
  // ctx.rect(x, y + (h * 2) / 5, sliderW, (h * 1) / 5);
  let r = (0.5 * h) / 5;
  ctx.moveTo(x + r, y + (h * 2) / 5);
  ctx.arcTo(x + sliderW, y + (h * 2) / 5, x + sliderW, y + (h * 3) / 5, r);
  ctx.arcTo(x + sliderW, y + (h * 3) / 5, x, y + (h * 3) / 5, r);
  ctx.arcTo(x, y + (h * 3) / 5, pen.x, pen.y, r);
  ctx.arcTo(x, y + (h * 2) / 5, x + sliderW, y + (h * 2) / 5, r);
  // ctx.stroke();
  ctx.fill();

  // ctx.rect(x + w - inputW, y, inputW, h);
  // ctx.stroke();
  ctx.closePath();
  let currenPosition =
    (sliderW * (parseInt(pen.text) - pen.min)) / (pen.max - pen.min);
  ctx.beginPath();
  ctx.fillStyle = pen.background; // '#69C0FF'; //pen.fillColor;
  // ctx.rect(x, y + (h * 2) / 5, currenPosition, (h * 1) / 5);
  ctx.moveTo(x + r, y + (h * 2) / 5);
  ctx.arcTo(
    x + currenPosition,
    y + (h * 2) / 5,
    x + currenPosition,
    y + (h * 3) / 5,
    r
  );
  ctx.arcTo(x + currenPosition, y + (h * 3) / 5, x, y + (h * 3) / 5, r);
  ctx.arcTo(x, y + (h * 3) / 5, pen.x, pen.y, r);
  ctx.arcTo(x, y + (h * 2) / 5, x + currenPosition, y + (h * 2) / 5, r);
  // ctx.stroke();
  ctx.fill();
  ctx.closePath();
  ctx.beginPath();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = pen.color; //'#1890FF'; //pen.fillColor;
  ctx.lineWidth = h / 10;
  ctx.moveTo(x + currenPosition + h / 5, y + h / 2);
  ctx.arc(x + currenPosition, y + h / 2, h / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
  return ctx;
}
function resize(pen: any) {
  let w = pen.calculative.worldRect.width;
  pen.textLeft = w * (1 - pen.inputRadio) + 2;
  pen.calculative.textLeft = w * (1 - pen.inputRadio) + 2;
}

function click(pen: any) {
  let mouseDown = pen.calculative.canvas.mouseDown;
  let w = pen.calculative.worldRect.width;
  let h = pen.calculative.worldRect.height;
  let sliderW = w * pen.sliderRadio;
  if (
    mouseDown.x > pen.x &&
    mouseDown.x < pen.x + sliderW &&
    mouseDown.y > pen.y + (h * 2) / 5 &&
    mouseDown.y < pen.y + (h * 3) / 5
  ) {
    let value = Math.round(
      ((mouseDown.x - pen.x) / sliderW) * (pen.max - pen.min)
    );
    pen.calculative.canvas.parent.setValue({
      id: pen.id,
      text: value + pen.unit,
    });
  }
}

function mouseMove(pen: any) {
  if (pen.locked !== 2) {
    return;
  }
  if (!pen.slider) {
    return;
  }
  let mousePos = pen.calculative.canvas.mousePos;
  let w = pen.calculative.worldRect.width;
  let h = pen.calculative.worldRect.height;
  let sliderW = w * pen.sliderRadio;
  if (mousePos.x >= pen.x && mousePos.x <= pen.x + sliderW) {
    let value = Math.round(
      ((mousePos.x - pen.x) / sliderW) * (pen.max - pen.min)
    );
    pen.calculative.canvas.parent.setValue({
      id: pen.id,
      text: value + pen.unit,
    });
  } else if (mousePos.x < pen.x) {
    pen.calculative.canvas.parent.setValue({
      id: pen.id,
      text: pen.min + pen.unit,
    });
  } else if (mousePos.x > pen.x + sliderW) {
    pen.calculative.canvas.parent.setValue({
      id: pen.id,
      text: pen.max + pen.unit,
    });
  }
}

function mouseDown(pen: any, e: any) {
  console.log('down');
  if (pen.locked !== 2) {
    return;
  }
  let w = pen.calculative.worldRect.width;
  let h = pen.calculative.worldRect.height;
  let sliderW = w * pen.sliderRadio;
  let currentX =
    pen.x + ((parseInt(pen.text) - pen.min) / (pen.max - pen.min)) * sliderW;

  if (
    e.x < currentX + h / 5 &&
    e.x > currentX - h / 5 &&
    e.y > pen.y + (h * 1) / 5 &&
    e.y < pen.y + (h * 4) / 5
  ) {
    pen.calculative.canvas.parent.setValue({
      id: pen.id,
      slider: true,
    });
  }
}

function mouseUp(pen: any, e: any) {
  console.log('up');
  if (pen.locked !== 2) {
    return;
  }
  pen.calculative.canvas.parent.setValue({
    id: pen.id,
    slider: false,
  });
}