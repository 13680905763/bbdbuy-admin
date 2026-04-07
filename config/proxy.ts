export default {
  // dev: {
  //   "/admin-api": {
  //     // host指向后端ip
  //     target: "http://api.bbdlocal.com:8080",
  //     changeOrigin: true,
  //     ws: true, // 同时代理 WebSocket
  //     pathRewrite: { "^/admin-api": "" },
  //     secure: false,
  //     cookieDomainRewrite: {
  //       "bbdlocal.com": "localhost",
  //     },
  //   },
  // },
  dev: {
    "/admin-api": {
      target: "https://dev.bbdbuy1.com",
      changeOrigin: true,
      ws: true,
      secure: false,
      cookieDomainRewrite: {
        "dev.bbdbuy1.com": "localhost",
      },
    },
  },
};
