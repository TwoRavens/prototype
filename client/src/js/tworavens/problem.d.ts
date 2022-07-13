export function getSelectedProblem(): Problem;
export function getAbstractPipeline(problem: Problem, all?: boolean): Object[];


interface Problem {
    problemId: string, // Unique indicator for the problem
    name: string,
    provenanceId?: string, // Unique indicator for the problem this was sourced from
    modelingMode: string, // "predict" or "causal"
    system: ('auto'|'user'|'solved'), // Indicates the state of a problem.
    unedited?: boolean, // if true, then the problem may be transiently deleted (when switching away from a temp copy of a discovered problem)
    groups: VariableGroup[], // groups in the force diagram, typically includes predictors and targets
    description: string,
    metric: string, // Primary metric to fit against
    metrics: string[], // Secondary metrics to evaluate, but not fit against
    task: object, // d3mTaskType
    subTask: object, //d3mTaskSubtype,
    supervision: object, //d3mSupervision,
    resourceTypes: object[], //d3mResourceType[],
    d3mTags: object, //d3mTags,
    splitOptions: SplitOptions,
    scoreOptions: ScoreOptions,
    searchOptions: SearchOptions,
    meaningful: boolean,
    manipulations: Object[],
    tags: ProblemTags,
    timeGranularity: TimeGranularity,
    pebbleLinks: Object[], // small black arrows represented in the force diagram
    orderingName?: string, // explicit name to give to the ordering variable
    results?: ProblemResults,
}


interface VariableGroup {
    description: string,
    id: string|number,
    name: string,
    nodes: string[], // list of predictor names
    color: string,
    opacity: string,
}

interface SplitOptions {
    outOfSampleSplit: boolean,
    trainTestRatio: number,
    stratified: boolean,
    shuffle: boolean,
    randomSeed?: number,
    splitsFile?: string,
    splitsDir?: string,
    maxRecordCount: number,
}

interface SearchOptions {
    timeBoundSearch: number,
    timeBoundRun: number,
    priority: number,
    solutionsLimit: number,
}

interface ScoreOptions {
    userSpecified: boolean,
    evaluationMethod: string,
    folds?: number,
    trainTestRatio: number,
    stratified: boolean,
    shuffle: boolean,
    randomSeed?: number,
    splitsFile?: string,
}

interface ProblemTags {
    categorical: string[],
    ordinal: string[],
    crossSection: string[],
    geographic: string[],
    boundary: string[],
    ordering: string[],
    weights: string[],
    indexes: string[],
    privileged: string[],
    exogenous: string[],
    transformed: string[],
    loose: string[],
}

interface TimeGranularity {
    value: number,
    units: string,
}

interface ProblemResults {
    solutions: any,
    selectedSource: Object,
    selectedSolutions: Object,
    solverState: Object,
}