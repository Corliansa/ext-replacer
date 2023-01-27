# Replacer

ENV Variables:

- `JSON_PATH`: path to replacer config, default: `/usr/app/data/config`
- `HTTP_PATH`: path to http config, default: `http://coolify:3000/webhooks/traefik/main.json`
- `AUTH_PATH`: path to auth config, default: `/usr/app/data/auth`

Notes:

- Replacer config type needs to satisfy Traefik json dynamic config
- Auth config type:
  ```
  {
    allowIps?: string[];
    denyIps?: string[];
    allowAll?: boolean;
    denyAll?: boolean;
    allowPeerInsecureIp?: boolean;
  };
  ```
- allowAll has priority over denyAll, and denyIps has priority over allowIps
- The flow is: allowAll > denyAll > denyIps > ios > allowIps
