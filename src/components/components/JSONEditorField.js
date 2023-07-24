import React, {useEffect, useRef, useState} from "react";
import JSONEditor from "jsoneditor";
import "jsoneditor/dist/jsoneditor.min.css";
import "../../static/ace-themes/eluvio-theme";

const JSONEditorField = ({json, OnChange}) => {
  const ref = useRef(json);
  const [errorMessage, setErrorMessage] = useState("");
  let jsonEditor;

  useEffect(() => {
    const options = {
      mode: "code",
      minLines: 5,
      maxLines: 100,
      onChangeText: () => {
        try {
          jsonEditor.get();
          OnChange(jsonEditor.get());
        } catch(error) {
          // Invalid JSON. Don't print to console so as not to clog with errors on each keystroke
        }
      },
      mainMenuBar: false,
      onValidationError: errors => {
        if(
          !errors ||
          !Array.isArray(errors) ||
          errors.length < 1
        ) {
          setErrorMessage("");
        } else {
          const concatMessages = errors
            .map(error => error.message)
            .join("\n");
          setErrorMessage(concatMessages);
        }
      }
    };

    jsonEditor = new JSONEditor(ref.current, options);
    jsonEditor.set(json);
    jsonEditor.aceEditor.setTheme("ace/theme/eluvio");
    jsonEditor.aceEditor.session.foldAll();
    jsonEditor.aceEditor.session.unfold([1]);

    const lineHeight = jsonEditor.aceEditor.renderer.lineHeight;
    const containerHeight =
      jsonEditor.aceEditor.session.getScreenLength()
      * lineHeight
      + 100;
    ref.current.style.height = `${containerHeight}px`;
    jsonEditor.aceEditor.resize();

    return () => {
      if(jsonEditor) {
        jsonEditor.destroy();
      }
    };
  }, []);

  return (
    <div>
      <div className="json-editor-container" ref={ref}></div>
      {
        errorMessage && <div className="json-editor-error-message">{errorMessage}</div>
      }
    </div>
  );
};

export default JSONEditorField;
