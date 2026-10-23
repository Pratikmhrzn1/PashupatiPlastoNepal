<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Backend for the Pashupati Plasto marketing & contact website.

## API surface

The frontend calls the API with `VITE_API_BASE_URL` as the base URL, so the
public marketing routes are served from the server root. Auth and admin routes
live under `/api/v1`.

**Public (server root)**

| Method | Route | Description |
| --- | --- | --- |
| GET | `/products` | All published products, plain array |
| GET | `/products/featured` | Best sellers, plain array (max `FEATURED_PRODUCT_LIMIT`) |
| GET | `/products/:idOrSlug` | One product by id or slug, 404 `{ message: "Product not found" }` |
| POST | `/contacts` | Contact form, answers `201 { ok: true }` |

**Admin (`/api/v1`, cookie auth)**

- `/api/v1/auth/*` - login, logout, refresh, me, verification, password reset
- `/api/v1/admin/products` - list (paginated/filter/search), create, update,
  publish, soft delete, hard delete
- `/api/v1/admin/inquiries` - list, view, update status/note, delete
- `/api/v1/health` - health check

Swagger UI is available at `/api/docs`.

Product responses are shaped for the frontend:
`{ id, name, price, description, image?, soldCount? }` where `price` is a
formatted string (`"NPR 450 / piece"`) and `soldCount` is static catalog data
(see `src/modules/products/product-catalog.data.ts`).

## Monorepo setup

This app lives in the `pashupati-plasto` npm-workspaces monorepo alongside the
Vite frontend. Install everything once from the repository root:

```bash
$ npm install
```

Then run either workspace from the root:

```bash
# both apps
$ npm run dev

# API only (watch mode)
$ npm run dev:api

# web only
$ npm run dev:web

# API production build
$ npm run build:api
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deploying to Vercel

The repository is a monorepo with two independently deployable workspaces.
Create **two Vercel projects from the same Git repository**:

| Project | Root Directory | Framework |
| --- | --- | --- |
| Web | `frontend` | Vite |
| API | `backend` | NestJS (auto-detected) |

API environment variables (Project → Settings → Environment Variables):

- `DATABASE_URL` - pooled PostgreSQL URL (Neon, Vercel Postgres, etc.)
- `FRONTEND_URL` - the deployed web origin, used for CORS and email links
- `CORS_ORIGINS` - optional comma-separated preview origins
- `COOKIE_SAME_SITE` - defaults to `none` in production when web and API are on different domains
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` - at least 32 characters each
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `MAIL_FROM`
- `BLOB_READ_WRITE_TOKEN` - from a Vercel Blob store (product image uploads)
- Any optional values from `.env.example`

Run migrations once against the production database, then seed the admin:

```bash
$ DATABASE_URL="postgresql://..." npm run db:deploy
$ DATABASE_URL="postgresql://..." npm run seed
```

Web environment variables:

- `VITE_API_MODE=live`
- `VITE_API_BASE_URL=https://<api-project>.vercel.app`

After the API is deployed, set the web project's variables and redeploy it.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

This project is already instrumented. Create a free account at [observe.nestjs.com](https://observe.nestjs.com), add an application, and paste the generated app key and secret into the `ObserveModule.forRoot()` call in `src/app.module.ts`.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
