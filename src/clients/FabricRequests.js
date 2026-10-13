/*
 * Raw fabric API requests that elv-client-js has no method for: the /qlibs/<id>/q listing with options
 * ContentObjects() can't send (sort_descending without sort_by), and per-object metadata reads with the
 * library-scoped token (no per-object chain calls). Used by Fabric.ListContentObjects.
 */

import UrlJoin from "url-join";
const Fetch = typeof fetch !== "undefined" ? fetch : require("node-fetch").default;

export const FabricApiRequest = async ({client, libraryId, path, queryParams={}}) => {
  const fabricUrl = new URL(await client.FabricUrl({libraryId, queryParams}));
  // strip /qlibs/<libraryId> to get the fabric node's base URI
  const baseUri = fabricUrl.origin + fabricUrl.pathname.replace(/\/qlibs\/[^/]+\/?$/, "");

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
