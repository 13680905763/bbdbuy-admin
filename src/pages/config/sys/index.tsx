import { getSystemPurchase, putSystemPurchase } from "@/services";
import { PageContainer } from "@ant-design/pro-components";
import { Modal, Switch, Tabs, message } from "antd";
import React, { useEffect, useState } from "react";

const ConfigSettings: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<"purchase" | "other">(
    "purchase"
  );
  const [autoPurchase, setAutoPurchase] = useState(false);

  // 自动采购开关逻辑
  const handleAutoPurchaseChange = (checked: boolean) => {
    Modal.confirm({
      title: "确认操作",
      content: checked ? "确定要开启自动采购吗？" : "确定要关闭自动采购吗？",
      okText: "确认",
      cancelText: "取消",
      cancelButtonProps: {
        style: { borderColor: "#f0700c", color: "#f0700c" },
      },
      okButtonProps: {
        style: { backgroundColor: "#f0700c" },
      },
      onOk: async () => {
        try {
          await putSystemPurchase(checked);
          setAutoPurchase(checked);
          message.success(checked ? "自动采购已开启" : "自动采购已关闭");
        } catch (error) {
          message.error("操作失败，请稍后重试");
        }
      },
    });
  };

  // 初始化获取配置
  useEffect(() => {
    getSystemPurchase().then((res) => {
      setAutoPurchase(res.data);
    });
  }, []);

  return (
    <PageContainer>
      <Tabs
        activeKey={currentTab}
        onChange={(key) => setCurrentTab(key as "purchase" | "other")}
        items={[
          { label: "采购配置", key: "purchase" },
          { label: "其他配置", key: "other" },
        ]}
      />

      <div style={{ marginTop: 24 }}>
        {currentTab === "purchase" && (
          <>
            <span style={{ marginRight: 12 }}>自动采购：</span>
            <Switch
              checked={autoPurchase}
              onChange={handleAutoPurchaseChange}
            />
          </>
        )}

        {currentTab === "other" && (
          <div>这里是其他配置内容，可以放其他开关或表单</div>
        )}
      </div>
    </PageContainer>
  );
};

export default ConfigSettings;
