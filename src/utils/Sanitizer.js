class Sanitizer {
  static enforce_one(char, string){
    let first = string.indexOf(char) + 1;

    if(first === 0){ return string; }

    return string.substr(0, first) + string.slice(first).replace(char, "");
  }

  static enforce_first(char, string){
    if(string.length === 0){ return string; }

    return string.substr(0, 1) + string.slice(1).replace(char, "");
  }

  static s(value, type){
    switch(type.toLowerCase()){
      case("integer"):
        return value.toString().replace(/[^0-9]/gi,"");
      case("float"):
        return (
          this.enforce_first("-",
            this.enforce_one("-",
              this.enforce_one(".",
                value.toString().replace(/[^0-9\-\.]/gi,"")
              )
            )
          )
        );
      case("boolean"):
        return value === true || value === "true";
      default:
        return value;
    }
  }
}

export default Sanitizer;