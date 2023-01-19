import { Traefik } from "./type";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import fastify from "fastify";
import { request } from "undici";
import { DeepPartial, replacer } from "./replacer";
import { exec } from "child_process";

const tryRequire = (path: string) => {
  try {
    return require(path);
  } catch (e) {
    return null;
  }
};

const cmd = `/bin/tailscale status`;

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
    const [value, key, email] = line.split(/\s+/);
    if (key && value) {
      acc[key] = {
        ip: value,
        email,
      };
    }
    return acc;
  }, {} as Record<string, { ip: string; email: string }>);
  return result;
};

const server = fastify();

server.get("/", async (req, reply) => {
  const data: DeepPartial<Traefik> =
    tryRequire(process.env.JSON_PATH ?? "../data") ?? {};
  const result = await request(
    process.env.HTTP_PATH ?? "http://coolify:3000/webhooks/traefik/main.json"
  );
  const body: Traefik = (await result.body.json()) ?? {};
  return reply.send(replacer(body, data));
});

server.get("/auth", async (req, reply) => {
  try {
    const result = await execCmd(cmd);
    const parsed = parseTailscaleStatus(result);
    const headers = `${req.headers["x-forwarded-for"]} ${req.headers["x-forwarded-method"]} ${req.headers["x-forwarded-proto"]} ${req.headers["x-forwarded-host"]} ${req.headers["x-forwarded-port"]} ${req.headers["x-forwarded-uri"]}`;
    if (
      Object.values(parsed).some((v) => v.ip === req.headers["x-forwarded-for"])
    ) {
      console.log("authorized", headers);
      return reply.send({ success: true });
    } else {
      console.log("denied", headers);
      return reply.status(403).send({ error: "unauthorized" });
    }
  } catch (e) {
    return reply.status(500).send({ error: e });
  }
});

server.listen({ host: "0.0.0.0", port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
  console.log(
    "loaded data:\n",
    JSON.stringify(
      tryRequire(process.env.JSON_PATH ?? "../data") ?? {},
      null,
      1
    )
  );

  exec(cmd, (err, stdout) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("loaded tailscale:\n", parseTailscaleStatus(stdout));
  });
});
