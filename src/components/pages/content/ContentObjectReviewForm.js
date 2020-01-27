import React from "react";
import Path from "path";
import {Action, Form, RadioSelect} from "elv-components-js";
import AsyncComponent from "../../components/AsyncComponent";
import AppFrame from "../../components/AppFrame";
import Fabric from "../../../clients/Fabric";
import {Redirect} from "react-router";
import {inject, observer} from "mobx-react";

@inject("objectStore")
@observer
class ContentObjectReviewForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      approve: true,
      note: ""
    };

    this.PageContent = this.PageContent.bind(this);
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
    await this.props.objectStore.ReviewContentObject({
      libraryId: this.props.objectStore.libraryId,
      objectId: this.props.objectStore.objectId,
      approve: this.state.approve,
      note: this.state.note
    });
  }

  FrameCompleted() {
    this.setState({completed: true});
  }

  ReviewAppFrame(legend) {
    const queryParams = {
      contentSpaceId: Fabric.contentSpaceId,
      libraryId: this.props.objectStore.libraryId,
      objectId: this.props.objectStore.objectId,
      type: this.props.objectStore.object.type,
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
    if(this.state.completed) {
      return <Redirect push to={Path.dirname(this.props.match.url)} />;
    }

    const legend = `Review "${this.props.objectStore.object.name}"`;

    if(this.state.reviewAppUrl) {
      return this.ReviewAppFrame(legend);
    } else {
      return (
        <div>
          <div className="actions-container manage-actions">
            <Action type="link" to={Path.dirname(this.props.match.url)} className="secondary">Back</Action>
          </div>
          <Form
            legend={legend}
            redirectPath={Path.dirname(this.props.match.url)}
            cancelPath={Path.dirname(this.props.match.url)}
            OnSubmit={this.HandleSubmit}
          >
            <div className="form-content">
              <label htmlFor="approve">Approval</label>
              <RadioSelect
                name="approve"
                inline={true}
                options={[["Approve", true], ["Reject", false]]}
                selected={this.state.approve}
                onChange={this.HandleInputChange}
              />

              <label className="align-top" htmlFor="note">Note</label>
              <textarea name="note" value={this.state.note} onChange={this.HandleInputChange} />
            </div>
          </Form>
        </div>
      );
    }
  }

  render() {
    return (
      <AsyncComponent
        Load={
          async () => {
            await this.props.objectStore.ContentObject({
              libraryId: this.props.objectStore.libraryId,
              objectId: this.props.objectStore.objectId
            });

            this.setState({
              reviewAppUrl: this.props.objectStore.object.reviewAppUrl ||
                (this.props.objectStore.object.typeInfo && this.props.objectStore.object.typeInfo.reviewAppUrl)
            });
          }
        }
        render={this.PageContent}
      />
    );
  }
}

export default ContentObjectReviewForm;
