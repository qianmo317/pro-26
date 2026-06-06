import { useState, useMemo, useEffect, useCallback } from 'react';
import { Form, Select, InputNumber, Checkbox, Grid, Typography } from '@arco-design/web-react';
import type { ProductLabelPrintData, LabelSize } from '../types';
import { generateBarcodeDataUrl } from '../utils/barcode';

const { Row, Col } = Grid;
const { Title, Text } = Typography;
const FormItem = Form.Item;
const { Option } = Select;

const PRODUCT_LABEL_SIZES: LabelSize[] = [
  { id: '30x20', name: '30mm × 20mm', width: 30, height: 20, unit: 'mm' },
  { id: '40x30', name: '40mm × 30mm', width: 40, height: 30, unit: 'mm' },
  { id: '50x30', name: '50mm × 30mm', width: 50, height: 30, unit: 'mm' },
  { id: '60x40', name: '60mm × 40mm', width: 60, height: 40, unit: 'mm' },
  { id: '70x50', name: '70mm × 50mm', width: 70, height: 50, unit: 'mm' },
  { id: '100x70', name: '100mm × 70mm', width: 100, height: 70, unit: 'mm' },
];

const PER_ROW_OPTIONS = [
  { value: 1, label: '1列' },
  { value: 2, label: '2列' },
  { value: 3, label: '3列' },
  { value: 4, label: '4列' },
  { value: 5, label: '5列' },
];

interface ProductBarcodePrintProps {
  products: ProductLabelPrintData[];
}

