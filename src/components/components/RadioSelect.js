import React from "react";
import PropTypes from "prop-types";

class RadioSelect extends React.Component {
  constructor(props) {
    super(props);

    this.HandleLabelClick = this.HandleLabelClick.bind(this);
  }

  // Set name and value for label click event
  HandleLabelClick(event) {
    event.target.name = this.props.name;
    event.target.value = event.target.attributes.value.value;
    this.props.onChange(event);
  }

  RadioOption(option) {
    const optionLabel = option[0];
    const optionName = option[1];

    return (
      <div className="radio-option" key={"radio-select-" + this.props.name + "-" + optionName }>
        <label className="radio-option-label" htmlFor={this.props.name} value={optionName} onClick={this.HandleLabelClick}>
          { optionLabel }
        </label>
        <input
          type="radio"
          name={this.props.name}
          value={optionName}
          onChange={this.props.onChange}
          checked={optionName === this.props.selected}
        />
      </div>
    );
  }

  render() {
    return (
      <div className="labelled-input">
        <label htmlFor={this.props.name}>{this.props.label}</label>
        <div className="radio-options">
          { this.props.options.map(option => this.RadioOption(option, this.props.selected)) }
        </div>
      </div>
    );
  }
}

// Options is a list of label+name pairs
RadioSelect.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.string
    )
  ).isRequired,
  selected: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default RadioSelect;
