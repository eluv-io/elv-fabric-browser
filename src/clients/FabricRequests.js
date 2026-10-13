/*
 * FabricApiRequest - a GET to any fabric path, authorized with the library's token
 *
 * for the two library listing requests elv-client-js can't make, used by Fabric.ListContentObjects:
 *   - /qlibs/<id>/q listings: ContentObjects() can't ask for descending order without a sort field
 *   - each row's name/description for "Last modified": ContentObjectMetadata() would do per-object chain lookups
 *     and object-level authorization
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
