import {
  ConnectorTypesQuery,
  KafkasQuery,
  UserProvidedServiceAccount,
} from '@apis/api';
import {
  CreationWizardMachineInterpreterFromType,
  creationWizardMachine,
} from '@app/machines/CreateConnectorWizard.machine';
import {
  usePagination,
  PaginatedApiActorType,
  PaginatedApiRequest,
} from '@app/machines/PaginatedResponse.machine';
import { BasicMachineActorRef } from '@app/machines/StepBasic.machine';
import { ClustersMachineActorRef } from '@app/machines/StepClusters.machine';
import {
  ConnectorConfiguratorResponse,
  configuratorLoaderMachine,
} from '@app/machines/StepConfiguratorLoader.machine';
import { ConnectorTypesMachineActorRef } from '@app/machines/StepConnectorTypes.machine';
import { ErrorHandlingMachineActorRef } from '@app/machines/StepErrorHandling.machine';
import { KafkaMachineActorRef } from '@app/machines/StepKafkas.machine';
import { ReviewMachineActorRef } from '@app/machines/StepReview.machine';
import { PAGINATED_MACHINE_ID } from '@constants/constants';
import React, {
  createContext,
  FunctionComponent,
  useCallback,
  useContext,
} from 'react';

import { useInterpret, useSelector } from '@xstate/react';
import { ActorRef } from 'xstate';

import {
  ConnectorCluster,
  ConnectorType,
  ObjectReference,
} from '@rhoas/connector-management-sdk';
import { KafkaRequest } from '@rhoas/kafka-management-sdk';

export type EmittedFrom<T> = T extends ActorRef<any, infer TEmitted>
  ? TEmitted
  : never;

const CreateConnectorWizardMachineService =
  createContext<CreationWizardMachineInterpreterFromType | null>(null);

type CreateConnectorWizardProviderProps = {
  accessToken: () => Promise<string>;
  connectorsApiBasePath: string;
  fetchConfigurator: (
    connector: ConnectorType
  ) => Promise<ConnectorConfiguratorResponse>;
  onSave: () => void;
};

export const CreateConnectorWizardProvider: FunctionComponent<CreateConnectorWizardProviderProps> =
  ({
    children,
    accessToken,
    connectorsApiBasePath,
    fetchConfigurator,
    onSave,
  }) => {
    const makeConfiguratorLoaderMachine = useCallback(
      () =>
        configuratorLoaderMachine.withConfig({
          services: {
            fetchConfigurator: (context) =>
              fetchConfigurator(context.connector),
          },
        }),
      [fetchConfigurator]
    );
    const service = useInterpret(creationWizardMachine, {
      devTools: true,
      context: {
        accessToken,
        connectorsApiBasePath,
        onSave,
      },
      services: {
        makeConfiguratorLoaderMachine,
      },
    });
    return (
      <CreateConnectorWizardMachineService.Provider value={service}>
        {children}
      </CreateConnectorWizardMachineService.Provider>
    );
  };

export const useCreateConnectorWizardService = () => {
  const service = useContext(CreateConnectorWizardMachineService);
  if (!service) {
    throw new Error(
      `useCreationWizardMachineService() must be used in a child of <CreationWizardMachineProvider>`
    );
  }
  return service;
};

export const useCreateConnectorWizard = (): {
  connectorTypeRef: ConnectorTypesMachineActorRef;
  kafkaRef: KafkaMachineActorRef;
  clusterRef: ClustersMachineActorRef;
  basicRef: BasicMachineActorRef;
  errorRef: ErrorHandlingMachineActorRef;
  reviewRef: ReviewMachineActorRef;
} => {
  const service = useCreateConnectorWizardService();
  return useSelector(
    service,
    useCallback(
      (state: EmittedFrom<typeof service>) => ({
        connectorTypeRef: state.children
          .selectConnectorRef as ConnectorTypesMachineActorRef,
        kafkaRef: state.children.selectKafkaInstanceRef as KafkaMachineActorRef,
        clusterRef: state.children.selectClusterRef as ClustersMachineActorRef,
        basicRef: state.children.basicRef as BasicMachineActorRef,
        errorRef: state.children.errorRef as ErrorHandlingMachineActorRef,
        reviewRef: state.children.reviewRef as ReviewMachineActorRef,
      }),
      []
    )
  );
};

export const useClustersMachineIsReady = () => {
  const { clusterRef } = useCreateConnectorWizard();
  return useSelector(
    clusterRef,
    useCallback(
      (state: EmittedFrom<typeof clusterRef>) => {
        return state.matches({ root: { api: 'ready' } });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },
      [clusterRef]
    )
  );
};

export const useClustersMachine = () => {
  const { clusterRef } = useCreateConnectorWizard();
  const api = usePagination<ConnectorCluster, {}, ConnectorCluster>(
    clusterRef.getSnapshot()?.children[
      PAGINATED_MACHINE_ID
    ] as PaginatedApiActorType<ConnectorCluster, {}, ConnectorCluster>
  );
  const { selectedId } = useSelector(
    clusterRef,
    useCallback(
      (state: EmittedFrom<typeof clusterRef>) => ({
        selectedId: state.context.selectedCluster?.id,
      }),
      []
    )
  );
  const onSelect = useCallback(
    (selectedCluster: string) => {
      clusterRef.send({ type: 'selectCluster', selectedCluster });
    },
    [clusterRef]
  );
  const onQuery = useCallback(
    (request: PaginatedApiRequest<{}>) => {
      clusterRef.send({ type: 'api.query', ...request });
    },
    [clusterRef]
  );
  return {
    ...api,
    selectedId,
    onSelect,
    onQuery,
  };
};

