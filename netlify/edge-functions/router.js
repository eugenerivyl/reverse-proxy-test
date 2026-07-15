// Netlify Edge Function — reverse proxy test (Webflow + WordPress)
// -----------------------------------------------------------------
// Routes by path: allowlisted paths -> Webflow (wf.rivyl.net),
// everything else -> WordPress (ilmlatest.kinsta.cloud).
// Rewrites the Host header so each backend serves a clean 200, and rewrites
// the response HTML + redirects so the backend hostname stays masked behind
// the public (netlify.app) URL. This is the Netlify equivalent of the
// Cloudflare Worker, used to compare the two head to head.

const WEBFLOW_ORIGIN = "wf.rivyl.net";
const WP_ORIGIN = "ilmlatest.kinsta.cloud";

// Paths served by Webflow. Everything else -> WordPress.
const WEBFLOW_EXACT = ["/"];
const WEBFLOW_PREFIX = ["/shop-all", "/about", "/product", "/blog"];

function isWebflowPath(pathname) {
  if (WEBFLOW_EXACT.includes(pathname)) return true;
  return WEBFLOW_PREFIX.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default async (request, context) => {
  const url = new URL(request.url);
  const publicHost = url.host; // the *.netlify.app host

  const originHost = isWebflowPath(url.pathname) ? WEBFLOW_ORIGIN : WP_ORIGIN;

  // Build the origin URL: origin host + same path + query.
  const originUrl = new URL(request.url);
  originUrl.hostname = originHost;
  originUrl.protocol = "https:";
  originUrl.port = "";

  // Copy the request, then force Host to the origin so it serves a clean 200
  // instead of a canonical redirect back to its own domain.
  const originReq = new Request(originUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: "manual",
  });
  originReq.headers.set("Host", originHost);

  const res = await fetch(originReq);

  // Rewrite any redirect Location back onto the public host.
  const location = res.headers.get("Location");
  if (location) {
    const headers = new Headers(res.headers);
    headers.set("Location", location.replaceAll(originHost, publicHost));
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }

  // Rewrite absolute origin-host references in HTML (links, canonical, og:url)
  // so they show the public host. This is the masking step to compare against
  // the Cloudflare Worker.
  const contentType = res.headers.get("Content-Type") || "";
  if (contentType.includes("text/html")) {
    const body = (await res.text()).replaceAll(originHost, publicHost);
    const headers = new Headers(res.headers);
    headers.delete("Content-Length");
    return new Response(body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }

  // Assets (CSS/JS/images/fonts) stream straight through.
  return res;
};
