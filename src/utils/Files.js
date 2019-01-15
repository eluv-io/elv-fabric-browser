import Path from "path";

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
  return await Promise.all(
    Array.from(fileList).map(async file => {
      const data = noData ? undefined : await new Response(file).blob();
      return {
        path: Path.join(path, file.webkitRelativePath || file.name).replace(/^\/+/g, ""),
        type: "file",
        size: file.size,
        data
      };
    })
  );
};
