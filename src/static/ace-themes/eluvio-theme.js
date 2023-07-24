/* eslint-disable no-unused-vars */
window.ace.define("ace/theme/eluvio", ["require", "exports", "module", "ace/lib/dom"], (acequire, exports, module) => {
  exports.isDark = false;
  exports.cssClass = "ace-eluvio";
  exports.cssText = `
  .ace-eluvio .ace_gutter {
  background: #e8e8e8;
  color: #AAA;
}

.ace-eluvio  {
  background: #fff;
  color: #000;
}

.ace-eluvio .ace_keyword {
  font-weight: bold;
}

.ace-eluvio .ace_string {
  color: rgba(155, 81, 224, 1);
}

.ace-eluvio .ace_variable.ace_class {
  color: teal;
}

.ace-eluvio .ace_constant.ace_numeric {
  color: rgba(45, 156, 219, 1);
}

.ace-eluvio .ace_constant.ace_buildin {
  color: #0086B3;
}

.ace-eluvio .ace_support.ace_function {
  color: #0086B3;
}

.ace-eluvio .ace_comment {
  color: #998;
  font-style: italic;
}

.ace-eluvio .ace_variable.ace_language  {
  color: #0086B3;
}

.ace-eluvio .ace_paren {
  font-weight: bold;
}

.ace-eluvio .ace_boolean {
  font-weight: bold;
}

.ace-eluvio .ace_string.ace_regexp {
  color: #009926;
  font-weight: normal;
}

.ace-eluvio .ace_variable.ace_instance {
  color: teal;
}

.ace-eluvio .ace_constant.ace_language {
  font-weight: bold;
}

.ace-eluvio .ace_cursor {
  color: black;
}

.ace-eluvio.ace_focus .ace_marker-layer .ace_active-line {
  background: rgb(255, 255, 204);
}
.ace-eluvio .ace_marker-layer .ace_active-line {
  background: rgb(245, 245, 245);
}

.ace-eluvio .ace_marker-layer .ace_selection {
  background: rgb(181, 213, 255);
}

.ace-eluvio.ace_multiselect .ace_selection.ace_start {
  box-shadow: 0 0 3px 0px white;
}
/* bold keywords cause cursor issues for some fonts */
/* this disables bold style for editor and keeps for static highlighter */
.ace-eluvio.ace_nobold .ace_line > span {
  font-weight: normal !important;
}

.ace-eluvio .ace_marker-layer .ace_step {
  background: rgb(252, 255, 0);
}

.ace-eluvio .ace_marker-layer .ace_stack {
  background: rgb(164, 229, 101);
}

.ace-eluvio .ace_marker-layer .ace_bracket {
  margin: -1px 0 0 -1px;
  border: 1px solid rgb(192, 192, 192);
}

.ace-eluvio .ace_gutter-active-line {
  background-color : rgba(0, 0, 0, 0.07);
}

.ace-eluvio .ace_marker-layer .ace_selected-word {
  background: rgb(250, 250, 255);
  border: 1px solid rgb(200, 200, 250);
}

.ace-eluvio .ace_invisible {
  color: #BFBFBF
}

.ace-eluvio .ace_print-margin {
  width: 1px;
  background: #e8e8e8;
}

.ace-eluvio .ace_indent-guide {
  background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==") right repeat-y;
}

.ace-eluvio .ace_indent-guide-active {
  background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAZSURBVHjaYvj///9/hivKyv8BAAAA//8DACLqBhbvk+/eAAAAAElFTkSuQmCC") right repeat-y;
}`;
  const dom = acequire("../lib/dom");
  dom.importCssString(exports.cssText, exports.cssClass, false);
});
