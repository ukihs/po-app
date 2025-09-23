import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_BswIijom.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/api/users/create.astro.mjs');
const _page3 = () => import('./pages/api/users/_uid_.astro.mjs');
const _page4 = () => import('./pages/api/users.astro.mjs');
const _page5 = () => import('./pages/login.astro.mjs');
const _page6 = () => import('./pages/orders/create.astro.mjs');
const _page7 = () => import('./pages/orders/list.astro.mjs');
const _page8 = () => import('./pages/orders/notifications.astro.mjs');
const _page9 = () => import('./pages/orders/tracking.astro.mjs');
const _page10 = () => import('./pages/orders/_id_.astro.mjs');
const _page11 = () => import('./pages/users.astro.mjs');
const _page12 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/api/users/create.ts", _page2],
    ["src/pages/api/users/[uid].ts", _page3],
    ["src/pages/api/users/index.ts", _page4],
    ["src/pages/login.astro", _page5],
    ["src/pages/orders/create.astro", _page6],
    ["src/pages/orders/list.astro", _page7],
    ["src/pages/orders/notifications.astro", _page8],
    ["src/pages/orders/tracking.astro", _page9],
    ["src/pages/orders/[id].astro", _page10],
    ["src/pages/users.astro", _page11],
    ["src/pages/index.astro", _page12]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "87e087bd-068e-4e48-8e4d-e66c52d4d683"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
