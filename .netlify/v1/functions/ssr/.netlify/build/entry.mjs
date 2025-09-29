import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_BKvIH2ta.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/500.astro.mjs');
const _page3 = () => import('./pages/api/auth/session.astro.mjs');
const _page4 = () => import('./pages/api/send-email.astro.mjs');
const _page5 = () => import('./pages/api/users/create.astro.mjs');
const _page6 = () => import('./pages/api/users/_uid_.astro.mjs');
const _page7 = () => import('./pages/api/users.astro.mjs');
const _page8 = () => import('./pages/login.astro.mjs');
const _page9 = () => import('./pages/orders/create.astro.mjs');
const _page10 = () => import('./pages/orders/list.astro.mjs');
const _page11 = () => import('./pages/orders/notifications.astro.mjs');
const _page12 = () => import('./pages/orders/tracking.astro.mjs');
const _page13 = () => import('./pages/orders/_id_.astro.mjs');
const _page14 = () => import('./pages/unauthorized.astro.mjs');
const _page15 = () => import('./pages/users.astro.mjs');
const _page16 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/500.astro", _page2],
    ["src/pages/api/auth/session.ts", _page3],
    ["src/pages/api/send-email.ts", _page4],
    ["src/pages/api/users/create.ts", _page5],
    ["src/pages/api/users/[uid].ts", _page6],
    ["src/pages/api/users/index.ts", _page7],
    ["src/pages/login.astro", _page8],
    ["src/pages/orders/create.astro", _page9],
    ["src/pages/orders/list.astro", _page10],
    ["src/pages/orders/notifications.astro", _page11],
    ["src/pages/orders/tracking.astro", _page12],
    ["src/pages/orders/[id].astro", _page13],
    ["src/pages/unauthorized.astro", _page14],
    ["src/pages/users.astro", _page15],
    ["src/pages/index.astro", _page16]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "middlewareSecret": "5c9dde67-10a1-4ec1-a69f-1d33e21d9b94"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
