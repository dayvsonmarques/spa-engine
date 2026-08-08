### ● What best practices have you used to ensure that the front-end of your websites is as fast as possible? 

#### Mostly it's about shipping less JS and only loading what's actually needed — code splitting per route, lazy loading, WebP images, CDN caching, and deferring scripts that aren't critical. In Next.js I lean on Server Components and `next/image` to cut client JS automatically, and cache Postgres-backed pages with ISR so I'm not hitting the database on every request. I also regularly analyze production applications to check performance, load speed, and memory usage using Lighthouse, Web Vitals, and Sentry.


### ● Describe your preferred new (or under active specification) JS feature. 

#### I really like the pattern matching proposal. It gets rid of a lot of messy if/else and switch chains, lets you return values directly without break statements everywhere, and handles destructuring and null/undefined way more gracefully than what we have today.

### ● What are a few of your least favorite things about JavaScript? Explain why

#### Implicit coercion still gets me sometimes, and having both null and undefined never really made sense to me. Async error handling with try/catch everywhere gets old fast too. TypeScript fixes a lot of it, at least.

