import { message } from "antd";

interface PickItem {
  packageCode: string;
  locationCode: string;
  quantity: number;
}

interface PickListOptions {
  outboundCode: string;
  userName: string;
  methodName: string;
  remark?: string;
  serviceName: string[];
  items: PickItem[];
}

export async function printPickingList(options: PickListOptions) {
  const {
    outboundCode,
    userName,
    methodName,
    remark = "-",
    serviceName,
    items,
  } = options;

  // 创建独立打印页面
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    message.error("无法打开打印窗口");
    return;
  }

  // 构造 HTML 内容
  const htmlContent = `
    <html>
      <head>
        <title>打印拣货单</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            width: 80mm;
            padding: 10px;
            font-family: Arial, sans-serif;
            font-size: 20px;
            line-height: 1.6;
            color: #000;
          }
          svg {
            display: block;
            margin: 0 auto;
          }
          .barcode-label {
            text-align: center;
            font-weight: bold;
            font-size: 22px;
            margin-top: 6px;
          }
          .info {
            font-weight: bold;
            margin-top: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 18px;
          }
          table, th, td {
            border: 1px solid #000;
          }
          th, td {
            padding: 4px;
            text-align: center;
          }
            .info-service {
  display: flex;
  align-items: flex-start; /* 顶部对齐，避免行高错位 */
}

.info-service .label {
  flex-shrink: 0; /* 不压缩标题 */
  margin-right: 8px;
}

.info-service .value div {
  line-height: 1.5;
}
        </style>
      </head>
      <body>
        <svg id="barcode" style="max-width: 100%"></svg>
        <div class="barcode-label">${outboundCode}</div>
        <div class="info">用户名：${userName}</div>
        <div class="info">邮寄方式：${methodName}</div>
        <div class="info">备注：${remark}</div>
       <div class="info info-service">
  <span class="label">运单服务：</span>
  <div class="value">
    ${serviceName.map((item) => `<div>${item}</div>`).join("")}
  </div>
</div>
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">序号</th>
              <th style="width: 50%; ">包裹编号</th>
              <th style="width: 30%;">仓位</th>
              <th style="width: 10%;">数量</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td style="font-size:16px">${item.packageCode}</td>
                <td style="font-size:16px">${item.locationCode}</td>
                <td>${item.quantity}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script>
          window.onload = function () {
            JsBarcode("#barcode", "${outboundCode}", {
              format: "CODE128",
              width: 1.5,
              height: 50,
              displayValue: false,
              margin: 0,
            });
            window.print();
            window.onafterprint = function () {
              window.close();
            };
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
