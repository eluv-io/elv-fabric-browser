import {diffJson} from "diff";

self.onmessage = ({data}) => {
  self.postMessage(diffJson(data.old, data.new));
};