import ComponentStyles from "@/assets/stylesheets/modules/components.module.scss";

import React from "react";
import {observer} from "mobx-react";
import {Loader} from "@mantine/core";
import {CreateModuleClassMatcher} from "@/utils/Helpers";

const S = CreateModuleClassMatcher(ComponentStyles);

class AsyncComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true
    };
  }

  async componentDidMount() {
    this.mounted = true;

    // Wait a bit to avoid react mount-unmount bounce
    await new Promise(resolve => setTimeout(resolve, 50));
    if(!this.mounted) {
      return;
    }

    this.setState({
      loading: true
    });

    try {
      await this.props.Load();

      if(this.mounted) {
        this.setState({
          loading: false
        });
      }
    } catch(error) {
      this.setState({error});
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  render() {
    if(this.state.error) {
      // Throw error synchronously for ErrorHandler to catch
      throw this.state.error;
    }

    if(this.state.loading) {
      return (
        <div className={S("async-component")}>
          <Loader />
        </div>
      );
    }

    return this.props.render ? this.props.render() : this.props.children;
  }
}

export default observer(AsyncComponent);
