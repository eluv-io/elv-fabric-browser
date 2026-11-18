import React from "react";
import SVG from "react-inlinesvg";

const ImageIcon = ({
  icon,
  alternateIcon,
  title,
  label,
  useLoadingIndicator=false,
  className,
  ...props
}) => {
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  label = label || title;

  className = "image-icon " + (className || "");

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
    className = loading && useLoadingIndicator ? "image-icon-with-loader " + className : className;

    return (
      <img
        title={title}
        alt={label}
        className={className}
        src={currentIcon}
        onLoad={() => setLoading(false)}
        onError={handleError}
        {...props}
      />
    );
  }
};

export default ImageIcon;
