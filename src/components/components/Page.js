import React from "react";
import PropTypes from "prop-types";
import ClippedText from "./ClippedText";

export const PageHeader = ({header, subHeader}) => {
  const subHeaderElement = subHeader ? <ClippedText text={subHeader} className="page-subheader" /> : undefined;

  return (
    <div className="page-header-container">
      <h3 className="page-header with-subHeader">{ header }</h3>
      {subHeaderElement}
    </div>
  );
};

PageHeader.propTypes = {
  header: PropTypes.string.isRequired,
  subHeader: PropTypes.string
};
