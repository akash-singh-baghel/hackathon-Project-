// A small, honestly-curated assist list for packages whose own npm keywords
// are too generic or legacy-skewed for the keyword-overlap ranking to find
// their real modern competitors (axios's keywords lead with "xhr", which
// clusters with XHR-mocking test utilities instead of fetch/got/ky). This is
// blended with the dynamic ranking in usePackageExplorer.js, never a
// replacement for it — anything not listed here still gets ranked
// dynamically, and even listed ones fall through to the dynamic ranker if
// this list doesn't fill the requested count.
export const CURATED_ALTERNATIVES = {
  axios: ['got', 'node-fetch', 'ky', 'superagent', 'undici'],
  request: ['got', 'node-fetch', 'axios', 'undici'],
  moment: ['dayjs', 'date-fns', 'luxon'],
  lodash: ['ramda', 'rambda', 'just', 'lodash-es'],
  underscore: ['lodash', 'ramda'],
  express: ['fastify', 'koa', '@hapi/hapi', 'hono'],
  jquery: ['cash-dom', 'umbrella', 'zepto'],
  webpack: ['vite', 'esbuild', 'rollup', 'parcel'],
  redux: ['zustand', 'jotai', 'recoil', 'mobx'],
  enzyme: ['@testing-library/react', 'react-test-renderer'],
  'node-sass': ['sass'],
  chalk: ['picocolors', 'kleur', 'colorette'],
  commander: ['yargs', 'cac', 'meow'],
  mongoose: ['prisma', 'typeorm', 'sequelize'],
  'socket.io': ['ws', 'uws'],
};
