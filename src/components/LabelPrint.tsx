import { useState, useMemo } from 'react';
import { Form, Select, InputNumber, Checkbox, Grid, Typography } from '@arco-design/web-react';
import type { LabelPrintData, LabelSize } from '../types';

const { Row, Col } = Grid;
const { Title, Text } = Typography;
const FormItem = Form.Item;
const { Option } = Select;

const LABEL_SIZES: LabelSize[] = [
  { id: '40x30', name: '40mm × 30mm', width: 40, height: 30, unit: 'mm' },
  { id: '50x30', name: '50mm × 30mm', width: 50, height: 30, unit: 'mm' },
  { id: '60x40', name: '60mm × 40mm', width: 60, height: 40, unit: 'mm' },
  { id: '70x50', name: '70mm × 50mm', width: 70, height: 50, unit: 'mm' },
  { id: '100x70', name: '100mm × 70mm', width: 100, height: 70, unit: 'mm' },
];

interface LabelPrintProps {
  items: LabelPrintData[];
}

export default function LabelPrint({ items }: LabelPrintProps) {
  const [selectedSize, setSelectedSize] = useState<string>('40x30');
  const [copies, setCopies] = useState<number>(1);
  const [selectedItems, setSelectedItems] = useState<string[]>(
    items.map((_, index) => String(index))
  );

  const labelSize = useMemo(
    () => LABEL_SIZES.find((s) => s.id === selectedSize) || LABEL_SIZES[0],
    [selectedSize]
  );

  const mmToPx = (mm: number) => mm * 3.78;

  const labelWidth = mmToPx(labelSize.width);
  const labelHeight = mmToPx(labelSize.height);

  const fontSize = useMemo(() => {
    if (labelSize.width >= 70) return { title: 14, content: 11 };
    if (labelSize.width >= 50) return { title: 12, content: 10 };
    return { title: 10, content: 8 };
  }, [labelSize]);

  const labelsToPrint = useMemo(() => {
    const labels: LabelPrintData[] = [];
    selectedItems.forEach((indexStr) => {
      const index = parseInt(indexStr, 10);
      const item = items[index];
      if (item) {
        for (let i = 0; i < copies; i++) {
          labels.push(item);
        }
      }
    });
    return labels;
  }, [items, selectedItems, copies]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map((_, index) => String(index)));
    } else {
      setSelectedItems([]);
    }
  };

  const handleItemSelect = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, String(index)]);
    } else {
      setSelectedItems(selectedItems.filter((i) => i !== String(index)));
    }
  };

  return (
    <div className="label-print-container">
      <style>{`
        .label-print-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .label-print-config {
          padding: 16px;
          background: #f5f7fa;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .label-print-items {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 20px;
        }
        .label-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 4px;
        }
        .label-item:hover {
          background: #f5f7fa;
        }
        .label-preview-area {
          background: #e0e0e0;
          padding: 16px;
          border-radius: 8px;
          min-height: 200px;
        }
        .label-sheet {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-start;
        }
        .label-card {
          background: white;
          border: 1px dashed #999;
          display: flex;
          flex-direction: column;
          padding: 8px;
          box-sizing: border-box;
          overflow: hidden;
        }
        .label-card .label-title {
          font-weight: 700;
          text-align: center;
          margin-bottom: 4px;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 4px;
        }
        .label-card .label-row {
          display: flex;
          font-size: inherit;
          line-height: 1.4;
          margin-bottom: 2px;
        }
        .label-card .label-label {
          color: #666;
          flex-shrink: 0;
          margin-right: 4px;
        }
        .label-card .label-value {
          font-weight: 500;
          word-break: break-all;
        }
        .label-card .label-sku {
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
        }
        .empty-preview {
          text-align: center;
          padding: 40px;
          color: #999;
        }
        @media print {
          .label-print-config,
          .label-print-items {
            display: none !important;
          }
          .label-preview-area {
            background: white !important;
            padding: 0 !important;
          }
          .label-card {
            border: none !important;
            page-break-inside: avoid;
          }
          @page {
            margin: 5mm;
          }
        }
      `}</style>

      <div className="label-print-config">
        <Row gutter={16}>
          <Col span={12}>
            <FormItem label="标签尺寸" field="labelSize" style={{ marginBottom: 0 }}>
              <Select
                value={selectedSize}
                onChange={setSelectedSize}
                style={{ width: '100%' }}
              >
                {LABEL_SIZES.map((size) => (
                  <Option key={size.id} value={size.id}>
                    {size.name}
                  </Option>
                ))}
              </Select>
            </FormItem>
          </Col>
          <Col span={12}>
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

      <div className="label-print-items">
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
          <Checkbox
            checked={selectedItems.length === items.length && items.length > 0}
            indeterminate={selectedItems.length > 0 && selectedItems.length < items.length}
            onChange={handleSelectAll}
          >
            全选
          </Checkbox>
          <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
            已选择 {selectedItems.length} 个商品，共 {labelsToPrint.length} 张标签
          </span>
        </div>
        {items.map((item, index) => (
          <div key={index} className="label-item">
            <Checkbox
              checked={selectedItems.includes(String(index))}
              onChange={(checked) => handleItemSelect(index, checked)}
            />
            <div style={{ marginLeft: 12, flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                SKU: {item.sku} | 批次: {item.batchNo} | 数量: {item.quantity}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="label-preview-area">
        {labelsToPrint.length > 0 ? (
          <div className="label-sheet">
            {labelsToPrint.map((item, index) => (
              <div
                key={index}
                className="label-card"
                style={{
                  width: `${labelWidth}px`,
                  height: `${labelHeight}px`,
                  fontSize: `${fontSize.content}px`,
                }}
              >
                <div
                  className="label-title"
                  style={{ fontSize: `${fontSize.title}px` }}
                >
                  {item.name}
                </div>
                <div className="label-row">
                  <span className="label-label">SKU:</span>
                  <span className="label-value label-sku">{item.sku}</span>
                </div>
                <div className="label-row">
                  <span className="label-label">批次:</span>
                  <span className="label-value">{item.batchNo}</span>
                </div>
                <div className="label-row">
                  <span className="label-label">数量:</span>
                  <span className="label-value">{item.quantity}</span>
                </div>
                <div className="label-row">
                  <span className="label-label">入库:</span>
                  <span className="label-value">{item.inboundDate}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-preview">
            <Title heading={6} style={{ color: '#999', margin: 0 }}>
              请选择要打印的商品
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              选择标签尺寸和打印份数后，将在这里预览
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
