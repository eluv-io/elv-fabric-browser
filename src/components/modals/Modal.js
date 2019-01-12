import React from "react";
import PropTypes from "prop-types";

class Modal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      outsideContainerRef: React.createRef()
    };

    this.HandleClickOutside = this.HandleClickOutside.bind(this);
    this.HandleEscapeKey = this.HandleEscapeKey.bind(this);
  }

  componentDidMount() {
    document.addEventListener("mousedown", this.HandleClickOutside);
    document.addEventListener("keyup", this.HandleEscapeKey);

    // Automatically focus on first input of modal
    const firstInput = document.querySelector(".modal-content input");
    if(firstInput) { firstInput.focus(); }
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.HandleClickOutside);
    document.addEventListener("keyup", this.HandleEscapeKey);
  }

  HandleClickOutside(event) {
    if(!this.props.closable) { return; }

    if (this.state.outsideContainerRef.current && !this.state.outsideContainerRef.current.contains(event.target)) {
      this.props.OnClickOutside();
    }
  }

  HandleEscapeKey(event) {
    if(event.keyCode === 27) {
      this.props.OnClickOutside();
    }
  }

  render() {
    return (
      <div className="modal">
        <div className="modal-content" ref={this.state.outsideContainerRef}>
          <div className="modal-error">{this.props.errorMessage}</div>
          { this.props.modalContent }
        </div>
      </div>
    );
  }
}

Modal.propTypes = {
  modalContent: PropTypes.node.isRequired,
  OnClickOutside: PropTypes.func.isRequired,
  closable: PropTypes.bool, // Allow caller to prevent closing of modal
  errorMessage: PropTypes.string
};

export default Modal;
