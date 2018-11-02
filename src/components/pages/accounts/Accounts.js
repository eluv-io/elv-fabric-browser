import React from "react";
import { Link } from "react-router-dom";
import Path from "path";
import { LibraryCard } from "../../components/DisplayCards";

import AccountIcon from "../../../static/icons/accounts.svg";
import RequestPage from "../RequestPage";

class Accounts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.setState({
      requestId: this.props.ListAccounts()
    });
  }

  Accounts() {
    return (
      <div className="page-container accounts-page-container">
        <div className="actions-container">
          <Link to={Path.join(this.props.match.url, "create")} className="action" >New Account</Link>
        </div>

        <div className="card-container wide-card-container accounts-container">
          {Object.keys(this.props.accounts).map((address) => {
            return(
              <LibraryCard
                libraryId={address}
                key={"account-card" + address}
                link={"/accounts"}
                icon={AccountIcon}
                name={address}
                description=""
              />
            );
          })}
        </div>
      </div>
    );
  }

  render() {
    return (
      <RequestPage
        pageContent={this.Accounts()}
        requestId={this.state.requestId}
        requests={this.props.requests}
      />
    );
  }
}

export default Accounts;
