String.prototype.capitalize =
    function() {
      return this.replace(/_/g, " ").replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    };