import CommonStyles from "@/assets/stylesheets/modules/common.module.scss";

import {observer} from "mobx-react";
import {notificationStore} from "@/stores/index";
import {IconButton} from "@/components/Components";

import CloseIcon from "@/assets/icons/x.svg";
import {CreateModuleClassMatcher} from "@/utils/Helpers";
import {useEffect, useState} from "react";

const S = CreateModuleClassMatcher(CommonStyles);

const clearDuration = 5;
let fadeTimeout, closeTimeout;

const Notifications = observer(() => {
  const [closing, setClosing] = useState(false);
  const [message, setMessage] = useState(undefined);
  const [error, setError] = useState(undefined);

  // Automatically clear messages after a few seconds, but not errors
  useEffect(() => {
    clearTimeout(fadeTimeout);

    if(!notificationStore.notification) { return; }

    fadeTimeout = setTimeout(() => {
      notificationStore.ClearMessage();
    }, clearDuration * 1000);
  }, [notificationStore.notification]);

  // Delay clearing message so we can fade out
  useEffect(() => {
    clearTimeout(closeTimeout);

    if(notificationStore.notification || notificationStore.error) {
      setClosing(false);
      setMessage(notificationStore.notification);
      setError(notificationStore.error);
      return;
    }

    setClosing(true);
    closeTimeout = setTimeout(() => {
      setClosing(false);
      setMessage(undefined);
      setError(undefined);
    }, 750);
  }, [notificationStore.notification, notificationStore.error]);

  if(!message && !error) {
    return null;
  }

  return (
    <div
      className={
        S(
          "notification",
          closing ? "notification--closing" : "",
          error ? "notification--error" : "notification--message"
        )
      }
    >
      <div className={S("notification__message")}>
        {error || message}
      </div>
      <IconButton
        title="Close"
        icon={CloseIcon}
        size="sm"
        onClick={() => notificationStore.ClearMessage()}
        className={S("notification__clear")}
      />
    </div>
  );
});

export default Notifications;
