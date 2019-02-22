import React from "react";
import PropTypes from "prop-types";
import Path from "path";
import RadioSelect from "../../components/RadioSelect";
import AppFrame from "../../components/AppFrame";
import Fabric from "../../../clients/Fabric";
import Redirect from "react-router/es/Redirect";
import Action from "../../components/Action";
import Form from "../../forms/Form";

class ContentObjectReviewForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      approve: false,
      note: "",
      reviewAppUrl: props.object.reviewAppUrl || (props.object.typeInfo && props.object.typeInfo.reviewAppUrl)
    };

    this.FormContent = this.FormContent.bind(this);
    this.HandleInputChange = this.HandleInputChange.bind(this);
    this.HandleSubmit = this.HandleSubmit.bind(this);
    this.FrameCompleted = this.FrameCompleted.bind(this);
  }

  HandleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  async HandleSubmit() {
    await this.props.methods.Submit({
      libraryId: this.props.libraryId,
      objectId: this.props.objectId,
      approve: this.state.approve,
      note: this.state.note
    });
  }

  FormContent() {
    return (
      <div className="form-content">
        <RadioSelect
          name="approve"
          label="Approve"
          options={[["Yes", true], ["No", false]]}
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
      libraryId: this.props.libraryId,
      objectId: this.props.objectId,
      type: this.props.object.type,
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

  render() {
    if(this.state.completed) {
      return <Redirect push to={Path.dirname(this.props.match.url)} />;
    }

    const legend = `Review "${this.props.object.name}"`;

    if(this.state.reviewAppUrl) {
      return this.ReviewAppFrame(legend);
    } else {
      return (
        <Form
          legend={legend}
          formContent={this.FormContent()}
          redirectPath={Path.dirname(this.props.match.url)}
          cancelPath={Path.dirname(this.props.match.url)}
          status={this.props.methodStatus.Submit}
          OnSubmit={this.HandleSubmit}
        />
      );
    }
  }
}

ContentObjectReviewForm.propTypes = {
  libraryId: PropTypes.string.isRequired,
  objectId: PropTypes.string.isRequired,
  object: PropTypes.object.isRequired,
  methods: PropTypes.shape({
    Submit: PropTypes.func.isRequired
  })
};

export default ContentObjectReviewForm;
