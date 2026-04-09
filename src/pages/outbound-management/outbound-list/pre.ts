import { message } from "antd";

interface PickItem {
  packageCode: string;
  locationCode: string;
  quantity: number;
}

interface PickListOptions {
  packingPackageCode: string;
  customerName: string;
  lineName: string;
  remark?: string;
  services: string[];
  items: PickItem[];
}

export async function printPickingList(list: PickListOptions[]) {
  if (!list || list.length === 0) {
    message.error("没有可打印的数据");
    return;
  }

  // Create a hidden iframe
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  // 构造 HTML 内容（多页）
  const htmlContent = `
    <html>
      <head>
        <title>打印拣货单</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
            @media print {
  .page-break {
    page-break-after: always; /* 每个标签后强制分页 */
  }
}
          body {
            width: 80mm;
            padding: 10px;
            font-family: Arial, sans-serif;
            font-size: 20px;
            line-height: 1.6;
            color: #000;
          }
          .page {
            page-break-after: always;
          }
          svg {
            display: block;
            margin: 0 auto;
          }
          .barcode-label {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
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
            align-items: flex-start;
          }
          .info-service .label {
            flex-shrink: 0;
            margin-right: 8px;
          }
          .info-service .value div {
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        ${list
      .map(
        (opt, pageIndex) => `
          <div class="page">
           <div class="barcode-label" >
          <span style="font-weight: bold; font-size: 60px;">${opt.packingPackageCode.slice(-6)}</span>
           </div>
            <svg id="barcode-${pageIndex}" style="max-width: 60%"></svg>
            <div class="barcode-label" >${opt.packingPackageCode}</div>
            <div class="info">用户名：${opt.customerName}</div>
            <div class="info">邮寄方式：${opt.lineName}</div>
            <div class="info">备注：${opt.remark ?? "-"}</div>
            <div class="info info-service">
              <span class="label">运单服务：</span>
              <div class="value">
                ${opt.services.map((s) => `<div>${s}</div>`).join("")}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 10%;">序号</th>
                  <th style="width: 50%;">包裹编号</th>
                  <th style="width: 30%;">仓位</th>
                  <th style="width: 10%;">数量</th>
                </tr>
              </thead>
              <tbody>
                ${opt.items
            .map(
              (item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td style="font-size:16px">${item.packageCode}</td>
                    <td style="font-size:16px">${item.locationCode}</td>
                    <td>${item.quantity}</td>
                     <div className="page-break"></div>
                  </tr>
                `
            )
            .join("")}
              </tbody>
            </table>
          </div>
        `
      )
      .join("")}

        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script>
          window.onload = function () {
            ${list
      .map(
        (opt, i) => `
              JsBarcode("#barcode-${i}", "${opt.packingPackageCode}", {
                format: "CODE128",
                width: 1.2,
                height: 50,
                displayValue: false,
                margin: 0,
              });
            `
      )
      .join("")}
          }
        </script>
      </body>
    </html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Wait for scripts and images to load before printing
  iframe.onload = () => {
    // The JsBarcode script needs time to execute after loading
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500); // 500ms delay to ensure JSBarcode has rendered the SVGs
  };
}
