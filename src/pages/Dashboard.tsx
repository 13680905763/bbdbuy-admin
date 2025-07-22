import { PageContainer } from "@ant-design/pro-components";
import { useModel } from "@umijs/max";
import { theme } from "antd";
import React from "react";

const Dashboard: React.FC = () => {
  const { token } = theme.useToken();
  const { initialState } = useModel("@@initialState");
  return <PageContainer>BBD数据统计页面</PageContainer>;
};

export default Dashboard;
