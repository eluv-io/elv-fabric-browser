const ActionTypes = {
  request: {
    request: {
      status: {
        submitted: "REQUEST_SUBMITTED",
        completed: "REQUEST_COMPLETED",
        error: "REQUEST_ERROR"
      }
    },
    accessGroups: {
      completed: {
        list: "COMPLETED_LIST_ACCESS_GROUPS"
      }
    },
    accounts: {
      completed: {
        list: {
          currentAccountAddress: "COMPLETED_GET_CURRENT_ACCOUNT_ADDRESS",
        }
      }
    },
    content: {
      completed: {
        list: {
          all: "COMPLETED_LIST_ALL_CONTENT",
          library: "COMPLETED_LIST_CONTENT_LIBRARY",
          contentObject: "COMPLETED_LIST_CONTENT_OBJECT",
          contentObjectEvents: "COMPLETED_LIST_CONTENT_OBJECT_EVENTS"
        },
        create: {
          library: "COMPLETED_CREATE_CONTENT_LIBRARY"
        },
        contract: {
          call: "COMPLETED_CALL_LIBRARY_CONTRACT"
        }
      }
    },
    contentTypes: {
      completed: {
        list: {
          all: "COMPLETED_LIST_CONTENT_TYPES",
          contentType: "COMPLETED_LIST_CONTENT_TYPE"
        }
      }
    },
    contracts: {
      completed: {
        list: "COMPLETED_LIST_CONTRACTS",
        compile: "COMPLETED_CONTRACT_COMPILATION",
        deploy: "COMPLETED_CONTRACT_DEPLOYMENT"
      },
      error: {
        compile: "ERROR_CONTRACT_COMPILATION"
      }
    }
  },
  notifications: {
    error: {
      set: "SET_ERROR_MESSAGE",
    },
    notification: {
      set: "SET_NOTIFICATION_MESSAGE"
    },
    clear: "CLEAR_NOTIFICATIONS"
  }
};

export default ActionTypes;
