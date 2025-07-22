import { Card, Result } from "antd";
import React from "react";
const NoFoundPage: React.FC = () => (
  <Card variant="borderless">
    <Result subTitle={"当前页面处于开发中"} />
  </Card>
);
export default NoFoundPage;
