import React from "react";
import RequestForm from "../../forms/RequestForm";
import RequestPage from "../RequestPage";
import Path from "path";
import {IconButton} from "../../components/Icons";
import DeleteIcon from "../../../static/icons/trash.svg";
import Action from "../../components/Action";

class ContentLibraryTypesForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      name: "",
      description: "",
      submitRequestId: undefined,
      loadRequestId: undefined,
    };

    this.PageContent = this.PageContent.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleAddType = this.HandleAddType.bind(this);
    this.HandleRemoveType = this.HandleRemoveType.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
  }

  componentDidMount() {
    this.setState({
      loadRequestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.GetContentLibrary({libraryId: this.state.libraryId});
          await this.props.ListContentTypes({});
        }
      })
    });
  }

  RequestComplete() {
    const library = this.props.libraries[this.state.libraryId];
    const contentTypes = Object.values(this.props.types);

    this.setState({
      contentTypes,
      libraryTypes: {
        ...library.types
      },
      selectedTypeIds: Object.values(library.types).map(type => type.id),
      selectedTypeId: ""
    }, this.SetSelectedType);
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

  HandleSubmit() {
    this.setState({
      submitRequestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.SetLibraryContentTypes({
            libraryId: this.state.libraryId,
            typeIds: this.state.selectedTypeIds
          });
        }
      })
    });
  }

  AvailableTypes() {
    return this.state.contentTypes
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
      const type = this.state.contentTypes.find(type => type.id === typeId);
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

  PageContent() {
    return (
      <RequestForm
        requests={this.props.requests}
        requestId={this.state.submitRequestId}
        legend={"Manage Library groups"}
        formContent={this.FormContent()}
        redirectPath={Path.dirname(this.props.match.url)}
        cancelPath={Path.dirname(this.props.match.url)}
        OnSubmit={this.HandleSubmit}
      />
    );
  }

  render() {
    if (this.state.createForm) {
      return this.PageContent();
    } else {
      return (
        <RequestPage
          requests={this.props.requests}
          requestId={this.state.loadRequestId}
          pageContent={this.PageContent}
          OnRequestComplete={this.RequestComplete}
        />
      );
    }
  }
}

export default ContentLibraryTypesForm;
