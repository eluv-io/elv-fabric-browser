import React from "react";
import PropTypes from "prop-types";

class RadioSelect extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      firstOptionRef: React.createRef()
    };

    this.HandleClick = this.HandleClick.bind(this);
  }

  componentDidMount() {
    // If attribute is required but not initialized, set value to first option by 'clicking' it
    if(["", undefined, null].includes(this.props.selected) && this.props.required && this.state.firstOptionRef.current) {
      this.state.firstOptionRef.current.click();
    }
  }

  // Set name and value for label click event
  HandleClick(event, value) {
    this.props.onChange({target: {name: this.props.name, value}});
  }

  RadioOption(option, index) {
    const optionLabel = option[0];
    const optionValue = option[1];

    const label =
      <label className="radio-option-label" htmlFor={this.props.name} onClick={(event) => this.HandleClick(event, optionValue)}>
        { optionLabel }
      </label>;

    const input =
      <input
        ref={index === 0 ? this.state.firstOptionRef : undefined}
        type="radio"
        name={this.props.name}
        value={optionValue}
        onChange={(event) => this.HandleClick(event, optionValue)}
        checked={optionValue === this.props.selected}
      />;

    if(this.props.inline) {
      return (
        <div className="radio-option inline" key={"radio-select-" + this.props.name + "-" + optionValue }>
          {input}
          {label}
        </div>
      );
    } else {
      return (
        <div className="radio-option" key={"radio-select-" + this.props.name + "-" + optionValue }>
          { label }
          { input }
        </div>
      );
    }
  }

  render() {
    return (
      <div className="labelled-input">
        <label className="radio-label" htmlFor={this.props.name}>{this.props.label}</label>
        <div className={`radio-options ${this.props.inline ? "inline": ""}`}>
          { this.props.options.map((option, index) => this.RadioOption(option, index)) }
        </div>
      </div>
    );
  }
}

const allowedOptionTypes = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number,
  PropTypes.bool,
]);

// Options is a list of label+name pairs
RadioSelect.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  inline: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.arrayOf(
      allowedOptionTypes
    )
  ).isRequired,
  selected: allowedOptionTypes,
  required: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
};

export default RadioSelect;