export default function ProductBarcodePrint({ products }: ProductBarcodePrintProps) {
  const [selectedSize, setSelectedSize] = useState<string>('40x30');
  const [copies, setCopies] = useState<number>(1);
  const [perRow, setPerRow] = useState<number>(2);
  const [selectedItems, setSelectedItems] = useState<string[]>(
    products.map((p) => p.id)
  );
  const [barcodeCache, setBarcodeCache] = useState<Map<string, string>>(new Map());

  const labelSize = useMemo(
    () => PRODUCT_LABEL_SIZES.find((s) => s.id === selectedSize) || PRODUCT_LABEL_SIZES[1],
    [selectedSize]
  );

  const mmToPx = (mm: number) => mm * 3.78;

  const labelWidth = mmToPx(labelSize.width);
  const labelHeight = mmToPx(labelSize.height);

  const fontSize = useMemo(() => {
    if (labelSize.width >= 70) return { title: 12, content: 10, barcode: 10 };
    if (labelSize.width >= 50) return { title: 11, content: 9, barcode: 9 };
    if (labelSize.width >= 40) return { title: 10, content: 8, barcode: 8 };
    return { title: 8, content: 7, barcode: 6 };
  }, [labelSize]);

  const barcodeHeight = useMemo(() => {
    if (labelSize.height >= 50) return 40;
    if (labelSize.height >= 40) return 30;
    if (labelSize.height >= 30) return 22;
    return 15;
  }, [labelSize]);

  const barcodeWidth = useMemo(() => {
    if (labelSize.width >= 70) return 2;
    if (labelSize.width >= 50) return 1.5;
    return 1;
  }, [labelSize]);

  const generateBarcodes = useCallback(() => {
    if (products.length === 0) return;
    const newCache = new Map<string, string>();
    products.forEach((product) => {
      const dataUrl = generateBarcodeDataUrl(product.barcodeContent, {
        width: barcodeWidth,
        height: barcodeHeight,
        fontSize: fontSize.barcode,
        margin: 2,
        displayValue: true,
      });
      newCache.set(product.id, dataUrl);
    });
    return newCache;
  }, [products, barcodeWidth, barcodeHeight, fontSize.barcode]);

  useEffect(() => {
    const newCache = generateBarcodes();
    if (newCache) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBarcodeCache(newCache);
    }
  }, [generateBarcodes]);

  const labelsToPrint = useMemo(() => {
    const labels: ProductLabelPrintData[] = [];
    selectedItems.forEach((id) => {
      const product = products.find((p) => p.id === id);
      if (product) {
        for (let i = 0; i < copies; i++) {
          labels.push(product);
        }
      }
    });
    return labels;
  }, [products, selectedItems, copies]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(products.map((p) => p.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleItemSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter((i) => i !== id));
    }
  };

  return (
    <div className="product-barcode-print-container">
      <style>{`
        .product-barcode-print-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .product-barcode-config {
          padding: 16px;
          background: #f5f7fa;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .product-barcode-items {
          max-height: 180px;
          overflow-y: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 20px;
        }
        .product-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 4px;
        }
        .product-item:hover {
          background: #f5f7fa;
        }
        .product-preview-area {
          background: #e0e0e0;
          padding: 16px;
          border-radius: 8px;
          min-height: 200px;
        }
        .label-sheet {
          display: grid;
          gap: 2mm;
          justify-content: flex-start;
        }
        .product-label-card {
          background: white;
          border: 1px dashed #999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 1mm;
          box-sizing: border-box;
          overflow: hidden;
          page-break-inside: avoid;
        }
        .product-label-card .label-product-name {
          font-weight: 700;
          text-align: center;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.2;
          color: #000;
        }
        .product-label-card .label-product-sku {
          font-family: 'Courier New', 'Consolas', monospace;
          letter-spacing: 0.5px;
          text-align: center;
          width: 100%;
          font-weight: 600;
          color: #000;
        }
        .product-label-card .label-product-price {
          text-align: center;
          width: 100%;
          color: #000;
          font-weight: 700;
        }
        .product-label-card .label-barcode {
          width: 100%;
          max-width: 100%;
          object-fit: contain;
          margin-top: 1mm;
          image-rendering: pixelated;
          -ms-interpolation-mode: nearest-neighbor;
        }
        .product-label-card .label-category {
          text-align: center;
          width: 100%;
          color: #000;
          font-weight: 500;
        }
        .empty-preview {
          text-align: center;
          padding: 40px;
          color: #999;
        }
        @media print {
          .product-barcode-config,
          .product-barcode-items {
            display: none !important;
          }
          .product-preview-area {
            background: white !important;
            padding: 0 !important;
          }
          .label-sheet {
            gap: 0 !important;
          }
          .product-label-card {
            border: none !important;
            margin: 0 !important;
            padding: 1mm !important;
          }
          .product-label-card .label-barcode {
            image-rendering: pixelated !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            margin: 1mm;
            size: auto;
          }
        }
      `}</style>

      <div className="product-barcode-config">
        <Row gutter={16}>
          <Col span={8}>
            <FormItem label="标签尺寸" field="labelSize" style={{ marginBottom: 0 }}>
              <Select
                value={selectedSize}
                onChange={setSelectedSize}
                style={{ width: '100%' }}
              >
                {PRODUCT_LABEL_SIZES.map((size) => (
                  <Option key={size.id} value={size.id}>
                    {size.name}
                  </Option>
                ))}
              </Select>
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem label="每行数量" field="perRow" style={{ marginBottom: 0 }}>
              <Select
                value={perRow}
                onChange={setPerRow}
                style={{ width: '100%' }}
              >
                {PER_ROW_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem label="打印份数" field="copies" style={{ marginBottom: 0 }}>
              <InputNumber
                min={1}
                max={100}
                value={copies}
                onChange={setCopies}
                style={{ width: '100%' }}
              />
            </FormItem>
          </Col>
        </Row>
      </div>

      <div className="product-barcode-items">
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
          <Checkbox
            checked={selectedItems.length === products.length && products.length > 0}
            indeterminate={selectedItems.length > 0 && selectedItems.length < products.length}
            onChange={handleSelectAll}
          >
            全选
          </Checkbox>
          <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
            已选择 {selectedItems.length} 个商品，共 {labelsToPrint.length} 张标签
          </span>
        </div>
        {products.map((product) => (
          <div key={product.id} className="product-item">
            <Checkbox
              checked={selectedItems.includes(product.id)}
              onChange={(checked) => handleItemSelect(product.id, checked)}
            />
            <div style={{ marginLeft: 12, flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{product.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                SKU: {product.sku} | 品类: {product.category} | 单价: ¥{product.price.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="product-preview-area">
        {labelsToPrint.length > 0 ? (
          <div
            className="label-sheet"
            style={{
              gridTemplateColumns: `repeat(${perRow}, auto)`,
            }}
          >
            {labelsToPrint.map((item, index) => (
              <div
                key={index}
                className="product-label-card"
                style={{
                  width: `${labelWidth}px`,
                  height: `${labelHeight}px`,
                  fontSize: `${fontSize.content}px`,
                }}
              >
                <div
                  className="label-product-name"
                  style={{ fontSize: `${fontSize.title}px` }}
                >
                  {item.name}
                </div>
                <div className="label-product-sku">{item.sku}</div>
                {labelSize.height >= 40 && (
                  <div className="label-category">{item.category} / {item.unit}</div>
                )}
                <img
                  className="label-barcode"
                  src={barcodeCache.get(item.id) || ''}
                  alt={item.barcodeContent}
                  style={{
                    height: `${barcodeHeight + 15}px`,
                  }}
                />
                {labelSize.height >= 50 && (
                  <div className="label-product-price">¥{item.price.toFixed(2)}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-preview">
            <Title heading={6} style={{ color: '#999', margin: 0 }}>
              请选择要打印的商品
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              选择标签尺寸、每行数量和打印份数后，将在这里预览
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
