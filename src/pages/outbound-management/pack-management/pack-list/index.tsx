"use client";

import { getOutboundPackListByPage } from "@/services";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Button, message, Pagination, Tag } from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { PackageSplitModal } from "./PackageSplitModal";

// ✅ 定义数据类型
type OrderProductRow = {
  id: string;
  outboundCode: string;
  packageCode: string;
  locationCode: string;
  pickStatus: string;
  createTime: string;
};

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  // ✅ 状态管理
  const [dataSource, setDataSource] = useState<OrderProductRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<OrderProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 弹窗状态
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<OrderProductRow | null>(null);
  console.log(
    "123",
    currentRow?.items?.map((item) => {
      return {
        id: item.id,
        code: item.packageCode,
        weight: item.weight,
      };
    })
  );

  // ✅ 请求数据封装
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await getOutboundPackListByPage({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setDataSource(res.data.records || []);
      setPagination((prev) => ({
        ...prev,
        total: res.data.total || 0,
      }));
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  const handleSplitPackage = (record: OrderProductRow) => {
    setCurrentRow(record);
    setSplitModalVisible(true);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ 表头配置
  const columns: ProColumns<OrderProductRow>[] = [
    {
      title: "包裹编号",
      dataIndex: "packingPackageCode",
    },
    {
      title: "包裹信息",
      dataIndex: "items",
      render: (items: any) => {
        return items?.map((item: any) => (
          <p key={item.location.packageCode}>
            {item.location.packageCode} -- {item.location.locationStatus}
          </p>
        ));
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (_, record: any) => {
        const status = record.status;
        const color = status === "已打包" ? "green" : "red";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "下单时间",
      dataIndex: "createTime",
    },
    {
      title: "操作",
      key: "canSplit",
      render: (_: any, record: OrderProductRow) => {
        if (record?.canSplit) {
          return (
            <Button type="primary" onClick={() => handleSplitPackage(record)}>
              拆分包裹
            </Button>
          );
        }
        return null; // 没有按钮时必须返回 null，否则 Table 渲染会报错
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<OrderProductRow>
        bordered
        rowKey="id"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        actionRef={actionRef}
        pagination={false}
        search={false}
      />

      <div style={{ padding: 16, textAlign: "right" }}>
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          showSizeChanger
          onChange={(current, pageSize) =>
            setPagination({ ...pagination, current, pageSize })
          }
        />
      </div>

      <PackageSplitModal
        open={splitModalVisible} // 控制弹窗显示
        onClose={() => setSplitModalVisible(false)}
        initialPackages={
          currentRow?.items?.map((item) => {
            return {
              id: item.id,
              code: item.packageCode,
              weight: item.weight,
            };
          }) || undefined
        } // 当前行包裹数据
        outboundId={currentRow?.outboundId}
      />
    </PageContainer>
  );
};

export default TableList;
