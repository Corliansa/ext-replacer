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

export type TailscaleStatus = {
  Version: string;
  BackendState: string;
  AuthURL: string;
  TailscaleIPs: string[];
  Self: Self;
  Health: null;
  MagicDNSSuffix: string;
  CurrentTailnet: CurrentTailnet;
  CertDomains: string[];
  Peer: { [key: string]: Self };
  User: User;
};

export type CurrentTailnet = {
  Name: string;
  MagicDNSSuffix: string;
  MagicDNSEnabled: boolean;
};

export type Self = {
  ID: string;
  PublicKey: string;
  HostName: string;
  DNSName: string;
  OS: string;
  UserID: number;
  TailscaleIPs: string[];
  Addrs: string[] | null;
  CurAddr: string;
  Relay: string;
  RxBytes: number;
  TxBytes: number;
  Created: string;
  LastWrite: string;
  LastSeen: string;
  LastHandshake: string;
  Online: boolean;
  KeepAlive: boolean;
  ExitNode: boolean;
  ExitNodeOption: boolean;
  Active: boolean;
  PeerAPIURL: string[];
  InNetworkMap: boolean;
  InMagicSock: boolean;
  InEngine: boolean;
  Capabilities?: string[];
};

export type User = Record<string, UserObject>;

export type UserObject = {
  ID: number;
  LoginName: string;
  DisplayName: string;
  ProfilePicURL: string;
  Roles: any[];
};

export type AuthConfig = {
  allowIps?: string[];
  denyIps?: string[];
  allowAll?: boolean;
  denyAll?: boolean;
  allowPeerInsecureIp?: boolean;
};
