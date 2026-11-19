import ComponentStyles from "@/assets/stylesheets/modules/components.module.scss";

import React from "react";
import SVG from "react-inlinesvg";
import {CreateModuleClassMatcher, JoinClassNames} from "@/utils/Helpers";

const S = CreateModuleClassMatcher(ComponentStyles);

const ImageIcon = ({
  icon,
  alternateIcon,
  title,
  label,
  size,
  className="",
  ...props
}) => {
  const [error, setError] = React.useState(false);

  label = label || title;

  className = JoinClassNames(
    S(
      "image-icon",
      size ? `image-icon--size-${size}` : ""
    ),
    className
  );

  const currentIcon = error ? alternateIcon : icon;
  const handleError = error ? undefined : () => setError(true);

  if(!currentIcon) {
    return null;
  }

  if(currentIcon.startsWith("<svg") || currentIcon.startsWith("data:image/svg+xml")) {
    return (
      <SVG alt={label} title={title} className={className} src={currentIcon} {...props} />
    );
  } else {

    return (
      <img
        title={title}
        alt={label}
        className={className}
        src={currentIcon}
        onError={handleError}
        {...props}
      />
    );
  }
};

export default ImageIcon;
