import MantineStyles from "@/assets/stylesheets/modules/mantine.module.scss";

import {modals} from "@mantine/modals";
import {Button} from "@/components/Components";
import {CreateModuleClassMatcher} from "@/utils/Helpers";

const S = CreateModuleClassMatcher(MantineStyles);

export const ConfirmModal = ({context, id, innerProps={}}) => {
  return (
    <div className={S("confirm-modal")}>
      <div className={S("confirm-modal__text")}>
        { innerProps.message }
      </div>
      <div className={S("confirm-modal__actions")}>
        <Button
          variant="outline"
          onClick={async () => {
            await innerProps.onCancel?.();
            context.closeModal(id);
          }}
        >
          { innerProps.labels?.cancel || "Cancel" }
        </Button>
        <Button
          onClick={async () => {
            await innerProps.onConfirm?.();
            context.closeModal(id);
          }}
        >
          { innerProps.labels?.confirm || "Confirm" }
        </Button>
      </div>
    </div>
  );
};

export const Confirm = async ({title, message, labels={}, onCancel, onConfirm}) => {
  let confirming = false;

  return new Promise(resolve => {
    modals.openContextModal({
      modal: "confirm",
      centered: true,
      title,
      closable: false,
      withCloseButton: false,
      onClose: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));

        if(confirming) { return; }

        await onCancel?.();
        resolve(false);
      },
      innerProps: {
        message,
        labels: {
          confirm: labels.confirm || "Confirm",
          cancel: labels.cancel || "Cancel"
        },
        onCancel: async () => {
          await onCancel?.();
          resolve(false);
        },
        onConfirm: async () => {
          try {
            confirming = true;
            await onConfirm?.();
            resolve(true);
          } catch(error) {
            console.error(error);
            resolve(false);
          } finally {
            confirming = false;
          }
        }
      }
    });
  });
};
