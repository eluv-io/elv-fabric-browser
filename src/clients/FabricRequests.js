/*
 * Raw fabric API requests that elv-client-js (4.0.x, via the FrameClient) has no method for - currently only used by
 * the "Last modified" library object listing in Fabric.ListContentObjects.
 *
 * this module keeps state for the lifetime of the page:
 *   - tenantQueryURIs: the dedicated tenant query node URIs from the network config (services.tenant_query), loaded
 *     on first use and never refreshed until the page reloads. A failed config load is not cached - it is retried on
 *     the next request, which meanwhile goes to the regular fabric node.
 *   - tenantQueryURIIndex: the tenant query node to try first - the last one that worked. Requests fail over to the
 *     next node on network or server (5xx) errors and stick with whichever node answered.
 *
 * Newer elv-client-js versions have TenantContent(), which reads the tenant query nodes from the config and fails
 * over itself - once the Fabric Browser (and the core it runs in) are on such a version, this module can go away.
 */

import UrlJoin from "url-join";
const Fetch = typeof fetch !== "undefined" ? fetch : require("node-fetch").default;

let tenantQueryURIs;
let tenantQueryURIIndex = 0;

// load the dedicated tenant query node URIs from the network config
const TenantQueryURIs = async ({client}) => {
  if(!tenantQueryURIs) {
    try {
      const config = await (await Fetch(await client.ConfigUrl())).json();
      tenantQueryURIs = config?.network?.services?.tenant_query || [];
    } catch(error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load tenant query URIs from network config", error);
      return [];
    }
  }

  return tenantQueryURIs;
};

export const FabricApiRequest = async ({client, libraryId, path, queryParams={}, baseUri}) => {
  const fabricUrl = new URL(await client.FabricUrl({libraryId, queryParams}));
  if(!baseUri) {
    // strip /qlibs/<libraryId> to get the fabric node's base URI
    baseUri = fabricUrl.origin + fabricUrl.pathname.replace(/\/qlibs\/[^/]+\/?$/, "");
  }

  const url = new URL(UrlJoin(baseUri, path));
  url.search = fabricUrl.search;

  const response = await Fetch(url.toString(), {headers: {Accept: "application/json"}});
  if(!response.ok) {
    const error = Error(`Request to ${path} failed (${response.status}): ${await response.text()}`);
    error.status = response.status;
    throw error;
  }

  return await response.json();
};

export const TenantQueryRequest = async ({client, libraryId, path, queryParams}) => {

  // uses the dedicated tenant query nodes if the network has any, starting with the last one that worked
  const uris = await TenantQueryURIs({client});

  for(let attempt = 0; attempt < uris.length; attempt++) {
    const index = (tenantQueryURIIndex + attempt) % uris.length;

    try {
      const response = await FabricApiRequest({client, libraryId, path, queryParams, baseUri: uris[index]});
      tenantQueryURIIndex = index;
      return response;
    } catch(error) {
      // (403, 404) would be the same on any node - only try the next node for network/server errors
      if(error.status && error.status < 500) {
        throw error;
      }

      // eslint-disable-next-line no-console
      console.error(`Tenant query node ${uris[index]} failed - trying the next one`, error);
    }
  }

  return await FabricApiRequest({client, libraryId, path, queryParams});
};
