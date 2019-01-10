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
