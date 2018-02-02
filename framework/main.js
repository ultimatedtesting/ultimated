import './dependenciesManager';
import CommunicationManger from './communicationManager';
import ParallelExecutionManager from './parallelExecutionManager';

export default (afterAllCallback) => {
    console.log('Starting up...');

    CommunicationManger.updateTestSuitesList();
    ParallelExecutionManager.init(afterAllCallback);
}