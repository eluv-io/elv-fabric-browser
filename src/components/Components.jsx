import ComponentStyles from "@/assets/stylesheets/modules/components.module.scss";

import {forwardRef, useState} from "react";
import {Link} from "wouter";
import {CreateModuleClassMatcher, JoinClassNames} from "@/utils/Helpers";
import {observer} from "mobx-react";
import {Loader} from "@mantine/core";
import ImageIcon from "@/components/ImageIcon";

import CopyIcon from "@/assets/icons/copy.svg";

const S = CreateModuleClassMatcher(ComponentStyles);

export const Linkish = forwardRef(function Linkish({
  to,
  href,
  target="_blank",
  rel="noopener",
  onClick,
  disabled,
  divButton=false,
  ...props
}, ref) {
  if(!disabled && (href || to)) {
    // a tags don't have :disabled
    if(href) {
      return <a href={href} target={target} rel={rel} onClick={onClick} ref={ref} {...props} />;
    } else if(to) {
      return <Link href={to} onClick={onClick} ref={ref} {...props} />;
    }
  } else if(onClick || props.type === "submit") {
    if(divButton) {
      return <div role="button" tabIndex={0} aria-disabled={disabled} onClick={!disabled ? onClick : undefined} ref={ref} {...props} />;
    } else {
      return <button disabled={disabled} onClick={onClick} ref={ref} {...props} />;
    }
  } else if(disabled) {
    return <button disabled ref={ref} {...props} />;
  } else {
    return <div ref={ref} {...props} />;
  }
});

export const Button = observer(({onClick, loading, variant="primary", size="md", className="", children, ...props}) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Linkish
      {...props}
      onClick={async event => {
        if(isLoading) { return; }

        const loadingTimeout = setTimeout(() => setIsLoading(true), 100);

        try {
          await onClick(event);
        } finally {
          clearTimeout(loadingTimeout);
          setIsLoading(false);
        }
      }}
      className={JoinClassNames(
        S(
          "button",
          `button--${variant || "primary"}`,
          `button--size-${size || "md"}`,
          loading || isLoading ? "button--loading" : ""
        ),
        className
      )}
    >
      <div className={S("button__children")}>
        {children}
      </div>
      <Loader
        color={
          variant === "primary" ? "white" :
            variant === "outline" ? "var(--color-text-highlight)" :
              "var(--color-icon)"
        }
        size="xs"
        className={S("button__loader")}
      />
    </Linkish>
  );
});

export const IconButton = observer(({icon, size="md", onClick, ...props}) => {
  return (
    <Button
      {...props}
      size={`icon-${size || "md"}`}
      variant="icon"
      onClick={onClick}
    >
      <ImageIcon icon={icon} className={S("button__icon")} />
    </Button>
  );
});

export const Copy = async (value) => {
  try {
    value = (value || "").toString();

    await navigator.clipboard.writeText(value);
  } catch(error) {
    console.error(error);

    const input = document.createElement("input");

    input.value = value;
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand("copy");
  }
};

export const CopyButton = ({value, size="md", className="", ...props}) => {
  const [copied, setCopied] = useState(false);

  return (
    <IconButton
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();

        if(copied) { return; }

        Copy(value);

        setCopied(true);
        setTimeout(() => setCopied(false), 600);
      }}
      icon={CopyIcon}
      title="Copy to Clipboard"
      size={size}
      className={JoinClassNames(S("copy-button", copied ? "copy-button--copied" : ""), className)}
      {...props}
    />
  );
};

export const CopyableField = ({children, value, className="", ...props}) => {
  const [copied, setCopied] = useState(false);

  return (
    <div
      {...props}
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();

        if(copied) { return; }

        Copy(value);

        setCopied(true);
        setTimeout(() => setCopied(false), 600);
      }}
      className={JoinClassNames(S("copyable-field", copied ? "copyable-field--copied" : ""), className)}
    >
      <span>{children}</span>
      <ImageIcon icon={CopyIcon} className={S("copyable-field__icon")}/>
    </div>
  );
};


export const PageHeader = observer(({header, subHeader}) => {
  return (
    <div className={S("page-header")}>
      <h3 className={S("page-header__header")}>
        { header }
      </h3>

      {
        !subHeader ? null :
          <h3 className={S("page-header__subheader")}>{subHeader}</h3>
      }
    </div>
  );
});
