import React from "react";
import PropTypes from "prop-types";

class RadioSelect extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      firstOptionRef: React.createRef()
    };

    this.HandleLabelClick = this.HandleLabelClick.bind(this);
  }

  componentDidMount() {
    // If attribute is required but not initialized, set value to first option by 'clicking' it
    if(["", undefined, null].includes(this.props.selected) && this.props.required && this.state.firstOptionRef.current) {
      this.state.firstOptionRef.current.click();
    }
  }

  // Set name and value for label click event
  HandleLabelClick(event) {
    event.target.name = this.props.name;
    event.target.value = event.target.attributes.value.value;
    this.props.onChange(event);
  }

  RadioOption(option, index) {
    const optionLabel = option[0];
    const optionValue = option[1];

    return (
      <div className="radio-option" key={"radio-select-" + this.props.name + "-" + optionValue }>
        <label className="radio-option-label" htmlFor={this.props.name} onClick={this.HandleLabelClick}>
          { optionLabel }
        </label>
        <input
          ref={index === 0 ? this.state.firstOptionRef : undefined}
          type="radio"
          name={this.props.name}
          value={optionValue}
          onChange={(event) => {
            // Inject original value into event - radio buttons turn everything to strings
            event = {...event, target: {...event.target, value: optionValue}};
            this.props.onChange(event);
          }}
          checked={optionValue === this.props.selected}
        />
      </div>
    );
  }

  render() {
    return (
      <div className="labelled-input">
        <label className="radio-label" htmlFor={this.props.name}>{this.props.label}</label>
        <div className="radio-options">
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
