![Example](/apps/server/assets/ignore/banner.png)

> A Growtopia private server built with Node.js and Bun.js, powered by [growtopia.js](https://github.com/JadlionHD/growtopia.js)

> [!NOTE]
> This source is not production ready yet. In the future it will be using a [Docker](#docker) to deploy the server, feel free to join [Discord Server](https://discord.gg/sGrxfKZY5t) to discuss regarding this.

## Requirements

- [Node.js](https://nodejs.org) v20+ or [Bun.js](https://bun.sh) v1.2.9+
- [pnpm](https://pnpm.io) v10
- [mkcert](https://github.com/FiloSottile/mkcert)
- [docker](https://docker.com/)
- [docker-compose](https://docs.docker.com/compose/) (required)

## Setup

To setup the server, first install necessary packages & settings by

```
$ pnpm install
$ pnpm run setup
```

And congrats setup are done, simple as that!
Now you just need to run the server by

> [!NOTE]
> It must be running PostgreSQL & Redis in background by using docker, please navigate to [docker](#docker) guide

```
$ pnpm run dev
```

## Database

Database that we moved to PostgreSQL from previous database SQLite.
And for the ORM we are using [Drizzle-ORM](https://orm.drizzle.team/)

To view the database you can run this command below:

```
$ pnpm run studio
```

and access it on here https://local.drizzle.studio/

## Starting server

To run the development server by

```
$ pnpm run dev
```

## Development

In order to make new login system work you need to setup caddy on this [local https](https://caddyserver.com/docs/automatic-https#local-https) (I'd recommend using [Lets encrypt](https://letsencrypt.org/getting-started/) for production only)

### HTTPS CA installation
For Production: If you want to deploy this into server, make sure to comment some `tls internal` inside `Caddyfile` since it require to request LetsEncrypt to request your domain to register and obtain the SSL cert.

For Local: As the caddy server already automated the process, you should navigate to [Caddy Server](#caddy-server)


### Caddy server
For developemnt only you can skip this part if you're trying to deploy to server.

Since the we're running the separated caddy instead of from the docker one, you have to download the caddy server from [here](https://caddyserver.com/download)

Or you could using this command (windows user)
```sh
$ winget install Caddy.Caddy
```

And run the caddy server by
```sh
$ caddy run --config Caddyfile
```


### Hosts

For the hosts file you can see this example below

```
127.0.0.1 www.growtopia1.com
127.0.0.1 www.growtopia2.com
127.0.0.1 growserver.app # New login system for development purposes
```

## Docker

To run the dockerized & running it automatically just run

```sh
docker compose up -d
```

or you want to run the database & redis only (this for development only) then simply running

```sh
docker compose up -d db redis
```

## Contributing

Any contributions are welcome.

There's few rules of contributing:

- Code must match the existing code style. Please make sure to run `pnpm run lint` before submiting a PR.
- The commit must take review first before merging into `main` branch.

## Links

- [Discord Server](https://discord.gg/sGrxfKZY5t)

## Contributors

Give a thumbs to these cool contributors:

<a href="https://github.com/StileDevs/GrowServer">
  <img src="https://contrib.rocks/image?repo=StileDevs/GrowServer"/>
</a
