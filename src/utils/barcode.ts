import JsBarcode from 'jsbarcode';

export interface BarcodeOptions {
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
}

export const generateBarcodeDataUrl = (
  content: string,
  options: BarcodeOptions = {}
): string => {
  const canvas = document.createElement('canvas');
  const defaultOptions: BarcodeOptions = {
    width: 2,
    height: 60,
    displayValue: true,
    fontSize: 12,
    margin: 5,
    background: '#ffffff',
    lineColor: '#000000',
  };

  try {
    JsBarcode(canvas, content, {
      ...defaultOptions,
      ...options,
      format: 'CODE128',
      valid: (valid) => {
        if (!valid) {
          console.warn(`条码内容无效: ${content}`);
        }
      },
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('生成条码失败:', error);
    return '';
  }
};

export const generateBarcodeToElement = (
  element: HTMLCanvasElement | HTMLImageElement | SVGElement,
  content: string,
  options: BarcodeOptions = {}
): void => {
  const defaultOptions: BarcodeOptions = {
    width: 2,
    height: 60,
    displayValue: true,
    fontSize: 12,
    margin: 5,
    background: '#ffffff',
    lineColor: '#000000',
  };

  try {
    JsBarcode(element, content, {
      ...defaultOptions,
      ...options,
      format: 'CODE128',
    });
  } catch (error) {
    console.error('生成条码失败:', error);
  }
};

export const generateProductBarcodeContent = (sku: string, name: string): string => {
  const cleanName = name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 20);
  return `${sku}-${cleanName}`;
};
