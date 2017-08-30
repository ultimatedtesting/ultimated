import './dependenciesManager';
import CommunicationManger from './communicationManager';
import ParallelExecutionManager from './parallelExecutionManager';

console.log('Starting up...');
CommunicationManger.updateTestSuitesList();
ParallelExecutionManager.init();