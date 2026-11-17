import {useState, useEffect} from "react";

const ImageIcon = ({icon, alternateIcon, label, useLoadingIndicator=false, className, ...props}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  className = "-elv-icon " + (className || "");

  const currentIcon = error ? alternateIcon : icon;
  const handleError = error ? undefined : () => setError(true);

  if(!currentIcon) { return null; }

  if(currentIcon.startsWith("<svg")) {
    return (
      <SVG alt={label} className={className} src={currentIcon} {...props} />
    );
  } else {
    className = loading && useLoadingIndicator ? "-elv-icon-with-loader " + className : className;

    return (
      <img
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
