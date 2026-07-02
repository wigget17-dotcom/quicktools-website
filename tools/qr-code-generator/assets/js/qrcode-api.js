/*
 * Browser wrapper around the vendored qrcode-generator bundle.
 * It keeps the app code simple by exposing the familiar QRCode API.
 */
(function () {
  function buildQr(text, opts) {
    const errorCorrectionLevel = (opts && opts.errorCorrectionLevel) || 'M';
    const qr = qrcode(0, errorCorrectionLevel);
    qr.addData(String(text));
    qr.make();
    return qr;
  }

  function getCellSize(qr, targetWidth, margin) {
    const totalModules = qr.getModuleCount() + margin * 2;
    return Math.max(1, Math.floor(targetWidth / totalModules));
  }

  function getCanvasSize(qr, targetWidth, margin) {
    return getCellSize(qr, targetWidth, margin) * (qr.getModuleCount() + margin * 2);
  }

  function drawToCanvas(canvas, text, opts) {
    const qr = buildQr(text, opts);
    const margin = Number((opts && opts.margin) ?? 4);
    const targetWidth = Number((opts && opts.width) || 256);
    const cellSize = getCellSize(qr, targetWidth, margin);
    const actualSize = getCanvasSize(qr, targetWidth, margin);
    const context = canvas.getContext('2d');

    canvas.width = actualSize;
    canvas.height = actualSize;
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetWidth}px`;

    context.fillStyle = (opts && opts.color && opts.color.light) || '#ffffff';
    context.fillRect(0, 0, actualSize, actualSize);
    qr.renderTo2dContext(context, cellSize);

    return canvas;
  }

  window.QRCode = {
    toCanvas(canvas, text, opts) {
      return Promise.resolve(drawToCanvas(canvas, text, opts));
    },

    toString(text, opts) {
      return Promise.resolve().then(() => {
        const qr = buildQr(text, opts);
        const margin = Number((opts && opts.margin) ?? 4);
        const targetWidth = Number((opts && opts.width) || 256);
        const cellSize = getCellSize(qr, targetWidth, margin);
        return qr.createSvgTag(cellSize, margin, opts && opts.alt, opts && opts.title);
      });
    },

    toDataURL(text, opts) {
      return Promise.resolve().then(() => {
        const qr = buildQr(text, opts);
        const margin = Number((opts && opts.margin) ?? 4);
        const targetWidth = Number((opts && opts.width) || 256);
        const cellSize = getCellSize(qr, targetWidth, margin);
        const tempCanvas = document.createElement('canvas');
        drawToCanvas(tempCanvas, text, { ...opts, margin, width: qr.getModuleCount() * cellSize + margin * 2 * cellSize });
        return tempCanvas.toDataURL('image/png');
      });
    }
  };
}());
