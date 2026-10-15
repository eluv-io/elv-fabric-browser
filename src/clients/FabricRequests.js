/*
 * FabricApiRequest - a GET to any fabric path, authorized with the library's token
 */

import UrlJoin from "url-join";
const Fetch = typeof fetch !== "undefined" ? fetch : require("node-fetch").default;

export const FabricApiRequest = async ({client, libraryId, path, queryParams={}}) => {
  const fabricUrl = new URL(await client.FabricUrl({libraryId, queryParams}));
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