export const useConnectorTypesMachineIsReady = () => {
  const { connectorTypeRef } = useCreateConnectorWizard();
  return useSelector(
    connectorTypeRef,
    useCallback(
      (state: EmittedFrom<typeof connectorTypeRef>) => {
        return state.matches({ root: { api: 'ready' } });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [connectorTypeRef]
    )
  );
};

export const useConnectorTypesMachine = () => {
  const { connectorTypeRef } = useCreateConnectorWizard();
  const api = usePagination<ConnectorType, ConnectorTypesQuery, ConnectorType>(
    connectorTypeRef.getSnapshot()?.children[
      PAGINATED_MACHINE_ID
    ] as PaginatedApiActorType<
      ConnectorType,
      ConnectorTypesQuery,
      ConnectorType
    >
  );
  const { selectedId } = useSelector(
    connectorTypeRef,
    useCallback(
      (state: EmittedFrom<typeof connectorTypeRef>) => ({
        selectedId: (state.context.selectedConnector as ObjectReference)?.id,
      }),
      []
    )
  );
  const onSelect = useCallback(
    (selectedConnector: string) => {
      connectorTypeRef.send({ type: 'selectConnector', selectedConnector });
    },
    [connectorTypeRef]
  );
  const onQuery = useCallback(
    (request: PaginatedApiRequest<ConnectorTypesQuery>) => {
      connectorTypeRef.send({ type: 'api.query', ...request });
    },
    [connectorTypeRef]
  );
  return {
    ...api,
    selectedId,
    onSelect,
    onQuery,
  };
};

export const useKafkasMachineIsReady = () => {
  const { kafkaRef } = useCreateConnectorWizard();
  return useSelector(
    kafkaRef,
    useCallback(
      (state: EmittedFrom<typeof kafkaRef>) => {
        return state.matches({ root: { api: 'ready' } });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [kafkaRef]
    )
  );
};

export const useKafkasMachine = () => {
  const { kafkaRef } = useCreateConnectorWizard();
  const api = usePagination<KafkaRequest, KafkasQuery, KafkaRequest>(
    kafkaRef.getSnapshot()?.children[
      PAGINATED_MACHINE_ID
    ] as PaginatedApiActorType<KafkaRequest, KafkasQuery, KafkaRequest>
  );
  const { selectedId } = useSelector(
    kafkaRef,
    useCallback(
      (state: EmittedFrom<typeof kafkaRef>) => ({
        selectedId: state.context.selectedInstance?.id,
      }),
      []
    )
  );
  const onSelect = useCallback(
    (selectedInstance: string) => {
      kafkaRef.send({ type: 'selectInstance', selectedInstance });
    },
    [kafkaRef]
  );
  const onQuery = useCallback(
    (request: PaginatedApiRequest<KafkasQuery>) => {
      kafkaRef.send({ type: 'api.query', ...request });
    },
    [kafkaRef]
  );
  return {
    ...api,
    selectedId,
    onSelect,
    onQuery,
  };
};

export const useBasicMachine = () => {
  const { basicRef } = useCreateConnectorWizard();
  const { name, serviceAccount } = useSelector(
    basicRef,
    useCallback(
      (state: EmittedFrom<typeof basicRef>) => ({
        name: state.context.name,
        serviceAccount: state.context.userServiceAccount,
      }),
      []
    )
  );
  const onSetName = useCallback(
    (name: string) => {
      basicRef.send({ type: 'setName', name });
    },
    [basicRef]
  );

  const onSetServiceAccount = useCallback(
    (serviceAccount: UserProvidedServiceAccount | undefined) => {
      basicRef.send({ type: 'setServiceAccount', serviceAccount });
    },
    [basicRef]
  );
  return {
    serviceAccount,
    name,
    onSetName,
    onSetServiceAccount,
  };
};

export const useReviewMachine = () => {
  const { reviewRef } = useCreateConnectorWizard();
  const {
    kafka,
    cluster,
    connectorType,
    topic,
    userErrorHandler,
    name,
    userServiceAccount,
    configString,
    isSaving,
    savingError,
  } = useSelector(
    reviewRef,
    useCallback(
      (state: EmittedFrom<typeof reviewRef>) => ({
        kafka: state.context.kafka,
        cluster: state.context.cluster,
        connectorType: state.context.connectorType,
        name: state.context.name,
        userServiceAccount: state.context.userServiceAccount,
        topic: state.context.topic,
        userErrorHandler: state.context.userErrorHandler,
        configString: state.context.configString,
        isSaving: state.hasTag('saving'),
        savingError: state.context.savingError,
      }),
      []
    )
  );

  return {
    kafka,
    cluster,
    connectorType,
    topic,
    userErrorHandler,
    name,
    userServiceAccount,
    configString,
    isSaving,
    savingError,
  };
};

export const useErrorHandlingMachine = () => {
  const { errorRef } = useCreateConnectorWizard();

  const { connector, topic, errorHandler } = useSelector(
    errorRef,
    useCallback(
      (state: EmittedFrom<typeof errorRef>) => ({
        topic: state.context.topic,
        errorHandler: state.context.userErrorHandler,
        connector: state.context.connector,
      }),
      []
    )
  );

  const onSetTopic = useCallback(
    (topic: string) => {
      errorRef.send({ type: 'setTopic', topic });
    },
    [errorRef]
  );

  const onSetErrorHandler = useCallback(
    (errorHandler: string) => {
      errorRef.send({ type: 'setErrorHandler', errorHandler });
    },
    [errorRef]
  );

  return {
    errorHandler,
    topic,
    onSetErrorHandler,
    onSetTopic,
    connector,
  };
};
