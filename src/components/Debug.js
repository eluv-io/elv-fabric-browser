import React from "react";
import { connect } from "react-redux";

const mapStateToProps = state => ({
  state: state
});

const Debug = (state) => (
  <div className="debug-container" style={{overflow: "hidden"}}>
    <pre>
      { JSON.stringify(state, null, 2) }
    </pre>
  </div>
);

export default connect(
  mapStateToProps,
)(Debug);
