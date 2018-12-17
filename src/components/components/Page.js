import React from "react";
import PropTypes from "prop-types";

export const PageHeader = ({header, subHeader}) => {
  const subHeaderElement = subHeader ? <h3 className="page-subheader">{ subHeader }</h3> : null;

  return (
    <div className="page-header-container">
      <h3 className="page-header with-subHeader">{ header }</h3>
      { subHeaderElement }
    </div>
  );
};

PageHeader.propTypes = {
  header: PropTypes.string.isRequired,
  subHeader: PropTypes.string
};
