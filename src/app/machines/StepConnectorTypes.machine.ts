import { ConnectorTypesQuery, fetchConnectorTypes } from '@apis/api';
import { PAGINATED_MACHINE_ID } from '@constants/constants';

import { ActorRefFrom, send, sendParent } from 'xstate';
import { createModel } from 'xstate/lib/model';

import {
  ConnectorType,
  ObjectReference,
} from '@rhoas/connector-management-sdk';

import {
  ApiSuccessResponse,
  getPaginatedApiMachineEvents,
  makePaginatedApiMachine,
} from './PaginatedResponse.machine';

type Context = {
  accessToken: () => Promise<string>;
  connectorsApiBasePath: string;
  response?: ApiSuccessResponse<ConnectorType>;
  selectedConnector?: ConnectorType;
  error?: Object;
};

const model = createModel(
  {
    accessToken: () => Promise.resolve(''),
    connectorsApiBasePath: '',
    response: undefined,
    selectedConnector: undefined,
    error: undefined,
  } as Context,
  {
    events: {
      selectConnector: (payload: { selectedConnector: string }) => ({
        ...payload,
      }),
      deselectConnector: () => ({}),
      confirm: () => ({}),
      ...getPaginatedApiMachineEvents<
        ConnectorType,
        ConnectorTypesQuery,
        ConnectorType
      >(),
    },
  }
);

const success = model.assign((_context, event) => {
  const { type, ...response } = event;
  return {
    response,
  };
}, 'api.success');
const selectConnector = model.assign(
  {
    selectedConnector: (context, event) => {
      return context.response?.items?.find(
        (i) => (i as ObjectReference).id === event.selectedConnector
      );
    },
  },
  'selectConnector'
);
const reset = model.assign(
  {
    selectedConnector: undefined,
  },
  'deselectConnector'
);

export const connectorTypesMachine = model.createMachine(
  {
    context: model.initialContext,
    id: 'connectors',
    initial: 'root',
    states: {
      root: {
        type: 'parallel',
        states: {
          api: {
            initial: 'idle',
            invoke: {
              id: PAGINATED_MACHINE_ID,
              src: (context) =>
                makePaginatedApiMachine<
                  ConnectorType,
                  ConnectorTypesQuery,
                  ConnectorType
                >(fetchConnectorTypes(context), (i) => i),
            },
            states: {
              idle: {
                entry: send(
                  {
                    type: 'api.query',
                    query: { categories: ['sink', 'source'] },
                  },
                  { to: PAGINATED_MACHINE_ID }
                ),
                on: {
                  'api.ready': 'ready',
                },
              },
              ready: {},
            },
            on: {
              'api.refresh': {
                actions: send((_, e) => e, { to: PAGINATED_MACHINE_ID }),
              },
              'api.nextPage': {
                actions: send((_, e) => e, { to: PAGINATED_MACHINE_ID }),
              },
              'api.prevPage': {
                actions: send((_, e) => e, { to: PAGINATED_MACHINE_ID }),
              },
              'api.query': {
                actions: send((_, e) => e, { to: PAGINATED_MACHINE_ID }),
              },
              'api.success': { actions: success },
            },
          },
          selection: {
            id: 'selection',
            initial: 'verify',
            states: {
              verify: {
                always: [
                  { target: 'selecting', cond: 'noConnectorSelected' },
                  { target: 'valid', cond: 'connectorSelected' },
                ],
              },
              selecting: {
                entry: sendParent('isInvalid'),
                on: {
                  selectConnector: {
                    target: 'valid',
                    actions: selectConnector,
                    cond: (_, event) => event.selectedConnector !== undefined,
                  },
                },
              },
              valid: {
                entry: sendParent('isValid'),
                on: {
                  selectConnector: {
                    target: 'verify',
                    actions: selectConnector,
                  },
                  deselectConnector: {
                    target: 'verify',
                    actions: reset,
                  },
                  confirm: {
                    target: '#done',
                    cond: 'connectorSelected',
                  },
                },
              },
            },
          },
        },
      },
      done: {
        id: 'done',
        type: 'final',
        data: {
          selectedConnector: (context: Context) => context.selectedConnector,
        },
      },
    },
  },
  {
    guards: {
      connectorSelected: (context) => context.selectedConnector !== undefined,
      noConnectorSelected: (context) => context.selectedConnector === undefined,
    },
  }
);

export type ConnectorTypesMachineActorRef = ActorRefFrom<
  typeof connectorTypesMachine
>;
