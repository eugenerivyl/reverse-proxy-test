const WEBFLOW_ORIGIN = "webflow.rivyl.net.au";
const STATIC_ORIGIN  = "friendly-croquembouche-3106dc.netlify.app";
const WEBFLOW_EXACT  = ["/"];
const WEBFLOW_PREFIX = ["/about", "/blog", "/product"];
function isWebflow(p) {
  if (WEBFLOW_EXACT.includes(p)) return true;
  return WEBFLOW_PREFIX.some(x => p === x || p.startsWith(x + "/"));
}
export default async (request) => {
  const url = new URL(request.url);
  const publicHost = url.host;
  const originHost = isWebflow(url.pathname) ? WEBFLOW_ORIGIN : STATIC_ORIGIN;
  const o = new URL(request.url);
  o.hostname = originHost; o.protocol = "https:"; o.port = "";
  const req = new Request(o.toString(), { method: request.method, headers: request.headers, body: request.body, redirect: "manual" });
  req.headers.set("Host", originHost);
  const res = await fetch(req);
  const loc = res.headers.get("Location");
  if (loc) {
    const h = new Headers(res.headers);
    h.set("Location", loc.replaceAll(originHost, publicHost));
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  }
  const ct = res.headers.get("Content-Type") || "";
  if (ct.includes("text/html")) {
    const body = (await res.text()).replaceAll(originHost, publicHost);
    const h = new Headers(res.headers); h.delete("Content-Length");
    return new Response(body, { status: res.status, statusText: res.statusText, headers: h });
  }
  return res;
};
