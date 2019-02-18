import React from "react";
import PropTypes from "prop-types";

export const PageHeader = ({header, subHeader}) => {
  return (
    <div className="page-header-container">
      <h3 className="page-header with-subHeader">{ header }</h3>
      <h3 className="page-subheader">{subHeader}</h3>
    </div>
  );
};

PageHeader.propTypes = {
  header: PropTypes.string.isRequired,
  subHeader: PropTypes.string
};
