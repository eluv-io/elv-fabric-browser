import React from "react";
import Path from "path";
import {Action, Form, IconButton} from "elv-components-js";
import AsyncComponent from "../../components/AsyncComponent";
import DeleteIcon from "../../../static/icons/trash.svg";
import {inject, observer} from "mobx-react";

@inject("libraryStore")
@inject("typeStore")
@observer
class ContentLibraryTypesForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTypeIds: [],
      selectedTypeId: ""
    };

    this.PageContent = this.PageContent.bind(this);
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
    await this.props.libraryStore.UpdateContentLibraryTypes({
      libraryId: this.props.libraryStore.libraryId,
      typeIds: this.state.selectedTypeIds
    });
  }

  AvailableTypes() {
    return Object.values(this.props.typeStore.allTypes)
      .filter(type => !this.state.selectedTypeIds.includes(type.id))
      .sort((a, b) => (a.name || `zzz${a.hash}`).toLowerCase() < (b.name || `zzz${b.hash}`).toLowerCase() ? -1 : 1);
  }

  TypeSelector() {
    const typeOptions = this.AvailableTypes().map(type => {
      const typeName = type.name || type.id;

      return <option name="selectedTypeId" key={type.id} value={type.id}>{typeName}</option>;
    });

    const disabled = typeOptions.length === 0;

    return (
      <div className="inline-inputs">
        <select
          name="selectedTypeId"
          value={this.state.selectedTypeId}
          onChange={this.HandleInputChange}
          disabled={disabled}
        >
          { typeOptions }
        </select>
        <Action
          className="action-compact"
          onClick={this.HandleAddType}
          disabled={disabled}
        >
          Add
        </Action>
      </div>
    );
  }

  SelectedTypes() {
    if(this.state.selectedTypeIds.length === 0) { return null; }

    return this.state.selectedTypeIds.map(typeId => {
      const type = Object.values(this.props.typeStore.allTypes).find(type => type.id === typeId);

      return (
        <div className="list-item" key={"added-type-" + type.id}>
          <span>{type.name || type.id}</span>
          <IconButton
            icon={DeleteIcon}
            onClick={() => this.HandleRemoveType(type.id)}
          />
        </div>
      );
    });
  }

  PageContent() {
    return (
      <div>
        <div className="actions-container manage-actions">
          <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
        </div>
        <Form
          legend={"Manage Library Types"}
          redirectPath={Path.dirname(this.props.match.url)}
          cancelPath={Path.dirname(this.props.match.url)}
          OnSubmit={this.HandleSubmit}
          className="small-form"
        >
          <div className="form-content">
            <label htmlFor={"typeId"}>Content Types</label>
            { this.TypeSelector() }

            <label />
            <div className="list bordered-list">
              { this.SelectedTypes() }
            </div>
          </div>
        </Form>
      </div>
    );
  }

  render() {
    return (
      <AsyncComponent
        Load={
          async () => {
            await this.props.libraryStore.ContentLibrary({
              libraryId: this.props.libraryStore.libraryId
            });

            await this.props.typeStore.ContentTypes();

            this.setState({
              selectedTypeId: Object.keys(this.props.typeStore.allTypes)[0],
              selectedTypeIds: Object.values(this.props.libraryStore.library.types).map(type => type.id)
            });
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default ContentLibraryTypesForm;
