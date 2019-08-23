import UrlJoin from "url-join";

export const DownloadFromUrl = async (url, filename) => {
  let element = document.createElement("a");
  element.href = url;
  element.download = filename;

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
  window.URL.revokeObjectURL(url);
};

// Convert a FileList to file info for UploadFiles
export const FileInfo = async (path, fileList, noData=false) => {
  // If path is ".", clear it to prevent paths being composed as "./<filename>"
  path = (path === ".") ? "" : path;

  return await Promise.all(
    Array.from(fileList).map(async file => {
      const data = noData ? undefined : await new Response(file).blob();
      const filePath = file.overrideName || file.webkitRelativePath || file.name;
      return {
        path: UrlJoin(path, filePath).replace(/^\/+/g, ""),
        type: "file",
        size: file.size,
        data
      };
    })
  );
};
