import { Footer } from "@/components";
import { getPublicKey, login } from "@/services/user";
import { connectWS } from "@/utils/ws";
import { LockOutlined, PhoneFilled } from "@ant-design/icons";
import { LoginForm, ProFormText } from "@ant-design/pro-components";
import { history, useModel } from "@umijs/max";
import { App } from "antd";
import { createStyles } from "antd-style";
import React from "react";
import { flushSync } from "react-dom";
import JSEncrypt from 'jsencrypt'
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
  const handleSubmit = async (values: any) => {
    try {
      // 1. 从后端获取公钥
      const publicKeyRes = await getPublicKey();
      console.log("获取到公钥响应:", publicKeyRes);

      const finalValues = { ...values };

      // 2. 用公钥加密密码和账号
      if (publicKeyRes?.success && publicKeyRes?.data) {
        const encrypt = new JSEncrypt();
        // 处理公钥格式：补全 PEM 头部并确保换行正确
        let key = publicKeyRes.data;
        encrypt.setPublicKey(key);

        // 加密密码
        const encryptedPassword = encrypt.encrypt(values.password);
        if (encryptedPassword) {
          finalValues.password = encryptedPassword;
        } else {
          message.error("密码加密失败，请联系管理员");
          return;
        }

        // 加密账号
        const encryptedMobile = encrypt.encrypt(values.mobile);
        if (encryptedMobile) {
          finalValues.mobile = encryptedMobile;
        } else {
          message.error("账号加密失败，请联系管理员");
          return;
        }
      }

      // 3. 提交加密后的数据到登录接口
      const msg = await login({
        ...finalValues,
      });
      if (msg.success) {
        message.success("登录成功！");
        connectWS(); // ✅ 登录后再建立 WS 连接
        await fetchUserInfo();
        history.replace("/");
        return;
      }
      // 如果失败，通常由 requestErrorConfig 统一提示，此处可记录日志
      console.error("登录失败:", msg);
    } catch (error) {
      console.error("提交异常:", error);
    }
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
            await handleSubmit(values as any);
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
