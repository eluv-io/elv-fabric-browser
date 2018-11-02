import React from "react";
import { Link } from "react-router-dom";
import Path from "path";
import { ThreeCard } from "../../components/DisplayCards";

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
              <ThreeCard
                key={"account-card" + address}
                link={"/accounts"}
                icon={AccountIcon}
                name={address}
                description={"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."}
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
