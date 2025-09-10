import '@astrojs/internal-helpers/path';
import 'kleur/colors';
import { l as NOOP_MIDDLEWARE_HEADER, n as decodeKey } from './chunks/astro/server_DSMDtA1y.mjs';
import 'clsx';
import 'cookie';
import 'es-module-lexer';
import 'html-escaper';

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

const codeToStatusMap = {
  // Implemented from IANA HTTP Status Code Registry
  // https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  CONTENT_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_CONTENT: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NETWORK_AUTHENTICATION_REQUIRED: 511
};
Object.entries(codeToStatusMap).reduce(
  // reverse the key-value pairs
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///C:/Projects/Astro/test01/po-app/","cacheDir":"file:///C:/Projects/Astro/test01/po-app/node_modules/.astro/","outDir":"file:///C:/Projects/Astro/test01/po-app/dist/","srcDir":"file:///C:/Projects/Astro/test01/po-app/src/","publicDir":"file:///C:/Projects/Astro/test01/po-app/public/","buildClientDir":"file:///C:/Projects/Astro/test01/po-app/dist/","buildServerDir":"file:///C:/Projects/Astro/test01/po-app/.netlify/build/","adapterName":"@astrojs/netlify","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"login/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/login","isIndex":false,"type":"page","pattern":"^\\/login\\/?$","segments":[[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/login.astro","pathname":"/login","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"orders/create/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/orders/create","isIndex":false,"type":"page","pattern":"^\\/orders\\/create\\/?$","segments":[[{"content":"orders","dynamic":false,"spread":false}],[{"content":"create","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/orders/create.astro","pathname":"/orders/create","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"orders/list/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/orders/list","isIndex":false,"type":"page","pattern":"^\\/orders\\/list\\/?$","segments":[[{"content":"orders","dynamic":false,"spread":false}],[{"content":"list","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/orders/list.astro","pathname":"/orders/list","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"orders/notifications/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/orders/notifications","isIndex":false,"type":"page","pattern":"^\\/orders\\/notifications\\/?$","segments":[[{"content":"orders","dynamic":false,"spread":false}],[{"content":"notifications","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/orders/notifications.astro","pathname":"/orders/notifications","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"orders/tracking/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/orders/tracking","isIndex":false,"type":"page","pattern":"^\\/orders\\/tracking\\/?$","segments":[[{"content":"orders","dynamic":false,"spread":false}],[{"content":"tracking","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/orders/tracking.astro","pathname":"/orders/tracking","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"register/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/register","isIndex":false,"type":"page","pattern":"^\\/register\\/?$","segments":[[{"content":"register","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/register.astro","pathname":"/register","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/index.CKQaL5jC.css"}],"routeData":{"route":"/orders/[id]","isIndex":false,"type":"page","pattern":"^\\/orders\\/([^/]+?)\\/?$","segments":[[{"content":"orders","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/orders/[id].astro","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["C:/Projects/Astro/test01/po-app/src/pages/login.astro",{"propagation":"none","containsHead":true}],["C:/Projects/Astro/test01/po-app/src/pages/orders/create.astro",{"propagation":"none","containsHead":true}],["C:/Projects/Astro/test01/po-app/src/pages/orders/list.astro",{"propagation":"none","containsHead":true}],["C:/Projects/Astro/test01/po-app/src/pages/orders/notifications.astro",{"propagation":"none","containsHead":true}],["C:/Projects/Astro/test01/po-app/src/pages/orders/tracking.astro",{"propagation":"none","containsHead":true}],["C:/Projects/Astro/test01/po-app/src/pages/register.astro",{"propagation":"none","containsHead":true}],["C:/Projects/Astro/test01/po-app/src/pages/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000noop-actions":"_noop-actions.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astro-page:src/pages/login@_@astro":"pages/login.astro.mjs","\u0000@astro-page:src/pages/orders/create@_@astro":"pages/orders/create.astro.mjs","\u0000@astro-page:src/pages/orders/list@_@astro":"pages/orders/list.astro.mjs","\u0000@astro-page:src/pages/orders/notifications@_@astro":"pages/orders/notifications.astro.mjs","\u0000@astro-page:src/pages/orders/tracking@_@astro":"pages/orders/tracking.astro.mjs","\u0000@astro-page:src/pages/orders/[id]@_@astro":"pages/orders/_id_.astro.mjs","\u0000@astro-page:src/pages/register@_@astro":"pages/register.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_B_wM4BKH.mjs","C:/Projects/Astro/test01/po-app/node_modules/unstorage/drivers/netlify-blobs.mjs":"chunks/netlify-blobs_DM36vZAS.mjs","C:/Projects/Astro/test01/po-app/src/components/po/auth/LoginPage":"_astro/LoginPage.BycRQnnZ.js","C:/Projects/Astro/test01/po-app/src/components/po/Header":"_astro/Header.CyF_dODo.js","C:/Projects/Astro/test01/po-app/src/components/po/TabNavigation":"_astro/TabNavigation.CgrN9nkb.js","C:/Projects/Astro/test01/po-app/src/components/po/CreateOrderPage":"_astro/CreateOrderPage.CC8UJlRa.js","C:/Projects/Astro/test01/po-app/src/components/po/TrackingPage":"_astro/TrackingPage.BAziWNye.js","C:/Projects/Astro/test01/po-app/src/components/po/OrdersListPage":"_astro/OrdersListPage.DK4IwJ6h.js","C:/Projects/Astro/test01/po-app/src/components/po/OrderDetailPage":"_astro/OrderDetailPage.BEFsr7nC.js","C:/Projects/Astro/test01/po-app/src/components/po/auth/RegisterPage":"_astro/RegisterPage.CrV4ygQy.js","C:/Projects/Astro/test01/po-app/src/components/po/NotificationsPage":"_astro/NotificationsPage.CL90dEpN.js","@astrojs/react/client.js":"_astro/client.BBKXMyYs.js","C:/Projects/Astro/test01/po-app/src/pages/index.astro?astro&type=script&index=0&lang.ts":"_astro/index.astro_astro_type_script_index_0_lang.DmoZtOVL.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["C:/Projects/Astro/test01/po-app/src/pages/index.astro?astro&type=script&index=0&lang.ts","location.replace(\"/login\");"]],"assets":["/_astro/index.TWmvOObS.css","/_astro/index.CKQaL5jC.css","/logo.png","/_astro/auth.CV-KtNga.js","/_astro/circle-check-big.CbTxo2yr.js","/_astro/client.BBKXMyYs.js","/_astro/createLucideIcon.BY18stqz.js","/_astro/CreateOrderPage.CC8UJlRa.js","/_astro/file-text.Bk9ceRhc.js","/_astro/firebase.C9gngGH-.js","/_astro/Header.CyF_dODo.js","/_astro/index.DtoOFyvK.js","/_astro/LoginPage.BycRQnnZ.js","/_astro/NotificationsPage.CL90dEpN.js","/_astro/OrderDetailPage.BEFsr7nC.js","/_astro/OrdersListPage.DK4IwJ6h.js","/_astro/poApi.ByUmNjr-.js","/_astro/RegisterPage.CrV4ygQy.js","/_astro/TabNavigation.CgrN9nkb.js","/_astro/TrackingPage.BAziWNye.js","/_astro/x.CPELNGNo.js","/login/index.html","/orders/create/index.html","/orders/list/index.html","/orders/notifications/index.html","/orders/tracking/index.html","/register/index.html","/index.html"],"buildFormat":"directory","checkOrigin":true,"serverIslandNameMap":[],"key":"gr01CT5h8GLH/xeYU8Wre4CfUpu5H2Iah4uqKmcY1Go=","sessionConfig":{"driver":"netlify-blobs","options":{"name":"astro-sessions","consistency":"strong"}}});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => import('./chunks/netlify-blobs_DM36vZAS.mjs');

export { manifest };
