import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import {IconButton} from "../../components/Icons";
import DeleteIcon from "../../../static/icons/trash.svg";
import Action from "../../components/Action";
import Form from "../../forms/Form";

class ContentLibraryTypesForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryTypes: {
        ...props.library.types
      },
      selectedTypeIds: Object.values(props.library.types).map(type => type.id),
      selectedTypeId: ""
    };

    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleAddType = this.HandleAddType.bind(this);
    this.HandleRemoveType = this.HandleRemoveType.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  componentDidMount() {
    this.SetSelectedType();
  }

  SetSelectedType() {
    const nextType = this.AvailableTypes()[0];
    this.setState({
      selectedTypeId: nextType && nextType.id
    });
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleAddType() {
    this.setState({
      selectedTypeIds: this.state.selectedTypeIds.concat([this.state.selectedTypeId]),
    }, this.SetSelectedType);
  }

  HandleRemoveType(typeId) {
    this.setState({
      selectedTypeIds: this.state.selectedTypeIds.filter(id => id !== typeId)
    }, this.SetSelectedType);
  }

  async HandleSubmit() {
    await this.props.methods.Submit({
      libraryId: this.props.libraryId,
      typeIds: this.state.selectedTypeIds
    });
  }

  AvailableTypes() {
    return Object.values(this.props.types)
      .filter(type => !this.state.selectedTypeIds.includes(type.id));
  }

  TypeSelector() {
    const typeOptions = this.AvailableTypes().map(type => {
      const typeName = type.meta.name || type.id;

      return <option name="selectedTypeId" key={type.id} value={type.id}>{typeName}</option>;
    });

    const disabled = typeOptions.length === 0;

    return (
      <div className="labelled-input">
        <label htmlFor={"typeId"}>Content Types</label>
        <div className="inline-input">
          <select
            name="selectedTypeId"
            value={this.state.selectedTypeId}
            onChange={this.HandleInputChange}
            disabled={disabled}
          >
            { typeOptions }
          </select>
          <div className="actions-container compact">
            <Action
              className="action-compact"
              onClick={this.HandleAddType}
              disabled={disabled}
            >
              Add
            </Action>
          </div>
        </div>
      </div>
    );
  }

  SelectedTypes() {
    if(this.state.selectedTypeIds.length === 0) { return null; }

    const selectedTypes = this.state.selectedTypeIds.map(typeId => {
      const type = Object.values(this.props.types).find(type => type.id === typeId);

      return (
        <div className="list-item" key={"added-type-" + type.id}>
          <span>{type.meta.name || type.id}</span>
          <IconButton
            src={DeleteIcon}
            onClick={() => this.HandleRemoveType(type.id)}
          />
        </div>
      );
    });

    return (
      <div className="labelled-input">
        <label />
        <div className="list bordered-list">
          { selectedTypes }
        </div>
      </div>
    );
  }

  FormContent() {
    if(!this.state.libraryTypes) { return null; }

    return (
      <div>
        { this.TypeSelector() }
        { this.SelectedTypes() }
      </div>
    );
  }

  render() {
    return (
      <Form
        legend={"Manage Library groups"}
        formContent={this.FormContent()}
        redirectPath={Path.dirname(this.props.match.url)}
        cancelPath={Path.dirname(this.props.match.url)}
        OnSubmit={this.HandleSubmit}
        submitting={this.props.methodStatus.Submit.loading}
        redirect={this.props.methodStatus.Submit.completed}
      />
    );
  }
}

ContentLibraryTypesForm.propTypes = {
  libraryId: PropTypes.string.isRequired,
  library: PropTypes.object.isRequired,
  types: PropTypes.object.isRequired,
  methods: PropTypes.shape({
    Submit: PropTypes.func.isRequired
  })
};

export default ContentLibraryTypesForm;
