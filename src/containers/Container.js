import React from "react";
import PropTypes from "prop-types";
import Action from "../components/components/Action";
import RequestElement from "../components/components/RequestElement";
import Path from "path";

export default (Component) => {
  class Container extends React.Component {
    constructor(props) {
      super(props);

      let methodStatus = {};
      let methods = {};
      if(props.methods) {
        Object.keys(props.methods).forEach(methodName => {
          methodStatus[methodName] = {
            loading: false,
            completed: false,
            error: false,
            errorMessage: ""
          };

          methods[methodName] = (params) => this.CallMethod(methodName, props.methods[methodName], params);
        });
      }

      this.state = {
        loading: true,
        error: false,
        errorMessage: "",
        methods,
        methodStatus,
      };

      this.Content = this.Content.bind(this);
      this.Load = this.Load.bind(this);
    }

    async componentDidMount() {
      await this.Load();
    }

    async Load({params, componentParams} = {}) {
      if(!this.props.Load) {
        this.setState({loading: false});
        return;
      }

      params = params || {};
      componentParams = componentParams || {};

      this.setState({loading: true});

      try {
        await this.props.Load({props: this.props, params});

        this.setState({
          loading: false,
          error: false,
          errorMessage: "",
          ...componentParams
        });
      } catch (error) {
        /* eslint-disable no-console */
        console.error(error);
        /* eslint-enable no-console */

        this.setState({
          loading: false,
          error: true,
          errorMessage: error.statusText || error.message
        });
      }
    }

    async CallMethod(methodName, method, params) {
      this.setState({
        methodStatus: {
          ...this.state.methodStatus,
          [methodName]: {
            loading: true,
            completed: false,
            error: false,
            errorMessage: ""
          }
        }
      });

      try {
        const result = await method({props: this.props, params});

        this.setState({
          methodStatus: {
            ...this.state.methodStatus,
            [methodName]: {
              loading: false,
              completed: true,
              error: false,
              errorMessage: ""
            }
          }
        });

        return result;
      } catch (error) {
        /* eslint-disable no-console */
        console.error(error);
        /* eslint-enable no-console */

        this.setState({
          methodStatus: {
            ...this.state.methodStatus,
            [methodName]: {
              loading: false,
              completed: false,
              error: true,
              errorMessage: error.statusText || error.message
            }
          }
        });
      }
    }

    Content() {
      return (
        <Component
          {...this.props}
          {...this.state}
          Load={this.Load}
          LoadComponent={this.LoadComponent}
          Submit={this.Submit}
          Delete={this.Delete}
        />
      );
    }

    render() {
      if (this.state.error) {
        return (
          <div className="error-page">
            <div>There was a problem loading this page:</div>
            <div className="error-message">{this.state.errorMessage}</div>
            <div className="actions-container">
              <RequestElement loading={this.state.loading} loadingIcon="rotate">
                <Action type="link" to={Path.dirname(this.props.match.url)} className="action-wide secondary">Back</Action>
                <Action className="action-wide" onClick={this.Load}>Try Again</Action>
              </RequestElement>
            </div>
          </div>
        );
      }

      return <RequestElement fullPage={true} loading={this.state.loading} render={this.Content} />;
    }
  }

  Container.propTypes = {
    Load: PropTypes.func,
    LoadComponent: PropTypes.objectOf(PropTypes.func),
    Submit: PropTypes.func,
    Delete: PropTypes.func
  };

  return Container;
};