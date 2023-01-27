export type Entrypoints = "web" | "websecure" | string;
export type Middlewares =
  | "redirect-to-https"
  | "redirect-to-non-www"
  | "redirect-to-http"
  | "redirect-to-www"
  | string;

export type Router = {
  entrypoints: Entrypoints[];
  rule: string;
  service: string;
  middlewares: Middlewares[];
  tls?: {
    certresolver?: "letsencrypt" | string;
    domains?: {
      main: string;
    };
  };
};

export type Service = {
  loadbalancer: {
    servers: { url: string }[];
  };
};

export type Certificate = {
  certFile: string;
  keyFile: string;
  stores?: string[];
};

export type Traefik = {
  tls: {
    certificates: Array<Certificate>;
    options: Record<string, any>;
    stores: Record<string, any>;
  };
  http: {
    routers: Record<string, Router>;
    services: Record<string, Service>;
    middlewares: Record<string & Middlewares, any>;
  };
  tcp: {
    routers: Record<string, Router>;
    services: Record<string, Service>;
    middlewares: Record<string & Middlewares, any>;
  };
  udp: {
    routers: Record<string, Router>;
    services: Record<string, Service>;
    middlewares: Record<string & Middlewares, any>;
  };
};
