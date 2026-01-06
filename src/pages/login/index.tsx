import { Footer } from "@/components";
import { login } from "@/services/ant-design-pro/api";
import { connectWS } from "@/utils/ws";
import { LockOutlined, PhoneFilled } from "@ant-design/icons";
import { LoginForm, ProFormText } from "@ant-design/pro-components";
import { history, useModel } from "@umijs/max";
import { App } from "antd";
import { createStyles } from "antd-style";
import React from "react";
import { flushSync } from "react-dom";
const useStyles = createStyles(({ token }) => {
  return {
    action: {
      marginLeft: "8px",
      color: "rgba(0, 0, 0, 0.2)",
      fontSize: "24px",
      verticalAlign: "middle",
      cursor: "pointer",
      transition: "color 0.3s",
      "&:hover": {
        color: token.colorPrimaryActive,
      },
    },
    lang: {
      width: 42,
      height: 42,
      lineHeight: "42px",
      position: "fixed",
      right: 16,
      borderRadius: token.borderRadius,
      ":hover": {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "auto",
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: "100% 100%",
    },
  };
});

const Login: React.FC = () => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const { initialState, setInitialState } = useModel("@@initialState");

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };
  const handleSubmit = async (values: API.LoginParams) => {
    try {
      // 登录
      const msg = await login({
        ...values,
      });
      console.log("msg", msg);

      if (msg.success) {
        message.success("登录成功！");
        connectWS(); // ✅ 登录后再建立 WS 连接
        await fetchUserInfo();
        history.replace("/");
        return;
      }
      console.log(msg);
      // 如果失败去设置用户错误信息
    } catch (error) {}
  };

  return (
    <div className={styles.container}>
      <div
        style={{
          flex: "1",
          padding: "32px 0",
        }}
      >
        <LoginForm
          submitter={{
            submitButtonProps: {
              style: {
                background: "#f0700c",
                width: "100%",
              },
            },
          }}
          contentStyle={{
            minWidth: 280,
            maxWidth: "75vw",
          }}
          // initialValues={{
          //   mobile: "admin",
          //   password: "123456",
          // }}
          title={<img src="/logo.png" alt="BBDBUY" style={{ height: 40 }} />}
          subTitle={"BBD 后台管理系统"}
          onFinish={async (values) => {
            await handleSubmit(values as API.LoginParams);
          }}
        >
          <>
            <ProFormText
              name="mobile"
              fieldProps={{
                size: "large",
                prefix: <PhoneFilled />,
              }}
              placeholder={"手机号"}
              rules={[
                {
                  required: true,
                  message: "手机号是必填项！",
                },
              ]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: "large",
                prefix: <LockOutlined />,
              }}
              placeholder={"密码"}
              rules={[
                {
                  required: true,
                  message: "密码是必填项！",
                },
              ]}
            />
          </>

          <div
            style={{
              marginBottom: 24,
            }}
          >
            <a
              style={{
                float: "right",
                marginBottom: 24,
              }}
            >
              忘记密码 ?
            </a>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
