String.prototype.capitalize =
    function() {
      return this.replace(/_/g, " ").replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    };

String.prototype.toHash =
  function() {
    return this.split("").reduce((prevHash, currVal) =>
      (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
  };
