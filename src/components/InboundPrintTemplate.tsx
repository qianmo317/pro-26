import type { InboundPrintData } from '../types';

interface InboundPrintTemplateProps {
  data: InboundPrintData;
}

export default function InboundPrintTemplate({ data }: InboundPrintTemplateProps) {
  const totalPlanQuantity = data.items.reduce((sum, item) => sum + item.planQuantity, 0);
  const totalActualQuantity = data.items.reduce((sum, item) => sum + item.actualQuantity, 0);

  return (
    <div className="inbound-print-template">
      <style>{`
        .inbound-print-template .print-header {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #333;
        }
        .inbound-print-template .print-header h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #333;
        }
        .inbound-print-template .print-header p {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
        .inbound-print-template .print-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
          padding: 16px;
          background: #f9f9f9;
          border-radius: 6px;
        }
        .inbound-print-template .print-info .info-item {
          display: flex;
          font-size: 14px;
        }
        .inbound-print-template .print-info .info-label {
          color: #666;
          width: 80px;
          flex-shrink: 0;
        }
        .inbound-print-template .print-info .info-value {
          color: #333;
          font-weight: 500;
        }
        .inbound-print-template .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .inbound-print-template .print-table th,
        .inbound-print-template .print-table td {
          border: 1px solid #333;
          padding: 10px 12px;
          text-align: left;
          font-size: 14px;
        }
        .inbound-print-template .print-table th {
          background: #f0f0f0;
          font-weight: 600;
          color: #333;
        }
        .inbound-print-template .print-table td {
          color: #333;
        }
        .inbound-print-template .print-table .num-cell {
          text-align: center;
          width: 50px;
        }
        .inbound-print-template .print-table .qty-cell {
          text-align: right;
          width: 100px;
        }
        .inbound-print-template .print-summary {
          display: flex;
          justify-content: space-between;
          margin-bottom: 32px;
          padding: 12px 16px;
          background: #f9f9f9;
          border-radius: 6px;
          font-size: 14px;
        }
        .inbound-print-template .print-summary .summary-item {
          display: flex;
          gap: 8px;
        }
        .inbound-print-template .print-summary .summary-label {
          color: #666;
        }
        .inbound-print-template .print-summary .summary-value {
          font-weight: 600;
          color: #333;
        }
        .inbound-print-template .print-footer {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 40px;
          margin-top: 60px;
          padding-top: 24px;
          border-top: 1px dashed #999;
        }
        .inbound-print-template .print-footer .footer-item {
          text-align: center;
        }
        .inbound-print-template .print-footer .footer-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }
        .inbound-print-template .print-footer .footer-line {
          border-bottom: 1px solid #333;
          margin-bottom: 8px;
          min-height: 30px;
        }
        @media print {
          .inbound-print-template .print-info {
            background: #f9f9f9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .inbound-print-template .print-table th {
            background: #f0f0f0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .inbound-print-template .print-summary {
            background: #f9f9f9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="print-header">
        <h1>入 库 单</h1>
        <p>WAREHOUSE RECEIPT</p>
      </div>

      <div className="print-info">
        <div className="info-item">
          <span className="info-label">入库单号：</span>
          <span className="info-value">{data.orderNo}</span>
        </div>
        <div className="info-item">
          <span className="info-label">供应商：</span>
          <span className="info-value">{data.supplier}</span>
        </div>
        <div className="info-item">
          <span className="info-label">操作人：</span>
          <span className="info-value">{data.operator || '-'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">创建时间：</span>
          <span className="info-value">{data.createTime}</span>
        </div>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th className="num-cell">序号</th>
            <th>商品名称</th>
            <th>SKU编码</th>
            <th>批次号</th>
            <th className="qty-cell">计划数量</th>
            <th className="qty-cell">实际数量</th>
            <th>库位</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={index}>
              <td className="num-cell">{index + 1}</td>
              <td>{item.productName}</td>
              <td>{item.productSku}</td>
              <td>{item.batchNo}</td>
              <td className="qty-cell">{item.planQuantity}</td>
              <td className="qty-cell">{item.actualQuantity}</td>
              <td>{item.locationCode || '-'}</td>
            </tr>
          ))}
          {data.items.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                暂无数据
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="print-summary">
        <div className="summary-item">
          <span className="summary-label">商品种类：</span>
          <span className="summary-value">{data.items.length} 种</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">计划总数：</span>
          <span className="summary-value">{totalPlanQuantity}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">实际总数：</span>
          <span className="summary-value">{totalActualQuantity}</span>
        </div>
      </div>

      <div className="print-footer">
        <div className="footer-item">
          <div className="footer-label">制单人签字</div>
          <div className="footer-line"></div>
          <div style={{ fontSize: '12px', color: '#999' }}>Signature of Maker</div>
        </div>
        <div className="footer-item">
          <div className="footer-label">收货人签字</div>
          <div className="footer-line"></div>
          <div style={{ fontSize: '12px', color: '#999' }}>Signature of Receiver</div>
        </div>
        <div className="footer-item">
          <div className="footer-label">仓库主管签字</div>
          <div className="footer-line"></div>
          <div style={{ fontSize: '12px', color: '#999' }}>Signature of Supervisor</div>
        </div>
      </div>
    </div>
  );
}
