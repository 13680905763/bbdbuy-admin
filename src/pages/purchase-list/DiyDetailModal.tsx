import React from 'react';
import { Modal, Descriptions, Image, Table, Typography } from 'antd';

const { Link } = Typography;

export interface DiyDetailModalProps {
  open: boolean;
  onCancel: () => void;
  data: any;
  loading?: boolean;
}

const DiyDetailModal: React.FC<DiyDetailModalProps> = ({
  open,
  onCancel,
  data,
  loading,
}) => {
  const specColumns = [
    {
      title: '规格1',
      dataIndex: 's1',
      key: 's1',
      render: (text: any) => text || '-',
    },
    {
      title: '规格2',
      dataIndex: 's2',
      key: 's2',
      render: (text: any) => text || '-',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
  ];

  return (
    <Modal
      title="DIY订单详情"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      loading={loading}
    >
      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="订单编号">{data.orderCode}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{data.createTime}</Descriptions.Item>
            <Descriptions.Item label="客户ID">{data.customerId}</Descriptions.Item>
            <Descriptions.Item label="商品价格">¥{data.productPrice}</Descriptions.Item>
            <Descriptions.Item label="邮费">¥{data.postage}</Descriptions.Item>
            <Descriptions.Item label="商品标题">
               {data.productTitle}
            </Descriptions.Item>
            <Descriptions.Item label="商品链接">
              <Link href={data.productLink} target="_blank">
                {data.productLink}
              </Link>
            </Descriptions.Item>
            <Descriptions.Item label="商品图片">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {data.productPic?.map((url: string, index: number) => (
                  <Image key={index} src={url} width={80} height={80} />
                ))}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="备注">
              {data.remark || '-'}
            </Descriptions.Item>
          </Descriptions>

          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>规格信息：</div>
            <Table
              dataSource={data.specifications}
              columns={specColumns}
              pagination={false}
              rowKey={(record, index) => `${index}`}
              size="small"
              bordered
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DiyDetailModal;
