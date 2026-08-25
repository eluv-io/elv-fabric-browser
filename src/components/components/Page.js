import React from "react";
import PropTypes from "prop-types";
import {Link} from "react-router-dom";

export const PageHeader = ({header, subHeader, id, idLink}) => {
  if(subHeader) {
    subHeader = <h3 className="page-subheader">{subHeader}</h3>;
  }

  let idElement = null;
  if (id) {
    idElement = idLink ?
      <Link className="page-header-id" to={idLink}>{ id }</Link> :
      <div className="page-header-id">{ id }</div>;
  }

  return (
    <div className="page-header-container">
      <h3 className="page-header with-subHeader">{ header }</h3>
      { idElement }
      { subHeader }
    </div>
  );
};

PageHeader.propTypes = {
  header: PropTypes.string.isRequired,
  subHeader: PropTypes.string,
  id: PropTypes.string,
  idLink: PropTypes.string
};
