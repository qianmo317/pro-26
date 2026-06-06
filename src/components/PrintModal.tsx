import { useState, useRef, useEffect } from 'react';
import { Modal, Button, Space, Spin } from '@arco-design/web-react';
import { IconPrinter } from '@arco-design/web-react/icon';

interface PrintModalProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  children: React.ReactNode;
  onBeforePrint?: () => Promise<void> | void;
  onAfterPrint?: () => void;
}

export default function PrintModal({
  visible,
  title,
  onCancel,
  children,
  onBeforePrint,
  onAfterPrint,
}: PrintModalProps) {
  const [printing, setPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrinting(false);
      onAfterPrint?.();
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [onAfterPrint]);

  const handlePrint = async () => {
    try {
      setPrinting(true);
      await onBeforePrint?.();

      const printContent = printRef.current;
      if (!printContent) return;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setPrinting(false);
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                padding: 20px;
                color: #333;
                font-size: 14px;
              }
              @media print {
                body {
                  padding: 0;
                }
                @page {
                  margin: 10mm;
                }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        setPrinting(false);
        onAfterPrint?.();
      }, 500);
    } catch (error) {
      setPrinting(false);
      console.error('打印失败:', error);
    }
  };

  return (
    <Modal
      title={title}
      visible={visible}
      onCancel={onCancel}
      style={{ width: 900 }}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onCancel}>关闭</Button>
          <Button
            type="primary"
            icon={<IconPrinter />}
            onClick={handlePrint}
            loading={printing}
          >
            打印
          </Button>
        </Space>
      }
    >
      <Spin loading={printing} style={{ display: 'block' }}>
        <div
          ref={printRef}
          style={{
            background: '#fff',
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            minHeight: '400px',
            maxHeight: '600px',
            overflow: 'auto',
          }}
        >
          {children}
        </div>
      </Spin>
    </Modal>
  );
}
