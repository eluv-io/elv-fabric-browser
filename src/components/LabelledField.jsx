import {CopyableField} from "@/components/Components";

export const LabelledField = ({
  label,
  value,
  children,
  copyValue,
  editable=false,
  type="input",
  onChange,
  alignTop=false,
  wideLabel=false,
  hidden=false,
  className=""
}) => {
  if(typeof label === "string" && label.length > 0) {
    label = label + ":";
  }

  const labelClass = (wideLabel ? "wide" : "");

  let content = <div aria-label={label} title={value}>{ children || value }</div>;
  if(copyValue) {
    content = <CopyableField value={copyValue}>{ content }</CopyableField>;
  } else if(editable) {
    throw Error("editable not implemented");
  }

  return (
    <div className={"labelled-field " + className + (hidden ? " hidden" : "") + (alignTop || type === "textarea" ? "align-top" : "")}>
      <label htmlFor={label} className={labelClass}>{ label }</label>
      { content }
    </div>
  );
};
