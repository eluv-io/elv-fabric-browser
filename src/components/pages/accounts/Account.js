import React from "react";
import RequestPage from "../RequestPage";
import Link from "react-router-dom/es/Link";
import Path from "path";
import InlineSVG from "svg-inline-react";

import DefaultUserImage from "../../../static/icons/accounts.svg";
import ContentObject from "../../../models/ContentObject";

import { LabelledField } from "../../components/LabelledField";

class Account extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      accountAddress: this.props.match.params.accountAddress
    };
  }

  componentDidMount() {
    let requestId = this.props.GetAccountInfo({
      accountAddress: this.state.accountAddress
    });

    this.setState({
      requestId: requestId
    });
  }

  AccountActions() {
    // Only allow owner to edit their profile
    if(!this.props.currentAccount || (this.state.accountAddress !== this.props.currentAccount.accountAddress)) {
      return null;
    }

    return (
      <div className="actions-container">
        <Link className="action" to={Path.join("/accounts", this.state.accountAddress, "edit")}>
          Edit Account
        </Link>
      </div>
    );
  }

  AccountImage(accountInfo) {
    const imageUrl = accountInfo.Image("profileImageHash");

    if(imageUrl) {
      return <img className="account-image" src={imageUrl} />;
    } else {
      return <InlineSVG className="account-image icon dark" src={DefaultUserImage} />;
    }
  }

  AccountInfo() {
    let accountInfo = this.props.accountInfo[this.state.accountAddress];

    if(!accountInfo) {
      accountInfo = new ContentObject({});
    }

    return (
      <div className="page-container account-page-container">
        { this.AccountActions() }

        <div className="label-box">
          <LabelledField label="Profile Image" value={this.AccountImage(accountInfo)} />
          <LabelledField label="Name" value={accountInfo.metadata.name} />
          <LabelledField label="Balance" value={accountInfo.accountBalance} />
          <LabelledField label="Transactions" value={accountInfo.accountTransactionCount} />
          <LabelledField label="Bio" value={accountInfo.metadata.bio} />
        </div>
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.AccountInfo()}
        requestId={this.state.requestId}
        requests={this.props.requests}
      />
    );
  }
}

export default Account;
