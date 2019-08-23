import React from "react";
import PropTypes from "prop-types";

export const PageHeader = ({header, subHeader}) => {
  if(subHeader) {
    subHeader = <h3 className="page-subheader">{subHeader}</h3>;
  }

  return (
    <div className="page-header-container">
      <h3 className="page-header with-subHeader">{ header }</h3>
      { subHeader }
    </div>
  );
};

PageHeader.propTypes = {
  header: PropTypes.string.isRequired,
  subHeader: PropTypes.string
};
