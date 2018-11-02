import React from "react";
import { ElvClient } from "elv-client-js";

class IFrameBase extends React.Component {
  SandboxPermissions() {
    return [
      "allow-scripts",
      "allow-forms",
      "allow-modals",
      "allow-pointer-lock",
    ].join(" ");
  }

  shouldComponentUpdate() { return false; }

  componentDidMount() {
    this.props.AddListener(this.props.appRef.current);
  }

  render() {
    return (
      <iframe
        ref={this.props.appRef}
        src={this.props.appUrl}
        sandbox={this.SandboxPermissions()}
        className={this.props.className}
      />
    );
  }
}

const IFrame = React.forwardRef(
  (props, appRef) => <IFrameBase appRef={appRef} {...props} />
);

class AppFrame extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      appRef: React.createRef()
    };

    this.AddListener = this.AddListener.bind(this);
  }

  // Add a message listener after the frame has mounted
  AddListener(frame) {
    if(!frame) { throw Error("Frame not present"); }

    const client = new ElvClient({
      hostname: "localhost",
      port: 8008,
      useHTTPS: false,
      ethHostname: "localhost",
      ethPort: 7545,
      ethUseHTTPS: false
    });

    let wallet = client.GenerateWallet();
    let signer = wallet.AddAccount({
      accountName: "Alice",
      privateKey: "04832aec82a6572d9a5782c4af9d7d88b0eb89116349ee484e96b97daeab5ca6"
    });

    window.addEventListener("message", async function(event) {
      const responseMessage = await client.CallFromFrameMessage(event.data, signer);

      if (responseMessage) {
        frame.contentWindow.postMessage(
          responseMessage,
          "*"
        );
      }
    });
  }

  render() {
    if(!this.props.encodedApp) { return null; }

    const appBlob = new Blob([decodeURI(this.props.encodedApp)], {
      type: "text/html"
    });

    const appUrl = window.URL.createObjectURL(appBlob);

    return (
      <IFrame
        ref={this.state.appRef}
        appUrl={appUrl}
        AddListener={this.AddListener}
        className={this.props.className}
      />
    );
  }
}

export default AppFrame;
