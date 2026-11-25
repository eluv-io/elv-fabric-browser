import ComponentStyles from "@/assets/stylesheets/modules/components.module.scss";

import CodeMirror, {EditorView} from "@uiw/react-codemirror";
import {githubLight} from "@uiw/codemirror-theme-github";
import {linter} from "@codemirror/lint";
import {json, jsonParseLinter} from "@codemirror/lang-json";
import {observer} from "mobx-react";
import {InputWrapper} from "@mantine/core";
import {CreateModuleClassMatcher} from "@/utils/Helpers";
import {useState} from "react";

const S = CreateModuleClassMatcher(ComponentStyles);

const JSONEditField = observer(({value, onChange, w, h, componentProps={}, ...props}) => {
  const [error, setError] = useState(undefined);

  return (
    <InputWrapper
      w={w}
      error={error}
      {...props}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={githubLight}
        onBlur={() => {
          try {
            JSON.parse(value);
            setError(undefined);
          } catch(error) {
            setError(error.toString());
          }
        }}
        extensions={[
          EditorView.editable.of(true),
          EditorView.lineWrapping,
          json(),
          linter(jsonParseLinter())
        ]}
        width={w ? `${w}px` : undefined}
        height={h ? `${h}px` : undefined}
        {...componentProps}
        className={S("json-edit-field")}
      />
    </InputWrapper>
  );
});

export default JSONEditField;
