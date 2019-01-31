import InlineSVG from "svg-inline-react";
import React from "react";

export const CroppedIcon = ({containerClassname, className, title, icon}) => {
  return (
    <div className={containerClassname || ""}>
      <div className="cropped-icon">
        <ImageIcon icon={icon} title={title} className={className} />
      </div>
    </div>
  );
};

export const ImageIcon = ({ className, title, icon }) => {
  if(icon.startsWith("<svg")) {
    return (
      <InlineSVG title={title} className={"icon card-icon " + className || ""} src={icon}/>
    );
  } else {
    return (
      <img title={title} className={"icon card-icon " + className || ""} src={icon} />
    );
  }
};

export const Icon = ({src, title, className=""}) => {
  return <InlineSVG className={"icon dark " + className} title={title} src={src} />;
};

export const IconButton = ({src, title, onClick}) => {
  return (
    <button className="icon-button" type="button" role="button" title={title} onClick={onClick}>
      <InlineSVG className="icon dark clickable" src={src} />
    </button>
  );
};
