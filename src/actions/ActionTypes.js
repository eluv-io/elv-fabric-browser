const ActionTypes = {
  accessGroups: {
    list: "LIST_ACCESS_GROUPS",
    get: "GET_ACCESS_GROUP",
    members: {
      list: "LIST_ACCESS_GROUP_MEMBERS"
    }
  },
  content: {
    libraries: {
      list: "LIST_LIBRARIES",
      get: "GET_LIBRARY",
      groups: "GET_LIBRARY_GROUPS",
      groupPermissions: "GET_LIBRARY_GROUP_PERMISSIONS",
      types: "GET_LIBRARY_TYPES",
      invalidateListingCache: "INVALIDATE_LISTING_CACHE"
    },
    objects: {
      list: "LIST_OBJECTS",
      get: "GET_OBJECTS",
      versions: "GET_OBJECT_VERSIONS",
      version: "GET_OBJECT_VERSION",
      permissions: "GET_OBJECT_PERMISSIONS",
    },
    types: {
      get: "GET_TYPE",
      list: "LIST_TYPES",
      all: "ALL_TYPES"
    }
  },
  contracts: {
    list: "LIST_CONTRACTS",
    compile: "COMPILE_CONTRACTS",
    deployed: {
      list: "LIST_DEPLOYED_CONTRACTS",
      balance: "GET_CONTRACT_BALANCE",
      events: "GET_CONTRACT_EVENTS",
      clearEvents: "CLEAR_CONTRACT_EVENTS",
      call: "CALL_CONTRACT_METHOD",
    },
    error: {
      compile: "ERROR_CONTRACT_COMPILATION"
    }
  },
  logs: {
    clear: "CLEAR_BLOCKCHAIN_LOGS",
    list: "LIST_BLOCKCHAIN_LOGS"
  },
  notifications: {
    error: "SET_ERROR_MESSAGE",
    notification: "SET_NOTIFICATION_MESSAGE",
    clear: "CLEAR_NOTIFICATIONS"
  },
  requests: {
    status: {
      submitted: "REQUEST_SUBMITTED",
      completed: "REQUEST_COMPLETED",
      error: "REQUEST_ERROR"
    }
  },
  routes: {
    path: "ROUTING_FRAME_PATH",
    synchronize: "START_ROUTE_SYNCHRONIZATION"
  }
};

export default ActionTypes;
