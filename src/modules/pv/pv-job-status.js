angular.module('pv.web')
    .directive('pvJobStatus', ['$rootScope', '$state', '$stateParams', '$templateCache', 'kw.Girder',
        function($rootScope, $state, $stateParams, $templateCache, $girder) {
        return {
            restrict: 'AE',
            template: $templateCache.get('pv/tpls/pv-job-status.html'),
            scope: {
                taskId: '=taskId',
                expectedRunningCount: '=expectedRunningCount',
                done: '=?' //optional, defaults to false
            },
            link: function(scope, element, attrs) {
                scope.statuses = {}; // formatted {[_id]: 'status', ...}
                scope.jobs = [];
                scope.done = angular.isDefined(scope.done) ? scope.done : false;

                //pass an object and a regex, get an array of keys which match the regex
                function pick(obj, regexp) {
                    return Object.keys(obj).filter(function(el) {
                        return regexp.test(el);
                    });
                }

                function count(obj, attr) {
                    var out = 0;
                    Object.keys(obj).forEach(function(key) {
                        if (obj[key] === attr) {
                            out += 1;
                        }
                    });
                    return out;
                }

                function updateJobsList(taskId, callback) {
                    // console.log('task :: ', tasskId);
                    $girder.getTaskWithId(taskId)
                        .then(function(res) {
                            scope.jobs = [];
                            pick(res.data.output, /_job$/)
                                .forEach(function(el) {
                                    scope.jobs.push(res.data.output[el]);
                                    if (!scope.statuses.hasOwnProperty(res.data.output[el]._id)){
                                        scope.statuses[res.data.output[el]._id] = 'created';
                                    }
                                });
                            if (callback) {
                                callback();
                            }
                        }, function(err) {
                            console.log('error getting task id', err.data.message);
                        });
                }

                //fetch the task incase there are any new jobs, update jobs scope.statuses
                scope.$on('job.status', function(event, data) {
                    function cb() {
                        scope.statuses[data._id] = data.status;
                        //if all the jobs are running, we're done here.
                        if (count(scope.statuses, 'running') === scope.expectedRunningCount) {
                            scope.done = true;
                            $rootScope.$broadcast('job-status-done');
                        } else if (data.status === 'error') {
                            alert('job has errored');
                            $state.go('project', {
                                collectionName: $stateParams.collectionName,
                                projectID: $stateParams.projectID
                            });
                        }
                    }
                    updateJobsList(scope.taskId, cb);
                });

                //update the jobs list it the event has the right taskId
                scope.$on('task.status', function(event, data) {
                    if (data._id === scope.taskId) {
                        updateJobsList(scope.taskId);
                    } else if (data._id === scope.taskId && (data.status === 'error' || data.status === 'failure')) {
                        alert('parent task has errored');
                        $state.go('project', {
                            collectionName: $stateParams.collectionName,
                            projectID: $stateParams.projectID
                        });
                    }
                });
            }
         };
    }]);