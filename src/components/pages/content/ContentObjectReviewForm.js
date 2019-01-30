import React from "react";
import Path from "path";
import RequestPage from "../RequestPage";
import RequestForm from "../../forms/RequestForm";
import {ReviewContentObject} from "../../../actions/Content";
import RadioSelect from "../../components/RadioSelect";
import AppFrame from "../../components/AppFrame";
import Fabric from "../../../clients/Fabric";
import Redirect from "react-router/es/Redirect";
import Action from "../../components/Action";

class ContentObjectReviewForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryId: this.props.libraryId || this.props.match.params.libraryId,
      objectId: this.props.match.params.objectId,
      approve: "no",
      note: ""
    };

    this.PageContent = this.PageContent.bind(this);
    this.FormContent = this.FormContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.RequestComplete = this.RequestComplete.bind(this);
    this.FrameCompleted = this.FrameCompleted.bind(this);
  }

  // Load existing content object on edit
  componentDidMount() {
    this.setState({
      loadRequestId: this.props.WrapRequest({
        todo: async () => {
          await this.props.GetContentObject({
            libraryId: this.state.libraryId,
            objectId: this.state.objectId
          });
        }
      })
    });
  }

  RequestComplete() {
    const object = this.props.objects[this.state.objectId];
    const reviewAppUrl = object.reviewAppUrl || (object.typeInfo && object.typeInfo.reviewAppUrl);
    this.setState({
      object,
      reviewAppUrl
    });
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  HandleSubmit() {
    this.setState({
      submitRequestId: this.props.WrapRequest({
        todo: async () => {
          await ReviewContentObject({
            libraryId: this.state.libraryId,
            objectId: this.state.objectId,
            approve: this.state.approve === "yes",
            note: this.state.note
          });
        }
      })
    });
  }

  FormContent() {
    return (
      <div className="form-content">
        <RadioSelect
          name="approve"
          label="Approve"
          options={[["Yes", "yes"], ["No", "no"]]}
          selected={this.state.approve}
          onChange={this.HandleInputChange}
        />
        <div className="labelled-input">
          <label className="textarea-label" htmlFor="note">Note</label>
          <textarea name="note" value={this.state.note} onChange={this.HandleInputChange} />
        </div>
      </div>
    );
  }

  FrameCompleted() {
    this.setState({completed: true});
  }

  ReviewAppFrame(legend) {
    const queryParams = {
      contentSpaceId: Fabric.contentSpaceId,
      libraryId: this.state.libraryId,
      objectId: this.state.objectId,
      type: this.state.object.type,
      action: "review"
    };

    return (
      <form>
        <fieldset>
          <legend>{legend}</legend>
          <AppFrame
            appUrl={this.state.reviewAppUrl}
            queryParams={queryParams}
            onComplete={this.FrameCompleted}
            onCancel={this.FrameCompleted}
          />
          <div className="actions-container">
            <Action className="secondary" onClick={this.FrameCompleted}>Cancel</Action>
          </div>
        </fieldset>
      </form>
    );
  }

  PageContent() {
    if(!this.state.object) { return null; }

    if(this.state.completed) {
      return <Redirect push to={Path.dirname(this.props.match.url)} />;
    }

    const legend = `Review "${this.state.object.name}"`;


    if(this.state.reviewAppUrl) {
      return this.ReviewAppFrame(legend);
    } else {
      return (
        <RequestForm
          requests={this.props.requests}
          requestId={this.state.submitRequestId}
          legend={legend}
          formContent={this.FormContent()}
          redirectPath={Path.dirname(this.props.match.url)}
          cancelPath={Path.dirname(this.props.match.url)}
          OnSubmit={this.HandleSubmit}
        />
      );
    }
  }

  render() {
    return (
      <RequestPage
        requestId={this.state.loadRequestId}
        requests={this.props.requests}
        pageContent={this.PageContent}
        OnRequestComplete={this.RequestComplete}
      />
    );
  }
}

export default ContentObjectReviewForm;
