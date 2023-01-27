import { TailscaleStatus, Traefik } from "./type";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import fastify from "fastify";
import { request } from "undici";
import { DeepPartial, replacer } from "./replacer";
import { exec } from "child_process";

const tryRequire = (path: string) => {
  try {
    delete require.cache[require.resolve(path)];
    return require(path);
  } catch (e) {
    return null;
  }
};

const cmd = `/bin/tailscale status --active`;
const cmdJson = `/bin/tailscale status --json --active`;

const execCmd = async (cmd: string) => {
  return new Promise<string>((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        reject(stderr);
      }
      resolve(stdout);
    });
  });
};

const parseTailscaleStatus = (status: string) => {
  const lines = status.split(/\n/);
  const result = lines.reduce((acc, line) => {
    const [value, key, email, os] = line.split(/\s+/);
    if (key && value) {
      acc[key] = {
        ip: value,
        email,
        os,
      };
    }
    return acc;
  }, {} as Record<string, { ip: string; email: string; os: string }>);
  return result;
};

const parseTailscaleJson = (stdout: string) => {
  try {
    const res: TailscaleStatus = JSON.parse(stdout);

    const selfAddrs = res.Self.Addrs?.map((addr) =>
      addr.replace(":" + addr.split(":").at(-1), "")
    );
    const peerIps = Object.values(res.Peer).flatMap(
      (peer) => peer.TailscaleIPs
    );
    const selfIps = res.Self.TailscaleIPs;
    const peerCurAddrs = Object.values(res.Peer).map((peer) =>
      peer.CurAddr.replace(":" + peer.CurAddr.split(":").at(-1), "")
    );

    const allIps = [
      ...new Set([
        ...peerIps,
        ...selfIps,
        ...(selfAddrs ?? []),
        ...peerCurAddrs,
      ]),
    ];

    return allIps.filter((ip) => Boolean(ip));
  } catch {
    return [];
  }
};

const server = fastify();

server.get("/", async (req, reply) => {
  const config:
    | DeepPartial<Traefik>
    | ((config: Traefik) => DeepPartial<Traefik>) = tryRequire(
    process.env.JSON_PATH ?? "../data/config"
  );
  const result = await request(
    process.env.HTTP_PATH ?? "http://coolify:3000/webhooks/traefik/main.json"
  );
  const body: Traefik = (await result.body.json()) ?? {};

  const data = typeof config === "function" ? config(body) : config;

  return reply.send(replacer(body, data));
});

server.get("/auth", async (req, reply) => {
  try {
    const result = await execCmd(cmdJson);
    const parsed = parseTailscaleJson(result);
    const headers = `${req.headers["x-forwarded-for"]} ${req.headers["x-forwarded-method"]} ${req.headers["x-forwarded-proto"]} ${req.headers["x-forwarded-host"]} ${req.headers["x-forwarded-port"]} ${req.headers["x-forwarded-uri"]}`;

    const deny = () => {
      console.log("denied", headers);
      return reply.status(401).send({ error: "unauthorized" });
    };
    const allow = () => {
      console.log("authorized", headers);
      return reply.send({ success: true });
    };

    if (!req.headers["x-forwarded-for"]) {
      return deny();
    }

    if (process.env.ALLOW_ALL === "true") {
      return allow();
    }

    if (parsed.includes(req.headers["x-forwarded-for"] as string)) {
      return allow();
    }

    const allowlist: String[] = tryRequire(
      process.env.ALLOW_PATH ?? "../data/allowlist"
    );

    if (!allowlist) {
      return deny();
    }

    if (allowlist.includes(req.headers["x-forwarded-for"] as string)) {
      return allow();
    }

    return deny();
  } catch (e) {
    return reply.status(500).send({ error: e });
  }
});

server.get("/whoami", async (req, reply) => {
  return reply.send({
    ip: req.ip,
    ips: req.ips,
    headers: req.headers,
  });
});

server.listen({ host: "0.0.0.0", port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);

  console.log("loaded config:");
  console.log(
    JSON.stringify(
      tryRequire(process.env.JSON_PATH ?? "../data/config"),
      null,
      1
    )
  );

  console.log("loaded allowlist:");
  console.log(
    JSON.stringify(
      tryRequire(process.env.ALLOW_PATH ?? "../data/allowlist"),
      null,
      1
    )
  );

  exec(cmd, (err, stdout) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("loaded tailscale:");
    console.log(parseTailscaleStatus(stdout));
  });

  exec(cmdJson, (err, stdout) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("loaded tailscale ips:");
    console.log(parseTailscaleJson(stdout));
  });
});
