interface TlsConfig {
  key: string;
  cert: string;
}

interface WebConfig {
  development: boolean;
  address: string;
  port: number;
  ports: number[]; // An array of numbers for additional ports
  loginUrl: string;
  cdnUrl: string;
  maintenance: {
    enable: boolean;
    message: string;
  };
  tls: TlsConfig;
}

interface WebFrontendConfig {
  root: string;
  port: number;
  tls: TlsConfig;
}

interface ServerConfig {
  bypassVersionCheck: boolean;
  logLevel: 'info' | 'warn' | 'error' | 'debug'; // Using a union type for better strictness
}

export interface AppConfig {
  web: WebConfig;
  webFrontend: WebFrontendConfig;
  server: ServerConfig;
}


export const config: AppConfig = {
  web: {
    development: true,
    address: "127.0.0.1",
    port: 3001,
    ports: [17091],
    loginUrl: "growserver.app",
    cdnUrl: "growserver-cache.netlify.app",
    maintenance: {
      enable: false,
      message: "Maintenance Woi"
    },
    tls: {
      key: "./assets/ssl/server.key",
      cert: "./assets/ssl/server.crt"
    }
  },
  webFrontend: {
    root: "./public",
    port: 3000,
    tls: {
      key: "./assets/ssl/server.key",
      cert: "./assets/ssl/server.crt"
    }
  },
  server: {
    bypassVersionCheck: true,
    logLevel: "info"
  }
};
