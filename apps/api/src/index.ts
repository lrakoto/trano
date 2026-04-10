// JSON.stringify can't handle BigInt — convert to Number (safe for MGA, well under MAX_SAFE_INTEGER)
(BigInt.prototype as any).toJSON = function () { return Number(this); };

import { buildApp } from './app';

const app = buildApp();

app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
