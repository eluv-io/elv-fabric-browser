import ComponentStyles from "@/assets/stylesheets/modules/components.module.scss";

import {observer} from "mobx-react";
import {CreateModuleClassMatcher, JoinClassNames} from "@/utils/Helpers";
import {Button} from "@/components/Components";
import {useState} from "react";
import {useLocation} from "wouter";
import {Loader, Modal} from "@mantine/core";

const S = CreateModuleClassMatcher(ComponentStyles);

const Form = observer(({
  legend,
  onSubmit,
  successPath,
  cancelPath,
  className="",
  children,
  validationError,
  disabled=false,
  showTopControls=false,
  showBottomControls=true,
  loading,
  Close
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const actions = (
    <div className={S("form__actions")}>
      <Button
        disabled={submitting}
        onClick={() => Close?.()}
        to={cancelPath}
        variant="outline"
      >
        Cancel
      </Button>
      <Button
        disabled={validationError || disabled}
        loading={submitting}
        onClick={async () => {
          try {
            setSubmitting(true);
            setError("");
            const response = await onSubmit();

            if(typeof response === "boolean" && !response) {
              // Explicitly cancelled, probably confirm
              setSubmitting(false);
              return;
            }

            Close?.(true);

            if(successPath) {
              navigate(successPath);
            }
          } catch(error) {
            console.error(error);
            setSubmitting(false);
            setError(error?.formMessage || "Something went wrong");
          }
        }}
      >
        Submit
      </Button>
    </div>
  );

  return (
    <form
      autoComplete="off"
      onSubmit={event => event.preventDefault()}
      className={JoinClassNames(S("form"), className)}
    >
      <fieldset>
        {
          !legend && !showTopControls ? null :
            <legend className={S("page-header", "form__legend")}>
              <div className={S("page-header__header")}>
                {legend || ""}
              </div>
              {
                !showTopControls ? null :
                  actions
              }
            </legend>
        }
        <div key={`form-content-${loading}`} className={S("form__content")}>
          {
            loading ?
              <Loader className={S("form__loader")} /> :
              children
          }
        </div>
        <div className={S("form__error")}>{validationError || error || ""}</div>
        {
          !showBottomControls ? null :
            actions
        }
      </fieldset>
    </form>
  );
});

export const FormModal = observer(({modalProps, ...formProps}) => {
  return (
    <Modal
      size={600}
      withCloseButton={false}
      onClose={formProps.Close}
      {...modalProps}
      title={formProps.legend}
    >
      <Form {...formProps} legend={undefined}/>
    </Modal>
  );
});

export default Form;
